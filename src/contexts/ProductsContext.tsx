import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './AuthContext';

export type Product = {
  id: number;
  name: string;
  category: string;
  mark?: string;
  barcode?: string;
  price: number;
  price_sale?: number;
  stock: number;
  deleted_at?: string | null;
  is_customizable?: boolean;
  type?: string;
  color?: string;
};

interface ProductsContextType {
  products: Product[];
  loading: boolean;
  refetch: () => Promise<void>;
  lowStockProducts: Product[];
  categories: string[];
  brands: string[];
}

const CRITICAL_STOCK_THRESHOLD = 10;

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const ProductsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .is('deleted_at', null)
      .order('name', { ascending: true });
    if (!error && data) {
      setProducts(data as Product[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setProducts([]);
      setLoading(false);
      return;
    }

    fetchProducts();

    const channel = supabase
      .channel('products-global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchProducts]);

  const lowStockProducts = products.filter(p => p.stock <= CRITICAL_STOCK_THRESHOLD);
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];
  const brands = Array.from(new Set(products.map(p => p.mark).filter(Boolean))) as string[];

  return (
    <ProductsContext.Provider value={{ products, loading, refetch: fetchProducts, lowStockProducts, categories, brands }}>
      {children}
    </ProductsContext.Provider>
  );
};

export function useProducts() {
  const context = useContext(ProductsContext);
  if (context === undefined) {
    throw new Error('useProducts deve ser usado dentro de ProductsProvider');
  }
  return context;
}
