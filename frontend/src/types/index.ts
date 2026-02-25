export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'CUSTOMER' | 'ADMIN';
}

export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  manufacturer?: string;
  price: number;
  stockQuantity: number;
  category: Category;
  subCategory?: SubCategory;
  imageUrls?: string[];
  expiryDate?: string;
  isPrescriptionRequired: boolean;
  createdAt: string;
  updatedAt: string;
  isBundleOffer: boolean;
  bundleBuyQuantity?: number;
  bundleFreeQuantity?: number;
  bundlePrice?: number;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  slug: string;
}

export interface SubCategory {
  id: number;
  name: string;
  description: string;
  slug: string;
  categoryId: number;
}

export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
}

export interface Cart {
  id: number;
  items: CartItem[];
  createdAt: string;
}

export interface OrderItem {
  id: number;
  product: Product;
  quantity: number;
  price: number;
  freeQuantity?: number;
  subtotal: number;
}

export interface Order {
  id: number;
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: string;
  orderDate: string;
  deliveryDate?: string;
  orderItems: OrderItem[];
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId?: string;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentMethod = 'COD' | 'ONLINE';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface Address {
  id: number;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  default: boolean;
}
