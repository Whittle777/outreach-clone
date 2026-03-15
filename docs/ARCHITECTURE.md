# ARCHITECTURE

System design and tech stack rules.

## Overview

This project is a headless REST API for a sales engagement platform (similar to Outreach.io or Apollo). The backend handles user authentication, prospect management, email sequences, and activity tracking.

## Tech Stack

### Core Stack
- **Framework:** Express.js (Node.js)
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT (JSON Web Tokens) for all protected routes
- **Password Hashing:** bcrypt

### Future/Advanced Stack (Phase 1+)
- **Microservices Languages:** Go (high-throughput external APIs), Elixir (state management, data processing pipelines)
- **Service Communication:** gRPC (synchronous RPC), Apache Kafka (asynchronous event replication), GraphQL (frontend client queries)
- **Rate Limiting:** Redis with Token Bucket/Sliding Window Log algorithms and Lua scripts
- **Message Processing:** Elixir's Broadway library for Kafka stream consumption

## Core Data Models

### Users
Sales representatives using the application.
- Email (unique, required)
- Password (hashed with bcrypt)
- Secure login via JWT authentication

### Prospects
Leads being contacted through email campaigns.
- First Name
- Last Name
- Email Address
- Company Name
- Status (e.g., Uncontacted, Bounced, Replied)

### Sequences
Automated email campaigns owned by Users.
- Name (e.g., "Q3 Inbound Leads")
- Belongs to a User (one-to-many relationship)

### Sequence Steps
Individual email templates within a Sequence.
- Order (Step 1, Step 2, etc.)
- Delay Days (wait time before sending)
- Subject Template
- Body Template
- Belongs to a Sequence (one-to-many relationship)

### Email Activities
Tracking table for sent emails.
- Links a Prospect to a Sequence Step
- Status tracking (Pending, Sent, Failed, Bounced)

## Architecture Decisions

1. **Database Migration:** Migrating from MongoDB to PostgreSQL with Prisma ORM
2. **Authentication:** All protected routes require valid JWT tokens
3. **API Design:** RESTful endpoints for CRUD operations on Users, Prospects, and Sequences
4. **Future Work:** Email-sending cron jobs and SMTP connections are out of scope for MVP

## Multi-Tenant Infrastructure (Phase 2)

### Cell-Based Sharding
- Partition compute instances, databases, and message brokers into isolated "Bentos" (cells)
- Prevent noisy neighbor problems from impacting the global customer base
- Geographic routing for data residency compliance (GDPR)

### Schema Tagging
- Core database tables include explicit metadata columns (e.g., BENTO string column)
- Enables analytics pipelines to aggregate reporting across disparate data centers

## Sequencing Engine & State Management (Phase 3)

### Interval-Based Scheduling
- Schedule sequential actions based on dynamic time intervals rather than static calendar dates
- Implement schedule shifting to pause execution outside approved time blocks, weekends, or holidays
- Dynamically shift all subsequent steps forward in time to prevent backlog burst

### Event-Driven State Machine
- Track real-time prospect status in centralized database table (Active, Pending, Finished)
- Enforce terminal states: halt sequences immediately when terminal events detected (inbound email reply, hard bounce, opt-out)

## Message Pipeline & Backpressure (Phase 4)

### Distributed Message Brokers
- Publish outbound email dispatch requests to Apache Kafka topics
- Avoid synchronous network calls to external APIs

### Pipeline Concurrency
- Utilize Elixir's Broadway library for consuming Kafka streams
- Group messages and execute batch validations natively on Erlang VM

### Backpressure Handling
- Automatically slow consumption rate if downstream API providers return rate-limit errors (HTTP 429)
- Prevent buffer overflows during high load

## Provider Integrations (Phase 5)

### Authentication Protocols
- OAuth 2.0 flows (deprecate legacy IMAP/SMTP basic authentication)
- Google Workspace via Gmail API
- Microsoft Office 365 via Microsoft Graph API

### Real-Time Sync
- Webhook-based push notifications instead of periodic polling
- Header-based sync for regulated tenants: sync email headers initially, download full body only if metadata matches active prospect

## Rate Limiting (Phase 6)

### Hierarchical Throttles
- Mailbox caps (e.g., 2,000/day for Gmail)
- Organization totals
- Prospect frequency limits
- Target domain limits

### Implementation
- Redis datastore with Token Bucket or Sliding Window Log algorithms
- Atomic Lua scripts for read, evaluation, increment, and TTL expiration commands
- Prevent race conditions during high concurrency

## Deliverability & Compliance (Phase 7)

### Cryptographic Authentication
- SPF configuration required for all tenants
- DKIM with 2048-bit keys minimum
- DMARC policy progression (p=none → p=reject)

### Reputation Monitoring
- Track abuse complaint rates below 0.3% threshold (Google/Yahoo requirements)

### Unsubscribe & Bounce Handling
- RFC 8058 compliant List-Unsubscribe headers (POST method)
- Parse inbound Non-Delivery Reports (NDRs)
- Exponential backoff retries for soft bounces
- Permanent 'Failed' state mutation for hard bounces

## Engagement Telemetry (Phase 8)

### Tracking Pixels
- Host 1x1 transparent images on fast CDN
- Embed unique cryptographic hashes mapped to specific mailings

### Link Wrapping
- Replace raw hyperlinks with tracking URLs
- Record interaction before HTTP 301/302 redirect to destination

### Open Rate Considerations
- De-prioritize open rates as strict state triggers
- Mitigate false positives from enterprise security scanners and Apple Mail Privacy Protection (MPP)

## AI & Orchestration Upgrades (Phase 9)

### Data Layer Unification
- Continuous, bidirectional synchronization of first-party engagement data with external CRM systems

### Next-Gen Orchestration Engine (NGOE)
- Schedule and run complex AI agent tasks asynchronously
- Non-blocking execution paths for standard operations

### Model Context Protocol (MCP)
- MCP Gateway for secure, standardized communication between central AI agents and distributed enterprise data silos

## Immediate Goals (MVP)

1. Complete Prisma/Postgres schema implementation
2. Build standard CRUD routes for:
   - Users (with authentication)
   - Prospects
   - Sequences (including Sequence Steps)
3. Ensure all protected routes use JWT validation
4. Establish foundation for future microservices migration (Strangler Fig pattern)
