import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { Product, OrderItem } from '@/src/types';
import { DrinkCard } from './components/DrinkCard';
import { ShoppingCart, ClipboardList, Trash2, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { INITIAL_MENU } from './data/initialMenu';

export default function OrderPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  // Sync products
  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(prods);

      // Bootstrap if empty
      if (snapshot.empty) {
        INITIAL_MENU.forEach(async (p) => {
          try {
            await addDoc(collection(db, 'products'), p);
          } catch (e) {
            console.error('Bootstrap error:', e);
          }
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    return () => unsubscribe();
  }, []);

  const addToCart = (item: OrderItem) => {
    setCart(prev => [...prev, item]);
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const submitOrder = async () => {
    if (cart.length === 0 || !customerName) return;

    setOrderStatus('submitting');
    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        customerName,
        items: cart,
        totalPrice,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setLastOrderId(docRef.id);
      setOrderStatus('success');
      setCart([]);
      setCustomerName('');
      setTimeout(() => {
        setOrderStatus('idle');
        setIsOrdering(false);
      }, 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
      setOrderStatus('idle');
    }
  };

  const categories = Array.from(new Set(products.map(p => p.category)));

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-amber-500 text-white p-6 sticky top-0 z-40 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tight">TeaOrder</h1>
            <p className="text-amber-100 text-sm font-bold">50嵐風味點單系統</p>
          </div>
          <button 
            onClick={() => setIsOrdering(true)}
            className="relative p-2 bg-amber-400 rounded-full hover:bg-amber-300 transition-colors"
          >
            <ShoppingCart size={24} />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-amber-500">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {categories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent mb-4"></div>
            <p className="font-bold">載入飲品菜單中...</p>
          </div>
        )}

        {categories.map(cat => (
          <section key={cat} className="mb-12">
            <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
              <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
              {cat}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.filter(p => p.category === cat).map(product => (
                <DrinkCard key={product.id} product={product} onAdd={addToCart} />
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isOrdering && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOrdering(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 flex flex-col shadow-2xl"
              id="cart-drawer"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-black flex items-center gap-2">
                  <ShoppingCart className="text-amber-500" />
                  您的購物車
                </h2>
                <button onClick={() => setIsOrdering(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                    <ShoppingCart size={64} strokeWidth={1} />
                    <p className="font-bold text-lg">您的購物車還是空的</p>
                    <button 
                      onClick={() => setIsOrdering(false)}
                      className="text-amber-500 font-bold border-b-2 border-amber-500"
                    >
                      馬上去選購
                    </button>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <div>
                        <h4 className="font-black text-gray-900">{item.name}</h4>
                        <div className="text-xs text-gray-500 font-bold flex gap-2 mt-1">
                          <span className="bg-white px-2 py-0.5 rounded border border-gray-100">{item.size}</span>
                          <span className="bg-white px-2 py-0.5 rounded border border-gray-100">{item.sugar}</span>
                          <span className="bg-white px-2 py-0.5 rounded border border-gray-100">{item.ice}</span>
                        </div>
                        <div className="text-amber-600 font-black mt-2">${item.price} × {item.quantity}</div>
                      </div>
                      <button 
                        onClick={() => removeFromCart(idx)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-6">
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block">訂購人姓名</label>
                    <input 
                      type="text" 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="請輸入您的姓名"
                      className="w-full bg-white border-2 border-gray-200 rounded-xl py-3 px-4 font-bold focus:border-amber-500 focus:ring-0 transition-all"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-400">總金額</span>
                    <span className="text-3xl font-black text-amber-600">${totalPrice}</span>
                  </div>

                  <button
                    disabled={!customerName || orderStatus === 'submitting'}
                    onClick={submitOrder}
                    className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-lg shadow-amber-200"
                  >
                    {orderStatus === 'submitting' ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <>
                        <ClipboardList size={20} />
                        確認下單
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Success Overlay */}
              <AnimatePresence>
                {orderStatus === 'success' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white z-[60] flex flex-col items-center justify-center p-12 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 12 }}
                    >
                      <CheckCircle2 size={80} className="text-green-500 mb-6" />
                    </motion.div>
                    <h3 className="text-3xl font-black text-gray-900 mb-4">訂單已送出!</h3>
                    <p className="text-gray-500 font-bold mb-8">
                      感謝您的訂購，請等候通知取餐。<br/>
                      您的訂單編號是:<br/>
                      <span className="text-amber-500 font-mono">{lastOrderId}</span>
                    </p>
                    <button 
                      onClick={() => {
                        setOrderStatus('idle');
                        setIsOrdering(false);
                      }}
                      className="bg-gray-900 text-white px-8 py-3 rounded-full font-bold"
                    >
                      回到菜單
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

