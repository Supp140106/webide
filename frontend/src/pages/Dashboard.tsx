import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Mail, Shield } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 font-geist">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute -top-10 -right-10 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Shield size={200} className="text-blue-500" />
        </div>

        <div className="relative z-10 text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-600/20">
            <User className="text-white" size={40} />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Welcome, {user?.name}!</h1>
          <p className="text-zinc-500 text-sm mb-8">You are logged in to your secure dashboard.</p>

          <div className="space-y-4 mb-8">
            <div className="bg-zinc-800/50 p-4 rounded-xl flex items-center gap-4 text-left border border-zinc-700/30">
              <Mail className="text-zinc-500" size={20} />
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Email Address</p>
                <p className="text-white text-sm font-medium">{user?.email}</p>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all border border-zinc-700 shadow-sm group"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
