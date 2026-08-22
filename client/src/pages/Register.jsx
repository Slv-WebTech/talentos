import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/authService';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/ui/Button';
import { Input, PasswordInput } from '../components/ui/Field';
import Alert from '../components/ui/Alert';
import { RoleOptionGroup, RoleOption } from '../components/ui/RoleOption';
import { InboxIcon, BriefcaseIcon } from '../components/icons/Icons';
import styles from './Register.module.css';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'candidate' });
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
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Set up your profile to start hiring or applying."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className={styles.link}>
            Log in
          </Link>
        </>
      }
    >
      {error && <Alert tone="danger">{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <div className={styles.formFields}>
          <Input
            label="Full name"
            autoComplete="name"
            placeholder="Jordan Lee"
            value={form.name}
            onChange={updateField('name')}
            required
          />
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
            autoComplete="new-password"
            placeholder="••••••••"
            helper="Minimum 8 characters"
            value={form.password}
            onChange={updateField('password')}
            minLength={8}
            required
          />
          <fieldset className={styles.roleFieldset}>
            <legend className={styles.roleLabel}>I am a…</legend>
            <RoleOptionGroup>
              <RoleOption
                name="role"
                value="candidate"
                checked={form.role === 'candidate'}
                onChange={updateField('role')}
                icon={<InboxIcon width={20} height={20} />}
                title="Candidate"
                description="Apply to jobs and track your applications"
              />
              <RoleOption
                name="role"
                value="recruiter"
                checked={form.role === 'recruiter'}
                onChange={updateField('role')}
                icon={<BriefcaseIcon width={20} height={20} />}
                title="Recruiter"
                description="Post jobs and manage your pipeline"
              />
            </RoleOptionGroup>
          </fieldset>
          <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
            Create account
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
