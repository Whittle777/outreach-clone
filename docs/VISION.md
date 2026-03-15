# VISION

Dump all unorganized requirements, features, and research here.


# Outreach Clone - MVP Core Engine

## The Big Picture
We are building a headless REST API for a sales engagement platform (like Outreach.io or Apollo). There is no frontend right now, just the backend. 

## Tech Stack Rules
- Framework: Express.js (Node)
- Database: PostgreSQL
- ORM: Prisma
- Auth: JWT (JSON Web Tokens) for all protected routes.

## Core Data Models (The Database)
I need the schema to handle these main concepts:
1. **Users:** The sales reps using our app. They need an email, a hashed password, and a way to securely log in.
2. **Prospects:** The leads we are emailing. They need a first name, last name, email address, company name, and a "status" (e.g., Uncontacted, Bounced, Replied).
3. **Sequences:** A sequence is an automated email campaign. A sequence belongs to a User. It just needs a name (like "Q3 Inbound Leads").
4. **Sequence Steps:** These are the actual templates inside a Sequence. A Step belongs to a Sequence. It needs an "order" (Step 1, Step 2), a "delay_days" (how many days to wait before sending), a "subject_template", and a "body_template".
5. **Email Activities:** This is the tracking table. It links a Prospect to a Sequence Step. It tracks the status of a specific email (Pending, Sent, Failed, Bounced).

## Immediate Goal
Don't worry about building the actual email-sending cron jobs or SMTP connections yet. The immediate goal is to completely swap out the current MongoDB setup for Prisma/Postgres, build this schema, and then create standard CRUD (Create, Read, Update, Delete) routes for Users, Prospects, and Sequences - lets go!!

1. Sales Activity & Engagement
This data helps teams track day-to-day productivity and how prospects are interacting with outbound efforts.

Activity Metrics: Total emails sent, calls made, meetings scheduled, and follow-ups completed.

Engagement Rates: Open rates, click-through rates, and reply rates across different email sequences.

Buyer Sentiment: AI-driven classification of email replies (e.g., positive, objection, referral, or unsubscribe).

Leaderboards: Rankings of individual sales reps based on quota attainment and activity volume.

2. Pipeline Management & Forecasting
This section focuses on the overall health of the sales funnel and revenue predictability.

Pipeline Movement: Tracks how deals shift week-by-week (e.g., deals progressed, added, pushed to a later date, or lost).

AI Projections: Machine learning models that predict where a team will finish the quarter based on historical win rates, seasonality, and current pipeline health.

Quota Attainment: Visual progress tracking toward individual, team, or company-wide revenue goals for the quarter or fiscal year.

Pipeline Coverage: The ratio of potential revenue in the pipeline compared to the actual revenue target.

3. Deal Health & Performance
These insights help managers and reps drill down into specific opportunities to ensure they close successfully.

Deal Health Scores: Automated scoring that flags at-risk deals based on prospect engagement and momentum.

Top Opportunities: A prioritized list of high-value deals nearing their close dates.

Win/Loss Modeling: Conversion rates analyzed by sales stage or forecast category to identify where deals are stalling.


Phase 1: Application Decomposition and Tech Stack Setup

[ ] Migrate Legacy Monoliths: Utilize the Strangler Fig architectural pattern to incrementally extract domains (like settings and configurations) into dedicated, autonomous microservices.

[ ] Ensure Data Consistency: Implement a double-write strategy during the migration to keep legacy databases and new microservice datastores perfectly synchronized.

[ ] Optimize Languages: Utilize languages with strong concurrency models, such as Go for high-throughput external API microservices, and Elixir for managing state and data processing pipelines.

[ ] Establish Communication Protocols:

Use gRPC for low-latency, synchronous service-to-service Remote Procedure Calls.

Use Apache Kafka for asynchronous, decoupled event replication across services.

Use GraphQL for efficient frontend client data querying.

Phase 2: Multi-Tenant Infrastructure Isolation

[ ] Implement Cell-Based Sharding: Partition compute instances, databases, and message brokers into isolated "Bentos" (cells) to prevent noisy neighbor problems from impacting the global customer base.

[ ] Geographic Routing: Deploy these cells in distinct geographic regions to comply with strict data residency and sovereignty regulations (e.g., GDPR).

[ ] Schema Tagging: Ensure core database tables (like tasks and mailings) include explicit metadata columns (e.g., a BENTO string column) to allow analytics pipelines to aggregate reporting across disparate data centers.

Phase 3: Sequencing Engine & State Management

[ ] Build Interval-Based Scheduling: Schedule sequential actions based on dynamic time intervals rather than static calendar dates.

[ ] Implement Schedule Shifting: Write algorithmic logic to pause execution outside of approved time blocks, weekends, or holidays, and dynamically shift all subsequent steps forward in time to prevent a backlog burst.

[ ] Design an Event-Driven State Machine: Track real-time prospect status in a centralized database table (e.g., Active, Pending, Finished).

[ ] Enforce Terminal States: Configure the state machine to immediately halt sequences when a terminal event (like an inbound email reply, hard bounce, or opt-out) is detected.

Phase 4: Message Pipeline & Backpressure

[ ] Deploy Distributed Message Brokers: Publish outbound email dispatch requests to Apache Kafka topics rather than executing synchronous network calls to external APIs.

[ ] Manage Pipeline Concurrency: Utilize Elixir's Broadway library to consume Kafka streams, group messages, and execute batch validations natively on the Erlang VM.

[ ] Implement Backpressure: Ensure the Broadway pipeline automatically slows its consumption rate if downstream API providers begin returning rate-limit errors (HTTP 429) to prevent buffer overflows.

Phase 5: Secure Provider Integrations

[ ] Adopt Modern Auth Protocols: Deprecate legacy IMAP/SMTP basic authentication in favor of strict OAuth 2.0 flows.

[ ] Utilize Provider APIs: Connect to Google Workspace via the Gmail API and Microsoft Office 365 via the Microsoft Graph API. Utilize real-time, webhook-based push notifications instead of periodic polling to minimize latency.

[ ] Implement Header-Based Sync: For highly regulated tenants, sync only email headers initially. Only download the full message body via a secondary API call if the header metadata mathematically matches an active sales prospect in the database.

Phase 6: Distributed Rate Limiting

[ ] Establish Hierarchical Throttles: Enforce limits across multiple dimensions simultaneously: Mailbox caps (e.g., 2,000/day for Gmail), Organization totals, Prospect frequency, and specific target Domains.

[ ] Deploy Redis Limiters: Implement Token Bucket or Sliding Window Log algorithms natively within a Redis datastore.

[ ] Execute Server-Side Lua Scripts: Bundle the rate-limiting read, evaluation, increment, and TTL expiration commands into atomic Lua scripts executed directly on the Redis server to prevent race conditions during high concurrency.

Phase 7: Deliverability & Compliance Controls

[ ] Enforce Cryptographic Authentication: Require all tenants to set up SPF, use 2048-bit keys for DKIM, and implement a DMARC policy (progressing from p=none to p=reject).

[ ] Monitor Algorithmic Reputation: Track abuse complaint rates rigorously to keep them well below the 0.3% threshold enforced by major providers like Google and Yahoo.

[ ] Implement Native Unsubscribes: Automatically inject RFC 8058 compliant List-Unsubscribe headers (utilizing the POST method) to enable trusted, one-click unsubscribe buttons in modern email clients.

[ ] Process Bounces Instantly: Parse inbound Non-Delivery Reports (NDRs). Apply exponential backoff retries for soft bounces, and permanently mutate the state to 'Failed' for hard bounces to protect domain reputation.

Phase 8: Engagement Telemetry

[ ] Inject Tracking Pixels: Host 1x1 transparent images on a fast CDN, embedded with unique cryptographic hashes mapped to specific mailings to track email opens.

[ ] Engineer Link Wrapping: Replace raw hyperlinks with tracking URLs that record the interaction before issuing an HTTP 301/302 redirect to the intended destination.

[ ] De-prioritize Open Rates: Adjust business logic to rely less on pixel open tracking as a strict state trigger, mitigating massive false positives generated by enterprise security scanners and Apple's Mail Privacy Protection (MPP) proxy fetching.

Phase 9: AI and Orchestration Upgrades

[ ] Unify Data Layers: Ensure continuous, bidirectional synchronization of first-party engagement data and sequence states with external CRM systems.

[ ] Deploy Next-Gen Orchestration: Build a Next-Gen Orchestration Engine (NGOE) to safely schedule and run complex AI agent tasks asynchronously without blocking standard execution paths.

[ ] Integrate the Model Context Protocol (MCP): Utilize an MCP Gateway to allow secure, standardized communication between central AI agents and distributed enterprise data silos across the tech stack.