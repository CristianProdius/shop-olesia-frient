import Image from "next/image";
import type { ContentBlock } from "@/types";
import { localizedField } from "@/lib/i18n-content";

interface ContentSectionProps {
    blocks: ContentBlock[];
    locale: string;
    emptyMessage: string;
}

// Presentational, server-friendly renderer for a list of ContentBlocks.
// Editorial minimal-luxury layout: heading + body, with an optional image laid
// out alongside the text and alternating sides on each row. Radius-0, token
// utilities only (no hardcoded colors).
const ContentSection: React.FC<ContentSectionProps> = ({
    blocks,
    locale,
    emptyMessage,
}) => {
    if (blocks.length === 0) {
        return (
            <p className="text-sm text-muted-strong">{emptyMessage}</p>
        );
    }

    return (
        <div className="flex flex-col gap-y-16 sm:gap-y-24">
            {blocks.map((block, index) => {
                const heading = localizedField(
                    block.headingI18n,
                    locale,
                    block.heading ?? "",
                );
                const body = localizedField(
                    block.bodyI18n,
                    locale,
                    block.body ?? "",
                );
                const imageFirst = index % 2 === 1;

                const text = (
                    <div className="flex flex-col justify-center gap-y-4">
                        {heading ? (
                            <h2 className="text-2xl font-light tracking-wide uppercase text-ink sm:text-3xl">
                                {heading}
                            </h2>
                        ) : null}
                        {body ? (
                            <p className="text-sm leading-relaxed whitespace-pre-line text-muted-strong sm:text-base">
                                {body}
                            </p>
                        ) : null}
                    </div>
                );

                const image = block.mediaUrl ? (
                    <div className="relative w-full overflow-hidden aspect-[4/5]">
                        <Image
                            src={block.mediaUrl}
                            alt={heading || ""}
                            fill
                            sizes="(min-width: 1024px) 50vw, 100vw"
                            className="object-cover"
                        />
                    </div>
                ) : null;

                return (
                    <section
                        key={block.id}
                        className={
                            image
                                ? "grid items-stretch gap-8 lg:grid-cols-2 lg:gap-12"
                                : "max-w-3xl"
                        }
                    >
                        {image ? (
                            <>
                                {imageFirst ? image : text}
                                {imageFirst ? text : image}
                            </>
                        ) : (
                            text
                        )}
                    </section>
                );
            })}
        </div>
    );
};

export default ContentSection;
