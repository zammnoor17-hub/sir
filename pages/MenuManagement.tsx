
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { MenuItem, Category } from '../types';
import { Plus, Edit2, Trash2, X, Tag, Save } from 'lucide-react';

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
      const catData = snap.docs.map(d => ({ id: d.id, ...d.data() } as Category));
      setCategories(catData);
    });
    return () => { unsubMenu(); unsubCat(); };
  }, []);

  const formatDisplay = (val: string) => {
    const num = val.toString().replace(/\D/g, '');
    if (!num) return '0';
    return new Intl.NumberFormat('id-ID').format(parseInt(num));
  };

  const parseNum = (val: string) => parseInt(val.toString().replace(/\D/g, '') || '0');

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
    if (!category) return alert('Pilih kategori terlebih dahulu!');
    
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
      alert('Gagal menyimpan menu: ' + err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus menu ini dari daftar?')) {
      await deleteDoc(doc(db, 'menu', id));
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCat = catName.trim().toUpperCase();
    if (!trimmedCat) return;
    
    try {
      if (categories.some(c => c.name.toUpperCase() === trimmedCat)) {
        alert('Kategori sudah ada!');
        return;
      }
      await addDoc(collection(db, 'categories'), { name: trimmedCat });
      setCatName('');
      alert('Kategori ' + trimmedCat + ' berhasil ditambahkan!');
    } catch (err) {
      alert('Gagal tambah kategori. Periksa izin database Anda.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-primary-900 dark:text-white uppercase tracking-tighter">Daftar Menu</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Kelola harga Normal, Grab, dan Gojek</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowCatModal(true)}
            className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center space-x-2 shadow-sm"
          >
            <Tag size={16} />
            <span>Kategori</span>
          </button>
          <button 
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="px-6 py-3 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center space-x-2 shadow-lg shadow-primary-500/30 active:scale-95 transition-all"
          >
            <Plus size={18} />
            <span>Tambah Menu</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Menu</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Kategori</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Normal</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-green-600 tracking-widest text-right">Grab</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-primary-600 tracking-widest text-right">Gojek</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {menu.map(item => (
                <tr key={item.id} className="hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors">
                  <td className="px-8 py-5 font-bold dark:text-white text-sm">{item.name}</td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-[10px] font-black uppercase text-gray-500 dark:text-gray-400">{item.category}</span>
                  </td>
                  <td className="px-8 py-5 text-right font-mono font-bold">Rp{item.price.toLocaleString('id-ID')}</td>
                  <td className="px-8 py-5 text-right font-mono font-bold text-green-600">Rp{(item.priceGrab || 0).toLocaleString('id-ID')}</td>
                  <td className="px-8 py-5 text-right font-mono font-bold text-primary-600">Rp{(item.priceGojek || 0).toLocaleString('id-ID')}</td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex justify-center space-x-2">
                      <button onClick={() => {
                        setIsEditing(item);
                        setName(item.name);
                        setPrice(item.price.toString());
                        setPriceGrab((item.priceGrab || 0).toString());
                        setPriceGojek((item.priceGojek || 0).toString());
                        setCategory(item.category);
                        setShowAddModal(true);
                      }} className="p-2.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-primary-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
              <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter">{isEditing ? 'Edit Menu' : 'Tambah Menu'}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest px-1">Nama Menu</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 font-bold" required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest px-1">Normal</label>
                  <input type="text" value={formatDisplay(price)} onChange={e => setPrice(e.target.value)} className="w-full px-4 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 font-mono font-bold" required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-green-600 uppercase mb-2 tracking-widest px-1">Grab</label>
                  <input type="text" value={formatDisplay(priceGrab)} onChange={e => setPriceGrab(e.target.value)} className="w-full px-4 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500 font-mono font-bold text-green-600" required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-primary-600 uppercase mb-2 tracking-widest px-1">Gojek</label>
                  <input type="text" value={formatDisplay(priceGojek)} onChange={e => setPriceGojek(e.target.value)} className="w-full px-4 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 font-mono font-bold text-primary-600" required />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest px-1">Pilih Kategori</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 font-bold" required>
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                <Save className="inline-block mr-2" size={20} />
                {isEditing ? 'Simpan Perubahan' : 'Tambah Menu'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showCatModal && (
        <div className="fixed inset-0 bg-primary-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95">
             <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
              <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter">Kelola Kategori</h3>
              <button onClick={() => setShowCatModal(false)} className="text-gray-400 p-2 hover:bg-gray-100 rounded-xl"><X /></button>
            </div>
            <div className="p-8">
              <form onSubmit={handleAddCategory} className="flex space-x-3 mb-8">
                <input 
                  type="text" 
                  value={catName} 
                  onChange={e => setCatName(e.target.value)} 
                  placeholder="Nama kategori..."
                  className="flex-1 px-5 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 font-bold uppercase" 
                />
                <button type="submit" className="bg-primary-600 text-white p-4 rounded-2xl hover:bg-primary-700 shadow-lg"><Plus size={20} /></button>
              </form>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                {categories.map(cat => (
                  <div key={cat.id} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 group">
                    <span className="font-black dark:text-white uppercase text-xs tracking-widest">{cat.name}</span>
                    <button onClick={async () => {
                      if(confirm(`Hapus kategori "${cat.name}"?`)) await deleteDoc(doc(db, 'categories', cat.id));
                    }} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={16} /></button>
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
