const dots = [
  [50, 8, 7, 1], [71, 14, 7, .92], [86, 30, 7, .84], [92, 50, 7, .76],
  [86, 70, 7, .68], [71, 86, 7, .6], [50, 92, 7, .52], [29, 86, 7, .44],
  [14, 70, 7, .36], [8, 50, 7, .28], [14, 30, 7, .2], [29, 14, 7, .12],
] as const;

export default function BlueDotLoader({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={`animate-spin ${className}`} aria-hidden="true">
      {dots.map(([cx, cy, r, opacity], index) => (
        <circle key={index} cx={cx} cy={cy} r={r} fill="#2563EB" fillOpacity={opacity} />
      ))}
    </svg>
  );
}
