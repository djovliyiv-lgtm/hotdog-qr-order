export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
}

export interface Table {
  id: number;
  number: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  quantity: number;
  price: number;
  name?: string;
}

export interface Order {
  id: number;
  table_id: number;
  table_number?: string;
  status: 'pending' | 'preparing' | 'completed' | 'cancelled';
  payment_method: 'cash' | 'card';
  is_paid: boolean;
  total_price: number;
  created_at: string;
  items: OrderItem[];
}

export interface CartItem extends MenuItem {
  quantity: number;
}
