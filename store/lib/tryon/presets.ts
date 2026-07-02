// Client-safe Virtual Try-On config: preset STYLES (no shopper photo upload and
// no hosted model photos needed). Each style maps to a prompt fragment; the
// image model generates a model wearing the product's garment in that setting.
// Enablement is decided server-side (presence of the image API key) and passed
// to the UI as a prop — see lib/tryon/provider.ts `tryOnConfigured()`.

export type TryOnStyle = {
  id: string;
  labelKey: "styleStudio" | "styleEditorial" | "styleStreet";
  prompt: string;
};

export const TRYON_STYLES: TryOnStyle[] = [
  {
    id: "studio",
    labelKey: "styleStudio",
    prompt:
      "standing in a clean photography studio with soft, even lighting and a neutral seamless background",
  },
  {
    id: "editorial",
    labelKey: "styleEditorial",
    prompt:
      "in an elegant editorial fashion pose with tasteful dramatic lighting",
  },
  {
    id: "street",
    labelKey: "styleStreet",
    prompt: "in a natural outdoor street-style setting in soft daylight",
  },
];

export function findStyle(id: string): TryOnStyle | undefined {
  return TRYON_STYLES.find((style) => style.id === id);
}
