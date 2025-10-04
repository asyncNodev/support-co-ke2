import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

// Get or create user from auth
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

// Create user profile after registration
export const createUser = mutation({
  args: {
    role: v.union(v.literal("admin"), v.literal("vendor"), v.literal("buyer")),
    companyName: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    cr12Certificate: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .first();

    if (existingUser) {
      throw new ConvexError({
        message: "User already exists",
        code: "FORBIDDEN",
      });
    }

    const userId = await ctx.db.insert("users", {
      authId: identity.tokenIdentifier,
      email: identity.email ?? "",
      name: identity.name ?? "User",
      role: args.role,
      verified: args.role === "admin", // Auto-verify admins
      avatar: identity.pictureUrl,
      companyName: args.companyName,
      phone: args.phone,
      address: args.address,
      cr12Certificate: args.cr12Certificate,
      latitude: args.latitude,
      longitude: args.longitude,
      registeredAt: Date.now(),
    });

    return userId;
  },
});

// Update user verification status (admin only)
export const updateUserVerification = mutation({
  args: {
    userId: v.id("users"),
    verified: v.boolean(),
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
        message: "Only admins can verify users",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.patch(args.userId, { verified: args.verified });

    // Send notification to user
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.insert("notifications", {
        userId: args.userId,
        type:
          user.role === "vendor" ? "vendor_approved" : "buyer_approved",
        title: args.verified ? "Account Verified" : "Account Unverified",
        message: args.verified
          ? "Your account has been verified by admin"
          : "Your account verification has been revoked",
        read: false,
        createdAt: Date.now(),
      });
    }

    return null;
  },
});

// Get all users (admin only)
export const getAllUsers = query({
  args: {
    role: v.optional(
      v.union(v.literal("admin"), v.literal("vendor"), v.literal("buyer"))
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
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

    if (args.role !== undefined) {
      const role = args.role;
      return await ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", role))
        .collect();
    }

    return await ctx.db.query("users").collect();
  },
});

// Get users by role (admin only)
export const getUsersByRole = query({
  args: {
    role: v.optional(v.union(v.literal("admin"), v.literal("vendor"), v.literal("buyer"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
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
        message: "Not authorized",
        code: "FORBIDDEN",
      });
    }

    if (args.role !== undefined) {
      const role = args.role;
      return await ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", role))
        .collect();
    }
    
    return await ctx.db.query("users").collect();
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    companyName: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
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

    await ctx.db.patch(user._id, {
      companyName: args.companyName,
      phone: args.phone,
      address: args.address,
    });

    return null;
  },
});

export const verifyUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Not authenticated",
        code: "UNAUTHENTICATED" as const,
      });
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .unique();

    if (!currentUser || currentUser.role !== "admin") {
      throw new ConvexError({
        message: "Only admins can verify users",
        code: "FORBIDDEN" as const,
      });
    }

    await ctx.db.patch(args.userId, {
      verified: true,
    });

    return { success: true };
  },
});

export const makeUserAdmin = mutation({
  args: {},
  handler: async (ctx) => {
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

    if (user) {
      await ctx.db.patch(user._id, {
        role: "admin",
        verified: true,
      });
      return { message: "You are now an admin!" };
    } else {
      const userId = await ctx.db.insert("users", {
        authId: identity.tokenIdentifier,
        email: identity.email ?? "admin@quickquote.com",
        name: identity.name ?? "Admin User",
        role: "admin",
        verified: true,
        registeredAt: Date.now(),
      });
      return { message: "Admin account created successfully!" };
    }
  },
});

export const assignCategoriesToVendor = mutation({
  args: {
    vendorId: v.id("users"),
    categoryIds: v.array(v.id("categories")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not authenticated",
        code: "UNAUTHENTICATED",
      });
    }

    const admin = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new ConvexError({
        message: "Only admins can assign categories",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.patch(args.vendorId, {
      categories: args.categoryIds,
    });

    return { message: "Categories assigned successfully" };
  },
});