import { cn } from "@/lib/utils";

interface ContainerProps {
    children: React.ReactNode;
    fluid?: boolean;
    className?: string;
}

const Container: React.FC<ContainerProps> = ({ children, fluid, className }) => {
    return (
        <div
            className={cn(
                fluid
                    ? "w-full"
                    : "mx-auto w-full max-w-[1680px] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16",
                className,
            )}
        >
            {children}
        </div>
    );
};

export default Container
