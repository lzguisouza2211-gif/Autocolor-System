import React, { useState } from 'react';
import { supabase } from '../supabase';

interface ProductFormProps {
  product?: any;
  onSave: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onSave }) => {
  const [form, setForm] = useState({
    name: product?.name || '',
    category: product?.category || '',
    mark: product?.mark || '',
    price: product?.price || '',
    venda: product?.venda || '',
    stock: product?.stock || '',
    price_sale: product?.price_sale || '',
    barcode: product?.barcode || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [brands, setBrands] = useState<string[]>([]);
  const [newBrand, setNewBrand] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [isRestocking, setIsRestocking] = useState(false);
  const [existingProduct, setExistingProduct] = useState<any>(null);
  const [restockQuantity, setRestockQuantity] = useState('1');

  React.useEffect(() => {
    const fetchCategoriesAndBrands = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('category, mark');
      if (!error && data) {
        const uniqueCats = Array.from(new Set(data.map((p: any) => p.category).filter(Boolean)));
        setCategories(uniqueCats);
        const uniqueBrands = Array.from(new Set(data.map((p: any) => p.mark).filter(Boolean)));
        setBrands(uniqueBrands);
      }
    };
    fetchCategoriesAndBrands();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const checkBarcodeExists = async (barcode: string) => {
    if (!barcode) return;
    const { data: existing, error } = await supabase
      .from('products')
      .select('*')
      .eq('barcode', barcode)
      .maybeSingle();
    if (!error && existing) {
      setIsRestocking(true);
      setExistingProduct(existing);
      setRestockQuantity('1');
    } else {
      setIsRestocking(false);
      setExistingProduct(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Se está em modo reabastecimento
      if (isRestocking && existingProduct) {
        const novoEstoque = Number(existingProduct.stock) + Number(restockQuantity);
        const { error: updateError } = await supabase.from('products').update({
          stock: novoEstoque
        }).eq('id', existingProduct.id).select();
        
        if (updateError) {
          console.error('Erro ao atualizar:', updateError);
          throw updateError;
        }
        
        console.log('Atualização bem sucedida!');
        setSuccess('Reabastecimento realizado com sucesso!');
        setTimeout(() => {
          setSuccess(null);
          onSave();
        }, 1200);
        setLoading(false);
        return;
      }
      // Normalize all text fields to uppercase
      const normalizedName = form.name.toUpperCase();
      const normalizedCategory = (form.category === "__new__" ? newCategory : form.category).toUpperCase();
      const normalizedBrand = (form.mark === "__new__" ? newBrand : form.mark).toUpperCase();
      if (product) {
        // Update
        await supabase.from('products').update({
          name: normalizedName,
          category: normalizedCategory,
          mark: normalizedBrand,
          price: Number(form.price),
          price_sale: Number(form.price_sale),
          stock: Number(form.stock),
          barcode: form.barcode,
        }).eq('id', product.id);
      } else {
        // Insert
        await supabase.from('products').insert({
          name: normalizedName,
          category: normalizedCategory,
          mark: normalizedBrand,
          price: Number(form.price),
          price_sale: Number(form.price_sale),
          stock: Number(form.stock),
          barcode: form.barcode,
        });
      }
      setSuccess(product ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!');
      setTimeout(() => {
        setSuccess(null);
        onSave();
      }, 1200);
    } catch (err: any) {
      console.error('Erro ao salvar produto:', err);
      setError('Erro ao salvar produto: ' + (err?.message || 'desconhecido'));
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 p-3 sm:p-4 max-h-[80vh] overflow-y-auto">
      <div>
        <label className="block text-xs sm:text-sm font-medium mb-1">Código de Barras</label>
        <div className="flex gap-2">
          <input 
            name="barcode" 
            value={form.barcode} 
            onChange={e => {
              handleChange(e);
              checkBarcodeExists(e.target.value);
            }} 
            className="w-full border rounded px-3 py-2 text-sm" 
          />
        </div>
      </div>
      {isRestocking && existingProduct && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3 sm:p-4">
          <h3 className="font-bold text-blue-900 mb-2 text-sm sm:text-base">Modo Reabastecimento</h3>
          <p className="text-xs sm:text-sm text-blue-800 mb-2 sm:mb-3">
            Produto: <span className="font-medium">{existingProduct.name}</span>
          </p>
          <p className="text-xs sm:text-sm text-blue-800 mb-2 sm:mb-3">
            Estoque atual: <span className="font-medium">{existingProduct.stock} unidades</span>
          </p>
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1">Quantidade a adicionar</label>
            <input 
              type="number" 
              value={restockQuantity} 
              onChange={e => setRestockQuantity(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm" 
              required 
              min="1"
            />
          </div>
        </div>
      )}
      {!isRestocking && (
        <>
      <div>
        <label className="block text-xs sm:text-sm font-medium mb-1">Nome</label>
        <input name="name" value={form.name} onChange={handleChange} className="w-full border rounded px-3 py-2 text-sm" required />
      </div>
      <div>
        <label className="block text-xs sm:text-sm font-medium mb-1">Categoria</label>
        <select
          name="category"
          value={form.category}
          onChange={e => setForm({ ...form, category: e.target.value })}
          className="w-full border rounded px-3 py-2 mb-2 text-sm"
          required
        >
          <option value="">Selecione uma categoria</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
          <option value="__new__">Adicionar nova categoria...</option>
        </select>
        {form.category === "__new__" && (
          <input
            type="text"
            placeholder="Nova categoria"
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            className="w-full border rounded px-3 py-2 mt-2 text-sm"
            required
          />
        )}
      </div>
      <div>
        <label className="block text-xs sm:text-sm font-medium mb-1">Marca</label>
        <select
          name="mark"
          value={form.mark}
          onChange={e => setForm({ ...form, mark: e.target.value })}
          className="w-full border rounded px-3 py-2 mb-2 text-sm"
          required
        >
          <option value="">Selecione uma marca</option>
          {brands.map(brand => (
            <option key={brand} value={brand}>{brand}</option>
          ))}
          <option value="__new__">Adicionar nova marca...</option>
        </select>
        {form.mark === "__new__" && (
          <input
            type="text"
            placeholder="Nova marca"
            value={newBrand}
            onChange={e => setNewBrand(e.target.value)}
            className="w-full border rounded px-3 py-2 mt-2 text-sm"
            required
          />
        )}
      </div>
      <div>
        <label className="block text-xs sm:text-sm font-medium mb-1">Preço de Custo</label>
        <input name="price" type="number" value={form.price} onChange={handleChange} className="w-full border rounded px-3 py-2 text-sm" required />
      </div>
      <div>
        <label className="block text-xs sm:text-sm font-medium mb-1">Preço de Venda</label>
        <input name="price_sale" type="number" value={form.price_sale} onChange={handleChange} className="w-full border rounded px-3 py-2 text-sm" required />
      </div>
      <div>
        <label className="block text-xs sm:text-sm font-medium mb-1">Estoque (Quantidade)</label>
        <input name="stock" type="number" value={form.stock} onChange={handleChange} className="w-full border rounded px-3 py-2 text-sm" required min="0" />
      </div>
        </>
      )}
      {error && <div className="text-red-600 text-xs sm:text-sm">{error}</div>}
      {success && <div className="text-green-600 text-xs sm:text-sm mb-2">{success}</div>}
      <button type="submit" className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded text-sm font-medium hover:bg-indigo-700" disabled={loading || !!success}>
        {loading ? 'Salvando...' : 'Salvar'}
      </button>
    </form>
  );
};

export default ProductForm;
