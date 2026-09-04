export interface User {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  phone: string;
  role: number;
  create_time: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Category {
  id: number;
  name: string;
  sort: number;
}

export interface GoodsImage {
  id: number;
  image_url: string;
  sort: number;
}

export interface Goods {
  id: number;
  user_id: number;
  category_id: number;
  title: string;
  description: string;
  price: string | number;
  original_price: string | number | null;
  condition: number;
  status: number;
  create_time: string;
  images: GoodsImage[];
}

export interface GoodsListItem {
  id: number;
  title: string;
  price: string | number;
  original_price: string | number | null;
  condition: number;
  status: number;
  category_id: number;
  user_id: number;
  nickname: string;
  avatar: string;
  cover_image: string;
  create_time: string;
}

export interface PageResult<T> {
  total: number;
  page: number;
  page_size: number;
  records: T[];
}

export interface FavoriteItem {
  favorite_id: number;
  favorite_time: string;
  id: number;
  title: string;
  price: number;
  original_price: number | null;
  condition: number;
  status: number;
  cover_image: string;
}

export interface Order {
  id: number;
  order_no: string;
  goods_id: number;
  goods_title: string;
  goods_cover: string;
  seller_id: number;
  seller_name: string;
  buyer_id: number;
  buyer_name: string;
  price: string | number;
  status: number;
  create_time: string;
}

export interface ChatMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  is_read: number;
  create_time: string;
  is_self: boolean;
}

export interface Conversation {
  user_id: number;
  nickname: string;
  avatar: string;
  last_message: string;
  last_time: string;
  unread: number;
}
