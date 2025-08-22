import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
  Image,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { orderService } from "../../services/orderService";
import { useAuth } from "../../contexts/AuthContext";
import { imageService } from "../../services/imageService";
import { serverTimestamp } from "firebase/firestore";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
} from "../../utils/constants";
import { useFocusEffect } from "@react-navigation/native";

const SellerOrdersScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all");
  const [lastRefresh, setLastRefresh] = useState(null);
  const [filteredOrders, setFilteredOrders] = useState([]);

  const orderTabs = [
    { id: "all", label: "Semua", icon: "format-list-bulleted" },
    { id: "new_orders", label: "Baru", icon: "clock-outline" },
    { id: "processing", label: "Proses", icon: "package-variant" },
    { id: "shipped", label: "Kirim", icon: "truck-delivery" },
    { id: "delivered", label: "Selesai", icon: "check-circle" },
    { id: "cancelled", label: "Batal", icon: "close-circle" },
  ];

  useEffect(() => {
    loadOrders();

    // Listen for navigation events to refresh data when returning from detail screen
    const unsubscribe = navigation.addListener("focus", () => {
      loadOrders(true);
    });

    return unsubscribe;
  }, [navigation]);

  // Filter orders when orders or selectedTab changes
  useEffect(() => {
    filterOrders();
  }, [orders, selectedTab]);

  const filterOrders = () => {
    let filtered = orders;

    switch (selectedTab) {
      case "new_orders":
        filtered = orders.filter(
          (order) =>
            order.status === "pending_verification" ||
            order.status === "waiting_transfer" ||
            order.status === "cod_confirmed"
        );
        break;
      case "processing":
        filtered = orders.filter(
          (order) =>
            order.status === "processing" || order.status === "cod_processing"
        );
        break;
      case "shipped":
        filtered = orders.filter(
          (order) =>
            order.status === "shipped" || order.status === "cod_shipped"
        );
        break;
      case "delivered":
        filtered = orders.filter(
          (order) =>
            order.status === "delivered" ||
            order.status === "cod_delivered" ||
            order.status === "completed"
        );
        break;
      case "cancelled":
        filtered = orders.filter((order) => order.status === "cancelled");
        break;
      default:
        filtered = orders;
    }

    setFilteredOrders(filtered);
  };

  // Reload data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadOrders(true); // Force refresh when screen comes into focus
    }, [])
  );

  const loadOrders = async (forceRefresh = false) => {
    if (!user?.id) return;

    // Check if we need to refresh (avoid unnecessary calls)
    const now = new Date().getTime();
    const CACHE_DURATION = 30000; // 30 seconds cache

    if (
      !forceRefresh &&
      lastRefresh &&
      now - lastRefresh < CACHE_DURATION &&
      orders.length > 0
    ) {
      console.log("Using cached orders data");
      return;
    }

    try {
      setLoading(true);
      console.log("Loading orders for seller:", user.id);

      const result = await orderService.getOrdersBySeller(user.id);

      if (result.success) {
        console.log("Orders loaded successfully:", result.orders.length);
        setOrders(result.orders);
        setLastRefresh(now);
      } else {
        console.error("Error loading orders:", result.error);
        Alert.alert("Error", "Gagal memuat data pesanan");
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      Alert.alert("Error", "Terjadi kesalahan saat memuat data pesanan");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders(true); // Force refresh on pull-to-refresh
    setRefreshing(false);
  };

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
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending_verification":
        return COLORS.warning;
      case "pending":
        return COLORS.warning;
      case "processing":
        return COLORS.info;
      case "shipped":
        return COLORS.primary;
      case "delivered":
        return COLORS.success;
      case "cancelled":
        return COLORS.error;
      // COD Status Colors
      case "cod_confirmed":
        return COLORS.info;
      case "cod_processing":
        return COLORS.primary;
      case "cod_shipped":
        return COLORS.success;
      case "cod_delivered":
        return COLORS.success;
      default:
        return COLORS.textLight;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending_verification":
        return "clock-outline";
      case "pending":
        return "clock-outline";
      case "processing":
        return "package-variant";
      case "shipped":
        return "truck-delivery";
      case "delivered":
        return "check-circle";
      case "cancelled":
        return "close-circle";
      // COD Status Icons
      case "cod_confirmed":
        return "cash-check";
      case "cod_processing":
        return "package-variant";
      case "cod_shipped":
        return "truck-delivery";
      case "cod_delivered":
        return "cash-check";
      default:
        return "help-circle";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending_verification":
        return "Menunggu Verifikasi";
      case "pending":
        return "Menunggu Pembayaran";
      case "processing":
        return "Sedang Diproses";
      case "shipped":
        return "Dalam Pengiriman";
      case "delivered":
        return "Selesai";
      case "cancelled":
        return "Dibatalkan";
      // COD Status Text
      case "cod_confirmed":
        return "COD Dikonfirmasi";
      case "cod_processing":
        return "COD Diproses";
      case "cod_shipped":
        return "COD Dikirim";
      case "cod_delivered":
        return "COD Selesai";
      default:
        return "Status Tidak Dikenal";
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      setLoading(true);

      // For verification, we need to update both status and adminVerificationStatus
      let additionalData = {};
      if (newStatus === "processing") {
        additionalData = {
          adminVerificationStatus: "approved",
        };
      } else if (newStatus === "cod_processing") {
        additionalData = {
          adminVerificationStatus: "not_required", // COD doesn't need admin verification
        };
      } else if (newStatus === "cod_shipped") {
        additionalData = {
          shippedAt: serverTimestamp(),
        };
      }

      const result = await orderService.updateOrderStatus(
        orderId,
        newStatus,
        additionalData
      );
      if (result.success) {
        // Reload orders to get updated data
        await loadOrders(true);
        // Show success message
        Alert.alert("Berhasil", "Status pesanan berhasil diperbarui");
      } else {
        Alert.alert("Error", "Gagal memperbarui status pesanan");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      Alert.alert("Error", "Terjadi kesalahan saat memperbarui status");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTrackingNumber = (orderId) => {
    Alert.prompt(
      "Nomor Resi",
      "Masukkan nomor resi pengiriman:",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Simpan",
          onPress: async (trackingNumber) => {
            if (trackingNumber && trackingNumber.trim()) {
              try {
                setLoading(true);
                const result = await orderService.addTrackingNumber(
                  orderId,
                  trackingNumber.trim()
                );
                if (result.success) {
                  // Update status to shipped with additional data
                  const statusResult = await orderService.updateOrderStatus(
                    orderId,
                    "shipped",
                    {
                      shippedAt: serverTimestamp(),
                    }
                  );
                  if (statusResult.success) {
                    // Reload orders to get updated data
                    await loadOrders(true);
                    Alert.alert(
                      "Berhasil",
                      "Pesanan berhasil dikirim dengan nomor resi: " +
                        trackingNumber.trim() +
                        "\n\nPesanan sekarang dalam status 'Dalam Pengiriman'. Pembeli akan mengkonfirmasi setelah menerima barang."
                    );
                  } else {
                    Alert.alert(
                      "Error",
                      "Nomor resi ditambahkan tapi gagal mengupdate status pesanan"
                    );
                  }
                } else {
                  Alert.alert("Error", "Gagal menambahkan nomor resi");
                }
              } catch (error) {
                console.error("Error adding tracking number:", error);
                Alert.alert(
                  "Error",
                  "Terjadi kesalahan saat menambahkan nomor resi"
                );
              } finally {
                setLoading(false);
              }
            } else {
              Alert.alert("Error", "Nomor resi tidak boleh kosong");
            }
          },
        },
      ],
      "plain-text"
    );
  };

  const renderTabItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.tabItem, selectedTab === item.id && styles.tabItemActive]}
      onPress={() => setSelectedTab(item.id)}
    >
      <MaterialCommunityIcons
        name={item.icon}
        size={20}
        color={selectedTab === item.id ? COLORS.card : COLORS.textLight}
      />
      <Text
        style={[
          styles.tabText,
          selectedTab === item.id && styles.tabTextActive,
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate("SellerOrderDetail", { order: item })}
      activeOpacity={0.7}
    >
      {/* Header with Order ID and Status */}
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderLeft}>
          <View style={styles.orderIdContainer}>
            <MaterialCommunityIcons
              name="receipt"
              size={16}
              color={COLORS.primary}
            />
            <Text style={styles.orderId}>#{item.orderNumber || item.id}</Text>
            {item.paymentMethod === "cod" && (
              <View style={styles.codBadge}>
                <MaterialCommunityIcons
                  name="cash"
                  size={12}
                  color={COLORS.success}
                />
                <Text style={styles.codBadgeText}>COD</Text>
              </View>
            )}
          </View>
          <Text style={styles.orderDate}>{formatDate(item.date)}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <MaterialCommunityIcons
            name={getStatusIcon(item.status)}
            size={12}
            color={COLORS.card}
          />
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      {/* Customer Info */}
      <View style={styles.customerSection}>
        <View style={styles.customerInfo}>
          <View style={styles.customerAvatarContainer}>
            <Image
              source={{
                uri:
                  item.userAvatar ||
                  item.userProfileImage ||
                  imageService.generatePlaceholderAvatar(
                    item.userName ||
                      item.customerName ||
                      item.shippingAddress?.name ||
                      "Customer",
                    "buyer"
                  ),
              }}
              style={styles.customerAvatar}
              resizeMode="cover"
            />
          </View>
          <View style={styles.customerDetails}>
            <Text style={styles.customerName}>
              {item.userName ||
                item.customerName ||
                item.shippingAddress?.name ||
                "Customer"}
            </Text>
            <Text style={styles.customerEmail}>
              {item.userEmail || item.customerEmail || "No email"}
            </Text>
          </View>
        </View>
      </View>

      {/* Order Items Preview */}
      <View style={styles.itemsSection}>
        <View style={styles.itemsSectionHeader}>
          <MaterialCommunityIcons
            name="package-variant"
            size={16}
            color={COLORS.textSecondary}
          />
          <Text style={styles.itemsSectionTitle}>
            {item.items.length} Item{item.items.length > 1 ? "s" : ""}
          </Text>
        </View>

        <View style={styles.itemsPreview}>
          {item.items.slice(0, 2).map((orderItem, index) => (
            <View key={index} style={styles.itemPreviewRow}>
              <View style={styles.itemImageContainer}>
                {orderItem.image || orderItem.productImage ? (
                  <Image
                    source={{ uri: orderItem.image || orderItem.productImage }}
                    style={styles.itemPreviewImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.itemImagePlaceholder}>
                    <MaterialCommunityIcons
                      name="image"
                      size={20}
                      color={COLORS.textLight}
                    />
                  </View>
                )}
              </View>
              <View style={styles.itemPreviewDetails}>
                <Text style={styles.itemPreviewName} numberOfLines={1}>
                  {orderItem.name || orderItem.productName}
                </Text>
                {(orderItem.variant || orderItem.selectedVariant?.name) && (
                  <Text style={styles.itemPreviewVariant} numberOfLines={1}>
                    {orderItem.variant || orderItem.selectedVariant?.name}
                  </Text>
                )}
                <View style={styles.itemPreviewMeta}>
                  <Text style={styles.itemPreviewQuantity}>
                    Qty: {orderItem.quantity}
                  </Text>
                  <Text style={styles.itemPreviewPrice}>
                    {formatPrice(orderItem.price * orderItem.quantity)}
                  </Text>
                </View>
              </View>
            </View>
          ))}

          {item.items.length > 2 && (
            <View style={styles.moreItemsIndicator}>
              <Text style={styles.moreItemsText}>
                +{item.items.length - 2} item lainnya
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Shipping Address */}
      <View style={styles.shippingSection}>
        <MaterialCommunityIcons
          name="map-marker"
          size={16}
          color={COLORS.textSecondary}
        />
        <View style={styles.shippingDetails}>
          <Text style={styles.shippingLabel}>Alamat Pengiriman:</Text>
          <Text style={styles.shippingAddress} numberOfLines={2}>
            {typeof item.shippingAddress === "string"
              ? item.shippingAddress
              : `${item.shippingAddress?.name || ""} - ${
                  item.shippingAddress?.address || ""
                }, ${item.shippingAddress?.city || ""}`}
          </Text>
        </View>
      </View>

      {/* Tracking Info */}
      {item.trackingNumber && (
        <View style={styles.trackingSection}>
          <MaterialCommunityIcons
            name="truck-delivery"
            size={16}
            color={COLORS.success}
          />
          <View style={styles.trackingDetails}>
            <Text style={styles.trackingLabel}>Nomor Resi:</Text>
            <Text style={styles.trackingNumber}>{item.trackingNumber}</Text>
          </View>
        </View>
      )}

      {/* Footer with Total and Actions */}
      <View style={styles.orderFooter}>
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total Pesanan</Text>
          <Text style={styles.totalAmount}>
            {formatPrice(item.totalAmount || item.total)}
          </Text>
        </View>

        <View style={styles.actionButtons}>
          {item.status === "pending_verification" && (
            <TouchableOpacity
              style={[styles.actionButton, styles.verifyButton]}
              onPress={(e) => {
                e.stopPropagation();
                // For COD orders, update to cod_processing, for transfer orders update to processing
                const nextStatus =
                  item.originalOrder?.paymentMethod === "cod"
                    ? "cod_processing"
                    : "processing";
                handleUpdateOrderStatus(item.id, nextStatus);
              }}
            >
              <MaterialCommunityIcons
                name="check"
                size={16}
                color={COLORS.card}
              />
              <Text style={styles.actionButtonText}>Verifikasi</Text>
            </TouchableOpacity>
          )}

          {item.status === "processing" && (
            <TouchableOpacity
              style={[styles.actionButton, styles.shipButton]}
              onPress={(e) => {
                e.stopPropagation();
                // Check if it's COD order
                if (item.originalOrder?.paymentMethod === "cod") {
                  // For COD, directly ship without tracking number
                  handleUpdateOrderStatus(item.id, "cod_shipped");
                } else {
                  // For transfer, require tracking number
                  handleAddTrackingNumber(item.id);
                }
              }}
            >
              <MaterialCommunityIcons
                name="truck-delivery"
                size={16}
                color={COLORS.card}
              />
              <Text style={styles.actionButtonText}>Kirim</Text>
            </TouchableOpacity>
          )}

          {item.status === "shipped" && (
            <View style={styles.waitingCustomerInfo}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={16}
                color={COLORS.info}
              />
              <Text style={styles.waitingCustomerText}>
                Menunggu konfirmasi pembeli
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.detailButton}
            onPress={(e) => {
              e.stopPropagation();
              navigation.navigate("SellerOrderDetail", { order: item });
            }}
          >
            <Feather name="eye" size={16} color={COLORS.primary} />
            <Text style={styles.detailButtonText}>Detail</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyOrders = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="clipboard-list-outline"
        size={80}
        color={COLORS.textLight}
      />
      <Text style={styles.emptyTitle}>Belum Ada Pesanan</Text>
      <Text style={styles.emptySubtitle}>
        Pesanan dari pembeli akan{"\n"}
        muncul di sini
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pesanan Masuk</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {
              orders.filter(
                (o) =>
                  o.status === "pending_verification" ||
                  o.status === "cod_confirmed"
              ).length
            }
          </Text>
          <Text style={styles.statLabel}>Baru</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {
              orders.filter(
                (o) =>
                  o.status === "processing" || o.status === "cod_processing"
              ).length
            }
          </Text>
          <Text style={styles.statLabel}>Proses</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {
              orders.filter(
                (o) => o.status === "shipped" || o.status === "cod_shipped"
              ).length
            }
          </Text>
          <Text style={styles.statLabel}>Kirim</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {
              orders.filter(
                (o) => o.status === "delivered" || o.status === "cod_delivered"
              ).length
            }
          </Text>
          <Text style={styles.statLabel}>Selesai</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <FlatList
          data={orderTabs}
          renderItem={renderTabItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsList}
        />
      </View>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        renderEmptyOrders()
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.ordersList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* FAB: Hapus Semua Pesanan Seller (konfirmasi HAPUS) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          Alert.prompt?.(
            "Konfirmasi Penghapusan",
            "Ketik HAPUS untuk menghapus SEMUA pesanan terkait toko Anda dari database.",
            [
              { text: "Batal", style: "cancel" },
              {
                text: "Lanjut",
                style: "destructive",
                onPress: async (text) => {
                  if (text !== "HAPUS") {
                    Alert.alert("Dibatalkan", "Ketik HAPUS untuk melanjutkan.");
                    return;
                  }
                  try {
                    const result = await orderService.deleteOrdersBySeller(
                      user.id
                    );
                    if (result.success) {
                      Alert.alert(
                        "Berhasil",
                        `Terhapus ${result.deleted} pesanan.`
                      );
                      await loadOrders();
                    } else {
                      Alert.alert(
                        "Error",
                        result.error || "Gagal menghapus pesanan"
                      );
                    }
                  } catch (e) {
                    Alert.alert(
                      "Error",
                      "Terjadi kesalahan saat menghapus pesanan"
                    );
                  }
                },
              },
            ],
            "plain-text"
          ) ||
            Alert.alert(
              "Konfirmasi Penghapusan",
              "Fitur ketik HAPUS tidak tersedia. Lanjutkan menghapus semua pesanan terkait toko Anda?",
              [
                { text: "Batal", style: "cancel" },
                {
                  text: "Hapus",
                  style: "destructive",
                  onPress: async () => {
                    const result = await orderService.deleteOrdersBySeller(
                      user.id
                    );
                    if (result.success) {
                      Alert.alert(
                        "Berhasil",
                        `Terhapus ${result.deleted} pesanan.`
                      );
                      await loadOrders();
                    } else {
                      Alert.alert(
                        "Error",
                        result.error || "Gagal menghapus pesanan"
                      );
                    }
                  },
                },
              ]
            );
        }}
      >
        <MaterialCommunityIcons
          name="delete-forever"
          size={24}
          color={COLORS.card}
        />
      </TouchableOpacity>
      {/* FAB: Hapus Semua Pesanan Seller (konfirmasi HAPUS) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          Alert.prompt?.(
            "Konfirmasi Penghapusan",
            "Ketik HAPUS untuk menghapus SEMUA pesanan terkait toko Anda dari database.",
            [
              { text: "Batal", style: "cancel" },
              {
                text: "Lanjut",
                style: "destructive",
                onPress: async (text) => {
                  if (text !== "HAPUS") {
                    Alert.alert("Dibatalkan", "Ketik HAPUS untuk melanjutkan.");
                    return;
                  }
                  try {
                    const result = await orderService.deleteOrdersBySeller(
                      user.id
                    );
                    if (result.success) {
                      Alert.alert(
                        "Berhasil",
                        `Terhapus ${result.deleted} pesanan.`
                      );
                      await loadOrders();
                    } else {
                      Alert.alert(
                        "Error",
                        result.error || "Gagal menghapus pesanan"
                      );
                    }
                  } catch (e) {
                    Alert.alert(
                      "Error",
                      "Terjadi kesalahan saat menghapus pesanan"
                    );
                  }
                },
              },
            ],
            "plain-text"
          ) ||
            Alert.alert(
              "Konfirmasi Penghapusan",
              "Fitur ketik HAPUS tidak tersedia. Lanjutkan menghapus semua pesanan terkait toko Anda?",
              [
                { text: "Batal", style: "cancel" },
                {
                  text: "Hapus",
                  style: "destructive",
                  onPress: async () => {
                    const result = await orderService.deleteOrdersBySeller(
                      user.id
                    );
                    if (result.success) {
                      Alert.alert(
                        "Berhasil",
                        `Terhapus ${result.deleted} pesanan.`
                      );
                      await loadOrders();
                    } else {
                      Alert.alert(
                        "Error",
                        result.error || "Gagal menghapus pesanan"
                      );
                    }
                  },
                },
              ]
            );
        }}
      >
        <MaterialCommunityIcons
          name="delete-forever"
          size={24}
          color={COLORS.card}
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: SPACING.lg,
    bottom: SPACING.xl,
    backgroundColor: COLORS.error,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.large,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.card,
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    ...SHADOWS.small,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: "bold",
  },
  statsContainer: {
    backgroundColor: COLORS.card,
    flexDirection: "row",
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  tabsContainer: {
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  tabsList: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundSecondary,
  },
  tabItemActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginLeft: SPACING.xs,
    fontWeight: "500",
  },
  tabTextActive: {
    color: COLORS.card,
  },
  ordersList: {
    paddingVertical: SPACING.sm,
  },
  orderCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  orderId: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: "bold",
    marginLeft: SPACING.xs,
  },
  codBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.success + "20",
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.xs,
    marginLeft: SPACING.sm,
  },
  codBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    fontWeight: "600",
    fontSize: 10,
    marginLeft: 2,
  },
  orderDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontStyle: "italic",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    minWidth: 80,
    justifyContent: "center",
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.card,
    marginLeft: SPACING.xs,
    fontWeight: "bold",
    fontSize: 11,
  },
  // Customer Section
  customerSection: {
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  customerAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: COLORS.backgroundSecondary,
  },
  customerAvatar: {
    width: "100%",
    height: "100%",
  },
  customerDetails: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  customerName: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: "600",
    marginBottom: SPACING.xs,
  },
  customerEmail: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },

  // Items Section
  itemsSection: {
    marginBottom: SPACING.md,
  },
  itemsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  itemsSectionTitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    fontWeight: "600",
    marginLeft: SPACING.xs,
  },
  itemsPreview: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  itemPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  itemImageContainer: {
    marginRight: SPACING.sm,
  },
  itemPreviewImage: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.divider,
  },
  itemImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  itemPreviewDetails: {
    flex: 1,
  },
  itemPreviewName: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: "500",
    marginBottom: SPACING.xs,
  },
  itemPreviewVariant: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontStyle: "italic",
    marginBottom: SPACING.xs,
  },
  itemPreviewMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemPreviewQuantity: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  itemPreviewPrice: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: "600",
  },
  moreItemsIndicator: {
    alignItems: "center",
    paddingVertical: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    marginTop: SPACING.xs,
  },
  moreItemsText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontStyle: "italic",
  },

  // Shipping Section
  shippingSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  shippingDetails: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  shippingLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: "600",
    marginBottom: SPACING.xs,
  },
  shippingAddress: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    lineHeight: 18,
  },

  // Tracking Section
  trackingSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
    backgroundColor: COLORS.success + "10",
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.success + "30",
  },
  trackingDetails: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  trackingLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    fontWeight: "600",
    marginBottom: SPACING.xs,
  },
  trackingNumber: {
    ...TYPOGRAPHY.body2,
    color: COLORS.success,
    fontWeight: "bold",
    fontFamily: "monospace",
  },

  // Footer Section
  orderFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: SPACING.md,
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  totalLabel: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  totalAmount: {
    ...TYPOGRAPHY.h4,
    color: COLORS.primary,
    fontWeight: "bold",
  },

  // Action Buttons
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginLeft: SPACING.sm,
    minWidth: 80,
    justifyContent: "center",
  },
  verifyButton: {
    backgroundColor: COLORS.warning,
  },
  shipButton: {
    backgroundColor: COLORS.info,
  },
  completeButton: {
    backgroundColor: COLORS.success,
  },
  actionButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.card,
    fontWeight: "bold",
    marginLeft: SPACING.xs,
  },
  detailButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: "transparent",
    marginLeft: SPACING.sm,
    minWidth: 80,
    justifyContent: "center",
  },
  detailButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: "600",
    marginLeft: SPACING.xs,
  },
  waitingCustomerInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.info + "20",
    borderWidth: 1,
    borderColor: COLORS.info + "40",
    marginLeft: SPACING.sm,
  },
  waitingCustomerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.info,
    fontWeight: "600",
    marginLeft: SPACING.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: "bold",
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});

export default SellerOrdersScreen;
