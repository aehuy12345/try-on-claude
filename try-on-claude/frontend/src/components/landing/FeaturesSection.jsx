import { FEATURES } from './landingContent.js';

const ICON_PATHS = {
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8c0-3.9 3.1-7 7-7s7 3.1 7 7',
  swipe: 'M4 12h16m0 0-5-5m5 5-5 5M4 6v12',
  bag: 'M6 8h12l1 12H5L6 8Zm3 0V7a3 3 0 0 1 6 0v1',
  ruler: 'm4 16 12-12 4 4L8 20l-4-4Zm4-4 2 2m1-5 2 2m-7 1 1 1',
};

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden="true">
      <path
        d={ICON_PATHS[name]}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function FeaturesSection() {
  return (
    <section id="features" aria-labelledby="features-title" className="bg-sand/60 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
            Tính năng
          </p>
          <h2
            id="features-title"
            className="mt-4 text-balance font-display text-3xl font-medium tracking-tight sm:text-4xl"
          >
            Mua sắm tự tin hơn, từng outfit một
          </h2>
        </div>

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <li
              key={f.id}
              className="group rounded-card bg-white p-6 shadow-soft ring-1 ring-ink-900/5 transition duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <span className="grid size-12 place-items-center rounded-full bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-700 group-hover:text-canvas">
                <Icon name={f.icon} />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-ink-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{f.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
