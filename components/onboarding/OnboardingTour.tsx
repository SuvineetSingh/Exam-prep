'use client';

import { useState } from 'react';
import { updateUserProfile } from '@/lib/supabase/queries/lobbyQueries';

interface OnboardingTourProps {
  userId: string;
  onComplete: () => void;
}

const STEPS = [
  {
    emoji: '📝',
    title: 'Practice Questions',
    body: 'Work through topic-by-topic questions at your own pace. Answers are explained so you learn from every attempt.',
  },
  {
    emoji: '⏱️',
    title: 'Timed Exams',
    body: 'Simulate real exam conditions with a full timed session, then review your score and breakdown afterward.',
  },
  {
    emoji: '💬',
    title: 'Lobby Chat',
    body: 'Join rooms to chat with other students, or find people by username to message them directly.',
  },
  {
    emoji: '🏆',
    title: 'Gamification',
    body: 'Earn XP for every question you answer, level up, and unlock badges as you build a study streak.',
  },
  {
    emoji: '⚙️',
    title: 'Settings',
    body: 'Set your exam type, country, and lobby preferences anytime from Settings to get better matches.',
  },
];

export function OnboardingTour({ userId, onComplete }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const isLastStep = step === STEPS.length - 1;
  const current = STEPS[step]!;

  const handleFinish = async () => {
    setSaving(true);
    try {
      await updateUserProfile(userId, { onboarding_completed: true });
    } catch (err) {
      console.error('Failed to save onboarding completion:', err);
    } finally {
      setSaving(false);
      onComplete();
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      handleFinish();
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 animate-fade-in relative">
        <button
          onClick={handleFinish}
          disabled={saving}
          title="Skip"
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-5xl mb-4">{current.emoji}</div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">{current.title}</h2>
        <p className="text-sm text-neutral-600 mb-6">{current.body}</p>

        <div className="flex items-center justify-center gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-brand-green' : 'w-1.5 bg-neutral-200'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={saving}
          className="w-full py-3 bg-brand-green text-white font-semibold rounded-lg hover:bg-brand-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : isLastStep ? 'Get Started' : 'Next'}
        </button>
      </div>
    </div>
  );
}
