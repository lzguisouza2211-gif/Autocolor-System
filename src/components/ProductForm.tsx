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
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [brands, setBrands] = useState<string[]>([]);
  const [newBrand, setNewBrand] = useState('');
  const [success, setSuccess] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
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
        });
      }
      setSuccess(product ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!');
      setTimeout(() => {
        setSuccess(null);
        onSave();
      }, 1200);
    } catch (err: any) {
      setError('Erro ao salvar produto.');
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div>
        <label className="block text-sm font-medium">Nome</label>
        <input name="name" value={form.name} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
      </div>
      <div>
        <label className="block text-sm font-medium">Categoria</label>
        <select
          name="category"
          value={form.category}
          onChange={e => setForm({ ...form, category: e.target.value })}
          className="w-full border rounded px-3 py-2 mb-2"
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
            className="w-full border rounded px-3 py-2 mt-2"
            required
          />
        )}
      </div>
      <div>
        <label className="block text-sm font-medium">Marca</label>
        <select
          name="mark"
          value={form.mark}
          onChange={e => setForm({ ...form, mark: e.target.value })}
          className="w-full border rounded px-3 py-2 mb-2"
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
            className="w-full border rounded px-3 py-2 mt-2"
            required
          />
        )}
      </div>
      <div>
        <label className="block text-sm font-medium">Preço de Custo</label>
        <input name="price" type="number" value={form.price} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
      </div>
      <div>
        <label className="block text-sm font-medium">Preço de Venda</label>
        <input name="price_sale" type="number" value={form.price_sale} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
      </div>
      <div>
        <label className="block text-sm font-medium">Estoque (Quantidade)</label>
        <input name="stock" type="number" value={form.stock} onChange={handleChange} className="w-full border rounded px-3 py-2" required min="0" />
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {success && <div className="text-green-600 text-sm mb-2">{success}</div>}
      <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded" disabled={loading || !!success}>
        {loading ? 'Salvando...' : 'Salvar'}
      </button>
    </form>
  );
};

export default ProductForm;
