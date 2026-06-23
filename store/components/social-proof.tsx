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
                <dl className="mt-8 grid grid-cols-1 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => (
                        <div
                            key={stat.id}
                            className="flex flex-col items-center gap-y-2 text-center"
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
