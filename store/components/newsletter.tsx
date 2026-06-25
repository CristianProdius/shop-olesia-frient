'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Newsletter = () => {
    const t = useTranslations('Home');
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // Validate client-side, then POST the address to the admin API,
        // which persists it as a Subscriber for this store.
        const value = email.trim();

        if (!EMAIL_REGEX.test(value)) {
            toast.error(t('newsletterInvalid'));
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: value }),
            });

            if (res.ok) {
                toast.success(t('newsletterSuccess'));
                setEmail('');
            } else if (res.status === 409) {
                toast(t('newsletterDuplicate'));
                setEmail('');
            } else {
                toast.error(t('newsletterError'));
            }
        } catch {
            toast.error(t('newsletterError'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="w-full bg-surface-2 py-16 md:py-20">
            <div className="mx-auto max-w-[640px] px-4 text-center">
                <h2 className="heading-luxe text-2xl text-ink text-balance">
                    {t('newsletterTitle')}
                </h2>
                <p className="mt-3 text-sm text-muted-strong text-pretty">
                    {t('newsletterDesc')}
                </p>

                <form
                    onSubmit={onSubmit}
                    className="mx-auto mt-8 flex max-w-[460px] flex-wrap justify-center gap-3"
                >
                    <input
                        type="email"
                        required
                        disabled={submitting}
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder={t('newsletterPlaceholder')}
                        aria-label={t('newsletterTitle')}
                        className={cn(
                            'h-12 flex-1 rounded-none border border-border bg-background px-4 text-sm text-text',
                            'placeholder:text-muted focus:border-border-strong focus:outline-none',
                        )}
                    />
                    <button
                        type="submit"
                        disabled={submitting}
                        className={cn(
                            'h-12 rounded-none border border-ink bg-ink px-8 text-xs font-bold uppercase tracking-[0.1em] text-white',
                            'transition-colors duration-200 ease-out hover:bg-transparent hover:text-ink',
                            'disabled:opacity-60 disabled:cursor-not-allowed',
                        )}
                    >
                        {t('newsletterCta')}
                    </button>
                </form>
            </div>
        </section>
    );
};

export default Newsletter;
