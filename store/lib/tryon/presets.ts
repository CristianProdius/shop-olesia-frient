// Client-safe Virtual Try-On config: preset model bodies + the enabled flag.
//
// PRESET MODELS ONLY — no shopper photo upload, so there is no consent,
// storage, or likeness burden. To activate try-on the store owner must:
//   1. Host a few model/mannequin photos (front-facing, neutral background) on
//      a CDN/MinIO and set their URLs via NEXT_PUBLIC_TRYON_MODEL_A/B/C.
//   2. Set NEXT_PUBLIC_TRYON_ENABLED="true".
//   3. Set the server-side VTON_API_KEY (see lib/tryon/provider.ts).
// Until then `tryOnEnabled()` is false and the UI renders nothing.

export type TryOnPresetModel = {
  id: string;
  labelKey: "modelA" | "modelB" | "modelC";
  imageUrl: string;
};

const ALL_PRESET_MODELS: TryOnPresetModel[] = [
  { id: "a", labelKey: "modelA", imageUrl: process.env.NEXT_PUBLIC_TRYON_MODEL_A ?? "" },
  { id: "b", labelKey: "modelB", imageUrl: process.env.NEXT_PUBLIC_TRYON_MODEL_B ?? "" },
  { id: "c", labelKey: "modelC", imageUrl: process.env.NEXT_PUBLIC_TRYON_MODEL_C ?? "" },
];

export const TRYON_PRESET_MODELS: TryOnPresetModel[] = ALL_PRESET_MODELS.filter(
  (model) => model.imageUrl.trim().length > 0,
);

export function tryOnEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_TRYON_ENABLED === "true" &&
    TRYON_PRESET_MODELS.length > 0
  );
}

export function findPresetModel(id: string): TryOnPresetModel | undefined {
  return TRYON_PRESET_MODELS.find((model) => model.id === id);
}
