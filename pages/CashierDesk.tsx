
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { MenuItem, Category, OrderItem, Transaction, OrderPlatform } from '../types';
import { useAuth } from '../App';
import { 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  User as UserIcon,
  Printer,
  CheckCircle2,
  ShoppingCart,
  Zap,
  Smartphone
} from 'lucide-react';

const CashierDesk: React.FC = () => {
  const { profile } = useAuth();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [platform, setPlatform] = useState<OrderPlatform>('NORMAL');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS' | null>(null);
  const [amountPaidStr, setAmountPaidStr] = useState('0');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState<Transaction | null>(null);

  useEffect(() => {
    const qMenu = query(collection(db, 'menu'), orderBy('name'));
    const unsubscribeMenu = onSnapshot(qMenu, (snapshot) => {
      setMenu(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem)));
    });

    const qCats = query(collection(db, 'categories'), orderBy('name'));
    const unsubscribeCats = onSnapshot(qCats, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    });

    return () => {
      unsubscribeMenu();
      unsubscribeCats();
    };
  }, []);

  const formatDisplay = (val: string) => {
    const num = val.replace(/\D/g, '');
    return num ? parseInt(num).toLocaleString('id-ID') : '';
  };

  const parseNum = (val: string) => parseInt(val.replace(/\D/g, '') || '0');

  const getPrice = (item: MenuItem) => {
    if (platform === 'GRAB') return item.priceGrab || item.price;
    if (platform === 'GOJEK') return item.priceGojek || item.price;
    return item.price;
  };

  const addToCart = (item: MenuItem) => {
    const currentPrice = getPrice(item);
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1, price: currentPrice } : i);
      }
      return [...prev, { id: item.id, name: item.name, price: currentPrice, quantity: 1 }];
    });
  };

  // Update cart prices if platform changes
  useEffect(() => {
    setCart(prev => prev.map(cartItem => {
      const menuItem = menu.find(m => m.id === cartItem.id);
      if (menuItem) {
        return { ...cartItem, price: getPrice(menuItem) };
      }
      return cartItem;
    }));
  }, [platform, menu]);

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === itemId) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const amountPaid = parseNum(amountPaidStr);
  const change = amountPaid > total ? amountPaid - total : 0;

  const handleCheckout = async () => {
    if (!customerName.trim()) return alert('Nama pelanggan wajib diisi!');
    if (!paymentMethod) return alert('Pilih metode pembayaran!');
    if (paymentMethod === 'CASH' && amountPaid < total) return alert('Uang kurang!');

    setIsProcessing(true);
    try {
      const transactionData = {
        customerName,
        items: cart,
        total,
        platform,
        paymentMethod,
        amountPaid: paymentMethod === 'QRIS' ? total : amountPaid,
        change: paymentMethod === 'QRIS' ? 0 : change,
        timestamp: serverTimestamp(),
        cashierId: profile?.uid,
        cashierName: profile?.name
      };

      const docRef = await addDoc(collection(db, 'transactions'), transactionData);
      
      setShowReceipt({ ...transactionData, id: docRef.id, timestamp: new Date() } as any);
      
      // Reset POS
      setCart([]);
      setCustomerName('');
      setPaymentMethod(null);
      setAmountPaidStr('0');
    } catch (error) {
      alert('Gagal simpan transaksi.');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredMenu = menu.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full pb-6">
      <div className="lg:col-span-8 flex flex-col space-y-4 no-print">
        {/* Platform Selection */}
        <div className="flex gap-2 bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <button 
            onClick={() => setPlatform('NORMAL')}
            className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${platform === 'NORMAL' ? 'bg-primary-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <Banknote size={16} /> <span>Normal</span>
          </button>
          <button 
            onClick={() => setPlatform('GRAB')}
            className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${platform === 'GRAB' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <Smartphone size={16} /> <span>GrabFood</span>
          </button>
          <button 
            onClick={() => setPlatform('GOJEK')}
            className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${platform === 'GOJEK' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <Zap size={16} /> <span>GojekFood</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter">Pilih Menu</h2>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari menu favorit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 font-medium"
            />
          </div>
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-2 custom-scrollbar">
          <button
            onClick={() => setActiveCategory('All')}
            className={`px-6 py-2.5 rounded-xl whitespace-nowrap font-black text-xs uppercase tracking-widest transition-all ${activeCategory === 'All' ? 'bg-primary-600 text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-400 border border-gray-100 dark:border-gray-700'}`}
          >
            Semua
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.name)}
              className={`px-6 py-2.5 rounded-xl whitespace-nowrap font-black text-xs uppercase tracking-widest transition-all ${activeCategory === cat.name ? 'bg-primary-600 text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-400 border border-gray-100 dark:border-gray-700'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto pr-2 custom-scrollbar pb-10">
          {filteredMenu.map(item => (
            <button
              key={item.id}
              onClick={() => addToCart(item)}
              className="bg-white dark:bg-gray-800 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:border-primary-400 dark:hover:border-primary-600 transition-all text-left flex flex-col justify-between group active:scale-95"
            >
              <div>
                <span className="text-[10px] font-black uppercase text-primary-500 mb-2 block tracking-widest">{item.category}</span>
                <h3 className="font-bold text-gray-800 dark:text-white leading-tight mb-2 text-lg">{item.name}</h3>
              </div>
              <div className="flex items-center justify-between mt-4">
                <p className="text-primary-600 dark:text-primary-400 font-black text-sm font-mono">
                  Rp{getPrice(item).toLocaleString('id-ID')}
                </p>
                <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/40 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors">
                  <Plus size={16} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-4 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col overflow-hidden no-print">
        <div className="p-8 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
          <h3 className="text-xl font-black dark:text-white flex items-center space-x-3 uppercase tracking-tighter">
            <ShoppingCart className="text-primary-600" size={24} />
            <span>Pesanan Aktif</span>
          </h3>
          <div className="mt-2 flex items-center space-x-2">
            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${platform === 'NORMAL' ? 'bg-primary-900 text-white' : platform === 'GRAB' ? 'bg-green-600 text-white' : 'bg-primary-600 text-white'}`}>
              {platform} MODE
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-4">
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center">
                <ShoppingCart size={40} strokeWidth={1} />
              </div>
              <p className="font-bold uppercase text-[10px] tracking-widest">Keranjang Kosong</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center group animate-in slide-in-from-right-4">
                <div className="flex-1 pr-4">
                  <h4 className="font-bold text-gray-800 dark:text-gray-200 leading-tight text-sm uppercase">{item.name}</h4>
                  <p className="text-[10px] font-mono font-bold text-gray-400">Rp{item.price.toLocaleString('id-ID')}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center bg-gray-100 dark:bg-gray-900 rounded-xl p-1 px-2 space-x-3">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-gray-400 hover:text-primary-600"><Minus size={14} /></button>
                    <span className="w-4 text-center text-xs font-black">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-gray-400 hover:text-primary-600"><Plus size={14} /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-8 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest px-1">Nama Pelanggan</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama pembeli..."
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 text-sm font-bold"
                />
              </div>
            </div>

            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Tagihan</span>
              <span className="text-3xl font-black text-primary-900 dark:text-white tracking-tighter font-mono">Rp{total.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setPaymentMethod('CASH')}
              className={`flex flex-col items-center justify-center py-4 rounded-2xl border-2 transition-all ${paymentMethod === 'CASH' ? 'bg-primary-900 border-primary-900 text-white shadow-xl' : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-100 dark:border-gray-700'}`}
            >
              <Banknote size={24} className="mb-1" />
              <span className="text-[10px] font-black uppercase">Tunai</span>
            </button>
            <button
              onClick={() => setPaymentMethod('QRIS')}
              className={`flex flex-col items-center justify-center py-4 rounded-2xl border-2 transition-all ${paymentMethod === 'QRIS' ? 'bg-primary-600 border-primary-600 text-white shadow-xl' : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-100 dark:border-gray-700'}`}
            >
              <CreditCard size={24} className="mb-1" />
              <span className="text-[10px] font-black uppercase">QRIS</span>
            </button>
          </div>

          {paymentMethod === 'CASH' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Uang Diterima</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">Rp</span>
                <input
                  type="text"
                  value={formatDisplay(amountPaidStr)}
                  onChange={(e) => setAmountPaidStr(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 text-xl font-black font-mono"
                  placeholder="0"
                />
              </div>
              {amountPaid > total && (
                <div className="flex justify-between items-center px-1 text-green-600">
                  <span className="text-[10px] font-black uppercase tracking-widest">Kembalian</span>
                  <span className="font-black font-mono">Rp{change.toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || !customerName.trim() || !paymentMethod || isProcessing}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-primary-500/30 disabled:opacity-50 flex items-center justify-center space-x-3 uppercase tracking-widest text-sm"
          >
            {isProcessing ? (
              <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></span>
            ) : (
              <>
                <CheckCircle2 size={20} />
                <span>Bayar Sekarang</span>
              </>
            )}
          </button>
        </div>
      </div>

      {showReceipt && (
        <div className="fixed inset-0 bg-primary-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 no-print">
          <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-10 max-w-sm w-full shadow-2xl animate-in zoom-in-95 text-center">
             <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} />
             </div>
             <h3 className="text-2xl font-black mb-2 dark:text-white uppercase tracking-tighter">Kapal Berlabuh!</h3>
             <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">Pembayaran <b>{showReceipt.customerName}</b> sukses.</p>
             
             <div className="space-y-3">
               <button onClick={() => window.print()} className="w-full bg-primary-900 text-white py-4 rounded-2xl font-black flex items-center justify-center space-x-3 uppercase tracking-widest text-xs">
                 <Printer size={18} />
                 <span>Cetak Struk</span>
               </button>
               <button onClick={() => setShowReceipt(null)} className="w-full bg-gray-100 dark:bg-gray-700 text-gray-500 py-4 rounded-2xl font-black uppercase tracking-widest text-xs">
                 Tutup
               </button>
             </div>
          </div>
        </div>
      )}

      {showReceipt && (
        <div className="print-only receipt mx-auto text-black bg-white">
          <div className="text-center mb-4">
            <h2 className="text-xl font-black">WARUNG KAPTEN</h2>
            <p className="text-[10px]">Kp. Blok Lame, Sukabakti, Kec. Curug, Kabupaten Tangerang, Banten 15810 </p>
            <p className="text-[10px]">Telp: 0858-1913-1613</p>
          </div>
          <div className="border-t border-dashed border-black pt-2 mb-2 text-[10px]">
            <p className="flex justify-between"><span>No:</span> <span>#{showReceipt.id.slice(-6).toUpperCase()}</span></p>
            <p className="flex justify-between"><span>Platform:</span> <span className="font-bold">{showReceipt.platform}</span></p>
            <p className="flex justify-between"><span>Tgl:</span> <span>{new Date().toLocaleString('id-ID')}</span></p>
            <p className="flex justify-between font-bold"><span>Pelanggan:</span> <span>{showReceipt.customerName}</span></p>
          </div>
          <div className="border-t border-dashed border-black pt-2 mb-2 text-[10px]">
            {showReceipt.items.map(item => (
              <div key={item.id} className="mb-1">
                <p className="uppercase">{item.name}</p>
                <p className="flex justify-between font-mono">
                  <span>{item.quantity} x {item.price.toLocaleString('id-ID')}</span>
                  <span>{(item.quantity * item.price).toLocaleString('id-ID')}</span>
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-dashed border-black pt-2 mb-2 font-bold text-[10px]">
            <p className="flex justify-between text-sm"><span>TOTAL:</span> <span>Rp{showReceipt.total.toLocaleString('id-ID')}</span></p>
            <p className="flex justify-between"><span>Bayar ({showReceipt.paymentMethod}):</span> <span>Rp{showReceipt.amountPaid.toLocaleString('id-ID')}</span></p>
            {showReceipt.change > 0 && (
              <p className="flex justify-between text-green-700"><span>Kembali:</span> <span>Rp{showReceipt.change.toLocaleString('id-ID')}</span></p>
            )}
          </div>
          <div className="text-center mt-6 text-[10px]">
            <p>Terima kasih, Kapten!</p>
            <p>Selamat Menikmati Hidangan.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierDesk;
