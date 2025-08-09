import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../firebaseConfig';
import { collection, setDoc, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import PasswordResetService from '../services/passwordResetService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        console.log('CheckAuthState - Loaded user with role:', parsedUser.role);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      // Cek user di Firestore
      const q = query(collection(db, 'users'), where('email', '==', email));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();
        if (userData.password === password) {
          // Pastikan userData memiliki id dari document ID
          const userWithId = {
            ...userData,
            id: userDoc.id
          };
          
          console.log('Login - User with role:', userWithId.role);
          await AsyncStorage.setItem('userData', JSON.stringify(userWithId));
          setUser(userWithId);
          return { success: true, user: userWithId };
        } else {
          return { success: false, error: 'Password salah' };
        }
      } else {
        return { success: false, error: 'Email tidak ditemukan' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Terjadi kesalahan saat login' };
    }
  };

  const register = async (userData) => {
    try {
      console.log('AuthContext - Register received data:', userData);
      
      // Cek apakah email sudah terdaftar
      const q = query(collection(db, 'users'), where('email', '==', userData.email));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        return { success: false, error: 'Email sudah terdaftar' };
      }

      // Buat user baru
      const userRef = doc(collection(db, 'users'));
      const newUser = {
        name: userData.fullName,
        fullName: userData.fullName, // Save as both for consistency
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        role: userData.role || 'buyer', // gunakan role dari form atau default buyer
        address: '', // Default empty address
        city: '', // Default empty city
        createdAt: new Date().toISOString(),
        isActive: true
      };

      console.log('AuthContext - Creating user with data:', newUser);

      await setDoc(userRef, newUser);
      
      const userWithId = {
        ...newUser,
        id: userRef.id
      };

      console.log('Register - User created with role:', userWithId.role);
      // Jangan langsung login setelah register
      // await AsyncStorage.setItem('userData', JSON.stringify(userWithId));
      // setUser(userWithId);
      
      return { success: true, user: userWithId };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: 'Terjadi kesalahan saat mendaftar' };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userData');
      setUser(null);
      // Don't handle navigation here, let the component handle it
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = async (updatedData) => {
    try {
      if (user) {
        const userRef = doc(db, 'users', user.id);
        await setDoc(userRef, updatedData, { merge: true });
        
        const updatedUser = { ...user, ...updatedData };
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        return { success: true };
      }
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, error: 'Gagal memperbarui profil' };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      if (!user) {
        return { success: false, error: 'User tidak ditemukan' };
      }

      // Verify current password
      if (user.password !== currentPassword) {
        return { success: false, error: 'Password saat ini tidak sesuai' };
      }

      // Update password in Firestore
      const userRef = doc(db, 'users', user.id);
      await setDoc(userRef, { password: newPassword }, { merge: true });
      
      // Update local user data
      const updatedUser = { ...user, password: newPassword };
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: 'Gagal mengubah password' };
    }
  };

  // Forgot Password functions
  const requestPasswordReset = async (email) => {
    try {
      const result = await PasswordResetService.requestPasswordReset(email);
      return result;
    } catch (error) {
      console.error('Request password reset error:', error);
      return { success: false, message: 'Terjadi kesalahan saat memproses permintaan' };
    }
  };

  const verifyResetCode = async (email, resetCode) => {
    try {
      const result = await PasswordResetService.verifyResetCode(email, resetCode);
      return result;
    } catch (error) {
      console.error('Verify reset code error:', error);
      return { success: false, message: 'Terjadi kesalahan saat memverifikasi kode' };
    }
  };

  const resetPasswordWithCode = async (email, resetCode, newPassword) => {
    try {
      const result = await PasswordResetService.resetPasswordWithCode(email, resetCode, newPassword);
      return result;
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, message: 'Terjadi kesalahan saat mereset password' };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    changePassword,
    requestPasswordReset,
    verifyResetCode,
    resetPasswordWithCode
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};