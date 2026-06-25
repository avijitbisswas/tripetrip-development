import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { completePasswordReset, requestPasswordResetOtp } from '@/src/services/auth';
import { isValidEmail, isValidPassword } from '@/src/features/auth/validation';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [challengeToken, setChallengeToken] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const interval = window.setInterval(() => {
      setResendCountdown((value) => (value > 0 ? value - 1 : 0));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [resendCountdown]);

  const requestOtp = async () => {
    if (!isValidEmail(email)) {
      toast.error('Enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await requestPasswordResetOtp(email);
      setChallengeToken(response.challengeToken);
      setMaskedEmail(response.maskedEmail);
      setResendCountdown(60);
      setStep('verify');
      toast.success('Password reset code sent');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send reset code';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 'request') {
      await requestOtp();
      return;
    }

    if (!otp.trim() || otp.trim().length !== 6) {
      toast.error('Enter the 6-digit OTP');
      return;
    }

    if (!isValidPassword(password)) {
      toast.error('Use at least 8 characters with letters and numbers');
      return;
    }

    setLoading(true);
    try {
      await completePasswordReset({
        challengeToken,
        otp,
        password,
      });
      toast.success('Password updated. You can log in now.');
      navigate('/login');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to reset password';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-indigo-600 opacity-[0.03] blur-[120px] rounded-full -translate-y-1/3 translate-x-1/4" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex w-12 h-12 bg-indigo-600 rounded-xl items-center justify-center mb-6 shadow-lg shadow-indigo-100">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Reset Password</h1>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">
            {step === 'request' ? 'Request a verification code' : `Code sent to ${maskedEmail || 'your email'}`}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  disabled={step === 'verify'}
                />
              </div>
            </div>

            {step === 'verify' && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">OTP Code</Label>
                  <Input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="bg-slate-50 border-slate-200 h-12 rounded-xl focus:ring-2 focus:ring-indigo-100 text-center tracking-[0.4em] text-lg font-semibold"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">New Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-slate-50 border-slate-200 h-12 pl-12 rounded-xl focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-300"
                      placeholder="At least 8 characters with letters and numbers"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <Button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white hover:bg-indigo-700 h-14 rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all">
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : step === 'request' ? 'Send Reset Code' : 'Reset Password'}
            </Button>
          </form>

          {step === 'verify' && (
            <div className="flex items-center justify-between mt-6">
              <Button type="button" variant="ghost" onClick={() => setStep('request')} className="text-slate-500">
                Change email
              </Button>
              <Button type="button" variant="outline" disabled={loading || resendCountdown > 0} onClick={requestOtp}>
                {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend OTP'}
              </Button>
            </div>
          )}
        </div>

        <p className="text-center mt-10 text-xs font-bold uppercase tracking-widest text-slate-400">
          Remembered your password?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline">Go back to login</Link>
        </p>
      </div>
    </div>
  );
}
