import { NextResponse } from "next/server";
import { getUserId } from "@/lib/server-auth";

// Server-side Anthropic proxy for the Trilingual AI Copy Studio.
//
// The API key NEVER reaches the browser: the client only ever talks to this
// route, and we only construct the Anthropic client when the key is present.
// With no key set the route returns a clean 503 (AI_NOT_CONFIGURED) and we
// never import/instantiate the SDK in a way that could throw — so the admin
// builds and runs fully without an Anthropic key (the feature degrades to a
// disabled button in the UI).

const LOCALES = ["en", "ru", "ro"] as const;
type Locale = (typeof LOCALES)[number];

const LOCALE_NAMES: Record<Locale, string> = {
    en: "English",
    ru: "Russian",
    ro: "Romanian",
};

const MODEL = "claude-opus-4-8";

const SYSTEM_PROMPT = [
    "You are the in-house copywriter for LILETTI, a Moldovan premium fashion house.",
    "Your voice is minimal-luxury editorial: concise, evocative, confident, and modern.",
    "Avoid clichés, hype, and exclamation marks. Favour restraint and precise, sensory language.",
    "Write copy that feels at home next to high-end fashion photography.",
    "When translating, preserve meaning, tone, and brand voice rather than translating word-for-word.",
    "Return only the requested copy for each locale — no labels, quotes, or commentary.",
].join(" ");

type GenerateBody = {
    kind?: "draft" | "translate";
    field?: string;
    sourceText?: string;
    sourceLocale?: string;
    targetLocales?: string[];
    brandVoice?: string;
};

function buildUserPrompt(body: {
    kind: "draft" | "translate";
    field: string;
    sourceText?: string;
    sourceLocale?: Locale;
    targetLocales: Locale[];
    brandVoice?: string;
}): string {
    const { kind, field, sourceText, sourceLocale, targetLocales, brandVoice } = body;
    const targets = targetLocales.map((l) => `${l} (${LOCALE_NAMES[l]})`).join(", ");
    const lines: string[] = [];

    if (kind === "translate") {
        lines.push(
            `Translate the following "${field}" copy from ${
                sourceLocale ? LOCALE_NAMES[sourceLocale] : "the source language"
            } into: ${targets}.`
        );
        lines.push("Preserve the LILETTI brand voice in every translation.");
        lines.push("");
        lines.push("Source copy:");
        lines.push(sourceText ?? "");
    } else {
        lines.push(`Write original "${field}" copy for a LILETTI product/content entry.`);
        if (sourceText && sourceText.trim().length > 0) {
            lines.push("Use this existing context/notes as the basis:");
            lines.push(sourceText.trim());
        }
        lines.push(`Produce a distinct, idiomatic version for each of: ${targets}.`);
        lines.push("Keep it short and on-brand for the given field.");
    }

    if (brandVoice && brandVoice.trim().length > 0) {
        lines.push("");
        lines.push(`Additional brand-voice guidance: ${brandVoice.trim()}`);
    }

    lines.push("");
    lines.push(
        `Return a JSON object whose keys are exactly the target locale codes (${targetLocales.join(
            ", "
        )}) and whose values are the copy strings.`
    );

    return lines.join("\n");
}

export async function POST(req: Request) {
    const userId = await getUserId();
    if (!userId) {
        return new NextResponse("Unauthenticated", { status: 401 });
    }

    // Guard FIRST: never construct the client or import-execute SDK paths that
    // need the key when it's missing.
    if (!process.env.ANTHROPIC_API_KEY) {
        return NextResponse.json(
            { error: "AI_NOT_CONFIGURED" },
            { status: 503 }
        );
    }

    let body: GenerateBody;
    try {
        body = (await req.json()) as GenerateBody;
    } catch {
        return new NextResponse("Invalid JSON body", { status: 400 });
    }

    const kind = body.kind === "translate" ? "translate" : "draft";
    const field = typeof body.field === "string" ? body.field.trim() : "";
    const targetLocales = (Array.isArray(body.targetLocales) ? body.targetLocales : []).filter(
        (l): l is Locale => (LOCALES as readonly string[]).includes(l)
    );
    const sourceLocale = (LOCALES as readonly string[]).includes(body.sourceLocale ?? "")
        ? (body.sourceLocale as Locale)
        : undefined;

    if (!field) {
        return new NextResponse("Field is required", { status: 400 });
    }
    if (targetLocales.length === 0) {
        return new NextResponse("At least one target locale is required", { status: 400 });
    }
    if (kind === "translate" && (!body.sourceText || !body.sourceText.trim())) {
        return new NextResponse("Source text is required to translate", { status: 400 });
    }

    try {
        // Imported lazily so the module is only evaluated on the configured path.
        const { default: Anthropic } = await import("@anthropic-ai/sdk");
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

        const properties: Record<string, { type: "string" }> = {};
        for (const locale of targetLocales) {
            properties[locale] = { type: "string" };
        }

        const response = await client.messages.create({
            model: MODEL,
            max_tokens: 4000,
            system: SYSTEM_PROMPT,
            messages: [
                {
                    role: "user",
                    content: buildUserPrompt({
                        kind,
                        field,
                        sourceText: body.sourceText,
                        sourceLocale,
                        targetLocales,
                        brandVoice: body.brandVoice,
                    }),
                },
            ],
            output_config: {
                format: {
                    type: "json_schema",
                    schema: {
                        type: "object",
                        properties,
                        required: targetLocales,
                        additionalProperties: false,
                    },
                },
            },
        });

        const text = response.content
            .filter((block) => block.type === "text")
            .map((block) => block.text)
            .join("");

        let parsed: Record<string, unknown>;
        try {
            parsed = JSON.parse(text) as Record<string, unknown>;
        } catch {
            return NextResponse.json(
                { error: "AI_FAILED", detail: "Model did not return valid JSON" },
                { status: 500 }
            );
        }

        const result: Partial<Record<Locale, string>> = {};
        for (const locale of targetLocales) {
            const value = parsed[locale];
            if (typeof value === "string") {
                result[locale] = value.trim();
            }
        }

        return NextResponse.json(result);
    } catch (err) {
        // Never leak the API key; surface a short, safe detail string.
        const detail = err instanceof Error ? err.message : "Unknown error";
        console.log(`[AI_GENERATE] ${detail}`);
        return NextResponse.json({ error: "AI_FAILED", detail }, { status: 500 });
    }
}
