import { Order } from "../types";
import { CheckCircle2, Clock, XCircle, CreditCard, Banknote } from "lucide-react";
import { motion } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface OrderListProps {
  orders: Order[];
  onUpdate: () => void;
}

export default function OrderList({ orders, onUpdate }: OrderListProps) {
  const updateStatus = async (id: number, status?: string, is_paid?: boolean) => {
    await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, is_paid })
    });
    onUpdate();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'preparing': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white/50 rounded-3xl border border-dashed border-[#141414]/10">
          <p className="text-[#141414]/40 font-serif italic">Hozircha buyurtmalar yo'q...</p>
        </div>
      ) : (
        orders.map((order) => (
          <motion.div
            layout
            key={order.id}
            className="bg-white rounded-3xl border border-[#141414]/5 shadow-sm overflow-hidden"
          >
            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#141414] text-white flex items-center justify-center font-bold text-lg">
                  {order.table_number?.split(' ')[1] || '?'}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-lg">{order.table_number}</h3>
                    <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border", getStatusColor(order.status))}>
                      {order.status}
                    </span>
                    <button 
                      onClick={() => !order.is_paid && updateStatus(order.id, undefined, true)}
                      disabled={order.is_paid}
                      className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all",
                        order.is_paid 
                          ? "bg-emerald-500 text-white border-emerald-600 cursor-default" 
                          : "bg-white text-[#141414]/40 border-[#141414]/10 hover:border-[#141414]/30 active:scale-95"
                      )}
                    >
                      {order.is_paid ? "To'langan" : "To'lanmagan"}
                    </button>
                  </div>
                  <p className="text-xs text-[#141414]/40 mt-1">
                    {new Date(order.created_at).toLocaleTimeString()} • #{order.id}
                  </p>
                </div>
              </div>

              <div className="flex-1 max-w-md">
                <div className="space-y-1">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-[#141414]/70">
                        <span className="font-bold text-[#141414]">{item.quantity}x</span> {item.name}
                      </span>
                      <span className="font-mono text-xs">{(item.price * item.quantity).toLocaleString()} so'm</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 text-sm font-bold">
                  {order.payment_method === 'card' ? <CreditCard size={16} /> : <Banknote size={16} />}
                  {order.payment_method === 'card' ? 'Karta' : 'Naqd'}
                </div>
                <div className="text-xl font-bold font-mono">
                  {order.total_price.toLocaleString()} so'm
                </div>
              </div>

              <div className="flex gap-2">
                {order.status === 'pending' && (
                  <button
                    onClick={() => updateStatus(order.id, 'preparing')}
                    className="p-3 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                    title="Tayyorlashni boshlash"
                  >
                    <Clock size={20} />
                  </button>
                )}
                {order.status !== 'completed' && order.status !== 'cancelled' && (
                  <button
                    onClick={() => updateStatus(order.id, 'completed')}
                    className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                    title="Tayyor bo'ldi"
                  >
                    <CheckCircle2 size={20} />
                  </button>
                )}
                {order.status !== 'cancelled' && order.status !== 'completed' && (
                  <button
                    onClick={() => updateStatus(order.id, 'cancelled')}
                    className="p-3 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                    title="Bekor qilish"
                  >
                    <XCircle size={20} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}
