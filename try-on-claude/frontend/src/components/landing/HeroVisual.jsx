import { HERO_CATEGORIES } from './landingContent.js';

/**
 * Minh hoạ phòng thử đồ bằng SVG/CSS thuần (không dùng ảnh ngoài).
 * Trang trí thuần tuý nên ẩn khỏi trình đọc màn hình.
 */
export default function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-sm" aria-hidden="true">
      <div className="absolute -inset-6 rounded-[2.5rem] bg-blush opacity-70 blur-2xl" />

      <div className="relative aspect-3/4 overflow-hidden rounded-[2rem] bg-linear-to-b from-sand via-blush to-brand-100 shadow-lift ring-1 ring-ink-900/5">
        <svg viewBox="0 0 300 400" className="absolute inset-0 size-full" fill="none">
          {/* nền: vòng tròn mờ */}
          <circle cx="150" cy="190" r="125" className="fill-white/40" />
          {/* dáng người */}
          <g className="fill-ink-800">
            <circle cx="150" cy="72" r="20" />
            <path d="M141 90h18v14h-18z" />
            <path d="M104 118c0-9 9-14 22-14h48c13 0 22 5 22 14l8 70h-18l-5-42-5 45h-76l-5-45-5 42H96l8-70Z" />
            <path d="M122 232h56l-4 134h-20l-4-92-4 92h-20l-4-134Z" />
          </g>
          {/* váy */}
          <path
            d="M120 118h60l6 52 30 128c-22 12-44 18-66 18s-44-6-66-18l30-128 6-52Z"
            className="fill-brand-600"
          />
          <path d="M126 118c6 14 42 14 48 0" className="stroke-brand-300" strokeWidth="2" />
          <path
            d="M138 176c4 40-6 90-24 126M162 176c-4 40 6 90 24 126"
            className="stroke-brand-400"
            strokeWidth="1.5"
          />
          <rect x="128" y="168" width="44" height="6" rx="3" className="fill-gold-500" />
        </svg>

        <ul className="absolute inset-x-4 top-4 flex gap-2 overflow-hidden">
          {HERO_CATEGORIES.map((c, i) => (
            <li
              key={c}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                i === 1 ? 'bg-ink-900 text-canvas' : 'bg-white/80 text-ink-700'
              }`}
            >
              {c}
            </li>
          ))}
        </ul>

        {['left-3', 'right-3'].map((pos, i) => (
          <span
            key={pos}
            className={`absolute ${pos} top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink-900 shadow-soft`}
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none">
              <path
                d={i === 0 ? 'm14 6-6 6 6 6' : 'm10 6 6 6-6 6'}
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        ))}

        <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-full bg-white/90 py-2 pl-4 pr-2 shadow-soft backdrop-blur">
          <span className="text-xs font-medium text-ink-700">Váy lụa midi</span>
          <span className="rounded-full bg-brand-700 px-3 py-1.5 text-xs font-medium text-canvas">
            Thêm vào giỏ
          </span>
        </div>
      </div>

      <div className="absolute -left-3 top-16 animate-float rounded-2xl bg-white px-3 py-2 text-xs font-medium text-ink-800 shadow-soft sm:-left-8">
        <span className="mr-1.5 inline-block size-2 rounded-full bg-gold-500" />
        AI đang ghép đồ...
      </div>
      <div className="absolute -right-2 bottom-24 hidden rounded-2xl bg-ink-900 px-3 py-2 text-xs font-medium text-canvas shadow-soft sm:block">
        Vừa vặn với bạn
      </div>
    </div>
  );
}
