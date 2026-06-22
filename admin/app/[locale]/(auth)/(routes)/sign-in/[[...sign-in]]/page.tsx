"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";

export default function SignInPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await signIn.email({ email, password });
        setLoading(false);

        if (error) {
            toast.error(error.message || "Invalid credentials.");
            return;
        }

        router.push("/");
        router.refresh();
    };

    return (
        <form onSubmit={onSubmit} className="w-full max-w-sm p-6 space-y-4 border rounded-lg">
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold">Sign in</h1>
                <p className="text-sm text-muted-foreground">Welcome back to your dashboard.</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
                No account?{" "}
                <Link href="/sign-up" className="underline">Create one</Link>
            </p>
        </form>
    );
}
