function Bar({ className = '' }) {
  return <div className={`rounded-xl bg-ink-100 ${className}`} />;
}

/** Skeleton lúc tải hồ sơ: cùng bố cục với ProfileForm để không nhảy layout. */
export default function ProfileSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="grid animate-pulse gap-8 motion-reduce:animate-none lg:grid-cols-[18rem_1fr]"
    >
      <span className="sr-only">Đang tải hồ sơ...</span>
      <div>
        <Bar className="mb-3 h-4 w-28" />
        <div className="mx-auto aspect-[3/4] w-full max-w-xs rounded-card bg-ink-100 lg:max-w-none" />
        <Bar className="mt-4 h-11 w-36 !rounded-full" />
      </div>
      <div className="space-y-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <Bar className="mb-2 h-4 w-24" />
            <Bar className="h-12 w-full" />
          </div>
        ))}
        <Bar className="h-11 w-full !rounded-full sm:w-40" />
      </div>
    </div>
  );
}
