import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plane, Mail, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getDashboardPathForRole, signInWithEmail } from '@/src/services/auth';
import { getProfileRole } from '@/src/services/profiles';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await signInWithEmail(email, password);
      const role = await getProfileRole(user.id);
      toast.success('Welcome back to Tripetrip');
      navigate(getDashboardPathForRole(role));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-indigo-600 opacity-[0.03] blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-indigo-600 opacity-[0.02] blur-[100px] rounded-full translate-y-1/3 -translate-x-1/4" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex w-12 h-12 bg-indigo-600 rounded-xl items-center justify-center mb-6 shadow-lg shadow-indigo-100">
            <Plane className="text-white w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Welcome Back</h1>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Sign in to your direct travel account</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Email Address</Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-50 border-slate-200 h-12 pl-12 rounded-xl focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-300"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Password</Label>
                <span className="text-[10px] uppercase font-bold text-slate-300 tracking-widest">Email auth</span>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-50 border-slate-200 h-12 pl-12 rounded-xl focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-300"
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white hover:bg-indigo-700 h-14 rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all">
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Log In'}
            </Button>
          </form>
        </div>

        <p className="text-center mt-12 text-xs font-bold uppercase tracking-widest text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-600 hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
