export function Skeleton({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-black/5 motion-reduce:animate-none ${className}`}
    />
  )
}
