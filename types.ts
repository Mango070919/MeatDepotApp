
export enum UserRole {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
  DRIVER = 'DRIVER',
  CASHIER = 'CASHIER'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  RECEIVED = 'RECEIVED',
  PREPARING = 'PREPARING',
  READY_FOR_DELIVERY = 'READY_FOR_DELIVERY',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  MANUAL_SALE = 'MANUAL_SALE',
  QUOTE_REQUEST = 'QUOTE_REQUEST',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAID = 'PAID'
}

export enum UnitType {
  KG = 'kg',
  UNIT = 'unit',
  PACK = 'pack',
  LITER = 'liter'
}

export type AdminPermission = 'orders' | 'products' | 'content';

export interface BusinessDetails {
  companyName: string;
  addressLine1: string;
  addressLine2: string;
  contactNumber: string;
  email: string;
  bankingDetails: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  branchCode?: string;
  accountType?: string;
  invoiceFooterText: string;
}

export interface ProductCheckbox {
  id: string;
  label: string;
  required: boolean;
}

export interface ProductCosting {
  totalCost?: number;
  markupPercent: number;
  rawMeatCost?: number;
  spicesCost?: number;
  packagingCost?: number;
  labelCost?: number;
  overheadPercent?: number;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  timestamp: string;
  visible?: boolean;
  adminReply?: string;
  adminReplyDate?: string;
}

export interface ThicknessOption {
    name: string;
    weight: number; // in grams
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  specialPrice?: number;
  specialExpiryDate?: string;
  unit: UnitType;
  category: string;
  image: string;
  available: boolean;
  featured: boolean;
  stock?: number;
  reviews?: Review[];
  productCheckboxes?: ProductCheckbox[];
  thicknessOptions?: ThicknessOption[];
  costing?: ProductCosting;
  barcode?: string;
  viewCount?: number;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  weight?: number; // in grams if unit is KG
  selectedOptions?: string[];
  vacuumPacked?: boolean;
}

export interface OrderMessage {
  id: string;
  sender: 'CUSTOMER' | 'ADMIN' | 'DRIVER';
  text: string;
  timestamp: string;
  attachmentUrl?: string;
  attachmentName?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: CartItem[];
  total: number;
  discountUsed?: number;
  pointsEarned?: number;
  status: OrderStatus;
  createdAt: string;
  deliveryType: 'DELIVERY' | 'COLLECTION';
  deliveryAddress?: string;
  deliveryCoordinates?: { lat: number; lng: number };
  distanceKm?: number;
  deliveryFee?: number;
  driverId?: string;
  trackingUrl?: string;
  messages: OrderMessage[];
  isManual?: boolean;
  isResolved?: boolean;
  promoCodeApplied?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface User {
  id: string;
  username?: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  loyaltyPoints: number;
  password?: string;
  profilePicture?: string;
  blocked?: boolean;
  securityQuestion?: string;
  securityAnswer?: string;
  birthdate?: string;
  wishlist?: string[];
  lastLogin?: string;
  lastActive?: string;
  lastIp?: string;
  deviceInfo?: string;
  lastLocation?: { lat: number; lng: number };
  permissions?: AdminPermission[];
  forceLogout?: boolean;
}

export interface Post {
  id: string;
  caption: string;
  imageUrl: string;
  timestamp: string;
  visible?: boolean;
}

export interface PromoCode {
  id: string;
  code: string;
  type: 'PERCENTAGE_OFF' | 'FLAT_DISCOUNT' | 'FREE_DELIVERY';
  value: number;
  active: boolean;
  usedBy: string[]; // User IDs
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'ORDER' | 'PROMO' | 'ANNOUNCEMENT' | 'DOCUMENT';
  timestamp: string;
  targetUserId?: string;
  imageUrl?: string;
  actionUrl?: string;
  actionLabel?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: 'LOGIN' | 'ORDER' | 'EDIT' | 'SYNC' | 'PRODUCTION' | 'POS_SALE';
  details: string;
  timestamp: string;
}

export interface RawMaterial {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  averageCost: number;
  lastPurchased?: string;
}

export interface ProductionBatch {
  id: string;
  finalProductId: string;
  finalProductName: string;
  date: string;
  ingredients: {
    rawMaterialId: string;
    rawMaterialName: string;
    quantityUsed: number;
    costAtTime: number;
  }[];
  inputWeight: number;
  outputWeight: number;
  yieldPercent: number;
  costPerUnit: number;
  notes?: string;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  minDistance?: number;
  maxDistance?: number;
}

export interface AppConfig {
  paymentEnabled: boolean; // Toggles the "Request Payment Link" flow
  deliveryFee: number; // Base fee or Flat fee fallback
  deliveryRatePerKm?: number; // Variable rate per kilometer
  deliveryCalculationMethod?: 'FIXED' | 'DISTANCE' | 'ZONES'; // Updated
  deliveryZones?: DeliveryZone[]; // New field
  minimumOrder: number;
  collectionInstructions: string;
  homepageBanners: string[]; // Can be Image URL or YouTube URL
  
  // Hero Section Customization
  heroTitle?: string;
  heroSubtitle?: string;
  heroButtonText?: string;
  
  // Content Customization
  appDescription?: string;
  promoText: string;
  announcement: string;
  
  logoUrl: string;
  invoiceLogoUrl?: string; // Optional separate logo for invoices
  startupSoundUrl?: string;
  checkoutSoundUrl?: string;
  brandColor?: string; // Main accent color (default #f4d300)
  postOrder: string[];
  featuredProductOrder: string[];
  homeSectionOrder: string[]; // 'hero', 'categories', 'featured', 'news'
  menuOrder: string[]; // IDs of menu items in order
  deliveryAreas: string[];
  revenueBaselineDate?: string; // Used for "Resetting" the dashboard view
  lastLeaderboardCheck?: string; // ISO Date string of the last time monthly rewards were checked
  businessDetails?: BusinessDetails; // New field for Invoice/Quote settings
  soldOutBanner: {
    visible: boolean;
    text: string;
    backgroundColor?: string;
    textColor?: string;
  };
  topNotice?: {
    visible: boolean;
    imageUrl: string;
  };
  startupPopup?: {
    isActive: boolean;
    title: string;
    message: string;
  };
  receiptNotice?: {
    isActive: boolean;
    title: string; // e.g. "Did You Know?"
    message: string;
  };
  // Leaderboard Customization
  enableManualLeaderboard?: boolean;
  manualLeaderboard?: string[]; // Array of 3 User IDs [1st, 2nd, 3rd]
  
  // Packaging
  enableVacuumPack?: boolean;

  googleDrive?: {
    accessToken: string;
    folderId: string;
  };
  googleSheetUrl?: string;
  firebaseConfig?: FirebaseConfig;
  geminiApiKey?: string;
  emailConfig?: {
    user: string;
    pass: string;
  };
  adminCredentials?: {
    username: string;
    password?: string;
  };
  backupMethod: 'GOOGLE_DRIVE' | 'CUSTOM_DOMAIN' | 'FIREBASE';
  customDomain: {
    url: string;
    apiKey: string;
  };
  appUrl?: string; // Custom domain for the app link
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    website?: string;
    whatsapp?: string;
    email?: string;
  };
  facebookAccessToken?: string;
  facebookPageId?: string;
  facebookAppId?: string;
  facebookAppSecret?: string;
}
