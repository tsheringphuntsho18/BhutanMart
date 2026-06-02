# MongoDB Sharding Plan
This document outlines the sharding strategy for BhutanMart at scale

## Current Setup
- Single cluster: MongoDB Atlas cluster0
- Collections: 7 main collections (users, products, orders, reviews, inventory, sellers, categories)

## Sharding Strategy

### When to Shard
- When data exceeds 64GB
- When throughput exceeds primary node capacity
- For horizontal scaling across multiple nodes

### Shard Key Selection

#### Orders Collection (Primary Candidate)
```
Shard Key: { userId: 1, createdAt: -1 }
Rationale:
  - Ensures even distribution by user ID
  - Supports querying by user and date range
  - No hotspots (balanced load across shards)
```

#### Products Collection (Secondary Candidate)
```
Shard Key: { categoryId: 1, createdAt: -1 }
Rationale:
  - Even distribution across categories
  - Supports category-based queries
  - Supports time-based filtering
```

### Index Support
All shard keys require corresponding indexes:
- orders: { userId: 1, createdAt: -1 }
- products: { categoryId: 1, createdAt: -1 }

### Chunk Distribution
- Initial chunk size: 64 MB
- Auto-split enabled for even distribution
- Balancer enabled for chunk rebalancing

## Scaling Timeline
1. Monitor: Current collection sizes and growth rate
2. Plan: At 60GB, create sharding infrastructure
3. Implement: Apply sharding without downtime
4. Verify: Confirm even distribution across shards

## Read/Write Scaling
- Write scaling: Achieved through sharding (parallel writes to different shards)
- Read scaling: Achieved through replica sets and read preferences
