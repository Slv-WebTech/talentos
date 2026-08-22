import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/authService';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/ui/Button';
import { Input, PasswordInput } from '../components/ui/Field';
import Alert from '../components/ui/Alert';
import styles from './Login.module.css';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function updateField(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to continue to your dashboard."
      footer={
        <>
          No account yet?{' '}
          <Link to="/register" className={styles.link}>
            Register
          </Link>
        </>
      }
    >
      {error && <Alert tone="danger">{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <div className={styles.formFields}>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={updateField('email')}
            required
          />
          <PasswordInput
            label="Password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={form.password}
            onChange={updateField('password')}
            required
          />
          <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
            Log in
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
