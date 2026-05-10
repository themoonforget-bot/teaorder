import { useState } from 'react';
import { Product, OrderItem, SUGAR_LEVELS, ICE_LEVELS } from '@/src/types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, ShoppingCart } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface DrinkCardProps {
  product: Product;
  onAdd: (item: OrderItem) => void;
}

export function DrinkCard({ product, onAdd }: DrinkCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [size, setSize] = useState<'M' | 'L'>('L');
  const [sugar, setSugar] = useState(SUGAR_LEVELS[0]);
  const [ice, setIce] = useState(ICE_LEVELS[0]);
  const [quantity, setQuantity] = useState(1);

  const price = product.prices[size];

  const handleAdd = () => {
    onAdd({
      productId: product.id,
      name: product.name,
      size,
      sugar,
      ice,
      price,
      quantity
    });
    setIsOpen(false);
    setQuantity(1);
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        onClick={() => setIsOpen(true)}
        className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-pointer flex flex-col justify-between h-full hover:shadow-md transition-all"
        id={`drink-${product.id}`}
      >
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            {product.category}
          </span>
          <h3 className="text-lg font-bold text-gray-900 mt-2">{product.name}</h3>
        </div>
        <div className="flex justify-between items-end mt-4">
          <div className="text-sm font-medium text-gray-500">
            M: ${product.prices.M} / L: ${product.prices.L}
          </div>
          <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white">
            <Plus size={18} />
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
              id="drink-dialog"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">{product.category}</span>
                    <h2 className="text-2xl font-black text-gray-900 leading-tight">{product.name}</h2>
                  </div>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={24} className="text-gray-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Size Select */}
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 block">飲品規格</label>
                    <div className="flex gap-3">
                      {(['M', 'L'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setSize(s)}
                          className={cn(
                            "flex-1 py-3 px-4 rounded-xl font-bold border-2 transition-all",
                            size === s 
                              ? "border-amber-500 bg-amber-500 text-white" 
                              : "border-gray-100 text-gray-600 hover:border-amber-200"
                          )}
                        >
                          <div className="text-xs opacity-70 mb-0.5">{s === 'M' ? 'Medium' : 'Large'}</div>
                          <div className="text-lg">${product.prices[s]}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sugar & Ice */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 block">甜度</label>
                      <select 
                        value={sugar}
                        onChange={(e) => setSugar(e.target.value)}
                        className="w-full bg-gray-50 border-0 rounded-xl py-3 px-4 font-bold text-gray-900 focus:ring-2 focus:ring-amber-500"
                      >
                        {SUGAR_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 block">冰量</label>
                      <select 
                        value={ice}
                        onChange={(e) => setIce(e.target.value)}
                        className="w-full bg-gray-50 border-0 rounded-xl py-3 px-4 font-bold text-gray-900 focus:ring-2 focus:ring-amber-500"
                      >
                        {ICE_LEVELS.map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center justify-between pt-4 border-top border-gray-100">
                    <div className="flex items-center gap-4 bg-gray-100 px-4 py-2 rounded-full">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-8 flex items-center justify-center font-bold text-lg hover:text-amber-600"
                      >-</button>
                      <span className="w-4 text-center font-black">{quantity}</span>
                      <button 
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center font-bold text-lg hover:text-amber-600"
                      >+</button>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400 font-bold uppercase">總計</div>
                      <div className="text-3xl font-black text-amber-600">${price * quantity}</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleAdd}
                  className="w-full mt-8 bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-lg shadow-amber-200"
                >
                  <ShoppingCart size={20} />
                  加入購物車
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
