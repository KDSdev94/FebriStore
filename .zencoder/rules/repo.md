# Repo Info: EXPO Ecommerce

## Stack

- React Native (Expo)
- React Navigation
- Firebase (Firestore, Auth, Storage)
- AsyncStorage (cache/compat for orders)

## Entry Points

- index.js
- App.js (wraps providers and navigators)

## Contexts

- contexts/AuthContext.js
- contexts/CartContext.js
- contexts/OrderContext.js
  - loadOrders() pulls from Firestore via orderService.getAllOrders (server) and stores in local state
  - clearAllOrders() clears local state + AsyncStorage only (does not delete Firestore)
  - updateOrderStatus(orderId, newStatus, additionalData) writes to Firestore via orderService
  - updatePaymentProof(orderId, uri) writes proof + sets status pending_verification
  - getStatusInfo(status) maps status -> label, color, icon
- contexts/WishlistContext.js

## Services

- services/orderService.js: CRUD orders, stock reduction, tracking number, etc.
- services/productService.js: products access
- services/transactionService.js: derived transactions list for admin, stats
- services/imageService.js: image upload helpers
- services/settingsService.js: app settings (e.g., order statuses)
- services/adminService.js, addressService.js, passwordResetService.js

## Navigation

- navigation/MainNavigator.js
- navigation/AppStackNavigator.js
- navigation/RoleBasedNavigator.js
- navigation/SellerStackNavigator.js
- navigation/AdminStackNavigator.js

## Screens

- Buyer: screens/OrderScreen.js, OrderDetailScreen.js, HomeScreen.js, CheckoutScreen.js, etc.
- Seller: screens/seller/\* (orders, products, etc.)
- Admin: screens/admin/\* (orders, transactions, settings)

## Orders & Status

- Non-COD flow: pending -> pending_payment -> pending_verification -> processing -> shipped -> delivered -> completed
- COD flow: cod_confirmed -> cod_processing -> cod_shipped -> cod_delivered
- OrderDetailScreen: "Pesanan Diterima" now sets status to completed for non-COD and cod_delivered for COD, and writes timestamps; also sets sellerTransferStatus: 'pending' for non-COD

## Scripts

- scripts/clearOrderData.js: clears AsyncStorage key 'orders' only (local)
- Other helper scripts: addSampleProducts, createSampleSellers, updateProductStoreNames, etc.

## Docs

- docs/FIRESTORE_PRODUCTS.md
- docs/TRANSACTION_DATABASE.md (status mapping, transfer states)

## Config

- firebaseConfig.js
- app.json, eas.json, babel.config.js

## Notes

- OrderScreen tabs map multiple statuses to grouped filters
- Transaction list (transactionService) ignores COD for admin transfer pipeline
