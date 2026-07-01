import getBlogPosts from "@/actions/get-blog-posts";
import Container from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { localizedField } from "@/lib/i18n-content";
import { alternates } from "@/lib/seo";
import Image from "next/image";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import type { BlogPost } from "@/types";

export const revalidate = 0;

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Blog" });

    return {
        title: t("title"),
        description: t("subtitle"),
        alternates: alternates(locale, "/blog"),
        openGraph: {
            type: "website",
            title: t("title"),
            description: t("subtitle"),
        },
    };
}

const formatDate = (value: string | Date | null | undefined, locale: string) =>
    value
        ? new Date(value).toLocaleDateString(locale, {
              year: "numeric",
              month: "long",
              day: "numeric",
          })
        : null;

const BlogPage = async () => {
    const t = await getTranslations("Blog");
    const locale = await getLocale();
    const posts = await getBlogPosts();

    const [hero, ...rest] = posts;

    return (
        <div className="bg-background">
            <Container>
                <section className="py-20 md:py-24">
                    <div className="text-center">
                        <h1 className="heading-luxe text-2xl uppercase tracking-[0.12em] text-ink md:text-3xl text-balance">
                            {t("title")}
                        </h1>
                        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-muted-strong text-pretty">
                            {t("subtitle")}
                        </p>
                    </div>

                    {posts.length === 0 ? (
                        <div className="mt-16 text-center text-sm text-muted-strong">
                            {t("noPosts")}
                        </div>
                    ) : (
                        <>
                            {/* Featured post — large editorial hero */}
                            {hero && (
                                <Link
                                    href={`/blog/${hero.slug}`}
                                    className="group mt-14 block md:mt-16"
                                >
                                    {hero.coverImage && (
                                        <div className="relative aspect-[16/10] overflow-hidden bg-placeholder md:aspect-[21/9]">
                                            <Image
                                                fill
                                                priority
                                                src={hero.coverImage}
                                                alt={localizedField(hero.titleI18n, locale, hero.title)}
                                                sizes="(min-width: 1024px) 1100px, 100vw"
                                                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                                            />
                                        </div>
                                    )}
                                    <div className="mx-auto mt-7 max-w-2xl text-center">
                                        {formatDate(hero.publishedAt, locale) && (
                                            <p className="text-xs uppercase tracking-[0.14em] text-muted-strong">
                                                {formatDate(hero.publishedAt, locale)}
                                            </p>
                                        )}
                                        <h2 className="heading-luxe mt-3 text-xl uppercase tracking-[0.1em] text-ink md:text-2xl text-balance">
                                            {localizedField(hero.titleI18n, locale, hero.title)}
                                        </h2>
                                        {localizedField(hero.excerptI18n, locale, hero.excerpt ?? "") && (
                                            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-strong text-pretty">
                                                {localizedField(hero.excerptI18n, locale, hero.excerpt ?? "")}
                                            </p>
                                        )}
                                        <span className="mt-4 inline-block text-xs font-bold uppercase tracking-[0.14em] text-ink transition-colors duration-200 group-hover:text-muted-strong">
                                            {t("readMore")}
                                        </span>
                                    </div>
                                </Link>
                            )}

                            {/* Remaining posts — refined two-column grid */}
                            {rest.length > 0 && (
                                <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 md:mt-20 md:gap-x-10 md:gap-y-16">
                                    {rest.map((post: BlogPost) => {
                                        const title = localizedField(post.titleI18n, locale, post.title);
                                        const excerpt = localizedField(
                                            post.excerptI18n,
                                            locale,
                                            post.excerpt ?? ""
                                        );
                                        const date = formatDate(post.publishedAt, locale);
                                        return (
                                            <Link
                                                key={post.id}
                                                href={`/blog/${post.slug}`}
                                                className="group block"
                                            >
                                                {post.coverImage && (
                                                    <div className="relative aspect-[3/2] overflow-hidden bg-placeholder">
                                                        <Image
                                                            fill
                                                            src={post.coverImage}
                                                            alt={title}
                                                            sizes="(min-width: 640px) 50vw, 100vw"
                                                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                                                        />
                                                    </div>
                                                )}
                                                <h3 className="mt-5 text-base font-bold uppercase tracking-[0.08em] text-ink text-balance">
                                                    {title}
                                                </h3>
                                                {excerpt && (
                                                    <p className="mt-2 text-sm leading-relaxed text-muted-strong line-clamp-2 text-pretty">
                                                        {excerpt}
                                                    </p>
                                                )}
                                                <div className="mt-3 flex flex-wrap items-center gap-x-3 text-xs uppercase tracking-[0.1em] text-muted-strong">
                                                    {date && <span>{date}</span>}
                                                    <span className="text-ink">{t("readMore")}</span>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </section>
            </Container>
        </div>
    );
};

export default BlogPage;
