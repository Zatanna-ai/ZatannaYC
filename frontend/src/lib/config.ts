/**
 * Configuration constants for ZatannaYC
 *
 * Update YC_CASE_SESSION_ID when the case session changes
 * For local development: Use http://localhost:3001
 * For production: Use https://sgapi.zatanna.ai (or deploy backend to Railway/Fly.io)
 */
export const YC_CASE_SESSION_ID = '396f85a7-3e58-4076-9f87-32ddd9f24ee8'
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://sgapi.zatanna.ai'

