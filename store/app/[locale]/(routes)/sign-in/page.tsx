"use client"

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter, Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import Button from "@/components/ui/button";
import Container from "@/components/ui/container";
import { signIn } from "@/lib/auth-client";

const SignInForm = () => {
    const t = useTranslations("Auth");
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get("redirect") || "/";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await signIn.email({ email, password });
        setLoading(false);

        if (error) {
            toast.error(error.message || t("invalidCredentials"));
            return;
        }

        router.push(redirect);
        router.refresh();
    };

    return (
        <form onSubmit={onSubmit} className="w-full max-w-[400px] mx-auto py-24 space-y-6">
            <h1 className="uppercase font-bold tracking-[0.05em] text-2xl text-ink">{t("signInTitle")}</h1>
            <div className="space-y-2">
                <label htmlFor="email" className="block uppercase text-xs font-bold tracking-[0.1em] text-muted-strong">{t("email")}</label>
                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-border rounded-none h-12 px-3 bg-background text-text focus:border-border-strong focus:outline-none" />
            </div>
            <div className="space-y-2">
                <label htmlFor="password" className="block uppercase text-xs font-bold tracking-[0.1em] text-muted-strong">{t("password")}</label>
                <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-border rounded-none h-12 px-3 bg-background text-text focus:border-border-strong focus:outline-none" />
            </div>
            <Button type="submit" variant="primary" size="lg" disabled={loading} className="w-full">
                {loading ? t("signingIn") : t("signIn")}
            </Button>
            <p className="text-xs text-center text-muted-strong">
                {t("noAccount")}{" "}
                <Link href="/sign-up" className="text-ink underline">{t("createOne")}</Link>
            </p>
        </form>
    );
};

const SignInPage = () => (
    <Container>
        <Suspense fallback={null}>
            <SignInForm />
        </Suspense>
    </Container>
);

export default SignInPage;
