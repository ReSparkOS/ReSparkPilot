'use client'

type SparkBuddyProps = {
  message: string
  onResponse: (response: string) => void
  responses: string[]
}

export function SparkBuddy({ message, onResponse, responses }: SparkBuddyProps) {
  return (
    <div className="rounded-card border border-spark/20 bg-[#F0EEF8]/90 p-4">
      <div className="flex items-center gap-1.5">
        <span className="text-spark" aria-hidden>
          ✦
        </span>
        <span className="text-xs font-medium text-spark">Spark Buddy</span>
      </div>
      <p className="mt-2 text-sm text-text-primary">{message}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {responses.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => onResponse(label)}
            className="rounded-pill border border-border bg-surface px-3 py-1.5 text-xs font-medium transition-colors hover:border-spark/30"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
