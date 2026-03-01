import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminDashboard from "./components/AdminDashboard";
import CustomerMenu from "./components/CustomerMenu";
import OrderSuccess from "./components/OrderSuccess";
import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans">
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/menu/:tableId" element={<CustomerMenu />} />
          <Route path="/order-success" element={<OrderSuccess />} />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}
