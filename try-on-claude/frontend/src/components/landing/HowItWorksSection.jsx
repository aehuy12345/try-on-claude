import { STEPS } from './landingContent.js';

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
            Cách hoạt động
          </p>
          <h2
            id="how-title"
            className="mt-4 text-balance font-display text-3xl font-medium tracking-tight sm:text-4xl"
          >
            Ba bước để có phòng thử đồ của riêng bạn
          </h2>
        </div>

        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative text-center md:text-left">
              <span className="font-display text-6xl font-medium leading-none text-gold-500">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-4 text-xl font-semibold text-ink-900">{s.title}</h3>
              <p className="mt-2 text-base leading-relaxed text-ink-600">{s.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
