import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import LoginForm from '../components/auth/LoginForm.jsx';
import Alert from '../components/ui/Alert.jsx';
import { useAuth } from '../context/useAuth.js';
import { LOGIN_MESSAGES, normalizeEmail, normalizePassword } from '../lib/validateLogin.js';

export default function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const sessionExpired = location.state?.reason === 'session_expired';
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (values) => {
    setSubmitting(true);
    setFormError('');
    try {
      // On success AuthContext stores the token and GuestRoute redirects to state.from or /profile: no navigate here.
      await login({
        email: normalizeEmail(values.email),
        password: normalizePassword(values.password),
      });
      return undefined;
    } catch (err) {
      setFormError(LOGIN_MESSAGES[err.code] ?? LOGIN_MESSAGES.INTERNAL_ERROR);
      setSubmitting(false);
      // Sai thông tin đăng nhập: xoá mật khẩu, giữ email. Các lỗi khác giữ cả hai ô.
      return { clearPassword: err.code === 'INVALID_CREDENTIALS' };
    }
  };

  return (
    <section
      aria-labelledby="login-title"
      className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:py-20"
    >
      <div className="hidden lg:block" aria-hidden="true">
        <div className="relative aspect-[3/4] max-w-sm overflow-hidden rounded-[2rem] bg-gradient-to-br from-blush via-sand to-brand-100 shadow-lift">
          <div className="absolute inset-x-8 bottom-8 rounded-card bg-white/70 p-5 backdrop-blur">
            <p className="font-display text-xl text-ink-900">Chào mừng trở lại</p>
            <p className="mt-1 text-sm text-ink-600">Đăng nhập để tiếp tục phòng thử đồ của bạn.</p>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md animate-fade-up lg:mx-0">
        {sessionExpired && (
          <Alert tone="warning" className="mb-6">
            {LOGIN_MESSAGES.SESSION_EXPIRED}
          </Alert>
        )}
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
          Chào mừng trở lại
        </p>
        <h1
          id="login-title"
          className="mt-3 text-balance font-display text-3xl font-medium tracking-tight sm:text-4xl"
        >
          Đăng nhập Try-on
        </h1>
        <p className="mt-2 text-ink-600">Nhập email và mật khẩu để vào phòng thử đồ.</p>

        <div className="mt-8 rounded-card bg-white p-6 shadow-soft ring-1 ring-ink-900/5 sm:p-8">
          <LoginForm
            onSubmit={handleSubmit}
            onFieldChange={() => setFormError('')}
            submitting={submitting}
            formError={formError}
          />
        </div>

        <p className="mt-6 text-center text-sm text-ink-600 lg:text-left">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-medium text-brand-700 underline underline-offset-2">
            Đăng ký
          </Link>
        </p>
      </div>
    </section>
  );
}
