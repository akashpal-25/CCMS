import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, GraduationCap, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { ROLES } from '../../utils/constants';
import Card from '../../components/ui/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import ErrorMessage from '../../components/common/ErrorMessage';

// Step values: 'email' -> 'create_password' -> done, ya 'email' -> 'login_password' -> done
const Login = () => {
  const navigate = useNavigate();
  const { checkEmail, createPassword, login, isLoading, error, clearError } = useAuthStore();

  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    clearError();
    try {
      const result = await checkEmail(email);
      if (!result.exists) {
        // Custom message dikhane ke liye store ka error use kar lete hain
        useAuthStore.setState({ error: 'No account found with this email. Contact your administrator.' });
        return;
      }
      setStep(result.has_password ? 'login_password' : 'create_password');
    } catch {
      // error store me already set ho chuka hai
    }
  };

  const handleCreatePasswordSubmit = async (e) => {
    e.preventDefault();
    clearError();
    try {
      await createPassword(email, password, confirmPassword);
      // Password create hone ke baad seedha login karwa dete hain
      const profile = await login(email, password);
      redirectUser(profile);
    } catch {
      // error store me already set ho chuka hai
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    clearError();
    try {
      const profile = await login(email, password);
      redirectUser(profile);
    } catch {
      // error store me already set ho chuka hai
    }
  };

  const redirectUser = (profile) => {
    const roleNames = (profile.roles || []).map((r) => r.role_name);
    if (roleNames.includes(ROLES.STUDENT)) {
      navigate('/student');
    } else if (roleNames.length > 0 && roleNames.every((n) => n === ROLES.TEACHER)) {
      navigate('/admin/teacher/complaints');
    } else if (roleNames.length > 0) {
      navigate('/admin');
    } else {
      // Koi role assign nahi hai
      useAuthStore.setState({ error: 'No role assigned to this account. Contact administrator.' });
    }
  };

  const goBackToEmail = () => {
    clearError();
    setPassword('');
    setConfirmPassword('');
    setStep('email');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'var(--gradient-hero)' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <Card style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <img src="/icons/axis-logo.png" alt="Axis" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>CCMS Portal</h2>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              College Complaint Management & SLA Grievance System
            </p>
          </div>

          <ErrorMessage message={error} />

          {/* STEP 1: Email */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <Input
                label="Official College Email"
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. yourname@college.edu"
                required
              />
              <Button type="submit" variant="primary" isLoading={isLoading} icon={LogIn}>
                Continue
              </Button>
            </form>
          )}

          {/* STEP 2a: Create Password (first-time user) */}
          {step === 'create_password' && (
            <form onSubmit={handleCreatePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                This is your first login. Please create a password for <strong>{email}</strong>.
              </p>
              <Input
                label="New Password"
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
              />
              <Input
                label="Confirm Password"
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
              />
              <Button type="submit" variant="primary" isLoading={isLoading} icon={LogIn}>
                Create Password & Login
              </Button>
              <button type="button" onClick={goBackToEmail} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                <ArrowLeft size={14} /> Use a different email
              </button>
            </form>
          )}

          {/* STEP 2b: Normal Login */}
          {step === 'login_password' && (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                Logging in as <strong>{email}</strong>
              </p>
              <Input
                label="Password"
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <Button type="submit" variant="primary" isLoading={isLoading} icon={LogIn}>
                Login to Account
              </Button>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button type="button" onClick={goBackToEmail} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  <ArrowLeft size={14} /> Use a different email
                </button>
                <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>
                  Forgot Password?
                </Link>
              </div>
            </form>
          )}

          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '1.5rem', textAlign: 'center' }}>
            Protected academic intranet portal. Unauthorized access is monitored.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Login;