import getBlogPosts from "@/actions/get-blog-posts";
import Container from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { localizedField } from "@/lib/i18n-content";
import { alternates } from "@/lib/seo";
import Image from "next/image";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

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

const BlogPage = async () => {
    const t = await getTranslations("Blog");
    const locale = await getLocale();
    const posts = await getBlogPosts();

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
                        <div className="mt-14 grid grid-cols-1 gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
                            {posts.map((post) => {
                                const title = localizedField(post.titleI18n, locale, post.title);
                                const excerpt = localizedField(
                                    post.excerptI18n,
                                    locale,
                                    post.excerpt ?? ""
                                );
                                const date = post.publishedAt
                                    ? new Date(post.publishedAt).toLocaleDateString(locale, {
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                      })
                                    : null;
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
                                                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                                                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                                                />
                                            </div>
                                        )}
                                        <h2 className="mt-4 text-base font-bold uppercase tracking-[0.08em] text-ink text-balance">
                                            {title}
                                        </h2>
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
                </section>
            </Container>
        </div>
    );
};

export default BlogPage;
