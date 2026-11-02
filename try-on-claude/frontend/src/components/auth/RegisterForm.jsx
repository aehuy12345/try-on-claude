import { useState } from 'react';
import { Link } from 'react-router';
import Alert from '../ui/Alert.jsx';
import Button from '../ui/Button.jsx';
import TextField from '../ui/TextField.jsx';
import { validateRegister } from '../../lib/validateRegister.js';

/**
 * Form đăng ký (presentational).
 * Props:
 * - onSubmit(values): gọi khi dữ liệu qua validate client; values = { email, password, confirmPassword }
 *   (chưa chuẩn hoá; handler tự chuẩn hoá bằng normalizeEmail/normalizePassword trong lib/validateRegister.js).
 * - submitting: bool, khoá nút + hiện spinner.
 * - serverErrors: { email?, password?, confirmPassword? } lỗi theo field từ server.
 * - emailTaken: bool, khi true lỗi email kèm link "Đăng nhập".
 * - onFieldChange(name): gọi khi người dùng sửa ô `name`; cha phải xoá serverErrors[name]
 *   (và emailTaken nếu name === 'email') để lỗi server tự biến mất như lỗi client.
 * - formError: chuỗi lỗi chung (VALIDATION_ERROR, 500, lỗi mạng).
 * Dữ liệu đã nhập luôn được giữ (state cục bộ).
 */
export default function RegisterForm({
  onSubmit,
  onFieldChange,
  submitting = false,
  serverErrors = {},
  emailTaken = false,
  formError = '',
}) {
  const [values, setValues] = useState({ email: '', password: '', confirmPassword: '' });
  const [clientErrors, setClientErrors] = useState({});

  const change = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
    if (clientErrors[name]) setClientErrors((c) => ({ ...c, [name]: undefined }));
    onFieldChange?.(name);
  };

  // Lỗi client ưu tiên; không để giá trị undefined của client đè lên lỗi server.
  const errors = {};
  for (const k of ['email', 'password', 'confirmPassword']) {
    errors[k] = clientErrors[k] || serverErrors[k];
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitting) return;
    const found = validateRegister(values);
    setClientErrors(found);
    if (Object.keys(found).length === 0) {
      onSubmit(values);
    } else {
      const first = ['email', 'password', 'confirmPassword'].find((k) => found[k]);
      e.currentTarget.elements[first]?.focus();
    }
  };

  const emailError =
    errors.email && emailTaken && !clientErrors.email ? (
      <>
        {errors.email}{' '}
        <Link to="/login" className="font-medium text-brand-700 underline underline-offset-2">
          Đăng nhập
        </Link>
      </>
    ) : (
      errors.email
    );

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
        error={emailError}
        readOnly={submitting}
        required
      />
      <TextField
        name="password"
        label="Mật khẩu"
        type="password"
        autoComplete="new-password"
        hint="Ít nhất 8 ký tự, gồm chữ và số. Nên thêm chữ hoa và ký tự đặc biệt."
        value={values.password}
        onChange={change('password')}
        error={errors.password}
        readOnly={submitting}
        required
      />
      <TextField
        name="confirmPassword"
        label="Xác nhận mật khẩu"
        type="password"
        autoComplete="new-password"
        value={values.confirmPassword}
        onChange={change('confirmPassword')}
        error={errors.confirmPassword}
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
        {submitting ? 'Đang tạo tài khoản...' : 'Đăng ký'}
      </Button>
    </form>
  );
}
