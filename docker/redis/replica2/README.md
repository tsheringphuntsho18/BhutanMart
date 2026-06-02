# Redis Replica Instance 2

## Configuration
- Port: 6381 (forwarded to host)
- Container: redis_replica2
- Role: Read-only replica
- Master: redis:6379

## Read Operations
This instance serves read-only operations, second replica:

### Connect
```bash
docker exec -it redis_replica2 redis-cli
```

### Check replica info
```bash
docker exec redis_replica2 redis-cli INFO replication
```

## Scaling Reads
With multiple replicas, you can:
- Distribute read traffic across replicas
- Implement read preference strategies
- Scale horizontally for read-heavy workloads

## Connection String for Application
For replica set read scaling:
```
redis://redis:6379 (master - writes)
redis://redis_replica1:6379 (replica - reads)
redis://redis_replica2:6379 (replica - reads)
```

## Fault Tolerance
With 3 Redis instances:
- Master down: Promote a replica
- One replica down: Still have 2 instances
- Two replicas down: Master still operational (degraded)

## Monitoring All Replicas
Check all instances status:
```bash
docker exec redis_master redis-cli INFO replication
docker exec redis_replica1 redis-cli INFO replication
docker exec redis_replica2 redis-cli INFO replication
```
