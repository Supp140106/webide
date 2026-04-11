import { useState } from 'react';
import { X, UserPlus, Copy, Check, Mail, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useProject } from '../context/ProjectContext';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareDialog({ isOpen, onClose }: ShareDialogProps) {
  const { activeProjectID } = useProject();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setInviteLink(null);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/user/projects/${activeProjectID}/share`, {
        email: email.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.inviteLink) {
        setInviteLink(res.data.inviteLink);
        setSuccess('User not found. Invite link generated!');
      } else {
        setSuccess(`Access granted to ${email}`);
      }
      setEmail('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to share project');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0a0a0a] border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-zinc-900 flex items-center justify-between bg-[#0a0a0a]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
                <UserPlus size={20} className="text-blue-500" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-100">Share Project</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 hover:bg-zinc-800 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <form onSubmit={handleShare} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <Mail size={12} />
                User Email
              </label>
              <div className="relative group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="collaborator@example.com"
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all group-hover:border-zinc-700"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-3 text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus size={16} />
                  Grant Edit Access
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400 font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <Check size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-400 font-medium">{success}</p>
              </div>

              {inviteLink && (
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
                   <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest px-1">Special Invite Link</p>
                   <div className="flex gap-2">
                     <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-zinc-400 font-mono truncate flex items-center">
                        {inviteLink}
                     </div>
                     <button 
                        onClick={copyToClipboard}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-center ${
                          copied 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                            : 'bg-zinc-800/50 border-zinc-700/30 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                        }`}
                        title="Copy to clipboard"
                     >
                       {copied ? <Check size={18} /> : <Copy size={18} />}
                     </button>
                   </div>
                   <p className="text-[10px] text-zinc-600 px-1 italic">
                     Send this link to the user. Once they sign up, they'll have instant access.
                   </p>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="p-6 bg-zinc-900/30 border-t border-zinc-900">
            <p className="text-[11px] text-zinc-500 leading-relaxed text-center">
                Collaboration allows multiple users to edit files and use the terminal in real-time. Changes are broadcasted instantly to all active participants.
            </p>
        </div>
      </div>
    </div>
  );
}
