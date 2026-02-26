import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { authService } from '../services/authService';
import { User, Mail, Lock, Phone, ArrowRight, Loader2, ShieldCheck, RotateCcw } from 'lucide-react';
import { useToast } from '../hooks/useToast';

type Step = 'form' | 'otp';

function Register() {
  const navigate = useNavigate();
  const { error: errorToast, success: successToast } = useToast();
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
  });

  const [otp, setOtp] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    let strength = 0;
    if (formData.password.length >= 8) strength += 1;
    if (/[A-Z]/.test(formData.password)) strength += 1;
    if (/[a-z]/.test(formData.password)) strength += 1;
    if (/[0-9]/.test(formData.password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(formData.password)) strength += 1;
    setPasswordStrength(strength);
  }, [formData.password]);

  // Cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const id = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) { clearInterval(id); return 0; }
          return prev - 1;
        });
      }, 1000);
      cooldownRef.current = id;
      return () => clearInterval(id);
    }
  }, [resendCooldown]);

  // ─── Step 1: Send OTP ─────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.sendOtp(formData);
      setStep('otp');
      setFormData(prev => ({ ...prev, password: '' }));
      setResendCooldown(60);
      successToast('OTP sent! Please check your inbox.');
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      errorToast(axiosError.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: Verify OTP ───────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.verifyOtp(formData.email, otp);
      navigate('/products', { replace: true });
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      errorToast(axiosError.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Resend OTP ────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      await authService.resendOtp(formData.email);
      setResendCooldown(60);
      setOtp('');
      successToast('New OTP sent! Please check your inbox.');
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      errorToast(axiosError.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white w-full lg:w-1/2">
        <div className="mx-auto w-full max-w-sm lg:w-96">

          {step === 'form' ? (
            <>
              <div className="text-center lg:text-left">
                <h2 className="text-3xl font-extrabold text-gray-900">Create Account</h2>
                <p className="mt-2 text-sm text-gray-600">Join PharmaCare today</p>
              </div>

              <div className="mt-8">
                <form onSubmit={handleSendOtp} className="space-y-6">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input id="firstName" name="firstName" type="text" required
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3"
                          placeholder="John" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input id="lastName" name="lastName" type="text" required
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3"
                          placeholder="Doe" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input id="email" name="email" type="email" required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3"
                        placeholder="you@example.com" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone (Optional)</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input id="phone" name="phone" type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3"
                        placeholder="+1 (555) 000-0000" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input id="password" name="password" type="password" required minLength={8}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3"
                        placeholder="Min 8 chars, 1 upper, 1 lower, 1 number, 1 special" />
                    </div>
                    {formData.password.length > 0 && (
                      <div className="mt-2 text-xs">
                        <div className="flex gap-1 h-1.5 mb-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div key={level} className={`h-full flex-1 rounded-full transition-colors ${passwordStrength >= level
                                ? passwordStrength < 3 ? 'bg-red-500' : passwordStrength < 5 ? 'bg-yellow-500' : 'bg-green-500'
                                : 'bg-gray-200'
                              }`} />
                          ))}
                        </div>
                        <p className={passwordStrength === 5 ? 'text-green-600' : 'text-gray-500'}>
                          {passwordStrength < 3 && 'Weak: Need 8+ chars and diverse character types'}
                          {passwordStrength >= 3 && passwordStrength < 5 && 'Good: Add a number or special character'}
                          {passwordStrength === 5 && 'Strong password!'}
                        </p>
                      </div>
                    )}
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                      <span className="flex items-center">Send Verification Code <ArrowRight className="ml-2 h-4 w-4" /></span>
                    )}
                  </button>
                </form>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Already registered?</span>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Link to="/login"
                      className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                      Sign in
                    </Link>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ── Step 2: OTP Entry ── */
            <>
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 mb-4">
                  <ShieldCheck className="h-8 w-8 text-primary-600" />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900">Verify Your Email</h2>
                <p className="mt-2 text-sm text-gray-600">
                  We sent a 6-digit code to<br />
                  <span className="font-semibold text-gray-800">{formData.email}</span>
                </p>
              </div>

              <div className="mt-8">
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div>
                    <label htmlFor="otp" className="block text-sm font-medium text-gray-700 text-center mb-3">
                      Enter Verification Code
                    </label>
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                      autoFocus
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="block w-full text-center text-3xl font-mono font-bold tracking-[0.5em] border-2 border-gray-300 rounded-xl py-4 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="000000"
                    />
                    <p className="mt-2 text-xs text-center text-red-500">⏱ Code expires in 10 minutes</p>
                  </div>

                  <button type="submit" disabled={loading || otp.length !== 6}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                      <span className="flex items-center">Verify & Create Account <ShieldCheck className="ml-2 h-4 w-4" /></span>
                    )}
                  </button>
                </form>

                <div className="mt-6 flex flex-col items-center gap-3">
                  <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading}
                    className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                  </button>
                  <button
                    onClick={() => { setStep('form'); setOtp(''); }}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    ← Edit email or details
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block relative w-0 flex-1">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1950&q=80"
          alt="Pharmacy registration"
        />
        <div className="absolute inset-0 bg-primary-900 mix-blend-multiply opacity-40"></div>
        <div className="absolute inset-0 flex items-center justify-center p-12 text-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-4">Join Our Network</h1>
            <p className="text-xl text-primary-100">Get access to premium pharmaceutical products and exclusive deals.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
