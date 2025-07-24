
import React, { useState, useRef } from 'react';
import { useApp } from '../AppContext';
import { Navigate } from 'react-router-dom';
import { Card, Button, Input } from '../components/UI';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';

type AuthStep = 'login' | 'signup_step1' | 'signup_step2' | 'signup_success';

const PinInput: React.FC<{ onComplete: (pin: string) => void; length?: number, disabled?: boolean }> = ({ onComplete, length = 4, disabled }) => {
    const [pin, setPin] = useState<string[]>(new Array(length).fill(''));
    const inputRefs = useRef<HTMLInputElement[]>([]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const { value } = e.target;
        if (/[^0-9]/.test(value)) return;

        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);

        if (value && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
        
        if (newPin.every(digit => digit !== '')) {
            onComplete(newPin.join(''));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    return (
        <div className="flex justify-center gap-3">
            {pin.map((digit, index) => (
                <Input
                    key={index}
                    ref={(el) => { if (el) inputRefs.current[index] = el; }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="w-14 h-16 text-3xl text-center font-orbitron"
                    disabled={disabled}
                />
            ))}
        </div>
    );
};


const PinUnlockPage: React.FC = () => {
    const { verifyPin, logout, loading } = useApp();
    const [error, setError] = useState('');

    const handlePinComplete = async (pin: string) => {
        setError('');
        const success = await verifyPin(pin);
        if (!success) {
            setError('Invalid PIN. Please try again.');
        }
    };

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 p-4">
            <Card className="w-full max-w-md p-8 text-center">
                <h2 className="font-orbitron text-2xl text-sky-400 mb-2">Enter PIN</h2>
                <p className="text-slate-400 mb-6">Enter your 4-digit PIN to unlock the application.</p>
                <PinInput onComplete={handlePinComplete} disabled={loading} />
                {error && <p className="text-red-400 mt-4">{error}</p>}
                 <Button variant="secondary" onClick={logout} className="mt-6">
                    Logout
                </Button>
            </Card>
        </div>
    );
};


export const AuthPage: React.FC = () => {
    const { isAuthenticated, isPinVerified, login, signup, loading } = useApp();
    const [step, setStep] = useState<AuthStep>('login');
    const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '', pin: '' });
    const [error, setError] = useState('');

    if (isAuthenticated && !isPinVerified) return <PinUnlockPage />;
    if (isAuthenticated && isPinVerified) return <Navigate to="/" />;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError('');
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(formData.email, formData.password);
        } catch (err) {
            setError((err as Error).message);
        }
    };
    
    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if(step === 'signup_step1') {
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match.');
                return;
            }
            if (formData.password.length < 6) {
                setError('Password must be at least 6 characters long.');
                return;
            }
            setStep('signup_step2');
        } else if (step === 'signup_step2') {
             try {
                await signup(formData.email, formData.password, formData.pin);
                setStep('signup_success');
            } catch (err) {
                setError((err as Error).message);
            }
        }
    };

    const renderStep = () => {
        switch (step) {
            case 'login':
                return (
                    <motion.div key="login" initial={{opacity: 0, x: -50}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: 50}}>
                        <h2 className="font-orbitron text-3xl text-sky-400 mb-2">Welcome Back</h2>
                        <p className="text-slate-400 mb-8">Login to access your dashboard.</p>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <Input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} required />
                            <Input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleInputChange} required />
                            {error && <p className="text-red-400 text-sm">{error}</p>}
                            <Button type="submit" className="w-full" isLoading={loading}>Login</Button>
                        </form>
                        <p className="text-center mt-6 text-slate-400">
                            Don't have an account?{' '}
                            <button onClick={() => setStep('signup_step1')} className="font-semibold text-sky-400 hover:underline">
                                Sign Up
                            </button>
                        </p>
                    </motion.div>
                );
            case 'signup_step1':
                 return (
                    <motion.div key="signup1" initial={{opacity: 0, x: -50}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: 50}}>
                        <h2 className="font-orbitron text-3xl text-sky-400 mb-2">Create Account</h2>
                        <p className="text-slate-400 mb-8">Step 1: Account Details</p>
                        <form onSubmit={handleSignup} className="space-y-4">
                             <Input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} required />
                            <Input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleInputChange} required />
                            <Input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleInputChange} required />
                            {error && <p className="text-red-400 text-sm">{error}</p>}
                            <Button type="submit" className="w-full" isLoading={loading}>Next: Set PIN</Button>
                        </form>
                         <p className="text-center mt-6 text-slate-400">
                            Already have an account?{' '}
                            <button onClick={() => setStep('login')} className="font-semibold text-sky-400 hover:underline">
                                Login
                            </button>
                        </p>
                    </motion.div>
                );
            case 'signup_step2':
                return (
                    <motion.div key="signup2" initial={{opacity: 0, x: -50}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: 50}}>
                        <h2 className="font-orbitron text-3xl text-sky-400 mb-2">Secure Your Account</h2>
                        <p className="text-slate-400 mb-8">Step 2: Set a 4-digit PIN for quick access.</p>
                        <div className="space-y-4">
                             <PinInput onComplete={(pin) => setFormData(f => ({...f, pin}))} disabled={loading} />
                             {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                             <Button onClick={handleSignup} className="w-full" isLoading={loading} disabled={formData.pin.length !== 4}>Complete Signup</Button>
                        </div>
                         <p className="text-center mt-6 text-slate-400">
                             <button onClick={() => setStep('signup_step1')} className="font-semibold text-sky-400 hover:underline">
                                Go Back
                            </button>
                        </p>
                    </motion.div>
                );
            case 'signup_success':
                return (
                    <motion.div key="success" initial={{opacity: 0, scale: 0.8}} animate={{opacity: 1, scale: 1}} className="text-center">
                        <h2 className="font-orbitron text-3xl text-green-400 mb-2">Success!</h2>
                        <p className="text-slate-300 mb-8">Your account has been created. You can now log in.</p>
                        <Button onClick={() => setStep('login')} className="w-full">Proceed to Login</Button>
                    </motion.div>
                )
        }
    }

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-slate-950 p-4">
            <Card className="w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <div className="flex justify-center items-center gap-3">
                       <ShoppingCart className="text-sky-400 h-10 w-10"/>
                       <h1 className="font-orbitron text-4xl text-white">ScannBizz</h1>
                    </div>
                </div>
                <AnimatePresence mode="wait">
                  {renderStep()}
                </AnimatePresence>
            </Card>
        </div>
    );
};
