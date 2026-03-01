import React, { useState } from "react";
import { MenuItem } from "../types";
import { Plus, Trash2, Edit2, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";

interface MenuManagerProps {
  items: MenuItem[];
  onUpdate: () => void;
}

export default function MenuManager({ items, onUpdate }: MenuManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Hot-dog',
    image_url: ''
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', category: 'Hot-dog', image_url: '' });
    setIsAdding(false);
    setEditingItem(null);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      image_url: item.image_url || ''
    });
    setIsAdding(true);
  };

  const handleDelete = async (id: number) => {
    console.log("Deleting item with ID:", id);
    if (!confirm("Haqiqatan ham ushbu taomni o'chirmoqchimisiz?")) return;
    
    try {
      const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Taom o'chirildi");
        onUpdate();
      } else {
        const data = await res.json();
        toast.error(data.error || "O'chirishda xatolik yuz berdi");
      }
    } catch (err) {
      toast.error("Server bilan aloqa uzildi");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingItem ? `/api/menu/${editingItem.id}` : '/api/menu';
    const method = editingItem ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        price: parseFloat(formData.price)
      })
    });

    if (res.ok) {
      toast.success(editingItem ? "Taom yangilandi!" : "Taom qo'shildi!");
      resetForm();
      onUpdate();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-serif italic">Taomlar Ro'yxati</h2>
        <button
          onClick={() => {
            if (isAdding) resetForm();
            else setIsAdding(true);
          }}
          className="flex items-center gap-2 bg-[#141414] text-white px-6 py-3 rounded-2xl font-medium hover:scale-105 transition-transform"
        >
          <Plus size={20} className={isAdding ? "rotate-45 transition-transform" : "transition-transform"} />
          {isAdding ? "Bekor qilish" : "Yangi Taom"}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-[#141414]/5 shadow-xl space-y-6 max-w-2xl mx-auto">
          <h3 className="text-xl font-serif italic">{editingItem ? "Taomni tahrirlash" : "Yangi taom qo'shish"}</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-[#141414]/40">Nomi</label>
              <input
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-[#F5F5F0] border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#141414]/10 transition-all"
                placeholder="Masalan: Hot-dog Classic"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-[#141414]/40">Kategoriya</label>
              <select
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full bg-[#F5F5F0] border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#141414]/10 transition-all"
              >
                <option>Hot-dog</option>
                <option>Lavash</option>
                <option>Burger</option>
                <option>Ichimlik</option>
                <option>Shirinlik</option>
                <option>Boshqa</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-[#141414]/40">Tavsif</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-[#F5F5F0] border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#141414]/10 transition-all min-h-[100px]"
              placeholder="Tarkibi va boshqalar..."
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-[#141414]/40">Narxi (so'm)</label>
              <input
                required
                type="number"
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
                className="w-full bg-[#F5F5F0] border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#141414]/10 transition-all"
                placeholder="15000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-[#141414]/40">Rasm URL</label>
              <div className="flex gap-2">
                <input
                  value={formData.image_url}
                  onChange={e => setFormData({...formData, image_url: e.target.value})}
                  className="flex-1 bg-[#F5F5F0] border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#141414]/10 transition-all"
                  placeholder="https://..."
                />
                {formData.image_url && (
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#141414]/10">
                    <img src={formData.image_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-[#141414] text-white py-4 rounded-2xl font-bold hover:opacity-90 transition-opacity"
            >
              {editingItem ? "Yangilash" : "Saqlash"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-8 py-4 rounded-2xl font-bold border border-[#141414]/10 hover:bg-[#F5F5F0] transition-colors"
            >
              Bekor qilish
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-3xl border border-[#141414]/5 overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="h-48 bg-[#F5F5F0] relative overflow-hidden">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#141414]/10">
                  <ImageIcon size={48} />
                </div>
              )}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                {item.category}
              </div>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg">{item.name}</h3>
                <span className="font-mono font-bold text-[#141414]">{item.price.toLocaleString()} so'm</span>
              </div>
              <p className="text-sm text-[#141414]/50 line-clamp-2 mb-6">{item.description}</p>
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => handleEdit(item)}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                  title="Tahrirlash"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                  title="O'chirish"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
