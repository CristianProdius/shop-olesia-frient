import { getTranslations } from "next-intl/server";
import { Factory, Globe, ShieldCheck, RefreshCcw } from "lucide-react";
import getContentBlocks from "@/actions/get-content-blocks";
import { localizedField } from "@/lib/i18n-content";

interface WhyChooseUsProps {
    locale: string;
}

// Cycled through dynamic blocks (which carry no icon of their own) and used in
// order for the static fallback set. Keeps the strip visually consistent.
const ICONS = [Factory, Globe, ShieldCheck, RefreshCcw];

// Server-friendly value strip for the home page. Renders published
// `why-choose-us` ContentBlocks when an editor has authored them; otherwise
// falls back to four static, localized value props so the strip is never empty.
// Editorial, radius-0, token utilities only.
const WhyChooseUs = async ({ locale }: WhyChooseUsProps) => {
    const t = await getTranslations("WhyChooseUs");
    const blocks = await getContentBlocks("why-choose-us");

    const items =
        blocks.length > 0
            ? blocks.map((block, index) => ({
                  key: block.id,
                  Icon: ICONS[index % ICONS.length],
                  heading: localizedField(
                      block.headingI18n,
                      locale,
                      block.heading ?? "",
                  ),
                  body: localizedField(
                      block.bodyI18n,
                      locale,
                      block.body ?? "",
                  ),
              }))
            : (["ownProduction", "delivery", "payment", "returns"] as const).map(
                  (slug, index) => ({
                      key: slug,
                      Icon: ICONS[index % ICONS.length],
                      heading: t(`${slug}.heading`),
                      body: t(`${slug}.body`),
                  }),
              );

    if (items.length === 0) {
        return null;
    }

    return (
        <section className="border-y border-border">
            <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4">
                {items.map(({ key, Icon, heading, body }) => (
                    <div
                        key={key}
                        className="flex flex-col gap-y-3 px-6 py-10 sm:px-8"
                    >
                        <Icon
                            className="h-6 w-6 text-ink"
                            strokeWidth={1.25}
                            aria-hidden="true"
                        />
                        {heading ? (
                            <h3 className="text-sm font-medium tracking-wide uppercase text-ink">
                                {heading}
                            </h3>
                        ) : null}
                        {body ? (
                            <p className="text-sm leading-relaxed text-muted-strong">
                                {body}
                            </p>
                        ) : null}
                    </div>
                ))}
            </div>
        </section>
    );
};

export default WhyChooseUs;
