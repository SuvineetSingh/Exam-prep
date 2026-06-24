'use client';

import { useState, useEffect } from 'react';
import { updateUserProfile } from '@/lib/supabase/queries/lobbyQueries';
import type { LobbyUserProfile } from '@/lib/types';
import { INDUSTRIES } from '@/lib/utils/lobbyConstants';
import { SuccessMessage } from './SuccessMessage';

interface LobbyPreferencesTabProps {
  userId: string;
  userProfile: LobbyUserProfile | null;
  onUpdate: () => void;
}

export function LobbyPreferencesTab({ userId, userProfile, onUpdate }: LobbyPreferencesTabProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (userProfile?.industry) {
      setSelected(userProfile.industry);
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!selected) {
      setError('Please select an industry preference');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await updateUserProfile(userId, { industry: selected });
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
