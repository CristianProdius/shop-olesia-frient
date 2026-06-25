import { getTranslations } from "next-intl/server";

const NoResults = async () => {
    const t = await getTranslations("Navbar");

    return (
        <div className="flex items-center justify-center w-full py-24 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-strong">
                {t("noResults")}
            </p>
        </div>
     );
}
 
export default NoResults;