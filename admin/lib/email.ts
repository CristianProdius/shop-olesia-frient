import { Resend } from "resend";

export type SendEmailArgs = {
    to: string;
    subject: string;
    html: string;
};

export type SendEmailResult = {
    sent: boolean;
    skipped?: boolean;
    error?: string;
};

const DEFAULT_FROM = "LILETTI <onboarding@resend.dev>";

/**
 * Env-gated transactional email sender.
 *
 * Behaviour by design:
 * - If `RESEND_API_KEY` is unset/empty -> logs an info line and NO-OPs,
 *   returning `{ sent: false, skipped: true }`. It NEVER throws so callers
 *   (checkout / order PATCH) keep working with no key configured.
 * - Otherwise it lazily constructs the Resend client and sends. Any send
 *   error is caught, logged, and returned as `{ sent: false, error }` —
 *   again, it never throws.
 */
export async function sendEmail({ to, subject, html }: SendEmailArgs): Promise<SendEmailResult> {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        console.info(`[email] skipped (no RESEND_API_KEY): ${subject} -> ${to}`);
        return { sent: false, skipped: true };
    }

    try {
        const resend = new Resend(apiKey);
        const from = process.env.EMAIL_FROM ?? DEFAULT_FROM;

        const { error } = await resend.emails.send({
            from,
            to,
            subject,
            html,
        });

        if (error) {
            const message = error.message ?? String(error);
            console.error(`[email] send failed: ${subject} -> ${to}:`, message);
            return { sent: false, error: message };
        }

        return { sent: true };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[email] send threw: ${subject} -> ${to}:`, message);
        return { sent: false, error: message };
    }
}
