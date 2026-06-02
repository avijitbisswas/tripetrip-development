import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plane, Mail, Lock, Loader2, User, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getDashboardPathForRole, registerWithEmail } from '@/src/services/auth';
import { upsertVendorProfile } from '@/src/services/vendors';

export default function Register() {
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState<'traveler' | 'vendor'>((searchParams.get('role') as any) || 'traveler');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await registerWithEmail({
        email,
        password,
        fullName,
        role,
      });

      if (user && role === 'vendor') {
        const { generateSlug } = await import('@/src/lib/utils');
        const businessName = `${fullName}'s Travel Services`;
        await upsertVendorProfile({
          user_id: user.id,
          business_name: businessName,
          business_type: 'stays',
          slug: `${generateSlug(businessName)}-${user.id.slice(0, 4)}`,
        });
      }

      toast.success('Registration successful. Welcome to Tripetrip!');
      navigate(getDashboardPathForRole(role));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[50vw] h-[50vw] bg-indigo-600 opacity-[0.03] blur-[120px] rounded-full -translate-y-1/2 -translate-x-1/3" />

      <div className="w-full max-w-xl relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex w-12 h-12 bg-indigo-600 rounded-xl items-center justify-center mb-6 shadow-lg shadow-indigo-100">
            <Plane className="text-white w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Create Account</h1>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Join the Tripetrip community</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-xl">
          <div className="grid grid-cols-2 gap-4 mb-10 p-1 bg-slate-50 rounded-xl border border-slate-100">
            <button
              type="button"
              onClick={() => setRole('traveler')}
              className={cn(
                'flex items-center justify-center space-x-2 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all',
                role === 'traveler' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600',
              )}
            >
              <User className="w-4 h-4" />
              <span>Traveler</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('vendor')}
              className={cn(
                'flex items-center justify-center space-x-2 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all',
                role === 'vendor' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600',
              )}
            >
              <Building2 className="w-4 h-4" />
              <span>Vendor</span>
            </button>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Full Name</Label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-slate-50 border-slate-200 h-12 pl-12 rounded-xl focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-300"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Email Address</Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-50 border-slate-200 h-12 pl-12 rounded-xl focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-300"
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Password</Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-50 border-slate-200 h-12 pl-12 rounded-xl focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-300"
                  placeholder="Min 6 characters"
                  required
                />
              </div>
            </div>

            <Button disabled={loading} className="w-full bg-indigo-600 text-white hover:bg-indigo-700 h-14 rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-indigo-100 mt-4 transition-all">
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : `Register as ${role}`}
            </Button>
          </form>
        </div>

        <p className="text-center mt-12 text-xs font-bold uppercase tracking-widest text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline">Log in here</Link>
        </p>
      </div>
    </div>
  );
}
