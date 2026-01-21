import { createClient } from '@/lib/supabase/server';

export default async function TestDatabasePage() {
  let connectionStatus = {
    success: false,
    message: '',
    details: '',
  };

  try {
    const supabase = await createClient();
    
    // Simple connection test - just try to create the client
    // We'll check if we can get the session (even if null)
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      connectionStatus = {
        success: false,
        message: 'Connection Error',
        details: error.message,
      };
    } else {
      connectionStatus = {
        success: true,
        message: 'Successfully connected to Supabase!',
        details: data.session ? 'Active session found' : 'No active session (this is normal)',
      };
    }
  } catch (error) {
    connectionStatus = {
      success: false,
      message: 'Configuration Error',
      details: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-900">
            🔌 Supabase Connection Test
          </h1>

          <div
            className={`p-6 rounded-lg border-2 ${
              connectionStatus.success
                ? 'bg-green-50 border-green-500'
                : 'bg-red-50 border-red-500'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl">
                {connectionStatus.success ? '✅' : '❌'}
              </div>
              <div className="flex-1">
                <h2
                  className={`text-xl font-semibold mb-2 ${
                    connectionStatus.success ? 'text-green-900' : 'text-red-900'
                  }`}
                >
                  {connectionStatus.message}
                </h2>
                <p
                  className={`${
                    connectionStatus.success ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {connectionStatus.details}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                📝 Configuration Status
              </h3>
              <div className="space-y-1 text-sm text-blue-800">
                <p>
                  <strong>NEXT_PUBLIC_SUPABASE_URL:</strong>{' '}
                  {process.env.NEXT_PUBLIC_SUPABASE_URL ? (
                    <span className="text-green-600">✓ Set</span>
                  ) : (
                    <span className="text-red-600">✗ Missing</span>
                  )}
                </p>
                <p>
                  <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong>{' '}
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? (
                    <span className="text-green-600">✓ Set</span>
                  ) : (
                    <span className="text-red-600">✗ Missing</span>
                  )}
                </p>
              </div>
            </div>

            {!connectionStatus.success && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">
                  🔧 How to Fix
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-800">
                  <li>
                    Open <code className="bg-yellow-100 px-1 rounded">.env.local</code>{' '}
                    file in your project root
                  </li>
                  <li>Replace the placeholder values with your actual Supabase credentials</li>
                  <li>
                    Get credentials from:{' '}
                    <a
                      href="https://app.supabase.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Supabase Dashboard → Settings → API
                    </a>
                  </li>
                  <li>Restart your dev server: <code className="bg-yellow-100 px-1 rounded">npm run dev</code></li>
                  <li>Refresh this page</li>
                </ol>
              </div>
            )}

            {connectionStatus.success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">
                  🎉 Next Steps
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-green-800">
                  <li>Your app is connected to Supabase!</li>
                  <li>Set up your database tables in the Supabase dashboard</li>
                  <li>Configure Row Level Security (RLS) policies</li>
                  <li>Start building your features</li>
                  <li>
                    Delete this test page when done: <code className="bg-green-100 px-1 rounded">app/test-db/</code>
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <a
              href="/"
              className="text-primary-600 hover:text-primary-700 font-semibold"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
