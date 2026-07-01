import { getTranslations } from "next-intl/server";
import getStats from "@/actions/get-stats";
import { localizedField } from "@/lib/i18n-content";

interface SocialProofProps {
    locale: string;
}

// Server-friendly social-proof counters band for the home page. Renders only
// admin-authored, published `Stat` records — honest social proof. If no stats
// exist it renders nothing (no invented numbers). Editorial, radius-0, token
// utilities only.
const SocialProof = async ({ locale }: SocialProofProps) => {
    const stats = await getStats();

    if (stats.length === 0) {
        return null;
    }

    const t = await getTranslations("SocialProof");

    return (
        <section className="border-y border-border">
            <div className="px-6 py-12 sm:px-8 lg:py-16">
                <h2 className="text-center text-xs font-medium tracking-[0.2em] uppercase text-muted-strong">
                    {t("heading")}
                </h2>
                {/* Fixed-width items in a centered flex wrap so any number of
                    stats (4, 5, 6…) stays balanced: a full row centers, and any
                    remainder wraps to a centered row instead of hanging left. */}
                <dl className="mt-8 flex flex-wrap items-start justify-center gap-x-12 gap-y-10 sm:gap-x-20 lg:gap-x-28">
                    {stats.map((stat) => (
                        <div
                            key={stat.id}
                            className="flex w-[130px] flex-col items-center gap-y-2 text-center sm:w-[150px]"
                        >
                            <dt className="text-4xl font-light tracking-tight text-ink lg:text-5xl">
                                {stat.value}
                            </dt>
                            <dd className="text-sm tracking-wide uppercase text-muted-strong">
                                {localizedField(stat.labelI18n, locale, stat.label)}
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>
        </section>
    );
};

export default SocialProof;
