import { Link } from "@/i18n/navigation";
import { Category } from "@/types";
import { localizedField } from "@/lib/i18n-content";
import { cn } from "@/lib/utils";

interface CategorySidebarProps {
    categories: Category[];
    activeCategoryId: string;
    heading: string;
    locale: string;
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({
    categories,
    activeCategoryId,
    heading,
    locale,
}) => {
    return (
        <nav aria-label={heading}>
            <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-ink">
                {heading}
            </h2>
            <hr className="rule my-4" />
            <ul className="flex flex-col">
                {categories.map((category) => {
                    const isActive = category.id === activeCategoryId;
                    return (
                        <li key={category.id} className="flex min-h-[30px] items-center">
                            <Link
                                href={`/category/${category.id}`}
                                aria-current={isActive ? "page" : undefined}
                                className={cn(
                                    "text-[13px] font-semibold uppercase tracking-[0.04em] transition-colors duration-200 ease-out",
                                    isActive
                                        ? "text-ink underline decoration-1 underline-offset-4"
                                        : "text-muted-strong hover:text-ink hover:underline"
                                )}
                            >
                                {localizedField(category.nameI18n, locale, category.name)}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
};

export default CategorySidebar;
