import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, LogIn, Loader2, KeyRound } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [otpStep, setOtpStep] = useState(1); // 1: Email, 2: OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('http://localhost:3000/auth/login', { email, password }, { withCredentials: true });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('http://localhost:3000/auth/send-otp', { email }, { withCredentials: true });
      setOtpStep(2);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('http://localhost:3000/auth/verify-otp', { email, code: otp }, { withCredentials: true });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 font-geist">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute -top-10 -right-10 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <LogIn size={200} className="text-blue-500" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <LogIn className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h1>
          </div>

          <div className="flex bg-zinc-800/50 p-1 rounded-xl mb-8">
            <button
              onClick={() => setLoginMethod('password')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${loginMethod === 'password' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Password
            </button>
            <button
              onClick={() => {
                  setLoginMethod('otp');
                  setOtpStep(1);
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${loginMethod === 'otp' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              OTP Login
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-xl mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              {error}
            </div>
          )}

          {loginMethod === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-zinc-500" size={18} />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all border-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-zinc-500" size={18} />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all border-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-[0_0_20px_rgba(37,99,235,0.2)]"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    Sign In <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              {otpStep === 1 ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 text-zinc-500" size={18} />
                    <input
                      type="email"
                      placeholder="Email Address"
                      className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all border-none"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : (
                      <>
                        Send OTP <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3.5 text-zinc-500" size={18} />
                    <input
                      type="text"
                      placeholder="OTP Code"
                      className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all border-none"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : (
                      <>
                        Verify & Login <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOtpStep(1)}
                    className="w-full text-zinc-500 hover:text-zinc-300 text-sm py-2 transition-colors"
                  >
                    Go back
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="mt-8 text-center text-sm text-zinc-500">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-500 hover:underline font-medium">Create One</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
