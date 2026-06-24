"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CustomOrderForm = () => {
    const t = useTranslations("CustomOrder");
    const locale = useLocale();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [message, setMessage] = useState("");
    const [measurements, setMeasurements] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedEmail = email.trim();
        if (
            !name.trim() ||
            !EMAIL_RE.test(trimmedEmail) ||
            !message.trim()
        ) {
            toast.error(t("error"));
            return;
        }

        setSubmitting(true);
        try {
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/custom-orders`,
                {
                    name: name.trim(),
                    email: trimmedEmail,
                    phone: phone.trim(),
                    message: message.trim(),
                    measurements: measurements.trim(),
                    locale,
                }
            );
            toast.success(t("success"));
            setName("");
            setEmail("");
            setPhone("");
            setMessage("");
            setMeasurements("");
        } catch (err) {
            console.error(err);
            toast.error(t("error"));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1">
                <label htmlFor="co-name" className="text-sm font-medium text-ink">
                    {t("name")}
                </label>
                <input
                    id="co-name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border bg-white text-text placeholder:text-muted-strong focus:outline-none focus:border-ink"
                />
            </div>
            <div className="space-y-1">
                <label htmlFor="co-email" className="text-sm font-medium text-ink">
                    {t("email")}
                </label>
                <input
                    id="co-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border bg-white text-text placeholder:text-muted-strong focus:outline-none focus:border-ink"
                />
            </div>
            <div className="space-y-1">
                <label htmlFor="co-phone" className="text-sm font-medium text-ink">
                    {t("phone")}
                </label>
                <input
                    id="co-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border bg-white text-text placeholder:text-muted-strong focus:outline-none focus:border-ink"
                />
            </div>
            <div className="space-y-1">
                <label
                    htmlFor="co-message"
                    className="text-sm font-medium text-ink"
                >
                    {t("message")}
                </label>
                <textarea
                    id="co-message"
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border bg-white text-text placeholder:text-muted-strong focus:outline-none focus:border-ink"
                />
            </div>
            <div className="space-y-1">
                <label
                    htmlFor="co-measurements"
                    className="text-sm font-medium text-ink"
                >
                    {t("measurements")}
                </label>
                <textarea
                    id="co-measurements"
                    rows={5}
                    value={measurements}
                    onChange={(e) => setMeasurements(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border bg-white text-text placeholder:text-muted-strong focus:outline-none focus:border-ink"
                />
            </div>
            <Button
                type="submit"
                disabled={submitting}
                className="w-full !rounded-none"
            >
                {submitting ? t("submitting") : t("submit")}
            </Button>
        </form>
    );
};

export default CustomOrderForm;
