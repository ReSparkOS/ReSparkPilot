'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import PhoneShell from '@/components/PhoneShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LogoMark } from '@/components/Logo'
import { getUser, saveUser } from '@/lib/storage'

const CONTENT_STEPS = 3
const TOTAL_STEPS = 4

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const user = getUser()
    if (user?.onboardingComplete === true) {
      router.replace('/home')
      return
    }
    setHydrated(true)
  }, [router])

  const goNext = () => {
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1)
  }

  const finish = () => {
    const prev = getUser()
    saveUser({
      name: name.trim(),
      onboardingComplete: true,
      joinedAt: prev?.joinedAt ?? new Date().toISOString(),
    })
    router.push('/home')
  }

  if (!hydrated) {
    return (
      <PhoneShell>
        <div className="min-h-[calc(100dvh-2.75rem)] px-8" aria-hidden />
      </PhoneShell>
    )
  }

  return (
    <PhoneShell>
      <div className="flex min-h-[calc(100dvh-2.75rem)] flex-col px-8 pb-10 pt-6">
        {step < CONTENT_STEPS && (
          <nav className="flex shrink-0 justify-center gap-2 pb-8" aria-label={`Onboarding step ${step + 1} of ${CONTENT_STEPS}`}>
            {Array.from({ length: CONTENT_STEPS }, (_, i) => (
              <span
                key={i}
                className={`h-3 w-3 rounded-full transition-colors duration-200 ${i === step ? 'bg-accent' : 'bg-border'}`}
                aria-hidden
              />
            ))}
          </nav>
        )}

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          {step === 0 && (
            <div key={0} className="animate-fade-in flex w-full max-w-[320px] flex-col items-center">
              <LogoMark size={64} />
              <div className="mt-4 text-5xl" aria-hidden>🧠</div>
              <h1 className="font-display mt-6 text-[28px] leading-tight text-text-primary">Your brain isn&apos;t broken.</h1>
              <p className="text-text-secondary mx-auto mt-4 max-w-[280px] text-base leading-relaxed">
                It just has a lot of sparks flying at once. ReSpark helps you catch the right one.
              </p>
              <Button type="button" variant="primary" size="full" className="mt-10" onClick={goNext}>
                Let&apos;s go →
              </Button>
            </div>
          )}

          {step === 1 && (
            <div key={1} className="animate-fade-in flex w-full max-w-[320px] flex-col items-center">
              <span className="text-6xl" aria-hidden>
                ⚡
              </span>
              <h1 className="font-display mt-6 text-[28px] leading-tight text-text-primary">No streaks. No shame.</h1>
              <p className="text-text-secondary mx-auto mt-4 max-w-[280px] text-base leading-relaxed">
                Come back whenever. We&apos;ll pick up exactly where you need us. Zero judgment, zero guilt pile.
              </p>
              <Button type="button" variant="primary" size="full" className="mt-10" onClick={goNext}>
                Sounds good →
              </Button>
            </div>
          )}

          {step === 2 && (
            <div key={2} className="animate-fade-in flex w-full max-w-[320px] flex-col items-center">
              <span className="text-6xl" aria-hidden>
                🤝
              </span>
              <h1 className="font-display mt-6 text-[28px] leading-tight text-text-primary">You do one thing.</h1>
              <p className="text-text-secondary mx-auto mt-4 max-w-[280px] text-base leading-relaxed">
                Tell us what&apos;s on your mind. We handle the sorting, the prioritizing, the &apos;where do I even start.&apos; You
                just show up.
              </p>
              <Button type="button" variant="primary" size="full" className="mt-10" onClick={goNext}>
                Start ReSparking
              </Button>
              <Button type="button" variant="ghost" size="sm" className="mt-4" onClick={() => setStep(3)}>
                Skip for now
              </Button>
            </div>
          )}

          {step === 3 && (
            <form
              key={3}
              className="animate-fade-in flex w-full max-w-[320px] flex-col items-center"
              onSubmit={(e) => {
                e.preventDefault()
                finish()
              }}
            >
              <h1 className="font-display text-[28px] leading-tight text-text-primary">One more thing.</h1>
              <div className="mt-8 w-full">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What should we call you?"
                  autoComplete="nickname"
                  className="py-4 text-center text-base"
                  aria-label="What should we call you?"
                />
              </div>
              <Button type="submit" variant="primary" size="full" className="mt-10">
                That&apos;s me →
              </Button>
            </form>
          )}
        </div>
      </div>
    </PhoneShell>
  )
}
