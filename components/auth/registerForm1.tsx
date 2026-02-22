'use client';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

export function RegisterForm() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            if (currentPassword !== confirmPassword) {
                setError('Passwords do not match. Please try again.');
                return;
            }
            
            if (currentPassword.length < 8) {
                setError('Password must be at least 8 characters long.');
                return;
            }

            const supabase = createClient();
            const { error } = await supabase.auth.signUp({
                email: email,
                password: currentPassword,
                options: {
                    data: {
                        username: username
                    }
                }
            });

            if (error) {
                setError(error.message);
                return;
            }
            
            alert('Success! Please check your email to confirm your account.');
            router.push('/login');
        } catch (error) {
            setError('An error occurred while registering. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-4 flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold mb-4">Register for an account</h1>
            
            <form onSubmit={handleSubmit} className='w-full max-w-md space-y-4'>
                <div className='form-group space-y-4'>
                    <div>
                        <label htmlFor='username' className="block mb-1">Username</label>
                        <input
                            type='text'
                            id='username'
                            placeholder="Choose a username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={loading}
                            className='w-full p-2 border border-gray-300 rounded-md'
                        />
                    </div>
                    
                    <div>
                        <label htmlFor='email' className="block mb-1">Email</label>
                        <input
                            type='email'
                            id='email'
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            className='w-full p-2 border border-gray-300 rounded-md'
                        />
                    </div>
                    
                    <div>
                        <label htmlFor='current_password' className="block mb-1">Password</label>
                        <input
                            type='password'
                            id='current_password'
                            placeholder="At least 8 characters"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            disabled={loading}
                            className='w-full p-2 border border-gray-300 rounded-md'
                        />
                    </div>

                    <div>
                        <label htmlFor='confirm_password' className="block mb-1">Confirm Password</label>
                        <input
                            type='password'
                            id='confirm_password'
                            placeholder="Re-enter your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={loading}
                            className='w-full p-2 border border-gray-300 rounded-md'
                        />
                    </div>
                </div>

                {error && (
                    <div className="text-red-600 text-sm mt-2 p-2 bg-red-50 rounded-md">
                        {error}
                    </div>
                )}

                <button 
                    type='submit' 
                    disabled={loading} 
                    className='btn-primary w-full mt-4'
                >
                    {loading ? 'Registering...' : 'Register'}
                </button>
            </form>

            <p className="mt-4 text-sm">
                Already have an account? <Link href="/login" className="text-primary-600 hover:underline">Log in</Link>
            </p>
        </div>
    );
}