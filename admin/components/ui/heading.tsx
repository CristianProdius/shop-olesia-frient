interface HeadingProps {
    title: string;
    description: string;
}

export const Heading: React.FC<HeadingProps> = ({  title, description }) => {
    return (
        <div>
            <h2 className="text-2xl font-semibold uppercase tracking-[0.04em] text-foreground text-balance">{title}</h2>
            <p className="text-sm text-muted-foreground max-w-2xl text-pretty">{description}</p>
        </div>
    )
}