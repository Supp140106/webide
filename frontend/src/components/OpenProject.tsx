import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Code2, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

const OpenProject: React.FC = () => {
  const navigate = useNavigate();
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

  const handleOpenProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl) return;

    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/user/open-project', 
        { repoUrl },
        { 
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true 
        }
      );

      setStatus({ 
        type: 'success', 
        message: `Project "${response.data.repoName}" started successfully! Redirecting...` 
      });
      setRepoUrl('');
      
      // Give the user a moment to see the success message
      setTimeout(() => {
        navigate(`/project/${response.data.projectId}`);
      }, 1500);
    } catch (err: any) {
      console.error("Failed to open project", err);
      setStatus({ 
        type: 'error', 
        message: err.response?.data?.error || "Failed to start project. Make sure the URL is valid." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full text-left">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-2.5 bg-zinc-900/80 rounded-xl border border-zinc-800/50">
          <Code2 className="text-zinc-400" size={20} />
        </div>
        <div>
          <h2 className="text-sm font-medium text-zinc-200 tracking-tight">Import Repository</h2>
          <p className="text-zinc-500 text-xs mt-0.5">Clone any Node.js project from GitHub</p>
        </div>
      </div>

      <form onSubmit={handleOpenProject} className="space-y-4">
        <div className="relative group">
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/username/repo"
            className="w-full bg-[#0a0a0a] border border-zinc-800/60 rounded-xl py-3 px-4 text-zinc-200 text-[13px] placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 focus:bg-[#111] transition-all"
            disabled={loading}
          />
        </div>

        <Button
          type="submit"
          disabled={loading || !repoUrl}
          className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-medium h-11 rounded-xl transition-all disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              <span className="text-[13px]">Starting Environment...</span>
            </>
          ) : (
            <>
              <span className="text-[13px]">Launch Project</span>
            </>
          )}
        </Button>
      </form>

      {status.type && (
        <div className={`mt-5 p-4 rounded-xl flex items-start gap-3 border text-xs ${
          status.type === 'success' 
            ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400/90' 
            : 'bg-rose-500/5 border-rose-500/10 text-rose-400/90'
        }`}>
          <p className="font-medium leading-relaxed">{status.message}</p>
        </div>
      )}
    </div>
  );
};

export default OpenProject;
