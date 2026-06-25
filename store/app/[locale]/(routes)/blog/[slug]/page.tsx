import getBlogPost from "@/actions/get-blog-post";
import Container from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { localizedField } from "@/lib/i18n-content";
import { buildAlternates, breadcrumbJsonLd } from "@/lib/seo";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://liletti.md";

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
    const alts = buildAlternates(BASE, locale, `/blog/${slug}`);

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
    const locale = await getLocale();
    const { slug } = await params;
    const post = await getBlogPost(slug);

    if (!post) {
        notFound();
    }

    const title = localizedField(post.titleI18n, locale, post.title);
    const excerpt = localizedField(post.excerptI18n, locale, post.excerpt ?? "");
    const content = localizedField(post.contentI18n, locale, post.content);
    const canonical = buildAlternates(BASE, locale, `/blog/${slug}`).canonical;

    const blogPostingLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
        headline: title,
        description: excerpt || undefined,
        image: post.coverImage ? [post.coverImage] : undefined,
        datePublished: post.publishedAt ?? undefined,
        dateModified: post.updatedAt ?? post.publishedAt ?? undefined,
        inLanguage: locale,
        author: { "@type": "Organization", name: "LILETTI", url: BASE },
        publisher: { "@type": "Organization", name: "LILETTI", url: BASE },
    };

    const breadcrumbLd = breadcrumbJsonLd([
        { name: "LILETTI", url: `${BASE}/${locale}` },
        { name: t("title"), url: `${BASE}/${locale}/blog` },
        { name: title, url: canonical },
    ]);

    const date = post.publishedAt
        ? new Date(post.publishedAt).toLocaleDateString(locale, {
              year: "numeric",
              month: "long",
              day: "numeric",
          })
        : null;

    return (
        <div className="bg-white">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
            />
            <Container>
                <div className="mx-auto max-w-[760px] px-4 py-16 sm:px-6 md:py-24 lg:px-8">
                    {/* Breadcrumb */}
                    <nav className="mb-10 text-xs text-muted-strong" aria-label="Breadcrumb">
                        <ol className="flex flex-wrap items-center gap-x-2">
                            <li>
                                <Link href="/" className="hover:text-ink">
                                    LILETTI
                                </Link>
                            </li>
                            <li aria-hidden="true">/</li>
                            <li>
                                <Link href="/blog" className="hover:text-ink">
                                    {t("title")}
                                </Link>
                            </li>
                            <li aria-hidden="true">/</li>
                            <li className="text-ink">{title}</li>
                        </ol>
                    </nav>

                    {post.coverImage && (
                        <div className="relative w-full overflow-hidden aspect-[16/9] bg-neutral-100 rounded-none">
                            <Image
                                fill
                                src={post.coverImage}
                                alt={title}
                                sizes="(min-width: 768px) 760px, 100vw"
                                className="object-cover"
                                priority
                            />
                        </div>
                    )}

                    <h1 className="mt-8 text-2xl font-light tracking-[0.02em] text-ink md:text-3xl text-balance">
                        {title}
                    </h1>
                    {date && (
                        <p className="mt-4 text-xs uppercase tracking-[0.1em] text-muted-strong">
                            {t("publishedOn", { date })}
                        </p>
                    )}

                    <div
                        className="mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-[0.04em] [&_h2]:mt-8 [&_h3]:font-bold [&_h3]:mt-6 [&_p]:my-4 [&_p]:text-[15px] [&_p]:leading-relaxed [&_p]:text-text [&_a]:underline [&_a]:text-text [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 text-pretty"
                        dangerouslySetInnerHTML={{ __html: content }}
                    />

                    <div className="mt-14 border-t border-border pt-8">
                        <Link
                            href="/blog"
                            className="text-xs font-bold uppercase tracking-[0.1em] text-ink transition-colors duration-200 ease-out hover:text-muted-strong"
                        >
                            {t("backToJournal")}
                        </Link>
                    </div>
                </div>
            </Container>
        </div>
    );
};

export default BlogPostPage;
