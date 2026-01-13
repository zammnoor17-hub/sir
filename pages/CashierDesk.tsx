
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { MenuItem, Category, OrderItem, Transaction } from '../types';
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
  // Fix: Added ShoppingCart to the lucide-react imports
  ShoppingCart
} from 'lucide-react';

const CashierDesk: React.FC = () => {
  const { profile } = useAuth();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS' | null>(null);
  const [amountPaid, setAmountPaid] = useState<number>(0);
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

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

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
  const change = amountPaid > total ? amountPaid - total : 0;

  const handleCheckout = async () => {
    if (!customerName) return alert('Nama pelanggan wajib diisi!');
    if (!paymentMethod) return alert('Pilih metode pembayaran!');
    if (paymentMethod === 'CASH' && amountPaid < total) return alert('Jumlah uang tunai tidak mencukupi!');

    setIsProcessing(true);
    try {
      const transactionData = {
        customerName,
        items: cart,
        total,
        paymentMethod,
        amountPaid: paymentMethod === 'QRIS' ? total : amountPaid,
        change: paymentMethod === 'QRIS' ? 0 : change,
        timestamp: serverTimestamp(),
        cashierId: profile?.uid,
        cashierName: profile?.name
      };

      const docRef = await addDoc(collection(db, 'transactions'), transactionData);
      
      const completedTransaction = {
        ...transactionData,
        id: docRef.id,
        timestamp: new Date() // Mock timestamp for display
      };

      setShowReceipt(completedTransaction as any);
      // Reset POS
      setCart([]);
      setCustomerName('');
      setPaymentMethod(null);
      setAmountPaid(0);
    } catch (error) {
      console.error(error);
      alert('Gagal memproses transaksi.');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredMenu = menu.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      {/* Menu Area */}
      <div className="lg:col-span-8 flex flex-col space-y-4 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold dark:text-white">Layar Pesanan</h2>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari menu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveCategory('All')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-all ${
              activeCategory === 'All' 
                ? 'bg-primary-600 text-white shadow-md' 
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
            }`}
          >
            Semua
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.name)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-all ${
                activeCategory === cat.name 
                  ? 'bg-primary-600 text-white shadow-md' 
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-8">
          {filteredMenu.map(item => (
            <button
              key={item.id}
              onClick={() => addToCart(item)}
              className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all text-left flex flex-col"
            >
              <div className="w-full aspect-square bg-gray-100 dark:bg-gray-700 rounded-xl mb-3 overflow-hidden">
                <img 
                  src={item.imageUrl || `https://picsum.photos/seed/${item.id}/200`} 
                  alt={item.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-bold text-gray-800 dark:text-white line-clamp-2 mb-1">{item.name}</h3>
              <p className="text-primary-600 dark:text-primary-400 font-bold mt-auto">
                Rp {item.price.toLocaleString()}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Area */}
      <div className="lg:col-span-4 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl flex flex-col overflow-hidden no-print">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold dark:text-white flex items-center space-x-2">
            <ShoppingCart className="text-primary-600" size={24} />
            <span>Keranjang Belanja</span>
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
              <ShoppingCart size={48} strokeWidth={1} />
              <p>Keranjang masih kosong</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-start animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 leading-tight">{item.name}</h4>
                  <p className="text-sm text-gray-500">Rp {item.price.toLocaleString()}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-primary-600"><Minus size={14} /></button>
                    <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-primary-600"><Plus size={14} /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={18} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Atas Nama</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Masukkan nama pembeli..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-between items-center py-2 border-y border-gray-100 dark:border-gray-700">
            <span className="text-gray-500 font-medium">Total Tagihan</span>
            <span className="text-2xl font-black text-primary-600">Rp {total.toLocaleString()}</span>
          </div>

          {/* Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentMethod('CASH')}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                paymentMethod === 'CASH' 
                ? 'bg-primary-600 text-white border-primary-600 shadow-lg' 
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
              }`}
            >
              <Banknote size={24} className="mb-1" />
              <span className="text-xs font-bold">Tunai</span>
            </button>
            <button
              onClick={() => setPaymentMethod('QRIS')}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                paymentMethod === 'QRIS' 
                ? 'bg-primary-600 text-white border-primary-600 shadow-lg' 
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
              }`}
            >
              <CreditCard size={24} className="mb-1" />
              <span className="text-xs font-bold">QRIS</span>
            </button>
          </div>

          {paymentMethod === 'CASH' && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Uang Diterima</label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 text-lg font-bold"
              />
              {amountPaid > total && (
                <div className="flex justify-between items-center mt-2 text-green-600 dark:text-green-400">
                  <span className="text-xs font-bold uppercase">Kembalian</span>
                  <span className="font-black">Rp {change.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || !customerName || !paymentMethod || isProcessing}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:shadow-none flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></span>
            ) : (
              <>
                <CheckCircle2 size={20} />
                <span>Proses Pembayaran</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Receipt Modal (Simple Backdrop) */}
      {showReceipt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 text-center">
             <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} />
             </div>
             <h3 className="text-2xl font-bold mb-2 dark:text-white">Pembayaran Sukses</h3>
             <p className="text-gray-500 dark:text-gray-400 mb-6">Transaksi untuk <b>{showReceipt.customerName}</b> telah berhasil disimpan.</p>
             
             <div className="space-y-3">
               <button 
                onClick={printReceipt}
                className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2"
               >
                 <Printer size={18} />
                 <span>Cetak Struk Thermal</span>
               </button>
               <button 
                onClick={() => setShowReceipt(null)}
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-3 rounded-xl font-bold"
               >
                 Selesai
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Real Printable Receipt (Hidden from screen, visible on print) */}
      {showReceipt && (
        <div className="print-only receipt mx-auto text-black bg-white">
          <div className="text-center mb-4">
            <h2 className="text-xl font-black">WARUNG KAPTEN</h2>
            <p className="text-xs">Jl. Dermaga No. 42, Pelabuhan</p>
            <p className="text-xs">Telp: 0812-3456-7890</p>
          </div>
          <div className="border-t border-dashed border-black pt-2 mb-2">
            <p className="flex justify-between"><span>No:</span> <span>#{showReceipt.id.slice(-6).toUpperCase()}</span></p>
            <p className="flex justify-between"><span>Tgl:</span> <span>{new Date().toLocaleString()}</span></p>
            <p className="flex justify-between"><span>Kasir:</span> <span>{showReceipt.cashierName}</span></p>
            <p className="flex justify-between font-bold"><span>Atas Nama:</span> <span>{showReceipt.customerName}</span></p>
          </div>
          <div className="border-t border-dashed border-black pt-2 mb-2">
            {showReceipt.items.map(item => (
              <div key={item.id} className="mb-1">
                <p>{item.name}</p>
                <p className="flex justify-between text-xs">
                  <span>{item.quantity} x {item.price.toLocaleString()}</span>
                  <span>{(item.quantity * item.price).toLocaleString()}</span>
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-dashed border-black pt-2 mb-2 font-bold">
            <p className="flex justify-between text-lg"><span>TOTAL:</span> <span>Rp {showReceipt.total.toLocaleString()}</span></p>
            <p className="flex justify-between"><span>Bayar ({showReceipt.paymentMethod}):</span> <span>Rp {showReceipt.amountPaid.toLocaleString()}</span></p>
            {showReceipt.change > 0 && (
              <p className="flex justify-between"><span>Kembali:</span> <span>Rp {showReceipt.change.toLocaleString()}</span></p>
            )}
          </div>
          <div className="text-center mt-6">
            <p className="text-xs">Terima kasih telah berkunjung!</p>
            <p className="text-xs">Selamat Menikmati Hidangan, Kapten!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierDesk;
