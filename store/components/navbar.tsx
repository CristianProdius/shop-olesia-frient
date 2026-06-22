import Container from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { MainNav } from "@/components";
import getCategories from "@/actions/get-categories";
import NavbarActions from "./navbar-actions";
import { getTranslations } from "next-intl/server";

export const revalidate = 0;

const Navbar = async () => {
    const categories = await getCategories();
    const t = await getTranslations("Navbar");

    return (
        <div className="border-b">
            <Container>
                <div className="relative flex items-center h-16 px-4 sm:px-6 lg:px-8">
                    <Link href="/" className="flex ml-4 lg:ml-0 gap-x-2">
                        <p className="text-xl font-bold">{t("brand")}</p>
                    </Link>
                    <MainNav data={categories || []} />
                    <NavbarActions />
                </div>
            </Container>
        </div>
    )
}
export default Navbar;