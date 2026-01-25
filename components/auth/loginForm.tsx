'use client';

import { useState } from "react";
import {useRouter} from 'next/navigation';
import {createClient} from '@/lib/supabase/client';

export function LoginForm() {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();
    const [loading, setLoading] = useState(false);  
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try{
            const supabase = createClient();
            setLoading(true);
            const {data, error} = await supabase.auth.signInWithPassword({email, password});
            
            if(error){
                setError(error.message);
                return;
            }
            else{
                router.push('/questions');
                router.refresh();
            }
        }
        catch(error){
            setError('Invalid email or password. Please try again.');
        }
        finally{
            setLoading(false);
        }

    };

    return(
        <form onSubmit={handleSubmit}>

            <h1>Welcome user! Log in to access your content.</h1>
            
            <div className="form-content">
                <div className="form-item">
                    <label htmlFor="email">
                        Email:
                    </label>
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
                    <label htmlFor="password">
                        Password:
                    </label>
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

            <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Logging in...' : 'Log In'}
            </button>
            
        </form>
    );
}