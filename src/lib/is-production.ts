/** Runtime production (Vercel prod ou NODE_ENV=production). */
export function isProductionRuntime(): boolean {
  return (
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production"
  );
}
