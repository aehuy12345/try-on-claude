const TONES = {
  danger: 'border-danger/30 bg-danger/5 text-danger',
  success: 'border-success/30 bg-success/5 text-success',
};

/**
 * Thông báo trên form/trang. `danger` dùng role="alert" (đọc ngay), `success` dùng role="status".
 * Luôn có icon + chữ, không chỉ dựa vào màu.
 */
export default function Alert({ tone = 'danger', children, className = '' }) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${TONES[tone]} ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="mt-0.5 size-5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        {tone === 'success' ? <path d="m8 12.5 2.8 2.8L16 9.5" /> : <path d="M12 7.5v5M12 16h.01" />}
      </svg>
      <div className="text-ink-800">{children}</div>
    </div>
  );
}
