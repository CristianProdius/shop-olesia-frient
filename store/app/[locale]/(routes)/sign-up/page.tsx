"use client"

import { useState } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import Button from "@/components/ui/button";
import Container from "@/components/ui/container";
import { signUp } from "@/lib/auth-client";

const SignUpPage = () => {
    const t = useTranslations("Auth");
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await signUp.email({ name, email, password });
        setLoading(false);

        if (error) {
            toast.error(error.message || t("createAccountError"));
            return;
        }

        router.push("/");
        router.refresh();
    };

    return (
        <Container>
            <form onSubmit={onSubmit} className="w-full max-w-[400px] mx-auto py-24 space-y-6">
                <h1 className="uppercase font-bold tracking-[0.05em] text-2xl text-ink">{t("createAccountTitle")}</h1>
                <div className="space-y-2">
                    <label htmlFor="name" className="block uppercase text-xs font-bold tracking-[0.1em] text-muted-strong">{t("name")}</label>
                    <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)}
                        className="w-full border border-border rounded-none h-12 px-3 bg-background text-text focus:border-border-strong focus:outline-none" />
                </div>
                <div className="space-y-2">
                    <label htmlFor="email" className="block uppercase text-xs font-bold tracking-[0.1em] text-muted-strong">{t("email")}</label>
                    <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                        className="w-full border border-border rounded-none h-12 px-3 bg-background text-text focus:border-border-strong focus:outline-none" />
                </div>
                <div className="space-y-2">
                    <label htmlFor="password" className="block uppercase text-xs font-bold tracking-[0.1em] text-muted-strong">{t("password")}</label>
                    <input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
                        className="w-full border border-border rounded-none h-12 px-3 bg-background text-text focus:border-border-strong focus:outline-none" />
                </div>
                <Button type="submit" variant="primary" size="lg" disabled={loading} className="w-full">
                    {loading ? t("creating") : t("createAccount")}
                </Button>
                <p className="text-xs text-center text-muted-strong">
                    {t("alreadyHaveAccount")}{" "}
                    <Link href="/sign-in" className="text-ink underline">{t("signIn")}</Link>
                </p>
            </form>
        </Container>
    );
};

export default SignUpPage;
