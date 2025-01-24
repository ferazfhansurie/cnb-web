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
  writeBatch 
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { Product, Category, Promotion, UserData } from '@/types';

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
      const newCategory = {
        name,
        subCategories: [],
        createdAt: new Date(),
      };
      const docRef = await addDoc(categoriesCollection, newCategory);
      return docRef.id;
    }

    const categoryRef = doc(categoriesCollection, parentCategoryId);
    const categorySnap = await getDoc(categoryRef);
    const category = categorySnap.data() as Category;

    if (!parentSubcategoryId) {
      const newSubCategory = {
        id: Date.now().toString(),
        name,
        subCategories: []
      };
      await updateDoc(categoryRef, {
        subCategories: arrayUnion(newSubCategory)
      });
      return newSubCategory.id;
    }

    const updatedSubCategories = category.subCategories.map(subCat => {
      if (subCat.id === parentSubcategoryId) {
        return {
          ...subCat,
          subCategories: [
            ...(subCat.subCategories || []),
            {
              id: Date.now().toString(),
              name,
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
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as Category));
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

export { app, auth, db, storage }; 