import { Link } from 'react-router';

export default function Logo({ light = false, className = '' }) {
  return (
    <Link
      to="/"
      aria-label="Try-on, về trang chủ"
      className={`inline-flex items-center gap-2 ${light ? 'text-canvas' : 'text-ink-900'} ${className}`}
    >
      <svg viewBox="0 0 32 32" className="size-7" fill="none" aria-hidden="true">
        <path
          d="M16 9.5a2.5 2.5 0 1 0-2.5-2.5M16 9.5v2.2M16 11.7 4.5 20.3A1.6 1.6 0 0 0 5.4 23h21.2a1.6 1.6 0 0 0 .9-2.7L16 11.7Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="25.5" cy="6.5" r="1.6" className={light ? 'fill-gold-300' : 'fill-gold-500'} />
      </svg>
      <span className="font-display text-2xl font-semibold tracking-tight">Try-on</span>
    </Link>
  );
}
