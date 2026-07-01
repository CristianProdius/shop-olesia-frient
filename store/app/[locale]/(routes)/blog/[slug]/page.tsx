import getBlogPost from "@/actions/get-blog-post";
import Container from "@/components/ui/container";
import JsonLd from "@/components/json-ld";
import { Link } from "@/i18n/navigation";
import { localizedField } from "@/lib/i18n-content";
import { SITE_URL, alternates } from "@/lib/seo";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({
    params,
}: {
    params: Params;
}): Promise<Metadata> {
    const { locale, slug } = await params;
    const post = await getBlogPost(slug);
    if (!post) return {};

    const title = localizedField(post.titleI18n, locale, post.title);
    const description = localizedField(post.excerptI18n, locale, post.excerpt ?? "");
    const alts = alternates(locale, `/blog/${slug}`);

    return {
        title,
        description: description || undefined,
        alternates: alts,
        openGraph: {
            type: "article",
            title,
            description: description || undefined,
            images: post.coverImage ? [post.coverImage] : [],
            url: alts.canonical,
            publishedTime: post.publishedAt ?? undefined,
        },
        twitter: {
            card: "summary_large_image",
        },
    };
}

const BlogPostPage = async ({ params }: { params: Params }) => {
    const t = await getTranslations("Blog");
    const tNav = await getTranslations("Navbar");
    const locale = await getLocale();
    const { slug } = await params;
    const post = await getBlogPost(slug);

    if (!post) {
        notFound();
    }

    const title = localizedField(post.titleI18n, locale, post.title);
    const excerpt = localizedField(post.excerptI18n, locale, post.excerpt ?? "");
    const content = localizedField(post.contentI18n, locale, post.content);
    const { slug: postSlug } = await params;
    const canonical = alternates(locale, `/blog/${postSlug}`).canonical;

    const blogPostingLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
        headline: title,
        description: excerpt || undefined,
        image: post.coverImage ? [post.coverImage] : undefined,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt || post.publishedAt,
        inLanguage: locale,
        author: { "@type": "Organization", name: "LILETTI", url: SITE_URL },
        publisher: { "@id": `${SITE_URL}/#organization` },
    };

    const breadcrumbLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: tNav("home"),
                item: `${SITE_URL}/${locale}`,
            },
            {
                "@type": "ListItem",
                position: 2,
                name: t("title"),
                item: `${SITE_URL}/${locale}/blog`,
            },
            {
                "@type": "ListItem",
                position: 3,
                name: title,
                item: canonical,
            },
        ],
    };

    const date = post.publishedAt
        ? new Date(post.publishedAt).toLocaleDateString(locale, {
              year: "numeric",
              month: "long",
              day: "numeric",
          })
        : null;

    return (
        <article className="bg-background">
            <JsonLd data={[blogPostingLd, breadcrumbLd]} />
            <Container>
                <div className="px-4 pt-12 pb-20 sm:px-6 md:pt-16 md:pb-28 lg:px-8">
                    {/* Breadcrumb */}
                    <nav className="mx-auto max-w-[720px] text-xs text-muted-strong">
                        <ol className="flex flex-wrap items-center gap-x-2">
                            <li>
                                <Link href="/" className="hover:text-text">
                                    {tNav("home")}
                                </Link>
                            </li>
                            <li aria-hidden="true">/</li>
                            <li>
                                <Link href="/blog" className="hover:text-text">
                                    {t("title")}
                                </Link>
                            </li>
                            <li aria-hidden="true">/</li>
                            <li className="text-text">{title}</li>
                        </ol>
                    </nav>

                    {/* Centered editorial header */}
                    <header className="mx-auto mt-10 max-w-[720px] text-center md:mt-12">
                        {date && (
                            <p className="text-xs uppercase tracking-[0.16em] text-muted-strong">
                                {t("publishedOn", { date })}
                            </p>
                        )}
                        <h1 className="heading-luxe mt-4 text-2xl uppercase tracking-[0.08em] text-ink md:text-4xl text-balance">
                            {title}
                        </h1>
                        {excerpt && (
                            <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-muted-strong text-pretty">
                                {excerpt}
                            </p>
                        )}
                    </header>

                    {/* Wide cover — breaks past the text column for drama */}
                    {post.coverImage && (
                        <div className="mx-auto mt-10 max-w-[960px] md:mt-12">
                            <div className="relative aspect-[16/9] w-full overflow-hidden bg-placeholder">
                                <Image
                                    fill
                                    src={post.coverImage}
                                    alt={title}
                                    sizes="(min-width: 1024px) 960px, 100vw"
                                    className="object-cover"
                                    priority
                                />
                            </div>
                        </div>
                    )}

                    {/* Body — readable column, drop-cap lead, editorial type */}
                    <div
                        className="mx-auto mt-12 max-w-[680px] text-pretty md:mt-14 [&_h2]:mt-12 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-[0.08em] [&_h2]:text-ink [&_h3]:mt-8 [&_h3]:font-bold [&_h3]:text-ink [&_p]:my-5 [&_p]:text-[16px] [&_p]:leading-[1.85] [&_p]:text-text [&_a]:underline [&_a]:underline-offset-2 [&_a]:text-text [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1.5 [&_li]:leading-relaxed [&_li]:text-text [&>p:first-of-type]:first-letter:float-left [&>p:first-of-type]:first-letter:mr-3 [&>p:first-of-type]:first-letter:mt-1 [&>p:first-of-type]:first-letter:text-6xl [&>p:first-of-type]:first-letter:font-light [&>p:first-of-type]:first-letter:leading-[0.7] [&>p:first-of-type]:first-letter:text-ink"
                        dangerouslySetInnerHTML={{ __html: content }}
                    />

                    <div className="mx-auto mt-16 max-w-[680px] border-t border-border pt-8 text-center">
                        <Link
                            href="/blog"
                            className="text-xs font-bold uppercase tracking-[0.14em] text-ink transition-colors duration-200 ease-out hover:text-muted-strong"
                        >
                            {t("backToJournal")}
                        </Link>
                    </div>
                </div>
            </Container>
        </article>
    );
};

export default BlogPostPage;
