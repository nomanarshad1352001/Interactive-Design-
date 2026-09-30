import type { ProductId, ViewSide } from "@/config/catalog";

export type { ViewSide };

export type FontStyle = "normal" | "bold" | "italic" | "bold italic";

export interface BaseElementState {
  id: string;
  /** Position of the node's (unscaled) top-left corner, in 1024-space. */
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  /** Artwork intensity. Defaults to 1 (fully vivid). */
  opacity: number;
  /** Print location on the garment (chest, sleeve, hood, …). */
  placement: string;
}

export interface ImageElementState extends BaseElementState {
  kind: "image";
  src: string;
  width: number;
  height: number;
  label: string;
  artworkId?: string;
}

export interface TextElementState extends BaseElementState {
  kind: "text";
  text: string;
  fontFamily: string;
  fill: string;
  fontSize: number;
  fontStyle: FontStyle;
  letterSpacing: number;
  stroke: string;
  strokeWidth: number;
  label: string;
}

export type DesignElement = ImageElementState | TextElementState;
export type ViewDesign = DesignElement[];
export type ProductDesign = Record<ViewSide, ViewDesign>;
export type DesignState = Record<ProductId, ProductDesign>;

export interface ArtworkFile {
  id: string;
  name: string;
  sizeKB: number;
  width: number;
  height: number;
  dataUrl: string;
  sample?: boolean;
}

export type SizeMap = Record<string, number>;
export type OrderSizes = Record<ProductId, SizeMap>;

export const uid = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

export const emptyProductDesign = (): ProductDesign => ({ front: [], back: [] });

export const emptyDesigns = (): DesignState => ({
  tshirt: emptyProductDesign(),
  hoodie: emptyProductDesign(),
  cap: emptyProductDesign(),
  tote: emptyProductDesign(),
});

export const emptySizes = (): OrderSizes => ({
  tshirt: {},
  hoodie: {},
  cap: {},
  tote: {},
});

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  org: string;
  neededBy: string;
  notes: string;
}

export interface QuoteResult {
  quoteId: string;
  eta: string;
  previews: Partial<Record<ViewSide, string>>;
}
