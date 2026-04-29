import React, { useState } from 'react';
import api from '../services/api';

const Login = () => {
  const [mode, setMode]           = useState('login');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [name, setName]           = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await api.post('/auth/login', { email, password });
        if (res.data?.token) {
          localStorage.setItem('token', res.data.token);
          window.location.href = '/';
        }
      } else {
        await api.post('/auth/register', { email, password, name });
        setSuccess('Account created! You can now sign in.');
        setMode('login');
        setName('');
      }
    } catch (err) {
      setError(err.response?.data?.message || (mode === 'login' ? 'Invalid email or password.' : 'Registration failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100%', padding: '40px 24px',
    }}>
      <div style={{
        width: '100%', maxWidth: 400,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-accent)',
        borderRadius: 'var(--radius-xl)',
        padding: '40px 36px',
        boxShadow: 'var(--shadow-glass), var(--shadow-glow)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Top ambient glow */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 180,
          background: 'radial-gradient(ellipse 100% 80% at 50% -20%, rgba(14,165,233,0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo mark */}
        <div style={{ textAlign: 'center', marginBottom: 32, position: 'relative' }}>
          <div style={{
            width: 52, height: 52, margin: '0 auto 16px',
            background: 'var(--grad-brand)',
            borderRadius: 14,
            boxShadow: 'var(--shadow-glow)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 60%)' }} />
          </div>
          <h2 style={{ marginBottom: 4 }}>
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            {mode === 'login' ? 'Sign in to Outreach.ai' : 'Join Outreach.ai'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'register' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Full name <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={{ width: '100%' }} autoComplete="name" />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required style={{ width: '100%' }} autoComplete="email" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required style={{ width: '100%' }} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </div>

          {error && (
            <div style={{ padding: '10px 14px', background: 'var(--status-danger-dim)', border: '1px solid var(--status-danger-border)', borderRadius: 'var(--radius-sm)', color: 'var(--status-danger)', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ padding: '10px 14px', background: 'var(--status-success-dim)', border: '1px solid var(--status-success-border)', borderRadius: 'var(--radius-sm)', color: 'var(--status-success)', fontSize: '0.85rem' }}>
              {success}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: 700, marginTop: 6, opacity: loading ? 0.7 : 1 }}>
            {loading
              ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
              : (mode === 'login' ? 'Sign In →' : 'Create Account →')
            }
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.8rem', color: 'var(--text-muted)', position: 'relative' }}>
          {mode === 'login' ? (
            <>
              No account?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); setError(''); setSuccess(''); setMode('register'); }} style={{ color: 'var(--accent-light)', fontWeight: 600 }}>
                Create one
              </a>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); setError(''); setSuccess(''); setMode('login'); }} style={{ color: 'var(--accent-light)', fontWeight: 600 }}>
                Sign in
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default Login;
