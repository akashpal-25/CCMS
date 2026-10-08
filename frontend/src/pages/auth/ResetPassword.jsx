import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { KeyRound, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { validatePasswordStrength } from '../../utils/validators';
import Card from '../../components/ui/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import ErrorMessage from '../../components/common/ErrorMessage';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOtpAndReset, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const errs = {};
    if (!email) errs.email = 'Email is required.';
    if (!otp || otp.trim().length !== 6) errs.otp = 'Enter the 6-digit OTP sent to your email.';
    const pwErrors = validatePasswordStrength(newPassword);
    if (pwErrors.length > 0) errs.newPassword = pwErrors.join(' ');
    if (newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    if (!validate()) return;
    try {
      await verifyOtpAndReset(email, otp.trim(), newPassword, confirmPassword);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch {
      // error store me handle ho chuka hai
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <Card style={{ padding: '2.5rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-primary)' }}>Reset Password</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Enter the OTP sent to your email along with your new password.
            </p>
          </div>

          <ErrorMessage message={error} />

          {success ? (
            <p style={{ fontSize: '0.875rem', color: 'var(--status-resolved-text)', fontWeight: 600 }}>
              Password reset successful. Redirecting to login...
            </p>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <Input
                label="Official College Email"
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. yourname@college.edu"
                error={fieldErrors.email}
                required
              />
              <Input
                label="6-Digit OTP"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP from your email"
                error={fieldErrors.otp}
                required
              />
              <Input
                label="New Password"
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters, 1 upper, 1 lower, 1 number, 1 special"
                error={fieldErrors.newPassword}
                required
              />
              <Input
                label="Confirm New Password"
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                error={fieldErrors.confirmPassword}
                required
              />
              <Button type="submit" variant="primary" isLoading={isLoading} icon={KeyRound}>
                Reset Password
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

export default ResetPassword;