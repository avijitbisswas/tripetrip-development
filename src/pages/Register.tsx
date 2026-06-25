import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plane, Mail, Lock, Loader2, User, Building2, Smartphone, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { completeRegistration, getDashboardPathForRole, requestRegistrationOtp } from '@/src/services/auth';
import { isValidEmail, isValidMobileNumber, isValidPassword } from '@/src/features/auth/validation';
import { getPublicSiteConfig } from '@/src/services/admin';

type RegisterRole = 'traveler' | 'vendor';
type RegisterStep = 'details' | 'otp';

export default function Register() {
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState<RegisterRole>((searchParams.get('role') as RegisterRole) || 'traveler');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<RegisterStep>('details');
  const [loading, setLoading] = useState(false);
  const [challengeToken, setChallengeToken] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const interval = window.setInterval(() => {
      setResendCountdown((value) => (value > 0 ? value - 1 : 0));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [resendCountdown]);

  useEffect(() => {
    let mounted = true;

    getPublicSiteConfig()
      .then((payload) => {
        if (!mounted) return;
        const system = ((payload.system as Record<string, unknown> | undefined) || {}) as Record<string, unknown>;
        setRegistrationEnabled(system.registrationEnabled !== false);
      })
      .catch(() => {
        if (mounted) setRegistrationEnabled(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const validateDetails = () => {
    if (!fullName.trim()) return 'Enter your full name';
    if (!isValidEmail(email)) return 'Enter a valid email address';
    if (!isValidMobileNumber(mobile)) return 'Enter a valid mobile number';
    if (!isValidPassword(password)) return 'Use at least 8 characters with letters and numbers';
    return null;
  };

  const sendOtp = async () => {
    if (!registrationEnabled) {
      toast.error('Registration is temporarily disabled');
      return;
    }

    const validationError = validateDetails();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);
    try {
      const response = await requestRegistrationOtp({
        email,
        fullName,
        mobile,
        role,
      });

      setChallengeToken(response.challengeToken);
      setMaskedEmail(response.maskedEmail);
      setStep('otp');
      setResendCountdown(60);
      toast.success('Verification code sent');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send verification code';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'details') {
      await sendOtp();
      return;
    }

    if (!otp.trim() || otp.trim().length !== 6) {
      toast.error('Enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      await completeRegistration({
        challengeToken,
        otp,
        password,
        email,
      });

      toast.success('Registration successful. Welcome to Tripetrip!');
      navigate(getDashboardPathForRole(role));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0 || loading) return;
    await sendOtp();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[50vw] h-[50vw] bg-indigo-600 opacity-[0.03] blur-[120px] rounded-full -translate-y-1/2 -translate-x-1/3" />

      <div className="w-full max-w-xl relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex w-12 h-12 bg-indigo-600 rounded-xl items-center justify-center mb-6 shadow-lg shadow-indigo-100">
            <Plane className="text-white w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
            {step === 'details' ? 'Create Account' : 'Verify Email'}
          </h1>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">
            {step === 'details' ? 'Join the Tripetrip community' : `Code sent to ${maskedEmail || 'your email'}`}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-xl">
          {!registrationEnabled ? (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              Registration is temporarily disabled by the Tripetrip admin team.
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-4 mb-10 p-1 bg-slate-50 rounded-xl border border-slate-100">
            <button
              type="button"
              onClick={() => setRole('traveler')}
              disabled={step === 'otp'}
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
              disabled={step === 'otp'}
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
                  disabled={step === 'otp'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Mobile Number</Label>
              <div className="relative group">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                <Input
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="bg-slate-50 border-slate-200 h-12 pl-12 rounded-xl focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-300"
                  placeholder="9876543210 or +919876543210"
                  required
                  disabled={step === 'otp'}
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
                  disabled={step === 'otp'}
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
                  placeholder="At least 8 characters with letters and numbers"
                  required
                  disabled={step === 'otp'}
                />
              </div>
            </div>

            {step === 'otp' && (
              <div className="space-y-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Email verification required</p>
                    <p className="text-xs uppercase tracking-widest text-slate-500 mt-1">
                      Enter the 6-digit code from your inbox to finish creating your account.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">OTP Code</Label>
                  <Input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="bg-white border-slate-200 h-12 rounded-xl focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-300 text-center tracking-[0.4em] text-lg font-semibold"
                    placeholder="123456"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-slate-500 hover:text-slate-700"
                    onClick={() => {
                      setStep('details');
                      setOtp('');
                    }}
                  >
                    Change details
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResend}
                    disabled={resendCountdown > 0 || loading}
                    className="border-slate-200 bg-white"
                  >
                    {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend OTP'}
                  </Button>
                </div>
              </div>
            )}

            <Button type="submit" disabled={loading || !registrationEnabled} className="w-full bg-indigo-600 text-white hover:bg-indigo-700 h-14 rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-indigo-100 mt-4 transition-all disabled:bg-slate-300">
              {loading ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : step === 'details' ? (
                'Send Verification Code'
              ) : (
                `Verify & Register as ${role}`
              )}
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
