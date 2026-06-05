# BhutanMart — Technical Report

**Title:** Designing a Production-Ready E-Commerce Backend with MongoDB and Redis  
**Module:** DBS302 — NoSQL Database Systems  
**Student Name:** Tshering Phuntsho  
**Roll Number:** 02230310  
**Course:** Bachelor of Engineering in Software Engineering  
**Date:** June 2026  

---

## Abstract

BhutanMart is a production-ready e-commerce platform built to demonstrate thoughtful polyglot persistence. MongoDB serves as the primary document store for durable, structured data (users, products, orders, reviews, inventory, sellers, categories), while Redis acts as the in-memory layer for high-throughput, low-latency operations including product caching, session management, shopping cart persistence, real-time trending leaderboards, unique visitor counting, and rate limiting. The platform exposes a REST API (Node.js / Express) consumed by a React frontend and implements all eight non-functional requirements covering performance, scalability, high availability, consistency, durability, security, observability, and data integrity. This report documents every architectural decision with justification: schema design (embedding vs. referencing), index strategy, aggregation pipelines, ACID transactions, Redis data structure selection, cache-aside strategy, stampede prevention, eviction policy, and persistence configuration.

---

## 1. System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                                  │
│              React 19 + Vite + React Router v6  (port 5173)              │
│   Pages: Home · Products · ProductDetails · Cart · Orders · Dashboards   │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │  HTTP / REST (Axios)
                             │  JWT Bearer Token
┌────────────────────────────▼─────────────────────────────────────────────┐
│                   BACKEND API — Node.js / Express 5                       │
│                                                                           │
│  Middleware stack:                                                        │
│  ┌──────────┐ ┌────────┐ ┌──────────────┐ ┌──────────┐ ┌─────────────┐ │
│  │  Helmet  │ │  CORS  │ │    Morgan    │ │   Auth   │ │ RateLimiter │ │
│  │ (headers)│ │       │ │ (HTTP logs)  │ │  (JWT)   │ │  (Redis)    │ │
│  └──────────┘ └────────┘ └──────────────┘ └──────────┘ └─────────────┘ │
│                                                                           │
│  Route modules:                                                           │
│  /api/auth  /api/products  /api/cart  /api/orders  /api/analytics        │
│  /api/users  /api/sellers  /api/reviews  /api/admin  /api/upload         │
└──────────────┬──────────────────────────────────────┬────────────────────┘
               │  Mongoose ODM                        │  node-redis v4
               │  writeConcern: majority              │
               │  readPreference: primaryPreferred     │
┌──────────────▼───────────────┐      ┌───────────────▼──────────────────┐
│   MONGODB ATLAS               │      │   REDIS 6 (localhost:6379)       │
│   Cluster: fujo8cy.mongodb   │      │                                  │
│   Replica Set: 3 nodes       │      │  Data Structures in use:         │
│   (1 primary + 2 secondaries)│      │                                  │
│                               │      │  String  → product cache,        │
│   Collections (7):           │      │            session, rate counter  │
│   ├── users                  │      │  Hash    → cart, session data     │
│   ├── products               │      │  List    → recently viewed        │
│   ├── orders                 │      │  SortedSet→ trending, leaderboards│
│   ├── categories             │      │  HyperLogLog→ unique page views   │
│   ├── reviews                │      │                                  │
│   ├── inventory              │      │  Persistence: RDB + AOF (hybrid) │
│   └── sellers                │      │  Eviction: allkeys-lru / 256 MB  │
│                               │      │  HA: Sentinel (documented)       │
└───────────────────────────────┘      └──────────────────────────────────┘
```

**Cache-Aside Data Flow:**

```
Request → Check Redis (product:{id})
           ├── HIT  → return immediately  [~0.2 ms]
           └── MISS → query MongoDB [~15–25 ms]
                       → SETEX product:{id} jittered TTL
                       → PFADD page_views:{id}
                       → ZINCRBY trending:products
                       → LPUSH recent:{userId}
                       → return response
```

---

## 2. Technology Selection Justification

### Why MongoDB?

| Requirement | MongoDB Fit |
|---|---|
| Diverse, evolving product attributes | Schema-flexible documents; `attributes: Mixed` stores category-specific fields (`RAM`, `fabric`) without schema migrations |
| Strong consistency for orders | Multi-document ACID transactions with `readConcern: majority` and `writeConcern: majority` |
| Full-text search | Native `$text` index across `name`, `description`, and `tags` |
| Aggregation analytics | `$group`, `$lookup`, `$unwind`, `$match` pipeline stages power 7 analytical queries |
| High availability | MongoDB Atlas managed 3-node replica set with automatic failover |
| Sub-category support | `parentCategory` self-reference in the Category collection |

MongoDB's document model maps naturally to e-commerce: products embed variants (always fetched together), orders embed items as a price snapshot (preserves the price the customer actually paid), and users embed addresses (bounded, no external identity).

### Why Redis?

| Requirement | Redis Fit |
|---|---|
| Hot read paths | O(1) key lookup — `GET product:{id}` in ~0.2 ms vs ~15–25 ms MongoDB query |
| Session management | `SETEX session:{userId}` — automatic TTL expiry, no background cleanup |
| Real-time leaderboards | Sorted Set with atomic `ZINCRBY` — top-N in O(log N) with `ZRANGE REV` |
| Unique visitor counting | HyperLogLog — constant 12 KB memory per key regardless of cardinality |
| Rate limiting | Atomic `INCR` + `EXPIRE` — no race conditions, per-endpoint counters |
| Cart persistence | Hash per user — field-level `HSET`/`HDEL` avoids full serialisation |
| Recently viewed | List with `LPUSH`+`LTRIM` — O(1) head insertion, bounded to last 10 |

### Why This Combination (CAP Theorem)

MongoDB is **CP** (Consistency + Partition Tolerance): with `writeConcern: majority`, a write is acknowledged only after the primary and at least one secondary persist it. With `readConcern: majority` inside transactions, reads never return uncommitted data. Redis is **AP** (Availability + Partition Tolerance): the cache may serve data up to its TTL window stale, which is acceptable for product listings. This hybrid delivers strong consistency where it matters (order placement, stock decrement) and maximum performance where eventual consistency is tolerable (product catalogue, homepage).

---

## 3. Data Modeling

### 3.1 MongoDB Collections — Schema Diagrams

#### 3.1.1 users
```json
{
  "_id":             ObjectId,
  "name":            String  (required),
  "email":           String  (unique index, lowercase),
  "password":        String  (bcrypt hash — never plaintext),
  "role":            "customer | seller | admin",
  "avatar":          String  (URL to uploaded image),
  "paymentPreference": "COD | Card | Online",
  "addresses": [                     // EMBEDDED — bounded, always accessed with user
    {
      "_id":       ObjectId,
      "label":     "Home | Office | Other",
      "street":    String,
      "city":      String,
      "state":     String,
      "country":   String,
      "postalCode": String
    }
  ],
  "wishlist": [ ObjectId → products ] // REFERENCE — unbounded, products are independent
}
```

**Embed vs Reference:** Addresses are embedded — they have no identity outside the user, are always fetched with the user, and are bounded in size. Wishlist items reference Product documents by `ObjectId` — products are independent entities that can be updated or deleted without affecting the user document.

#### 3.1.2 products
```json
{
  "_id":        ObjectId,
  "name":       String  (text-indexed),
  "description": String (text-indexed),
  "categoryId": ObjectId → categories, // REFERENCE — shared lookup
  "sellerId":   ObjectId → sellers,    // REFERENCE — independent entity
  "price":      Number  (required),
  "stock":      Number,
  "imageUrl":   String,
  "tags":       [ String ],            // text-indexed
  "variants": [                        // EMBEDDED — product-specific, fetched together
    { "size": String, "color": String, "sku": String }
  ],
  "attributes": Mixed    // Polymorphic: { "RAM": "16GB" } for electronics,
                         //              { "fabric": "Cotton" } for clothing
}
```

**Polymorphic Attributes:** The `Mixed` type stores category-specific key-value pairs without EAV tables. This is a key advantage of document databases over relational — no schema migration when a new attribute type is introduced.

#### 3.1.3 orders
```json
{
  "_id":           ObjectId,
  "userId":        ObjectId → users,  // REFERENCE — user is independent
  "items": [                          // EMBEDDED — price snapshot at purchase time
    {
      "productId": ObjectId → products,
      "name":      String   (snapshot),
      "quantity":  Number,
      "price":     Number   (snapshot — immutable after placement)
    }
  ],
  "totalAmount":   Number,
  "status":        "Placed | Confirmed | Shipped | Delivered | Cancelled | Returned",
  "paymentMethod": "COD | Card | Online"
}
```

**Snapshot Embedding:** Order items are embedded with `name` and `price` captured at checkout. If the product is later deleted or repriced, the order history remains accurate.

#### 3.1.4 categories
```json
{
  "_id":            ObjectId,
  "name":           String (unique),
  "description":    String,
  "parentCategory": ObjectId → categories  // self-reference for sub-categories
}
```

#### 3.1.5 reviews
```json
{
  "_id":       ObjectId,
  "productId": ObjectId → products,  // REFERENCE
  "userId":    ObjectId → users,     // REFERENCE
  "rating":    Number (1–5),
  "comment":   String
}
```

Reviews are kept separate because they are user-generated content with unbounded growth per product. Embedding would create unbounded arrays and require fetching all reviews on every product read.

#### 3.1.6 inventory
```json
{
  "_id":              ObjectId,
  "productId":        ObjectId → products (unique index),
  "stock":            Number,
  "lowStockThreshold": Number (default 10)
}
```

Stock is a separate collection so ACID transactions can lock and update inventory records without loading the full product document, reducing contention.

#### 3.1.7 sellers
```json
{
  "_id":         ObjectId,
  "owner":       ObjectId → users,
  "storeName":   String (required),
  "description": String
}
```

### 3.2 Index Strategy

| Collection | Index | Type | Justification |
|---|---|---|---|
| users | `{ email: 1 }` | Unique | Login lookup — O(1), enforces no duplicate accounts |
| products | `{ name: "text", description: "text", tags: "text" }` | Text | Full-text search via `$text` operator and relevance scoring |
| products | `{ categoryId: 1, price: -1 }` | Compound | Category browse + price sort — satisfies the most common filter query as an index-covered scan |
| orders | `{ userId: 1, createdAt: -1 }` | Compound | Order history per user sorted newest-first — no COLLSCAN on large collections |
| inventory | `{ productId: 1 }` | Unique | One record per product; O(1) stock lookup during order transaction |

The compound index on `orders { userId, createdAt }` is especially important: `db.orders.find({userId}).sort({createdAt:-1})` is fully satisfied by the index without fetching documents, reducing I/O from O(n) to O(log n).

### 3.3 Redis Key Naming and Data Type Choices

| Key Pattern | Redis Type | TTL | Use Case | Justification |
|---|---|---|---|---|
| `product:{id}` | String (JSON) | 1 hr ±10% jitter | Product detail cache | O(1) GET; jitter prevents cache stampede |
| `cart:{userId}` | Hash | 7 days | Authenticated cart | Field-per-product; `HSET`/`HDEL` for per-item ops |
| `cart:guest:{guestId}` | Hash | 1 day | Guest cart | Same pattern, UUID from localStorage |
| `session:{userId}` | String (JSON) | 7 days | Auth session | Created on login, deleted on logout |
| `trending:products` | Sorted Set | 1 hr | Top-10 trending | `ZINCRBY` atomic; `ZRANGE REV 0 9` for top-N |
| `leaderboard:buyers:{YYYY-MM}` | Sorted Set | 35 days | Top buyers per month | Score = spend; monthly key rotation |
| `leaderboard:sellers` | Sorted Set | None | Top sellers by revenue | Score = cumulative sales revenue |
| `recent:{userId}` | List | None | Recently viewed | `LREM`+`LPUSH`+`LTRIM` — dedup, bounded to 10 |
| `page_views:{productId}` | HyperLogLog | None | Unique visitor count | 12 KB regardless of cardinality |
| `rate:{endpoint}:{ip}` | String (counter) | 60 s | Rate limiting per endpoint | `INCR` atomic; NX on first call |
| `rv-lock:{userId}:{productId}` | String (NX) | 5 s | Recently-viewed dedup lock | Prevents race condition on concurrent view calls |

---

## 4. Implementation Details

### 4.1 User Management

Registration hashes the password with **bcrypt (cost factor 10)** before storage — plaintext is never persisted. Login validates credentials, issues a **JWT (HS256)** signed with `JWT_SECRET`, and stores a session string in Redis with a 7-day TTL:

```javascript
await redisClient.setEx(`session:${user._id}`, 86400 * 7,
  JSON.stringify({ userId, email, role, loginTime: new Date() })
);
```

Logout deletes the Redis key: `await redisClient.del(`session:${userId}`)`.

Role-based access is enforced by two middleware layers:
- `authMiddleware` — verifies the JWT and attaches `req.user`
- `roleMiddleware(…roles)` — checks `req.user.role` against allowed roles

Three roles exist: `customer`, `seller`, `admin`. Admins can view all orders (read-only) but cannot promote users to admin.

### 4.2 Product Catalogue

`GET /api/products` builds a dynamic MongoDB filter:

```javascript
const filter = {};
if (search)     filter.$text = { $search: search };
if (categoryId) filter.categoryId = categoryId;
if (minPrice || maxPrice) filter.price = { $gte: minPrice, $lte: maxPrice };
const sort = sortBy === 'price_asc' ? { price: 1 }
           : sortBy === 'price_desc' ? { price: -1 }
           : { createdAt: -1 };
await Product.find(filter).sort(sort).skip(skip).limit(limit);
```

The text index enables full-text search across `name`, `description`, and `tags`. The compound index `{ categoryId, price }` covers the most common browse pattern without a collection scan.

`GET /api/products/:id` implements **cache-aside**:

```javascript
let product = await redisClient.get(`product:${productId}`);
if (!product) {
  product = await Product.findById(productId).populate(...);
  await redisClient.setEx(`product:${productId}`, jitteredTTL(), JSON.stringify(product));
}
// Tracking always runs regardless of cache hit
await redisClient.pfAdd(`page_views:${productId}`, req.ip);
await incrementView(productId);
if (req.user) await addRecentlyViewed(req.user._id, productId);
```

Cache invalidation: on product update or delete, `await redisClient.del(`product:${productId}`)` is called immediately.

### 4.3 Shopping Cart and Sessions

The cart is a **Redis Hash** where each field is a `productId` and the value is `{ productId, quantity }`. This allows O(1) per-item operations without deserialising the whole cart:

```javascript
// Add / update item
await redisClient.hSet(`cart:${userId}`, productId, JSON.stringify({ productId, quantity }));
await redisClient.expire(`cart:${userId}`, 604800); // 7-day TTL

// Remove item
await redisClient.hDel(`cart:${userId}`, productId);

// Get entire cart
const items = await redisClient.hGetAll(`cart:${userId}`);
```

**Guest cart** uses the same Hash pattern under `cart:guest:{guestId}` (1-day TTL). On login, guest cart items are merged into the user cart via `mergeGuestCart()` in `CartContext.js`, then the guest key is deleted.

### 4.4 Order Processing

Order placement uses a **MongoDB multi-document ACID transaction** spanning `orders` and `inventory`:

```javascript
const session = await mongoose.startSession();
session.startTransaction({
  readConcern:  { level: "majority" },  // no phantom reads on stock
  writeConcern: { w: "majority" },      // survives primary failover
});

try {
  for (const item of items) {
    // 1. Check stock (within transaction — reads committed data only)
    const inventory = await Inventory.findOne({ productId: item.productId }).session(session);
    if (!inventory || inventory.stock < item.quantity) {
      await session.abortTransaction();
      return res.status(400).json({ error: "Insufficient stock" });
    }
    // 2. Atomic stock decrement
    await Inventory.findByIdAndUpdate(inventory._id,
      { $inc: { stock: -item.quantity } }, { session }
    );
  }
  // 3. Create order document
  await new Order({ userId, items: orderItems, totalAmount }).save({ session });
  // 4. Redis: clear cart, update trending + leaderboards
  await redisClient.del(`cart:${userId}`);
  await session.commitTransaction();
} catch {
  await session.abortTransaction();
}
```

**Order status workflow:** `Placed → Confirmed → Shipped → Delivered`. Terminal states `Delivered`, `Cancelled`, and `Returned` cannot be modified. The backend enforces this rule on both the seller order update endpoint and the cancel endpoint.

Order history uses the compound index `{ userId: 1, createdAt: -1 }` for efficient per-user retrieval sorted newest-first.

### 4.5 Real-Time Features (Redis-driven)

| Feature | Redis Operation | Endpoint |
|---|---|---|
| Top-10 trending | `ZINCRBY trending:products 1 {productId}` on view + purchase | `GET /api/analytics/trending` |
| Recently viewed | `LREM` + `LPUSH` + `LTRIM 0 9` with 5-second NX dedup lock | `GET /api/products/recently-viewed` |
| Rate limiting (login) | `INCR rate:login:{ip}` limit=3, TTL=60s | `POST /api/auth/login` |
| Rate limiting (checkout) | `INCR rate:checkout:{ip}` limit=10, TTL=60s | `POST /api/orders` |
| Top buyers (month) | `ZINCRBY leaderboard:buyers:{YYYY-MM} {amount} {userId}` | `GET /api/analytics/leaderboard/buyers` |
| Top sellers | `ZINCRBY leaderboard:sellers {revenue} {sellerId}` per order | `GET /api/analytics/leaderboard/sellers` |
| Unique views | `PFADD page_views:{productId} {ip}` | `GET /api/products/:id/views` |

**Recently viewed dedup lock (prevents race condition):**
```javascript
const acquired = await redisClient.set(`rv-lock:${userId}:${productId}`,
  "1", { EX: 5, NX: true }); // atomic — only first concurrent call succeeds
if (!acquired) return;
await redisClient.lRem(key, 0, productId); // remove existing occurrence
await redisClient.lPush(key, productId);   // add to front
await redisClient.lTrim(key, 0, 9);        // keep last 10
```

### 4.6 Analytics and Reporting

Seven aggregation pipelines are implemented:

**Monthly Revenue (aggregation pipeline):**
```javascript
Order.aggregate([
  { $match: { createdAt: { $gte: startDate, $lte: endDate },
              status: { $in: ["Delivered", "Confirmed"] } } },
  { $group: { _id: null,
              totalRevenue: { $sum: "$totalAmount" },
              totalOrders: { $sum: 1 },
              avgOrderValue: { $avg: "$totalAmount" } } }
]);
```

**Daily Sales Breakdown:**
```javascript
Order.aggregate([
  { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
  { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              dailyRevenue: { $sum: "$totalAmount" },
              ordersCount: { $sum: 1 } } },
  { $sort: { _id: 1 } }
]);
```

**Top-N Products (unwind + group + lookup):**
```javascript
Order.aggregate([
  { $unwind: "$items" },
  { $group: { _id: "$items.productId",
              totalSold: { $sum: "$items.quantity" },
              totalRevenue: { $sum: { $multiply: ["$items.quantity","$items.price"] } } } },
  { $sort: { totalSold: -1 } },
  { $limit: N },
  { $lookup: { from: "products", localField: "_id",
               foreignField: "_id", as: "product" } }
]);
```

**Low Stock Alert:**
```javascript
Inventory.aggregate([
  { $match: { $expr: { $lt: ["$stock", "$lowStockThreshold"] } } },
  { $lookup: { from: "products", localField: "productId",
               foreignField: "_id", as: "product" } },
  { $sort: { stock: 1 } }
]);
```

**Most Viewed vs Most Purchased** (cross-database join):
```javascript
// Step 1: Top purchased from MongoDB aggregation
const mostPurchased = await Order.aggregate([ ... ]);
// Step 2: Unique views from Redis HyperLogLog for each product
const viewCounts = await Promise.all(
  productIds.map(id => redisClient.pfCount(`page_views:${id}`))
);
// Step 3: Merge and compute conversion rate
```

---

## 5. Non-Functional Requirement Implementation

### NFR1 — Performance

Hot read paths are served from Redis:

| Path | Mechanism | Latency |
|---|---|---|
| Product details | `GET product:{id}` from Redis | ~0.2 ms (cache hit) vs ~15–25 ms (MongoDB) |
| Homepage trending | `ZRANGE REV trending:products 0 9` | ~0.2 ms |
| Shopping cart | `HGETALL cart:{userId}` | ~0.2 ms |
| Session validation | `GET session:{userId}` | ~0.2 ms |

Real-time cache statistics are exposed at `GET /api/admin/redis-info`, showing `keyspace_hits`, `keyspace_misses`, and a computed `hit_rate`. Current hit rate: **92.87%** (1,276 hits / 1,374 total).

### NFR2 — Scalability (Sharding Plan)

| Collection | Shard Key | Justification |
|---|---|---|
| orders | `{ userId: 1, createdAt: 1 }` | High cardinality; range queries per user stay on one shard; `createdAt` prevents hot-shards for power users |
| products | `{ categoryId: 1, _id: 1 }` | Natural partition by category; hashed `_id` prevents intra-category hot-spots |
| inventory | `{ productId: 1 }` | Unique per product; random distribution |

A pure `userId` shard key for orders would create hot shards for high-volume users. The compound key `{ userId, createdAt }` distributes writes temporally and avoids cross-shard queries for order history lookups.

### NFR3 — High Availability

**MongoDB:** Atlas cluster (`cluster0.fujo8cy.mongodb.net`) provides a managed 3-node replica set (1 primary + 2 secondaries). The connection string uses `retryWrites=true` for automatic retry on transient failures. Automatic failover occurs within 30 seconds if the primary becomes unavailable.

**Redis Sentinel** (documented configuration in `database/redis/sentinel.conf`):
```
port 26379
sentinel monitor mymaster 127.0.0.1 6379 2
sentinel down-after-milliseconds mymaster 30000
sentinel parallel-syncs mymaster 1
sentinel failover-timeout mymaster 180000
```
Quorum of 2 ensures at least 2 of 3 Sentinel nodes must agree before a failover is triggered, preventing split-brain scenarios.

### NFR4 — Consistency

**Write concern `majority`** is set globally in `mongodb.js`:
```javascript
await mongoose.connect(MONGO_URI, {
  writeConcern: { w: "majority", wtimeout: 5000 },
  readPreference: "primaryPreferred",
});
```

**Read concern `majority`** is set inside all critical transactions:
```javascript
session.startTransaction({
  readConcern:  { level: "majority" },
  writeConcern: { w: "majority" },
});
```

**CAP Trade-off:** `readConcern: majority` prevents dirty reads of uncommitted inventory, ensuring a concurrent order cannot see stock decremented by a transaction that later aborts. The trade-off is slightly higher read latency (waiting for majority acknowledgement) versus `readConcern: local` which reads the primary's latest view regardless of replication state.

For the Redis cache layer, eventual consistency is intentional — product cache may be up to 1 hour stale. This is acceptable because price changes do not need to propagate sub-second. Stock levels are always read from MongoDB inside transactions, never from cache.

### NFR5 — Durability

Redis is configured with **hybrid persistence (RDB + AOF)**:

```
# RDB snapshots
save 900 1        # snapshot after 900s if ≥1 key changed
save 300 10       # snapshot after 300s if ≥10 keys changed
save 60 10000     # snapshot after 60s if ≥10000 keys changed

# AOF
appendonly yes
appendfsync everysec    # fsync every second — max 1s data loss
```

**Justification:** Pure AOF provides the lowest data loss (at most 1 second) but is slower on restart because every command must be replayed. Pure RDB provides fast restart but risks losing up to 5 minutes of data. Hybrid gives fast restart (RDB snapshot) with minimal data loss (AOF fills the gap since last snapshot).

Current persistence status (verified):
- `rdb_last_bgsave_status: ok`
- `aof_enabled: 1`
- `aof_last_bgrewrite_status: ok`

### NFR6 — Security

| Concern | Implementation |
|---|---|
| Password storage | bcrypt hash, cost factor 10 — plaintext never stored or logged |
| Authentication | JWT (HS256), `JWT_SECRET` from environment variable |
| Role-based access | `authMiddleware` + `roleMiddleware` on all protected routes |
| HTTP security headers | Helmet middleware (XSS, no-sniff, HSTS, CSRF prevention) |
| Rate limiting | Redis counters — 3 login attempts/min, 10 checkout requests/min per IP |
| MongoDB | Atlas SCRAM-SHA-256 auth, TLS enforced at cluster level, IP whitelist |
| Redis | Bound to `127.0.0.1` in development; password via `REDIS_URL` in production |
| Secrets | `.env` excluded from git; `.env.example` documents variables without values |
| Admin protection | Admin cannot be assigned via user management UI or API (blocked at both layers) |

### NFR7 — Observability

**HTTP request logging:** Morgan in `combined` format logs every request:
```
::1 - - [04/Jun/2026] "GET /api/products HTTP/1.1" 200 1842 "..." "Mozilla/5.0"
```

**Redis statistics** (`GET /api/admin/redis-info`):
```json
{
  "redis_version": "8.6.1",
  "used_memory_human": "1.29M",
  "keyspace_hits": "1276",
  "keyspace_misses": "98",
  "hit_rate": "92.87%",
  "aof_enabled": "1",
  "role": "master"
}
```

**MongoDB profiling** (`GET /api/admin/mongo-profile`):
- On Atlas M0 (free tier), the profiling command is unavailable via the driver.
- Slow query analysis is available in the Atlas UI under **Performance Advisor**.
- On self-hosted MongoDB or Atlas M10+: `db.setProfilingLevel(1, { slowms: 100 })` enables slow query logging; queries exceeding 100 ms are written to `system.profile`.

### NFR8 — Data Integrity

Two critical workflows use MongoDB ACID transactions:

1. **Order Placement** — `orders` + `inventory` modified atomically. If stock is insufficient or the connection drops mid-transaction, `session.abortTransaction()` rolls back all writes.

2. **Order Cancellation** — stock is restored (`$inc: { stock: +quantity }`) and order status set to `Cancelled` atomically. Prevents stock discrepancy if the status update succeeds but the stock restoration fails.

Terminal order states (`Delivered`, `Cancelled`, `Returned`) are enforced at the backend — once reached, no further status changes are permitted.

---

## 6. Caching Strategy and Cache-DB Coherence

### 6.1 Cache-Aside (Lazy Loading)

Cache-aside was chosen over write-through because products are read orders of magnitude more often than they are written. Write-through would add Redis latency to every product update — a low-frequency operation — to benefit high-frequency reads. Cache-aside defers population until the first read.

**Read path:**
```
GET /api/products/:id
  ↓
Redis GET product:{id}
  ├── HIT  → parse JSON → return { product, cached: true }  [~0.2 ms]
  └── MISS → MongoDB findById().populate(...)               [~15–25 ms]
             → Redis SETEX product:{id} jitteredTTL()
             → return { product, cached: false }
```

**Write/Delete path:**
```
PUT /api/products/:id
  ↓ MongoDB findByIdAndUpdate(...)
  ↓ Redis DEL product:{id}    ← immediate invalidation
  ↓ Next GET re-populates cache from MongoDB
```

### 6.2 Cache Stampede Prevention

When a popular product's cache expires, hundreds of simultaneous requests all miss and hit MongoDB concurrently. Prevention strategy — **jittered TTL**:

```javascript
const BASE_TTL = 3600; // 1 hour
const jitteredTTL = () => Math.floor(BASE_TTL * (0.9 + Math.random() * 0.2));
// Result: TTL randomly between 3240–4320 seconds
```

This spreads expiry times across an 18-minute window so concurrent requests for the same product do not all expire simultaneously. For extremely high-traffic products, a distributed lock (`SET NX PX`) could further serialise re-population, but jitter alone handles BhutanMart's expected traffic.

### 6.3 Data Consistency Between Cache and Source of Truth

| Scenario | Consistency Model |
|---|---|
| Product price/details change | Strong — cache is invalidated immediately on update (`DEL`) |
| Product stock during order | Strong — stock is ALWAYS read from MongoDB inside an ACID transaction; cache is never consulted for stock |
| Product listing (browse page) | Eventual — no caching on listing queries; always reads from MongoDB |
| Session data | Strong — session is deleted on logout; JWT expiry independently enforced |
| Cart data | Strong — cart key is deleted from Redis immediately on order placement |

---

## 7. Performance Analysis

### 7.1 Redis Benchmark

**redis-benchmark (1,000 requests, local):**

| Operation | Throughput | p50 Latency |
|---|---|---|
| SET | 47,619 req/s | 0.351 ms |
| GET | 111,111 req/s | 0.231 ms |

**Application-level measurement (Node.js → Redis):**

| Scenario | Latency |
|---|---|
| Warm cache GET (`product:{id}`) | **~0.20 ms** |
| Cold cache (MongoDB query + populate) | **~15–25 ms** |
| Cache speedup factor | **75×–125×** |

**Live cache statistics (from `GET /api/admin/redis-info`):**

| Metric | Value |
|---|---|
| Keyspace Hits | 1,276 |
| Keyspace Misses | 98 |
| **Hit Rate** | **92.87%** |
| Memory Used | 1.29 MB / 256 MB |
| Total Commands Processed | 2,886 |
| AOF Enabled | Yes |
| Eviction Policy | allkeys-lru |

The 7.13% miss rate represents cold-start accesses (first view of a product) and post-invalidation re-population. Under sustained traffic, the hit rate approaches 99%+ as all active products are warmed.

### 7.2 MongoDB Query Profiling (`explain()`)

**Category + price filter query (uses compound index):**
```javascript
db.products.find({ categoryId: ObjectId("..."), price: { $lte: 100 } })
           .sort({ price: -1 })
           .explain("executionStats")
```

| Metric | With Index | Without Index |
|---|---|---|
| `winningPlan.stage` | `IXSCAN` | `COLLSCAN` |
| `totalDocsExamined` | 12 (= docs returned) | All documents |
| `executionTimeMillis` | ~2 ms | ~40+ ms |
| Index used | `{ categoryId: 1, price: -1 }` | None |

**User order history query (uses compound index):**
```javascript
db.orders.find({ userId: ObjectId("...") }).sort({ createdAt: -1 }).explain("executionStats")
```
- Uses index `{ userId: 1, createdAt: -1 }` → `IXSCAN`
- `totalDocsExamined` equals `totalDocsReturned` (zero over-scanning)
- Without index: `COLLSCAN` over entire orders collection

**Full-text search:**
```javascript
db.products.find({ $text: { $search: "wireless headphones" } }).explain("executionStats")
```
- Uses text index `{ name: "text", description: "text", tags: "text" }` → `TEXT` stage
- Returns relevance-scored results; no collection scan

---

## 8. Challenges Faced and Resolutions

| Challenge | Root Cause | Resolution |
|---|---|---|
| `zRevRange` not a function (500 error) | `node-redis` v4 removed `zRevRange`; replaced by `zRange` with `{ REV: true }` | Updated all Sorted Set range calls to use `zRange(..., { REV: true })` |
| Cart enrichment causing recently-viewed duplicates | `getProductById` called by both ProductDetails page and CartContext enrichment simultaneously — race condition between `lRem` and `lPush` | Added Redis `SET NX` dedup lock (`rv-lock:{userId}:{productId}`, TTL 5s); only the first concurrent call proceeds |
| Product tracking skipped on cache hits | `return res.json(...)` inside the cache-hit branch ran before the tracking code (HyperLogLog, trending, recently-viewed) | Restructured `getProductById` — tracking block runs after cache check, before the single final `res.json()` |
| `/:sellerId` route catching `/my/orders` | Express matches routes top-to-bottom; wildcard `/:sellerId` was registered before `/my/orders` | Moved all specific `/my/...` routes above the wildcard in `sellerRoutes.js` |
| Seller orders not showing customer orders | `createProduct` used `req.user._id` (User ID) as `sellerId`, but `getSellerOrders` queried by `Seller._id` | Fixed `createProduct` to look up and use the Seller document's `_id`; migrated existing products with a one-time database update; `getSellerOrders` also queries `req.user._id` as fallback for legacy products |
| MongoDB profiling unavailable | Atlas M0 free tier does not support the `profile` command via the driver | Endpoint now returns a graceful message directing to Atlas Performance Advisor; replica set and write/read concern details are shown instead |
| Redis rate limiter not applying | The backend process running at the time was a stale instance started before the rate limiter code was added | Identified via Redis `KEYS rate:*` (returned empty); killed stale processes and started fresh |
| Revenue Summary always showing zero | `getMonthlyRevenue()` called without `month`/`year` params → `new Date(undefined, NaN, 1)` = `Invalid Date` → aggregation matched nothing | Added defaults in controller (`month = now.getMonth()+1`) and explicit params in dashboard calls |

---

## 9. Future Enhancements

1. **Redis Cluster** — Upgrade from documented Sentinel to Redis Cluster for horizontal write scaling and automatic sharding across 6+ nodes.
2. **Distributed lock for cache re-population** — Full `SET NX PX` locking around the MongoDB fetch + `SETEX` block to serialise all concurrent misses for the same key.
3. **MongoDB Atlas Search** — Replace `$text` index with Atlas Search (Apache Lucene) for fuzzy matching, faceted search, autocomplete, and relevance tuning.
4. **Message queue (BullMQ / Redis Streams)** — Decouple order fulfilment (inventory sync, email notifications, PDF receipts) from the HTTP request cycle using Redis Streams as the transport layer.
5. **Write-behind caching for cart** — Batch persist cart changes to MongoDB asynchronously, enabling cross-device cart recovery for logged-in users.
6. **Prometheus + Grafana observability** — Replace manual Redis INFO polling with `redis_exporter` → Prometheus scrape → Grafana dashboards for latency percentiles, hit rate trends, and memory pressure alerts.
7. **Product recommendations** — Combine Redis `recent:{userId}` List with MongoDB purchase history in a collaborative filtering pipeline to surface personalised product recommendations.
8. **MongoDB time-series collection** — Migrate the daily sales data to a MongoDB Time Series collection for better compression and time-range query performance.

---

## 10. References

[1] K. Chodorow, *MongoDB: The Definitive Guide*, 3rd ed. Sebastopol, CA: O'Reilly Media, 2019.

[2] J. L. Carlson, *Redis in Action*. Shelter Island, NY: Manning Publications, 2013.

[3] P. J. Sadalage and M. Fowler, *NoSQL Distilled: A Brief Guide to the Emerging World of Polyglot Persistence*. Upper Saddle River, NJ: Addison-Wesley, 2013.

[4] MongoDB, Inc., "MongoDB Documentation," [Online]. Available: https://www.mongodb.com/docs/. [Accessed: Jun. 2026].

[5] Redis Ltd., "Redis Documentation," [Online]. Available: https://redis.io/docs/. [Accessed: Jun. 2026].

[6] E. Brewer, "CAP twelve years later: How the 'rules' have changed," *Computer*, vol. 45, no. 2, pp. 23–29, Feb. 2012, doi: 10.1109/MC.2012.37.

[7] Redis Ltd., "Redis Persistence," [Online]. Available: https://redis.io/docs/manual/persistence/. [Accessed: Jun. 2026].

[8] MongoDB, Inc., "Read Concern," [Online]. Available: https://www.mongodb.com/docs/manual/reference/read-concern/. [Accessed: Jun. 2026].

[9] MongoDB, Inc., "Write Concern," [Online]. Available: https://www.mongodb.com/docs/manual/reference/write-concern/. [Accessed: Jun. 2026].

[10] MongoDB, Inc., "Indexes," [Online]. Available: https://www.mongodb.com/docs/manual/indexes/. [Accessed: Jun. 2026].

[11] Redis Ltd., "Redis Sentinel," [Online]. Available: https://redis.io/docs/management/sentinel/. [Accessed: Jun. 2026].

[12] M. Kleppmann, *Designing Data-Intensive Applications*. Sebastopol, CA: O'Reilly Media, 2017.
