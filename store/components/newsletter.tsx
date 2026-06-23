"use client"

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Newsletter = () => {
    const t = useTranslations("Newsletter");
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmed = email.trim();
        if (!EMAIL_RE.test(trimmed)) {
            toast.error(t("invalid"));
            return;
        }

        setSubmitting(true);
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/subscribers`, {
                email: trimmed,
            });
            toast.success(t("success"));
            setEmail("");
        } catch (err) {
            console.error(err);
            toast.error(t("error"));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={onSubmit}
            className="flex flex-col items-center w-full max-w-md gap-y-3"
        >
            <p className="text-xs tracking-wide uppercase text-muted-strong">
                {t("heading")}
            </p>
            <div className="flex w-full">
                <label htmlFor="newsletter-email" className="sr-only">
                    {t("placeholder")}
                </label>
                <input
                    id="newsletter-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("placeholder")}
                    className="flex-1 px-3 py-2 text-sm border border-border bg-white text-text placeholder:text-muted-strong focus:outline-none focus:border-ink"
                />
                <Button
                    type="submit"
                    disabled={submitting}
                    className="!rounded-none shrink-0"
                >
                    {t("subscribe")}
                </Button>
            </div>
        </form>
    );
};

export default Newsletter;
