import type { ContentBlock } from "@/types";

// Keeps only published blocks and returns them sorted by ascending `order`.
// Pure so the store action never renders unpublished/unordered content even if
// the admin API contract changes. Does not mutate the input array.
export function publishedSorted(blocks: ContentBlock[]): ContentBlock[] {
  return blocks
    .filter((block) => block.isPublished)
    .sort((a, b) => a.order - b.order);
}
