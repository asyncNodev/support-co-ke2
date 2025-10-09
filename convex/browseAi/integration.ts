"use node";

import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";

/**
 * Browse.ai Integration
 * 
 * This integration allows scraping product data and vendor quotations
 * from various sources using browse.ai robots.
 */

interface BrowseAIRobotResult {
  capturedLists?: Record<string, Array<Record<string, string>>>;
  capturedTexts?: Record<string, string>;
}

interface BrowseAITaskResponse {
  result: {
    robotTasks?: {
      items: Array<{
        id: string;
        status: string;
        finishedAt?: string;
        capturedLists?: Record<string, Array<Record<string, string>>>;
        capturedTexts?: Record<string, string>;
      }>;
    };
    // Single task response structure
    id?: string;
    status?: string;
    finishedAt?: string;
    capturedLists?: Record<string, Array<Record<string, string>>>;
    capturedTexts?: Record<string, string>;
  };
}

/**
 * Fetch data from a browse.ai robot task
 */
async function fetchBrowseAITask(
  apiKey: string,
  robotId: string,
  taskId: string
): Promise<BrowseAIRobotResult> {
  const response = await fetch(
    `https://api.browse.ai/v2/robots/${robotId}/tasks/${taskId}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Browse.ai API authentication failed. Please verify your API key is correct.");
    }
    if (response.status === 403) {
      throw new Error("Access forbidden. You may not have permission to access this robot or task. Verify the robot ID and task ID are correct and belong to your browse.ai account.");
    }
    throw new Error(
      `Browse.ai API error: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as BrowseAITaskResponse;
  
  // Handle both response structures
  let task;
  if (data.result.robotTasks?.items) {
    task = data.result.robotTasks.items[0];
  } else if (data.result.id) {
    // Direct task response
    task = {
      id: data.result.id,
      status: data.result.status,
      finishedAt: data.result.finishedAt,
      capturedLists: data.result.capturedLists,
      capturedTexts: data.result.capturedTexts,
    };
  }

  if (!task) {
    throw new Error("Task not found in response");
  }

  if (task.status !== "successful") {
    throw new Error(`Task status: ${task.status}`);
  }

  return {
    capturedLists: task.capturedLists,
    capturedTexts: task.capturedTexts,
  };
}

/**
 * Public action: Sync products from browse.ai robot task
 */
export const syncProducts = action({
  args: {
    robotId: v.string(),
    taskId: v.string(),
    categoryId: v.id("categories"),
    listName: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    syncedCount: number;
    productIds: Id<"products">[];
    availableLists?: string[];
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.runQuery(api.users.getCurrentUser, {});
    if (!user || user.role !== "admin") {
      throw new ConvexError({
        message: "Only admins can sync products",
        code: "FORBIDDEN",
      });
    }

    const apiKey = process.env.BROWSE_AI_API_KEY;
    if (!apiKey) {
      throw new ConvexError({
        message: "Browse.ai API key not configured. Please add BROWSE_AI_API_KEY to App Settings → Environment Variables.",
        code: "NOT_IMPLEMENTED",
      });
    }

    try {
      const result = await fetchBrowseAITask(apiKey, args.robotId, args.taskId);

      // Get the list name (default to "products")
      const listName = args.listName || "products";
      const availableLists = result.capturedLists ? Object.keys(result.capturedLists) : [];
      
      // Log available lists for debugging
      console.log("Available captured lists:", availableLists);
      console.log("Looking for list:", listName);

      const productsList = result.capturedLists?.[listName] || [];
      
      if (productsList.length === 0) {
        throw new ConvexError({
          message: `No items found in list "${listName}". Available lists: ${availableLists.join(", ") || "none"}`,
          code: "BAD_REQUEST",
        });
      }

      const syncedProducts = [];
      for (const item of productsList) {
        const productId: Id<"products"> = await ctx.runMutation(api.products.createProduct, {
          name: item.name || "Unknown Product",
          categoryId: args.categoryId,
          description: item.description || "",
          image: item.image,
          sku: item.sku,
          specifications: item.specifications,
        });
        syncedProducts.push(productId);
      }

      return {
        success: true,
        syncedCount: syncedProducts.length,
        productIds: syncedProducts,
        availableLists,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to sync products from browse.ai";
      
      // Provide more helpful error messages for common issues
      if (errorMessage.includes("401")) {
        throw new ConvexError({
          message: "Browse.ai API authentication failed. Please verify your BROWSE_AI_API_KEY in App Settings → Environment Variables is correct.",
          code: "EXTERNAL_SERVICE_ERROR",
        });
      }
      
      if (error instanceof ConvexError) {
        throw error;
      }
      
      throw new ConvexError({
        message: errorMessage,
        code: "EXTERNAL_SERVICE_ERROR",
      });
    }
  },
});

/**
 * Public action: Sync vendor quotations from browse.ai robot task
 */
export const syncVendorQuotations = action({
  args: {
    robotId: v.string(),
    taskId: v.string(),
    vendorId: v.id("users"),
    productId: v.id("products"),
    listName: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    syncedCount: number;
    quotationIds: Id<"vendorQuotations">[];
    availableLists?: string[];
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.runQuery(api.users.getCurrentUser, {});
    if (!user || (user.role !== "admin" && user.role !== "vendor")) {
      throw new ConvexError({
        message: "Only admins and vendors can sync quotations",
        code: "FORBIDDEN",
      });
    }

    const apiKey = process.env.BROWSE_AI_API_KEY;
    if (!apiKey) {
      throw new ConvexError({
        message: "Browse.ai API key not configured. Please add BROWSE_AI_API_KEY to App Settings → Environment Variables.",
        code: "NOT_IMPLEMENTED",
      });
    }

    try {
      const result = await fetchBrowseAITask(apiKey, args.robotId, args.taskId);

      // Get the list name (default to "quotations")
      const listName = args.listName || "quotations";
      const availableLists = result.capturedLists ? Object.keys(result.capturedLists) : [];
      
      // Log available lists for debugging
      console.log("Available captured lists:", availableLists);
      console.log("Looking for list:", listName);

      const quotationsList = result.capturedLists?.[listName] || [];
      
      if (quotationsList.length === 0) {
        throw new ConvexError({
          message: `No items found in list "${listName}". Available lists: ${availableLists.join(", ") || "none"}`,
          code: "BAD_REQUEST",
        });
      }

      const syncedQuotations = [];
      for (const item of quotationsList) {
        const price = parseFloat(item.price || "0");
        const quantity = parseInt(item.quantity || "1", 10);

        if (price > 0) {
          const quotationId: Id<"vendorQuotations"> = await ctx.runMutation(
            api.vendorQuotations.createQuotationInternal,
            {
              vendorId: args.vendorId,
              productId: args.productId,
              quotationType: "pre-filled",
              source: "auto-scraped",
              price,
              quantity,
              paymentTerms: item.paymentTerms === "credit" ? "credit" : "cash",
              deliveryTime: item.deliveryTime || "TBD",
              warrantyPeriod: item.warrantyPeriod || "No warranty",
              countryOfOrigin: item.countryOfOrigin,
              productSpecifications: item.specifications,
              productPhoto: item.photo,
              productDescription: item.description,
              brand: item.brand,
            }
          );
          syncedQuotations.push(quotationId);
        }
      }

      return {
        success: true,
        syncedCount: syncedQuotations.length,
        quotationIds: syncedQuotations,
        availableLists,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to sync quotations from browse.ai";
      
      if (errorMessage.includes("401")) {
        throw new ConvexError({
          message: "Browse.ai API authentication failed. Please verify your BROWSE_AI_API_KEY in App Settings → Environment Variables is correct.",
          code: "EXTERNAL_SERVICE_ERROR",
        });
      }
      
      if (error instanceof ConvexError) {
        throw error;
      }
      
      throw new ConvexError({
        message: errorMessage,
        code: "EXTERNAL_SERVICE_ERROR",
      });
    }
  },
});

/**
 * Public action: Trigger a browse.ai robot to run
 */
export const triggerRobot = action({
  args: {
    robotId: v.string(),
    inputParameters: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.runQuery(api.users.getCurrentUser, {});
    if (!user || user.role !== "admin") {
      throw new ConvexError({
        message: "Only admins can trigger robots",
        code: "FORBIDDEN",
      });
    }

    const apiKey = process.env.BROWSE_AI_API_KEY;
    if (!apiKey) {
      throw new ConvexError({
        message: "Browse.ai API key not configured. Please add BROWSE_AI_API_KEY to App Settings → Environment Variables.",
        code: "NOT_IMPLEMENTED",
      });
    }

    try {
      const response = await fetch(
        `https://api.browse.ai/v2/robots/${args.robotId}/tasks`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputParameters: args.inputParameters || {},
          }),
        }
      );

      if (!response.ok) {
        const statusText = response.statusText;
        if (response.status === 401) {
          throw new ConvexError({
            message: "Browse.ai API authentication failed. Please verify your BROWSE_AI_API_KEY in App Settings → Environment Variables is correct.",
            code: "EXTERNAL_SERVICE_ERROR",
          });
        }
        if (response.status === 403) {
          throw new ConvexError({
            message: "Access forbidden. This could mean: 1) You don't own this robot, 2) Your browse.ai plan doesn't allow API access, or 3) You've hit rate limits. Please verify the robot ID and your browse.ai plan.",
            code: "EXTERNAL_SERVICE_ERROR",
          });
        }
        throw new Error(
          `Browse.ai API error: ${response.status} ${statusText}`
        );
      }

      const data = (await response.json()) as { result: { id: string } };

      return {
        success: true,
        taskId: data.result.id,
        message: "Robot task started successfully",
      };
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        message:
          error instanceof Error
            ? error.message
            : "Failed to trigger browse.ai robot",
        code: "EXTERNAL_SERVICE_ERROR",
      });
    }
  },
});

/**
 * Public action: Get status of a browse.ai robot task
 */
export const getTaskStatus = action({
  args: {
    robotId: v.string(),
    taskId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const apiKey = process.env.BROWSE_AI_API_KEY;
    if (!apiKey) {
      throw new ConvexError({
        message: "Browse.ai API key not configured. Please add BROWSE_AI_API_KEY to App Settings → Environment Variables.",
        code: "NOT_IMPLEMENTED",
      });
    }

    try {
      const response = await fetch(
        `https://api.browse.ai/v2/robots/${args.robotId}/tasks/${args.taskId}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      if (!response.ok) {
        const statusText = response.statusText;
        if (response.status === 401) {
          throw new ConvexError({
            message: "Browse.ai API authentication failed. Please verify your BROWSE_AI_API_KEY in App Settings → Environment Variables is correct.",
            code: "EXTERNAL_SERVICE_ERROR",
          });
        }
        if (response.status === 403) {
          throw new ConvexError({
            message: "Access forbidden. You may not have permission to access this robot or task. Verify the robot ID and task ID are correct and belong to your browse.ai account.",
            code: "EXTERNAL_SERVICE_ERROR",
          });
        }
        throw new Error(
          `Browse.ai API error: ${response.status} ${statusText}`
        );
      }

      const data = (await response.json()) as BrowseAITaskResponse;
      const task = data.result.robotTasks?.items?.[0] || {
        id: data.result.id,
        status: data.result.status,
        finishedAt: data.result.finishedAt,
        capturedLists: data.result.capturedLists,
        capturedTexts: data.result.capturedTexts,
      };

      if (!task || !task.id) {
        throw new Error("Task not found in response");
      }

      return {
        taskId: task.id,
        status: task.status || "unknown",
        finishedAt: task.finishedAt,
      };
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        message:
          error instanceof Error
            ? error.message
            : "Failed to get task status from browse.ai",
        code: "EXTERNAL_SERVICE_ERROR",
      });
    }
  },
});