import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const SignUp: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/auth/send-otp', { email });
      setStep(2);
      toast.success('Verification signal transmitted.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Transmission failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/verify-otp', {
        email,
        code: otp,
        name,
        password,
      });
      login(res.data.token, res.data.user);
      toast.success('Identity established. Welcome.');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Verification failure');
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
            <ShieldCheck className="w-6 h-6" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase">Registration Protocol</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">GENERATE <span className="text-[#c6c6c6]">ACCOUNT</span>.</h1>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#666]">
            {step === 1
              ? "Establish your identity parameters."
              : "Synchronize with the verification signal."}
          </p>
        </div>

        {/* Forms */}
        <div className="space-y-8">
          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-8">
              <div className="space-y-2 group">
                <label className="text-[10px] font-bold tracking-widest uppercase text-[#666] group-focus-within:text-white transition-colors">Nominal Identity</label>
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full bg-transparent border-b border-white/10 py-3 text-lg placeholder:text-[#333] focus:outline-none focus:border-white transition-colors"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 group">
                <label className="text-[10px] font-bold tracking-widest uppercase text-[#666] group-focus-within:text-white transition-colors">Communication Node</label>
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
                    PROCEED <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
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
              <div className="space-y-2 group">
                <label className="text-[10px] font-bold tracking-widest uppercase text-[#666] group-focus-within:text-white transition-colors">Access Key</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-transparent border-b border-white/10 py-3 text-lg placeholder:text-[#333] focus:outline-none focus:border-white transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
                      VERIFY & CREATE <ShieldCheck size={18} className="group-hover:scale-110 transition-transform" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[10px] font-bold tracking-widest uppercase text-[#666] hover:text-white transition-colors text-center"
                >
                  Identity Correction
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="pt-16 border-t border-white/5 flex items-center justify-between text-[10px] font-bold tracking-widest uppercase text-[#666]">
            <Link to="/login" className="hover:text-white transition-colors">Existing Identity</Link>
            <Link to="/" className="hover:text-white transition-colors">Return to Surface</Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
