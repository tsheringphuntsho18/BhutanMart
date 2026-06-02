# MongoDB Docker Initialization Scripts

## Replica Set Initialization

Run this after containers start:

```bash
docker exec mongo1 mongosh -u admin -p admin123 --authenticationDatabase admin << EOF
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo1:27017", priority: 3 },
    { _id: 1, host: "mongo2:27017", priority: 2 },
    { _id: 2, host: "mongo3:27017", priority: 1, arbiterOnly: true }
  ]
})
EOF
```

## Commands

### Start Containers
```bash
cd docker/mongodb
docker-compose up -d
```

### Check Replica Set Status
```bash
docker exec mongo1 mongosh -u admin -p admin123 --authenticationDatabase admin --eval "rs.status()"
```

### View Logs
```bash
docker logs mongo1
```

### Stop Containers
```bash
docker-compose down
```

### Remove Volumes
```bash
docker-compose down -v
```

## Verification

Once initialized, verify with:
```bash
docker exec mongo1 mongosh -u admin -p admin123 --authenticationDatabase admin --eval "rs.isMaster()"
```

Should show:
```json
{
  "ismaster": true,
  "secondary": false,
  "arbiter": false,
  "primary": "mongo1:27017"
}
```
