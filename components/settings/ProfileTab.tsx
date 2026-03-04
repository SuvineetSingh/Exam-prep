'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { updateUserProfile } from '@/lib/supabase/queries/lobbyQueries';
import type { LobbyUserProfile, ProfileFormData } from '@/lib/types';
import { EXAM_TYPES } from '@/lib/utils/constants';
import { SuccessMessage } from './SuccessMessage';

interface ProfileTabProps {
  userId: string;
  userProfile: LobbyUserProfile | null;
  onUpdate: () => void;
}

export function ProfileTab({ userId, userProfile, onUpdate }: ProfileTabProps) {
  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    full_name: null,
    avatar_url: null,
    exam_type: null,
    bio: null,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        username: userProfile.username || '',
        full_name: userProfile.full_name,
        avatar_url: userProfile.avatar_url,
        exam_type: userProfile.exam_type,
        bio: userProfile.bio,
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

  const handleCancel = () => {
    if (userProfile) {
      setFormData({
        username: userProfile.username || '',
        full_name: userProfile.full_name,
        avatar_url: userProfile.avatar_url,
        exam_type: userProfile.exam_type,
        bio: userProfile.bio,
      });
    }
    setError(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h2>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
            Username *
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value)}
            className="w-full border border-gray-200 rounded-xl p-4 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="johndoe123"
            disabled={saving}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
            Full Name
          </label>
          <input
            type="text"
            value={formData.full_name || ''}
            onChange={(e) => handleChange('full_name', e.target.value || null)}
            className="w-full border border-gray-200 rounded-xl p-4 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="John Doe"
            disabled={saving}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
            Profile Picture
          </label>

          <div className="flex items-start gap-4">
            {previewUrl && (
              <div className="flex-shrink-0">
                <img
                  src={previewUrl}
                  alt="Avatar preview"
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                />
              </div>
            )}

            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={saving || uploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
              <p className="text-xs text-gray-500 mt-2">
                JPG, PNG or GIF. Max size 5MB.
              </p>
              {uploading && (
                <p className="text-xs text-blue-600 mt-2 flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                  Uploading...
                </p>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
            Exam Type
          </label>
          <select
            value={formData.exam_type || ''}
            onChange={(e) => handleChange('exam_type', e.target.value || null)}
            className="w-full border border-gray-200 rounded-xl p-4 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer"
            disabled={saving}
          >
            <option value="">Select exam type</option>
            {Object.values(EXAM_TYPES).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
            Bio
          </label>
          <textarea
            value={formData.bio || ''}
            onChange={(e) => handleChange('bio', e.target.value || null)}
            rows={4}
            maxLength={500}
            className="w-full border border-gray-200 rounded-xl p-4 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
            placeholder="Tell us about yourself..."
            disabled={saving}
          />
          <p className="text-xs text-gray-500 mt-1 ml-1">
            {formData.bio?.length || 0}/500 characters
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-bold hover:bg-gray-300 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white py-3 px-6 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2"
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

      <SuccessMessage
        message="Profile updated successfully!"
        isVisible={showSuccess}
        onClose={() => setShowSuccess(false)}
      />
    </div>
  );
}
