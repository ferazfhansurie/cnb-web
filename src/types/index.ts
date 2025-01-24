export interface UserData {
  uid: string;
  email: string;
  name: string;
  companyName: string;
  fullName: string;
  role: 'user' | 'admin' | 'manager';
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string | null;
  subcategory: string | null;
  subsubcategory: string | null;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  subCategories: Array<{
    id: string;
    name: string;
    subCategories?: Array<{
      id: string;
      name: string;
      subCategories?: Array<{
        id: string;
        name: string;
      }>;
    }>;
  }>;
  createdAt: Date;
}

export interface Promotion {
  id?: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startDate: Date;
  endDate: Date;
  minimumPurchase: number;
  active: boolean;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
  images?: string[];
  productId: string;
} 