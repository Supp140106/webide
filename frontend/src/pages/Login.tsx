import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Terminal, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [otpStep, setOtpStep] = useState(1); // 1: Email, 2: OTP
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:3000/auth/login', { email, password }, { withCredentials: true });
      login(res.data.token, res.data.user);
      toast.success('Access granted. Welcome to the kernel.');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Authentication sequence failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('http://localhost:3000/auth/send-otp', { email }, { withCredentials: true });
      setOtpStep(2);
      toast.success('Transmission sent. Check your secure inbox.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Signal transmission failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:3000/auth/verify-otp', { email, code: otp }, { withCredentials: true });
      login(res.data.token, res.data.user);
      toast.success('Identity verified. Accessing workspace.');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Verification checksum mismatch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#e5e2e1] flex flex-col items-center justify-center p-6 font-sans selection:bg-white/10">
      <div className="w-full max-w-sm space-y-16">
        {/* Header */}
        <div className="space-y-4 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3 opacity-80">
            <Terminal className="w-6 h-6" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase">Security Protocol</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">RETURN TO THE <span className="text-[#c6c6c6]">VOID</span>.</h1>
        </div>

        {/* Method Toggle */}
        <div className="flex border-b border-white/10">
           <button 
             onClick={() => setLoginMethod('password')}
             className={`pb-4 px-2 text-xs font-bold tracking-widest uppercase transition-all relative ${loginMethod === 'password' ? 'text-white' : 'text-[#666] hover:text-[#999]'}`}
           >
             Core Access
             {loginMethod === 'password' && <div className="absolute bottom-[-1px] left-0 w-full h-[1px] bg-white" />}
           </button>
           <button 
             onClick={() => { setLoginMethod('otp'); setOtpStep(1); }}
             className={`pb-4 px-8 text-xs font-bold tracking-widest uppercase transition-all relative ${loginMethod === 'otp' ? 'text-white' : 'text-[#666] hover:text-[#999]'}`}
           >
             Remote OTP
             {loginMethod === 'otp' && <div className="absolute bottom-[-1px] left-0 w-full h-[1px] bg-white" />}
           </button>
        </div>

        {/* Forms */}
        <div className="space-y-8">
          {loginMethod === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-8">
              <div className="space-y-2 group">
                <label className="text-[10px] font-bold tracking-widest uppercase text-[#666] group-focus-within:text-white transition-colors">Identity Hash</label>
                <input
                  type="email"
                  placeholder="name@domain.com"
                  className="w-full bg-transparent border-b border-white/10 py-3 text-lg placeholder:text-[#333] focus:outline-none focus:border-white transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 group">
                <label className="text-[10px] font-bold tracking-widest uppercase text-[#666] group-focus-within:text-white transition-colors">Coded Key</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-transparent border-b border-white/10 py-3 text-lg placeholder:text-[#333] focus:outline-none focus:border-white transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black font-bold py-5 rounded-none flex items-center justify-center gap-3 hover:bg-[#e5e2e1] transition-colors disabled:opacity-50 group"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    INITIALIZE <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-8">
              {otpStep === 1 ? (
                <form onSubmit={handleSendOtp} className="space-y-8">
                  <div className="space-y-2 group">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-[#666] group-focus-within:text-white transition-colors">Target Address</label>
                    <input
                      type="email"
                      placeholder="name@domain.com"
                      className="w-full bg-transparent border-b border-white/10 py-3 text-lg placeholder:text-[#333] focus:outline-none focus:border-white transition-colors"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-white text-black font-bold py-5 rounded-none flex items-center justify-center gap-3 hover:bg-[#e5e2e1] transition-colors disabled:opacity-50 group"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : (
                      <>
                        SIGNAL TRANSMISSION <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-8">
                  <div className="space-y-2 group">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-[#666] group-focus-within:text-white transition-colors">Transmission Code</label>
                    <input
                      type="text"
                      placeholder="000000"
                      className="w-full bg-transparent border-b border-white/10 py-3 text-lg tracking-[0.5em] placeholder:text-[#333] focus:outline-none focus:border-white transition-colors text-center md:text-left"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="flex flex-col gap-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-white text-black font-bold py-5 rounded-none flex items-center justify-center gap-3 hover:bg-[#e5e2e1] transition-colors disabled:opacity-50 group"
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : (
                        <>
                          VERIFY IDENTITY <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOtpStep(1)}
                      className="text-[10px] font-bold tracking-widest uppercase text-[#666] hover:text-white transition-colors text-center"
                    >
                      Resynchronize Address
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-16 border-t border-white/5 flex items-center justify-between text-[10px] font-bold tracking-widest uppercase text-[#666]">
            <Link to="/signup" className="hover:text-white transition-colors">Generate Account</Link>
            <Link to="/" className="hover:text-white transition-colors">Return to Surface</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
