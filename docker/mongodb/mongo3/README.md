# MongoDB Arbiter Instance Configuration

This is MongoDB Secondary 2 (Arbiter) in the replica set.

## Configuration
- Port: 27019 (forwarded from container 27017)
- Role: Arbiter (no data storage)
- Priority: 1 (cannot be promoted to primary)
- Data directory: /data/db (minimal data)

## Purpose
An arbiter is a MongoDB instance that holds no data. It exists only to participate in elections for replica set primaries. Arbiters help provide:
- Breaking ties in elections
- Reduced hardware costs (no data replication needed)
- Odd number of voting members for elections

## Operations

### Connect to arbiter
```bash
mongosh --port 27019 -u admin -p admin123 --authenticationDatabase admin
```

### Check arbiter status
```bash
docker exec mongo3 mongosh -u admin -p admin123 --authenticationDatabase admin --eval "rs.status()"
```

## Key Characteristics
- No data synchronization
- Does not participate in read operations
- Can only vote in elections
- Lower resource usage than data-bearing members

## When to Use Arbiters
- Production environments with even number of nodes
- Cost-sensitive deployments
- High-availability setups with 3+ members
- Not recommended for large datasets
