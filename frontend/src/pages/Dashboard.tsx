import OpenProject from '../components/OpenProject';
import { RecentProjects } from '../components/RecentProjects';
import { useAuth } from '../context/AuthContext';
import { LogOut, Code2 } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30 font-sans">
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-20 flex flex-col gap-12">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-zinc-900">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 text-white mb-2">
              <Code2 size={24} className="text-zinc-400" />
              <h1 className="text-2xl font-medium tracking-tight">WebIDE</h1>
            </div>
            <p className="text-zinc-500 text-sm max-w-md leading-relaxed">
              Welcome back, <span className="text-zinc-300 font-medium">{user?.name}</span>. Start a new repository or resume your recent work below.
            </p>
          </div>
          
          <button 
            onClick={logout}
            className="group flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors duration-200"
          >
            <span>Sign out</span>
            <LogOut size={16} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
          </button>
        </header>

        {/* Main Content Areas */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Left Column: Create Project */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <h2 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">New Project</h2>
            <div className="bg-[#0a0a0a] border border-zinc-800/60 rounded-xl p-6 shadow-2xl shadow-black relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <OpenProject />
            </div>
          </div>

          {/* Right Column: Recent Projects */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <h2 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Recent Activity</h2>
            <div className="bg-[#0a0a0a] border border-zinc-800/60 rounded-xl shadow-2xl shadow-black overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <RecentProjects />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
