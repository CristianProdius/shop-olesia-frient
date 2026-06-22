import { getTranslations } from "next-intl/server";

const Footer = async () => {
    const t = await getTranslations("Footer");

    return (
        <footer className="bg-white border-t">
            <div className="py-10 mx-auto">
                <p className="text-xs text-center text-black">
                    {t("copyright")}
                </p>
            </div>
        </footer>
    )
}

export default Footer;