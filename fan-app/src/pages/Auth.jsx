import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../App';
import { Shield, Mail, Lock, User, Globe, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

export default function Auth() {
  const { login } = useAuth();
  const [view, setView] = useState('login'); // 'login' | 'register' | 'forgot' | 'reset'

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('en');

  // Forgot password flow states
  const [forgotEmail, setForgotEmail] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // UI utilities
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed.');
      }

      login(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role: 'fan',
          preferred_language: preferredLanguage
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      login(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      setError('Please enter your email.');
      return;
    }
    setError('');
    setLoading(true);

    setTimeout(() => {
      // Generate a mock code
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedCode(code);
      setSuccess(`A password reset verification code has been simulated! Try: ${code}`);
      setLoading(false);
      setView('reset');
    }, 800);
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (enteredCode !== generatedCode) {
      setError('Invalid verification code.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, password: newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Password reset failed.');
      }

      setSuccess('Your password has been successfully reset! You can now log in.');
      setView('login');
      setEmail(forgotEmail);
      setPassword('');
      
      // Clean up forgot variables
      setForgotEmail('');
      setGeneratedCode('');
      setEnteredCode('');
      setNewPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Brand */}
        <div style={styles.brandContainer}>
          <div style={styles.logoCircle}>
            <Shield color="var(--accent-blue)" size={24} />
          </div>
          <h1 style={styles.brandName}>StadiumAI</h1>
          <p style={styles.brandSubtitle}>MetLife Stadium fan app portal</p>
        </div>

        {/* Message banners */}
        {error && (
          <div style={styles.errorBanner}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div style={styles.successBanner}>
            <CheckCircle size={16} />
            <span>{success}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {view === 'login' && (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleLoginSubmit}
              style={styles.form}
            >
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email Address</label>
                <div style={styles.inputWrapper}>
                  <Mail style={styles.inputIcon} size={18} />
                  <input
                    type="email"
                    style={styles.input}
                    placeholder="name@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={styles.label}>Password</label>
                  <button
                    type="button"
                    onClick={() => { clearMessages(); setView('forgot'); }}
                    style={styles.linkButton}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div style={styles.inputWrapper}>
                  <Lock style={styles.inputIcon} size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    style={styles.input}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    style={styles.eyeBtn}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} style={styles.submitBtn}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              <p style={styles.switchText}>
                New to StadiumAI?{' '}
                <button
                  type="button"
                  onClick={() => { clearMessages(); setView('register'); }}
                  style={styles.inlineLink}
                >
                  Register
                </button>
              </p>
            </motion.form>
          )}

          {view === 'register' && (
            <motion.form
              key="register"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleRegisterSubmit}
              style={styles.form}
            >
              <div style={styles.inputGroup}>
                <label style={styles.label}>Full Name</label>
                <div style={styles.inputWrapper}>
                  <User style={styles.inputIcon} size={18} />
                  <input
                    type="text"
                    style={styles.input}
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Email Address</label>
                <div style={styles.inputWrapper}>
                  <Mail style={styles.inputIcon} size={18} />
                  <input
                    type="email"
                    style={styles.input}
                    placeholder="name@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Password</label>
                <div style={styles.inputWrapper}>
                  <Lock style={styles.inputIcon} size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    style={styles.input}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    style={styles.eyeBtn}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Preferred Language</label>
                <div style={styles.inputWrapper}>
                  <Globe style={styles.inputIcon} size={18} />
                  <select
                    style={styles.select}
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="pt">Português</option>
                  </select>
                </div>
              </div>

              <button type="submit" disabled={loading} style={styles.submitBtn}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>

              <p style={styles.switchText}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { clearMessages(); setView('login'); }}
                  style={styles.inlineLink}
                >
                  Sign In
                </button>
              </p>
            </motion.form>
          )}

          {view === 'forgot' && (
            <motion.form
              key="forgot"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleForgotSubmit}
              style={styles.form}
            >
              <h3 style={styles.formTitle}>Forgot Password</h3>
              <p style={styles.formDesc}>
                Enter the email address associated with your account, and we'll send a simulated recovery code to verify your identity.
              </p>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Email Address</label>
                <div style={styles.inputWrapper}>
                  <Mail style={styles.inputIcon} size={18} />
                  <input
                    type="email"
                    style={styles.input}
                    placeholder="name@domain.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} style={styles.submitBtn}>
                {loading ? 'Sending Code...' : 'Get Recovery Code'}
              </button>

              <button
                type="button"
                onClick={() => { clearMessages(); setView('login'); }}
                style={styles.backBtn}
              >
                Back to Sign In
              </button>
            </motion.form>
          )}

          {view === 'reset' && (
            <motion.form
              key="reset"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleResetSubmit}
              style={styles.form}
            >
              <h3 style={styles.formTitle}>Reset Password</h3>
              <p style={styles.formDesc}>
                Type the verification code shown above and create your new secure password.
              </p>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Verification Code</label>
                <input
                  type="text"
                  style={styles.inputNoIcon}
                  placeholder="e.g. 4832"
                  value={enteredCode}
                  onChange={(e) => setEnteredCode(e.target.value)}
                  maxLength={4}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>New Password</label>
                <div style={styles.inputWrapper}>
                  <Lock style={styles.inputIcon} size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    style={styles.input}
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    style={styles.eyeBtn}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} style={styles.submitBtn}>
                {loading ? 'Resetting Password...' : 'Save New Password'}
              </button>

              <button
                type="button"
                onClick={() => { clearMessages(); setView('forgot'); }}
                style={styles.backBtn}
              >
                Cancel and back
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'radial-gradient(circle at top right, rgba(30, 42, 110, 0.4), transparent 50%), radial-gradient(circle at bottom left, rgba(6, 182, 212, 0.1), transparent 50%), #0a0e27',
    padding: '20px',
    boxSizing: 'border-box',
    fontFamily: 'Inter, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '24px',
    backdropFilter: 'blur(16px)',
    padding: '32px 28px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
    boxSizing: 'border-box',
  },
  brandContainer: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  logoCircle: {
    width: '48px',
    height: '48px',
    borderRadius: '16px',
    background: 'rgba(59, 130, 246, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px',
  },
  brandName: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#fff',
    margin: 0,
  },
  brandSubtitle: {
    fontSize: '0.8125rem',
    color: '#94a3b8',
    margin: '4px 0 0 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  formTitle: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: '1.125rem',
    fontWeight: 600,
    color: '#fff',
    margin: '0 0 4px 0',
  },
  formDesc: {
    fontSize: '0.8125rem',
    color: '#94a3b8',
    lineHeight: 1.5,
    margin: '0 0 8px 0',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#cbd5e1',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: '#94a3b8',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '12px 40px',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '0.875rem',
    transition: 'all 0.2s',
    outline: 'none',
    boxSizing: 'border-box',
  },
  inputNoIcon: {
    width: '100%',
    padding: '12px 14px',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '0.875rem',
    transition: 'all 0.2s',
    outline: 'none',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '12px 40px',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box',
    cursor: 'pointer',
    WebkitAppearance: 'none',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: 'var(--accent-blue)',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    background: 'var(--gradient-primary)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.9375rem',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
    marginTop: '6px',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '0.8125rem',
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'center',
    marginTop: '6px',
  },
  switchText: {
    fontSize: '0.8125rem',
    color: '#94a3b8',
    textAlign: 'center',
    margin: '12px 0 0 0',
  },
  inlineLink: {
    background: 'none',
    border: 'none',
    color: 'var(--accent-blue)',
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
    textDecoration: 'underline',
  },
  errorBanner: {
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    borderRadius: '12px',
    padding: '10px 14px',
    color: 'var(--accent-red)',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  successBanner: {
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    borderRadius: '12px',
    padding: '10px 14px',
    color: 'var(--accent-green)',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
};
