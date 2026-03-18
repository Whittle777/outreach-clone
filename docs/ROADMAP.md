# ROADMAP

Master list of all planned features.

## Immediate Goals

1. [ ] Ensure all protected routes use JWT validation

## New Features

1. [ ] Database Migration: Migrating from MongoDB to PostgreSQL with Prisma ORM
2. [ ] API Design: RESTful endpoints for CRUD operations on Users, Prospects, and Sequences
3. [ ] Multi-Tenant Infrastructure (Phase 2):
   - [x] Cell-Based Sharding
   - [x] Schema Tagging
4. [ ] Sequencing Engine & State Management (Phase 3):
   - [x] Interval-Based Scheduling
   - [x] Event-Driven State Machine
5. [ ] Message Pipeline & Backpressure (Phase 4):
   - [x] Distributed Message Brokers
   - [x] Pipeline Concurrency
   - [x] Backpressure Handling
6. [ ] Provider Integrations (Phase 5):
   - [x] Authentication Protocols
   - [x] Real-Time Sync
7. [ ] Rate Limiting (Phase 6):
   - [x] Hierarchical Throttles
   - [x] Implementation
8. [ ] Deliverability & Compliance (Phase 7):
   - [x] Cryptographic Authentication
   - [x] Reputation Monitoring
   - [x] Unsubscribe & Bounce Handling
9. [ ] Engagement Telemetry (Phase 8):
   - [x] Tracking Pixels
   - [x] Link Wrapping
   - [x] Open Rate Considerations
10. [ ] AI & Orchestration Upgrades (Phase 9):
    - [x] Data Layer Unification
    - [x] Next-Gen Orchestration Engine (NGOE)
    - [x] Model Context Protocol (MCP)

## New Features (Identified from ARCHITECTURE.md)

- [x] User Authentication: Secure login via JWT authentication
- [x] Password Hashing: bcrypt for password hashing
- [x] Microservices Languages: Go (high-throughput external APIs), Elixir (state management, data processing pipelines)
- [x] Service Communication: gRPC (synchronous RPC), Apache Kafka (asynchronous event replication), GraphQL (frontend client queries)
- [x] Rate Limiting: Redis with Token Bucket/Sliding Window Log algorithms and Lua scripts
- [x] Message Processing: Elixir's Broadway library for Kafka stream consumption
- [x] OAuth tokens for provider integrations (Google/Microsoft)
- [ ] Email-sending cron jobs and SMTP connections (out of scope for MVP)
