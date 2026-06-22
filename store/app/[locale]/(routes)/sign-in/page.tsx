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
        <form onSubmit={onSubmit} className="w-full max-w-sm mx-auto mt-16 space-y-4">
            <h1 className="text-2xl font-bold">{t("signInTitle")}</h1>
            <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium">{t("email")}</label>
                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 border rounded-md" />
            </div>
            <div className="space-y-1">
                <label htmlFor="password" className="text-sm font-medium">{t("password")}</label>
                <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 border rounded-md" />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
                {loading ? t("signingIn") : t("signIn")}
            </Button>
            <p className="text-sm text-center text-gray-500">
                {t("noAccount")}{" "}
                <Link href="/sign-up" className="underline">{t("createOne")}</Link>
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
