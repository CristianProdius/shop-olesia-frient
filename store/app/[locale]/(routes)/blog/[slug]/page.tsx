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
        <div className="bg-background">
            <JsonLd data={[blogPostingLd, breadcrumbLd]} />
            <Container>
                <div className="mx-auto max-w-[760px] px-4 py-16 sm:px-6 md:py-24 lg:px-8">
                    {/* Breadcrumb */}
                    <nav className="mb-10 text-xs text-muted-strong">
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

                    {post.coverImage && (
                        <div className="relative aspect-[16/9] w-full overflow-hidden bg-placeholder rounded-none">
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

                    <h1 className="heading-luxe mt-8 text-2xl uppercase tracking-[0.08em] text-ink md:text-3xl text-balance">
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
