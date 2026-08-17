'use client';

import { useEffect, useState } from 'react';
import { updateUserProfile, fetchUserProfile } from '@/lib/supabase/queries/lobbyQueries';
import { EXAM_TYPES } from '@/lib/utils/constants';
import { INDUSTRIES, STUDY_TIMES } from '@/lib/utils/lobbyConstants';
import { COUNTRY_OPTIONS, countryFlag } from '@/lib/utils/countries';
import type { LobbyUserProfile } from '@/lib/types/lobby';

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

interface ProfileFormState {
  full_name: string;
  exam_type: string;
  industry: string;
  country_code: string;
  study_time: string;
}

const EMPTY_FORM: ProfileFormState = {
  full_name: '',
  exam_type: '',
  industry: '',
  country_code: '',
  study_time: '',
};

export function OnboardingTour({ userId, onComplete }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProfileFormState>(EMPTY_FORM);
  const isLastInfoStep = step === STEPS.length - 1;
  const current = STEPS[step]!;
  const totalDots = STEPS.length + 1;
  const activeDot = showForm ? STEPS.length : step;

  // Pre-fill from the existing profile so replaying the tour (or resuming
  // partway through onboarding) edits current values instead of blanking them.
  useEffect(() => {
    fetchUserProfile(userId).then((profile) => {
      if (!profile) return;
      setForm({
        full_name: profile.full_name || '',
        exam_type: profile.exam_type || '',
        industry: profile.industry || '',
        country_code: profile.country_code || '',
        study_time: profile.study_time || '',
      });
    });
  }, [userId]);

  const persistCompletion = async (fields?: ProfileFormState) => {
    setSaving(true);
    try {
      const updates: Partial<LobbyUserProfile> = { onboarding_completed: true };
      if (fields) {
        if (fields.full_name) updates.full_name = fields.full_name;
        if (fields.exam_type) updates.exam_type = fields.exam_type;
        if (fields.industry) updates.industry = fields.industry;
        if (fields.country_code) updates.country_code = fields.country_code;
        if (fields.study_time) updates.study_time = fields.study_time;
      }
      await updateUserProfile(userId, updates);
    } catch (err) {
      console.error('Failed to save onboarding completion:', err);
    } finally {
      setSaving(false);
      onComplete();
    }
  };

  const handleSkip = () => persistCompletion();

  const handleNext = () => {
    if (showForm) {
      persistCompletion(form);
    } else if (isLastInfoStep) {
      setShowForm(true);
    } else {
      setStep((s) => s + 1);
    }
  };

  const updateField = (field: keyof ProfileFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 animate-fade-in relative">
        <button
          onClick={handleSkip}
          disabled={saving}
          title="Skip"
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {showForm ? (
          <>
            <div className="text-5xl mb-4">👋</div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">Tell us about yourself</h2>
            <p className="text-sm text-neutral-600 mb-5">
              This helps us match you with the right people and rooms. You can always update it later in Settings.
            </p>

            <div className="space-y-3 mb-6 text-left">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1">Full name</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => updateField('full_name', e.target.value)}
                  placeholder="Jane Doe"
                  className="input"
                  disabled={saving}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1">Exam type</label>
                  <select
                    value={form.exam_type}
                    onChange={(e) => updateField('exam_type', e.target.value)}
                    className="input cursor-pointer"
                    disabled={saving}
                  >
                    <option value="">Select</option>
                    {Object.values(EXAM_TYPES).map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1">Industry</label>
                  <select
                    value={form.industry}
                    onChange={(e) => updateField('industry', e.target.value)}
                    className="input cursor-pointer"
                    disabled={saving}
                  >
                    <option value="">Select</option>
                    {INDUSTRIES.map((industry) => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1">Country</label>
                <select
                  value={form.country_code}
                  onChange={(e) => updateField('country_code', e.target.value)}
                  className="input cursor-pointer"
                  disabled={saving}
                >
                  <option value="">Select</option>
                  {COUNTRY_OPTIONS.map(({ code, name }) => (
                    <option key={code} value={code}>{countryFlag(code)} {name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1">When do you usually study?</label>
                <div className="grid grid-cols-3 gap-2">
                  {STUDY_TIMES.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => updateField('study_time', form.study_time === value ? '' : value)}
                      disabled={saving}
                      className={`py-2 rounded-lg border-2 text-xs font-semibold transition-colors disabled:opacity-50 ${
                        form.study_time === value
                          ? 'border-brand-green bg-green-50 text-brand-green-dark'
                          : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">{current.emoji}</div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">{current.title}</h2>
            <p className="text-sm text-neutral-600 mb-6">{current.body}</p>
          </>
        )}

        <div className="flex items-center justify-center gap-1.5 mb-6">
          {Array.from({ length: totalDots }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === activeDot ? 'w-6 bg-brand-green' : 'w-1.5 bg-neutral-200'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={saving}
          className="w-full py-3 bg-brand-green text-white font-semibold rounded-lg hover:bg-brand-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : showForm ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
}
