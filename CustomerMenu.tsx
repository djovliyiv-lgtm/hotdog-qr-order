import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MenuItem, Table, CartItem, Order } from "../types";
import { ShoppingBag, Plus, Minus, ChevronRight, CreditCard, Banknote, ArrowLeft, History, CheckCircle2, Clock, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Cards from 'react-credit-cards-2';
import 'react-credit-cards-2/dist/es/styles-compiled.css';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function CustomerMenu() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [table, setTable] = useState<Table | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Card details state
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvc: '',
    focused: '' as any,
  });

  const handleInputChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = evt.target;
    setCardDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleInputFocus = (evt: React.FocusEvent<HTMLInputElement>) => {
    setCardDetails((prev) => ({ ...prev, focused: evt.target.name }));
  };

  useEffect(() => {
    const fetchData = async () => {
      const [menuRes, tablesRes] = await Promise.all([
        fetch("/api/menu"),
        fetch("/api/tables")
      ]);
      const menu = await menuRes.json();
      const tables = await tablesRes.json();
      setMenuItems(menu);
      setTable(tables.find((t: Table) => t.id === parseInt(tableId || "0")));
    };
    fetchData();
    fetchOrderHistory();

    // WebSocket for notifications
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "ORDER_UPDATED") {
        const savedIds = JSON.parse(localStorage.getItem('my_orders') || '[]');
        if (savedIds.includes(parseInt(data.orderId))) {
          if (data.status === 'completed') {
            toast.success("Buyurtmangiz tayyor! Iltimos olib keting.", { duration: 10000, icon: '🎉' });
            new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3").play().catch(() => {});
          }
          fetchOrderHistory();
        }
      }
    };

    return () => ws.close();
  }, [tableId]);

  const fetchOrderHistory = async () => {
    const savedIds = JSON.parse(localStorage.getItem('my_orders') || '[]');
    if (savedIds.length === 0) return;
    
    const res = await fetch(`/api/orders/status?ids=${savedIds.join(',')}`);
    const data = await res.json();
    setMyOrders(data);
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`${item.name} qo'shildi`, { duration: 1000 });
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== itemId);
    });
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleOrderClick = () => {
    if (paymentMethod === 'card') {
      setIsPaymentOpen(true);
    } else {
      placeOrder(false);
    }
  };

  const placeOrder = async (isPaid: boolean) => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table_id: parseInt(tableId || "0"),
          items: cart,
          payment_method: paymentMethod,
          total_price: totalPrice,
          is_paid: isPaid
        })
      });

      if (res.ok) {
        const orderData = await res.json();
        const savedIds = JSON.parse(localStorage.getItem('my_orders') || '[]');
        localStorage.setItem('my_orders', JSON.stringify([...savedIds, orderData.id]));
        setIsPaymentOpen(false);
        navigate("/order-success");
      } else {
        toast.error("Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
      }
    } catch (err) {
      toast.error("Server bilan aloqa uzildi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardDetails.number || !cardDetails.name || !cardDetails.expiry || !cardDetails.cvc) {
      toast.error("Iltimos barcha maydonlarni to'ldiring");
      return;
    }
    
    setIsSubmitting(true);
    // Simulate payment processing
    setTimeout(() => {
      toast.success("To'lov muvaffaqiyatli amalga oshirildi!");
      placeOrder(true);
    }, 2000);
  };

  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  if (!table) return <div className="p-8 text-center">Yuklanmoqda...</div>;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white pb-32">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md px-6 py-6 border-b border-[#141414]/5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-serif italic">{table.number}</h1>
            <p className="text-[10px] uppercase tracking-widest font-bold text-[#141414]/40">Xush kelibsiz!</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="w-10 h-10 rounded-full bg-[#F5F5F0] flex items-center justify-center relative"
            >
              <History size={20} className="text-[#141414]" />
              {myOrders.some(o => o.status === 'completed') && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
              )}
            </button>
            <div className="w-10 h-10 rounded-full bg-[#F5F5F0] flex items-center justify-center">
              <ShoppingBag size={20} className="text-[#141414]" />
            </div>
          </div>
        </div>
      </header>

      {/* Menu Sections */}
      <div className="px-6 py-8 space-y-12">
        {categories.map(category => (
          <section key={category}>
            <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-[#141414]/30 mb-6 flex items-center gap-4">
              {category}
              <div className="h-px flex-1 bg-[#141414]/5" />
            </h2>
            <div className="space-y-6">
              {menuItems.filter(item => item.category === category).map(item => (
                <div key={item.id} className="flex gap-4 group">
                  <div className="w-24 h-24 rounded-2xl bg-[#F5F5F0] overflow-hidden flex-shrink-0">
                    {item.image_url && (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h3 className="font-bold text-[#141414]">{item.name}</h3>
                      <p className="text-xs text-[#141414]/50 line-clamp-2 mt-1">{item.description}</p>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-mono font-bold text-sm">{item.price.toLocaleString()} so'm</span>
                      <button
                        onClick={() => addToCart(item)}
                        className="w-8 h-8 rounded-full bg-[#141414] text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Floating Cart Bar */}
      <AnimatePresence>
        {totalItems > 0 && !isCartOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-4 right-4 z-40"
          >
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-[#141414] text-white p-5 rounded-[24px] shadow-2xl flex justify-between items-center group"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                  {totalItems}
                </div>
                <span className="font-bold tracking-tight">Savatni ko'rish</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold">{totalPrice.toLocaleString()} so'm</span>
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {isHistoryOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="p-8 flex-1 overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-serif italic">Buyurtmalarim</h2>
                  <button onClick={() => setIsHistoryOpen(false)} className="p-2 bg-[#F5F5F0] rounded-full">
                    <ArrowLeft size={20} />
                  </button>
                </div>

                {myOrders.length === 0 ? (
                  <div className="text-center py-20 opacity-30 italic">Hozircha buyurtmalar yo'q</div>
                ) : (
                  <div className="space-y-6">
                    {myOrders.map(order => (
                      <div key={order.id} className="bg-[#F5F5F0] p-6 rounded-3xl space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">#{order.id}</span>
                            <h4 className="font-bold">{new Date(order.created_at).toLocaleTimeString()}</h4>
                          </div>
                          <div className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                            order.status === 'completed' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                            order.status === 'preparing' ? "bg-blue-100 text-blue-700 border-blue-200" :
                            order.status === 'cancelled' ? "bg-rose-100 text-rose-700 border-rose-200" :
                            "bg-amber-100 text-amber-700 border-amber-200"
                          )}>
                            {order.status === 'completed' ? 'Tayyor' : 
                             order.status === 'preparing' ? 'Tayyorlanmoqda' : 
                             order.status === 'cancelled' ? 'Bekor qilingan' : 'Kutilmoqda'}
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs opacity-60">
                              <span>{item.quantity}x {item.name}</span>
                              <span>{(item.price * item.quantity).toLocaleString()} so'm</span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-4 border-t border-[#141414]/5 flex justify-between items-center">
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-widest",
                            order.is_paid ? "text-emerald-600" : "text-amber-600"
                          )}>
                            {order.is_paid ? "To'langan" : "To'lanmagan"}
                          </span>
                          <span className="font-bold font-mono">{order.total_price.toLocaleString()} so'm</span>
                        </div>

                        {order.status === 'completed' && (
                          <div className="bg-emerald-500 text-white p-3 rounded-2xl text-center text-xs font-bold animate-pulse">
                            Buyurtmangiz tayyor! Iltimos olib keting.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {isPaymentOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPaymentOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="fixed inset-x-0 bottom-0 bg-white rounded-t-[40px] z-50 max-h-[95vh] overflow-hidden flex flex-col"
            >
              <div className="p-8 flex-1 overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-serif italic">Karta orqali to'lov</h2>
                  <button onClick={() => setIsPaymentOpen(false)} className="p-2 bg-[#F5F5F0] rounded-full">
                    <ArrowLeft size={20} />
                  </button>
                </div>

                <div className="mb-8">
                  <Cards
                    number={cardDetails.number}
                    name={cardDetails.name}
                    expiry={cardDetails.expiry}
                    cvc={cardDetails.cvc}
                    focused={cardDetails.focused}
                  />
                </div>

                <form onSubmit={handlePaymentSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-[#141414]/40">Karta raqami</label>
                    <input
                      type="tel"
                      name="number"
                      placeholder="Card Number"
                      value={cardDetails.number}
                      onChange={handleInputChange}
                      onFocus={handleInputFocus}
                      className="w-full bg-[#F5F5F0] border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#141414]/10 transition-all"
                      maxLength={16}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-[#141414]/40">Karta egasi</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Name"
                      value={cardDetails.name}
                      onChange={handleInputChange}
                      onFocus={handleInputFocus}
                      className="w-full bg-[#F5F5F0] border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#141414]/10 transition-all"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-[#141414]/40">Muddati</label>
                      <input
                        type="tel"
                        name="expiry"
                        placeholder="MM/YY"
                        value={cardDetails.expiry}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        className="w-full bg-[#F5F5F0] border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#141414]/10 transition-all"
                        maxLength={4}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-[#141414]/40">CVC</label>
                      <input
                        type="tel"
                        name="cvc"
                        placeholder="CVC"
                        value={cardDetails.cvc}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        className="w-full bg-[#F5F5F0] border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#141414]/10 transition-all"
                        maxLength={3}
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-8">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-[#141414]/40 font-medium">To'lov summasi</span>
                      <span className="text-2xl font-mono font-bold">{totalPrice.toLocaleString()} so'm</span>
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#141414] text-white py-5 rounded-2xl font-bold text-lg shadow-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? "To'lanmoqda..." : "To'lash"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 bg-white rounded-t-[40px] z-50 max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-8 flex-1 overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-serif italic">Savat</h2>
                  <button onClick={() => setIsCartOpen(false)} className="p-2 bg-[#F5F5F0] rounded-full">
                    <ArrowLeft size={20} />
                  </button>
                </div>

                <div className="space-y-6 mb-12">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div className="flex-1">
                        <h4 className="font-bold">{item.name}</h4>
                        <p className="text-xs text-[#141414]/40 font-mono">{item.price.toLocaleString()} so'm</p>
                      </div>
                      <div className="flex items-center gap-4 bg-[#F5F5F0] p-1 rounded-full">
                        <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <Minus size={14} />
                        </button>
                        <span className="font-bold w-4 text-center">{item.quantity}</span>
                        <button onClick={() => addToCart(item)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-6">
                  <h3 className="text-xs uppercase tracking-widest font-bold text-[#141414]/40">To'lov usuli</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      className={cn(
                        "flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all",
                        paymentMethod === 'cash' ? "border-[#141414] bg-[#141414] text-white" : "border-[#141414]/5 text-[#141414]/40"
                      )}
                    >
                      <Banknote size={24} />
                      <span className="text-xs font-bold uppercase tracking-widest">Naqd</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={cn(
                        "flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all",
                        paymentMethod === 'card' ? "border-[#141414] bg-[#141414] text-white" : "border-[#141414]/5 text-[#141414]/40"
                      )}
                    >
                      <CreditCard size={24} />
                      <span className="text-xs font-bold uppercase tracking-widest">Karta</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-[#F5F5F0]/50 border-t border-[#141414]/5">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[#141414]/40 font-medium">Jami summa</span>
                  <span className="text-2xl font-mono font-bold">{totalPrice.toLocaleString()} so'm</span>
                </div>
                <button
                  disabled={isSubmitting}
                  onClick={handleOrderClick}
                  className="w-full bg-[#141414] text-white py-5 rounded-2xl font-bold text-lg shadow-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Yuborilmoqda..." : "Buyurtma berish"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
