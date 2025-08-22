import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  Modal,
} from "react-native";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useOrder } from "../contexts/OrderContext";
import { useAuth } from "../contexts/AuthContext";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
} from "../utils/constants";
import { settingsService } from "../services/settingsService";

const OrderDetailScreen = ({ navigation, route }) => {
  const { order: initialOrder } = route.params;
  const { updateOrderStatus, updatePaymentProof, getStatusInfo, getOrderById } =
    useOrder();
  const { user } = useAuth();

  const [currentOrder, setCurrentOrder] = useState(initialOrder);
  const [paymentProof, setPaymentProof] = useState(
    initialOrder.paymentProof || null
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);

  // Admin bank account for transfer instructions
  const [adminBank, setAdminBank] = useState(null);
  const [loadingBank, setLoadingBank] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadBank = async () => {
      try {
        setLoadingBank(true);
        const res = await settingsService.getAdminBankAccount();
        if (mounted && res.success) {
          setAdminBank(res.bankAccount || null);
        }
      } catch (e) {
        console.warn("Gagal memuat rekening admin", e);
      } finally {
        mounted && setLoadingBank(false);
      }
    };
    loadBank();
    return () => {
      mounted = false;
    };
  }, []);

  // ✅ Update order data when params change or from context
  useEffect(() => {
    const updatedOrder = getOrderById(initialOrder.id) || route.params.order;
    if (updatedOrder) {
      setCurrentOrder(updatedOrder);
      setPaymentProof(updatedOrder.paymentProof || null);
    }
  }, [route.params.order, getOrderById, initialOrder.id]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateOnly = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const statusInfo = getStatusInfo(currentOrder.status);

  const getTrackingSteps = () => {
    // Different steps for COD vs Transfer
    if (currentOrder.paymentMethod === "cod") {
      const codSteps = [
        {
          id: "cod_confirmed",
          label: "Pesanan COD Dikonfirmasi",
          icon: "cash-check",
          description: "Pesanan COD telah dikonfirmasi",
        },
        {
          id: "cod_processing",
          label: "Sedang Diproses",
          icon: "package-variant",
          description: "Pesanan sedang disiapkan",
        },
        {
          id: "cod_shipped",
          label: "Dalam Pengiriman",
          icon: "truck-delivery",
          description:
            'Pesanan sedang dikirim. Klik "Pesanan Diterima" setelah menerima barang.',
        },
        {
          id: "cod_delivered",
          label: "Selesai & Dibayar",
          icon: "cash-check",
          description: "Pesanan diterima dan pembayaran COD selesai",
        },
      ];

      const codStatusOrder = [
        "cod_confirmed",
        "cod_processing",
        "cod_shipped",
        "cod_delivered",
      ];
      const currentIndex = codStatusOrder.indexOf(currentOrder.status);

      return codSteps.map((step, index) => ({
        ...step,
        completed: index <= currentIndex,
        active: index === currentIndex,
      }));
    } else {
      // Transfer Bank steps
      const transferSteps = [
        {
          id: "pending",
          label: "Pesanan Dibuat",
          icon: "file-document-outline",
          description: "Pesanan telah dibuat",
        },
        {
          id: "pending_payment",
          label: "Menunggu Pembayaran",
          icon: "clock-outline",
          description: "Pesanan menunggu pembayaran",
        },
        {
          id: "pending_verification",
          label: "Menunggu Verifikasi",
          icon: "account-check-outline",
          description: "Bukti pembayaran menunggu verifikasi admin",
        },
        {
          id: "processing",
          label: "Sedang Diproses",
          icon: "package-variant",
          description: "Pesanan sedang disiapkan",
        },
        {
          id: "shipped",
          label: "Dalam Pengiriman",
          icon: "truck-delivery",
          description:
            'Pesanan sedang dikirim. Klik "Pesanan Diterima" setelah menerima barang.',
        },
        {
          id: "delivered",
          label: "Pesanan Selesai",
          icon: "check-all",
          description: "Pesanan telah diterima",
        },
        {
          id: "completed",
          label: "Transaksi Selesai",
          icon: "check-circle",
          description: "Transaksi telah selesai sepenuhnya",
        },
      ];

      const transferStatusOrder = [
        "pending",
        "pending_payment",
        "pending_verification",
        "processing",
        "shipped",
        "delivered",
        "completed",
      ];
      const currentIndex = transferStatusOrder.indexOf(currentOrder.status);

      return transferSteps.map((step, index) => ({
        ...step,
        completed: index <= currentIndex,
        active: index === currentIndex,
      }));
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      "Pilih Sumber Gambar",
      "Pilih dari mana Anda ingin mengambil foto bukti pembayaran",
      [
        {
          text: "Kamera",
          onPress: () => handleImagePicker("camera"),
        },
        {
          text: "Galeri",
          onPress: () => handleImagePicker("gallery"),
        },
        {
          text: "Batal",
          style: "cancel",
        },
      ]
    );
  };

  const handleImagePicker = async (source) => {
    try {
      let permissionResult;

      if (source === "camera") {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        permissionResult =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      if (permissionResult.status !== "granted") {
        Alert.alert(
          "Izin Diperlukan",
          `Izin akses ${
            source === "camera" ? "kamera" : "galeri"
          } diperlukan untuk upload bukti pembayaran`
        );
        return;
      }

      setUploadingProof(true);

      const imagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        allowsMultipleSelection: false,
        quality: 0.8,
        // Remove fixed aspect ratio to allow free cropping
        // aspect: [4, 3], // Removed this line
        exif: false,
        base64: false,
      };

      let result;
      if (source === "camera") {
        result = await ImagePicker.launchCameraAsync(imagePickerOptions);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(imagePickerOptions);
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];

        try {
          // Update payment proof in order context
          const uploadResult = await updatePaymentProof(
            currentOrder.id,
            selectedImage.uri
          );

          if (uploadResult.success) {
            setPaymentProof(selectedImage.uri);
            setShowPaymentModal(false);

            Alert.alert(
              "Berhasil",
              'Bukti pembayaran berhasil diupload. Status pesanan telah diperbarui menjadi "Menunggu Verifikasi Admin". Admin akan memverifikasi pembayaran Anda.',
              [
                {
                  text: "OK",
                  onPress: () => {
                    // ✅ Navigate back with updated order data
                    navigation.navigate("OrderDetail", {
                      order: uploadResult.updatedOrder || {
                        ...currentOrder,
                        status: "pending_verification",
                        paymentProof: selectedImage.uri,
                        paymentStatus: "proof_uploaded",
                        paymentProofUploadedAt: new Date().toISOString(),
                      },
                    });
                  },
                },
              ]
            );
          } else {
            Alert.alert(
              "Error",
              uploadResult.error || "Gagal mengupload bukti pembayaran"
            );
          }
        } catch (error) {
          console.error("Error updating payment proof:", error);
          Alert.alert("Error", "Gagal mengupload bukti pembayaran");
        }
      }
    } catch (error) {
      console.error("Error with image picker:", error);
      Alert.alert("Error", "Terjadi kesalahan saat memilih gambar");
    } finally {
      setUploadingProof(false);
    }
  };

  const handleConfirmReceived = async () => {
    Alert.alert(
      "Konfirmasi Penerimaan Pesanan",
      "Apakah Anda sudah menerima pesanan ini dengan baik?",
      [
        { text: "Belum", style: "cancel" },
        {
          text: "Sudah Diterima",
          onPress: async () => {
            try {
              // Determine final status and additional fields
              const isCOD = currentOrder.paymentMethod === "cod";
              const newStatus = isCOD ? "cod_delivered" : "completed";
              const additionalData = isCOD
                ? { codDeliveredAt: new Date().toISOString() }
                : {
                    deliveredAt: new Date().toISOString(),
                    completedAt: new Date().toISOString(),
                    sellerTransferStatus: "pending",
                  };

              const result = await updateOrderStatus(
                currentOrder.id,
                newStatus,
                additionalData
              );

              if (result.success) {
                Alert.alert(
                  "Berhasil",
                  currentOrder.paymentMethod === "cod"
                    ? "Pesanan telah dikonfirmasi diterima. Terima kasih telah berbelanja!"
                    : "Pesanan telah dikonfirmasi diterima. Terima kasih telah berbelanja!",
                  [
                    {
                      text: "OK",
                      onPress: () => {
                        // Navigate back and refresh
                        navigation.goBack();
                      },
                    },
                  ]
                );
              } else {
                Alert.alert(
                  "Error",
                  result.error || "Gagal mengkonfirmasi penerimaan pesanan"
                );
              }
            } catch (error) {
              console.error("Error confirming order received:", error);
              Alert.alert(
                "Error",
                "Terjadi kesalahan saat mengkonfirmasi penerimaan pesanan"
              );
            }
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <MaterialCommunityIcons
          name="arrow-left"
          size={24}
          color={COLORS.text}
        />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Detail Pesanan</Text>
      <View style={styles.placeholder} />
    </View>
  );

  const renderOrderInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Informasi Pesanan</Text>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>ID Pesanan</Text>
        <Text style={styles.infoValue}>#{currentOrder.orderNumber}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Tanggal Pesanan</Text>
        <Text style={styles.infoValue}>
          {formatDate(currentOrder.createdAt)}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Status Pesanan</Text>
        <View
          style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}
        >
          <MaterialCommunityIcons
            name={statusInfo.icon}
            size={16}
            color={COLORS.card}
          />
          <Text style={styles.statusText}>{statusInfo.label}</Text>
        </View>
      </View>
    </View>
  );

  const renderPaymentStatus = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Status Pembayaran</Text>

      <View style={styles.paymentStatusContainer}>
        <View style={styles.paymentInfo}>
          <MaterialCommunityIcons
            name={
              currentOrder.status === "pending_payment" ||
              currentOrder.status === "pending"
                ? "clock-outline"
                : currentOrder.status === "pending_verification"
                ? "account-check-outline"
                : currentOrder.status === "cod_confirmed" ||
                  currentOrder.status === "cod_processing" ||
                  currentOrder.status === "cod_shipped"
                ? "cash"
                : currentOrder.status === "cod_delivered"
                ? "cash-check"
                : "check-circle"
            }
            size={24}
            color={
              currentOrder.status === "pending_payment" ||
              currentOrder.status === "pending"
                ? COLORS.warning
                : currentOrder.status === "pending_verification"
                ? "#FF6B35"
                : currentOrder.status === "cod_confirmed" ||
                  currentOrder.status === "cod_processing" ||
                  currentOrder.status === "cod_shipped"
                ? COLORS.info
                : COLORS.success
            }
          />
          <View style={styles.paymentDetails}>
            <Text style={styles.paymentStatusText}>
              {currentOrder.status === "pending_payment" ||
              currentOrder.status === "pending"
                ? "Menunggu Pembayaran"
                : currentOrder.status === "pending_verification"
                ? "Menunggu Verifikasi Admin"
                : currentOrder.status === "cod_confirmed" ||
                  currentOrder.status === "cod_processing" ||
                  currentOrder.status === "cod_shipped"
                ? "Bayar Saat Terima Barang"
                : currentOrder.status === "cod_delivered"
                ? "Pembayaran COD Selesai"
                : "Pembayaran Dikonfirmasi"}
            </Text>
            <Text style={styles.paymentMethod}>
              Metode:{" "}
              {currentOrder.paymentMethod === "transfer"
                ? "Transfer Bank"
                : "Bayar di Tempat (COD)"}
            </Text>
          </View>
        </View>

        {currentOrder.paymentMethod === "transfer" &&
          (currentOrder.status === "pending_payment" ||
            currentOrder.status === "pending") && (
            <View style={styles.bankInfo}>
              <Text style={styles.bankInfoTitle}>Informasi Transfer:</Text>
              {loadingBank ? (
                <Text style={styles.bankDetails}>Memuat rekening admin...</Text>
              ) : adminBank ? (
                <>
                  <Text style={styles.bankDetails}>{adminBank.bankName}</Text>
                  <Text style={styles.bankDetails}>
                    No. Rekening: {adminBank.accountNumber}
                  </Text>
                  <Text style={styles.bankDetails}>
                    Atas Nama: {adminBank.accountHolderName}
                  </Text>
                </>
              ) : (
                <Text style={styles.bankDetails}>
                  Rekening admin belum diatur. Silakan hubungi admin.
                </Text>
              )}
              <Text style={styles.totalTransfer}>
                Total: {formatPrice(currentOrder.totalAmount)}
              </Text>
            </View>
          )}

        {currentOrder.paymentMethod === "cod" && (
          <View style={styles.codInfo}>
            <Text style={styles.codInfoTitle}>Informasi COD:</Text>
            <View style={styles.codDetails}>
              <MaterialCommunityIcons
                name="cash"
                size={16}
                color={COLORS.success}
              />
              <Text style={styles.codText}>
                Bayar langsung ke penjual saat barang diterima
              </Text>
            </View>
            <View style={styles.codDetails}>
              <MaterialCommunityIcons
                name="gift-outline"
                size={16}
                color={COLORS.success}
              />
              <Text style={styles.codText}>
                GRATIS biaya admin (hemat Rp 1.500)
              </Text>
            </View>
            <Text style={styles.totalCOD}>
              Total Bayar: {formatPrice(currentOrder.subtotal)}
            </Text>
          </View>
        )}

        {currentOrder.paymentMethod === "transfer" && (
          <View style={styles.paymentProofSection}>
            <Text style={styles.paymentProofTitle}>Bukti Pembayaran:</Text>
            {paymentProof ? (
              <View style={styles.proofContainer}>
                <Image
                  source={{ uri: paymentProof }}
                  style={styles.proofImage}
                />
                <Text style={styles.proofStatus}>
                  {currentOrder.status === "pending_payment" ||
                  currentOrder.status === "pending"
                    ? "Belum diupload"
                    : currentOrder.status === "pending_verification"
                    ? "Menunggu verifikasi admin"
                    : "Terverifikasi"}
                </Text>
                {(currentOrder.status === "pending_payment" ||
                  currentOrder.status === "pending" ||
                  currentOrder.status === "pending_verification") && (
                  <TouchableOpacity
                    style={styles.changeProofButton}
                    onPress={showImagePickerOptions}
                  >
                    <MaterialCommunityIcons
                      name="camera-plus"
                      size={16}
                      color={COLORS.primary}
                    />
                    <Text style={styles.changeProofText}>
                      Ganti Bukti Pembayaran
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              (currentOrder.status === "pending_payment" ||
                currentOrder.status === "pending") && (
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={showImagePickerOptions}
                >
                  <MaterialCommunityIcons
                    name="camera-plus"
                    size={20}
                    color={COLORS.primary}
                  />
                  <Text style={styles.uploadButtonText}>
                    Upload Bukti Pembayaran
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        )}
      </View>
    </View>
  );

  const renderShippingAddress = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Alamat Pengiriman</Text>

      <View style={styles.addressContainer}>
        <View style={styles.addressHeader}>
          <MaterialCommunityIcons
            name="map-marker"
            size={20}
            color={COLORS.primary}
          />
          <Text style={styles.addressName}>
            {currentOrder.shippingAddress.name}
          </Text>
        </View>

        <Text style={styles.addressPhone}>
          {currentOrder.shippingAddress.phone}
        </Text>
        <Text style={styles.addressText}>
          {currentOrder.shippingAddress.address},{" "}
          {currentOrder.shippingAddress.city}
          {currentOrder.shippingAddress.postalCode &&
            `, ${currentOrder.shippingAddress.postalCode}`}
        </Text>
      </View>
    </View>
  );

  const renderOrderItems = () => {
    // Group items by seller
    const itemsBySeller = currentOrder.items.reduce((acc, item) => {
      const sellerId = item.sellerId || "unknown";
      // Prioritize storeName over sellerName for consistency with product detail
      const sellerName =
        item.storeName || item.sellerName || "Toko Tidak Dikenal";

      if (!acc[sellerId]) {
        acc[sellerId] = {
          sellerName,
          items: [],
        };
      }

      acc[sellerId].items.push(item);
      return acc;
    }, {});

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Item Pesanan ({currentOrder.itemCount} produk)
        </Text>

        {Object.entries(itemsBySeller).map(([sellerId, sellerData]) => (
          <View key={sellerId} style={styles.sellerGroup}>
            <View style={styles.sellerHeader}>
              <MaterialCommunityIcons
                name="store"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.sellerName}>{sellerData.sellerName}</Text>
              <Text style={styles.itemCount}>
                ({sellerData.items.length} produk)
              </Text>
            </View>

            {sellerData.items.map((item, index) => (
              <View key={`${item.productId}-${index}`} style={styles.orderItem}>
                <Image
                  source={{ uri: item.productImage }}
                  style={styles.itemImage}
                />

                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.productName}
                  </Text>

                  {item.selectedVariant && (
                    <Text style={styles.itemVariant}>
                      Varian: {item.selectedVariant.name}
                    </Text>
                  )}

                  <View style={styles.itemPriceRow}>
                    <Text style={styles.itemPrice}>
                      {formatPrice(item.price)}
                    </Text>
                    <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                  </View>
                </View>

                <Text style={styles.itemTotal}>
                  {formatPrice(item.totalPrice)}
                </Text>
              </View>
            ))}

            <View style={styles.sellerSummary}>
              <Text style={styles.sellerSummaryText}>
                Subtotal {sellerData.sellerName}:{" "}
                {formatPrice(
                  sellerData.items.reduce(
                    (sum, item) => sum + item.totalPrice,
                    0
                  )
                )}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderOrderSummary = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Ringkasan Pembayaran</Text>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>
          Subtotal ({currentOrder.itemCount} item)
        </Text>
        <Text style={styles.summaryValue}>
          {formatPrice(currentOrder.subtotal)}
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>
          Biaya Admin{" "}
          {currentOrder.paymentMethod === "cod" ? "(Gratis untuk COD)" : ""}
        </Text>
        <Text
          style={[
            styles.summaryValue,
            currentOrder.paymentMethod === "cod" && styles.freePrice,
          ]}
        >
          {currentOrder.paymentMethod === "cod"
            ? "GRATIS"
            : formatPrice(currentOrder.adminFee || 1500)}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total Pembayaran</Text>
        <Text style={styles.totalValue}>
          {formatPrice(
            currentOrder.paymentMethod === "cod"
              ? currentOrder.subtotal // COD hanya subtotal tanpa biaya admin
              : currentOrder.totalAmount // Transfer dengan biaya admin
          )}
        </Text>
      </View>
    </View>
  );

  const renderTrackingStatus = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Status Pengiriman</Text>

      <View style={styles.trackingContainer}>
        {getTrackingSteps().map((step, index) => (
          <View key={step.id} style={styles.trackingStep}>
            <View style={styles.trackingIconContainer}>
              <View
                style={[
                  styles.trackingIcon,
                  {
                    backgroundColor: step.completed
                      ? COLORS.primary
                      : COLORS.backgroundSecondary,
                    borderColor: step.active ? COLORS.primary : COLORS.divider,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={step.icon}
                  size={16}
                  color={step.completed ? COLORS.card : COLORS.textSecondary}
                />
              </View>
              {index < getTrackingSteps().length - 1 && (
                <View
                  style={[
                    styles.trackingLine,
                    {
                      backgroundColor: step.completed
                        ? COLORS.primary
                        : COLORS.divider,
                    },
                  ]}
                />
              )}
            </View>

            <View style={styles.trackingContent}>
              <Text
                style={[
                  styles.trackingLabel,
                  {
                    color: step.completed ? COLORS.text : COLORS.textSecondary,
                  },
                ]}
              >
                {step.label}
              </Text>
              <Text style={styles.trackingDescription}>{step.description}</Text>
              {step.active && (
                <Text style={styles.trackingDate}>
                  {formatDateOnly(currentOrder.updatedAt)}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderNotes = () => {
    if (!currentOrder.notes) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Catatan</Text>
        <Text style={styles.notesText}>{currentOrder.notes}</Text>
      </View>
    );
  };

  const renderPaymentModal = () => (
    <Modal
      visible={showPaymentModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowPaymentModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Upload Bukti Pembayaran</Text>
            <TouchableOpacity
              onPress={() => setShowPaymentModal(false)}
              style={styles.modalCloseButton}
            >
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={COLORS.text}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalDescription}>
            Silakan upload bukti transfer pembayaran Anda. Anda dapat memotong
            gambar sesuai keinginan untuk menampilkan bagian yang penting.
          </Text>

          <View style={styles.uploadOptions}>
            <TouchableOpacity
              style={styles.uploadOptionButton}
              onPress={() => {
                setShowPaymentModal(false);
                setTimeout(() => handleImagePicker("camera"), 300);
              }}
              disabled={uploadingProof}
            >
              <MaterialCommunityIcons
                name="camera"
                size={32}
                color={COLORS.primary}
              />
              <Text style={styles.uploadOptionText}>Ambil Foto</Text>
              <Text style={styles.uploadOptionSubtext}>
                Foto langsung dengan kamera
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadOptionButton}
              onPress={() => {
                setShowPaymentModal(false);
                setTimeout(() => handleImagePicker("gallery"), 300);
              }}
              disabled={uploadingProof}
            >
              <MaterialCommunityIcons
                name="image"
                size={32}
                color={COLORS.primary}
              />
              <Text style={styles.uploadOptionText}>Pilih dari Galeri</Text>
              <Text style={styles.uploadOptionSubtext}>
                Pilih foto yang sudah ada
              </Text>
            </TouchableOpacity>
          </View>

          {uploadingProof && (
            <View style={styles.uploadingContainer}>
              <MaterialCommunityIcons
                name="loading"
                size={24}
                color={COLORS.primary}
              />
              <Text style={styles.uploadingText}>
                Mengupload bukti pembayaran...
              </Text>
            </View>
          )}

          <View style={styles.cropInfo}>
            <MaterialCommunityIcons
              name="information"
              size={16}
              color={COLORS.textSecondary}
            />
            <Text style={styles.cropInfoText}>
              Setelah memilih foto, Anda dapat memotong dan menyesuaikan area
              yang ingin ditampilkan
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderBottomAction = () => {
    // Show "Pesanan Diterima" button when order is shipped (for both COD and Transfer)
    const showReceiveButton =
      currentOrder.status === "shipped" ||
      currentOrder.status === "cod_shipped";

    if (showReceiveButton) {
      return (
        <View style={styles.bottomActionContainer}>
          <TouchableOpacity
            style={styles.receiveButton}
            onPress={handleConfirmReceived}
          >
            <MaterialCommunityIcons
              name="check-circle"
              size={20}
              color={COLORS.card}
            />
            <Text style={styles.receiveButtonText}>Pesanan Diterima</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // No receipt button - process ends at order detail page when delivered
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderOrderInfo()}
        {renderPaymentStatus()}
        {renderShippingAddress()}
        {renderOrderItems()}
        {renderOrderSummary()}
        {renderTrackingStatus()}
        {renderNotes()}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Action Button */}
      {renderBottomAction()}

      {renderPaymentModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    ...SHADOWS.small,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: "bold",
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  infoLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
  },
  infoValue: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: "500",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.card,
    fontWeight: "600",
    marginLeft: SPACING.xs,
  },
  paymentStatusContainer: {
    marginTop: SPACING.sm,
  },
  paymentInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  paymentDetails: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  paymentStatusText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: "500",
  },
  paymentMethod: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  bankInfo: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
  },
  bankInfoTitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: "600",
    marginBottom: SPACING.sm,
  },
  bankDetails: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  totalTransfer: {
    ...TYPOGRAPHY.body1,
    color: COLORS.primary,
    fontWeight: "bold",
    marginTop: SPACING.sm,
  },
  codInfo: {
    backgroundColor: COLORS.success + "10",
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.success + "30",
  },
  codInfoTitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: "600",
    marginBottom: SPACING.sm,
  },
  codDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  codText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  totalCOD: {
    ...TYPOGRAPHY.body1,
    color: COLORS.success,
    fontWeight: "bold",
    marginTop: SPACING.sm,
    textAlign: "center",
  },
  paymentProofSection: {
    marginTop: SPACING.md,
  },
  paymentProofTitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: "600",
    marginBottom: SPACING.sm,
  },
  proofContainer: {
    alignItems: "center",
  },
  proofImage: {
    width: 200,
    height: 150,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  proofStatus: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  changeProofButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  changeProofText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    marginLeft: SPACING.xs,
    fontWeight: "500",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  uploadButtonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
    fontWeight: "500",
  },
  addressContainer: {
    marginTop: SPACING.sm,
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  addressName: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: "600",
    marginLeft: SPACING.sm,
  },
  addressPhone: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  addressText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    lineHeight: 20,
  },
  sellerGroup: {
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: BORDER_RADIUS.sm,
    overflow: "hidden",
  },
  sellerHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  sellerName: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: "600",
    marginLeft: SPACING.sm,
    flex: 1,
  },
  itemCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  sellerSummary: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  sellerSummaryText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    fontWeight: "600",
    textAlign: "right",
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.sm,
  },
  itemDetails: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  itemName: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: "500",
    marginBottom: SPACING.xs,
  },
  itemVariant: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  itemPriceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemPrice: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    fontWeight: "600",
  },
  itemQuantity: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  itemTotal: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: "bold",
    marginLeft: SPACING.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: "500",
  },
  freePrice: {
    color: COLORS.success,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.md,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: "bold",
  },
  totalValue: {
    ...TYPOGRAPHY.h4,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  trackingContainer: {
    marginTop: SPACING.sm,
  },
  trackingStep: {
    flexDirection: "row",
    marginBottom: SPACING.lg,
  },
  trackingIconContainer: {
    alignItems: "center",
    marginRight: SPACING.md,
  },
  trackingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  trackingLine: {
    width: 2,
    height: 30,
    marginTop: SPACING.xs,
  },
  trackingContent: {
    flex: 1,
    paddingTop: SPACING.xs,
  },
  trackingLabel: {
    ...TYPOGRAPHY.body2,
    fontWeight: "600",
    marginBottom: SPACING.xs,
  },
  trackingDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  trackingDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: "500",
  },
  notesText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  modalTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: "bold",
  },
  modalCloseButton: {
    padding: SPACING.xs,
  },
  modalDescription: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  modalUploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    ...SHADOWS.medium,
  },
  modalUploadButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.card,
    marginLeft: SPACING.sm,
  },
  uploadOptions: {
    marginBottom: SPACING.lg,
  },
  uploadOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  uploadOptionText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: "600",
    marginLeft: SPACING.md,
    flex: 1,
  },
  uploadOptionSubtext: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginLeft: SPACING.md,
    flex: 1,
    marginTop: SPACING.xs,
  },
  uploadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary + "10",
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  uploadingText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
    fontWeight: "500",
  },
  cropInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  cropInfoText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    flex: 1,
    lineHeight: 16,
  },
  bottomSpacing: {
    height: SPACING.xl,
  },
  bottomActionContainer: {
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    ...SHADOWS.medium,
  },
  receiveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    ...SHADOWS.small,
  },
  receiveButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.card,
    marginLeft: SPACING.sm,
    fontWeight: "bold",
  },
});

export default OrderDetailScreen;
