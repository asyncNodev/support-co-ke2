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
    status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))),
    // Referral system fields
    referralCode: v.optional(v.string()),
    referredBy: v.optional(v.string()),
    totalReferrals: v.optional(v.number()),
    successfulReferrals: v.optional(v.number()),
    totalRewardsEarned: v.optional(v.number()),
    availableRewardBalance: v.optional(v.number()),
    // New verification fields
    verificationLevel: v.optional(v.union(
      v.literal("none"),          // Not verified
      v.literal("email"),          // Email verified only
      v.literal("business"),       // Business documents verified
      v.literal("full")            // Full verification including background check
    )),
    verifiedAt: v.optional(v.number()),
    verifiedBy: v.optional(v.id("users")),
    businessLicense: v.optional(v.string()),
    taxId: v.optional(v.string()),
    physicalAddress: v.optional(v.string()),
    phoneVerified: v.optional(v.boolean()),
    // Trust score fields
    trustScore: v.optional(v.number()), // 0-100
    responseRate: v.optional(v.number()), // 0-100 percentage
    averageResponseTime: v.optional(v.number()), // in hours
    deliveryRate: v.optional(v.number()), // 0-100 percentage
    cancellationRate: v.optional(v.number()), // 0-100 percentage
    disputeCount: v.optional(v.number()),
    successfulDeals: v.optional(v.number()),
    avatar: v.optional(v.string()),
    companyName: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    cr12Certificate: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    categories: v.optional(v.array(v.id("categories"))),
    registeredAt: v.number(),
    quotationPreference: v.optional(v.union(
      v.literal("registered_hospitals_only"),
      v.literal("registered_all"),
      v.literal("all_including_guests")
    )),
    whatsappNotifications: v.optional(v.boolean()),
    emailNotifications: v.optional(v.boolean()),
    // Approval workflow settings
    organizationRole: v.optional(v.union(
      v.literal("procurement_officer"),
      v.literal("department_head"),
      v.literal("finance_director"),
      v.literal("ceo"),
      v.literal("none")
    )),
    approvalLevel: v.optional(v.number()),
    canApproveUpTo: v.optional(v.number()),
  })
    .index("by_authId", ["authId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  // Orders (created when quotation is chosen)
  orders: defineTable({
    rfqId: v.id("rfqs"),
    quotationId: v.id("sentQuotations"),
    buyerId: v.id("users"),
    vendorId: v.id("users"),
    productId: v.id("products"),
    quantity: v.number(),
    totalAmount: v.number(),
    status: v.union(
      v.literal("ordered"),
      v.literal("confirmed"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    trackingNumber: v.optional(v.string()),
    estimatedDeliveryDate: v.optional(v.number()),
    actualDeliveryDate: v.optional(v.number()),
    proofOfDelivery: v.optional(v.string()),
    deliveryNotes: v.optional(v.string()),
    cancelReason: v.optional(v.string()),
    orderDate: v.number(),
    lastUpdated: v.number(),
  })
    .index("by_rfq", ["rfqId"])
    .index("by_buyer", ["buyerId"])
    .index("by_vendor", ["vendorId"])
    .index("by_status", ["status"]),

  // Group buying opportunities
  groupBuys: defineTable({
    productId: v.id("products"),
    title: v.string(),
    description: v.optional(v.string()),
    targetQuantity: v.number(),
    currentQuantity: v.number(),
    status: v.union(
      v.literal("open"),
      v.literal("closed"),
      v.literal("completed")
    ),
    deadline: v.number(),
    createdBy: v.id("users"),
    minimumParticipants: v.number(),
    expectedSavings: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_product", ["productId"])
    .index("by_status", ["status"])
    .index("by_deadline", ["deadline"]),

  // Group buy participants
  groupBuyParticipants: defineTable({
    groupBuyId: v.id("groupBuys"),
    hospitalId: v.id("users"),
    rfqId: v.optional(v.id("rfqs")),
    quantity: v.number(),
    joinedAt: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("withdrawn"),
      v.literal("completed")
    ),
  })
    .index("by_groupBuy", ["groupBuyId"])
    .index("by_hospital", ["hospitalId"])
    .index("by_rfq", ["rfqId"]),

  // Categories (admin only)
  categories: defineTable({
    name: v.string(),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_slug", ["slug"]),

  // Products (admin only)
  products: defineTable({
    name: v.string(),
    slug: v.optional(v.string()),
    categoryId: v.id("categories"),
    description: v.string(),
    image: v.optional(v.string()),
    sku: v.optional(v.string()),
    specifications: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_category", ["categoryId"]).index("by_name", ["name"]).index("by_slug", ["slug"]),

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
    buyerId: v.optional(v.id("users")),
    isGuest: v.optional(v.boolean()),
    guestName: v.optional(v.string()),
    guestCompanyName: v.optional(v.string()),
    guestPhone: v.optional(v.string()),
    guestEmail: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("quoted"),
      v.literal("completed")
    ),
    isBroker: v.optional(v.boolean()),
    expectedDeliveryTime: v.optional(v.string()),
    createdAt: v.number(),
    // Approval workflow
    approvalStatus: v.optional(v.union(
      v.literal("draft"),
      v.literal("pending_approval"),
      v.literal("approved"),
      v.literal("rejected")
    )),
    requiresApproval: v.optional(v.boolean()),
    estimatedValue: v.optional(v.number()),
    submittedBy: v.optional(v.id("users")),
    submittedAt: v.optional(v.number()),
  }).index("by_buyer", ["buyerId"]),

  // Approval requests
  approvalRequests: defineTable({
    rfqId: v.id("rfqs"),
    requestedBy: v.id("users"),
    approverId: v.id("users"),
    approverLevel: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    comments: v.optional(v.string()),
    createdAt: v.number(),
    respondedAt: v.optional(v.number()),
  })
    .index("by_rfq", ["rfqId"])
    .index("by_approver", ["approverId"])
    .index("by_status", ["status"]),

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
    deliveryRating: v.optional(v.number()),
    communicationRating: v.optional(v.number()),
    qualityRating: v.optional(v.number()),
    wouldRecommend: v.optional(v.boolean()),
    orderValue: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_vendor", ["vendorId"])
    .index("by_buyer", ["buyerId"])
    .index("by_rfq", ["rfqId"]),

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

  // Site settings (configurable by admin)
  siteSettings: defineTable({
    key: v.string(),
    value: v.string(),
    updatedAt: v.optional(v.number()),
  }).index("by_key", ["key"]),

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