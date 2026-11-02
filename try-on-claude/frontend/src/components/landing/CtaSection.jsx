import Button from '../ui/Button.jsx';

export default function CtaSection() {
  return (
    <section aria-labelledby="cta-title" className="px-4 pb-20 sm:px-6 lg:pb-28">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-brand-800 px-6 py-16 text-center sm:px-12 lg:py-20">
        <div
          className="pointer-events-none absolute -left-16 -top-16 size-64 rounded-full bg-brand-600 opacity-50 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative">
          <h2
            id="cta-title"
            className="mx-auto max-w-2xl text-balance font-display text-3xl font-medium tracking-tight text-canvas sm:text-4xl"
          >
            Sẵn sàng thấy mình trong outfit tiếp theo?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-brand-100">
            Tạo hồ sơ trong vài phút và bắt đầu thử đồ ngay hôm nay.
          </p>
          <Button to="/register" variant="light" className="mt-8 h-12 px-8 text-base">
            Thử đồ ngay
          </Button>
        </div>
      </div>
    </section>
  );
}
