# MongoDB Replication Configuration
This file documents the MongoDB replica set configuration for the project

## Replica Set Information
- Name: rs0
- Cluster: MongoDB Atlas (Cloud-based)
- Primary: cluster0-shard-00-00.fujo8cy.mongodb.net:27017
- Secondaries: cluster0-shard-00-01.fujo8cy.mongodb.net:27017, cluster0-shard-00-02.fujo8cy.mongodb.net:27017

## Connection Details
- URI Format: mongodb+srv://[username]:[password]@cluster0.fujo8cy.mongodb.net/[database]
- Database Name: bhutanmart
- Authentication: SCRAM-SHA-1

## Replica Set Features
- Automatic Failover
- High Availability
- Distributed Backup
- Read Replicas for load distribution

## Local Development Fallback
If MongoDB Atlas is unavailable, use local MongoDB:
- Connection: mongodb://localhost:27017/bhutanmart
- Ensure MongoDB daemon is running: `mongod`

## Creating Shard Plan
The shard plan optimizes data distribution across multiple servers:

### Shard Key Selection
- Orders Collection: userId + createdAt (compound index)
- Reason: Ensures even distribution across sellers' order volumes

### Read Preferences
- Primary: Default for writes and critical reads
- Secondary: For analytics and reporting queries
- Nearest: For geographically distributed users
