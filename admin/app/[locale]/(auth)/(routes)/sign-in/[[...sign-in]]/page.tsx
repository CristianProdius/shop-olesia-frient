"use client"

import { useState } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";

export default function SignInPage() {
    const router = useRouter();
    const t = useTranslations("AuthAdmin");
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

        router.push("/");
        router.refresh();
    };

    return (
        <form onSubmit={onSubmit} className="w-full max-w-sm p-6 space-y-4 border rounded-lg">
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold">{t("signInTitle")}</h1>
                <p className="text-sm text-muted-foreground">{t("signInSubtitle")}</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">{t("password")}</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("signingIn") : t("signIn")}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
                {t("noAccount")}{" "}
                <Link href="/sign-up" className="underline">{t("createOne")}</Link>
            </p>
        </form>
    );
}
