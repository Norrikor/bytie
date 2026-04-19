/**
 * Feature flags (env must be NEXT_PUBLIC_* for client components).
 * Set in .env / Docker: NEXT_PUBLIC_FEATURE_SHARED_ENABLED=true
 */
export function isSharedSectionEnabled(): boolean {
  return process.env.NEXT_PUBLIC_FEATURE_SHARED_ENABLED === 'true'
}
