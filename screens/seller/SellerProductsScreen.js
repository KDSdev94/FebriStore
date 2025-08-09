import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../utils/constants';
import { productService } from '../../services/productService';

const SellerProductsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [categories, setCategories] = useState(['Semua']);

  useEffect(() => {
    loadProducts();
  }, []);

  // Reload data ketika screen difocus (setelah tambah/edit produk)
  useFocusEffect(
    React.useCallback(() => {
      loadProducts();
    }, [])
  );

  const loadProducts = async () => {
    try {
      setLoading(true);
      console.log('Loading products for seller:', user.id);
      const result = await productService.getProductsBySeller(user.id);
      
      console.log('Products result:', result);
      
      if (result.success) {
        console.log('Products loaded:', result.products.length);
        setProducts(result.products);
        setFilteredProducts(result.products);
        
        // Extract unique categories
        const uniqueCategories = ['Semua', ...new Set(result.products.map(p => p.category).filter(Boolean))];
        setCategories(uniqueCategories);
      } else {
        console.error('Error loading products:', result.error);
        Alert.alert('Error', 'Gagal memuat produk: ' + result.error);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat memuat produk');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const filterProductsByCategory = (category) => {
    setSelectedCategory(category);
    if (category === 'Semua') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(product => product.category === category));
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddProduct = () => {
    navigation.navigate('AddProduct');
  };

  const handleEditProduct = (product) => {
    navigation.navigate('EditProduct', { product });
  };

  const handleDeleteProduct = (productId) => {
    Alert.alert(
      'Hapus Produk',
      'Apakah Anda yakin ingin menghapus produk ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await productService.deleteProduct(productId);
              
              if (result.success) {
                const updatedProducts = products.filter(p => p.id !== productId);
                setProducts(updatedProducts);
                // Update filtered products as well
                if (selectedCategory === 'Semua') {
                  setFilteredProducts(updatedProducts);
                } else {
                  setFilteredProducts(updatedProducts.filter(product => product.category === selectedCategory));
                }
                Alert.alert('Berhasil', 'Produk berhasil dihapus');
              } else {
                Alert.alert('Error', result.error || 'Gagal menghapus produk');
              }
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Terjadi kesalahan saat menghapus produk');
            }
          }
        }
      ]
    );
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === item && styles.categoryButtonActive
      ]}
      onPress={() => filterProductsByCategory(item)}
    >
      <Text style={[
        styles.categoryButtonText,
        selectedCategory === item && styles.categoryButtonTextActive
      ]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderCategoriesFilter = () => (
    <View style={styles.categoriesContainer}>
      <Text style={styles.categoriesTitle}>Kategori:</Text>
      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesList}
      />
    </View>
  );

  const generateSampleProducts = () => {
    Alert.alert(
      'Generate Produk Sample',
      'Apakah Anda ingin menambahkan 40 produk sample untuk testing?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            try {
              setLoading(true);
              
              const sampleProducts = [
                // Makanan & Minuman
                {
                  name: 'Nasi Gudeg Yogya',
                  description: 'Nasi gudeg khas Yogyakarta dengan ayam kampung, telur, dan sambal krecek. Cita rasa autentik yang menggugah selera.',
                  price: 25000,
                  stock: 50,
                  category: 'Makanan & Minuman',
                  images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop']
                },
                {
                  name: 'Sate Ayam Madura',
                  description: 'Sate ayam bumbu kacang khas Madura dengan bumbu rempah pilihan. Disajikan dengan lontong dan lalapan.',
                  price: 30000,
                  stock: 40,
                  category: 'Makanan & Minuman',
                  images: ['https://images.unsplash.com/photo-1529563021893-cc83c992d75d?w=400&h=400&fit=crop']
                },
                {
                  name: 'Rendang Daging Sapi',
                  description: 'Rendang daging sapi empuk dengan bumbu rempah tradisional Padang. Cita rasa yang kaya dan menggugah selera.',
                  price: 45000,
                  stock: 30,
                  category: 'Makanan & Minuman',
                  images: ['https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=400&fit=crop']
                },
                {
                  name: 'Gado-gado Jakarta',
                  description: 'Gado-gado segar dengan sayuran pilihan, tahu, tempe, dan bumbu kacang yang gurih.',
                  price: 20000,
                  stock: 60,
                  category: 'Makanan & Minuman',
                  images: ['https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=400&fit=crop']
                },
                {
                  name: 'Es Teh Manis',
                  description: 'Es teh manis segar dengan gula aren asli. Minuman tradisional yang menyegarkan.',
                  price: 8000,
                  stock: 100,
                  category: 'Makanan & Minuman',
                  images: ['https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop']
                },
                {
                  name: 'Kopi Arabica Aceh',
                  description: 'Kopi arabica premium dari dataran tinggi Aceh. Aroma dan rasa yang khas dengan keasaman yang seimbang.',
                  price: 35000,
                  stock: 25,
                  category: 'Makanan & Minuman',
                  images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop']
                },
                {
                  name: 'Bakso Malang',
                  description: 'Bakso daging sapi asli dengan kuah kaldu yang gurih. Dilengkapi dengan mie, tahu, dan sayuran.',
                  price: 22000,
                  stock: 45,
                  category: 'Makanan & Minuman',
                  images: ['https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop']
                },
                {
                  name: 'Pisang Goreng Crispy',
                  description: 'Pisang goreng dengan tepung crispy yang renyah. Cocok untuk camilan sore hari.',
                  price: 15000,
                  stock: 80,
                  category: 'Makanan & Minuman',
                  images: ['https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=400&h=400&fit=crop']
                },

                // Elektronik
                {
                  name: 'Smartphone Samsung Galaxy A54',
                  description: 'Smartphone Android dengan kamera 50MP, RAM 8GB, storage 256GB. Performa tinggi untuk kebutuhan sehari-hari.',
                  price: 4500000,
                  stock: 15,
                  category: 'Elektronik',
                  images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop']
                },
                {
                  name: 'Laptop ASUS VivoBook',
                  description: 'Laptop dengan processor Intel Core i5, RAM 8GB, SSD 512GB. Cocok untuk kerja dan multimedia.',
                  price: 8500000,
                  stock: 8,
                  category: 'Elektronik',
                  images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop']
                },
                {
                  name: 'Headphone Sony WH-1000XM4',
                  description: 'Headphone wireless dengan noise cancelling terbaik. Kualitas suara premium untuk audiophile.',
                  price: 3200000,
                  stock: 12,
                  category: 'Elektronik',
                  images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop']
                },
                {
                  name: 'Smart TV LG 43 inch',
                  description: 'Smart TV 4K dengan WebOS, HDR support, dan koneksi WiFi. Pengalaman menonton yang memukau.',
                  price: 5500000,
                  stock: 6,
                  category: 'Elektronik',
                  images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop']
                },
                {
                  name: 'Kamera Canon EOS M50',
                  description: 'Kamera mirrorless 24MP dengan video 4K, WiFi, dan touchscreen. Ideal untuk content creator.',
                  price: 7800000,
                  stock: 5,
                  category: 'Elektronik',
                  images: ['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=400&fit=crop']
                },
                {
                  name: 'Power Bank Xiaomi 20000mAh',
                  description: 'Power bank kapasitas besar dengan fast charging 18W. Cocok untuk traveling dan aktivitas outdoor.',
                  price: 350000,
                  stock: 50,
                  category: 'Elektronik',
                  images: ['https://images.unsplash.com/photo-1609592806596-4d1b5e5e0e0e?w=400&h=400&fit=crop']
                },

                // Fashion
                {
                  name: 'Kemeja Batik Pria',
                  description: 'Kemeja batik premium dengan motif tradisional Indonesia. Bahan katun halus dan nyaman dipakai.',
                  price: 180000,
                  stock: 25,
                  category: 'Fashion',
                  images: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&h=400&fit=crop']
                },
                {
                  name: 'Dress Wanita Casual',
                  description: 'Dress casual dengan bahan jersey yang nyaman. Cocok untuk acara santai dan hangout.',
                  price: 150000,
                  stock: 30,
                  category: 'Fashion',
                  images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=400&fit=crop']
                },
                {
                  name: 'Sepatu Sneakers Adidas',
                  description: 'Sepatu sneakers dengan teknologi Boost untuk kenyamanan maksimal. Cocok untuk olahraga dan casual.',
                  price: 1200000,
                  stock: 20,
                  category: 'Fashion',
                  images: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop']
                },
                {
                  name: 'Tas Ransel Laptop',
                  description: 'Tas ransel dengan kompartemen laptop 15 inch, anti air, dan desain ergonomis.',
                  price: 250000,
                  stock: 35,
                  category: 'Fashion',
                  images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop']
                },
                {
                  name: 'Jaket Hoodie Unisex',
                  description: 'Jaket hoodie dengan bahan fleece yang hangat dan nyaman. Tersedia berbagai warna.',
                  price: 120000,
                  stock: 40,
                  category: 'Fashion',
                  images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop']
                },
                {
                  name: 'Celana Jeans Slim Fit',
                  description: 'Celana jeans dengan potongan slim fit yang modern. Bahan denim berkualitas tinggi.',
                  price: 200000,
                  stock: 28,
                  category: 'Fashion',
                  images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop']
                },

                // Kesehatan & Kecantikan
                {
                  name: 'Serum Vitamin C',
                  description: 'Serum wajah dengan vitamin C untuk mencerahkan dan melindungi kulit dari radikal bebas.',
                  price: 85000,
                  stock: 60,
                  category: 'Kesehatan & Kecantikan',
                  images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop']
                },
                {
                  name: 'Masker Wajah Aloe Vera',
                  description: 'Masker wajah dengan ekstrak aloe vera untuk melembabkan dan menenangkan kulit.',
                  price: 45000,
                  stock: 80,
                  category: 'Kesehatan & Kecantikan',
                  images: ['https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=400&h=400&fit=crop']
                },
                {
                  name: 'Suplemen Vitamin D3',
                  description: 'Suplemen vitamin D3 untuk menjaga kesehatan tulang dan meningkatkan imunitas tubuh.',
                  price: 120000,
                  stock: 45,
                  category: 'Kesehatan & Kecantikan',
                  images: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop']
                },
                {
                  name: 'Parfum Unisex Fresh',
                  description: 'Parfum dengan aroma segar dan tahan lama. Cocok untuk pria dan wanita.',
                  price: 180000,
                  stock: 25,
                  category: 'Kesehatan & Kecantikan',
                  images: ['https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop']
                },

                // Rumah Tangga
                {
                  name: 'Rice Cooker Miyako 1.8L',
                  description: 'Rice cooker dengan kapasitas 1.8 liter, anti lengket, dan hemat listrik. Cocok untuk keluarga kecil.',
                  price: 350000,
                  stock: 20,
                  category: 'Rumah Tangga',
                  images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop']
                },
                {
                  name: 'Blender Philips 2L',
                  description: 'Blender dengan kapasitas 2 liter, motor kuat, dan pisau stainless steel. Ideal untuk membuat jus dan smoothie.',
                  price: 450000,
                  stock: 15,
                  category: 'Rumah Tangga',
                  images: ['https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400&h=400&fit=crop']
                },
                {
                  name: 'Set Panci Stainless Steel',
                  description: 'Set panci 5 pieces dari stainless steel berkualitas tinggi. Tahan lama dan mudah dibersihkan.',
                  price: 650000,
                  stock: 12,
                  category: 'Rumah Tangga',
                  images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop']
                },
                {
                  name: 'Vacuum Cleaner Portable',
                  description: 'Vacuum cleaner portable dengan daya hisap kuat. Cocok untuk membersihkan mobil dan area sempit.',
                  price: 280000,
                  stock: 18,
                  category: 'Rumah Tangga',
                  images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop']
                },

                // Olahraga
                {
                  name: 'Matras Yoga Premium',
                  description: 'Matras yoga dengan bahan NBR yang empuk dan anti slip. Cocok untuk yoga dan pilates.',
                  price: 150000,
                  stock: 30,
                  category: 'Olahraga',
                  images: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop']
                },
                {
                  name: 'Dumbbell Set 10kg',
                  description: 'Set dumbbell dengan total berat 10kg. Cocok untuk latihan kekuatan di rumah.',
                  price: 320000,
                  stock: 15,
                  category: 'Olahraga',
                  images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop']
                },
                {
                  name: 'Sepeda Lipat 20 inch',
                  description: 'Sepeda lipat dengan roda 20 inch, ringan dan mudah dibawa. Cocok untuk transportasi sehari-hari.',
                  price: 2500000,
                  stock: 8,
                  category: 'Olahraga',
                  images: ['https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=400&fit=crop']
                },
                {
                  name: 'Raket Badminton Yonex',
                  description: 'Raket badminton profesional dengan teknologi terdepan. Cocok untuk pemain intermediate hingga advanced.',
                  price: 850000,
                  stock: 12,
                  category: 'Olahraga',
                  images: ['https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&h=400&fit=crop']
                },

                // Buku & Alat Tulis
                {
                  name: 'Novel Bestseller Indonesia',
                  description: 'Novel karya penulis Indonesia terbaik dengan cerita yang menarik dan menginspirasi.',
                  price: 75000,
                  stock: 50,
                  category: 'Buku & Alat Tulis',
                  images: ['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop']
                },
                {
                  name: 'Set Pensil Warna 48 Warna',
                  description: 'Set pensil warna dengan 48 warna berbeda. Cocok untuk menggambar dan mewarnai.',
                  price: 120000,
                  stock: 25,
                  category: 'Buku & Alat Tulis',
                  images: ['https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=400&fit=crop']
                },
                {
                  name: 'Notebook A5 Premium',
                  description: 'Notebook dengan kertas berkualitas tinggi dan cover yang elegan. Cocok untuk journaling dan note taking.',
                  price: 85000,
                  stock: 40,
                  category: 'Buku & Alat Tulis',
                  images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop']
                },
                {
                  name: 'Kalkulator Scientific',
                  description: 'Kalkulator scientific dengan fungsi lengkap untuk perhitungan matematika dan sains.',
                  price: 150000,
                  stock: 20,
                  category: 'Buku & Alat Tulis',
                  images: ['https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=400&fit=crop']
                },

                // Mainan & Hobi
                {
                  name: 'LEGO Classic Creative Bricks',
                  description: 'Set LEGO dengan berbagai bentuk dan warna untuk mengembangkan kreativitas anak.',
                  price: 450000,
                  stock: 15,
                  category: 'Mainan & Hobi',
                  images: ['https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400&h=400&fit=crop']
                },
                {
                  name: 'Puzzle 1000 Pieces',
                  description: 'Puzzle dengan 1000 pieces bergambar pemandangan indah. Cocok untuk melatih kesabaran dan konsentrasi.',
                  price: 85000,
                  stock: 30,
                  category: 'Mainan & Hobi',
                  images: ['https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400&h=400&fit=crop']
                },
                {
                  name: 'Drone Mini Camera',
                  description: 'Drone mini dengan kamera HD untuk aerial photography. Mudah dikontrol dan cocok untuk pemula.',
                  price: 1200000,
                  stock: 8,
                  category: 'Mainan & Hobi',
                  images: ['https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&h=400&fit=crop']
                },
                {
                  name: 'Set Cat Air 24 Warna',
                  description: 'Set cat air dengan 24 warna cerah dan kuas. Cocok untuk melukis dan berkarya seni.',
                  price: 95000,
                  stock: 35,
                  category: 'Mainan & Hobi',
                  images: ['https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=400&fit=crop']
                }
              ];

              let successCount = 0;
              let errorCount = 0;

              for (const productData of sampleProducts) {
                try {
                  const storeInfo = {
                    storeName: user?.storeName || user?.name || 'Toko Tidak Diketahui',
                    city: user?.city || '',
                    address: user?.address || '',
                    phone: user?.phone || ''
                  };

                  const newProductData = {
                    name: productData.name,
                    description: productData.description,
                    price: productData.price,
                    stock: productData.stock,
                    category: productData.category,
                    images: productData.images,
                    imageUrl: productData.images[0] // Backward compatibility
                  };

                  const result = await productService.addProduct(
                    newProductData,
                    user.id,
                    storeInfo
                  );

                  if (result.success) {
                    successCount++;
                  } else {
                    errorCount++;
                    console.error('Error adding product:', productData.name, result.error);
                  }
                } catch (error) {
                  errorCount++;
                  console.error('Error adding product:', productData.name, error);
                }
              }

              // Reload products after generation
              await loadProducts();

              Alert.alert(
                'Generate Selesai',
                `Berhasil menambahkan ${successCount} produk.\n${errorCount > 0 ? `Gagal: ${errorCount} produk.` : ''}`
              );

            } catch (error) {
              console.error('Error generating products:', error);
              Alert.alert('Error', 'Terjadi kesalahan saat generate produk');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const toggleProductStatus = (productId) => {
    setProducts(products.map(product => 
      product.id === productId 
        ? { ...product, status: product.status === 'active' ? 'inactive' : 'active' }
        : product
    ));
  };

  const renderProductItem = ({ item }) => (
    <View style={styles.productCard}>
      <Image 
        source={{ 
          uri: item.images && item.images.length > 0 
            ? item.images[0] 
            : (item.imageUrl || item.image) 
        }} 
        style={styles.productImage} 
      />
      
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={3}>{item.name}</Text>
        <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
        <Text style={styles.stockText}>Stok: {item.stock}</Text>
      </View>

      <View style={styles.actionButtonsRow}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditProduct(item)}
        >
          <Text style={styles.editButtonText}>EDIT</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteProduct(item.id)}
        >
          <Text style={styles.deleteButtonText}>HAPUS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyProducts = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="package-variant-closed" size={80} color={COLORS.textLight} />
      <Text style={styles.emptyTitle}>
        {products.length === 0 ? 'Belum Ada Produk' : `Tidak Ada Produk di Kategori "${selectedCategory}"`}
      </Text>
      <Text style={styles.emptySubtitle}>
        {products.length === 0 
          ? 'Mulai jual produk Anda dengan\nmenambahkan produk pertama'
          : `Tidak ada produk yang ditemukan\ndi kategori ${selectedCategory}`
        }
      </Text>
      {products.length === 0 && (
        <TouchableOpacity
          style={styles.addFirstProductButton}
          onPress={handleAddProduct}
        >
          <Text style={styles.addFirstProductText}>Tambah Produk</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Produk Saya</Text>
      </View>

      {/* Categories Filter */}
      {renderCategoriesFilter()}

      {/* Products List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Memuat produk...</Text>
        </View>
      ) : filteredProducts.length === 0 ? (
        renderEmptyProducts()
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.productsList}
          columnWrapperStyle={styles.row}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* FAB - Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddProduct}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={28} color={COLORS.card} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.card,
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  categoriesContainer: {
    backgroundColor: COLORS.card,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  categoriesTitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  categoriesList: {
    paddingRight: SPACING.lg,
  },
  categoryButton: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryButtonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  productsList: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
  },
  productCard: {
    backgroundColor: COLORS.card,
    width: '48%',
    marginVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  productInfo: {
    marginBottom: SPACING.xs,
    flex: 1,
  },
  productName: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs, // Kembali normal
    lineHeight: 18,
    flex: 1,
  },
  productPrice: {
    ...TYPOGRAPHY.body1,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  stockText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  statusRow: {
    marginBottom: SPACING.sm,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.xs,
    alignSelf: 'flex-start',
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.card,
    fontWeight: '600',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.xs,
  },
  editButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.xs,
    alignItems: 'center',
  },
  editButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.xs,
    alignItems: 'center',
  },
  deleteButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: 'bold',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  addFirstProductButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  addFirstProductText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.card,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  loadingText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },


  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

export default SellerProductsScreen;