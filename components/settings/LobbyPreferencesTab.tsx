'use client';

import { useState, useEffect } from 'react';
import { updateUserProfile } from '@/lib/supabase/queries/lobbyQueries';
import type { LobbyUserProfile } from '@/lib/types';
import { INDUSTRIES } from '@/lib/utils/lobbyConstants';
import { COUNTRY_OPTIONS, countryFlag } from '@/lib/utils/countries';
import { SuccessMessage } from './SuccessMessage';

interface LobbyPreferencesTabProps {
  userId: string;
  userProfile: LobbyUserProfile | null;
  onUpdate: () => void;
}

export function LobbyPreferencesTab({ userId, userProfile, onUpdate }: LobbyPreferencesTabProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [country, setCountry] = useState<string>('');
  const [showInFeed, setShowInFeed] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (userProfile?.industry) {
      setSelected(userProfile.industry);
    }
    setCountry(userProfile?.country_code ?? '');
    setShowInFeed(userProfile?.show_in_activity_feed ?? true);
  }, [userProfile]);

  const handleSave = async () => {
    if (!selected) {
      setError('Please select an industry preference');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await updateUserProfile(userId, {
        industry: selected,
        country_code: country || null,
        show_in_activity_feed: showInFeed,
      });
      setShowSuccess(true);
      onUpdate();
    } catch (err) {
      setError('Failed to save preference. Please try again.');
      console.error('Industry preference update error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-5 sm:p-8">
      <h2 className="text-2xl font-bold text-neutral-900 mb-2">Lobby Preferences</h2>
      <p className="text-neutral-600 mb-6">
        Your industry preference helps match you with relevant study groups in the Lobby.
      </p>

      {selected && (
        <div className="mb-4">
          <span className="text-sm font-semibold text-neutral-700">Current Selection: </span>
          <span className="text-sm text-brand-green font-medium">{selected}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-6">
        {INDUSTRIES.map((industry) => (
          <button
            key={industry}
            type="button"
            onClick={() => setSelected(industry)}
            disabled={saving}
            className={`p-4 rounded-xl border-2 transition-all font-medium disabled:opacity-50 ${
              selected === industry
                ? 'border-brand-green bg-green-50 text-green-700'
                : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
            }`}
          >
            {industry}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <label htmlFor="country" className="block text-sm font-semibold text-neutral-700 mb-2">
          Country {country && <span className="ml-1">{countryFlag(country)}</span>}
        </label>
        <p className="text-sm text-neutral-600 mb-3">
          Shown as a flag next to your name in the lobby activity feed.
        </p>
        <select
          id="country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          disabled={saving}
          className="input disabled:opacity-50"
        >
          <option value="">Prefer not to say</option>
          {COUNTRY_OPTIONS.map(({ code, name }) => (
            <option key={code} value={code}>
              {countryFlag(code)} {name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6 flex items-start justify-between gap-4 p-4 rounded-xl border-2 border-neutral-200">
        <div>
          <p className="font-semibold text-neutral-700">Show my activity in the feed</p>
          <p className="text-sm text-neutral-600">
            Let other members see when you complete quizzes or join rooms. Turning this off hides
            you from the lobby activity feed.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={showInFeed}
          aria-label="Show my activity in the feed"
          onClick={() => setShowInFeed((v) => !v)}
          disabled={saving}
          className={`relative shrink-0 w-12 h-7 rounded-full transition-colors disabled:opacity-50 ${
            showInFeed ? 'bg-brand-green' : 'bg-neutral-300'
          }`}
        >
          <span
            className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${
              showInFeed ? 'left-6' : 'left-1'
            }`}
          />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !selected}
          className="btn-primary py-3 px-6 disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            'Save Preference'
          )}
        </button>
      </div>

      <SuccessMessage
        message="Lobby preference saved successfully!"
        isVisible={showSuccess}
        onClose={() => setShowSuccess(false)}
      />
    </div>
  );
}
