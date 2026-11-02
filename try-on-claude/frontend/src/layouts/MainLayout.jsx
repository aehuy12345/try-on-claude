import { Outlet } from 'react-router';
import Footer from '../components/layout/Footer.jsx';
import Header from '../components/layout/Header.jsx';

// <main> full-width: mỗi trang tự quyết định container (landing cần section full-bleed).
export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink-900 focus:px-4 focus:py-2 focus:text-canvas"
      >
        Bỏ qua tới nội dung chính
      </a>
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
