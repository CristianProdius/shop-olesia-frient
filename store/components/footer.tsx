import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Newsletter from "@/components/newsletter";

const Footer = async () => {
    const t = await getTranslations("Footer");
    const tLinks = await getTranslations("FooterLinks");

    return (
        <footer className="bg-white border-t">
            <div className="flex flex-col items-center px-4 py-10 mx-auto gap-y-6">
                <Newsletter />
                <nav className="flex items-center gap-x-6">
                    <Link
                        href="/about"
                        className="text-xs tracking-wide uppercase text-muted-strong hover:text-ink"
                    >
                        {tLinks("about")}
                    </Link>
                    <Link
                        href="/atelier"
                        className="text-xs tracking-wide uppercase text-muted-strong hover:text-ink"
                    >
                        {tLinks("atelier")}
                    </Link>
                    <Link
                        href="/faq"
                        className="text-xs tracking-wide uppercase text-muted-strong hover:text-ink"
                    >
                        {tLinks("faq")}
                    </Link>
                    <Link
                        href="/custom-order"
                        className="text-xs tracking-wide uppercase text-muted-strong hover:text-ink"
                    >
                        {tLinks("customOrder")}
                    </Link>
                </nav>
                <p className="text-xs text-center text-text">
                    {t("copyright")}
                </p>
            </div>
        </footer>
    )
}

export default Footer;
