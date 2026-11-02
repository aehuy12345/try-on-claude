import Logo from '../ui/Logo.jsx';

const COLS = [
  {
    title: 'Khám phá',
    links: [
      { href: '/#features', label: 'Tính năng' },
      { href: '/#how-it-works', label: 'Cách hoạt động' },
    ],
  },
  {
    title: 'Tài khoản',
    links: [
      { href: '/login', label: 'Đăng nhập' },
      { href: '/register', label: 'Đăng ký' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-ink-900 text-ink-200">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-300">
            Thử đồ ảo bằng AI. Nhìn thấy chính mình trong từng outfit trước khi quyết định mua.
          </p>
        </div>
        {COLS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">
              {col.title}
            </h2>
            <ul className="mt-4 space-y-1">
              {col.links.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="inline-flex min-h-9 items-center text-sm text-ink-200 transition-colors hover:text-white"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-ink-700">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-ink-300 sm:px-6">
          &copy; {new Date().getFullYear()} Try-on. Bảo lưu mọi quyền.
        </p>
      </div>
    </footer>
  );
}
