import { ConvexError, v } from "convex/values";

import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

// Get active group buys
export const getActiveGroupBuys = query({
  args: {},
  handler: async (ctx, args) => {
    const groupBuys = await ctx.db.query("groupBuys").collect();

    return await Promise.all(
      groupBuys.map(async (gb) => {
        // Fetch product (ensure price is included in schema)
        const product = gb.productId ? await ctx.db.get(gb.productId) : null;

        // Fetch active participants
        const participants = await ctx.db
          .query("groupBuyParticipants")
          .withIndex("by_groupBuy", (q) => q.eq("groupBuyId", gb._id))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();

        const participantCount = participants.length;
        const currentQuantity = gb.currentQuantity ?? 0;
        const targetQuantity = gb.targetQuantity ?? 1;
        const progress =
          targetQuantity > 0 ? (currentQuantity / targetQuantity) * 100 : 0;

        // Calculate days left
        let daysLeft = 0;
        if (gb.deadline) {
          const deadlineDate = new Date(gb.deadline);
          const now = new Date();
          daysLeft = Math.max(
            0,
            Math.ceil(
              (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            ),
          );
        }

        // Ensure product.price is present (set to 0 if missing)
        const productWithPrice = product
          ? { ...product, price: product.price ?? 0 }
          : null;

        return {
          ...gb,
          product: productWithPrice,
          participants,
          participantCount,
          progress,
          daysLeft,
        };
      }),
    );
  },
});

// Get group buys for a specific product
export const getGroupBuysForProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const groupBuys = await ctx.db
      .query("groupBuys")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .filter((q) => q.eq(q.field("status"), "open"))
      .collect();

    const enrichedGroupBuys = await Promise.all(
      groupBuys.map(async (gb) => {
        const participants = await ctx.db
          .query("groupBuyParticipants")
          .withIndex("by_groupBuy", (q) => q.eq("groupBuyId", gb._id))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();

        const participantCount = participants.length;
        const currentQuantity = participants.reduce(
          (sum, p) => sum + p.quantity,
          0,
        );
        const progress =
          gb.targetQuantity > 0
            ? (currentQuantity / gb.targetQuantity) * 100
            : 0;

        return {
          ...gb,
          participantCount,
          currentQuantity,
          progress,
          daysLeft: Math.max(
            0,
            Math.ceil((gb.deadline - Date.now()) / (1000 * 60 * 60 * 24)),
          ),
        };
      }),
    );

    return enrichedGroupBuys;
  },
});

// Get my group buy participations
export const getMyGroupBuys = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    const participations = await ctx.db
      .query("groupBuyParticipants")
      .withIndex("by_hospital", (q) => q.eq("hospitalId", user._id))
      .collect();

    const enrichedParticipations = await Promise.all(
      participations.map(async (p) => {
        const groupBuy = await ctx.db.get(p.groupBuyId);
        if (!groupBuy) return null;

        const product = await ctx.db.get(groupBuy.productId);
        const allParticipants = await ctx.db
          .query("groupBuyParticipants")
          .withIndex("by_groupBuy", (q) => q.eq("groupBuyId", p.groupBuyId))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();

        const participantCount = allParticipants.length;
        const currentQuantity = allParticipants.reduce(
          (sum, p) => sum + p.quantity,
          0,
        );
        const progress =
          groupBuy.targetQuantity > 0
            ? (currentQuantity / groupBuy.targetQuantity) * 100
            : 0;

        return {
          ...p,
          groupBuy,
          product,
          participantCount,
          currentQuantity,
          progress,
          daysLeft: Math.max(
            0,
            Math.ceil((groupBuy.deadline - Date.now()) / (1000 * 60 * 60 * 24)),
          ),
        };
      }),
    );

    return enrichedParticipations.filter((p) => p !== null);
  },
});

// Create a group buy
export const createGroupBuy = mutation({
  args: {
    productId: v.id("products"),
    title: v.string(),
    description: v.optional(v.string()),
    targetQuantity: v.number(),
    deadline: v.number(),
    minimumParticipants: v.number(),
    initialQuantity: v.number(),
    rfqId: v.optional(v.id("rfqs")),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    if (user.role !== "buyer") {
      throw new ConvexError({
        message: "Only hospitals can create group buys",
        code: "FORBIDDEN",
      });
    }

    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new ConvexError({
        message: "Product not found",
        code: "NOT_FOUND",
      });
    }

    // Create the group buy
    const groupBuyId = await ctx.db.insert("groupBuys", {
      productId: args.productId,
      title: args.title,
      description: args.description,
      targetQuantity: args.targetQuantity,
      currentQuantity: args.initialQuantity,
      status: "open",
      deadline: args.deadline,
      createdBy: user._id,
      minimumParticipants: args.minimumParticipants,
      createdAt: Date.now(),
    });

    // Add creator as first participant
    await ctx.db.insert("groupBuyParticipants", {
      groupBuyId,
      hospitalId: user._id,
      rfqId: args.rfqId,
      quantity: args.initialQuantity,
      joinedAt: Date.now(),
      status: "active",
    });

    return groupBuyId;
  },
});

// Join a group buy
export const joinGroupBuy = mutation({
  args: {
    groupBuyId: v.id("groupBuys"),
    quantity: v.number(),
    rfqId: v.optional(v.id("rfqs")),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    if (user.role !== "buyer") {
      throw new ConvexError({
        message: "Only hospitals can join group buys",
        code: "FORBIDDEN",
      });
    }

    const groupBuy = await ctx.db.get(args.groupBuyId);
    if (!groupBuy) {
      throw new ConvexError({
        message: "Group buy not found",
        code: "NOT_FOUND",
      });
    }

    if (groupBuy.status !== "open") {
      throw new ConvexError({
        message: "This group buy is no longer open",
        code: "BAD_REQUEST",
      });
    }

    if (groupBuy.deadline < Date.now()) {
      throw new ConvexError({
        message: "This group buy has expired",
        code: "BAD_REQUEST",
      });
    }

    // Check if already participating
    const existing = await ctx.db
      .query("groupBuyParticipants")
      .withIndex("by_groupBuy", (q) => q.eq("groupBuyId", args.groupBuyId))
      .filter((q) =>
        q.and(
          q.eq(q.field("hospitalId"), user._id),
          q.eq(q.field("status"), "active"),
        ),
      )
      .first();

    if (existing) {
      throw new ConvexError({
        message: "You are already participating in this group buy",
        code: "CONFLICT",
      });
    }

    // Add participant
    const participantId = await ctx.db.insert("groupBuyParticipants", {
      groupBuyId: args.groupBuyId,
      hospitalId: user._id,
      rfqId: args.rfqId,
      quantity: args.quantity,
      joinedAt: Date.now(),
      status: "active",
    });

    // Update group buy current quantity
    const participants = await ctx.db
      .query("groupBuyParticipants")
      .withIndex("by_groupBuy", (q) => q.eq("groupBuyId", args.groupBuyId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const currentQuantity = participants.reduce(
      (sum, p) => sum + p.quantity,
      0,
    );

    await ctx.db.patch(args.groupBuyId, {
      currentQuantity,
    });

    // Check if target reached and auto-convert to RFQ
    const participantCount = participants.length;
    if (
      currentQuantity >= groupBuy.targetQuantity &&
      participantCount >= groupBuy.minimumParticipants
    ) {
      // Trigger conversion to RFQ
      await ctx.scheduler.runAfter(0, api.groupBuys.checkAndConvertGroupBuy, {
        groupBuyId: args.groupBuyId,
      });
    }

    return participantId;
  },
});

// Withdraw from group buy
export const withdrawFromGroupBuy = mutation({
  args: {
    groupBuyId: v.id("groupBuys"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    const participation = await ctx.db
      .query("groupBuyParticipants")
      .withIndex("by_groupBuy", (q) => q.eq("groupBuyId", args.groupBuyId))
      .filter((q) =>
        q.and(
          q.eq(q.field("hospitalId"), user._id),
          q.eq(q.field("status"), "active"),
        ),
      )
      .first();

    if (!participation) {
      throw new ConvexError({
        message: "You are not participating in this group buy",
        code: "NOT_FOUND",
      });
    }

    // Update participation status
    await ctx.db.patch(participation._id, {
      status: "withdrawn",
    });

    // Update group buy current quantity
    const activeParticipants = await ctx.db
      .query("groupBuyParticipants")
      .withIndex("by_groupBuy", (q) => q.eq("groupBuyId", args.groupBuyId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const currentQuantity = activeParticipants.reduce(
      (sum, p) => sum + p.quantity,
      0,
    );

    await ctx.db.patch(args.groupBuyId, {
      currentQuantity,
    });

    return participation._id;
  },
});

// Get group buy opportunities for vendors
export const getGroupBuyOpportunitiesForVendor = query({
  args: {},
  handler: async (ctx, args) => {
    const groupBuys = await ctx.db.query("groupBuys").collect();

    return await Promise.all(
      groupBuys.map(async (gb) => {
        const product = gb.productId ? await ctx.db.get(gb.productId) : null;

        const participants = await ctx.db
          .query("groupBuyParticipants")
          .withIndex("by_groupBuy", (q) => q.eq("groupBuyId", gb._id))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();

        const participantCount = participants.length;
        const currentQuantity = gb.currentQuantity ?? 0;
        const targetQuantity = gb.targetQuantity ?? 1;
        const progress =
          targetQuantity > 0 ? (currentQuantity / targetQuantity) * 100 : 0;

        let daysLeft = 0;
        if (gb.deadline) {
          const deadlineDate = new Date(gb.deadline);
          const now = new Date();
          daysLeft = Math.max(
            0,
            Math.ceil(
              (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            ),
          );
        }

        const productWithPrice = product
          ? { ...product, price: product.price ?? 0 }
          : null;

        return {
          ...gb,
          product: productWithPrice,
          participants,
          participantCount,
          progress,
          daysLeft,
        };
      }),
    );
  },
});

// Get detailed info about a specific group buy
export const getGroupBuyDetails = query({
  args: { groupBuyId: v.id("groupBuys") },
  handler: async (ctx, args) => {
    const groupBuy = await ctx.db.get(args.groupBuyId);
    if (!groupBuy) return null;

    const product = await ctx.db.get(groupBuy.productId);
    const creator = await ctx.db.get(groupBuy.createdBy);

    const participants = await ctx.db
      .query("groupBuyParticipants")
      .withIndex("by_groupBuy", (q) => q.eq("groupBuyId", args.groupBuyId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const participantDetails = await Promise.all(
      participants.map(async (p) => {
        const hospital = await ctx.db.get(p.hospitalId);
        return {
          ...p,
          hospital: hospital
            ? { name: hospital.companyName || hospital.name }
            : null,
        };
      }),
    );

    const participantCount = participants.length;
    const currentQuantity = participants.reduce(
      (sum, p) => sum + p.quantity,
      0,
    );
    const progress =
      groupBuy.targetQuantity > 0
        ? (currentQuantity / groupBuy.targetQuantity) * 100
        : 0;
    const daysLeft = Math.max(
      0,
      Math.ceil((groupBuy.deadline - Date.now()) / (1000 * 60 * 60 * 24)),
    );

    return {
      ...groupBuy,
      product,
      creator,
      participants: participantDetails,
      participantCount,
      currentQuantity,
      progress,
      daysLeft,
    };
  },
});

// Check if group buy target reached and convert to RFQ
export const checkAndConvertGroupBuy = mutation({
  args: { groupBuyId: v.id("groupBuys") },
  handler: async (ctx, args) => {
    const groupBuy = await ctx.db.get(args.groupBuyId);
    if (!groupBuy) {
      throw new ConvexError({
        message: "Group buy not found",
        code: "NOT_FOUND",
      });
    }

    if (groupBuy.status !== "open") {
      return null;
    }

    const participants = await ctx.db
      .query("groupBuyParticipants")
      .withIndex("by_groupBuy", (q) => q.eq("groupBuyId", args.groupBuyId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const participantCount = participants.length;
    const currentQuantity = participants.reduce(
      (sum, p) => sum + p.quantity,
      0,
    );

    // Check if target reached and minimum participants met
    if (
      currentQuantity >= groupBuy.targetQuantity &&
      participantCount >= groupBuy.minimumParticipants
    ) {
      // Create RFQ for the group buy
      const rfqId = await ctx.db.insert("rfqs", {
        buyerId: groupBuy.createdBy,
        status: "pending",
        createdAt: Date.now(),
      });

      // Add RFQ item for the product
      await ctx.db.insert("rfqItems", {
        rfqId,
        productId: groupBuy.productId,
        quantity: currentQuantity,
      });

      // Update group buy status
      await ctx.db.patch(args.groupBuyId, {
        status: "closed",
      });

      // Update all participants with the RFQ ID
      await Promise.all(
        participants.map(async (p) => {
          await ctx.db.patch(p._id, {
            rfqId,
            status: "completed",
          });
        }),
      );

      // Send notifications to all participants
      const product = await ctx.db.get(groupBuy.productId);
      await Promise.all(
        participants.map(async (p) => {
          await ctx.db.insert("notifications", {
            userId: p.hospitalId,
            type: "quotation_sent",
            title: "Group Buy Target Reached! 🎉",
            message: `The group buy for ${product?.name || "product"} has reached its target. RFQ has been sent to vendors.`,
            read: false,
            relatedId: rfqId,
            createdAt: Date.now(),
          });
        }),
      );

      return rfqId;
    }

    return null;
  },
});

// Get share link for group buy
export const getGroupBuyShareData = query({
  args: { groupBuyId: v.id("groupBuys") },
  handler: async (ctx, args) => {
    const groupBuy = await ctx.db.get(args.groupBuyId);
    if (!groupBuy) return null;

    const product = await ctx.db.get(groupBuy.productId);

    const participants = await ctx.db
      .query("groupBuyParticipants")
      .withIndex("by_groupBuy", (q) => q.eq("groupBuyId", args.groupBuyId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const currentQuantity = participants.reduce(
      (sum, p) => sum + p.quantity,
      0,
    );
    const progress =
      groupBuy.targetQuantity > 0
        ? (currentQuantity / groupBuy.targetQuantity) * 100
        : 0;
    const daysLeft = Math.max(
      0,
      Math.ceil((groupBuy.deadline - Date.now()) / (1000 * 60 * 60 * 24)),
    );

    return {
      title: groupBuy.title,
      productName: product?.name || "Unknown product",
      currentQuantity,
      targetQuantity: groupBuy.targetQuantity,
      progress: Math.round(progress),
      daysLeft,
      participantCount: participants.length,
      expectedSavings: groupBuy.expectedSavings || 15,
    };
  },
});
