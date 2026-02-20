
import { Product, Post, User, Order, PromoCode, AppConfig, UserRole } from './types';

export const CATEGORIES = ['Steaks', 'Biltong', 'Braai Packs', 'Specials', 'Chicken', 'Pork', 'Lamb', 'Sausage', 'Pantry'];

export const INITIAL_PRODUCTS: Product[] = [];
export const INITIAL_POSTS: Post[] = [];

// Default Admin Account
export const INITIAL_USERS: User[] = [
    {
        id: 'admin',
        username: 'MeatAdmin98',
        name: 'MeatAdmin98',
        email: 'admin@meatdepot.co.za',
        phone: '0844012488',
        role: UserRole.ADMIN,
        loyaltyPoints: 0,
        password: 'Mango070919-',
        permissions: ['orders', 'products', 'content']
    }
];

export const INITIAL_ORDERS: Order[] = [];
export const INITIAL_PROMO_CODES: PromoCode[] = [];

// Placeholder sheet ID or URL
export const CUSTOMER_DATABASE_SHEET = '1fWqLTRfqRJObWB59d2vdWl--LAfm7m-8'; 

export const ADMIN_CREDENTIALS = {
    username: 'MeatAdmin98',
    password: 'Mango070919-'
};

export const DEFAULT_ADMIN_IMAGE = 'https://ui-avatars.com/api/?name=Admin&background=f4d300&color=000';

export const INITIAL_CONFIG: AppConfig = {
  paymentEnabled: false,
  deliveryFee: 50, // Base/Flat Fee
  deliveryRatePerKm: 10, // R10 per KM default
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
  invoiceLogoUrl: '', // Default empty (falls back to logoUrl)
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
      contactNumber: "844012488038318",
      email: "admin@meatdepot.co.za",
      bankingDetails: "Account Name: Gold Business Account\nAccount Number: 63174399212\nBranch Code: 250655\nRef: Order Number",
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
      folderId: '1fWqLTRfqRJObWB59d2vdWl--LAfm7m-8'
  },
  googleSheetUrl: '',
  firebaseConfig: {
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: ''
  },
  backupMethod: 'CUSTOM_DOMAIN',
  customDomain: {
      url: 'https://meatdepot.co.za/wp-json/md-app/v1', // Absolute path to WP Plugin Endpoint
      apiKey: '' // User to set this in App Settings
  },
  appUrl: 'https://meatdepot.co.za/order-app/',
  socialLinks: {
    facebook: 'https://facebook.com/meatdepotgq',
    instagram: 'https://www.instagram.com/meatdepotgq/',
    website: 'https://meatdepot.co.za',
    whatsapp: 'https://wa.me/844012488038318',
    email: 'admin@meatdepot.co.za'
  }
};
