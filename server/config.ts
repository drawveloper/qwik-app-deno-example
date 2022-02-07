export const isServer = () => "Deno" in globalThis;

export const isBrowser = () => !isServer();

export const isDevelopment = () =>
  isServer() && Deno.env.get("APP_ENV") === "development";

export const isTest = () => isServer() && Deno.env.get("APP_ENV") === "test";

export const isProduction = () =>
  isServer() && Deno.env.get("APP_ENV") === "production";
