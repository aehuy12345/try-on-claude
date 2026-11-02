import { useState } from 'react';
import { Link } from 'react-router';
import RegisterForm from '../components/auth/RegisterForm.jsx';
import { useAuth } from '../context/useAuth.js';
import { MESSAGES, normalizeEmail, normalizePassword } from '../lib/validateRegister.js';

const FIELD_CODES = {
  INVALID_EMAIL: 'email',
  EMAIL_TAKEN: 'email',
  INVALID_PASSWORD: 'password',
  PASSWORD_MISMATCH: 'confirmPassword',
};

export default function RegisterPage() {
  const { register } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [emailTaken, setEmailTaken] = useState(false);
  const [formError, setFormError] = useState('');

  const handleFieldChange = (name) => {
    setServerErrors((prev) => {
      if (!prev[name]) return prev;
      const { [name]: _removed, ...rest } = prev;
      return rest;
    });
    if (name === 'email') setEmailTaken(false);
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    setServerErrors({});
    setEmailTaken(false);
    setFormError('');
    try {
      // On success AuthContext stores the token and GuestRoute redirects to /profile: no navigate here.
      await register({
        email: normalizeEmail(values.email),
        password: normalizePassword(values.password),
        confirmPassword: normalizePassword(values.confirmPassword),
      });
    } catch (err) {
      const field = FIELD_CODES[err.code];
      if (field) {
        setServerErrors({ [field]: MESSAGES[err.code] });
        setEmailTaken(err.code === 'EMAIL_TAKEN');
      } else {
        // VALIDATION_ERROR, INTERNAL_ERROR, NETWORK_ERROR hoặc mã lạ
        setFormError(MESSAGES[err.code] ?? MESSAGES.INTERNAL_ERROR);
      }
      setSubmitting(false);
    }
  };

  return (
    <section
      aria-labelledby="register-title"
      className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:py-20"
    >
      <div className="hidden lg:block" aria-hidden="true">
        <div className="relative aspect-[3/4] max-w-sm overflow-hidden rounded-[2rem] bg-gradient-to-br from-blush via-sand to-brand-100 shadow-lift">
          <div className="absolute inset-x-8 bottom-8 rounded-card bg-white/70 p-5 backdrop-blur">
            <p className="font-display text-xl text-ink-900">Thử đồ trên chính bạn</p>
            <p className="mt-1 text-sm text-ink-600">Tạo tài khoản để bắt đầu phòng thử đồ ảo.</p>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md animate-fade-up lg:mx-0">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Bắt đầu</p>
        <h1
          id="register-title"
          className="mt-3 text-balance font-display text-3xl font-medium tracking-tight sm:text-4xl"
        >
          Tạo tài khoản Try-on
        </h1>
        <p className="mt-2 text-ink-600">
          Chỉ mất một phút. Bạn sẽ hoàn thiện hồ sơ ở bước tiếp theo.
        </p>

        <div className="mt-8 rounded-card bg-white p-6 shadow-soft ring-1 ring-ink-900/5 sm:p-8">
          <RegisterForm
            onSubmit={handleSubmit}
            onFieldChange={handleFieldChange}
            submitting={submitting}
            serverErrors={serverErrors}
            emailTaken={emailTaken}
            formError={formError}
          />
        </div>

        <p className="mt-6 text-center text-sm text-ink-600 lg:text-left">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-medium text-brand-700 underline underline-offset-2">
            Đăng nhập
          </Link>
        </p>
      </div>
    </section>
  );
}
