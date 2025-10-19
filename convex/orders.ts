import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { ConvexError } from "convex/values";

// Create order when quotation is chosen
export const createOrder = mutation({
  args: {
    rfqId: v.id("rfqs"),
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

    const quotation = await ctx.db.get(args.quotationId);
    if (!quotation) {
      throw new ConvexError({
        message: "Quotation not found",
        code: "NOT_FOUND",
      });
    }

    // Create order
    const orderId = await ctx.db.insert("orders", {
      rfqId: args.rfqId,
      quotationId: args.quotationId,
      buyerId: user._id,
      vendorId: quotation.vendorId,
      productId: quotation.productId,
      quantity: quotation.quantity,
      totalAmount: quotation.price * quotation.quantity,
      status: "ordered",
      orderDate: Date.now(),
      lastUpdated: Date.now(),
    });

    // Send notification to vendor
    await ctx.db.insert("notifications", {
      userId: quotation.vendorId,
      type: "quotation_chosen",
      title: "Your Quotation Was Chosen!",
      message: `Congratulations! Your quotation has been accepted. Order ID: ${orderId}`,
      read: false,
      relatedId: orderId,
      createdAt: Date.now(),
    });

    // Send WhatsApp notification to vendor
    const vendor = await ctx.db.get(quotation.vendorId);
    if (vendor?.whatsappNotifications && vendor.phone) {
      await ctx.scheduler.runAfter(0, internal.whatsapp.sendWhatsAppMessage, {
        to: vendor.phone,
        message: `🎉 Your quotation was chosen! New order created. Please confirm and process the order. Order ID: ${orderId}`,
      });
    }

    return orderId;
  },
});

// Get orders for buyer
export const getMyOrders = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .unique();

    if (!user) return [];

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_buyer", (q) => q.eq("buyerId", user._id))
      .order("desc")
      .collect();

    // Get related data
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const vendor = await ctx.db.get(order.vendorId);
        const product = await ctx.db.get(order.productId);
        return {
          ...order,
          vendorName: vendor?.companyName || vendor?.name,
          productName: product?.name,
        };
      })
    );

    return ordersWithDetails;
  },
});

// Get orders for vendor
export const getVendorOrders = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .unique();

    if (!user) return [];

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_vendor", (q) => q.eq("vendorId", user._id))
      .order("desc")
      .collect();

    // Get related data
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const buyer = await ctx.db.get(order.buyerId);
        const product = await ctx.db.get(order.productId);
        return {
          ...order,
          buyerName: buyer?.companyName || buyer?.name,
          buyerPhone: buyer?.phone,
          buyerEmail: buyer?.email,
          productName: product?.name,
        };
      })
    );

    return ordersWithDetails;
  },
});

// Update order status (vendor)
export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("confirmed"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    trackingNumber: v.optional(v.string()),
    estimatedDeliveryDate: v.optional(v.number()),
    deliveryNotes: v.optional(v.string()),
    cancelReason: v.optional(v.string()),
  },
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

    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new ConvexError({
        message: "Order not found",
        code: "NOT_FOUND",
      });
    }

    // Verify vendor owns this order
    if (order.vendorId !== user._id) {
      throw new ConvexError({
        message: "Not authorized to update this order",
        code: "FORBIDDEN",
      });
    }

    // Update order
    await ctx.db.patch(args.orderId, {
      status: args.status,
      ...(args.trackingNumber && { trackingNumber: args.trackingNumber }),
      ...(args.estimatedDeliveryDate && { estimatedDeliveryDate: args.estimatedDeliveryDate }),
      ...(args.deliveryNotes && { deliveryNotes: args.deliveryNotes }),
      ...(args.cancelReason && { cancelReason: args.cancelReason }),
      ...(args.status === "delivered" && { actualDeliveryDate: Date.now() }),
      lastUpdated: Date.now(),
    });

    // Notify buyer
    const statusMessages: Record<string, string> = {
      confirmed: "Your order has been confirmed by the vendor",
      processing: "Your order is being processed",
      shipped: args.trackingNumber 
        ? `Your order has been shipped. Tracking: ${args.trackingNumber}` 
        : "Your order has been shipped",
      delivered: "Your order has been delivered",
      cancelled: args.cancelReason 
        ? `Your order has been cancelled. Reason: ${args.cancelReason}` 
        : "Your order has been cancelled",
    };

    await ctx.db.insert("notifications", {
      userId: order.buyerId,
      type: "quotation_chosen",
      title: "Order Status Update",
      message: statusMessages[args.status],
      read: false,
      relatedId: args.orderId,
      createdAt: Date.now(),
    });

    // Send WhatsApp notification to buyer
    const buyer = await ctx.db.get(order.buyerId);
    if (buyer?.whatsappNotifications && buyer.phone) {
      await ctx.scheduler.runAfter(0, internal.whatsapp.sendWhatsAppMessage, {
        to: buyer.phone,
        message: `📦 Order Update: ${statusMessages[args.status]}`,
      });
    }

    return { success: true };
  },
});

// Upload proof of delivery
export const uploadProofOfDelivery = mutation({
  args: {
    orderId: v.id("orders"),
    proofOfDelivery: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new ConvexError({
        message: "Order not found",
        code: "NOT_FOUND",
      });
    }

    await ctx.db.patch(args.orderId, {
      proofOfDelivery: args.proofOfDelivery,
      lastUpdated: Date.now(),
    });

    return { success: true };
  },
});

// Confirm delivery (buyer)
export const confirmDelivery = mutation({
  args: {
    orderId: v.id("orders"),
  },
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

    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new ConvexError({
        message: "Order not found",
        code: "NOT_FOUND",
      });
    }

    // Verify buyer owns this order
    if (order.buyerId !== user._id) {
      throw new ConvexError({
        message: "Not authorized to confirm this order",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.patch(args.orderId, {
      status: "delivered",
      actualDeliveryDate: Date.now(),
      lastUpdated: Date.now(),
    });

    // Notify vendor
    await ctx.db.insert("notifications", {
      userId: order.vendorId,
      type: "quotation_chosen",
      title: "Delivery Confirmed",
      message: "The buyer has confirmed delivery of the order",
      read: false,
      relatedId: args.orderId,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Get order statistics
export const getOrderStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .unique();

    if (!user) return null;

    const isVendor = user.role === "vendor";
    const orders = await ctx.db
      .query("orders")
      .withIndex(isVendor ? "by_vendor" : "by_buyer", (q) =>
        q.eq(isVendor ? "vendorId" : "buyerId", user._id)
      )
      .collect();

    const totalOrders = orders.length;
    const totalValue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const inProgress = orders.filter((o) =>
      ["ordered", "confirmed", "processing", "shipped"].includes(o.status)
    ).length;

    return {
      totalOrders,
      totalValue,
      delivered,
      inProgress,
      deliveryRate: totalOrders > 0 ? (delivered / totalOrders) * 100 : 0,
    };
  },
});
