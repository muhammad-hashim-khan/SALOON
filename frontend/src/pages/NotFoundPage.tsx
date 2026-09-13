import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBack = () => {
    if (user?.role === 'ADMIN') {
      navigate('/admin/dashboard');
    } else if (user?.role === 'WORKER') {
      navigate('/worker/billing');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#101115] text-white flex flex-col items-center justify-center p-4 text-center">
      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
        <Search className="w-10 h-10 text-gray-500" />
      </div>
      <h1 className="text-4xl font-bold mb-3 tracking-tight">Page Not Found</h1>
      <p className="text-gray-400 max-w-sm mb-8 text-sm">
        Sorry, the page you're looking for doesn't exist or you don't have permission to view it.
      </p>
      <button
        onClick={handleBack}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#c5a880] text-black font-bold hover:bg-[#d6be9a] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>
    </div>
  );
};
