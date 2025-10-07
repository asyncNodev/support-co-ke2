import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User management with roles
  users: defineTable({
    authId: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("admin"), v.literal("vendor"), v.literal("buyer")),
    verified: v.boolean(),
    avatar: v.optional(v.string()),
    companyName: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    cr12Certificate: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    categories: v.optional(v.array(v.id("categories"))),
    registeredAt: v.number(),
  })
    .index("by_authId", ["authId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  // Categories (admin only)
  categories: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    createdAt: v.number(),
  }),

  // Products (admin only)
  products: defineTable({
    name: v.string(),
    categoryId: v.id("categories"),
    description: v.string(),
    image: v.optional(v.string()),
    sku: v.optional(v.string()),
    specifications: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_category", ["categoryId"]),

  // Vendor quotations
  vendorQuotations: defineTable({
    vendorId: v.id("users"),
    productId: v.id("products"),
    rfqId: v.optional(v.id("rfqs")),
    quotationType: v.optional(v.union(v.literal("pre-filled"), v.literal("on-demand"))),
    source: v.optional(v.union(v.literal("manual"), v.literal("auto-scraped"))),
    price: v.number(),
    quantity: v.number(),
    paymentTerms: v.union(v.literal("cash"), v.literal("credit")),
    deliveryTime: v.string(),
    warrantyPeriod: v.string(),
    countryOfOrigin: v.optional(v.string()),
    productSpecifications: v.optional(v.string()),
    productPhoto: v.optional(v.string()),
    productDescription: v.optional(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    brand: v.optional(v.string()),
  })
    .index("by_vendor", ["vendorId"])
    .index("by_product", ["productId"])
    .index("by_vendor_and_product", ["vendorId", "productId"])
    .index("by_rfq", ["rfqId"]),

  // RFQ requests from buyers
  rfqs: defineTable({
    buyerId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("quoted"),
      v.literal("completed")
    ),
    isBroker: v.boolean(),
    expectedDeliveryTime: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_buyer", ["buyerId"]),

  // RFQ items
  rfqItems: defineTable({
    rfqId: v.id("rfqs"),
    productId: v.id("products"),
    quantity: v.number(),
  })
    .index("by_rfq", ["rfqId"])
    .index("by_product", ["productId"]),

  // Matched quotations sent to buyers
  sentQuotations: defineTable({
    rfqId: v.id("rfqs"),
    buyerId: v.id("users"),
    vendorId: v.id("users"),
    productId: v.id("products"),
    quotationId: v.id("vendorQuotations"),
    quotationType: v.union(v.literal("pre-filled"), v.literal("on-demand")),
    price: v.number(),
    quantity: v.number(),
    paymentTerms: v.string(),
    deliveryTime: v.string(),
    warrantyPeriod: v.string(),
    countryOfOrigin: v.optional(v.string()),
    productSpecifications: v.optional(v.string()),
    productPhoto: v.optional(v.string()),
    productDescription: v.optional(v.string()),
    opened: v.boolean(),
    chosen: v.boolean(),
    sentAt: v.number(),
    brand: v.optional(v.string()),
  })
    .index("by_rfq", ["rfqId"])
    .index("by_buyer", ["buyerId"])
    .index("by_vendor", ["vendorId"]),

  // Vendor ratings
  ratings: defineTable({
    buyerId: v.id("users"),
    vendorId: v.id("users"),
    rfqId: v.id("rfqs"),
    rating: v.number(),
    review: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_vendor", ["vendorId"])
    .index("by_buyer", ["buyerId"]),

  // Notifications
  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("quotation_sent"),
      v.literal("rfq_received"),
      v.literal("vendor_approved"),
      v.literal("buyer_approved"),
      v.literal("rfq_needs_quotation"),
      v.literal("quotation_chosen")
    ),
    title: v.string(),
    message: v.string(),
    read: v.boolean(),
    relatedId: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Site analytics
  analytics: defineTable({
    type: v.union(
      v.literal("visitor"),
      v.literal("rfq_sent"),
      v.literal("quotation_sent")
    ),
    metadata: v.optional(v.string()),
    timestamp: v.number(),
  }).index("by_type", ["type"]),

  // Web scraping sources (admin configurable)
  scrapingSources: defineTable({
    name: v.string(),
    url: v.string(),
    country: v.string(),
    active: v.boolean(),
    lastScraped: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_active", ["active"]),
});