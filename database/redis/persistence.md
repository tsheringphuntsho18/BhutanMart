# Redis Persistence Strategy

## AOF (Append Only File)
- File: appendonly.aof
- Purpose: Write all commands to file for recovery
- Fsync policy: everysec (every 1 second)
- Rewrite: Triggered when file size exceeds 100MB

## RDB (Redis Database Snapshot)
- File: dump.rdb
- Purpose: Point-in-time backup of entire database
- Save rules:
  - After 900 seconds (15 min) if at least 1 key changed
  - After 300 seconds (5 min) if at least 10 keys changed
  - After 60 seconds if at least 10000 keys changed

## Backup Strategy

### Development
- No persistence required
- Data loss acceptable on restart

### Production
- Both AOF and RDB enabled
- AOF for quick recovery
- RDB for long-term backups
- Backup files to S3 or Cloud Storage

### Disaster Recovery
1. Stop Redis service
2. Copy latest RDB or AOF file
3. Start Redis with backup file
4. Verify data integrity
5. Resume operations

## Performance Considerations
- AOF rewrites automatically when file > 100MB
- BGSAVE for background RDB snapshots
- Monitor disk space for persistence files
- Consider SSD for better performance

## Configuration
```
# In redis.conf
save 900 1          # Save after 900s if 1+ keys changed
save 300 10         # Save after 300s if 10+ keys changed
save 60 10000       # Save after 60s if 10000+ keys changed

appendonly yes      # Enable AOF
appendfsync everysec  # Fsync every second

# Disable for development speed
# save ""
# appendonly no
```
