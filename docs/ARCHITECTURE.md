# ARCHITECTURE

System design and tech stack rules.

## Overview

This project is a headless REST API for a sales engagement platform (similar to Outreach.io or Apollo). The backend handles user authentication, prospect management, email sequences, activity tracking, voice agent orchestration, AI-driven workflow automation, and natural language query processing.

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

### AI & Orchestration Stack
- **Next-Gen Orchestration Engine (NGOE):** Async scheduling and execution of complex AI agent tasks without blocking standard paths
- **Model Context Protocol (MCP):** MCP Gateway for secure, standardized communication between central AI agents and distributed enterprise data silos
- **AI Classification:** Buyer sentiment analysis (positive, objection, referral, unsubscribe) via LLM
- **Natural Language Querying (NLQ):** Translation of conversational prompts into complex database queries (SQL/GraphQL)
- **Agentic Reasoning Engine:** Autonomous fallback logic for handling missing or messy data with third-party enrichment

### Testing & Development Stack
- **Email Provider Flexibility:** Support for multiple email providers including Gmail (personal accounts) and Outlook for testing
- **Configuration Management:** Environment-based provider switching to enable easy testing with different SMTP/API credentials
- **Thorough Testing Requirements:** ALL features must be thoroughly tested before deployment, including voice agent functionality

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
- Country/Region for GDPR compliance
- Tags for categorization and filtering

### Sequences
Automated email campaigns owned by Users.
- Name (e.g., "Q3 Inbound Leads")
- Belongs to a User (one-to-many relationship)
- Sequence Status (Active, Paused, Completed)
- Bento identifier for multi-tenant isolation
- SchemaTag for categorization

### Sequence Steps
Individual email templates within a Sequence.
- Order (Step 1, Step 2, etc.)
- Delay Days (wait time before sending)
- Subject Template
- Body Template
- Belongs to a Sequence (one-to-many relationship)
- Personalization Waterfall Configuration (enrichment data source hierarchy)
- Bento identifier for multi-tenant isolation
- SchemaTag for categorization

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

### Sentiment Analysis
AI-driven classification of prospect interactions.
- Links to Prospect or Voice Agent Call
- Sentiment Score (numerical value)
- Sentiment Label (positive, objection, referral, unsubscribe)
- Metadata for context
- Country/Region for GDPR compliance

### AudioFile
Stores metadata for generated audio files.
- File Name
- File Type (.wav, .mp3)
- Storage URL (Blob Storage)
- Associated Prospect or Call
- Country/Region for GDPR compliance
- Generation Timestamp

### DealHealthScore
Automated scoring system for deal health assessment.
- Score Value (0-100)
- Status Classification (High, Medium, Low)
- Metadata for calculation factors
- Calculation Timestamp
- Associated Prospect or Opportunity

### TaskQueue
Dynamic task playlists generated from natural language queries.
- Task ID
- Linked Prospect(s)
- Task Type (Call, Email, Meeting, etc.)
- Priority/Urgency Score
- Status (Pending, In Progress, Completed)
- Generated From Prompt (NLQ source)
- AI Confidence Score
- Human Review Required Flag
- Sequential Completion Tracking (for auto-advance to next task)
- Auto-Advance Workflow Support (next task automatically shows after completion)

### NaturalLanguageQueryLog
Records of natural language prompts and their resolved queries.
- User ID
- Original Prompt Text
- Resolved Query Parameters
- Execution Timestamp
- Result Count
- Fallback Logic Applied (if any)

### TimeBlockConfig
Configuration for scheduling time blocks and approved calling hours.
- Start Time
- End Time
- Days of Week (array)
- Holiday Exclusions
- User/Team Association
- Bento identifier for multi-tenant isolation
- Active Status

### QuarterlyPerformance
Tracks quarterly performance metrics for teams and individuals.
- Quarter Identifier
- Team/User Association
- Revenue Target
- Actual Revenue
- Quota Attainment Percentage
- Activity Metrics (emails sent, calls made, meetings scheduled)
- Calculation Timestamp

### QuarterlyPerformancePredictor
Machine learning model predictions for quarterly outcomes.
- Model Version
- Historical Data Reference
- Predicted Revenue
- Confidence Interval
- Seasonality Factors
- Prediction Timestamp
- Bento identifier for multi-tenant isolation

### BounceEvent
Records email bounce events with classification.
- Links to Prospect and Email Activity
- Bounce Type (Hard, Soft)
- Bounce Reason Code
- Provider Source
- Timestamp
- Retry Count (for soft bounces)
- Permanent Failure Flag

## Architecture Decisions

1. **Database Migration:** Migrating from MongoDB to PostgreSQL with Prisma ORM
2. **Authentication:** All protected routes require valid JWT tokens
3. **API Design:** RESTful endpoints for CRUD operations on Users, Prospects, Sequences, and Voice Agent Calls
4. **Future Work:** Email-sending cron jobs and SMTP connections are out of scope for MVP
5. **Voice Agent Integration:** Azure ACS Call Automation API for Teams-native outbound calling with voicemail drop
6. **Multi-Tenant Isolation:** Cell-based sharding with Bento identifiers to prevent noisy neighbor problems
7. **GDPR Compliance:** All data models include country/region fields and GDPR compliance checks before data operations
8. **Natural Language Querying:** Conversational prompts translated into database queries with agentic fallback logic
9. **Dynamic Task Generation:** AI-driven creation of actionable task playlists from query results

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

### Natural Language Querying (NLQ) Workflow
- **Prompt Processing:** User enters natural language query (e.g., "show me prospects in the US and Canada")
- **Query Translation:** LLM converts prompt to database query parameters
- **Agentic Reasoning:** If data is missing or incomplete, agent autonomously finds alternative filters
  - Example: If Country field is blank, filter by phone number country code (+1)
  - Example: Query third-party enrichment APIs (ZoomInfo, BuiltWith) for missing tech stack data
  - Example: Filter by tags if direct country/region info unavailable
  - Example: Use deductive proxies (job postings mentioning AI = likely AI adopter)
- **Fallback Logic:** Multiple fallback strategies applied sequentially until viable results found
- **Task Queue Generation:** Results compiled into ordered, actionable task playlist

### Dynamic Task Queue System
- **Task Playlist Creation:** Instant compilation of query results into prioritized task list
- **UI State Control:** AI actively changes interface to "execution mode" with split-pane view
- **Easy Completion Workflow:** List of calls/tasks that can be completed sequentially with next item auto-showing
- **Natural Language to UI State:** Autonomous agent powers workflow from prompt to actionable interface
- **Auto-Advance Feature:** Upon task completion, system automatically displays next pending task without user navigation

### Persona & Tech-Stack Targeting
- **Title Filtering:** Search for titles containing specific keywords (e.g., "VP," "Vice President," "Head of")
- **Tech Stack Detection:** API calls to providers like ZoomInfo or BuiltWith for company technology stack
- **Negative Filtering:** Exclude companies with recent AI-related press releases or job postings
- **Dynamic Script Generation:** Call scripts automatically populated with prospect-specific context

### Personalization Waterfall
- **Visual Hierarchy:** Drag-and-drop interface for ranking enrichment data sources
- **Priority Order:** Fundraising News > LinkedIn Posts > Technographic Data > Company Website > Social Media
- **Top-Down Evaluation:** AI evaluates sources sequentially to find first viable personalization hook
- **Fallback Mechanism:** If no personalization found, use generic template with basic prospect info

### Dynamic Generative Copy
- **AI-Drafted Emails:** Structurally unique emails for every recipient based on core intent rules
- **Tone Controls:** Selectable tone options (Direct, Professional, Sincere)
- **Spam Filter Avoidance:** Avoid "snowshoeing" by generating diverse content structures

### Deliverability Gate Dashboard
- **Data Quality Verification:** Progress bar showing percentage of verified emails vs. suppressed contacts (bounces, honeypots)
- **Dynamic Send Limits:** Real-time speedometer/line chart visualizing active send volume against AI-calculated safe thresholds
- **Domain Health Monitoring:** Traffic-light indicators (Green/Yellow/Red) for critical DNS records (SPF, DKIM, DMARC)
- **AI Email Warmup Status:** Dedicated panel showing ratio of outbound emails to automated warmup interactions

### 30-Second Pre-Call Brief Dashboard
- **Ephemeral UI:** Triggered before scheduled calls, replaces manual research with synthesized bullet points
- **Algorithmically Recommended Call Goal:** AI-suggested definitive objective for the call
- **Omnichannel Context Summary:** Recent website visits, opened emails, engagement history
- **AI-Generated Discovery Questions:** Tailored talk tracks and conversation starters

### Autonomous Voice Agent Fleet Command
- **Live Monitoring Dashboard:** Real-time observation of simultaneous AI calls
- **Real-Time Text Transcripts:** Live transcription of call conversations
- **Parallel Sentiment Analysis:** Continuous sentiment tracking during calls
- **Visual Flags:** Indicators for calls hitting resistance or regulatory edge cases

## Predictive Dialer System (Phase 9+)

### Predictive Pacing Engine
- Core algorithm processing real-time metrics: Average Handle Time (AHT), live-connect rates
- Dynamically calculates optimal number of simultaneous lines per available agent
- Adjusts dialing speed based on agent availability and call outcomes
- Real-time calculation of dial-to-agent ratios based on historical performance data

### Compliance & Abandonment Safeguards
- TCPA standards compliance with automatic throttling if dropped-call rate approaches 3% threshold
- Automatic Do Not Call (DNC) list scrubbing before dialing
- Real-time monitoring of abandonment rates with emergency stop mechanisms
- Maximum ring time configuration per campaign to prevent excessive wait times

### Administrative Tuning Dashboard
- Human-in-the-loop control panel for sales managers
- Set hard limits on dial-to-agent ratios
- Customize maximum ring times per campaign
- Manual override capability for algorithm pacing on high-priority campaigns
- Real-time metrics display: current CPS, abandonment rate, agent utilization

### Answering Machine Detection (AMD)
- AI-driven audio analysis operating in milliseconds
- Distinguishes between live human voices, voicemails, busy signals, and disconnected numbers
- Ensures only live connections are routed to sales floor
- Voicemail tone detection with configurable sensitivity thresholds

### Bi-Directional CRM Integration
- Seamless API connectivity via Webhooks or RESTful APIs
- Automatically pulls lead lists from CRM
- Pushes call dispositions and recordings back to CRM
- Instantly triggers "screen pops" displaying prospect profile as call connects
- Real-time synchronization of call status and outcomes

## Human-in-the-Loop (HITL) Workflow

### Confidence Score Routing
- **High Confidence (>85%):** Solid green progress bar/checkmark, AI executes autonomously and logs action
- **Moderate Confidence (70-84%):** Amber/yellow warning tooltip, action paused and routed to review queue
- **Low Confidence (<70%):** Red alert icon, workflow halts with high-priority supervisor notifications
- Configurable thresholds per organization or campaign

### Split-Pane Review Interface
- **Left Rail (Review Queue):** Paginated list of pending tasks sorted by urgency or pipeline value
- **Center Pane (Contextual Record):** Displays exact source material (enriched profiles, past emails, raw call transcripts, audio controls)
- **Right Pane (Agentic Action Panel):** Concise AI summary, drafted response, and tactile controls to accept, reject, or inline-edit

### Oversight Portal
- Dedicated interface for human Account Executives to provide contextual feedback
- Correct AI drafts before external communications are sent
- Prevent algorithmic hallucinations in customer-facing content
- Audit trail of all human interventions and corrections

## System Resilience & Transparency

### Temporal State Management
- Decouples UI from background engine
- Paused workflows saved as durable objects
- Tasks resume exactly where left off without redundant API calls

### Real-Time Reasoning Logs
- Step-by-step visual timeline explaining agent's chain-of-thought
- Example: Searched CRM → Found no activity → Queried web → Drafted email
- Provides transparency into AI decision-making process

### Dynamic Knowledge Graphs
- On-the-fly node visualizations mapping prospect relationships
- Corporate hierarchy visualization
- Inferred pain points and connection mapping
- Proves AI's logic through visual representation

### Natural Language Guardrails
- Governance environment where admins type strict policy directives
- Example: "Never offer >15% discount without approval"
- System instantly translates into executable middleware constraints
- Prevents unauthorized actions through natural language policies

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
- Score calculation factors: status (Engaged = +20), recent activity, etc.
- Status classification: High (≥80), Medium (50-79), Low (<50)

### Top Opportunities
- Prioritized list of high-value deals nearing close dates

### Win/Loss Modeling
- Conversion rates analyzed by sales stage or forecast category

## UI/UX: Agentic Command Center

### Core Architecture & Navigation
- Hybrid interface merging natural language chat with visual workflow canvases
- Progressive Disclosure across three interaction layers:
  - **Layer 1 (Discovery & Intent):** Conversational chat console for workflow initiation
    - Centralized conversational chat console
    - Processes natural language prompts to initiate workflows
    - Displays lightweight metadata (intent confirmation, audience size, objective summary)
  - **Layer 2 (Activation & Rule Building):** Dynamically generated UI components for logic rules
    - On-the-fly sliders, toggle switches, and drop-down menus based on context
    - Translates chat prompts into structured, editable logic rules
  - **Layer 3 (Execution & Deep Dive):** Infinite drag-and-drop visual workflow canvas
    - Maps multi-agent routing paths and API integrations
    - Nodes representing agentic actions and edges representing data flow/conditional logic

### Conversational Filtering System
- Dynamic UI generation based on user text prompts
- Intent-driven shortcuts and predictive search
- Visual filter chips for active constraints
- Sticky tags to display active constraints without obscuring data table view
- Predictive search with context maintenance across multi-turn conversations

### Omnichannel Integration
- Embedded Command Centers in Slack and Microsoft Teams
- Interactive Notifications for approval workflows within chat threads (Approve, Reject, Modify)
- Allows managers to review low-confidence alerts without logging into separate web portal

## Coding Principles

### Strict Type Safety
- Utilization of static typing or comprehensive type hinting to catch structural errors at compile-time rather than run-time

### Centralized Error Handling and Logging
- Standardized exception management and structured, searchable logs (e.g., JSON format) to rapidly diagnose production issues

### Modular, Loosely Coupled Architecture
- Adherence to principles like SOLID and Dependency Injection, ensuring that changes or failures in one module do not cascade through the entire system

### Comprehensive Documentation
- Up-to-date READMEs, architectural decision records (ADRs), and auto-generated API specifications (like Swagger/OpenAPI) to ensure knowledge is shared and persistent
- **UI Navigation Paths:** All UI navigation paths must be detailed in README with comprehensive user flows including:
  - Layer 1 to Layer 3 progression paths
  - Task queue completion workflow navigation
  - HITL review interface navigation
  - Dashboard access paths (Deliverability Gate, Pre-Call Brief, Voice Agent Fleet Command)
  - Natural language query to task execution flow

### Graceful Degradation and Resiliency
- Fallback mechanisms, retries, and rate limiting that allow the system to remain partially operational even when external services fail

## Microsoft Teams Calling Integration Details

### Core Technology Stack
- **Telephony & Teams Interoperability:** Azure Communication Services (ACS) Call Automation API - Microsoft's CPaaS solution sharing backend with Teams
- **Teams Phone Extensibility:** Native support for outbound PSTN calls using Teams Resource Accounts and caller IDs
- **AI/Agentic Engine:** LLM (GPT-4, Gemini) paired with high-fidelity Text-to-Speech (TTS) API (ElevenLabs or Azure AI Speech)
- **Backend & Queueing:** Event-driven backend (Node.js, Python, or Go) with message broker (Azure Service Bus, AWS SQS, RabbitMQ) for auto-dialing queue management
- **Storage:** Cloud Blob Storage (Azure Blob or AWS S3) for generated .wav or .mp3 voicemail files

### Implementation Flow

#### Step A: Agentic Voicemail Generation (Pre-Flight Check)
- **Context Gathering:** CRM passes prospect data (name, company, recent LinkedIn post, etc.) to AI backend
- **Scripting:** LLM generates highly contextual 20-30 second script tailored to prospect
- **Audio Generation:** Script sent to TTS provider for hyper-realistic audio file generation
- **Storage:** Audio file saved to Blob Storage with publicly accessible (obfuscated) URL

#### Step B: Auto-Dialer & Teams Integration
- **Initiate Call:** Backend triggers ACS Call Automation CreateCall endpoint
- **Teams Caller ID:** Use onBehalfOf parameter with Microsoft Entra Object ID of Teams Resource Account for official caller ID display
- **Scale:** Decoupled message queue enables scaling worker nodes to increase Calls-Per-Second (CPS) rate with automatic pausing on carrier rate limits

#### Step C: Answering Machine Detection (AMD) & Voicemail Drop
- **Call Connected Webhook:** ACS sends CallConnected webhook event to backend
- **Call Progress Analysis:** Utilize AMD to determine human vs. machine answer
- **Voicemail Path:** Wait for tone, detect beep, fire Play action via ACS API with pre-generated audio URL, then hang up
- **Human Path:** Fire AddParticipant command to bridge call to sales agent's Microsoft Teams client in real-time with CRM screen-pop

### Robustness & Scalability
- **Asynchronous Webhooks:** Stateless app design receiving events (RecognizeCompleted, PlayFailed) via Azure Event Grid, looking up call state in Redis
- **STIR/SHAKEN Compliance:** Microsoft handles carrier compliance via Teams phone numbers; implement strict dialing rate limits to prevent "Spam Risk" flags
- **Fallback Audio:** Database maintains generic pre-recorded audio URL for TTS generation failures

## Testing & Development Requirements

### Email Provider Flexibility
- Support testing with multiple email providers (Gmail, Outlook, etc.)
- Environment-based configuration for SMTP/API credentials
- Easy switching between personal Gmail accounts and production providers
- **Thorough Testing:** ALL features must be thoroughly tested before deployment, including voice agent functionality

### Comprehensive Feature Testing
- **Voice Agent Functionality:** End-to-end testing of auto-dialer, AMD, voicemail drop, and human routing
- **Natural Language Querying:** Test NLQ with various prompts including edge cases requiring fallback logic
- **Task Queue Auto-Advance:** Verify sequential task completion workflow functions correctly
- **Predictive Dialer:** Test pacing engine, compliance safeguards, and abandonment rate monitoring
- **HITL Workflow:** Validate confidence score routing and split-pane review interface
- **Dashboard Features:** Test all dashboard components (Deliverability Gate, Pre-Call Brief, Voice Agent Fleet Command)
- **Multi-Tenant Isolation:** Verify Bento cell isolation prevents cross-tenant data leakage
- **GDPR Compliance:** Test country/region filtering and data residency compliance

### GDPR Compliance
- All data models include country/region fields for data residency compliance
- GDPR compliance checks before data operations in controllers and models
- Data processing consent tracking

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
7. Support multi-tenant isolation with Bento identifiers in core models
8. Enable schema tagging for analytics aggregation across data centers
9. Add Sentiment Analysis, AudioFile, and DealHealthScore models for AI-driven features
10. Implement GDPR compliance checks across all data operations
11. Enable flexible email provider testing configuration (Gmail, Outlook)
12. Add TaskQueue model for dynamic task playlist generation from natural language queries
13. Implement NaturalLanguageQueryLog for tracking prompt-to-query translations
14. Prepare agentic reasoning engine for fallback logic when data is missing or incomplete
15. Support persona and tech-stack targeting with third-party enrichment API integration points
16. Implement Predictive Dialer System with pacing engine, compliance safeguards, and AMD
17. Enable bi-directional CRM integration for lead lists and call disposition tracking
18. Add TimeBlockConfig model for scheduling time blocks and approved calling hours
19. Implement confidence score routing thresholds (>85%, 70-84%, <70%) for HITL workflow
20. Support Natural Language Guardrails for policy directive translation to middleware constraints
21. Enable Dynamic Knowledge Graphs visualization for prospect relationships
22. Implement Real-Time Reasoning Logs for AI chain-of-thought transparency
23. Add Deliverability Gate Dashboard with data quality verification and domain health monitoring
24. Implement Personalization Waterfall hierarchy for enrichment data source ranking
25. Support 30-Second Pre-Call Brief Dashboard with AI-generated call goals and talk tracks
26. Enable Microsoft Teams calling phone number integration with auto-dialing capability
27. Implement agentic voicemail recording generation before calls are made
28. Add support for leaving auto voicemail recordings via ACS Play action
29. Ensure thorough testing of ALL features including voice agent functionality
30. Support human-in-the-loop interface for AE oversight and AI draft correction
31. Enable natural language to UI state workflow with autonomous agent task completion
32. Implement easy task workflow list where completed tasks auto-advance to next item
33. Add support for filtering prospects by tags, ZoomInfo data, and country code fallbacks
34. Ensure all voice agent features are robust and production-ready
35. Implement UI navigation paths documentation in README with detailed user flows
36. Support Layer 1-3 Agentic Command Center interface specifications
37. Enable conversational filtering system with dynamic UI generation
38. Implement split-pane review interface for HITL workflow
39. Add support for administrative tuning dashboard for predictive dialer
40. Ensure ALL features are thoroughly tested before deployment
41. Add QuarterlyPerformance and QuarterlyPerformancePredictor models for forecasting
42. Implement BounceEvent model for email bounce tracking and classification
43. Support task queue auto-advance workflow with sequential completion tracking
44. Enable comprehensive NLQ fallback logic testing with multiple scenarios
45. Document all UI navigation paths including Layer 1-3 progression and dashboard access
