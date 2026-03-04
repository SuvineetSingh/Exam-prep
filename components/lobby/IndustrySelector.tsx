'use client';

import { useState } from 'react';
import { INDUSTRIES } from '@/lib/utils/lobbyConstants';
import { updateUserProfile } from '@/lib/supabase/queries/lobbyQueries';

interface IndustrySelectorProps {
  userId: string;
  onSelected: (industry: string) => void;
}

export function IndustrySelector({ userId, onSelected }: IndustrySelectorProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await updateUserProfile(userId, { industry: selected });
      onSelected(selected);
    } catch (err) {
      console.error('Failed to save industry:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 animate-fade-in">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to the Lobby!</h2>
        <p className="text-sm text-gray-600 mb-6">
          Select your industry or interest area to get matched with relevant study groups.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {INDUSTRIES.map((industry) => (
            <button
              key={industry}
              onClick={() => setSelected(industry)}
              className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                selected === industry
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              {industry}
            </button>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={!selected || saving}
          className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
