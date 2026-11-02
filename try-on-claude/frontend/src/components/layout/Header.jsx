import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import Button from '../ui/Button.jsx';
import Logo from '../ui/Logo.jsx';
import { useAuth } from '../../context/useAuth.js';

const NAV_LINKS = [
  { href: '/#features', label: 'Tính năng' },
  { href: '/#how-it-works', label: 'Cách hoạt động' },
];

export default function Header() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const close = () => setOpen(false);

  // Navigate first: clearing the token on a protected page would redirect to /login instead of /.
  // flushSync is required: without it the navigate promise resolves before React commits the new route.
  const handleLogout = async () => {
    close();
    await navigate('/', { replace: true, flushSync: true });
    logout();
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
        scrolled || open
          ? 'border-ink-100 bg-canvas/90 backdrop-blur'
          : 'border-transparent bg-canvas/0'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />

        <nav aria-label="Điều hướng chính" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-ink-700 transition-colors hover:text-brand-700"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <>
              <Button to="/profile" variant="ghost">
                Hồ sơ
              </Button>
              <Button variant="secondary" onClick={handleLogout}>
                Đăng xuất
              </Button>
            </>
          ) : (
            <>
              <Button to="/login" variant="ghost">
                Đăng nhập
              </Button>
              <Button to="/register">Đăng ký</Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-full text-ink-900 hover:bg-ink-100 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Đóng menu' : 'Mở menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden="true">
            <path
              d={open ? 'M6 6l12 12M18 6 6 18' : 'M4 7h16M4 12h16M4 17h16'}
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <div
        id="mobile-menu"
        hidden={!open}
        className="border-t border-ink-100 bg-canvas px-4 pb-6 pt-2 md:hidden"
      >
        <nav aria-label="Điều hướng di động" className="flex flex-col">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={close}
              className="flex min-h-12 items-center border-b border-ink-100 text-base font-medium text-ink-800"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {isAuthenticated ? (
            <>
              <Button to="/profile" variant="secondary" onClick={close}>
                Hồ sơ
              </Button>
              <Button onClick={handleLogout}>Đăng xuất</Button>
            </>
          ) : (
            <>
              <Button to="/login" variant="secondary" onClick={close}>
                Đăng nhập
              </Button>
              <Button to="/register" onClick={close}>
                Đăng ký
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
