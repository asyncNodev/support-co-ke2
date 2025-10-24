import { ConvexError, v } from "convex/values";

import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";

// Get approval requests for a specific approver
export const getMyApprovalRequests = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    const requests = await ctx.db
      .query("approvalRequests")
      .withIndex("by_approver", (q) => q.eq("approverId", user._id))
      .order("desc")
      .collect();

    // Get RFQ details for each request
    const requestsWithDetails = await Promise.all(
      requests.map(async (request) => {
        const rfq = await ctx.db.get(request.rfqId);
        const requestedBy = await ctx.db.get(request.requestedBy);

        // Get RFQ items
        const items = await ctx.db
          .query("rfqItems")
          .withIndex("by_rfq", (q) => q.eq("rfqId", request.rfqId))
          .collect();

        const itemsWithProducts = await Promise.all(
          items.map(async (item) => {
            const product = await ctx.db.get(item.productId);
            return {
              ...item,
              product,
            };
          }),
        );

        return {
          ...request,
          rfq,
          requestedBy,
          items: itemsWithProducts,
        };
      }),
    );

    return requestsWithDetails;
  },
});

// Get approval history for an RFQ
export const getApprovalHistory = query({
  args: { rfqId: v.id("rfqs") },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query("approvalRequests")
      .withIndex("by_rfq", (q) => q.eq("rfqId", args.rfqId))
      .order("asc")
      .collect();

    const history = await Promise.all(
      requests.map(async (request) => {
        const approver = await ctx.db.get(request.approverId);
        const requestedBy = await ctx.db.get(request.requestedBy);
        return {
          ...request,
          approver,
          requestedBy,
        };
      }),
    );

    return history;
  },
});

// Get approvers in the organization
export const getOrganizationApprovers = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUser = await ctx.db.get(args.userId);

    if (!currentUser?.companyName) {
      return [];
    }

    // Get all users from same organization with approval roles
    const approvers = await ctx.db
      .query("users")
      .filter((q) =>
        q.and(
          q.eq(q.field("companyName"), currentUser.companyName),
          q.neq(q.field("organizationRole"), "none"),
          q.neq(q.field("organizationRole"), undefined),
        ),
      )
      .collect();

    return approvers.sort(
      (a, b) => (a.approvalLevel ?? 0) - (b.approvalLevel ?? 0),
    );
  },
});

// Submit RFQ for approval
export const submitForApproval = mutation({
  args: {
    rfqId: v.id("rfqs"),
    estimatedValue: v.number(),
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

    const rfq = await ctx.db.get(args.rfqId);
    if (!rfq) {
      throw new ConvexError({
        message: "RFQ not found",
        code: "NOT_FOUND",
      });
    }

    // Get approvers
    const approvers = await ctx.db
      .query("users")
      .filter((q) =>
        q.and(
          q.eq(q.field("companyName"), user.companyName),
          q.neq(q.field("organizationRole"), "none"),
          q.neq(q.field("organizationRole"), undefined),
        ),
      )
      .collect();

    const sortedApprovers = approvers.sort(
      (a, b) => (a.approvalLevel ?? 0) - (b.approvalLevel ?? 0),
    );

    // Create approval requests for all approvers
    for (const approver of sortedApprovers) {
      await ctx.db.insert("approvalRequests", {
        rfqId: args.rfqId,
        requestedBy: user._id,
        approverId: approver._id,
        approverLevel: approver.approvalLevel ?? 0,
        status: "pending",
        createdAt: Date.now(),
      });

      // Send notification
      await ctx.db.insert("notifications", {
        userId: approver._id,
        type: "rfq_needs_quotation",
        title: "New Approval Request",
        message: `${user.name} submitted an RFQ for approval (Est. KES ${args.estimatedValue.toLocaleString()})`,
        read: false,
        relatedId: args.rfqId,
        createdAt: Date.now(),
      });

      // Send WhatsApp notification if enabled
      if (approver.whatsappNotifications && approver.phone) {
        await ctx.scheduler.runAfter(0, internal.whatsapp.sendWhatsAppMessage, {
          to: approver.phone,
          message: `🔔 New Approval Request\n\n${user.name} submitted an RFQ for your approval.\nEstimated Value: KES ${args.estimatedValue.toLocaleString()}\n\nPlease review and approve/reject in the platform.`,
        });
      }
    }

    // Update RFQ status
    await ctx.db.patch(args.rfqId, {
      approvalStatus: "pending_approval",
      requiresApproval: true,
      estimatedValue: args.estimatedValue,
      submittedBy: user._id,
      submittedAt: Date.now(),
    });

    return { success: true };
  },
});

// Approve or reject an approval request
export const respondToApprovalRequest = mutation({
  args: {
    requestId: v.id("approvalRequests"),
    decision: v.union(v.literal("approved"), v.literal("rejected")),
    comments: v.optional(v.string()),
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

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new ConvexError({
        message: "Approval request not found",
        code: "NOT_FOUND",
      });
    }

    // Verify the user is the approver
    if (request.approverId !== user._id) {
      throw new ConvexError({
        message: "You are not authorized to respond to this request",
        code: "FORBIDDEN",
      });
    }

    // Update the request
    await ctx.db.patch(args.requestId, {
      status: args.decision,
      comments: args.comments,
      respondedAt: Date.now(),
    });

    const rfq = await ctx.db.get(request.rfqId);
    if (!rfq) {
      throw new ConvexError({
        message: "RFQ not found",
        code: "NOT_FOUND",
      });
    }

    // If rejected, update RFQ status
    if (args.decision === "rejected") {
      await ctx.db.patch(request.rfqId, {
        approvalStatus: "rejected",
      });

      // Notify requester
      const requester = await ctx.db.get(request.requestedBy);
      if (requester) {
        await ctx.db.insert("notifications", {
          userId: request.requestedBy,
          type: "rfq_needs_quotation",
          title: "RFQ Rejected",
          message: `Your RFQ was rejected by ${user.name}. ${args.comments ? `Reason: ${args.comments}` : ""}`,
          read: false,
          relatedId: request.rfqId,
          createdAt: Date.now(),
        });
      }
    } else {
      // Check if all approvals are complete
      const allRequests = await ctx.db
        .query("approvalRequests")
        .withIndex("by_rfq", (q) => q.eq("rfqId", request.rfqId))
        .collect();

      const allApproved = allRequests.every((r) => r.status === "approved");

      if (allApproved) {
        // All approved - update RFQ and send to vendors
        await ctx.db.patch(request.rfqId, {
          approvalStatus: "approved",
          status: "pending",
        });

        // Notify requester
        await ctx.db.insert("notifications", {
          userId: request.requestedBy,
          type: "rfq_needs_quotation",
          title: "RFQ Fully Approved!",
          message:
            "Your RFQ has been approved by all approvers and sent to vendors.",
          read: false,
          relatedId: request.rfqId,
          createdAt: Date.now(),
        });

        // Send to vendors (similar to normal RFQ flow)
        const rfqItems = await ctx.db
          .query("rfqItems")
          .withIndex("by_rfq", (q) => q.eq("rfqId", request.rfqId))
          .collect();

        for (const item of rfqItems) {
          const vendors = await ctx.db
            .query("users")
            .withIndex("by_role", (q) => q.eq("role", "vendor"))
            .filter((q) => q.eq(q.field("verified"), true))
            .collect();

          for (const vendor of vendors) {
            await ctx.db.insert("notifications", {
              userId: vendor._id,
              type: "rfq_received",
              title: "New RFQ Available",
              message: "A new approved RFQ is available for quotation.",
              read: false,
              relatedId: request.rfqId,
              createdAt: Date.now(),
            });
          }
        }
      }
    }

    return { success: true };
  },
});
