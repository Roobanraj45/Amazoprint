export type FoilType = {
  id: number;
  name: string;
  slug: string;
  allowedSubProductIds: number[] | null;
  colorCode: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type GradientStop = {
  id: string;
  color: string;
  position: number; // 0 to 1
  weight?: number;
};

export type Shadow = {
  id: string;
  offsetX: number;
  offsetY: number;
  blur: number;
  color: string;
};

export type TextWarp = {
  style: 'none' | 'circle';
  radius?: number; 
  value?: number; // For circle rotation
  reverse?: boolean; 
};

export type PathPoint = {
  x: number;
  y: number;
  // control point for the curve before this point
  cp1x: number;
  cp1y: number;
  // control point for the curve after this point
  cp2x: number;
  cp2y: number;
};

export type Background = {
  type: 'solid' | 'gradient' | 'image' | 'stepped-gradient';
  color: string;
  gradientStops?: GradientStop[];
  gradientDirection?: number;
  imageSrc?: string;
  imagePosition?: 'fill' | 'fit' | 'stretch' | 'center';
  gradientSteps?: number;
};

export type Guide = {
  id: string;
  orientation: 'horizontal' | 'vertical';
  position: number;
};

export type DesignElement = {
  id:string;
  type: 'text' | 'image' | 'shape' | 'group' | 'brush' | 'qrcode' | 'path';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  children?: DesignElement[];
  locked?: boolean;
  visible?: boolean;

  // Generic styles
  backgroundColor?: string;
  boxShadow?: string; // CSS box-shadow string
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  skewX?: number;
  skewY?: number;
  
  // Text specific properties
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string; // For 'text' color, 'shape' solid fill or gradient tint, and 'image' tint.
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  textShadows?: Shadow[];
  letterSpacing?: number; // in px
  lineHeight?: number; // relative to font size
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  textStrokeWidth?: number;
  textStrokeColor?: string;
  textWarp?: TextWarp;
  gradientDirectionMode?: 'angle' | 'horizontal' | 'vertical'; // For SVG text gradients

  // Image specific properties
  src?: string; 
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  filterBrightness?: number; // 0-2
  filterContrast?: number; // 0-2
  filterSaturate?: number; // 0-2
  filterGrayscale?: number; // 0-1
  filterSepia?: number; // 0-1
  filterInvert?: number; // 0-1
  filterHueRotate?: number; // 0-360
  filterBlur?: number; // in px
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  crop?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  removeColor?: string | null;
  colorThreshold?: number;

  // Shape specific properties
  shapeType?: string;
  borderRadius?: number;
  fillType?: 'solid' | 'gradient' | 'none' | 'stepped-gradient' | 'image';
  fillImageSrc?: string;
  fillImageScale?: number;
  fillImageOffsetX?: number;
  fillImageOffsetY?: number;
  gradientStops?: GradientStop[];
  gradientDirection?: number;
  gradientSteps?: number;
  tintOpacity?: number; // For shape gradient tint or image tint, 0-1
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';
  spotUv?: boolean;
  foilId?: number;
  
  // Brush specific properties
  path?: [number, number][];
  strokeColor?: string;
  strokeWidth?: number;
  brushTip?: 'chisel' | 'dry_bristle' | 'rake' | 'charcoal' | 'ink' | 'spray' | 'airbrush' | 'soft_round' | 'hard_round' | 'glow' | 'eraser' | 'square' | 'calligraphy';
  brushSoftness?: number; // 0-1
  brushHardness?: number; // 0-1
  brushFlow?: number;
  brushDensity?: number;
  brushScatter?: number;
  
  // QR Code specific properties
  qrValue?: string;
  qrColor?: string;
  qrBgColor?: string;
  qrLevel?: 'L' | 'M' | 'Q' | 'H';
  qrIconSrc?: string;
  qrIconSize?: number; // as a percentage of QR code size
  qrStylePreset?: 'default' | 'dots' | 'rounded' | 'extra-rounded' | 'classy' | 'classy-rounded' | 'fluid' | 'grid';

  // Path specific properties
  pathPoints?: PathPoint[];
  isPathClosed?: boolean;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  imageId: string;
  width: number; // in pixels for canvas
  height: number; // in pixels for canvas
  type: string; // For AI prompt
};

export type DynamicFile = {
  id: string;
  name: string;
  url: string;
  storagePath: string;
};

export type DynamicFolder = {
  id: string;
  name: string;
  files: DynamicFile[];
};

export type DynamicAssets = {
  folders: DynamicFolder[];
};


export type Design = {
  id: number;
  name: string;
  productSlug: string;
  elements: DesignElement[];
  guides: Guide[];
  createdAt: string;
  quantity: number;
  width: number;
  height: number;
  background: Background;
  assets?: DynamicAssets;
};

export type ViewState = {
  zoom: number;
  pan: {
    x: number;
    y: number;
  };
};

export type Page = {
  elements: DesignElement[];
  background: Background;
};

export type RenderData = {
  pages: Page[];
  product: Product;
  guides: Guide[];
  bleed: number;
  safetyMargin: number;
};

export interface Contest {
  id: string;
  title: string;
  productType: string;
  prizeAmount: number;
  entriesCount: number;
  deadline: string; // ISO string
  tags: string[];
}

export type Address = {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
};

export type Order = {
  id: number;
  userId: string;
  productId: number;
  subProductId: number;
  designId?: number | null;
  designUploadId?: number | null;
  quantity: number;
  unitPrice: string;
  totalAmount: string;
  shippingAddress: Address;
  billingAddress?: Address | null;
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: Date;
};