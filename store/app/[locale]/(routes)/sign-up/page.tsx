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
            <form onSubmit={onSubmit} className="w-full max-w-sm mx-auto mt-16 space-y-4">
                <h1 className="text-2xl font-bold">{t("createAccountTitle")}</h1>
                <div className="space-y-1">
                    <label htmlFor="name" className="text-sm font-medium">{t("name")}</label>
                    <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)}
                        className="w-full p-2 border rounded-md" />
                </div>
                <div className="space-y-1">
                    <label htmlFor="email" className="text-sm font-medium">{t("email")}</label>
                    <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-2 border rounded-md" />
                </div>
                <div className="space-y-1">
                    <label htmlFor="password" className="text-sm font-medium">{t("password")}</label>
                    <input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 border rounded-md" />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                    {loading ? t("creating") : t("createAccount")}
                </Button>
                <p className="text-sm text-center text-gray-500">
                    {t("alreadyHaveAccount")}{" "}
                    <Link href="/sign-in" className="underline">{t("signIn")}</Link>
                </p>
            </form>
        </Container>
    );
};

export default SignUpPage;
