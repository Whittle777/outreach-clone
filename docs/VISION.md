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


#UI/UX Specification: Agentic Command Center for Sales Workflows

1. Core Architecture & Navigation
The foundational environment is a hybrid "Agentic Command Center" that merges natural language chat with visual workflow canvases, governed by the principle of Progressive Disclosure across three interaction layers:

Layer 1: Discovery & Intent

Interface: Centralized conversational chat console.

Functionality: Processes natural language prompts to initiate workflows.

Display: Lightweight metadata (intent confirmation, audience size, objective summary).

Layer 2: Activation & Rule Building

Interface: Dynamically generated UI components .

Functionality: Translates chat prompts into structured, editable logic rules.

Display: On-the-fly sliders, toggle switches, and drop-down menus based on context.

Layer 3: Execution & Deep Dive

Interface: Infinite, drag-and-drop visual workflow canvas .

Functionality: Maps multi-agent routing paths and API integrations.

Display: Nodes representing agentic actions and edges representing data flow/conditional logic.

2. Conversational Filtering System
Replaces traditional static database querying with an intelligent, conversational interface.

Dynamic UI Generation: Instantly renders visual controls (e.g., a slider preset to a requested value) directly in the chat based on user text.

Intent-Driven Shortcuts: Proactively surfaces relevant suggestions (e.g., related case studies or product matches) based on the context of the query.

Predictive Search & Context Maintenance: Retains previous constraints during multi-turn conversations.

Visual Filter Chips: Uses sticky tags to display active constraints, ensuring the user's view of the data table is never obscured.

3. Mass Email Sequencing & Deliverability
Empowers users to define strategic narratives while the AI handles hyper-personalization and infrastructure safety.

The Sequence Builder
Personalization Waterfall: A visual, drag-and-drop hierarchy  where users rank enrichment data sources (e.g., Fundraising News > LinkedIn Posts > Technographic Data). The AI evaluates these top-down to find the first viable personalization hook.

Dynamic Generative Copy: AI drafts structurally unique emails for every recipient based on core intent rules and selectable tone controls (Direct, Professional, Sincere), avoiding spam filter "snowshoeing."

Deliverability Gate Dashboard
A mandatory programmatic gatekeeper displayed before any sequence goes live.

Data Quality Verification: Progress bar showing the percentage of verified emails vs. suppressed contacts (bounces, honeypots).

Dynamic Send Limits: Real-time speedometer/line chart visualizing active send volume against AI-calculated safe thresholds.

Domain Health Monitoring: Traffic-light indicators (Green/Yellow/Red) for critical DNS records (SPF, DKIM, DMARC).

AI Email Warmup Status: Dedicated panel showing the ratio of outbound emails to automated warmup interactions.

4. Prospect Calling & Voice Agents
Supports both human-led synchronous calling and fully autonomous top-of-funnel voice agents.

30-Second Pre-Call Brief Dashboard: An ephemeral UI triggered before scheduled calls, replacing manual research with synthesized bullet points:

Algorithmically recommended definitive call goal.

Omnichannel context summary (recent website visits, opened emails).

AI-generated, tailored discovery questions and talk tracks.

Autonomous Voice Agent Fleet Command: A live monitoring dashboard for observing simultaneous AI calls. Features include real-time text transcripts, parallel sentiment analysis, and visual flags for calls hitting resistance or regulatory edge cases.

5. Human-in-the-Loop (HITL) Workflow
A structured intervention system to handle edge cases without bottlenecking automation.

Confidence Score Routing
High Confidence (>85%): Solid green progress bar/checkmark. AI executes autonomously and logs the action.

Moderate Confidence (70% - 84%): Amber/yellow warning tooltip. Action is paused and routed to the review queue.

Low Confidence (<70%): Red alert icon. Workflow halts and high-priority notifications are dispatched to supervisors.

Split-Pane Review Interface
A unified, three-zone layout designed to eliminate context-switching :

Left Rail (Review Queue): Paginated list of pending tasks sorted by urgency or pipeline value.

Center Pane (Contextual Record): Displays exact source material (enriched profiles, past emails, raw call transcripts, audio controls).

Right Pane (Agentic Action Panel): Concise AI summary, drafted response, and tactile controls to accept, reject, or inline-edit the AI's proposal.

6. System Resilience & Transparency
Ensures the system remains understandable, trustworthy, and stable.

Temporal State Management: Decouples the UI from the background engine. Paused workflows are saved as durable objects so tasks can resume exactly where they left off without redundant API calls.

Real-Time Reasoning Logs: A step-by-step visual timeline explaining the agent's chain-of-thought (e.g., Searched CRM -> Found no activity -> Queried web -> Drafted email).

Dynamic Knowledge Graphs: On-the-fly node visualizations mapping the prospect, corporate hierarchy, and inferred pain points to prove the AI's logic .

Natural Language Guardrails: A governance environment where admins can type strict policy directives (e.g., "Never offer >15% discount without approval"), which the system instantly translates into executable middleware constraints.

7. Omnichannel Integration
Embedded Command Centers: Deep integrations with enterprise tools like Slack and Microsoft Teams.

Interactive Notifications: Allows managers to review low-confidence alerts and click "Approve," "Reject," or "Modify" directly within a chat thread without logging into a separate web portal. 


CONNECTS TO MICROSOFT TEAMS CALLING PHONE NUMBERS - ALLOWS DIALING - including auto dialing - and leaving auto voicemail recordings feature - option for agentic voicemail recording generation before call is made

1. The Core Technology Stack
Telephony & Teams Interoperability: Azure Communication Services (ACS) Call Automation API. This is Microsoft’s CPaaS (Communication Platform as a Service) solution. It shares the same backend as Teams and natively supports "Teams Phone Extensibility," allowing your app to make outbound PSTN calls using Teams resource accounts and caller IDs.

AI/Agentic Engine: An LLM (like GPT-4 or Gemini) paired with a high-fidelity Text-to-Speech (TTS) API (like ElevenLabs or Azure AI Speech).

Backend & Queueing: An event-driven backend (Node.js, Python, or Go) combined with a robust message broker (Azure Service Bus, AWS SQS, or RabbitMQ) to handle the auto-dialing queue without hitting API rate limits.

Storage: Cloud Blob Storage (Azure Blob or AWS S3) to host the generated .wav or .mp3 voicemail files.

2. Step-by-Step Implementation Flow
Here is how you stitch these components together into a functional platform:

Step A: Agentic Voicemail Generation (The "Pre-Flight" Check)
Before the dialer ever picks up the phone, the system prepares the payload.

Context Gathering: Your CRM passes the prospect's data (name, company, recent LinkedIn post, etc.) to the AI backend.

Scripting: The LLM generates a highly contextual, 20-30 second script tailored specifically to that prospect.

Audio Generation: The script is sent to your TTS provider (e.g., ElevenLabs) to generate a hyper-realistic audio file.

Storage: The audio file is saved to your Blob Storage, generating a publicly accessible (but obfuscated) URL to be used later.

Step B: The Auto-Dialer & Teams Integration
Instead of manual dialing, your worker nodes pull leads from the queue and initiate calls programmatically.

Initiate Call: Your backend triggers the ACS Call Automation CreateCall endpoint.

Teams Caller ID: You use the onBehalfOf parameter in the API, passing the Microsoft Entra Object ID of your Teams Resource Account. This ensures the outbound call displays your company's official Teams phone number/Caller ID to the prospect.

Scale: Because dialing is decoupled into a message queue, you can easily spin up more worker nodes to increase the Calls-Per-Second (CPS) rate, pausing automatically if you hit carrier rate limits.

Step C: Answering Machine Detection (AMD) & Voicemail Drop
When the call connects, ACS Call Automation sends a CallConnected webhook event to your backend. Now, your system needs to listen.

Call Progress Analysis: You utilize AMD to determine if a human or a machine answered the phone.

If a Voicemail Answers: The system waits for the tone. Once the beep is detected, your backend fires the Play action via the ACS API, passing the Blob Storage URL of your pre-generated "agentic" audio file. Once the audio finishes, the API hangs up the call.

If a Human Answers: Your system immediately fires the AddParticipant command. This bridges the call directly to your sales agent's Microsoft Teams client in real-time. A screen-pop in your CRM can simultaneously show the agent who they are talking to.

3. How to Make it Robust & Scalable
Asynchronous Webhooks: Telephony is notoriously stateful, which makes scaling hard. ACS Call Automation relies on webhooks (Azure Event Grid). Your app should be entirely stateless—merely receiving an event (e.g., RecognizeCompleted, PlayFailed), looking up the call's state in a fast database like Redis, and executing the next command.

STIR/SHAKEN Compliance: Because you are using Teams phone numbers natively via ACS, Microsoft handles much of the underlying carrier compliance. However, you must implement strict dialing rate limits in your queue to prevent your Teams numbers from being flagged as "Spam Risk" by downstream carriers.

Fallback Audio: If the TTS engine fails to generate the agentic voicemail in time, your database should always have a "fallback" generic pre-recorded audio URL ready to inject so you don't leave dead air on a prospect's voicemail. . .





Coding principles:
        Strict Type Safety: Utilization of static typing or comprehensive type hinting to catch structural errors at compile-time rather than run-time.

        Centralized Error Handling and Logging: Standardized exception management and structured, searchable logs (e.g., JSON format) to rapidly diagnose production issues.

        Modular, Loosely Coupled Architecture: adherence to principles like SOLID and Dependency Injection, ensuring that changes or failures in one module do not cascade through the entire system.

        Comprehensive Documentation: Up-to-date READMEs, architectural decision records (ADRs), and auto-generated API specifications (like Swagger/OpenAPI) to ensure knowledge is shared and persistent.

        Graceful Degradation and Resiliency: Fallback mechanisms, retries, and rate limiting that allow the system to remain partially operational even when external services fail.




I want to be able to test this program easily and with an email provider other than Outlook - like my personal gmail account


Human-in-the-Loop Interface: A dedicated oversight portal where human AEs can provide contextual feedback, correct AI drafts, and prevent algorithmic hallucinations before external communications are sent.