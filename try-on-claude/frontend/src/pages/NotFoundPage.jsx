import Button from '../components/ui/Button.jsx';

export default function NotFoundPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
      <p className="font-display text-7xl font-medium text-gold-500">404</p>
      <h1 className="mt-4 font-display text-3xl font-medium">Không tìm thấy trang</h1>
      <p className="mt-2 text-ink-600">Trang bạn truy cập không tồn tại.</p>
      <Button to="/" className="mt-8">
        Về trang chủ
      </Button>
    </section>
  );
}
