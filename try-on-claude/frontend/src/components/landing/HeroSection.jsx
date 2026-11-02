import Button from '../ui/Button.jsx';
import HeroVisual from './HeroVisual.jsx';

export default function HeroSection() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -right-24 -top-24 size-120 rounded-full bg-blush opacity-60 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-10 sm:px-6 md:pt-16 lg:grid-cols-2 lg:gap-16 lg:pb-28">
        <div className="animate-fade-up text-center lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
            Phòng thử đồ ảo bằng AI
          </p>
          <h1
            id="hero-title"
            className="mt-5 text-balance font-display text-4xl font-medium leading-[1.1] tracking-tight text-ink-900 sm:text-5xl lg:text-6xl"
          >
            Thử đồ trên <em className="font-medium text-brand-700">chính bạn</em>, trước khi mua
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink-600 sm:text-lg lg:mx-0">
            Tải một bức ảnh toàn thân, chọn danh mục và vuốt qua từng sản phẩm để xem mình mặc chúng
            ra sao. Ưng món nào, thêm vào giỏ món đó.
          </p>
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Button to="/register" className="h-12 px-8 text-base">
              Thử đồ ngay
            </Button>
            <Button href="#how-it-works" variant="secondary" className="h-12 px-8 text-base">
              Xem cách hoạt động
            </Button>
          </div>
          <p className="mt-5 text-sm text-ink-500">
            Miễn phí đăng ký. Chỉ mất vài phút để bắt đầu.
          </p>
        </div>

        <div className="animate-fade-up [animation-delay:150ms]">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}
