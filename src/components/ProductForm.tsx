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
    price: product?.price || '',
    venda: product?.venda || '',
    stock: product?.stock || '',
    price_sale: product?.price_sale || '', // Added price_sale to form state
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');

  React.useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('category');
      if (!error && data) {
        const uniqueCats = Array.from(new Set(data.map((p: any) => p.category).filter(Boolean)));
        setCategories(uniqueCats);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const categoryValue = form.category === "__new__" ? newCategory : form.category;
      if (product) {
        // Update
        await supabase.from('products').update({
          name: form.name,
          category: categoryValue,
          price: Number(form.price),
          price_sale: Number(form.price_sale), // Updated to include price_sale
          stock: Number(form.stock),
        }).eq('id', product.id);
      } else {
        // Insert
        await supabase.from('products').insert({
          name: form.name,
          category: categoryValue,
          price: Number(form.price),
          price_sale: Number(form.price_sale), // Updated to include price_sale
          stock: Number(form.stock),
        });
      }
      onSave();
    } catch (err: any) {
      setError('Erro ao salvar produto.');
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
        <label className="block text-sm font-medium">Preço de Custo</label>
        <input name="price" type="number" value={form.price} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
      </div>
      <div>
        <label className="block text-sm font-medium">Preço de Venda</label>
        <input name="price_sale" type="number" value={form.price_sale} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded" disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar'}
      </button>
    </form>
  );
};

export default ProductForm;
