import { isApiConfigured } from "@/lib/api";
import type { DataProvider } from "./dataProvider";
import { LocalDataProvider } from "./localDataProvider";
import { ApiDataProvider } from "./apiDataProvider";

/**
 * Single data access point used by the whole app.
 * - Mongo API provider: connects to the Express/MongoDB server (/api)
 * - Local provider: offline / local demo storage fallback
 */
export const backend: "api" | "demo" = isApiConfigured ? "api" : "demo";

export const dataService: DataProvider =
  backend === "api" ? new ApiDataProvider() : new LocalDataProvider();

export const isDemoMode = backend === "demo";

export * from "./dataProvider";

