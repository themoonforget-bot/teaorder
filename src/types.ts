import { Timestamp } from 'firebase/firestore';

export interface Product {
  id: string;
  name: string;
  category: string;
  prices: {
    M: number;
    L: number;
  };
  description?: string;
  imageUrl?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  size: 'M' | 'L';
  sugar: string;
  ice: string;
  price: number;
  quantity: number;
}

export type OrderStatus = 'pending' | 'preparing' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  customerName: string;
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const SUGAR_LEVELS = ['全糖', '少糖', '半糖', '微糖', '無糖'];
export const ICE_LEVELS = ['正常', '少冰', '微冰', '去冰'];
