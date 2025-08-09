import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

class PasswordResetService {
  // Generate random reset code (6 digit)
  static generateResetCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Find user by email across all user types (users, sellers, admins)
  static async findUserByEmail(email) {
    const collections = ['users', 'sellers', 'admins']; // Ecommerce user types
    
    for (const collectionName of collections) {
      try {
        const q = query(
          collection(db, collectionName),
          where('email', '==', email)
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          return {
            id: userDoc.id,
            data: userDoc.data(),
            userType: collectionName
          };
        }
      } catch (error) {
        console.error(`Error searching in ${collectionName}:`, error);
      }
    }
    
    return null;
  }

  // Save reset request to database
  static async saveResetRequest(userId, userType, email, resetCode) {
    try {
      const resetRequest = {
        userId,
        userType,
        email,
        resetCode,
        createdAt: serverTimestamp(),
        used: false,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      };

      const docRef = await addDoc(collection(db, 'passwordResets'), resetRequest);
      return docRef.id;
    } catch (error) {
      console.error('Error saving reset request:', error);
      throw error;
    }
  }

  // Send reset code (simulation - displays code directly for demo)
  static async sendResetCode(email, resetCode, userName) {
    try {
      // For demo purposes, we'll display the code directly
      // In production, integrate with email service (SendGrid, AWS SES, etc.)
      console.log(`Reset code for ${email}: ${resetCode}`);
      
      return { 
        success: true, 
        message: `Kode reset password telah digenerate untuk ${userName}`,
        resetCode: resetCode // For demo - remove in production
      };
    } catch (error) {
      console.error('Error generating reset code:', error);
      return { 
        success: false, 
        message: 'Terjadi kesalahan saat menggenerate kode reset'
      };
    }
  }

  // Verify reset code
  static async verifyResetCode(email, resetCode) {
    try {
      const q = query(
        collection(db, 'passwordResets'),
        where('email', '==', email),
        where('resetCode', '==', resetCode),
        where('used', '==', false)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return { success: false, message: 'Kode reset tidak valid atau sudah digunakan' };
      }

      const resetDoc = querySnapshot.docs[0];
      const resetData = resetDoc.data();
      
      // Check if code is expired
      const now = new Date();
      const expiresAt = resetData.expiresAt.toDate();
      
      if (now > expiresAt) {
        return { success: false, message: 'Kode reset sudah kadaluarsa' };
      }

      return { 
        success: true, 
        resetId: resetDoc.id,
        userId: resetData.userId,
        userType: resetData.userType
      };
    } catch (error) {
      console.error('Error verifying reset code:', error);
      return { success: false, message: 'Terjadi kesalahan saat memverifikasi kode' };
    }
  }

  // Update password
  static async updatePassword(userId, userType, newPassword, resetId) {
    try {
      // Update user password in respective collection
      const userRef = doc(db, userType, userId);
      await updateDoc(userRef, {
        password: newPassword,
        updatedAt: serverTimestamp()
      });

      // Mark reset request as used
      if (resetId) {
        const resetRef = doc(db, 'passwordResets', resetId);
        await updateDoc(resetRef, {
          used: true,
          usedAt: serverTimestamp()
        });
      }

      return { success: true, message: 'Password berhasil diperbarui' };
    } catch (error) {
      console.error('Error updating password:', error);
      return { success: false, message: 'Gagal memperbarui password' };
    }
  }

  // Complete password reset process - Step 1: Request reset code
  static async requestPasswordReset(email) {
    try {
      // Find user by email across all collections
      const user = await this.findUserByEmail(email);
      
      if (!user) {
        return { success: false, message: 'Email tidak ditemukan dalam sistem' };
      }

      // Generate reset code
      const resetCode = this.generateResetCode();
      
      // Save reset request to database
      await this.saveResetRequest(user.id, user.userType, email, resetCode);
      
      // Send reset code (demo version shows code)
      const codeResult = await this.sendResetCode(
        email, 
        resetCode, 
        user.data.name || user.data.username || user.data.storeName || 'User'
      );

      return codeResult;
    } catch (error) {
      console.error('Error requesting password reset:', error);
      return { success: false, message: 'Terjadi kesalahan saat memproses permintaan' };
    }
  }

  // Reset password with code - Step 3: Final reset
  static async resetPasswordWithCode(email, resetCode, newPassword) {
    try {
      // Verify reset code
      const verification = await this.verifyResetCode(email, resetCode);
      
      if (!verification.success) {
        return verification;
      }

      // Update password
      const result = await this.updatePassword(
        verification.userId,
        verification.userType,
        newPassword,
        verification.resetId
      );

      return result;
    } catch (error) {
      console.error('Error resetting password:', error);
      return { success: false, message: 'Terjadi kesalahan saat mereset password' };
    }
  }
}

export default PasswordResetService;