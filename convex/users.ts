import { ConvexError, v } from "convex/values";

import type { Id } from "./_generated/dataModel.d.ts";
import { internalQuery, mutation, query } from "./_generated/server";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .first();

    return user;
  },
});

export const updateQuotationPreference = mutation({
  args: {
    preference: v.union(
      v.literal("registered_hospitals_only"),
      v.literal("registered_all"),
      v.literal("all_including_guests"),
    ),
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
      .first();

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    if (user.role !== "vendor") {
      throw new ConvexError({
        message: "Only vendors can set quotation preferences",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.patch(user._id, {
      quotationPreference: args.preference,
    });

    return { success: true };
  },
});

export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    authId: v.string(),
    role: v.union(v.literal("admin"), v.literal("vendor"), v.literal("buyer")),
    companyName: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    categories: v.optional(v.array(v.id("categories"))),
    cr12Certificate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const userId = await ctx.db.insert("users", {
      authId: args.authId,
      email: args.email,
      passwordHash: "", // Password hash should be set during registration ?????
      name: args.name,
      role: args.role,
      verified: false,
      status: args.role === "admin" ? "approved" : "pending",
      companyName: args.companyName,
      phone: args.phone,
      address: args.address,
      latitude: args.latitude,
      longitude: args.longitude,
      categories: args.categories,
      cr12Certificate: args.cr12Certificate,
      registeredAt: Date.now(),
    });

    return userId;
  },
});

export const getUser = query({
  args: { authId: v.string() },
  async handler(ctx, args) {
    return await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", args.authId))
      .unique();
  },
});

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .first();

    if (!currentUser || currentUser.role !== "admin") {
      throw new ConvexError({
        message: "Only admins can view all users",
        code: "FORBIDDEN",
      });
    }

    return await ctx.db.query("users").collect();
  },
});

export const getUserDetails = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const verifyUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .first();

    if (!currentUser || currentUser.role !== "admin") {
      throw new ConvexError({
        message: "Only admins can verify users",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.patch(args.userId, { verified: true });
    return { success: true };
  },
});

export const assignCategoriesToVendor = mutation({
  args: {
    vendorId: v.id("users"),
    categories: v.array(v.id("categories")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .first();

    if (!currentUser || currentUser.role !== "admin") {
      throw new ConvexError({
        message: "Only admins can assign categories",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.patch(args.vendorId, { categories: args.categories });
    return { success: true };
  },
});

export const toggleUserStatus = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .first();

    if (!currentUser || currentUser.role !== "admin") {
      throw new ConvexError({
        message: "Only admins can toggle user status",
        code: "FORBIDDEN",
      });
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    await ctx.db.patch(args.userId, { verified: !user.verified });
    return { success: true };
  },
});

export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .first();

    if (!currentUser || currentUser.role !== "admin") {
      throw new ConvexError({
        message: "Only admins can delete users",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.delete(args.userId);
    return { success: true };
  },
});

export const approveUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Not authenticated",
        code: "UNAUTHENTICATED",
      });
    }

    const admin = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .unique();

    if (!admin || admin.role !== "admin") {
      throw new ConvexError({
        message: "Only admins can approve users",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.patch(args.userId, { status: "approved" });
  },
});

export const rejectUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .first();

    if (!currentUser || currentUser.role !== "admin") {
      throw new ConvexError({
        message: "Only admins can reject users",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.patch(args.userId, { status: "rejected" });
    return { success: true };
  },
});

export const getPendingUsers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Not authenticated",
        code: "UNAUTHENTICATED",
      });
    }

    const admin = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .unique();

    if (!admin || admin.role !== "admin") {
      throw new ConvexError({
        message: "Only admins can view pending users",
        code: "FORBIDDEN",
      });
    }

    const allUsers = await ctx.db.query("users").collect();
    // Filter for users with status === "pending"
    return allUsers.filter((user) => user.status === "pending");
  },
});

// Internal queries for WhatsApp notifications
export const getUserById = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getAdminUsers = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .collect();
  },
});

// Update notification preferences
export const updateNotificationPreferences = mutation({
  args: {
    whatsappNotifications: v.optional(v.boolean()),
    emailNotifications: v.optional(v.boolean()),
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
      .first();

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    const updates: Record<string, boolean> = {};
    if (args.whatsappNotifications !== undefined) {
      updates.whatsappNotifications = args.whatsappNotifications;
    }
    if (args.emailNotifications !== undefined) {
      updates.emailNotifications = args.emailNotifications;
    }

    await ctx.db.patch(user._id, updates);

    return { success: true };
  },
});

export const updateUser = mutation({
  args: {
    role: v.union(v.literal("vendor"), v.literal("buyer")),
    companyName: v.string(),
    phone: v.string(),
    address: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      role: args.role,
      companyName: args.companyName,
      phone: args.phone,
      address: args.address,
      status: "pending", // New users need approval
    });

    return { success: true };
  },
});
