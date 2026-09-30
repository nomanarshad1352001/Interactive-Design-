/**
 * Coastal Custom Tees — product catalog (dummy data, no database).
 *
 * All coordinates are expressed in a fixed 1024×1024 virtual space that the
 * designer canvas maps onto the responsive mockup stage. Print-area rects were
 * calibrated against the generated garment photography in /public/mockups.
 */

export type ProductId = "tshirt" | "hoodie" | "cap" | "tote";
export type ViewSide = "front" | "back";

export interface PrintRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Rectangles (1024-space) where enclosed white backdrop is force-cleared at
 * processing time — e.g. the arch inside tote bag handles, which is sealed
 * off from the border flood fill.
 */
export interface KnockoutRect extends PrintRect {
  tol: number;
}

/**
 * A printable zone on the garment. `surcharge` reflects the extra per-piece
 * cost of an additional DTF transfer location.
 */
export interface PlacementDef {
  id: string;
  name: string;
  short: string;
  rect: PrintRect;
  surcharge: number;
}

export interface ProductDef {
  id: ProductId;
  name: string;
  shortName: string;
  tagline: string;
  basePrice: number;
  apparel: boolean;
  sizes: string[];
  images: Record<ViewSide, string>;
  print: Record<ViewSide, PrintRect>;
  placements: Record<ViewSide, PlacementDef[]>;
  knockouts?: Partial<Record<ViewSide, KnockoutRect[]>>;
}

export const DESIGN_SPACE = 1024;

export const PRODUCTS: ProductDef[] = [
  {
    id: "tshirt",
    name: "Classic T-Shirt",
    shortName: "Tee",
    tagline: "Heavyweight 100% cotton tee · DTF ready",
    basePrice: 14,
    apparel: true,
    sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
    images: { front: "/mockups/tshirt-front.png", back: "/mockups/tshirt-back.png" },
    print: {
      front: { x: 340, y: 300, w: 344, h: 430 },
      back: { x: 340, y: 308, w: 344, h: 430 },
    },
    placements: {
      front: [
        { id: "full-front", name: "Full Front", short: "Full", rect: { x: 340, y: 300, w: 344, h: 430 }, surcharge: 0 },
        { id: "left-chest", name: "Left Chest", short: "L Chest", rect: { x: 374, y: 318, w: 126, h: 126 }, surcharge: 3 },
        { id: "right-chest", name: "Right Chest", short: "R Chest", rect: { x: 524, y: 318, w: 126, h: 126 }, surcharge: 3 },
        { id: "left-sleeve", name: "Left Sleeve / Arm", short: "L Sleeve", rect: { x: 204, y: 326, w: 104, h: 104 }, surcharge: 4 },
        { id: "right-sleeve", name: "Right Sleeve / Arm", short: "R Sleeve", rect: { x: 716, y: 326, w: 104, h: 104 }, surcharge: 4 },
      ],
      back: [
        { id: "full-back", name: "Full Back", short: "Full", rect: { x: 340, y: 308, w: 344, h: 430 }, surcharge: 0 },
        { id: "back-neck", name: "Back Neck Yoke", short: "Neck", rect: { x: 432, y: 252, w: 160, h: 86 }, surcharge: 3 },
        { id: "left-sleeve", name: "Left Sleeve / Arm", short: "L Sleeve", rect: { x: 204, y: 326, w: 104, h: 104 }, surcharge: 4 },
        { id: "right-sleeve", name: "Right Sleeve / Arm", short: "R Sleeve", rect: { x: 716, y: 326, w: 104, h: 104 }, surcharge: 4 },
      ],
    },
  },
  {
    id: "hoodie",
    name: "Pullover Hoodie",
    shortName: "Hoodie",
    tagline: "Midweight fleece · kangaroo pocket · DTF ready",
    basePrice: 30,
    apparel: true,
    sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
    images: { front: "/mockups/hoodie-front.png", back: "/mockups/hoodie-back.png" },
    print: {
      front: { x: 325, y: 350, w: 374, h: 296 },
      back: { x: 335, y: 245, w: 354, h: 472 },
    },
    placements: {
      front: [
        { id: "full-front", name: "Full Front", short: "Full", rect: { x: 325, y: 350, w: 374, h: 296 }, surcharge: 0 },
        { id: "left-chest", name: "Left Chest", short: "L Chest", rect: { x: 360, y: 344, w: 126, h: 126 }, surcharge: 3 },
        { id: "right-chest", name: "Right Chest", short: "R Chest", rect: { x: 538, y: 344, w: 126, h: 126 }, surcharge: 3 },
        { id: "left-sleeve", name: "Left Sleeve / Arm", short: "L Sleeve", rect: { x: 196, y: 452, w: 106, h: 140 }, surcharge: 4 },
        { id: "right-sleeve", name: "Right Sleeve / Arm", short: "R Sleeve", rect: { x: 722, y: 452, w: 106, h: 140 }, surcharge: 4 },
      ],
      back: [
        { id: "full-back", name: "Full Back", short: "Full", rect: { x: 335, y: 245, w: 354, h: 472 }, surcharge: 0 },
        { id: "hood", name: "Hood Panel", short: "Hood", rect: { x: 424, y: 168, w: 176, h: 112 }, surcharge: 4 },
        { id: "left-sleeve", name: "Left Sleeve / Arm", short: "L Sleeve", rect: { x: 196, y: 452, w: 106, h: 140 }, surcharge: 4 },
        { id: "right-sleeve", name: "Right Sleeve / Arm", short: "R Sleeve", rect: { x: 722, y: 452, w: 106, h: 140 }, surcharge: 4 },
      ],
    },
  },
  {
    id: "cap",
    name: "Snapback Cap",
    shortName: "Cap",
    tagline: "Structured 6-panel · adjustable snap closure",
    basePrice: 18,
    apparel: false,
    sizes: ["One Size"],
    images: { front: "/mockups/cap-front.png", back: "/mockups/cap-back.png" },
    print: {
      front: { x: 300, y: 225, w: 424, h: 330 },
      back: { x: 320, y: 250, w: 384, h: 300 },
    },
    placements: {
      front: [
        { id: "front-panel", name: "Front Panel", short: "Front", rect: { x: 300, y: 225, w: 424, h: 330 }, surcharge: 0 },
        { id: "front-center", name: "Center Crest", short: "Crest", rect: { x: 412, y: 286, w: 200, h: 150 }, surcharge: 2 },
        { id: "left-panel", name: "Left Panel", short: "L Panel", rect: { x: 296, y: 300, w: 120, h: 132 }, surcharge: 3 },
        { id: "right-panel", name: "Right Panel", short: "R Panel", rect: { x: 608, y: 300, w: 120, h: 132 }, surcharge: 3 },
      ],
      back: [
        { id: "back-panel", name: "Back Panel", short: "Back", rect: { x: 320, y: 250, w: 384, h: 300 }, surcharge: 0 },
        { id: "back-strap", name: "Above Strap", short: "Strap", rect: { x: 424, y: 300, w: 176, h: 130 }, surcharge: 2 },
      ],
    },
  },
  {
    id: "tote",
    name: "Canvas Tote Bag",
    shortName: "Tote",
    tagline: "12 oz natural canvas · reinforced handles",
    basePrice: 12,
    apparel: false,
    sizes: ["One Size"],
    images: { front: "/mockups/tote-front.png", back: "/mockups/tote-back.png" },
    print: {
      front: { x: 262, y: 448, w: 500, h: 470 },
      back: { x: 262, y: 448, w: 500, h: 470 },
    },
    placements: {
      front: [
        { id: "full-front", name: "Full Panel", short: "Full", rect: { x: 262, y: 448, w: 500, h: 470 }, surcharge: 0 },
        { id: "center-badge", name: "Center Badge", short: "Badge", rect: { x: 388, y: 574, w: 248, h: 248 }, surcharge: 2 },
        { id: "upper-left", name: "Upper Left Corner", short: "Corner", rect: { x: 306, y: 498, w: 180, h: 180 }, surcharge: 3 },
      ],
      back: [
        { id: "full-back", name: "Full Panel", short: "Full", rect: { x: 262, y: 448, w: 500, h: 470 }, surcharge: 0 },
        { id: "center-badge", name: "Center Badge", short: "Badge", rect: { x: 388, y: 574, w: 248, h: 248 }, surcharge: 2 },
      ],
    },
    knockouts: {
      front: [{ x: 405, y: 55, w: 214, h: 305, tol: 66 }],
      back: [{ x: 405, y: 55, w: 214, h: 305, tol: 66 }],
    },
  },
];

export function placementsFor(product: ProductDef, view: ViewSide): PlacementDef[] {
  return product.placements[view];
}

export function placementFor(
  product: ProductDef,
  view: ViewSide,
  id: string | undefined,
): PlacementDef {
  const list = product.placements[view];
  return list.find((p) => p.id === id) ?? list[0];
}

export const productById = (id: ProductId): ProductDef =>
  PRODUCTS.find((p) => p.id === id) ?? PRODUCTS[0];

export interface GarmentColor {
  name: string;
  hex: string;
}

export const GARMENT_COLORS: GarmentColor[] = [
  { name: "White", hex: "#ffffff" },
  { name: "Natural", hex: "#f0ead9" },
  { name: "Sand", hex: "#e0d0ae" },
  { name: "Ash", hex: "#c4c8cb" },
  { name: "Heather Gray", hex: "#969da4" },
  { name: "Charcoal", hex: "#3f444b" },
  { name: "Black", hex: "#21242a" },
  { name: "Seafoam", hex: "#bcdfd2" },
  { name: "Sky", hex: "#bcd9e8" },
  { name: "Carolina Blue", hex: "#7db2d3" },
  { name: "Teal", hex: "#146b66" },
  { name: "Navy", hex: "#1d3552" },
  { name: "Marigold", hex: "#efa93a" },
  { name: "Coral", hex: "#ff7f62" },
  { name: "Sunset Red", hex: "#d1464f" },
  { name: "Forest", hex: "#2f5c46" },
];

export const TEXT_COLORS = [
  "#0b2732",
  "#ffffff",
  "#0e7d86",
  "#ff6b4a",
  "#1d3552",
  "#efa93a",
  "#d1464f",
  "#2f5c46",
  "#6d28d9",
  "#f472b6",
  "#84cc16",
  "#969da4",
];

/** Demo artwork served through the same-origin image proxy (Unsplash / Pexels). */
export interface SampleArt {
  id: string;
  name: string;
  url: string;
}

const px = (url: string) => `/api/img?u=${encodeURIComponent(url)}`;

export const SAMPLE_ART: SampleArt[] = [
  {
    id: "galleon",
    name: "Mariner Galleon",
    url: px(
      "https://images.pexels.com/photos/11744264/pexels-photo-11744264.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    ),
  },
  {
    id: "surftruck",
    name: "Surf Wagon",
    url: px(
      "https://images.pexels.com/photos/38728781/pexels-photo-38728781.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    ),
  },
  {
    id: "lineup",
    name: "The Lineup",
    url: px(
      "https://images.pexels.com/photos/4600570/pexels-photo-4600570.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    ),
  },
  {
    id: "palmpath",
    name: "Palm Path",
    url: px(
      "https://images.pexels.com/photos/30684729/pexels-photo-30684729.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    ),
  },
  {
    id: "lonepalm",
    name: "Lone Palm",
    url: px(
      "https://images.pexels.com/photos/28251608/pexels-photo-28251608.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    ),
  },
  {
    id: "emblem",
    name: "Heritage Emblem",
    url: px(
      "https://images.pexels.com/photos/33661768/pexels-photo-33661768.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    ),
  },
];

export const HERO_OCEAN = px(
  "https://images.pexels.com/photos/9259704/pexels-photo-9259704.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
);

/** Customer-selectable scenes behind the live garment. */
export interface StageBackdrop {
  id: string;
  name: string;
  css?: string;
  image?: string;
  textDark: boolean;
}

export const STAGE_BACKDROPS: StageBackdrop[] = [
  {
    id: "studio",
    name: "Studio",
    css: "radial-gradient(120% 90% at 50% 18%, #ffffff 0%, #f3efe5 55%, #e7dfcd 100%)",
    textDark: false,
  },
  {
    id: "ocean",
    name: "Ocean Air",
    image: px(
      "https://images.pexels.com/photos/9259704/pexels-photo-9259704.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ),
    textDark: true,
  },
  {
    id: "boardwalk",
    name: "Boardwalk",
    image: px(
      "https://images.pexels.com/photos/30684729/pexels-photo-30684729.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    ),
    textDark: true,
  },
  {
    id: "midnight",
    name: "Midnight",
    css: "radial-gradient(120% 100% at 50% 12%, #1e4c5c 0%, #0b2732 58%, #071c24 100%)",
    textDark: true,
  },
];

export const backdropById = (id: string): StageBackdrop =>
  STAGE_BACKDROPS.find((b) => b.id === id) ?? STAGE_BACKDROPS[0];

/** Dummy tiered pricing used for the instant ballpark estimate. */
export function estimateRange(base: number, pieces: number): [number, number] {
  if (pieces <= 0) return [0, 0];
  const factor = pieces >= 50 ? 0.75 : pieces >= 24 ? 0.82 : pieces >= 12 ? 0.9 : 1;
  const low = base * factor;
  const high = low * 1.18; // print size / color count variance
  return [low, high];
}

export const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });
