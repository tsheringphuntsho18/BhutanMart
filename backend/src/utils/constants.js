const CACHE_TTL = {
  PRODUCT_DETAIL: 3600, // 1 hour
  PRODUCT_LIST: 1800, // 30 minutes
  TRENDING: 300, // 5 minutes
  SESSION: 86400, // 24 hours
  HOMEPAGE: 300, // 5 minutes
};

const REDIS_KEYS = {
  PRODUCT_DETAIL: "product:",
  TRENDING_PRODUCTS: "trending:products",
  TOP_SELLERS: "leaderboard:sellers",
  TOP_BUYERS: "leaderboard:buyers",
  RECENTLY_VIEWED: "recently_viewed:",
  CART: "cart:",
  SESSION: "session:",
  PAGE_VIEWS: "page_views:",
  RATE_LIMIT: "rate_limit:",
};

const RATE_LIMITS = {
  LOGIN: { max: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 mins
  CHECKOUT: { max: 10, windowMs: 60 * 1000 }, // 10 per minute
  API_GENERAL: { max: 100, windowMs: 60 * 1000 }, // 100 per minute
};

module.exports = {
  CACHE_TTL,
  REDIS_KEYS,
  RATE_LIMITS,
};
