'use client';

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from "next/link";

export function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signInWithPassword({
                email, 
                password
            });
            
            if (error) {
                setError(error.message);
                return;
            } else {
                router.push('/questions');
                router.refresh();
            }
        } catch (error) {
            setError('Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-4 flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold mb-4">Welcome back! Log in to access your content.</h1>
            
            <form onSubmit={handleSubmit} className="w-full space-y-4">
                <div className="form-content space-y-4">
                    <div className="form-item">
                        <label htmlFor="email" className="block mb-1">Email:</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            className="w-full p-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    
                    <div className="form-item">
                        <label htmlFor="password" className="block mb-1">Password:</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            className="w-full p-2 border border-gray-300 rounded-md"
                        />
                    </div>
                </div>

                {error && (
                    <div className="text-red-600 text-sm mt-2 p-2 bg-red-50 rounded-md">
                        {error}
                    </div>
                )}

                <button 
                    type="submit" 
                    className="btn-primary w-full mt-4" 
                    disabled={loading}
                >
                    {loading ? 'Logging in...' : 'Log In'}
                </button>
            </form>

            <p className="mt-4 text-sm">
                Don't have an account? <Link href="/register" className="text-primary-600 hover:underline">Register</Link>
            </p>
        </div>
    );
}