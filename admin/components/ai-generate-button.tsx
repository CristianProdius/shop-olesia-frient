"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Loader2, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";

type Locale = "en" | "ru" | "ro";

interface AiGenerateButtonProps {
    // "draft" generates fresh copy for all targets; "translate" translates the
    // source text into the targets.
    kind: "draft" | "translate";
    // Logical field name (e.g. "description", "heading", "answer") used in the
    // prompt to steer the model.
    field: string;
    // Locale codes to fill (defaults to all three).
    targetLocales?: Locale[];
    // For "translate": the current source value + its locale (defaults to en).
    sourceText?: string;
    sourceLocale?: Locale;
    // Optional extra brand-voice steering.
    brandVoice?: string;
    // Disable while the parent form is busy.
    disabled?: boolean;
    // Called per returned locale so the parent can setValue(...) without saving.
    onResult: (values: Partial<Record<Locale, string>>) => void;
    // If known up-front, skip the /api/ai/status probe.
    configured?: boolean;
}

export const AiGenerateButton: React.FC<AiGenerateButtonProps> = ({
    kind,
    field,
    targetLocales = ["en", "ru", "ro"],
    sourceText,
    sourceLocale = "en",
    brandVoice,
    disabled,
    onResult,
    configured: configuredProp,
}) => {
    const t = useTranslations("Ai");

    const [loading, setLoading] = useState(false);
    // undefined while probing; the missing-key path renders a disabled button.
    const [configured, setConfigured] = useState<boolean | undefined>(configuredProp);

    useEffect(() => {
        if (configuredProp !== undefined) {
            setConfigured(configuredProp);
            return;
        }
        let active = true;
        axios
            .get<{ configured: boolean }>("/api/ai/status")
            .then((res) => {
                if (active) setConfigured(!!res.data?.configured);
            })
            .catch(() => {
                if (active) setConfigured(false);
            });
        return () => {
            active = false;
        };
    }, [configuredProp]);

    const onClick = async () => {
        if (kind === "translate" && (!sourceText || !sourceText.trim())) {
            toast.error(t("needsSource"));
            return;
        }
        try {
            setLoading(true);
            const res = await axios.post<Partial<Record<Locale, string>>>("/api/ai/generate", {
                kind,
                field,
                sourceText,
                sourceLocale,
                targetLocales,
                brandVoice,
            });
            // Editable preview only — the parent fills its fields; the human
            // reviews and clicks the form's existing Save. We never persist here.
            onResult(res.data ?? {});
            toast.success(t("filled"));
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 503) {
                setConfigured(false);
                toast.error(t("notConfigured"));
            } else {
                toast.error(t("failed"));
            }
        } finally {
            setLoading(false);
        }
    };

    const isDisabled = disabled || loading || configured === false || configured === undefined;
    const label = kind === "translate" ? t("translate") : t("generate");

    return (
        <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={onClick}
            disabled={isDisabled}
            title={configured === false ? t("notConfigured") : undefined}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
                <Sparkles className="w-4 h-4 mr-2" />
            )}
            {loading ? t("generating") : label}
        </Button>
    );
};
