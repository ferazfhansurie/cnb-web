import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  addDoc, 
  updateDoc, 
  arrayUnion, 
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { Product, Category, Promotion, UserData } from '@/types';

export type UserRole = 'Admin' | 'Manager' | 'User - Price' | 'User - No Price' | 'Pending';

const firebaseConfig = {
  apiKey: 'AIzaSyB558CviT50ttHxIeSVROTEpxhu_h8Wias',
  authDomain: 'cnb-app-f2ed6.firebaseapp.com',
  databaseURL: 'https://cnb-app-f2ed6.firebaseio.com',
  projectId: 'cnb-app-f2ed6',
  storageBucket: 'cnb-app-f2ed6.firebasestorage.app',
  messagingSenderId: '465463891466',
  appId: '1:465463891466:ios:91389050378e1701b9f1f3',
} as const;

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Collections
export const usersCollection = collection(db, 'users');
export const productsCollection = collection(db, 'products');
export const categoriesCollection = collection(db, 'categories');
export const promotionsCollection = collection(db, 'promotions');

// Product functions
export async function createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
  const productRef = doc(productsCollection);
  const timestamp = new Date();
  
  await setDoc(productRef, {
    id: productRef.id,
    ...productData,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export async function updateProduct(productId: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>) {
  const productRef = doc(productsCollection, productId);
  const timestamp = new Date();
  
  await updateDoc(productRef, {
    ...productData,
    updatedAt: timestamp,
  });
}

export async function deleteProduct(productId: string) {
  const productRef = doc(productsCollection, productId);
  const product = await getDoc(productRef);
  const productData = product.data() as Product;

  // Delete product images from storage
  if (productData.images) {
    for (const imageUrl of productData.images) {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    }
  }

  await deleteDoc(productRef);
}

export async function getAllProducts() {
  const querySnapshot = await getDocs(productsCollection);
  return querySnapshot.docs.map(doc => doc.data() as Product);
}

export async function getProductById(id: string) {
  const productDoc = doc(productsCollection, id);
  const productSnapshot = await getDoc(productDoc);
  
  if (productSnapshot.exists()) {
    return productSnapshot.data() as Product;
  }
  return null;
}

// Category functions
export async function createCategory(name: string, parentCategoryId?: string, parentSubcategoryId?: string) {
  try {
    if (!parentCategoryId) {
      // Get all categories to determine the next order value
      const querySnapshot = await getDocs(categoriesCollection);
      const categories = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Category));
      const maxOrder = categories.reduce((max, cat) => Math.max(max, cat.order || 0), -1);
      
      const newCategory = {
        name,
        subCategories: [],
        order: maxOrder + 1,
        createdAt: new Date(),
      };
      const docRef = await addDoc(categoriesCollection, newCategory);
      return docRef.id;
    }

    const categoryRef = doc(categoriesCollection, parentCategoryId);
    const categorySnap = await getDoc(categoryRef);
    const category = categorySnap.data() as Category;

    if (!parentSubcategoryId) {
      // Find the max order in subcategories
      const maxSubOrder = category.subCategories.reduce(
        (max, subCat) => Math.max(max, subCat.order || 0), 
        -1
      );
      
      const newSubCategory = {
        id: Date.now().toString(),
        name,
        order: maxSubOrder + 1,
        subCategories: []
      };
      await updateDoc(categoryRef, {
        subCategories: arrayUnion(newSubCategory)
      });
      return newSubCategory.id;
    }

    const parentSubCategory = category.subCategories.find(
      subCat => subCat.id === parentSubcategoryId
    );
    
    if (!parentSubCategory) {
      throw new Error("Parent subcategory not found");
    }
    
    // Find the max order in sub-subcategories
    const maxSubSubOrder = (parentSubCategory.subCategories || []).reduce(
      (max, subSubCat) => Math.max(max, subSubCat.order || 0), 
      -1
    );
    
    const updatedSubCategories = category.subCategories.map(subCat => {
      if (subCat.id === parentSubcategoryId) {
        return {
          ...subCat,
          subCategories: [
            ...(subCat.subCategories || []),
            {
              id: Date.now().toString(),
              name,
              order: maxSubSubOrder + 1,
              subCategories: []
            }
          ]
        };
      }
      return subCat;
    });

    await updateDoc(categoryRef, {
      subCategories: updatedSubCategories
    });
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
}

export async function getAllCategories() {
  const querySnapshot = await getDocs(categoriesCollection);
  const categories = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as Category));
  
  // Sort categories by order if it exists
  return categories.sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function deleteCategory(categoryId: string) {
  try {
    const productsSnapshot = await getDocs(
      query(productsCollection, where('category', '==', categoryId))
    );
    
    const batch = writeBatch(db);
    productsSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { 
        category: null,
        subcategory: null,
        subsubcategory: null
      });
    });
    
    batch.delete(doc(categoriesCollection, categoryId));
    await batch.commit();
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
}

export async function updateCategory(categoryId: string, updateData: Partial<Omit<Category, 'id' | 'createdAt'>>) {
  const categoryRef = doc(categoriesCollection, categoryId);
  await updateDoc(categoryRef, {
    ...updateData,
    updatedAt: new Date()
  });
}

// Promotion functions
export async function createPromotion(promotionData: Omit<Promotion, 'id' | 'createdAt' | 'updatedAt'>) {
  const promotionRef = doc(promotionsCollection);
  const timestamp = new Date();
  
  await setDoc(promotionRef, {
    id: promotionRef.id,
    ...promotionData,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export async function getAllPromotions() {
  const querySnapshot = await getDocs(promotionsCollection);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    startDate: doc.data().startDate?.toDate() || new Date(),
    endDate: doc.data().endDate?.toDate() || new Date(),
  } as Promotion));
}

export async function deletePromotion(promotionId: string) {
  const promotionRef = doc(promotionsCollection, promotionId);
  const promotion = await getDoc(promotionRef);
  const promotionData = promotion.data() as Promotion;

  // Delete promotion images from storage if they exist
  if (promotionData.images) {
    for (const imageUrl of promotionData.images) {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    }
  }

  await deleteDoc(promotionRef);
}

export async function updatePromotion(promotionId: string, promotionData: Partial<Omit<Promotion, 'id' | 'createdAt' | 'updatedAt'>>) {
  const promotionRef = doc(promotionsCollection, promotionId);
  const timestamp = new Date();
  
  await updateDoc(promotionRef, {
    ...promotionData,
    updatedAt: timestamp,
  });
}

// Image upload function
export async function uploadImage(file: File): Promise<string> {
  const storageRef = ref(storage, `images/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

// User functions
export async function getAllUsers() {
  const querySnapshot = await getDocs(usersCollection);
  return querySnapshot.docs.map(doc => ({
    uid: doc.id,
    ...doc.data(),
  } as UserData));
}

export async function updateUserRole(userId: string, newRole: 'Admin' | 'Manager' | 'User - Price' | 'User - No Price' | 'Pending') {
  const userRef = doc(usersCollection, userId);
  const timestamp = new Date();
  
  await updateDoc(userRef, {
    role: newRole,
    updatedAt: timestamp,
  });
}

export async function deleteUser(userId: string) {
  try {
    // Ensure we're not trying to delete ourselves
    if (userId === auth.currentUser?.uid) {
      throw new Error('Cannot delete your own account');
    }

    // Get admin user's role first
    const adminUserDoc = await getDoc(doc(usersCollection, auth.currentUser?.uid));
    const adminUserData = adminUserDoc.data();
    
    if (!adminUserData || adminUserData.role !== 'Admin') {
      throw new Error('Only administrators can delete users');
    }

    // Get the user document first to verify it exists
    const userRef = doc(usersCollection, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found in Firestore');
    }

    // Call the deleteUser Cloud Function
    const deleteUserFunctionUrl = `https://us-central1-${firebaseConfig.projectId}.cloudfunctions.net/deleteUserFunction`;
    const idToken = await auth.currentUser?.getIdToken(true);
    
    if (!idToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(deleteUserFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete user: ${response.statusText}`);
    }

    // If the cloud function was successful, delete from Firestore
    await deleteDoc(userRef);

  } catch (error: any) {
    console.error("Delete user error:", error);
    throw error;
  }
}

export async function updateUser(userId: string, data: { name?: string; email?: string }) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

export { app, auth, db, storage }; 