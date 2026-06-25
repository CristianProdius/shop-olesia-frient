import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Container from "@/components/ui/container";
import getCategories from "@/actions/get-categories";
import { localizedField } from "@/lib/i18n-content";

// External brand socials — update these handles to the real accounts.
const SOCIALS = [
    { label: "Instagram", href: "https://instagram.com/liletti" },
    { label: "TikTok", href: "https://www.tiktok.com/@liletti" },
];

const Footer = async () => {
    const t = await getTranslations("Footer");
    const tNav = await getTranslations("Navbar");
    const locale = await getLocale();

    const categories = (await getCategories()) ?? [];
    const year = new Date().getFullYear();

    const utilityLink =
        "text-xs uppercase tracking-[0.1em] text-muted-strong transition-colors duration-200 ease-out hover:text-ink";

    return (
        <footer className="bg-background border-t border-border">
            <Container className="py-20 text-center md:py-24">
                {/* Wordmark */}
                <Link href="/" aria-label="Liletti — Home" className="inline-block">
                    <span className="text-2xl font-bold uppercase tracking-[0.3em] text-ink">
                        LILETTI
                    </span>
                </Link>

                {/* Tagline */}
                <p className="mx-auto mt-5 max-w-sm text-xs leading-relaxed text-muted-strong text-pretty">
                    {t("tagline")}
                </p>

                {/* Shop — real category links */}
                {categories.length > 0 && (
                    <nav className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
                        {categories.map((category) => (
                            <Link
                                key={category.id}
                                href={`/category/${category.id}`}
                                className="text-xs font-bold uppercase tracking-[0.1em] text-text transition-colors duration-200 ease-out hover:text-ink"
                            >
                                {localizedField(category.nameI18n, locale, category.name)}
                            </Link>
                        ))}
                    </nav>
                )}

                {/* Account + social */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
                    <Link href="/blog" className={utilityLink}>
                        {t("journal")}
                    </Link>
                    <Link href="/sign-in" className={utilityLink}>
                        {tNav("signIn")}
                    </Link>
                    <Link href="/cart" className={utilityLink}>
                        {tNav("cart")}
                    </Link>
                    {SOCIALS.map((social) => (
                        <a
                            key={social.label}
                            href={social.href}
                            target="_blank"
                            rel="noreferrer noopener"
                            className={utilityLink}
                        >
                            {social.label}
                        </a>
                    ))}
                </div>

                {/* Divider + copyright */}
                <div className="mx-auto mt-14 max-w-[120px] border-t border-border" />
                <p className="mt-8 text-xs text-muted-strong">
                    {t("copyright", { year })}
                </p>
            </Container>
        </footer>
    );
};

export default Footer;
