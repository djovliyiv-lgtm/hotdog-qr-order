import { useState, useEffect } from "react";
import { MenuItem, Order, Table } from "../types";
import OrderList from "./OrderList";
import MenuManager from "./MenuManager";
import TableQRManager from "./TableQRManager";
import { LayoutDashboard, Utensils, QrCode, ClipboardList } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'tables'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);

  useEffect(() => {
    fetchData();

    // WebSocket for real-time updates
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "NEW_ORDER") {
        setOrders(prev => [data.order, ...prev]);
        new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3").play().catch(() => {});
      } else if (data.type === "ORDER_UPDATED") {
        setOrders(prev => prev.map(o => o.id === parseInt(data.orderId) ? { ...o, status: data.status } : o));
      }
    };

    return () => ws.close();
  }, []);

  const fetchData = async () => {
    console.log("Fetching fresh data from server...");
    const [ordersRes, menuRes, tablesRes] = await Promise.all([
      fetch("/api/orders"),
      fetch("/api/menu"),
      fetch("/api/tables")
    ]);
    const ordersData = await ordersRes.json();
    const menuData = await menuRes.json();
    const tablesData = await tablesRes.json();
    
    console.log("Menu items received:", menuData.length);
    setOrders(ordersData);
    setMenuItems(menuData);
    setTables(tablesData);
  };

  const tabs = [
    { id: 'orders', label: 'Buyurtmalar', icon: ClipboardList },
    { id: 'menu', label: 'Menyu', icon: Utensils },
    { id: 'tables', label: 'Stollar & QR', icon: QrCode },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-serif italic tracking-tight text-[#141414]">
            Boshqaruv Paneli
          </h1>
          <p className="text-sm text-[#141414]/50 uppercase tracking-widest mt-2">
            Hotdog & Lavash Order System
          </p>
        </div>

        <nav className="flex bg-white/50 backdrop-blur-sm p-1 rounded-2xl border border-[#141414]/5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium",
                activeTab === tab.id 
                  ? "bg-[#141414] text-white shadow-lg" 
                  : "text-[#141414]/60 hover:text-[#141414] hover:bg-white/80"
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="min-h-[600px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'orders' && <OrderList orders={orders} onUpdate={fetchData} />}
            {activeTab === 'menu' && <MenuManager items={menuItems} onUpdate={fetchData} />}
            {activeTab === 'tables' && <TableQRManager tables={tables} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
