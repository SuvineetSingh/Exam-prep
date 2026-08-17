'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { updateUserProfile } from '@/lib/supabase/queries/lobbyQueries';
import type { LobbyUserProfile, ProfileFormData } from '@/lib/types';
import { EXAM_TYPES } from '@/lib/utils/constants';
import { COUNTRY_OPTIONS, countryFlag } from '@/lib/utils/countries';
import { INDUSTRIES, STUDY_TIMES } from '@/lib/utils/lobbyConstants';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { SuccessMessage } from './SuccessMessage';

interface ProfileTabProps {
  userId: string;
  userProfile: LobbyUserProfile | null;
  onUpdate: () => void;
  authProvider?: string;
}

export function ProfileTab({ userId, userProfile, onUpdate, authProvider }: ProfileTabProps) {
  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    full_name: null,
    avatar_url: null,
    exam_type: null,
    bio: null,
    country_code: null,
    industry: null,
    study_time: null,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showTour, setShowTour] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password change state
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [showPwSuccess, setShowPwSuccess] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        username: userProfile.username || '',
        full_name: userProfile.full_name,
        avatar_url: userProfile.avatar_url,
        exam_type: userProfile.exam_type,
        bio: userProfile.bio,
        country_code: userProfile.country_code,
        industry: userProfile.industry,
        study_time: userProfile.study_time,
      });
      if (userProfile.avatar_url) {
        setPreviewUrl(userProfile.avatar_url);
      }
    }
  }, [userProfile]);

  const handleChange = (field: keyof ProfileFormData, value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      setPreviewUrl(publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const validate = () => {
    if (!formData.username || formData.username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }
    if (!formData.country_code) {
      setError('Country is required');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    setError(null);

    try {
      await updateUserProfile(userId, formData);
      setShowSuccess(true);
      onUpdate();
    } catch (err) {
      setError('Failed to save changes. Please try again.');
      console.error('Profile update error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPwError(null);
    if (pwNew.length < 8) {
      setPwError('Password must be at least 8 characters.');
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwError('Passwords do not match.');
      return;
    }
    setPwSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pwNew });
    if (error) {
      setPwError(error.message);
    } else {
      setPwNew('');
      setPwConfirm('');
      setShowPwSuccess(true);
    }
    setPwSaving(false);
  };

  const handleCancel = () => {
    if (userProfile) {
      setFormData({
        username: userProfile.username || '',
        full_name: userProfile.full_name,
        avatar_url: userProfile.avatar_url,
        exam_type: userProfile.exam_type,
        bio: userProfile.bio,
        country_code: userProfile.country_code,
        industry: userProfile.industry,
        study_time: userProfile.study_time,
      });
    }
    setError(null);
  };

  return (
    <div className="card p-5 sm:p-8">
      <h2 className="text-2xl font-bold text-neutral-900 mb-6">Profile Settings</h2>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1 ml-1">
            Username *
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value)}
            className="input py-4"
            placeholder="johndoe123"
            disabled={saving}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1 ml-1">
            Full Name
          </label>
          <input
            type="text"
            value={formData.full_name || ''}
            onChange={(e) => handleChange('full_name', e.target.value || null)}
            className="input py-4"
            placeholder="John Doe"
            disabled={saving}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1 ml-1">
            Profile Picture
          </label>

          <div className="flex items-start gap-4">
            {previewUrl && (
              <div className="flex-shrink-0">
                <img
                  src={previewUrl}
                  alt="Avatar preview"
                  className="w-24 h-24 rounded-full object-cover border-2 border-neutral-200"
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={saving || uploading}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving || uploading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-white border border-neutral-200 shadow-sm text-sm font-semibold text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Choose Photo
              </button>
              <p className="text-xs text-neutral-500 mt-2">
                JPG, PNG or GIF. Max size 5MB.
              </p>
              {uploading && (
                <div className="text-xs text-brand-green mt-2 flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-brand-green/30 border-t-brand-green rounded-full animate-spin" />
                  Uploading...
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1 ml-1">
              Exam Type
            </label>
            <select
              value={formData.exam_type || ''}
              onChange={(e) => handleChange('exam_type', e.target.value || null)}
              className="input py-4 cursor-pointer"
              disabled={saving}
            >
              <option value="">Select exam type</option>
              {Object.values(EXAM_TYPES).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1 ml-1">
              Industry
            </label>
            <select
              value={formData.industry || ''}
              onChange={(e) => handleChange('industry', e.target.value || null)}
              className="input py-4 cursor-pointer"
              disabled={saving}
            >
              <option value="">Select industry</option>
              {INDUSTRIES.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1 ml-1">
            Country *
          </label>
          <select
            value={formData.country_code || ''}
            onChange={(e) => handleChange('country_code', e.target.value || null)}
            className="input py-4 cursor-pointer"
            disabled={saving}
          >
            <option value="">Select your country</option>
            {COUNTRY_OPTIONS.map(({ code, name }) => (
              <option key={code} value={code}>{countryFlag(code)} {name}</option>
            ))}
          </select>
          <p className="text-xs text-neutral-500 mt-1 ml-1">
            Used to match you with people and rooms from your country.
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1 ml-1">
            When do you usually study?
          </label>
          <div className="grid grid-cols-3 gap-2">
            {STUDY_TIMES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleChange('study_time', formData.study_time === value ? null : value)}
                disabled={saving}
                className={`py-3 rounded-[10px] border-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
                  formData.study_time === value
                    ? 'border-brand-green bg-green-50 text-brand-green-dark'
                    : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1 ml-1">
            Bio
          </label>
          <textarea
            value={formData.bio || ''}
            onChange={(e) => handleChange('bio', e.target.value || null)}
            rows={4}
            maxLength={500}
            className="input py-4 resize-none"
            placeholder="Tell us about yourself..."
            disabled={saving}
          />
          <p className="text-xs text-neutral-500 mt-1 ml-1">
            {formData.bio?.length || 0}/500 characters
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-4 flex-wrap">
          <button
            type="button"
            onClick={() => setShowTour(true)}
            className="text-sm font-bold text-brand-green hover:underline"
          >
            Replay the app tour
          </button>
          <div className="flex gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="btn-secondary py-3 px-6"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary py-3 px-6 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
          </div>
        </div>
      </div>

      <SuccessMessage
        message="Profile updated successfully!"
        isVisible={showSuccess}
        onClose={() => setShowSuccess(false)}
      />

      {showTour && <OnboardingTour userId={userId} onComplete={() => setShowTour(false)} />}

      {authProvider !== 'google' && (
        <div className="mt-8 pt-8 border-t border-neutral-100">
          <h3 className="text-lg font-bold text-neutral-900 mb-4">Change Password</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1 ml-1">
                New password
              </label>
              <input
                type="password"
                value={pwNew}
                onChange={(e) => setPwNew(e.target.value)}
                placeholder="At least 8 characters"
                disabled={pwSaving}
                className="input py-4"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1 ml-1">
                Confirm new password
              </label>
              <input
                type="password"
                value={pwConfirm}
                onChange={(e) => setPwConfirm(e.target.value)}
                placeholder="••••••••"
                disabled={pwSaving}
                className="input py-4"
              />
            </div>

            {pwError && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
                {pwError}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handlePasswordChange}
                disabled={pwSaving || !pwNew}
                className="btn-primary py-3 px-6 disabled:opacity-50"
              >
                {pwSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </div>
          </div>

          <SuccessMessage
            message="Password updated successfully!"
            isVisible={showPwSuccess}
            onClose={() => setShowPwSuccess(false)}
          />
        </div>
      )}
    </div>
  );
}
