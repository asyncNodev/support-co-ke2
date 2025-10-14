import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel.d.ts";
import { internal } from "./_generated/api";

// Submit RFQ as guest (unauthenticated user)
export const submitGuestRFQ = mutation({
  args: {
    items: v.array(
      v.object({
        productId: v.id("products"),
        quantity: v.number(),
      }),
    ),
    expectedDeliveryTime: v.string(),
    guestName: v.string(),
    guestCompanyName: v.string(),
    guestPhone: v.string(),
    guestEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const { items, expectedDeliveryTime, guestName, guestCompanyName, guestPhone, guestEmail } = args;

    // Create the RFQ as a guest submission
    const rfqId = await ctx.db.insert("rfqs", {
      isGuest: true,
      guestName,
      guestCompanyName,
      guestPhone,
      guestEmail,
      status: "pending",
      expectedDeliveryTime,
      createdAt: Date.now(),
    });

    // Insert RFQ items
    for (const item of items) {
      await ctx.db.insert("rfqItems", {
        rfqId,
        productId: item.productId,
        quantity: item.quantity,
      });
    }

    // Send notification to vendors based on their preferences
    const vendors = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "vendor"))
      .filter((q) => q.eq(q.field("verified"), true))
      .collect();

    for (const vendor of vendors) {
      // Check vendor's quotation preference
      const preference = vendor.quotationPreference ?? "all_including_guests";
      
      // Only notify if vendor accepts guest RFQs
      if (preference === "all_including_guests") {
        await ctx.db.insert("notifications", {
          userId: vendor._id,
          type: "rfq_needs_quotation",
          title: "New Guest RFQ",
          message: `${guestName} from ${guestCompanyName} submitted an RFQ`,
          read: false,
          relatedId: rfqId,
          createdAt: Date.now(),
        });
      }
    }

    return rfqId;
  },
});

// Submit RFQ with items from cart
export const submitRFQ = mutation({
  args: {
    items: v.array(
      v.object({
        productId: v.id("products"),
        quantity: v.number(),
      }),
    ),
    expectedDeliveryTime: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    let user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .first();

    // Auto-create buyer if doesn't exist
    if (!user) {
      const userId = await ctx.db.insert("users", {
        authId: identity.tokenIdentifier,
        email: identity.email ?? "unknown@example.com",
        name: identity.name ?? "Unknown User",
        role: "buyer",
        verified: true,
        status: "approved",
        registeredAt: Date.now(),
      });
      user = await ctx.db.get(userId);
      if (!user) {
        throw new ConvexError({
          message: "Failed to create user",
          code: "INTERNAL_ERROR",
        });
      }
    }

    // Allow both buyers and vendors (brokers) to submit RFQs
    if (user.role !== "buyer" && user.role !== "vendor") {
      throw new ConvexError({
        message: "Only buyers and vendors can submit RFQs",
        code: "FORBIDDEN",
      });
    }

    if (!user.verified) {
      throw new ConvexError({
        message: "Your account must be verified to submit RFQs",
        code: "FORBIDDEN",
      });
    }

    // Determine if this is a broker RFQ (from a vendor)
    const isBroker = user.role === "vendor";

    // Create RFQ
    const rfqId = await ctx.db.insert("rfqs", {
      buyerId: user._id,
      status: "pending",
      isBroker,
      expectedDeliveryTime: args.expectedDeliveryTime,
      createdAt: Date.now(),
    });

    // Add RFQ items
    for (const item of args.items) {
      await ctx.db.insert("rfqItems", {
        rfqId,
        productId: item.productId,
        quantity: item.quantity,
      });
    }

    // Auto-match with pre-filled vendor quotations and notify vendors without quotations
    let matchedCount = 0;
    const vendorNotifications = new Map<Id<"users">, Array<{ productId: Id<"products">; productName: string }>>();

    // Process each item in the RFQ
    for (const item of args.items) {
      const product = await ctx.db.get(item.productId);
      if (!product) continue;

      // Find pre-filled quotations for this product
      const quotations = await ctx.db
        .query("vendorQuotations")
        .withIndex("by_product", (q) => q.eq("productId", item.productId))
        .filter((q) => q.eq(q.field("active"), true))
        .collect();

      // Send pre-filled quotations to buyer
      for (const quotation of quotations) {
        const vendor = await ctx.db.get(quotation.vendorId);
        if (!vendor || !vendor.verified) continue;

        matchedCount++;

        // Create sent quotation
        await ctx.db.insert("sentQuotations", {
          rfqId,
          buyerId: user._id,
          vendorId: vendor._id,
          productId: item.productId,
          quotationId: quotation._id,
          quotationType: "pre-filled" as const,
          price: quotation.price,
          quantity: quotation.quantity,
          paymentTerms: quotation.paymentTerms,
          deliveryTime: quotation.deliveryTime,
          warrantyPeriod: quotation.warrantyPeriod,
          countryOfOrigin: quotation.countryOfOrigin,
          productSpecifications: quotation.productSpecifications,
          productPhoto: quotation.productPhoto,
          productDescription: quotation.productDescription,
          opened: false,
          chosen: false,
          sentAt: Date.now(),
        });

        // Notify vendor that their quotation was sent
        await ctx.db.insert("notifications", {
          userId: vendor._id,
          type: "quotation_sent",
          title: "Your quotation was sent!",
          message: `Your pre-filled quotation for ${product.name} was sent to a buyer`,
          read: false,
          relatedId: rfqId,
          createdAt: Date.now(),
        });
      }

      // Find vendors assigned to this category who don't have quotations
      const allVerifiedVendors = await ctx.db
        .query("users")
        .withIndex("by_role", (q) => {
          const role = "vendor" as const;
          return q.eq("role", role);
        })
        .filter((q) => q.eq(q.field("verified"), true))
        .collect();

      for (const vendor of allVerifiedVendors) {
        const hasQuotation = quotations.some((q) => q.vendorId === vendor._id);
        const isAssignedToCategory = product.categoryId && vendor.categories?.includes(product.categoryId);

        if (!hasQuotation && isAssignedToCategory) {
          // Track this product for this vendor
          if (!vendorNotifications.has(vendor._id)) {
            vendorNotifications.set(vendor._id, []);
          }
          vendorNotifications.get(vendor._id)!.push({
            productId: item.productId,
            productName: product.name,
          });
        }
      }
    }

    // Send notifications to vendors with product names
    for (const [vendorId, products] of vendorNotifications.entries()) {
      for (const product of products) {
        await ctx.db.insert("notifications", {
          userId: vendorId,
          type: "rfq_needs_quotation",
          title: `New RFQ for ${product.productName}`,
          message: `A buyer has requested quotations for ${product.productName}. Click to respond with your quotation.`,
          read: false,
          relatedId: rfqId,
          createdAt: Date.now(),
        });
      }
    }

    // Update RFQ status
    if (matchedCount > 0) {
      await ctx.db.patch(rfqId, { status: "quoted" });
    }

    // Track analytics
    await ctx.db.insert("analytics", {
      type: "rfq_sent",
      metadata: JSON.stringify({ rfqId, itemCount: args.items.length }),
      timestamp: Date.now(),
    });

    return {
      rfqId,
      matchedCount,
      vendorsNotified: vendorNotifications.size,
    };
  },
});

// Get buyer's RFQs
export const getMyRFQs = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .first();

    if (!user || (user.role !== "buyer" && user.role !== "vendor")) {
      return [];
    }

    const rfqs = await ctx.db
      .query("rfqs")
      .withIndex("by_buyer", (q) => q.eq("buyerId", user._id))
      .order("desc")
      .collect();

    return await Promise.all(
      rfqs.map(async (rfq) => {
        const items = await ctx.db
          .query("rfqItems")
          .withIndex("by_rfq", (q) => q.eq("rfqId", rfq._id))
          .collect();

        const itemsWithProducts = await Promise.all(
          items.map(async (item) => {
            const product = await ctx.db.get(item.productId);
            return { ...item, product };
          })
        );

        const quotations = await ctx.db
          .query("sentQuotations")
          .withIndex("by_rfq", (q) => q.eq("rfqId", rfq._id))
          .collect();

        return {
          ...rfq,
          items: itemsWithProducts,
          quotationCount: quotations.length,
        };
      })
    );
  },
});

// Get RFQ details with quotations
export const getRFQDetails = query({
  args: { rfqId: v.id("rfqs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    const rfq = await ctx.db.get(args.rfqId);
    if (!rfq) {
      throw new ConvexError({
        message: "RFQ not found",
        code: "NOT_FOUND",
      });
    }

    // Check if user is the buyer/broker who created the RFQ
    if (rfq.buyerId !== user._id) {
      throw new ConvexError({
        message: "Unauthorized to view this RFQ",
        code: "FORBIDDEN",
      });
    }

    // Get RFQ items with product details
    const items = await ctx.db
      .query("rfqItems")
      .withIndex("by_rfq", (q) => q.eq("rfqId", args.rfqId))
      .collect();

    const itemsWithProducts = await Promise.all(
      items.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        return { ...item, product };
      })
    );

    // Get all quotations for this RFQ
    const quotations = await ctx.db
      .query("sentQuotations")
      .withIndex("by_rfq", (q) => q.eq("rfqId", args.rfqId))
      .collect();

    // Add vendor details and rating
    const quotationsWithDetails = await Promise.all(
      quotations.map(async (quot) => {
        const vendor = await ctx.db.get(quot.vendorId);
        const product = await ctx.db.get(quot.productId);

        // Get vendor rating
        const ratings = await ctx.db
          .query("ratings")
          .withIndex("by_vendor", (q) => q.eq("vendorId", quot.vendorId))
          .collect();

        const avgRating =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : null;

        return {
          ...quot,
          vendor: vendor ? {
            _id: vendor._id,
            name: vendor.name,
            companyName: vendor.companyName,
            email: quot.chosen ? vendor.email : undefined,
            phone: quot.chosen ? vendor.phone : undefined,
          } : null,
          product,
          vendorRating: avgRating,
        };
      })
    );

    return {
      _id: rfq._id,
      status: rfq.status,
      createdAt: rfq.createdAt,
      expectedDeliveryTime: rfq.expectedDeliveryTime,
      items: itemsWithProducts,
      quotations: quotationsWithDetails,
    };
  },
});

// Mark quotation as opened
export const markQuotationOpened = mutation({
  args: {
    quotationId: v.id("sentQuotations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const quotation = await ctx.db.get(args.quotationId);
    if (!quotation) {
      throw new ConvexError({
        message: "Quotation not found",
        code: "NOT_FOUND",
      });
    }

    await ctx.db.patch(args.quotationId, { opened: true });

    return null;
  },
});

// Get buyer's quotations they received
export const getMyQuotationsReceived = query({
  args: {},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    // Get all quotations sent to this buyer
    const sentQuotations = await ctx.db
      .query("sentQuotations")
      .withIndex("by_buyer", (q) => q.eq("buyerId", user._id))
      .order("desc")
      .collect();

    // Enrich with product and vendor details
    const enrichedQuotations = await Promise.all(
      sentQuotations.map(async (quotation) => {
        const product = await ctx.db.get(quotation.productId);
        const vendor = await ctx.db.get(quotation.vendorId);

        return {
          ...quotation,
          product,
          vendor: quotation.chosen && vendor
            ? {
                _id: vendor._id,
                name: vendor.name,
                companyName: vendor.companyName,
                email: vendor.email,
                phone: vendor.phone,
              }
            : vendor
            ? { _id: vendor._id, name: vendor.name }
            : null,
        };
      })
    );

    return enrichedQuotations;
  },
});

// Get vendor's sent quotations
export const getMyQuotationsSent = query({
  args: {},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    // This query is used by BUYERS to get quotations they received
    const sentQuotations = await ctx.db
      .query("sentQuotations")
      .withIndex("by_buyer", (q) => q.eq("buyerId", user._id))
      .order("desc")
      .collect();

    return await Promise.all(
      sentQuotations.map(async (quotation) => {
        const product = await ctx.db.get(quotation.productId);
        const vendor = await ctx.db.get(quotation.vendorId);

        return {
          ...quotation,
          product,
          vendor: quotation.chosen && vendor
            ? {
                _id: vendor._id,
                name: vendor.name,
                companyName: vendor.companyName,
                email: vendor.email,
                phone: vendor.phone,
              }
            : vendor
            ? { _id: vendor._id, name: vendor.name }
            : null,
        };
      })
    );
  },
});

// New query specifically for vendors to see their sent quotations
export const getMyVendorQuotationsSent = query({
  args: {},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    // Get all quotations sent by this vendor
    const sentQuotations = await ctx.db
      .query("sentQuotations")
      .withIndex("by_vendor", (q) => q.eq("vendorId", user._id))
      .order("desc")
      .collect();

    // Enrich with product and buyer details
    const enrichedQuotations = await Promise.all(
      sentQuotations.map(async (quot) => {
        const product = await ctx.db.get(quot.productId);
        const buyer = await ctx.db.get(quot.buyerId);
        const rfq = await ctx.db.get(quot.rfqId);

        // Check if buyer is actually a broker (vendor)
        const isBroker = rfq?.isBroker === true;
        const buyerType = isBroker ? "Broker" : "Buyer";

        return {
          _id: quot._id,
          productName: product?.name,
          buyerType,
          buyerName: quot.chosen && buyer ? buyer.name : (isBroker ? "Anonymous Broker" : "Anonymous Buyer"),
          buyerEmail: quot.chosen && buyer ? buyer.email : undefined,
          buyerPhone: quot.chosen && buyer ? buyer.phone : undefined,
          price: quot.price,
          deliveryTime: quot.deliveryTime,
          sentAt: quot.sentAt,
          chosen: quot.chosen,
          opened: quot.opened,
        };
      })
    );

    return enrichedQuotations;
  },
});

// Get pending RFQs with anonymous buyer info (for vendors)
export const getPendingRFQs = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .unique();

    if (!user || user.role !== "vendor") {
      return [];
    }

    // Find notifications for RFQs that need quotations
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("type"), "rfq_needs_quotation"))
      .collect();

    const pendingRFQs = [];
    for (const notif of notifications) {
      if (notif.relatedId) {
        const rfqId = notif.relatedId as Id<"rfqs">;
        const rfq = await ctx.db.get(rfqId);
        if (!rfq) continue;

        // Skip RFQs submitted by this vendor (don't show their own broker RFQs)
        if (rfq.buyerId === user._id) {
          continue;
        }

        const items = await ctx.db
          .query("rfqItems")
          .withIndex("by_rfq", (q) => q.eq("rfqId", rfqId))
          .collect();

        const itemsWithProducts = [];
        for (const item of items) {
          const product = await ctx.db.get(item.productId);
          if (!product) continue;

          // Check if vendor already submitted quotation
          const existingQuotation = await ctx.db
            .query("vendorQuotations")
            .withIndex("by_vendor_and_product", (q) =>
              q.eq("vendorId", user._id).eq("productId", item.productId),
            )
            .filter((q) => q.eq(q.field("rfqId"), rfqId))
            .first();

          if (!existingQuotation) {
            itemsWithProducts.push({
              productId: item.productId,
              productName: product.name,
              quantity: item.quantity,
              specifications: product.specifications,
            });
          }
        }

        if (itemsWithProducts.length > 0) {
          pendingRFQs.push({
            rfqId,
            createdAt: rfq.createdAt,
            buyerInfo: rfq.isBroker === true ? "Anonymous Broker" : "Anonymous Buyer",
            buyerType: rfq.isBroker === true ? "Broker" : "Buyer",
            items: itemsWithProducts,
          });
        }
      }
    }

    return pendingRFQs;
  },
});

// Choose quotation
export const chooseQuotation = mutation({
  args: { sentQuotationId: v.id("sentQuotations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not authenticated",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .first();

    if (!user || (user.role !== "buyer" && user.role !== "vendor")) {
      throw new ConvexError({
        message: "Only buyers and vendors can choose quotations",
        code: "FORBIDDEN",
      });
    }

    const quotation = await ctx.db.get(args.sentQuotationId);
    if (!quotation) {
      throw new ConvexError({
        message: "Quotation not found",
        code: "NOT_FOUND",
      });
    }

    if (quotation.buyerId !== user._id) {
      throw new ConvexError({
        message: "Not your quotation",
        code: "FORBIDDEN",
      });
    }

    // Get product name for notification
    const product = await ctx.db.get(quotation.productId);

    // Mark quotation as chosen
    await ctx.db.patch(args.sentQuotationId, { chosen: true });

    // Update RFQ status to completed
    await ctx.db.patch(quotation.rfqId, { status: "completed" });

    // Notify vendor
    await ctx.db.insert("notifications", {
      userId: quotation.vendorId,
      type: "quotation_chosen",
      title: "Your Quotation Was Chosen!",
      message: `${user.role === "buyer" ? "Buyer" : "Broker"} ${user.name} has selected your quotation. Contact information: ${user.email}${user.phone ? `, ${user.phone}` : ""}`,
      read: false,
      relatedId: args.sentQuotationId,
      createdAt: Date.now(),
    });

    // Send WhatsApp notification to vendor
    await ctx.scheduler.runAfter(0, internal.whatsapp.notifyVendorQuotationChosen, {
      vendorId: quotation.vendorId,
      productName: product?.name ?? "Product",
      buyerName: user.name,
      buyerPhone: user.phone ?? "Not provided",
      buyerEmail: user.email,
    });

    return { success: true };
  },
});

export const declineQuotation = mutation({
  args: {
    sentQuotationId: v.id("sentQuotations"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not authenticated",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .first();

    if (!user || (user.role !== "buyer" && user.role !== "vendor")) {
      throw new ConvexError({
        message: "Only buyers and vendors can decline quotations",
        code: "FORBIDDEN",
      });
    }

    const quotation = await ctx.db.get(args.sentQuotationId);
    if (!quotation) {
      throw new ConvexError({
        message: "Quotation not found",
        code: "NOT_FOUND",
      });
    }

    if (quotation.buyerId !== user._id) {
      throw new ConvexError({
        message: "Not your quotation",
        code: "FORBIDDEN",
      });
    }

    // Delete the quotation
    await ctx.db.delete(args.sentQuotationId);

    // Notify vendor with reason
    await ctx.db.insert("notifications", {
      userId: quotation.vendorId,
      type: "quotation_chosen",
      title: "Quotation Declined",
      message: `${user.role === "buyer" ? "Buyer" : "Broker"} declined your quotation. Reason: ${args.reason}`,
      read: false,
      relatedId: quotation.rfqId,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Get all RFQs for admin (with full details)
export const getAllRFQsForAdmin = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const admin = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new ConvexError({
        message: "Admin access required",
        code: "FORBIDDEN",
      });
    }

    const rfqs = await ctx.db.query("rfqs").order("desc").collect();

    return await Promise.all(
      rfqs.map(async (rfq) => {
        let buyer = null;
        let buyerInfo = null;

        if (rfq.buyerId) {
          buyer = await ctx.db.get(rfq.buyerId);
          buyerInfo = {
            name: buyer?.name || "Unknown",
            email: buyer?.email || "Unknown",
            companyName: buyer?.companyName || "N/A",
            phone: buyer?.phone || "N/A",
          };
        } else if (rfq.isGuest) {
          buyerInfo = {
            name: rfq.guestName || "Guest",
            email: rfq.guestEmail || "N/A",
            companyName: rfq.guestCompanyName || "N/A",
            phone: rfq.guestPhone || "N/A",
          };
        }

        const items = await ctx.db
          .query("rfqItems")
          .withIndex("by_rfq", (q) => q.eq("rfqId", rfq._id))
          .collect();

        const itemsWithProduct = await Promise.all(
          items.map(async (item) => {
            const product = await ctx.db.get(item.productId);
            return {
              ...item,
              product: product || null,
            };
          })
        );

        // Get sent quotations for this RFQ
        const sentQuotations = await ctx.db
          .query("sentQuotations")
          .withIndex("by_rfq", (q) => q.eq("rfqId", rfq._id))
          .collect();

        // Enrich sent quotations with vendor and product info
        const quotationsWithDetails = await Promise.all(
          sentQuotations.map(async (quote) => {
            const vendor = await ctx.db.get(quote.vendorId);
            const product = await ctx.db.get(quote.productId);
            
            // Get vendor rating
            const vendorRatings = await ctx.db
              .query("ratings")
              .withIndex("by_vendor", (q) => q.eq("vendorId", quote.vendorId))
              .collect();
            
            const avgRating = vendorRatings.length > 0
              ? vendorRatings.reduce((sum, r) => sum + r.rating, 0) / vendorRatings.length
              : 0;

            return {
              ...quote,
              vendor: vendor ? {
                name: vendor.name,
                email: vendor.email,
                companyName: vendor.companyName || "N/A",
                phone: vendor.phone || "N/A",
                averageRating: avgRating,
                totalRatings: vendorRatings.length,
              } : null,
              product: product ? {
                name: product.name,
                image: product.image,
              } : null,
            };
          })
        );

        return {
          ...rfq,
          buyer: buyerInfo,
          items: itemsWithProduct,
          sentQuotations: quotationsWithDetails,
          quotationCount: quotationsWithDetails.length,
        };
      })
    );
  },
});