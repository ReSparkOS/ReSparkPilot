export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="64" height="64" rx="14.4" fill="var(--accent)" />
      <path
        d="M 32,45 A 13,13 0 1 1 43.3,38.5"
        fill="none"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <polygon points="40.7,37 46.8,32 45.9,40" fill="white" />
      <circle cx="32" cy="45" r="3" fill="white" />
    </svg>
  )
}

export function LogoWordmark({
  fontSize = 24,
  dark = false,
}: {
  fontSize?: number
  dark?: boolean
}) {
  return (
    <span
      className="inline-flex items-baseline leading-none"
      style={{ fontSize }}
      aria-label="ReSpark"
    >
      <span
        className="font-body"
        style={{
          fontStyle: 'italic',
          fontWeight: 300,
          color: dark ? 'rgba(255,255,255,0.6)' : 'var(--accent)',
        }}
      >
        Re
      </span>
      <span
        className="font-display"
        style={{
          fontWeight: 400,
          color: dark ? '#FFFFFF' : 'var(--text-primary)',
        }}
      >
        Spark
      </span>
    </span>
  )
}

export function LogoLockup({
  size = 40,
  dark = false,
}: {
  size?: number
  dark?: boolean
}) {
  const wordmarkSize = Math.round(size * 0.6)

  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} />
      <LogoWordmark fontSize={wordmarkSize} dark={dark} />
    </span>
  )
}
