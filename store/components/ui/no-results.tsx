import { getTranslations } from "next-intl/server";

const NoResults = async () => {
    const t = await getTranslations("Navbar");

    return (
        <div className="flex items-center justify-center w-full h-full text-neutral-500">
            {t("noResults")}
        </div>
     );
}
 
export default NoResults;