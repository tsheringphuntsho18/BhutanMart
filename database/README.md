# BhutanMart Database & Deployment Documentation

This directory contains comprehensive documentation and configuration files for the BhutanMart project's database infrastructure.

## Directory Structure Overview

### `/database/mongodb/`
MongoDB configuration and documentation

- **indexes.js** - Documents all database indexes for query optimization
  - User email indexes for uniqueness
  - Product search indexes for full-text search
  - Order indexes for efficient filtering
  - Compound indexes for complex queries

- **replica-init.md** - MongoDB replica set initialization guide
  - Connection to MongoDB Atlas cluster
  - Replica set configuration details
  - High availability setup
  - Failover mechanisms

- **shard-plan.md** - Horizontal scaling strategy
  - When to implement sharding (at 60GB)
  - Shard key selection strategy
  - Chunk distribution planning
  - Read/write scaling approaches

### `/database/redis/`
Redis caching and session storage configuration

- **redis.conf** - Redis configuration and data structures
  - Shopping cart storage (Hash)
  - User sessions (String)
  - Product caching strategies
  - Trending products tracking (Sorted Set)
  - Rate limiting implementation
  - Seller leaderboard (Sorted Set)

- **sentinel.conf** - High availability configuration
  - Master-slave replication setup
  - Automatic failover configuration
  - Sentinel quorum settings
  - Persistence settings

- **persistence.md** - Data persistence strategies
  - AOF (Append Only File) configuration
  - RDB (Snapshot) strategy
  - Backup and recovery procedures
  - Disaster recovery planning

### `/docker/`
Docker containerization for both databases

#### `/docker/mongodb/`
Complete MongoDB replica set setup

- **docker-compose.yml** - 3-node MongoDB cluster + 3-node Redis cluster
  - mongo1: Primary (priority 3)
  - mongo2: Secondary (priority 2)
  - mongo3: Arbiter (priority 1)
  - redis: Master
  - redis_replica1: Slave
  - redis_replica2: Slave

- **mongo1/README.md** - Primary MongoDB documentation
- **mongo2/README.md** - Secondary MongoDB documentation
- **mongo3/README.md** - Arbiter MongoDB documentation

#### `/docker/redis/`
Redis master-slave setup

- **master/README.md** - Redis master configuration
- **replica1/README.md** - First Redis replica
- **replica2/README.md** - Second Redis replica

### `/diagrams/`
Architecture diagrams and planning documents

- **mongodb-schema.drawio** - Visual MongoDB schema design
- **architecture.drawio** - Complete system architecture
- **redis-key-design.drawio** - Redis data structure patterns

## Key Concepts Explained

### MongoDB Indexes
Used for query optimization:
```javascript
// Email uniqueness and fast login
{ email: 1 } // unique index

// Category filtering
{ categoryId: 1 }

// Price range queries
{ price: 1 }

// Full-text search
{ name: "text", description: "text" }
```

### Replica Sets
Provide high availability:
- **Primary**: Accepts reads and writes
- **Secondary**: Accepts reads, syncs from primary
- **Arbiter**: Only votes in elections, no data

### Sharding Strategy
For horizontal scaling at scale:
- **Shard Key**: { userId: 1, createdAt: -1 }
- **Purpose**: Even distribution across shards
- **Trigger**: When data exceeds 64GB

### Redis Data Structures
Used for caching and sessions:
- **Hash**: Shopping carts (cart:{userId})
- **String**: Sessions and product cache
- **Sorted Set**: Trending products, leaderboards
- **HyperLogLog**: Unique page view counts

## Development vs Production

### Development Setup
- Single MongoDB instance (localhost:27017)
- Single Redis instance (localhost:6379)
- No persistence needed
- Fast iteration and testing

### Production Setup
- MongoDB Atlas 3-node replica set (cloud)
- Redis Master-Slave-Slave replication
- Sharding for horizontal scaling
- Persistent storage with AOF and RDB
- Sentinel for automatic failover

## Scaling Path

1. **Phase 1 (Current)**: Single instances
   - Suitable for: MVP, <100K users
   - Storage: <10GB

2. **Phase 2**: Replica Sets
   - Suitable for: 100K-1M users
   - Storage: 10-64GB
   - High availability enabled

3. **Phase 3**: Sharding
   - Suitable for: 1M+ users
   - Storage: >64GB
   - Horizontal read/write scaling

4. **Phase 4**: Global Distribution
   - Multi-region deployment
   - Local caching layers
   - Global load balancing

## Monitoring & Maintenance

### MongoDB Health
```bash
# Check replica set status
rs.status()

# Check oplog size
db.getReplicationInfo()

# Monitor connections
db.serverStatus().connections
```

### Redis Health
```bash
# Check replication
INFO replication

# Monitor memory
INFO memory

# Check connected clients
INFO clients
```

## Backup & Recovery

### MongoDB Backup
- Automatic with MongoDB Atlas
- Manual backup via mongodump
- Point-in-time recovery available

### Redis Backup
- RDB snapshots (binary format)
- AOF files (command replay)
- Both enabled in production

## Next Steps
1. Review `/database/diagrams/` for visual architecture
2. Configure `/docker/mongodb/docker-compose.yml` for local testing
3. Set up production Redis configuration
4. Implement monitoring alerts
5. Plan scaling timeline based on growth metrics
