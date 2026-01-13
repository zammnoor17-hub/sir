
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { MenuItem, Category } from '../types';
import { Plus, Edit2, Trash2, X, Image as ImageIcon } from 'lucide-react';

const MenuManagement: React.FC = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isEditing, setIsEditing] = useState<MenuItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [catName, setCatName] = useState('');

  useEffect(() => {
    const qMenu = query(collection(db, 'menu'), orderBy('name'));
    const unsubMenu = onSnapshot(qMenu, (snap) => {
      setMenu(snap.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem)));
    });
    const qCat = query(collection(db, 'categories'), orderBy('name'));
    const unsubCat = onSnapshot(qCat, (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    });
    return () => { unsubMenu(); unsubCat(); };
  }, []);

  const resetForm = () => {
    setName('');
    setPrice(0);
    setCategory('');
    setImageUrl('');
    setIsEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name, price, category, imageUrl };
    try {
      if (isEditing) {
        await updateDoc(doc(db, 'menu', isEditing.id), data);
      } else {
        await addDoc(collection(db, 'menu'), data);
      }
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      alert('Gagal menyimpan menu');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus menu ini?')) {
      await deleteDoc(doc(db, 'menu', id));
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;
    await addDoc(collection(db, 'categories'), { name: catName });
    setCatName('');
    setShowCatModal(false);
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Hapus kategori ini?')) {
      await deleteDoc(doc(db, 'categories', id));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Manajemen Menu</h2>
          <p className="text-gray-500 dark:text-gray-400">Atur hidangan dan kategori Warung Kapten</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowCatModal(true)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            Kategori
          </button>
          <button 
            onClick={() => { setShowAddModal(true); resetForm(); }}
            className="px-4 py-2 bg-primary-600 text-white rounded-xl font-bold flex items-center space-x-2 shadow-lg shadow-primary-500/20"
          >
            <Plus size={20} />
            <span>Tambah Menu</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {menu.map(item => (
          <div key={item.id} className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm group">
            <div className="h-40 bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
              <img src={item.imageUrl || `https://picsum.photos/seed/${item.id}/400/300`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.name} />
              <div className="absolute top-2 right-2 flex space-x-1">
                <button 
                  onClick={() => {
                    setIsEditing(item);
                    setName(item.name);
                    setPrice(item.price);
                    setCategory(item.category);
                    setImageUrl(item.imageUrl || '');
                    setShowAddModal(true);
                  }}
                  className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-full text-blue-600 hover:scale-110 transition-all shadow-sm"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-full text-red-600 hover:scale-110 transition-all shadow-sm"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="p-5">
              <span className="text-[10px] font-black uppercase tracking-wider text-primary-500 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-full">
                {item.category}
              </span>
              <h4 className="font-bold text-lg dark:text-white mt-2 line-clamp-1">{item.name}</h4>
              <p className="text-primary-600 font-bold mt-1 text-lg">Rp {item.price.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold dark:text-white">{isEditing ? 'Edit Menu' : 'Tambah Menu Baru'}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Menu</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Harga (Rp)</label>
                <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategori</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" required>
                  <option value="">Pilih Kategori</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL Gambar (Opsional)</label>
                <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-bold mt-4 shadow-lg shadow-primary-500/20 transition-all">
                Simpan Menu
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Categories Modal */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
             <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold dark:text-white">Kelola Kategori</h3>
              <button onClick={() => setShowCatModal(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>
            <div className="p-6">
              <form onSubmit={handleAddCategory} className="flex space-x-2 mb-6">
                <input 
                  type="text" 
                  value={catName} 
                  onChange={e => setCatName(e.target.value)} 
                  placeholder="Nama kategori baru..."
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" 
                />
                <button className="bg-primary-600 text-white p-2 rounded-xl"><Plus /></button>
              </form>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {categories.map(cat => (
                  <div key={cat.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    <span className="font-medium dark:text-white">{cat.name}</span>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded-lg">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
