
import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { Product, AppConfig, PromoCode, User, Order, Post, UserRole, OrderStatus } from "../types";
import { CUSTOMER_DATABASE_SHEET } from "../constants";

const getAI = (apiKey?: string) => {
    const key = apiKey || '';
    return new GoogleGenAI({ apiKey: key });
};

const tools: FunctionDeclaration[] = [
  {
    name: "modifyProduct",
    description: "Modifies details of a specific product (price, stock, name, description, category, featured status, image).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        productName: {
          type: Type.STRING,
          description: "The exact or approximate name of the product to update.",
        },
        updates: {
          type: Type.STRING,
          description: "A JSON string containing the fields to update. Example: '{\"price\": 150, \"stock\": 5000, \"featured\": true}'",
        },
      },
      required: ["productName", "updates"],
    },
  },
  {
      name: "updateAppConfiguration",
      description: "Updates the app's internal configuration, design, or layout.",
      parameters: {
          type: Type.OBJECT,
          properties: {
              announcement: { type: Type.STRING, description: "The scrolling text on the top bar." },
              heroBannerUrl: { type: Type.STRING, description: "URL for the main homepage image or YouTube video." },
              brandColor: { type: Type.STRING, description: "Hex code for the main app accent color (e.g. #f4d300)." },
              homeSectionOrder: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Order of sections on home page. Available: 'hero', 'categories', 'featured', 'news'."
              },
              promoText: { type: Type.STRING, description: "Short promo text." },
              soldOutBannerText: { type: Type.STRING, description: "Text for the red sold out banner." },
              isSoldOut: { type: Type.BOOLEAN, description: "Whether the store is marked as sold out." },
              deliveryFee: { type: Type.NUMBER, description: "Standard delivery fee amount." },
              minimumOrder: { type: Type.NUMBER, description: "Minimum order amount." }
          }
      }
  },
  {
      name: "createPromoCode",
      description: "Creates a new discount or promo code.",
      parameters: {
          type: Type.OBJECT,
          properties: {
              code: { type: Type.STRING, description: "The alphanumeric code string (e.g. SALE2025)." },
              type: { type: Type.STRING, enum: ["PERCENTAGE_OFF", "FLAT_DISCOUNT", "FREE_DELIVERY"], description: "The type of discount to apply." },
              value: { type: Type.NUMBER, description: "The numeric value of the discount." }
          },
          required: ["code", "type", "value"]
      }
  },
  {
      name: "manageUser",
      description: "Manage a user account (block, unblock, change role, update points).",
      parameters: {
          type: Type.OBJECT,
          properties: {
              emailOrName: { type: Type.STRING, description: "The email or name of the user to find." },
              updates: { type: Type.STRING, description: "JSON string of updates. E.g. '{\"blocked\": true, \"role\": \"DRIVER\", \"loyaltyPoints\": 100}'" }
          },
          required: ["emailOrName", "updates"]
      }
  },
  {
      name: "manageOrder",
      description: "Update an order status or details.",
      parameters: {
          type: Type.OBJECT,
          properties: {
              orderId: { type: Type.STRING, description: "The Order ID (or part of it)." },
              status: { type: Type.STRING, description: "New Status (e.g. DELIVERED, OUT_FOR_DELIVERY)." },
              notes: { type: Type.STRING, description: "Admin notes to append to order messages." }
          },
          required: ["orderId"]
      }
  },
  {
      name: "createNewsPost",
      description: "Create a new news post for the home feed.",
      parameters: {
          type: Type.OBJECT,
          properties: {
              title: { type: Type.STRING, description: "The heading or title of the post." },
              caption: { type: Type.STRING, description: "The short description or caption of the post." },
              imageUrl: { type: Type.STRING, description: "URL of the image." },
              link: { type: Type.STRING, description: "Optional external link." }
          },
          required: ["title", "caption"]
      }
  }
];

interface AIContext {
    products: Product[];
    updateProduct: (p: Product) => void;
    config: AppConfig;
    updateConfig: (c: AppConfig) => void;
    addPromoCode: (c: PromoCode) => void;
    users: User[];
    updateUser: (u: User) => void;
    orders: Order[];
    updateOrder: (id: string, o: Partial<Order>) => void;
    posts: Post[];
    addPost: (p: Post) => void;
}

export const generateAIAssistance = async (
  prompt: string, 
  ctx: AIContext
) => {
  try {
    const ai = getAI(ctx.config.geminiApiKey);
    const model = 'gemini-2.5-flash';
    
    // Construct context summary
    const productSummary = ctx.products.map(p => ({name: p.name, price: p.price, stock: p.stock, id: p.id})).slice(0, 50); // Limit to avoid token overflow
    const userSummary = ctx.users.map(u => ({name: u.name, email: u.email, role: u.role, id: u.id})).slice(0, 50);
    const orderSummary = ctx.orders.slice(0, 20).map(o => ({id: o.id, customer: o.customerName, total: o.total, status: o.status}));

    const response = await ai.models.generateContent({
        model,
        contents: `You are the Meat Depot 'Code Assistant' and App Admin AI.
        You have ROOT ACCESS to modify the app state directly.
        
        Current State Context:
        - Config: ${JSON.stringify(ctx.config)}
        - Products (Subset): ${JSON.stringify(productSummary)}
        - Users (Subset): ${JSON.stringify(userSummary)}
        - Orders (Recent): ${JSON.stringify(orderSummary)}
        
        User Request: "${prompt}"
        
        Instructions:
        1. If the user wants to change data (products, users, orders, config), USE THE TOOLS provided.
        2. If the user asks for code changes that cannot be done via state (e.g. changing CSS classes, adding new React components), explain that you can only modify Runtime State (Config, Data), but you can configure the app to *look* different via the 'updateAppConfiguration' tool if applicable.
        3. Be concise. Confirm actions with a ✅.
        4. If editing users or orders, find them by fuzzy matching the name/email/ID provided.
        
        External Database: ${CUSTOMER_DATABASE_SHEET}
        `,
        config: {
            tools: [{ functionDeclarations: tools }],
        }
    });

    // Handle Function Calls
    if (response.functionCalls && response.functionCalls.length > 0) {
      for (const fc of response.functionCalls) {
          
          if (fc.name === 'modifyProduct') {
            const { productName, updates } = fc.args as any;
            const productToUpdate = ctx.products.find(p => p.name.toLowerCase().includes(productName.toLowerCase()));
            
            if (productToUpdate) {
              try {
                  const updatesObj = JSON.parse(updates);
                  const updatedProduct = { ...productToUpdate, ...updatesObj };
                  ctx.updateProduct(updatedProduct);
                  return `✅ Product "${productToUpdate.name}" updated.`;
              } catch (e) { return `⚠️ Failed to parse product updates.`; }
            } else { return `⚠️ Product matching "${productName}" not found.`; }
          }
          
          if (fc.name === 'updateAppConfiguration') {
              const args = fc.args as any;
              const newConfig = { ...ctx.config };
              if (args.announcement) newConfig.announcement = args.announcement;
              if (args.heroBannerUrl) newConfig.homepageBanners = [args.heroBannerUrl, ...newConfig.homepageBanners.slice(1)];
              if (args.brandColor) newConfig.brandColor = args.brandColor;
              if (args.homeSectionOrder) newConfig.homeSectionOrder = args.homeSectionOrder;
              if (args.promoText) newConfig.promoText = args.promoText;
              if (args.soldOutBannerText) newConfig.soldOutBanner = { ...newConfig.soldOutBanner, text: args.soldOutBannerText };
              if (args.isSoldOut !== undefined) newConfig.soldOutBanner = { ...newConfig.soldOutBanner, visible: args.isSoldOut };
              if (args.deliveryFee !== undefined) newConfig.deliveryFee = args.deliveryFee;
              if (args.minimumOrder !== undefined) newConfig.minimumOrder = args.minimumOrder;

              ctx.updateConfig(newConfig);
              return `✅ App configuration updated.`;
          }

          if (fc.name === 'createPromoCode') {
              const { code, type, value } = fc.args as any;
              ctx.addPromoCode({
                  id: Math.random().toString(36).substr(2, 9),
                  code: code.toUpperCase(),
                  type,
                  value,
                  active: true,
                  usedBy: []
              });
              return `✅ Promo code "${code.toUpperCase()}" created.`;
          }

          if (fc.name === 'manageUser') {
              const { emailOrName, updates } = fc.args as any;
              const user = ctx.users.find(u => 
                  u.email.toLowerCase().includes(emailOrName.toLowerCase()) || 
                  u.name.toLowerCase().includes(emailOrName.toLowerCase())
              );
              if (user) {
                  try {
                      const updatesObj = JSON.parse(updates);
                      ctx.updateUser({ ...user, ...updatesObj });
                      return `✅ User "${user.name}" updated.`;
                  } catch(e) { return `⚠️ Invalid user update data.`; }
              } else { return `⚠️ User "${emailOrName}" not found.`; }
          }

          if (fc.name === 'manageOrder') {
              const { orderId, status, notes } = fc.args as any;
              const order = ctx.orders.find(o => o.id.includes(orderId));
              if (order) {
                  const updates: Partial<Order> = {};
                  if (status) updates.status = status as OrderStatus;
                  if (notes) {
                      updates.messages = [...order.messages, {
                          id: Math.random().toString(36),
                          sender: 'ADMIN',
                          text: `[AI Note]: ${notes}`,
                          timestamp: new Date().toISOString()
                      }];
                  }
                  ctx.updateOrder(order.id, updates);
                  return `✅ Order #${order.id} updated.`;
              } else { return `⚠️ Order "${orderId}" not found.`; }
          }

          if (fc.name === 'createNewsPost') {
              const { title, caption, imageUrl, link } = fc.args as any;
              ctx.addPost({
                  id: Math.random().toString(36),
                  title: title || 'New Update',
                  caption,
                  imageUrl: imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947',
                  link,
                  timestamp: new Date().toISOString(),
                  visible: true
              });
              return `✅ News post created.`;
          }
      }
    }

    return response.text || "Command executed or no action required.";

  } catch (error) {
    console.error("AI Error:", error);
    return "System Error: Could not process request.";
  }
};

export interface AddressValidationResult {
    address: string;
    isValidLocation: boolean;
    mapLink?: string;
    error?: string;
    distanceKm?: number;
    coordinates?: { lat: number, lng: number };
}

export const validateAddress = async (query: string, allowedAreas: string[], config: AppConfig, latLng?: { lat: number, lng: number }): Promise<AddressValidationResult> => {
    try {
        const ai = getAI(config.geminiApiKey);
        const model = 'gemini-2.5-flash';
        const storeOrigin = "63 Clarence Road, Westering, Gqeberha, South Africa";
        
        const areasString = allowedAreas.join(', ');
        
        let prompt = "";
        
        if (latLng) {
            prompt = `What is the street address at latitude ${latLng.lat}, longitude ${latLng.lng}? Is this location inside any of these areas in South Africa: ${areasString}? Also, calculate the driving distance in kilometers from "${storeOrigin}" to this location.
            Return the output in this strict JSON format: { "address": "full address string", "isValid": boolean, "distanceKm": number, "coordinates": { "lat": number, "lng": number } }`;
        } else {
            prompt = `Search for the address "${query}" in Gqeberha (formerly Port Elizabeth). Is this location inside any of these areas in South Africa: ${areasString}? Also, calculate the driving distance in kilometers from "${storeOrigin}" to this location.
            Return the output in this strict JSON format: { "address": "full address string", "isValid": boolean, "distanceKm": number, "coordinates": { "lat": number, "lng": number } }`;
        }

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                tools: [{ googleMaps: {} }],
                toolConfig: latLng ? {
                    retrievalConfig: {
                        latLng: {
                            latitude: latLng.lat,
                            longitude: latLng.lng
                        }
                    }
                } : undefined
            }
        });

        let jsonText = response.text || '{}';
        
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```/g, '').trim();
        
        const jsonStart = jsonText.indexOf('{');
        const jsonEnd = jsonText.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
            jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
        }

        let parsedData: any = {};
        try {
            parsedData = JSON.parse(jsonText);
        } catch (e) {
            console.error("Failed to parse JSON from AI response", e);
            return {
                address: query,
                isValidLocation: false,
                error: "Could not verify address details. Please try again."
            }
        }
        
        const { address, isValid, distanceKm, coordinates } = parsedData;
        
        let mapLink = '';
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
             for (const chunk of chunks) {
                 const uri = (chunk as any).web?.uri || (chunk as any).maps?.uri; 
                 if (uri) {
                     mapLink = uri;
                     break;
                 }
             }
        }
        
        if (!isValid) {
             return {
                address: address || query,
                isValidLocation: false,
                mapLink,
                coordinates,
                error: "Location appears to be outside our configured delivery zones in Gqeberha."
            };
        }

        return {
            address: address || query,
            isValidLocation: true,
            mapLink,
            distanceKm: distanceKm || 0,
            coordinates
        };

    } catch (error) {
        console.error("Map Search Error:", error);
        return {
            address: '',
            isValidLocation: false,
            error: "Could not verify address. Please enter manually."
        };
    }
};
