"use client";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Category } from "@/types";
import { Link } from "@/i18n/navigation";
import Container from "@/components/ui/container";
import MainNav from "@/components/main-nav";
import NavbarActions from "@/components/navbar-actions";
import MobileMenu from "./mobile-menu";

interface NavbarClientProps {
    categories: Category[];
}

const Wordmark = () => (
    <Link
        href="/"
        aria-label="Liletti — Home"
        className="inline-flex items-center leading-none"
    >
        <span className="text-2xl font-bold uppercase tracking-[0.3em] text-ink leading-none">
            LILETTI
        </span>
    </Link>
);

const NavbarClient: React.FC<NavbarClientProps> = ({ categories }) => {
    const t = useTranslations("Navbar");
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <header
            className={cn(
                "sticky top-0 z-50 w-full bg-background border-b transition-[box-shadow,border-color] duration-200 ease-out",
                scrolled
                    ? "border-border shadow-[var(--shadow-nav)]"
                    : "border-transparent",
            )}
        >
            {/* Row 1: hamburger (mobile) · centered wordmark · actions */}
            <Container>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center h-14 lg:h-20">
                    {/* LEFT: hamburger (mobile only) */}
                    <div className="flex items-center justify-self-start">
                        <button
                            type="button"
                            aria-label={t("menu")}
                            aria-expanded={open}
                            onClick={() => setOpen(true)}
                            className="lg:hidden inline-flex items-center justify-center text-text transition-colors duration-200 ease-out hover:text-muted"
                        >
                            <Menu size={22} strokeWidth={1.5} />
                        </button>
                    </div>

                    {/* CENTER: wordmark (all breakpoints) */}
                    <div className="justify-self-center">
                        <Wordmark />
                    </div>

                    {/* RIGHT: actions */}
                    <div className="justify-self-end">
                        <NavbarActions />
                    </div>
                </div>
            </Container>

            {/* Row 2: full-width centered category nav (desktop only) */}
            <div className="hidden lg:block border-t border-border">
                <Container>
                    <div className="flex justify-center py-3.5">
                        <MainNav data={categories} />
                    </div>
                </Container>
            </div>

            <MobileMenu
                open={open}
                onClose={() => setOpen(false)}
                categories={categories}
            />
        </header>
    );
};

export default NavbarClient;
