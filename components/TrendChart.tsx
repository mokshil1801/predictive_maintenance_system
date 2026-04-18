export function TrendChart({
  points,
  scoreLabel,
}: {
  points: number[];
  scoreLabel: string;
}) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const width = 460;
  const height = 220;
  const normalized = points.map((point, index) => {
    const x = (index / (points.length - 1)) * width;
    const y = height - ((point - min) / Math.max(max - min, 1)) * (height - 36) - 18;
    return `${x},${y}`;
  });

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-border bg-white">
      <div className="grid-pattern absolute inset-0 opacity-60" />
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="relative h-[240px] w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(11,110,79,0.24)" />
            <stop offset="100%" stopColor="rgba(11,110,79,0.02)" />
          </linearGradient>
        </defs>
        <polyline
          fill="url(#trend-fill)"
          stroke="none"
          points={`0,${height} ${normalized.join(" ")} ${width},${height}`}
        />
        <polyline
          fill="none"
          stroke="#0B6E4F"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="5"
          points={normalized.join(" ")}
        />
      </svg>
      <div className="absolute inset-x-0 top-6 flex justify-center">
        <div className="rounded-3xl bg-white/95 px-6 py-4 text-center shadow-[0_16px_36px_rgba(17,24,39,0.08)]">
          <p className="text-xs uppercase tracking-[0.18em] text-text-soft">
            Overall condition trend
          </p>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-primary">
            {scoreLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
