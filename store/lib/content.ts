// Keeps only published items and returns them sorted by ascending `order`.
// Pure so the store action never renders unpublished/unordered content even if
// the admin API contract changes. Does not mutate the input array. Generic so
// it works for any published-and-ordered admin entity (content blocks, FAQs…).
export function publishedSorted<T extends { isPublished: boolean; order: number }>(
  items: T[]
): T[] {
  return items
    .filter((item) => item.isPublished)
    .sort((a, b) => a.order - b.order);
}
