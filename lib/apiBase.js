// lib/api.js
export const API_BASE =
  process.env.NODE_ENV === 'production' ? process.env.NEXT_PUBLIC_BACKEND : '';