export type User = {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  category_id?: string;
};
