export const CATEGORY_OPTIONS = {
  seed: {
    label: "Seed",
    detailLabel: "Crop", // label shown on the verify page, e.g. "Crop : Tomato"
    subCategories: ["Vegetable Crops", "Field Crops"],
  },
  fertilizer: {
    label: "Fertilizer",
    detailLabel: "Fertilizer", // e.g. "Fertilizer : Bacto Potash"
    subCategories: [
      "Granulated Fertilizers",
      "Water Soluble Fertilizer",
      "Liquid Fertilizers",
      "Speciality Fertilizers",
      "Biostimulants",
    ],
  },
} as const;

export type CategoryKey = keyof typeof CATEGORY_OPTIONS;

export function detailLabelFor(category: string) {
  return CATEGORY_OPTIONS[category as CategoryKey]?.detailLabel || "Product";
}
