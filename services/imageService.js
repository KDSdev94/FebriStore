import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export const imageService = {
  // Request permission for camera and media library
  async requestPermissions() {
    try {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
        Alert.alert(
          'Izin Diperlukan',
          'Aplikasi memerlukan izin untuk mengakses kamera dan galeri foto.'
        );
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  },

  // Show image picker options for profile picture
  async pickImage() {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      return new Promise((resolve) => {
        Alert.alert(
          'Pilih Foto Profil',
          'Pilih sumber foto profil',
          [
            { text: 'Batal', style: 'cancel', onPress: () => resolve(null) },
            { 
              text: 'Kamera', 
              onPress: async () => {
                const result = await this.openCamera();
                resolve(result);
              }
            },
            { 
              text: 'Galeri', 
              onPress: async () => {
                const result = await this.openGallery();
                resolve(result);
              }
            }
          ]
        );
      });
    } catch (error) {
      console.error('Error picking image:', error);
      return null;
    }
  },

  // Show image picker options for store image
  async pickStoreImage() {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      return new Promise((resolve) => {
        Alert.alert(
          'Pilih Foto Toko',
          'Pilih sumber foto toko (Anda dapat mengatur crop sesuka hati)',
          [
            { text: 'Batal', style: 'cancel', onPress: () => resolve(null) },
            { 
              text: 'Kamera', 
              onPress: async () => {
                const result = await this.openCameraForStore();
                resolve(result);
              }
            },
            { 
              text: 'Galeri', 
              onPress: async () => {
                const result = await this.openGalleryForStore();
                resolve(result);
              }
            }
          ]
        );
      });
    } catch (error) {
      console.error('Error picking store image:', error);
      return null;
    }
  },

  // Open camera for profile picture (circular)
  async openCamera(isSquare = false) {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: isSquare ? [1, 1] : [1, 1], // Keep 1:1 for both but different crop UI
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
      }
      
      return null;
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Error', 'Gagal membuka kamera');
      return null;
    }
  },

  // Open gallery for profile picture (circular)
  async openGallery(isSquare = false) {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: isSquare ? [1, 1] : [1, 1], // Keep 1:1 for both
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
      }
      
      return null;
    } catch (error) {
      console.error('Error opening gallery:', error);
      Alert.alert('Error', 'Gagal membuka galeri');
      return null;
    }
  },

  // Open camera for store image (square with flexible crop)
  async openCameraForStore() {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: undefined, // Allow free crop
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
      }
      
      return null;
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Error', 'Gagal membuka kamera');
      return null;
    }
  },

  // Open gallery for store image (square with flexible crop)
  async openGalleryForStore() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: undefined, // Allow free crop
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
      }
      
      return null;
    } catch (error) {
      console.error('Error opening gallery:', error);
      Alert.alert('Error', 'Gagal membuka galeri');
      return null;
    }
  },

  // Generate placeholder avatar URL (circular)
  generatePlaceholderAvatar(name, role = 'user') {
    const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
    const colors = {
      buyer: '4A90E2',
      seller: '50C878',
      admin: 'FF6B6B',
      user: '9B59B6'
    };
    const color = colors[role] || colors.user;
    return `https://ui-avatars.com/api/?name=${initials}&background=${color}&color=fff&size=200&rounded=true&bold=true`;
  },

  // Generate placeholder store image URL (square)
  generatePlaceholderStoreImage(name, role = 'seller') {
    const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'S';
    const colors = {
      seller: '50C878',
      store: '4A90E2'
    };
    const color = colors[role] || colors.seller;
    return `https://ui-avatars.com/api/?name=${initials}&background=${color}&color=fff&size=200&rounded=false&bold=true`;
  }
};