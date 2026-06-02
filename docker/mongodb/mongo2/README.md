# Secondary MongoDB Instance Configuration

This is MongoDB Secondary 1 in the replica set.

## Configuration
- Port: 27018 (forwarded from container 27017)
- Role: Secondary/Voting member
- Priority: 2 (can be promoted to primary)
- Data directory: /data/db

## Operations

### Connect to this instance
```bash
mongosh --port 27018 -u admin -p admin123 --authenticationDatabase admin
```

### Check status
```bash
docker exec mongo2 mongosh -u admin -p admin123 --authenticationDatabase admin --eval "rs.status()"
```

### Sync status
```bash
docker exec mongo2 mongosh -u admin -p admin123 --authenticationDatabase admin --eval "rs.getSyncSourceFeedback()"
```

## Failover Behavior
- If primary fails, this member can be voted as primary
- Automatically syncs data from primary
- Accepts read operations (with read preference: secondary)
