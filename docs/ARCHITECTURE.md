# ARCHITECTURE

System design and tech stack rules.

## Overview

This project is a headless REST API for a sales engagement platform (similar to Outreach.io or Apollo). The backend handles user authentication, prospect management, email sequences, activity tracking, and voice agent orchestration.

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

### Telephony & Voice Agent Stack
- **Telephony API:** Azure Communication Services (ACS) Call Automation API
- **Teams Integration:** Teams Phone Extensibility for outbound PSTN calls using Teams Resource Accounts
- **AI/LLM Engine:** GPT-4, Gemini, or equivalent LLM providers
- **Text-to-Speech (TTS):** ElevenLabs or Azure AI Speech for hyper-realistic audio generation
- **Audio Storage:** Cloud Blob Storage (Azure Blob or AWS S3) for .wav/.mp3 voicemail files
- **Message Queues:** Azure Service Bus, AWS SQS, or RabbitMQ as alternatives to Kafka

## Core Data Models

### Users
Sales representatives using the application.
- Email (unique, required)
- Password (hashed with bcrypt)
- Secure login via JWT authentication
- OAuth tokens for provider integrations (Google/Microsoft)
- Microsoft Teams Resource Account Object ID for caller ID

### Prospects
Leads being contacted through email campaigns.
- First Name
- Last Name
- Email Address
- Company Name
- Status (e.g., Uncontacted, Bounced, Replied)
- Phone Number (for voice agent integration)
- Call History and Voicemail Drop Records

### Sequences
Automated email campaigns owned by Users.
- Name (e.g., "Q3 Inbound Leads")
- Belongs to a User (one-to-many relationship)
- Sequence Status (Active, Paused, Completed)

### Sequence Steps
Individual email templates within a Sequence.
- Order (Step 1, Step 2, etc.)
- Delay Days (wait time before sending)
- Subject Template
- Body Template
- Belongs to a Sequence (one-to-many relationship)
- Personalization Waterfall Configuration (enrichment data source hierarchy)

### Email Activities
Tracking table for sent emails.
- Links a Prospect to a Sequence Step
- Status tracking (Pending, Sent, Failed, Bounced)
- Open/Click/Reply tracking via pixels and link wrapping

### Abuse Complaints
Tracks abuse reports from email providers.
- Links to Prospect
- Bento identifier for multi-tenant isolation
- Timestamp of complaint
- Provider source (Google, Yahoo, etc.)

### Tracking Pixel Events
Records email open events via tracking pixels.
- Links to Prospect
- Bento identifier for multi-tenant isolation
- Tracking pixel data (cryptographic hash, timestamp, user agent)
- Sequence Step correlation

### Voice Agent Calls
Tracks autonomous voice agent interactions.
- Links to Prospect
- Call Status (Queued, Dialing, Connected, Voicemail Dropped, Human Answered)
- Pre-generated Script Content
- TTS Audio File URL
- Call Transcript and Sentiment Analysis
- Teams Resource Account Object ID used

## Architecture Decisions

1. **Database Migration:** Migrating from MongoDB to PostgreSQL with Prisma ORM
2. **Authentication:** All protected routes require valid JWT tokens
3. **API Design:** RESTful endpoints for CRUD operations on Users, Prospects, Sequences, and Voice Agent Calls
4. **Future Work:** Email-sending cron jobs and SMTP connections are out of scope for MVP
5. **Voice Agent Integration:** Azure ACS Call Automation API for Teams-native outbound calling with voicemail drop

## Multi-Tenant Infrastructure (Phase 2)

### Cell-Based Sharding
- Partition compute instances, databases, and message brokers into isolated "Bentos" (cells)
- Prevent noisy neighbor problems from impacting the global customer base
- Geographic routing for data residency compliance (GDPR)
- Schema-based sharding with modulo operation for shard selection

### Schema Tagging
- Core database tables include explicit metadata columns (e.g., BENTO string column)
- Enables analytics pipelines to aggregate reporting across disparate data centers
- SchemaTag field in core models for additional categorization

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
- Alternative brokers: Azure Service Bus, AWS SQS, RabbitMQ for voice agent call queues

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
- Azure Communication Services for telephony integration

### Real-Time Sync
- Webhook-based push notifications instead of periodic polling
- Header-based sync for regulated tenants: sync email headers initially, download full body only if metadata matches active prospect

### Teams Phone Integration
- Use onBehalfOf parameter with Microsoft Entra Object ID for Teams Resource Account caller ID
- Native STIR/SHAKEN compliance handled by Microsoft backend
- Implement strict dialing rate limits to prevent "Spam Risk" flags from carriers

## Rate Limiting (Phase 6)

### Hierarchical Throttles
- Mailbox caps (e.g., 2,000/day for Gmail)
- Organization totals
- Prospect frequency limits
- Target domain limits
- Voice agent call rate limits per Teams phone number

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
- Monitor algorithmic reputation across mail providers

### Unsubscribe & Bounce Handling
- RFC 8058 compliant List-Unsubscribe headers (POST method)
- Parse inbound Non-Delivery Reports (NDRs)
- Exponential backoff retries for soft bounces
- Permanent 'Failed' state mutation for hard bounces

## Engagement Telemetry (Phase 8)

### Tracking Pixels
- Host 1x1 transparent images on fast CDN
- Embed unique cryptographic hashes mapped to specific mailings
- Track email opens with prospect and sequence step correlation

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

### Voice Agent Workflow
- **Pre-Flight Check:** Context gathering from CRM, LLM script generation, TTS audio file creation
- **Auto-Dialer:** Queue-based call initiation via ACS CreateCall endpoint
- **Answering Machine Detection (AMD):** Voicemail tone detection and voicemail drop execution
- **Human Answer Handling:** AddParticipant command to bridge call to sales agent's Teams client
- **Fallback Audio:** Generic pre-recorded audio URL ready if TTS generation fails

## Application Decomposition Strategy (Phase 1)

### Strangler Fig Pattern
- Incrementally extract domains from legacy monoliths into dedicated microservices
- Start with settings and configurations as initial autonomous services

### Data Consistency During Migration
- Implement double-write strategy to keep legacy databases and new microservice datastores synchronized
- Ensure zero-downtime migration path

## Sales Activity & Engagement Metrics

### Activity Metrics
- Total emails sent, calls made, meetings scheduled, follow-ups completed
- Leaderboards based on quota attainment and activity volume

### Engagement Rates
- Open rates, click-through rates, reply rates across email sequences
- AI-driven classification of email replies (positive, objection, referral, unsubscribe)

## Pipeline Management & Forecasting

### Pipeline Movement
- Track deals shifting week-by-week (progressed, added, pushed, lost)

### AI Projections
- Machine learning models predicting quarterly performance based on historical win rates and seasonality

### Quota Attainment
- Visual progress tracking toward individual, team, or company-wide revenue goals

### Pipeline Coverage
- Ratio of potential revenue in pipeline compared to actual revenue target

## Deal Health & Performance

### Deal Health Scores
- Automated scoring flagging at-risk deals based on prospect engagement and momentum

### Top Opportunities
- Prioritized list of high-value deals nearing close dates

### Win/Loss Modeling
- Conversion rates analyzed by sales stage or forecast category

## UI/UX: Agentic Command Center

### Core Architecture & Navigation
- Hybrid interface merging natural language chat with visual workflow canvases
- Progressive Disclosure across three interaction layers:
  - **Layer 1 (Discovery & Intent):** Conversational chat console for workflow initiation
  - **Layer 2 (Activation & Rule Building):** Dynamically generated UI components for logic rules
  - **Layer 3 (Execution & Deep Dive):** Infinite drag-and-drop visual workflow canvas

### Conversational Filtering System
- Dynamic UI generation based on user text prompts
- Intent-driven shortcuts and predictive search
- Visual filter chips for active constraints

### Mass Email Sequencing & Deliverability
- Personalization Waterfall: Visual hierarchy for enrichment data sources (Fundraising News > LinkedIn Posts > Technographic Data)
- Dynamic Generative Copy: AI-drafted emails with tone controls (Direct, Professional, Sincere)
- Deliverability Gate Dashboard: Data quality verification, send limits, domain health monitoring

### Prospect Calling & Voice Agents
- 30-Second Pre-Call Brief Dashboard with AI-generated call goals and talk tracks
- Autonomous Voice Agent Fleet Command for real-time monitoring
- Real-time text transcripts and parallel sentiment analysis
- Visual flags for calls hitting resistance or regulatory edge cases

### Human-in-the-Loop (HITL) Workflow
- **Confidence Score Routing:**
  - High Confidence (>85%): Solid green progress bar/checkmark, AI executes autonomously
  - Moderate Confidence (70-84%): Amber/yellow warning tooltip, action paused and routed to review queue
  - Low Confidence (<70%): Red alert icon, workflow halts with high-priority supervisor notifications
- **Split-Pane Review Interface:**
  - Left Rail: Paginated list of pending tasks sorted by urgency or pipeline value
  - Center Pane: Contextual record (enriched profiles, past emails, raw call transcripts, audio controls)
  - Right Pane: Agentic action panel with AI summary, drafted response, and accept/reject/inline-edit controls

### System Resilience & Transparency
- **Temporal State Management:** Durable workflow objects for paused workflows that resume exactly where left off
- **Real-Time Reasoning Logs:** Step-by-step visual timeline explaining agent chain-of-thought (e.g., Searched CRM → Found no activity → Queried web → Drafted email)
- **Dynamic Knowledge Graphs:** On-the-fly node visualizations mapping prospect, corporate hierarchy, and inferred pain points
- **Natural Language Guardrails:** Governance environment where admins type policy directives translated into executable middleware constraints

### Omnichannel Integration
- Embedded Command Centers in Slack and Microsoft Teams
- Interactive Notifications for approval workflows within chat threads (Approve, Reject, Modify)

## Immediate Goals (MVP)

1. Complete Prisma/Postgres schema implementation
2. Build standard CRUD routes for:
   - Users (with authentication)
   - Prospects
   - Sequences (including Sequence Steps)
3. Ensure all protected routes use JWT validation
4. Establish foundation for future microservices migration (Strangler Fig pattern)
5. Implement Abuse Complaints and Tracking Pixel Events models for telemetry tracking
6. Prepare data models for Voice Agent Calls integration (Phase 5+)
