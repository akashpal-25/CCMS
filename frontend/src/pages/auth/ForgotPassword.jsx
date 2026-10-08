import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/ui/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import ErrorMessage from '../../components/common/ErrorMessage';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPassword, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      // error store me handle ho chuka hai
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <Card style={{ padding: '2.5rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-primary)' }}>Forgot Password</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Enter your registered college email. We will send a one-time password (OTP) to reset your account.
            </p>
          </div>

          <ErrorMessage message={error} />

          {sent ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-main)' }}>
                If an account exists for <strong>{email}</strong>, an OTP has been sent to that email address. It is valid for 10 minutes.
              </p>
              <Button variant="primary" icon={Mail} onClick={() => navigate('/reset-password', { state: { email } })}>
                I Have the OTP — Continue
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <Input
                label="Official College Email"
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. yourname@college.edu"
                required
              />
              <Button type="submit" variant="primary" isLoading={isLoading} icon={Mail}>
                Send OTP
              </Button>
            </form>
          )}

          <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '1.5rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)', justifyContent: 'center' }}>
            <ArrowLeft size={14} /> Back to Login
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;