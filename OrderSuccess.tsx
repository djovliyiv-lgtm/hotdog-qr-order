import { useNavigate } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

export default function OrderSuccess() {
  const navigate = useNavigate();

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-8"
      >
        <CheckCircle2 size={48} />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-4xl font-serif italic mb-4">Buyurtmangiz qabul qilindi!</h1>
        <p className="text-[#141414]/50 mb-4">
          Oshpazlarimiz hozirda uni tayyorlashmoqda. Iltimos, biroz kuting.
        </p>
        <div className="bg-[#F5F5F0] p-4 rounded-2xl mb-12 text-sm">
          <p className="text-[#141414]/40 uppercase tracking-widest font-bold text-[10px] mb-1">Holati</p>
          <p className="font-bold text-emerald-600">To'lov muvaffaqiyatli amalga oshirildi</p>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-[#141414] text-white font-bold hover:opacity-90 transition-opacity"
        >
          Menyuga qaytish
          <ArrowRight size={18} />
        </button>
      </motion.div>

      <div className="absolute bottom-12 text-[10px] uppercase tracking-[0.3em] font-bold text-[#141414]/20">
        Hotdog & Lavash Order System
      </div>
    </div>
  );
}
