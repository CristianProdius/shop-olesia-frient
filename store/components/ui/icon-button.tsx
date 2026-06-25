import { cn } from "@/lib/utils";
import { MouseEventHandler } from "react";

interface IconButtonProps {
    onClick?: MouseEventHandler<HTMLButtonElement> | undefined;
    icon: React.ReactElement;
    className?: string;
}

const IconButton: React.FC<IconButtonProps> = ({ onClick, className, icon }) => {
    return ( 
        <button
            onClick={onClick}
            className={cn("flex items-center justify-center w-10 h-10 rounded-none bg-transparent border-0 shadow-none text-text hover:text-muted transition-colors duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2", className)}>
                {icon}
        </button>
     );
}
 
export default IconButton;