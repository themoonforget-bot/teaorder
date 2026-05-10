import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import OrderPage from './OrderPage';
import AdminPage from './AdminPage';
import { Settings, Coffee } from 'lucide-react';
import { cn } from '@/src/lib/utils';

function Navigation() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-md px-2 py-2 rounded-full flex gap-1 z-[100] shadow-2xl border border-white/10">
      <Link 
        to="/" 
        className={cn(
          "flex items-center gap-2 px-6 py-3 rounded-full text-sm font-black transition-all",
          !isAdmin ? "bg-amber-500 text-white" : "text-gray-400 hover:text-white"
        )}
      >
        <Coffee size={18} />
        前台點餐
      </Link>
      <Link 
        to="/admin" 
        className={cn(
          "flex items-center gap-2 px-6 py-3 rounded-full text-sm font-black transition-all",
          isAdmin ? "bg-amber-500 text-white" : "text-gray-400 hover:text-white"
        )}
      >
        <Settings size={18} />
        後台管理
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans selection:bg-amber-200 selection:text-amber-900">
        <Routes>
          <Route path="/" element={<OrderPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
        <Navigation />
      </div>
    </Router>
  );
}
