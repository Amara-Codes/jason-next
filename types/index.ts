export type StrapiImageFormatDetail = {
  name: string;
  hash: string;
  ext: string;
  mime: string;
  path: string | null;
  width: number;
  height: number;
  size: number;
  url: string;
};

/**
 * Rappresenta l'oggetto `formats` che contiene tutte le dimensioni disponibili per un'immagine.
 * Le dimensioni diverse dalla thumbnail sono opzionali, poiché Strapi potrebbe non crearle per immagini molto piccole.
 */
export type StrapiImageFormats = {
  thumbnail: StrapiImageFormatDetail;
  small?: StrapiImageFormatDetail;
  medium?: StrapiImageFormatDetail;
  large?: StrapiImageFormatDetail;
  // Puoi aggiungere altri formati custom se li hai configurati in Strapi
  [key: string]: StrapiImageFormatDetail | undefined;
};

/**
 * Rappresenta gli attributi principali di un file media in Strapi.
 */
export type StrapiImage = {
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number;
  height: number;
  formats: StrapiImageFormats;
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: string | null;
  provider: string;
  provider_metadata: unknown; // Il tipo può variare a seconda del provider (es. Cloudinary)
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  documentId: string;
  id: string;
  name: string;
  slug: string;
};

export type Color = {
  documentId: string;
  name: string;
  image: StrapiImage;
};

export type Gender = {
  id: string;
  documentId: string;
  name: string;
};

export type Material = {
  documentId: string;
  name: string;
};

export type Size = {
  documentId: string;
  name: string;
};

export type Role = {
  documentId: string;
  id: number;
  name: string;
  description: string;
  type: string;
};

export type ProductVariant = {
  documentId: string;
  id: number;
  name: string;
  price: number;
  quantity: number;
  minimum_quantity: number;
  jah_quantity: number;
  noik_quantity: number;
  color: Color;
  material: Material;
  size: Size;
};

export type Product = {
  documentId: string;
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  minimum_quantity: number;
  genders: Gender[];
  categories: Category[];
  product_variants: ProductVariant[];
};

export type OrderItem = {
  documentId: string;
  id: number;
  productDocId: string;
  quantity: number;
  productPrice: number;
  orderItemPrice: number;
  categoryDocId: string;
  materialDocId: string;
  colorDocId: string;
  sizeDocId: string;
  genderDocId: string;
};

export type Order = {
  documentId: string;
  id: number;
  orderStatus: string;
  totalAmount: number;
  subtotalBeforeTaxes: number;
  taxAmount: number;
  discountAmount: number;
  paymentMethod: string;
  operatorName: string;
  customerEmail: string;
  notes?: string; // Il testo può essere opzionale
};

// Nota: Il campo 'password' è omesso di proposito perché non viene mai esposto dalle API
export type User = {
  documentId: string;
  id: number;
  username: string;
  email: string;
  provider?: string;
  confirmed: boolean;
  blocked: boolean;
  role: Role;
  createdAt: string;
  updatedAt: string;
};

export type CartItem = {
  documentId: string;
  productDocId: string;
  productName: string;
  hasVariant: boolean;
  variantDocId?: string;
  variantName?: string;
  productPrice: number;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  selectedMaterial?: string;
  categoryDocumentId?: string;
  sizeDocumentId?: string;
  colorDocumentId?: string;
  materialDocumentId?: string;
  genderDocumentId: string;
};
