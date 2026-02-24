
import { Product, Post, User, Order, PromoCode, AppConfig, UserRole } from './types';

export const CATEGORIES = ['Steaks', 'Biltong', 'Braai Packs', 'Specials', 'Chicken', 'Pork', 'Lamb', 'Sausage', 'Pantry'];

export const INITIAL_PRODUCTS: Product[] = [];
export const INITIAL_POSTS: Post[] = [];

// Default Admin Account
export const INITIAL_USERS: User[] = [
    {
        id: 'admin',
        username: 'admin',
        name: 'Administrator',
        email: 'admin@example.com',
        phone: '',
        role: UserRole.ADMIN,
        loyaltyPoints: 0,
        password: 'admin',
        permissions: ['orders', 'products', 'content']
    }
];

export const INITIAL_ORDERS: Order[] = [];
export const INITIAL_PROMO_CODES: PromoCode[] = [];

// Placeholder sheet ID or URL
export const CUSTOMER_DATABASE_SHEET = ''; 

export const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin'
};

export const DEFAULT_ADMIN_IMAGE = 'https://ui-avatars.com/api/?name=Admin&background=f4d300&color=000';

export const INITIAL_CONFIG: AppConfig = {
  paymentEnabled: false,
  deliveryFee: 50, // Base/Flat Fee
  deliveryRatePerKm: 10, // R10 per KM default
  deliveryCalculationMethod: 'FIXED',
  deliveryZones: [
    { id: '1', name: 'Local (0-5km)', fee: 20, minDistance: 0, maxDistance: 5 },
    { id: '2', name: 'Mid (5-10km)', fee: 40, minDistance: 5, maxDistance: 10 },
    { id: '3', name: 'Far (10-20km)', fee: 60, minDistance: 10, maxDistance: 20 },
  ],
  minimumOrder: 250,
  collectionInstructions: 'Collection in Westering- Address will be shared on WhatsApp during the ordering process',
  homepageBanners: [
    'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200'
  ],
  heroTitle: "Savour\nThe Cut.",
  heroSubtitle: "Expertly sourced local meats. Freshly cut, perfectly aged or cured and delivered directly to your door in Gqeberha.",
  heroButtonText: "SHOP COLLECTION",
  appDescription: "This app is used to place orders with Meat Depot.",
  promoText: 'DEPOTFRESH: R50 OFF YOUR FIRST ORDER!',
  announcement: '🔥 FREE DELIVERY FOR ORDERS OVER R1500 IN GQEBERHA!',
  logoUrl: 'https://meatdepot.co.za/wp-content/uploads/2026/02/app_logo.webp',
  invoiceLogoUrl: 'https://meatdepot.co.za/wp-content/uploads/2026/02/app_logo.webp',
  startupSoundUrl: 'https://codeskulptor-demos.commondatastorage.googleapis.com/pang/potted_plant.mp3',
  checkoutSoundUrl: 'https://codeskulptor-demos.commondatastorage.googleapis.com/pang/arrow.mp3',
  brandColor: '#f4d300',
  postOrder: ['post1', 'post2'],
  featuredProductOrder: ['1', '5', '2', '3'],
  homeSectionOrder: ['hero', 'categories', 'featured', 'news'],
  menuOrder: ['admin', 'home', 'shop', 'quote', 'orders', 'messages', 'account', 'cart', 'wishlist', 'tutorial'],
  deliveryAreas: ['Gqeberha', 'Westering', 'Walmer', 'Summerstrand', 'Humewood', 'Lorraine', 'Newton Park', 'Mount Pleasant', 'Cotswold', 'Sunridge Park'],
  lastLeaderboardCheck: new Date().toISOString(),
  enableManualLeaderboard: false,
  manualLeaderboard: [],
  enableVacuumPack: false, // Default off
  businessDetails: {
      companyName: "Meat Depot Gqeberha",
      addressLine1: "63 Clarence Road, Westering, 6025",
      addressLine2: "Port Elizabeth, RSA",
      contactNumber: "+27632148131",
      email: "admin@meatdepot.co.za",
      bankingDetails: "Account Name: Gold Business Account\nAccount Number: 63174399212\nBranch Code: 250655\nRef: Order Number",
      bankName: "First National Bank",
      accountName: "Meat Depot Gqeberha",
      accountNumber: "63174399212",
      branchCode: "250655",
      accountType: "Business Account",
      invoiceFooterText: "Thank you for choosing Meat Depot. Gqeberha's finest cuts."
  },
  soldOutBanner: {
    visible: false,
    text: "WE ARE SOLD OUT! NEXT DROP FRIDAY 9AM",
    backgroundColor: "#dc2626",
    textColor: "#ffffff"
  },
  topNotice: {
    visible: true,
    imageUrl: "https://meatdepot.co.za/wp-content/uploads/2026/02/app_notice-1.png"
  },
  startupPopup: {
    isActive: true,
    title: "Heads Up!",
    message: "Meat Depot is not yet trading. This is a preview of our ordering platform. No real orders will be processed."
  },
  googleDrive: {
      accessToken: '', 
      folderId: ''
  },
  googleSheetUrl: '',
  firebaseConfig: {
      apiKey: "",
      authDomain: "",
      projectId: "",
      storageBucket: "",
      messagingSenderId: "",
      appId: "",
      measurementId: ""
  },
  backupMethod: 'FIREBASE',
  customDomain: {
      url: 'https://meatdepot.co.za/wp-json/md-app/v1', // Absolute path to WP Plugin Endpoint
      apiKey: '' // User to set this in App Settings
  },
  appUrl: 'https://meatdepot.co.za/order-app/',
  socialLinks: {
    facebook: 'https://facebook.com/meatdepotgq',
    instagram: 'https://www.instagram.com/meatdepotgq/',
    website: 'https://meatdepot.co.za',
    whatsapp: 'https://wa.me/27632148131',
    email: 'admin@meatdepot.co.za'
  },
  facebookPageId: '630276440175048',
  facebookAppId: '',
  facebookAppSecret: ''
};
