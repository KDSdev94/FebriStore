import { db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { productService } from "./productService";

// Helper function to remove undefined values from object
const cleanObjectData = (obj) => {
  if (obj === undefined) return null; // Convert undefined to null for Firestore
  if (obj === null) return null;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(cleanObjectData);

  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      const cleanedValue = cleanObjectData(value);
      cleaned[key] = cleanedValue;
    }
  }
  return cleaned;
};

export const orderService = {
  // Create new order
  async createOrder(orderData) {
    try {
      const orderRef = collection(db, "orders");

      // Clean the order data to remove undefined values
      const cleanedOrderData = cleanObjectData(orderData);

      // Set different status for COD vs Transfer
      const isCOD = cleanedOrderData.paymentMethod === "cod";

      const newOrder = {
        ...cleanedOrderData,
        status: isCOD ? "cod_confirmed" : "pending",
        paymentStatus: isCOD ? "cod_pending" : "pending",
        adminVerificationStatus: isCOD ? "not_required" : "pending",
        sellerTransferStatus: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log(
        "Creating order with cleaned data:",
        JSON.stringify(newOrder, null, 2)
      );

      const docRef = await addDoc(orderRef, newOrder);
      return {
        success: true,
        orderId: docRef.id,
        order: { ...newOrder, id: docRef.id },
      };
    } catch (error) {
      console.error("Error creating order:", error);
      return {
        success: false,
        error: "Gagal membuat pesanan",
      };
    }
  },

  // Get orders by seller - Optimized version
  async getOrdersBySeller(sellerId) {
    try {
      console.log("Getting orders for seller:", sellerId);
      const startTime = Date.now();

      // Use a more efficient query - get orders that have items from this seller
      // We'll use a compound query to filter orders more efficiently
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

      const snapshot = await getDocs(q);
      console.log(
        `Fetched ${snapshot.docs.length} total orders in ${
          Date.now() - startTime
        }ms`
      );

      const orders = [];
      const userCache = new Map(); // Cache user data to avoid repeated queries
      const productCache = new Map(); // Cache product data to avoid repeated queries

      for (const orderDoc of snapshot.docs) {
        const orderData = { id: orderDoc.id, ...orderDoc.data() };

        // Filter orders that contain items from this seller
        const sellerItems =
          orderData.items?.filter(
            (item) => item.sellerId === sellerId || item.storeId === sellerId
          ) || [];

        if (sellerItems.length === 0) continue; // Skip if no items from this seller

        // Get buyer information with caching
        let buyerInfo = {
          name:
            orderData.userName || orderData.customerName || "Unknown Customer",
          email: orderData.userEmail || orderData.customerEmail || "No email",
          phone:
            orderData.userPhone ||
            orderData.customerPhone ||
            orderData.shippingAddress?.phone ||
            "",
          avatar: null,
          profileImage: null,
        };

        // Try to get more complete user data from users collection with caching
        if (orderData.userId) {
          try {
            let buyerData = userCache.get(orderData.userId);
            if (!buyerData) {
              const buyerRef = doc(db, "users", orderData.userId);
              const buyerSnap = await getDoc(buyerRef);
              if (buyerSnap.exists()) {
                buyerData = buyerSnap.data();
                userCache.set(orderData.userId, buyerData);
              }
            }

            if (buyerData) {
              buyerInfo = {
                name: buyerData.name || buyerData.fullName || buyerInfo.name,
                email: buyerData.email || buyerInfo.email,
                phone: buyerData.phone || buyerInfo.phone,
                avatar: buyerData.avatar || buyerData.profileImage || null,
                profileImage:
                  buyerData.profileImage || buyerData.avatar || null,
              };
            }
          } catch (error) {
            console.log("Error getting buyer info:", error);
          }
        }

        // Additional fallback from shipping address
        if (!buyerInfo.name || buyerInfo.name === "Unknown Customer") {
          buyerInfo.name = orderData.shippingAddress?.name || "Customer";
        }
        if (!buyerInfo.phone) {
          buyerInfo.phone = orderData.shippingAddress?.phone || "";
        }

        // Enrich seller items with cached product data
        const enrichedItems = [];
        for (const item of sellerItems) {
          try {
            let productData = productCache.get(item.productId || item.id);
            if (!productData) {
              const productRef = doc(db, "products", item.productId || item.id);
              const productSnap = await getDoc(productRef);
              if (productSnap.exists()) {
                productData = productSnap.data();
                productCache.set(item.productId || item.id, productData);
              }
            }

            if (productData) {
              enrichedItems.push({
                ...item,
                name: item.name || productData.name,
                image:
                  item.image || productData.images?.[0] || productData.imageUrl,
                images: item.images || productData.images || [],
                price: item.price || productData.price,
                category: productData.category,
                description: productData.description,
                storeName:
                  item.storeName || productData.storeName || item.sellerName,
                sellerId: item.sellerId || item.storeId || productData.sellerId,
              });
            } else {
              enrichedItems.push(item);
            }
          } catch (error) {
            console.log("Error enriching item:", error);
            enrichedItems.push(item);
          }
        }

        // Calculate seller-specific totals
        const sellerSubtotal = enrichedItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        // Format order for seller view
        const formattedOrder = {
          id: orderData.id,
          orderNumber:
            orderData.orderNumber ||
            `ORD-${orderData.id.substring(0, 8).toUpperCase()}`,
          userName: buyerInfo.name,
          userEmail: buyerInfo.email,
          userPhone: buyerInfo.phone,
          userAvatar: buyerInfo.avatar,
          userProfileImage: buyerInfo.profileImage,
          customerName: buyerInfo.name, // For backward compatibility
          customerPhone: buyerInfo.phone,
          date: orderData.createdAt?.toDate?.() || new Date(),
          status: this.mapOrderStatusForSeller(orderData),
          statusText: this.getSellerStatusText(orderData),
          totalAmount: sellerSubtotal,
          total: sellerSubtotal, // For backward compatibility
          subtotal: sellerSubtotal,
          adminFee: orderData.adminFee || 0,
          items: enrichedItems,
          itemCount: enrichedItems.length,
          shippingAddress: orderData.shippingAddress,
          trackingNumber: orderData.trackingNumber || null,
          courierWhatsApp: orderData.courierWhatsApp || null,
          courierName: orderData.courierName || null,
          paymentMethod: orderData.paymentMethod || "transfer",
          notes: orderData.notes || "",
          adminVerificationStatus:
            orderData.adminVerificationStatus || "pending",
          paymentStatus: orderData.paymentStatus || "pending",
          sellerTransferStatus: orderData.sellerTransferStatus || "pending",
          createdAt: orderData.createdAt,
          updatedAt: orderData.updatedAt,
          originalOrder: orderData,
        };

        orders.push(formattedOrder);
      }

      const totalTime = Date.now() - startTime;
      console.log(
        `Found ${orders.length} orders for seller ${sellerId} in ${totalTime}ms`
      );
      return { success: true, orders };
    } catch (error) {
      console.error("Error getting seller orders:", error);
      return {
        success: false,
        error: "Gagal mengambil data pesanan",
        orders: [],
      };
    }
  },

  // Get orders by buyer
  async getOrdersByBuyer(userId) {
    try {
      const q = query(
        collection(db, "orders"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const orders = [];

      snapshot.forEach((doc) => {
        const orderData = { id: doc.id, ...doc.data() };
        orders.push(orderData);
      });

      return { success: true, orders };
    } catch (error) {
      console.error("Error getting buyer orders:", error);
      return {
        success: false,
        error: "Gagal mengambil data pesanan",
        orders: [],
      };
    }
  },

  // Update order status
  async updateOrderStatus(orderId, newStatus, additionalData = {}) {
    try {
      const orderRef = doc(db, "orders", orderId);
      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp(),
        ...additionalData,
      };

      await updateDoc(orderRef, updateData);
      return { success: true };
    } catch (error) {
      console.error("Error updating order status:", error);
      return {
        success: false,
        error: "Gagal memperbarui status pesanan",
      };
    }
  },

  // Add tracking number
  async addTrackingNumber(orderId, trackingNumber) {
    try {
      const orderRef = doc(db, "orders", orderId);
      const updateData = {
        trackingNumber: trackingNumber,
        shippedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await updateDoc(orderRef, updateData);
      return { success: true };
    } catch (error) {
      console.error("Error adding tracking number:", error);
      return {
        success: false,
        error: "Gagal menambahkan nomor resi",
      };
    }
  },

  // Save courier WhatsApp contact and optional name
  async saveCourierWhatsApp(orderId, waNumber, courierName = null) {
    try {
      const orderRef = doc(db, "orders", orderId);
      const updateData = {
        courierWhatsApp: waNumber,
        courierName: courierName,
        updatedAt: serverTimestamp(),
      };
      await updateDoc(orderRef, updateData);
      return { success: true };
    } catch (error) {
      console.error("Error saving courier WhatsApp:", error);
      return { success: false, error: "Gagal menyimpan nomor WA kurir" };
    }
  },

  // Reduce stock when payment is confirmed
  async reduceStockOnPaymentConfirmed(orderId) {
    try {
      // Get order details
      const orderRef = doc(db, "orders", orderId);
      const orderSnap = await getDoc(orderRef);

      if (!orderSnap.exists()) {
        return { success: false, error: "Pesanan tidak ditemukan" };
      }

      const orderData = orderSnap.data();
      const batch = writeBatch(db);
      const stockReductions = [];

      // Process each item in the order
      for (const item of orderData.items) {
        try {
          // Get current product data
          const productResult = await productService.getProductById(
            item.productId
          );
          if (!productResult.success) {
            console.error(`Product ${item.productId} not found`);
            continue;
          }

          const product = productResult.product;
          let newStock;

          // Handle variant stock or main stock
          if (item.selectedVariant && product.variants) {
            // Find the variant and reduce its stock
            const updatedVariants = product.variants.map((variant) => {
              if (variant.name === item.selectedVariant.name) {
                const currentStock = variant.stock || 0;
                const newVariantStock = Math.max(
                  0,
                  currentStock - item.quantity
                );

                stockReductions.push({
                  productId: item.productId,
                  productName: item.productName,
                  variant: variant.name,
                  oldStock: currentStock,
                  newStock: newVariantStock,
                  quantity: item.quantity,
                });

                return { ...variant, stock: newVariantStock };
              }
              return variant;
            });

            // Update product with new variant stocks
            const productRef = doc(db, "products", item.productId);
            batch.update(productRef, {
              variants: updatedVariants,
              updatedAt: serverTimestamp(),
            });
          } else {
            // Reduce main product stock
            const currentStock = product.stock || 0;
            newStock = Math.max(0, currentStock - item.quantity);

            stockReductions.push({
              productId: item.productId,
              productName: item.productName,
              variant: null,
              oldStock: currentStock,
              newStock: newStock,
              quantity: item.quantity,
            });

            const productRef = doc(db, "products", item.productId);
            batch.update(productRef, {
              stock: newStock,
              sold: (product.sold || 0) + item.quantity,
              updatedAt: serverTimestamp(),
            });
          }
        } catch (error) {
          console.error(`Error processing item ${item.productId}:`, error);
        }
      }

      // Update order with stock reduction info
      batch.update(orderRef, {
        stockReduced: true,
        stockReductionAt: serverTimestamp(),
        stockReductions: stockReductions,
        updatedAt: serverTimestamp(),
      });

      // Commit all changes
      await batch.commit();

      return {
        success: true,
        message: "Stok berhasil dikurangi",
        stockReductions,
      };
    } catch (error) {
      console.error("Error reducing stock:", error);
      return {
        success: false,
        error: "Gagal mengurangi stok produk",
      };
    }
  },

  // Get order by ID
  async getOrderById(orderId) {
    try {
      const orderRef = doc(db, "orders", orderId);
      const orderSnap = await getDoc(orderRef);

      if (!orderSnap.exists()) {
        return { success: false, error: "Pesanan tidak ditemukan" };
      }

      const orderData = { id: orderSnap.id, ...orderSnap.data() };
      return { success: true, order: orderData };
    } catch (error) {
      console.error("Error getting order:", error);
      return {
        success: false,
        error: "Gagal mengambil data pesanan",
      };
    }
  },

  // Get all orders
  async getAllOrders() {
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

      const snapshot = await getDocs(q);
      const orders = [];

      // Process each order and enrich with current user data
      for (const docSnap of snapshot.docs) {
        const orderData = { id: docSnap.id, ...docSnap.data() };

        // Convert Firestore timestamp to ISO string for consistency
        if (orderData.createdAt && orderData.createdAt.toDate) {
          orderData.createdAt = orderData.createdAt.toDate().toISOString();
        }
        if (orderData.updatedAt && orderData.updatedAt.toDate) {
          orderData.updatedAt = orderData.updatedAt.toDate().toISOString();
        }

        // Enrich with current user data if userId exists
        if (orderData.userId) {
          try {
            const userRef = doc(db, "users", orderData.userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const userData = userSnap.data();
              // Update with current user data
              orderData.userName =
                userData.name ||
                userData.fullName ||
                orderData.userName ||
                "Unknown Customer";
              orderData.userEmail =
                userData.email || orderData.userEmail || "No Email";
              orderData.userPhone = userData.phone || orderData.userPhone || "";
            } else {
              console.log("User not found for userId:", orderData.userId);
              // Keep existing data or set default
              orderData.userName = orderData.userName || "Unknown Customer";
              orderData.userEmail = orderData.userEmail || "No Email";
            }
          } catch (error) {
            console.log(
              "Error getting user data for order:",
              orderData.id,
              error
            );
            // Keep existing data or set default
            orderData.userName = orderData.userName || "Unknown Customer";
            orderData.userEmail = orderData.userEmail || "No Email";
          }
        } else {
          console.log("No userId found in order:", orderData.id);
          orderData.userName = orderData.userName || "Unknown Customer";
          orderData.userEmail = orderData.userEmail || "No Email";
        }

        orders.push(orderData);
      }

      return { success: true, orders };
    } catch (error) {
      console.error("Error getting all orders:", error);
      return {
        success: false,
        error: "Gagal mengambil data pesanan",
        orders: [],
      };
    }
  },

  // Update payment proof
  async updatePaymentProof(orderId, paymentProofUri) {
    try {
      const orderRef = doc(db, "orders", orderId);
      const updateData = {
        paymentProof: paymentProofUri,
        paymentProofUploadedAt: serverTimestamp(),
        status: "pending_verification", // Change status to pending verification
        paymentStatus: "proof_uploaded", // Add payment status
        updatedAt: serverTimestamp(),
      };

      await updateDoc(orderRef, updateData);
      return { success: true };
    } catch (error) {
      console.error("Error updating payment proof:", error);
      return {
        success: false,
        error: "Gagal mengupload bukti pembayaran",
      };
    }
  },

  // Admin verify payment
  async verifyPayment(orderId, isApproved, adminNotes = "") {
    try {
      const orderRef = doc(db, "orders", orderId);
      const updateData = {
        adminVerificationStatus: isApproved ? "approved" : "rejected",
        adminVerificationAt: serverTimestamp(),
        adminNotes: adminNotes,
        updatedAt: serverTimestamp(),
      };

      if (isApproved) {
        updateData.status = "payment_confirmed";
        updateData.paymentStatus = "confirmed";
        updateData.paymentConfirmedAt = serverTimestamp();
        updateData.sellerTransferStatus = "pending"; // ensure admin can proceed to transfer to seller
      } else {
        updateData.status = "pending_payment";
        updateData.paymentStatus = "rejected";
      }

      await updateDoc(orderRef, updateData);

      // If approved, reduce stock
      if (isApproved) {
        await this.reduceStockOnPaymentConfirmed(orderId);
      }

      return { success: true };
    } catch (error) {
      console.error("Error verifying payment:", error);
      return {
        success: false,
        error: "Gagal memverifikasi pembayaran",
      };
    }
  },

  // Delete all orders for a buyer (DANGEROUS)
  async deleteOrdersByBuyer(userId) {
    try {
      const q = query(collection(db, "orders"), where("userId", "==", userId));
      const snapshot = await getDocs(q);

      let deleted = 0;
      for (const d of snapshot.docs) {
        await deleteDoc(doc(db, "orders", d.id));
        deleted += 1;
      }

      return { success: true, deleted };
    } catch (error) {
      console.error("Error deleting buyer orders:", error);
      return { success: false, error: "Gagal menghapus semua pesanan pembeli" };
    }
  },

  // Delete all orders that contain items from a seller (DANGEROUS)
  async deleteOrdersBySeller(sellerId) {
    try {
      const snapshot = await getDocs(collection(db, "orders"));

      let deleted = 0;
      for (const d of snapshot.docs) {
        const data = d.data();
        const hasSeller = (data.items || []).some(
          (item) => item.sellerId === sellerId || item.storeId === sellerId
        );
        if (hasSeller) {
          await deleteDoc(doc(db, "orders", d.id));
          deleted += 1;
        }
      }

      return { success: true, deleted };
    } catch (error) {
      console.error("Error deleting seller orders:", error);
      return {
        success: false,
        error: "Gagal menghapus pesanan yang terkait seller ini",
      };
    }
  },

  // Helper functions
  mapOrderStatusForSeller(orderData) {
    // Handle COD orders differently
    if (orderData.paymentMethod === "cod") {
      // Map COD statuses to seller-friendly statuses
      switch (orderData.status) {
        case "cod_confirmed":
          return "pending_verification"; // COD orders need verification too
        case "cod_processing":
          return "processing";
        case "cod_shipped":
          return "shipped";
        case "cod_delivered":
          return "delivered";
        default:
          return orderData.status;
      }
    }

    // For bank transfer orders, prioritize actual order status over admin verification
    // If order is already shipped/delivered, show that status regardless of admin verification
    if (orderData.status === "shipped") {
      return "shipped";
    }
    if (orderData.status === "delivered" || orderData.status === "completed") {
      return "delivered";
    }
    if (orderData.status === "processing") {
      return "processing";
    }
    if (orderData.status === "cancelled") {
      return "cancelled";
    }

    // Handle transfer bank orders based on admin verification only for early stages
    if (orderData.adminVerificationStatus === "pending") {
      return "pending_verification";
    } else if (orderData.adminVerificationStatus === "approved") {
      // Check if admin has transferred money to seller
      if (orderData.sellerTransferStatus === "pending") {
        return "waiting_transfer"; // Waiting for admin to transfer money
      } else if (orderData.sellerTransferStatus === "completed") {
        return "processing"; // Ready to process
      }
    } else if (orderData.adminVerificationStatus === "rejected") {
      return "cancelled";
    }

    return "pending";
  },

  getSellerStatusText(orderData) {
    const status = this.mapOrderStatusForSeller(orderData);
    const statusTexts = {
      pending_verification:
        orderData.paymentMethod === "cod"
          ? "Menunggu Verifikasi COD"
          : "Menunggu Verifikasi Admin",
      waiting_transfer: "Menunggu Transfer dari Admin",
      pending: "Menunggu Konfirmasi",
      processing: "Siap Dikemas",
      shipped:
        orderData.paymentMethod === "cod"
          ? "Dalam Pengiriman COD"
          : "Dalam Pengiriman",
      delivered: "Pesanan Selesai",
      cancelled: "Dibatalkan",
    };
    return statusTexts[status] || "Status Tidak Dikenal";
  },

  formatShippingAddress(shippingAddress) {
    if (!shippingAddress) return "Alamat tidak tersedia";

    const { address, city, postalCode } = shippingAddress;
    let formattedAddress = address || "";

    if (city) {
      formattedAddress += formattedAddress ? `, ${city}` : city;
    }

    if (postalCode) {
      formattedAddress += ` ${postalCode}`;
    }

    return formattedAddress || "Alamat tidak tersedia";
  },

  // Escrow Payment Methods
  async confirmPaymentByAdmin(orderId, adminNotes = "") {
    try {
      const orderRef = doc(db, "orders", orderId);
      const updateData = {
        adminVerificationStatus: "verified",
        paymentStatus: "confirmed",
        status: "payment_confirmed",
        adminVerificationNotes: adminNotes,
        adminVerifiedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await updateDoc(orderRef, updateData);
      return { success: true };
    } catch (error) {
      console.error("Error confirming payment:", error);
      return {
        success: false,
        error: "Gagal mengkonfirmasi pembayaran",
      };
    }
  },

  async transferToSeller(orderId, transferData) {
    try {
      const orderRef = doc(db, "orders", orderId);
      const updateData = {
        sellerTransferStatus: "completed",
        sellerTransferData: {
          ...transferData,
          transferredAt: serverTimestamp(),
          transferredBy: transferData.adminId,
        },
        status: "processing", // Ready for seller to process
        updatedAt: serverTimestamp(),
      };

      await updateDoc(orderRef, updateData);
      return { success: true };
    } catch (error) {
      console.error("Error transferring to seller:", error);
      return {
        success: false,
        error: "Gagal mentransfer ke penjual",
      };
    }
  },

  async getOrdersForAdminTransfer() {
    try {
      // Get orders that are payment confirmed but not yet transferred to seller
      const q = query(
        collection(db, "orders"),
        where("adminVerificationStatus", "==", "verified"),
        where("sellerTransferStatus", "==", "pending"),
        orderBy("adminVerifiedAt", "desc")
      );

      const snapshot = await getDocs(q);
      const orders = [];

      snapshot.forEach((doc) => {
        const orderData = { id: doc.id, ...doc.data() };

        // Calculate admin fee and seller amount
        const totalAmount = orderData.totalAmount || 0;
        const adminFee = orderData.adminFee || 1500;
        const sellerAmount = totalAmount - adminFee;

        orders.push({
          ...orderData,
          sellerAmount,
          adminFee,
        });
      });

      return { success: true, orders };
    } catch (error) {
      console.error("Error getting orders for admin transfer:", error);
      return {
        success: false,
        error: "Gagal mengambil data transfer",
        orders: [],
      };
    }
  },

  // Get seller revenue statistics
  async getSellerRevenueStats(sellerId) {
    try {
      const ordersResult = await this.getOrdersBySeller(sellerId);

      if (!ordersResult.success) {
        return {
          success: false,
          error: "Gagal mengambil data pesanan",
          stats: {},
        };
      }

      const orders = ordersResult.orders;
      const deliveredOrders = orders.filter(
        (order) => order.status === "delivered"
      );
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      // Calculate total revenue (seller's portion after admin fee)
      let totalRevenue = 0;
      let monthlyRevenue = 0;
      let totalItemsSold = 0;

      deliveredOrders.forEach((order) => {
        const orderTotal = order.totalAmount || order.total || 0;
        const adminFee = order.adminFee || Math.round(orderTotal * 0.015); // 1.5% admin fee
        const sellerRevenue = orderTotal - adminFee;

        totalRevenue += sellerRevenue;

        // Calculate items sold
        if (order.items) {
          totalItemsSold += order.items.reduce(
            (sum, item) => sum + (item.quantity || 0),
            0
          );
        }

        // Check if order is from current month
        const orderDate = order.createdAt?.seconds
          ? new Date(order.createdAt.seconds * 1000)
          : new Date(order.createdAt || order.date);

        if (
          orderDate.getMonth() === currentMonth &&
          orderDate.getFullYear() === currentYear
        ) {
          monthlyRevenue += sellerRevenue;
        }
      });

      // Calculate average order value
      const averageOrderValue =
        deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;

      // Calculate pending orders
      const pendingOrders = orders.filter(
        (order) =>
          order.status === "pending_verification" ||
          order.status === "processing" ||
          order.status === "shipped"
      ).length;

      const stats = {
        totalRevenue,
        monthlyRevenue,
        completedOrders: deliveredOrders.length,
        averageOrderValue,
        totalItemsSold,
        pendingOrders,
        totalOrders: orders.length,
      };

      return {
        success: true,
        stats,
      };
    } catch (error) {
      console.error("Error getting seller revenue stats:", error);
      return {
        success: false,
        error: "Gagal menghitung statistik pendapatan",
        stats: {},
      };
    }
  },
};
