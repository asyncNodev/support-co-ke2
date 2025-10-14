/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as ai_catalogScanner from "../ai/catalogScanner.js";
import type * as analytics from "../analytics.js";
import type * as approvals from "../approvals.js";
import type * as browseAi_integration from "../browseAi/integration.js";
import type * as categories from "../categories.js";
import type * as createTestUser from "../createTestUser.js";
import type * as groupBuys from "../groupBuys.js";
import type * as notifications from "../notifications.js";
import type * as orders from "../orders.js";
import type * as priceAnalytics from "../priceAnalytics.js";
import type * as products from "../products.js";
import type * as ratings from "../ratings.js";
import type * as rfqs from "../rfqs.js";
import type * as seed from "../seed.js";
import type * as seedPublic from "../seedPublic.js";
import type * as siteSettings from "../siteSettings.js";
import type * as users from "../users.js";
import type * as vendorQuotations from "../vendorQuotations.js";
import type * as whatsapp from "../whatsapp.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "ai/catalogScanner": typeof ai_catalogScanner;
  analytics: typeof analytics;
  approvals: typeof approvals;
  "browseAi/integration": typeof browseAi_integration;
  categories: typeof categories;
  createTestUser: typeof createTestUser;
  groupBuys: typeof groupBuys;
  notifications: typeof notifications;
  orders: typeof orders;
  priceAnalytics: typeof priceAnalytics;
  products: typeof products;
  ratings: typeof ratings;
  rfqs: typeof rfqs;
  seed: typeof seed;
  seedPublic: typeof seedPublic;
  siteSettings: typeof siteSettings;
  users: typeof users;
  vendorQuotations: typeof vendorQuotations;
  whatsapp: typeof whatsapp;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
