
import React, { useState } from 'react';
import { LogoIcon } from './icons/LogoIcon';
import { MailIcon } from './icons/MailIcon';
import { LockClosedIcon } from './icons/LockClosedIcon';
import { supabase } from '../services/supabase';
import { UserCircleIcon } from './icons/UserCircleIcon';

type Mode = 'login' | 'signup' | 'forgotPassword';

const Login: React.FC = () => {
    const [mode, setMode] = useState<Mode>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const clearFormState = () => {
        setError('');
        setSuccessMessage('');
        setName('');
        setEmail('');
        setPassword('');
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
        }
        // on success, App.tsx's onAuthStateChange handles the state change.
        setLoading(false);
    };
    
    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: name, // Pass name here for the trigger to use
                }
            }
        });

        if (signUpError) {
            setError(signUpError.message);
        } else if (data.user) {
            // The database trigger 'on_auth_user_created' now handles profile creation.
            setSuccessMessage('Account created! Please check your email to verify your account before logging in.');
            setMode('login'); // Switch back to login view
            setEmail('');
            setPassword('');
            setName('');
        }
        
        setLoading(false);
    };
    
    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin, // URL to redirect to after password reset
        });
        
        if (error) {
            setError(error.message);
        } else {
            setSuccessMessage('Password reset instructions sent! Please check your email.');
            setMode('login');
        }
        setLoading(false);
    };

    const switchMode = (newMode: Mode) => {
        setMode(newMode);
        clearFormState();
    };

    const renderFormContent = () => {
        switch(mode) {
            case 'signup':
                return (
                    <form onSubmit={handleSignUp} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="text-sm font-medium text-slate-300 block mb-2">Full Name</label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <UserCircleIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="John Doe" required />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="email" className="text-sm font-medium text-slate-300 block mb-2">Email Address</label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <MailIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="you@example.com" required />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="password" className="text-sm font-medium text-slate-300 block mb-2">Password</label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <LockClosedIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="••••••••" required minLength={6} />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Password should be at least 6 characters.</p>
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-amber-500 text-slate-900 font-bold text-lg py-3 rounded-lg hover:bg-amber-400 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors">
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>
                );
            case 'forgotPassword':
                 return (
                    <form onSubmit={handlePasswordReset} className="space-y-6">
                        <p className="text-sm text-slate-400 text-center">Enter your email and we'll send you instructions to reset your password.</p>
                        <div>
                            <label htmlFor="email" className="text-sm font-medium text-slate-300 block mb-2">Email Address</label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <MailIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="you@example.com" required />
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-amber-500 text-slate-900 font-bold text-lg py-3 rounded-lg hover:bg-amber-400 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors">
                            {loading ? 'Sending...' : 'Send Reset Instructions'}
                        </button>
                    </form>
                );
            case 'login':
            default:
                 return (
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="text-sm font-medium text-slate-300 block mb-2">Email Address</label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <MailIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="you@example.com" required />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label htmlFor="password" className="text-sm font-medium text-slate-300 block">Password</label>
                                <button type="button" onClick={() => switchMode('forgotPassword')} className="text-xs text-amber-400 hover:text-amber-300 font-semibold">
                                    Forgot Password?
                                </button>
                            </div>
                            <div className="relative">
                                 <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <LockClosedIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="••••••••" required />
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-amber-500 text-slate-900 font-bold text-lg py-3 rounded-lg hover:bg-amber-400 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors">
                            {loading ? 'Logging In...' : 'Login'}
                        </button>
                    </form>
                );
        }
    }

    const renderToggleText = () => {
        switch(mode) {
            case 'signup':
                return (
                     <button onClick={() => switchMode('login')} className="text-sm text-amber-400 hover:text-amber-300 font-semibold">
                        Already have an account? Login
                    </button>
                );
            case 'forgotPassword':
                 return (
                     <button onClick={() => switchMode('login')} className="text-sm text-amber-400 hover:text-amber-300 font-semibold">
                        Back to Login
                    </button>
                );
            case 'login':
            default:
                return (
                     <button onClick={() => switchMode('signup')} className="text-sm text-amber-400 hover:text-amber-300 font-semibold">
                        Don't have an account? Sign Up
                    </button>
                );
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900 p-4">
            <div className="w-full max-w-sm mx-auto">
                <div className="text-center mb-8">
                    <LogoIcon className="h-16 w-16 text-amber-400 mx-auto" />
                    <h1 className="text-2xl font-bold text-slate-100 mt-4">Sap Music Group</h1>
                    <p className="text-md text-slate-400">Publishing Administration</p>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
                    {error && (
                        <p className="text-sm text-red-400 text-center mb-4">{error}</p>
                    )}
                    {successMessage && (
                        <p className="text-sm text-green-400 text-center mb-4">{successMessage}</p>
                    )}
                    
                    {renderFormContent()}
                    
                    <div className="mt-6 text-center">
                        {renderToggleText()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
