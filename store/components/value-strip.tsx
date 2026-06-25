import { getTranslations } from "next-intl/server";
import { Gem, Award, ShieldCheck, Scissors, type LucideIcon } from "lucide-react";

type ValueItem = {
    Icon: LucideIcon;
    titleKey: string;
    descKey: string;
};

const items: ValueItem[] = [
    { Icon: Gem, titleKey: "valueFabricsTitle", descKey: "valueFabricsDesc" },
    { Icon: Award, titleKey: "valueMadeTitle", descKey: "valueMadeDesc" },
    { Icon: ShieldCheck, titleKey: "valueSecureTitle", descKey: "valueSecureDesc" },
    { Icon: Scissors, titleKey: "valueDesignTitle", descKey: "valueDesignDesc" },
];

const ValueStrip = async () => {
    const t = await getTranslations("Home");

    return (
        <section className="border-y border-border bg-surface">
            <div className="mx-auto max-w-[1680px] px-4 py-10 sm:px-6 md:px-8 md:py-12 lg:px-12">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                    {items.map(({ Icon, titleKey, descKey }) => (
                        <div
                            key={titleKey}
                            className="flex flex-col items-center gap-3 text-center"
                        >
                            <Icon
                                size={22}
                                strokeWidth={1.5}
                                className="text-ink"
                                aria-hidden="true"
                            />
                            <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-text">
                                {t(titleKey)}
                            </h3>
                            <p className="max-w-[22ch] text-xs leading-relaxed text-muted-strong text-pretty">
                                {t(descKey)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ValueStrip;
