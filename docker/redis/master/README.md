# Redis Docker Configuration

## Redis Master-Slave Setup

### Master (Primary)
- Port: 6379
- Container: redis_master
- Role: Accepts all write operations

### Slave/Replica 1
- Port: 6380
- Container: redis_replica1
- Role: Read-only replica, syncs from master

### Slave/Replica 2
- Port: 6381
- Container: redis_replica2
- Role: Read-only replica, syncs from master

## Features
- Automatic replication
- Persistence (AOF enabled)
- Network bridge for inter-container communication

## Commands

### View all instances
```bash
docker ps | grep redis
```

### Connect to master
```bash
docker exec -it redis_master redis-cli
```

### Check replication status
```bash
docker exec redis_master redis-cli INFO replication
```

### Monitor all commands
```bash
docker exec redis_master redis-cli MONITOR
```

## Persistence
- AOF (Append Only File) enabled
- Data persisted to Docker volumes
- Survives container restarts

## Failover (Manual)
To promote a replica to master:
```bash
docker exec redis_replica1 redis-cli SLAVEOF NO ONE
```

This breaks the replica connection and makes it a standalone instance.
