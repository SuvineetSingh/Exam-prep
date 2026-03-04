# Supabase Storage Setup for Avatar Uploads

This guide explains how to set up Supabase Storage for user avatar uploads.

## Why Supabase Storage?

Instead of storing images as binary data in the database (which causes performance issues), we use Supabase Storage:

- ✅ Fast CDN delivery of images
- ✅ Automatic optimization
- ✅ Built-in security with RLS policies
- ✅ Keeps database lean and performant
- ✅ Industry best practice (same as Twitter, Facebook, etc.)

## Setup Steps

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to your project at https://supabase.com/dashboard
   - Click on "Storage" in the left sidebar

2. **Create Bucket**
   - Click "Create a new bucket"
   - Name: `user-avatars`
   - Public bucket: ✅ Enable (so avatars are publicly accessible)
   - Click "Create bucket"

3. **Set Up Policies**
   - Click on the `user-avatars` bucket
   - Go to "Policies" tab
   - Click "New Policy"
   - Add the following policies:

   **Policy 1: Upload Own Avatar**
   - Name: "Users can upload their own avatar"
   - Policy definition: Custom
   - Target roles: authenticated
   - Operation: INSERT
   - WITH CHECK expression:
   ```sql
   (bucket_id = 'user-avatars') AND
   ((storage.foldername(name))[1] = 'avatars') AND
   (auth.uid()::text = (regexp_match(name, '^avatars/([^-]+)-'))[1])
   ```

   **Policy 2: Public Read**
   - Name: "Public can view avatars"
   - Policy definition: Allow public access
   - Operation: SELECT

   **Policy 3: Update Own Avatar**
   - Name: "Users can update their own avatar"
   - Target roles: authenticated
   - Operation: UPDATE
   - USING expression:
   ```sql
   (bucket_id = 'user-avatars') AND
   (auth.uid()::text = (regexp_match(name, '^avatars/([^-]+)-'))[1])
   ```

   **Policy 4: Delete Own Avatar**
   - Name: "Users can delete their own avatar"
   - Target roles: authenticated
   - Operation: DELETE
   - USING expression:
   ```sql
   (bucket_id = 'user-avatars') AND
   (auth.uid()::text = (regexp_match(name, '^avatars/([^-]+)-'))[1])
   ```

### Option 2: Using SQL (Alternative)

If you prefer SQL, run the provided `storage_setup.sql` file:

1. Open Supabase SQL Editor
2. Copy contents from `supabase/storage_setup.sql`
3. Execute the SQL

## How It Works

### File Upload Flow

1. User selects an image in Profile Settings
2. Image is validated (type, size < 5MB)
3. File is uploaded to `user-avatars/avatars/{userId}-{timestamp}.{ext}`
4. Public URL is generated
5. URL is saved to `user_profiles.avatar_url`
6. Image is displayed via CDN

### Security

- **User Isolation**: Each user can only upload/delete their own avatars (filename contains user ID)
- **Public Read**: Anyone can view avatars (needed for profile display)
- **Size Limit**: Client-side validation ensures images < 5MB
- **Type Validation**: Only image files accepted

### File Naming Convention

Files are stored as: `avatars/{userId}-{timestamp}.{extension}`

Example: `avatars/550e8400-e29b-41d4-a716-446655440000-1709123456789.jpg`

This ensures:
- No filename conflicts (timestamp makes it unique)
- Easy identification of file owner (userId prefix)
- RLS policies can verify ownership

## Testing

1. Go to `/settings` in your app
2. Click Profile tab
3. Upload an avatar image
4. Verify:
   - Image preview appears
   - "Profile updated successfully!" message shows
   - Avatar displays in Header component
   - Navigate to `/lobby` and verify avatar shows there too

## Troubleshooting

### "Failed to upload image"

- **Check bucket exists**: Go to Storage in Supabase dashboard
- **Verify bucket is public**: Edit bucket settings
- **Check RLS policies**: Ensure policies are created

### "Access denied" or 403 error

- **Verify authentication**: User must be logged in
- **Check policy syntax**: Ensure policies match exactly
- **Check user ID**: Ensure `auth.uid()` returns valid user

### Image doesn't display

- **Check URL format**: Should start with your Supabase project URL
- **Verify public access**: Bucket must be public
- **Check browser console**: Look for CORS or 404 errors

## Storage Limits

Supabase Free Tier:
- 1 GB storage
- 2 GB bandwidth per month
- 50 MB max file size (our app limits to 5MB)

For production, consider upgrading or implementing image compression.

## Future Enhancements

- [ ] Image compression before upload
- [ ] Multiple image sizes (thumbnail, medium, large)
- [ ] Automatic old avatar deletion when uploading new one
- [ ] Image cropping tool
- [ ] Support for other file formats (WebP)
