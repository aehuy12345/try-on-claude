import { Link } from 'react-router';

const BASE =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium tracking-wide transition duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:pointer-events-none disabled:opacity-50';

const VARIANTS = {
  primary:
    'bg-brand-700 text-canvas shadow-soft hover:-translate-y-0.5 hover:bg-brand-800 active:translate-y-0',
  secondary:
    'border border-ink-300 bg-transparent text-ink-900 hover:border-ink-900 hover:bg-ink-900 hover:text-canvas',
  ghost: 'text-ink-800 hover:bg-ink-100',
  light: 'bg-canvas text-brand-800 hover:-translate-y-0.5 hover:bg-white',
};

/**
 * Nút dùng chung. Truyền `to` để render <Link>, `href` để render <a>, ngược lại render <button>.
 */
export default function Button({
  to,
  href,
  variant = 'primary',
  className = '',
  children,
  ...props
}) {
  const classes = `${BASE} ${VARIANTS[variant]} ${className}`;
  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}
