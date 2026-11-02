import { useId, useState } from 'react';

function EyeIcon({ off }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M4 4l16 16" />}
    </svg>
  );
}

/**
 * Ô nhập có label luôn hiển thị, gợi ý và thông báo lỗi liên kết bằng aria-describedby.
 * - `error`: chuỗi lỗi (hoặc node, ví dụ kèm link). Có lỗi thì viền danger + aria-invalid.
 * - `type="password"` tự có nút Hiện/Ẩn mật khẩu.
 */
export default function TextField({
  label,
  hint,
  error,
  type = 'text',
  className = '',
  ...props
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === 'password';
  const showHint = Boolean(hint) && !error;
  const describedBy = [error ? errorId : null, showHint ? hintId : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-800">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && revealed ? 'text' : type}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy || undefined}
          className={`block h-12 w-full rounded-xl border bg-white px-4 text-base text-ink-900 placeholder:text-ink-500 transition duration-200 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30 disabled:opacity-60 ${
            error ? 'border-danger' : 'border-ink-200'
          } ${isPassword ? 'pr-12' : ''}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            aria-pressed={revealed}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-ink-600 transition hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-600"
          >
            <EyeIcon off={revealed} />
          </button>
        )}
      </div>
      {showHint && (
        <p id={hintId} className="mt-1.5 text-sm text-ink-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 flex items-start gap-1.5 text-sm text-danger">
          <svg
            viewBox="0 0 24 24"
            className="mt-0.5 size-4 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v5M12 16h.01" />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
