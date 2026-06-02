# Redis Replica Instance 1

## Configuration
- Port: 6380 (forwarded to host)
- Container: redis_replica1
- Role: Read-only replica
- Master: redis:6379

## Read Operations
This instance serves read-only operations:

### Connect
```bash
docker exec -it redis_replica1 redis-cli
```

### Check replica info
```bash
docker exec redis_replica1 redis-cli INFO replication
```

Sample output:
```
# Replication
role:slave
master_host:redis
master_port:6379
master_link_status:up
master_last_io_seconds_ago:0
master_sync_in_progress:0
slave_repl_offset:1234567
```

## Use Cases
- Distribute read load
- Backup and recovery
- Analytics queries without affecting primary
- Failover candidate if master fails

## Promotion to Master
If primary fails:
```bash
docker exec redis_replica1 redis-cli SLAVEOF NO ONE
```

Then update other replicas:
```bash
docker exec redis_replica2 redis-cli SLAVEOF redis_replica1 6379
```

## Replication Lag
Monitor sync lag with:
```bash
docker exec redis_master redis-cli INFO replication | grep slave_repl_offset
docker exec redis_replica1 redis-cli INFO replication | grep slave_repl_offset
```
