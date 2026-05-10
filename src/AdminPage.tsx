import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, signInWithGoogle, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { Order, OrderStatus } from '@/src/types';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, LogOut, Clock, CheckCircle, XCircle, Hammer, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/src/lib/utils';

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState(auth.currentUser);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((u) => {
      setUser(u);
    });

    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribeOrders = onSnapshot(q, (snapshot) => {
      const ords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(ords);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    return () => {
      unsubscribeAuth();
      unsubscribeOrders();
    };
  }, []);

  const resetProducts = async () => {
    if (!confirm('確定要初始化菜單嗎？現有菜單將保留但會加入預設項目。')) return;
    const { INITIAL_MENU } = await import('./data/initialMenu');
    for (const p of INITIAL_MENU) {
      try {
        await addDoc(collection(db, 'products'), p);
      } catch (e) {
        console.error('Reset error:', e);
      }
    }
    alert('菜單已初始化！');
  };

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const docRef = doc(db, 'orders', orderId);
      await updateDoc(docRef, {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!user || user.email !== "themoonforget@gmail.com") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-3xl shadow-2xl max-w-sm w-full text-center"
        >
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <LogIn size={40} className="text-amber-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">後台管理系統</h2>
          <p className="text-gray-500 font-medium mb-8">請先登入後繼續管理訂單</p>
          <button 
            onClick={signInWithGoogle}
            className="w-full bg-amber-500 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg shadow-amber-200"
          >
            Google登入
          </button>
          
          {user && (
            <p className="text-red-500 text-xs mt-4 font-bold">目前登入帳號無管理權限: {user.email}</p>
          )}
        </motion.div>
      </div>
    );
  }

  const filteredOrders = orders.filter(o => filter === 'all' || o.status === filter);

  const statusConfig: Record<OrderStatus, { icon: any, color: string, label: string }> = {
    pending: { icon: Clock, color: 'bg-amber-100 text-amber-600 border-amber-200', label: '待處理' },
    preparing: { icon: Hammer, color: 'bg-blue-100 text-blue-600 border-blue-200', label: '製作中' },
    completed: { icon: CheckCircle, color: 'bg-green-100 text-green-600 border-green-200', label: '已完成' },
    cancelled: { icon: XCircle, color: 'bg-gray-100 text-gray-500 border-gray-200', label: '已取消' }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-gray-900 text-white p-6 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black flex items-center gap-2">
              <span className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></span>
              後台訂單管理
            </h1>
            <p className="text-gray-400 text-xs font-bold mt-0.5">即時監看中...</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={resetProducts}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-bold text-gray-400 hover:text-white transition-all"
            >
              初始化菜單
            </button>
            <span className="text-xs font-bold text-gray-400 hidden sm:block">{user.email}</span>
            <button onClick={() => auth.signOut()} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {(['all', 'pending', 'preparing', 'completed', 'cancelled'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-black transition-all border-2",
                filter === f 
                  ? "bg-gray-900 border-gray-900 text-white" 
                  : "bg-white border-gray-200 text-gray-400 hover:border-gray-900 hover:text-gray-900"
              )}
            >
              {f === 'all' ? '全部' : statusConfig[f as OrderStatus].label}
              {f !== 'all' && (
                <span className="ml-2 opacity-50">
                  {orders.filter(o => o.status === f).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredOrders.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="py-20 text-center text-gray-400 font-bold"
              >
                目前沒有符合篩選條件的訂單
              </motion.div>
            ) : (
              filteredOrders.map(order => {
                const config = statusConfig[order.status];
                const StatusIcon = config.icon;
                const isExpanded = expandedOrders.has(order.id);

                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                  >
                    <div 
                      className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleExpand(order.id)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={cn("px-3 py-1.5 rounded-lg border text-xs font-black flex items-center gap-2", config.color)}>
                            <StatusIcon size={14} />
                            {config.label}
                          </div>
                          <div>
                            <h3 className="font-black text-lg text-gray-900">{order.customerName}</h3>
                            <p className="text-xs text-gray-400 font-bold font-mono uppercase">#{order.id.slice(-6)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between sm:justify-end gap-6">
                          <div className="text-right">
                            <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">下單時間</div>
                            <div className="text-sm font-bold text-gray-900">
                              {order.createdAt ? format(order.createdAt.toDate(), 'HH:mm') : '--:--'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">總計金額</div>
                            <div className="text-lg font-black text-amber-600">${order.totalPrice}</div>
                          </div>
                          <div className="text-gray-300">
                            {isExpanded ? <ChevronUp /> : <ChevronDown />}
                          </div>
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden border-t border-gray-100 bg-gray-50/50"
                        >
                          <div className="p-6">
                            <div className="space-y-4 mb-8">
                              <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">訂單內容</h4>
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200">
                                  <div className="flex gap-4 items-center">
                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-black text-xs">
                                      {item.quantity}
                                    </div>
                                    <div>
                                      <div className="font-black text-sm text-gray-900">{item.name}</div>
                                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex gap-2">
                                        <span>{item.size} / {item.sugar} / {item.ice}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="font-black text-gray-900">${item.price * item.quantity}</div>
                                </div>
                              ))}
                            </div>

                            <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-100">
                              <h4 className="w-full text-xs font-black uppercase tracking-widest text-gray-400 mb-2">更新狀態</h4>
                              {(['pending', 'preparing', 'completed', 'cancelled'] as const).map(s => (
                                <button
                                  key={s}
                                  onClick={() => updateStatus(order.id, s)}
                                  className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-black transition-all border-2",
                                    order.status === s 
                                      ? statusConfig[s].color
                                      : "bg-white border-gray-200 text-gray-400 hover:border-gray-900"
                                  )}
                                >
                                  {statusConfig[s].label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
