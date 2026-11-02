import { useState } from 'react';
import Alert from '../ui/Alert.jsx';
import Button from '../ui/Button.jsx';
import TextField from '../ui/TextField.jsx';
import { validateLogin } from '../../lib/validateLogin.js';

const FIELDS = ['email', 'password'];

/**
 * Form đăng nhập (presentational).
 * Props:
 * - onSubmit(values): gọi khi qua validate client; values = { email, password } (chưa chuẩn hoá,
 *   handler tự chuẩn hoá). Có thể trả về Promise<{ clearPassword?: boolean } | void>: nếu
 *   clearPassword thì form xoá ô mật khẩu và focus lại vào đó (email luôn được giữ).
 * - submitting: bool, khoá nút + hiện spinner.
 * - formError: chuỗi lỗi chung trên form (không gắn với ô nào).
 * - onFieldChange(name): gọi khi người dùng sửa ô `name` (cha có thể xoá formError).
 */
export default function LoginForm({ onSubmit, onFieldChange, submitting = false, formError = '' }) {
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  const change = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
    if (errors[name]) setErrors((c) => ({ ...c, [name]: undefined }));
    onFieldChange?.(name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const form = e.currentTarget;
    const found = validateLogin(values);
    setErrors(found);
    const first = FIELDS.find((k) => found[k]);
    if (first) {
      form.elements[first]?.focus();
      return;
    }
    const result = await onSubmit(values);
    if (result?.clearPassword) {
      setValues((v) => ({ ...v, password: '' }));
      form.elements.password?.focus();
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {formError && <Alert tone="danger">{formError}</Alert>}

      <TextField
        name="email"
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="ban@example.com"
        value={values.email}
        onChange={change('email')}
        error={errors.email}
        readOnly={submitting}
        required
      />
      <TextField
        name="password"
        label="Mật khẩu"
        type="password"
        autoComplete="current-password"
        value={values.password}
        onChange={change('password')}
        error={errors.password}
        readOnly={submitting}
        required
      />

      <Button type="submit" className="w-full" disabled={submitting} aria-busy={submitting}>
        {submitting && (
          <svg
            viewBox="0 0 24 24"
            className="size-4 animate-spin"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 3a9 9 0 1 0 9 9" />
          </svg>
        )}
        {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </Button>
    </form>
  );
}
