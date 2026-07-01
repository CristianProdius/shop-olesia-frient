import { useTranslations } from "next-intl";

const AssistantTyping = () => {
  const t = useTranslations("Assistant");

  return (
    <div
      className="flex items-center gap-1.5"
      role="status"
      aria-label={t("thinking")}
    >
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="size-1.5 rounded-full bg-muted-strong animate-typing-dot motion-reduce:animate-none"
          style={{ animationDelay: `${index * 160}ms` }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
};

export default AssistantTyping;
