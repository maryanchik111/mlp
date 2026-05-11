'use client';

import { useState, useEffect, useRef } from 'react';
import { setupRecaptcha, signInWithPhone } from '@/lib/firebase';
import { ConfirmationResult } from 'firebase/auth';

interface PhoneLoginProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

export default function PhoneLogin({ onSuccess, onCancel }: PhoneLoginProps) {
    const [phoneNumber, setPhoneNumber] = useState('+380');
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'phone' | 'code'>('phone');

    const recaptchaRef = useRef<HTMLDivElement>(null);
    const confirmationResultRef = useRef<ConfirmationResult | null>(null);
    const recaptchaVerifierRef = useRef<any>(null);

    useEffect(() => {
        if (!recaptchaVerifierRef.current && typeof window !== 'undefined') {
            recaptchaVerifierRef.current = setupRecaptcha('recaptcha-container');
        }
    }, []);

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!recaptchaVerifierRef.current) {
                throw new Error('Recaptcha не ініціалізовано');
            }

            const result = await signInWithPhone(phoneNumber, recaptchaVerifierRef.current);
            confirmationResultRef.current = result;
            setStep('code');
        } catch (err: any) {
            console.error('Phone auth error:', err);
            if (err.code === 'auth/invalid-phone-number') {
                setError('Невірний формат номера телефону.');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Занадто багато запитів. Спробуйте пізніше.');
            } else {
                setError('Не вдалося відправити SMS. Перевірте номер.');
            }
            // Reset recaptcha on error to allow retry
            if ((window as any).grecaptcha && recaptchaVerifierRef.current) {
                recaptchaVerifierRef.current.render().then((widgetId: any) => {
                    (window as any).grecaptcha.reset(widgetId);
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!confirmationResultRef.current) {
                throw new Error('Код не був відправлений');
            }

            await confirmationResultRef.current.confirm(verificationCode);
            if (onSuccess) onSuccess();
        } catch (err: any) {
            console.error('Verification error:', err);
            setError('Невірний код підтвердження.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 py-2">
            <div id="recaptcha-container"></div>

            {step === 'phone' ? (
                <form onSubmit={handleSendCode} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Номер телефону
                        </label>
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="+380XXXXXXXXX"
                            required
                            disabled={loading}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 focus:outline-none transition-all text-gray-900"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Введіть номер у міжнародному форматі (наприклад, +380...)
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all disabled:opacity-50 active:scale-[0.98]"
                    >
                        {loading ? '⏳ Відправка...' : '📲 Відправити код через SMS'}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Код з SMS
                        </label>
                        <input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            placeholder="123456"
                            required
                            disabled={loading}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 focus:outline-none transition-all text-center tracking-[1em] text-2xl font-bold text-gray-900"
                            maxLength={6}
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all disabled:opacity-50 active:scale-[0.98]"
                        >
                            {loading ? '⏳ Перевірка...' : '✅ Підтвердити код'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep('phone')}
                            disabled={loading}
                            className="w-full py-2 text-gray-500 text-sm hover:underline"
                        >
                            Змінити номер телефону
                        </button>
                    </div>
                </form>
            )}

            {onCancel && (
                <button
                    type="button"
                    onClick={onCancel}
                    className="w-full py-2 text-gray-400 text-xs uppercase tracking-widest hover:text-gray-600 transition-colors"
                >
                    Скасувати
                </button>
            )}
        </div>
    );
}
