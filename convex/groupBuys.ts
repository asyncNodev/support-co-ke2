import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";
import type { Id } from "./_generated/dataModel";

// Get active group buys
export const getActiveGroupBuys = query({
  args: {},
  handler: async (ctx) => {
    const groupBuys = await ctx.db
      .query("groupBuys")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();

    const enrichedGroupBuys = await Promise.all(
      groupBuys.map(async (gb) => {
        const product = await ctx.db.get(gb.productId);
        const creator = await ctx.db.get(gb.createdBy);
        const participants = await ctx.db
          .query("groupBuyParticipants")
          .withIndex("by_groupBuy", (q) => q.eq("groupBuyId", gb._id))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();

        const participantCount = participants.length;
        const currentQuantity = participants.reduce((sum, p) => sum + p.quantity, 0);
        const progress = gb.targetQuantity > 0 ? (currentQuantity / gb.targetQuantity) * 100 : 0;

        return {
          ...gb,
          product,
          creator,
          participantCount,
          currentQuantity,
          progress,
          daysLeft: Math.max(0, Math.ceil((gb.deadline - Date.now()) / (1000 * 60 * 60 * 24))),
        };
      })
    );

    return enrichedGroupBuys;
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
        const currentQuantity = participants.reduce((sum, p) => sum + p.quantity, 0);
        const progress = gb.targetQuantity > 0 ? (currentQuantity / gb.targetQuantity) * 100 : 0;

        return {
          ...gb,
          participantCount,
          currentQuantity,
          progress,
          daysLeft: Math.max(0, Math.ceil((gb.deadline - Date.now()) / (1000 * 60 * 60 * 24))),
        };
      })
    );

    return enrichedGroupBuys;
  },
});

// Get my group buy participations
export const getMyGroupBuys = query({
  args: {},
  handler: async (ctx) => {
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
        const currentQuantity = allParticipants.reduce((sum, p) => sum + p.quantity, 0);
        const progress = groupBuy.targetQuantity > 0 ? (currentQuantity / groupBuy.targetQuantity) * 100 : 0;

        return {
          ...p,
          groupBuy,
          product,
          participantCount,
          currentQuantity,
          progress,
          daysLeft: Math.max(0, Math.ceil((groupBuy.deadline - Date.now()) / (1000 * 60 * 60 * 24))),
        };
      })
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
          q.eq(q.field("status"), "active")
        )
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

    const currentQuantity = participants.reduce((sum, p) => sum + p.quantity, 0);

    await ctx.db.patch(args.groupBuyId, {
      currentQuantity,
    });

    return participantId;
  },
});

// Withdraw from group buy
export const withdrawFromGroupBuy = mutation({
  args: {
    groupBuyId: v.id("groupBuys"),
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

    const participation = await ctx.db
      .query("groupBuyParticipants")
      .withIndex("by_groupBuy", (q) => q.eq("groupBuyId", args.groupBuyId))
      .filter((q) => 
        q.and(
          q.eq(q.field("hospitalId"), user._id),
          q.eq(q.field("status"), "active")
        )
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

    const currentQuantity = activeParticipants.reduce((sum, p) => sum + p.quantity, 0);

    await ctx.db.patch(args.groupBuyId, {
      currentQuantity,
    });

    return participation._id;
  },
});
