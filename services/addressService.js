import AsyncStorage from '@react-native-async-storage/async-storage';

const ADDRESSES_KEY = 'user_addresses';

export const addressService = {
  // Get all addresses for current user
  async getAddresses(userId) {
    try {
      const addressesData = await AsyncStorage.getItem(`${ADDRESSES_KEY}_${userId}`);
      return addressesData ? JSON.parse(addressesData) : [];
    } catch (error) {
      console.error('Error getting addresses:', error);
      return [];
    }
  },

  // Add new address
  async addAddress(userId, addressData) {
    try {
      const addresses = await this.getAddresses(userId);
      const newAddress = {
        id: Date.now().toString(),
        ...addressData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // If this is set as default, remove default from other addresses
      if (newAddress.isDefault) {
        addresses.forEach(addr => addr.isDefault = false);
      }

      // If this is the first address, make it default
      if (addresses.length === 0) {
        newAddress.isDefault = true;
      }

      addresses.push(newAddress);
      await AsyncStorage.setItem(`${ADDRESSES_KEY}_${userId}`, JSON.stringify(addresses));
      return newAddress;
    } catch (error) {
      console.error('Error adding address:', error);
      throw error;
    }
  },

  // Update existing address
  async updateAddress(userId, addressId, addressData) {
    try {
      const addresses = await this.getAddresses(userId);
      const addressIndex = addresses.findIndex(addr => addr.id === addressId);
      
      if (addressIndex === -1) {
        throw new Error('Address not found');
      }

      // If this is set as default, remove default from other addresses
      if (addressData.isDefault) {
        addresses.forEach(addr => addr.isDefault = false);
      }

      addresses[addressIndex] = {
        ...addresses[addressIndex],
        ...addressData,
        updatedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(`${ADDRESSES_KEY}_${userId}`, JSON.stringify(addresses));
      return addresses[addressIndex];
    } catch (error) {
      console.error('Error updating address:', error);
      throw error;
    }
  },

  // Delete address
  async deleteAddress(userId, addressId) {
    try {
      const addresses = await this.getAddresses(userId);
      const filteredAddresses = addresses.filter(addr => addr.id !== addressId);
      
      // If deleted address was default and there are other addresses, make first one default
      const deletedAddress = addresses.find(addr => addr.id === addressId);
      if (deletedAddress?.isDefault && filteredAddresses.length > 0) {
        filteredAddresses[0].isDefault = true;
      }

      await AsyncStorage.setItem(`${ADDRESSES_KEY}_${userId}`, JSON.stringify(filteredAddresses));
      return true;
    } catch (error) {
      console.error('Error deleting address:', error);
      throw error;
    }
  },

  // Get default address
  async getDefaultAddress(userId) {
    try {
      const addresses = await this.getAddresses(userId);
      return addresses.find(addr => addr.isDefault) || addresses[0] || null;
    } catch (error) {
      console.error('Error getting default address:', error);
      return null;
    }
  },

  // Set address as default
  async setDefaultAddress(userId, addressId) {
    try {
      const addresses = await this.getAddresses(userId);
      
      // Remove default from all addresses
      addresses.forEach(addr => addr.isDefault = false);
      
      // Set new default
      const targetAddress = addresses.find(addr => addr.id === addressId);
      if (targetAddress) {
        targetAddress.isDefault = true;
        targetAddress.updatedAt = new Date().toISOString();
      }

      await AsyncStorage.setItem(`${ADDRESSES_KEY}_${userId}`, JSON.stringify(addresses));
      return targetAddress;
    } catch (error) {
      console.error('Error setting default address:', error);
      throw error;
    }
  }
};