
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { MenuItem, Category } from '../types';
import { Plus, Edit2, Trash2, X, Tag } from 'lucide-react';

const MenuManagement: React.FC = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isEditing, setIsEditing] = useState<MenuItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('0');
  const [priceGrab, setPriceGrab] = useState('0');
  const [priceGojek, setPriceGojek] = useState('0');
  const [category, setCategory] = useState('');
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

  const formatDisplay = (val: string) => {
    const num = val.replace(/\D/g, '');
    return num ? parseInt(num).toLocaleString('id-ID') : '';
  };

  const parseNum = (val: string) => parseInt(val.replace(/\D/g, '') || '0');

  const resetForm = () => {
    setName('');
    setPrice('0');
    setPriceGrab('0');
    setPriceGojek('0');
    setCategory('');
    setIsEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { 
      name, 
      price: parseNum(price), 
      priceGrab: parseNum(priceGrab), 
      priceGojek: parseNum(priceGojek), 
      category 
    };
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
    if (!catName.trim()) return;
    try {
      await addDoc(collection(db, 'categories'), { name: catName.trim() });
      setCatName('');
      alert('Kategori ditambahkan!');
    } catch (err) {
      alert('Gagal tambah kategori');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-primary-900 dark:text-white uppercase tracking-tight">Daftar Menu Kapten</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Kelola harga Normal, Grab, dan Gojek</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowCatModal(true)}
            className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center space-x-2"
          >
            <Tag size={18} />
            <span>Kategori</span>
          </button>
          <button 
            onClick={() => { setShowAddModal(true); resetForm(); }}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-xl font-bold flex items-center space-x-2 shadow-lg shadow-primary-500/20"
          >
            <Plus size={20} />
            <span>Tambah Menu</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-4 text-xs font-black uppercase text-gray-400">Nama Menu</th>
              <th className="px-6 py-4 text-xs font-black uppercase text-gray-400">Kategori</th>
              <th className="px-6 py-4 text-xs font-black uppercase text-gray-400 text-right">Normal</th>
              <th className="px-6 py-4 text-xs font-black uppercase text-gray-400 text-right text-green-600">Grab</th>
              <th className="px-6 py-4 text-xs font-black uppercase text-gray-400 text-right text-primary-600">Gojek</th>
              <th className="px-6 py-4 text-xs font-black uppercase text-gray-400 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {menu.map(item => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <td className="px-6 py-4 font-bold dark:text-white">{item.name}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-[10px] font-black uppercase text-gray-500 dark:text-gray-400">{item.category}</span>
                </td>
                <td className="px-6 py-4 text-right font-mono font-bold">Rp{item.price.toLocaleString('id-ID')}</td>
                <td className="px-6 py-4 text-right font-mono font-bold text-green-600">Rp{(item.priceGrab || 0).toLocaleString('id-ID')}</td>
                <td className="px-6 py-4 text-right font-mono font-bold text-primary-600">Rp{(item.priceGojek || 0).toLocaleString('id-ID')}</td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center space-x-2">
                    <button onClick={() => {
                      setIsEditing(item);
                      setName(item.name);
                      setPrice(item.price.toString());
                      setPriceGrab((item.priceGrab || 0).toString());
                      setPriceGojek((item.priceGojek || 0).toString());
                      setCategory(item.category);
                      setShowAddModal(true);
                    }} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-primary-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
              <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter">{isEditing ? 'Edit Menu' : 'Tambah Menu Baru'}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-widest px-1">Nama Menu</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 font-bold" required placeholder="Contoh: Ayam Bakar Kapten" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-widest px-1">Harga Normal</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rp</span>
                    <input type="text" value={formatDisplay(price)} onChange={e => setPrice(e.target.value.replace(/\D/g, ''))} className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 font-mono font-bold" required />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-green-600 uppercase mb-1.5 tracking-widest px-1">Harga Grab</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rp</span>
                    <input type="text" value={formatDisplay(priceGrab)} onChange={e => setPriceGrab(e.target.value.replace(/\D/g, ''))} className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500 font-mono font-bold text-green-600" required />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-primary-600 uppercase mb-1.5 tracking-widest px-1">Harga Gojek</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rp</span>
                    <input type="text" value={formatDisplay(priceGojek)} onChange={e => setPriceGojek(e.target.value.replace(/\D/g, ''))} className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 font-mono font-bold text-primary-600" required />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-widest px-1">Kategori</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 font-bold" required>
                  <option value="">Pilih Kategori</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest mt-4 shadow-xl shadow-primary-500/20 active:scale-95 transition-all">
                Simpan Ke Kapal
              </button>
            </form>
          </div>
        </div>
      )}

      {showCatModal && (
        <div className="fixed inset-0 bg-primary-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95">
             <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
              <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter">Kelola Kategori</h3>
              <button onClick={() => setShowCatModal(false)} className="text-gray-400 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"><X /></button>
            </div>
            <div className="p-8">
              <form onSubmit={handleAddCategory} className="flex space-x-2 mb-6">
                <input 
                  type="text" 
                  value={catName} 
                  onChange={e => setCatName(e.target.value)} 
                  placeholder="Kategori baru..."
                  className="flex-1 px-5 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 font-bold" 
                />
                <button type="submit" className="bg-primary-600 text-white p-3 rounded-2xl hover:bg-primary-700 active:scale-90 transition-all shadow-lg shadow-primary-500/20"><Plus /></button>
              </form>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {categories.map(cat => (
                  <div key={cat.id} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 group">
                    <span className="font-bold dark:text-white uppercase text-xs tracking-wider">{cat.name}</span>
                    <button onClick={async () => {
                      if(confirm('Hapus kategori?')) await deleteDoc(doc(db, 'categories', cat.id));
                    }} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
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
