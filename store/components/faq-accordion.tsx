"use client";

import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { ChevronDown } from "lucide-react";

export interface FaqItem {
    id: string;
    question: string;
    answer: string;
}

export interface FaqGroup {
    // null/empty heading renders the items ungrouped (no category title).
    heading: string | null;
    items: FaqItem[];
}

interface FaqAccordionProps {
    groups: FaqGroup[];
}

const FaqAccordion = ({ groups }: FaqAccordionProps) => {
    return (
        <div className="space-y-12">
            {groups.map((group, gi) => (
                <section key={group.heading ?? `group-${gi}`}>
                    {group.heading ? (
                        <h2 className="mb-4 text-xs font-medium tracking-widest uppercase text-muted-strong">
                            {group.heading}
                        </h2>
                    ) : null}
                    <ul className="border-t border-border">
                        {group.items.map((item) => (
                            <li key={item.id} className="border-b border-border">
                                <Disclosure>
                                    {({ open }) => (
                                        <>
                                            <DisclosureButton className="flex items-center justify-between w-full py-5 text-left gap-x-4">
                                                <span className="text-sm font-light tracking-wide text-ink sm:text-base">
                                                    {item.question}
                                                </span>
                                                <ChevronDown
                                                    aria-hidden="true"
                                                    className={`flex-shrink-0 w-4 h-4 text-muted-strong transition-transform ${
                                                        open ? "rotate-180" : ""
                                                    }`}
                                                />
                                            </DisclosureButton>
                                            <DisclosurePanel className="pb-5 -mt-1 text-sm leading-relaxed whitespace-pre-line text-text">
                                                {item.answer}
                                            </DisclosurePanel>
                                        </>
                                    )}
                                </Disclosure>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
};

export default FaqAccordion;
