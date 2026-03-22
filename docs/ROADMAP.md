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
- [x] Email-sending cron jobs and SMTP connections (out of scope for MVP)

## New Features (Identified from ARCHITECTURE.md)

- [x] Telephony API: Azure Communication Services (ACS) Call Automation API
- [x] Teams Integration: Teams Phone Extensibility for outbound PSTN calls using Teams Resource Accounts
- [x] AI/LLM Engine: GPT-4, Gemini, or equivalent LLM providers
- [x] Text-to-Speech (TTS): ElevenLabs or Azure AI Speech for hyper-realistic audio generation
- [x] Audio Storage: Cloud Blob Storage (Azure Blob or AWS S3) for .wav/.mp3 voicemail files
- [x] Message Queues: Azure Service Bus, AWS SQS, or RabbitMQ as alternatives to Kafka
- [x] Next-Gen Orchestration Engine (NGOE): Async scheduling and execution of complex AI agent tasks without blocking standard paths
- [x] Model Context Protocol (MCP): MCP Gateway for secure, standardized communication between central AI agents and distributed enterprise data silos
- [x] AI Classification: Buyer sentiment analysis (positive, objection, referral, unsubscribe) via LLM
- [x] Voice Agent Calls: Tracks autonomous voice agent interactions
- [x] Voice Agent Integration: Azure ACS Call Automation API for Teams-native outbound calling with voicemail drop
- [x] Geographic routing for data residency compliance (GDPR)
- [x] Schedule shifting to pause execution outside approved time blocks, weekends, or holidays
- [x] Dynamically shift all subsequent steps forward in time to prevent backlog burst
- [x] Alternative brokers: Azure Service Bus, AWS SQS, RabbitMQ for voice agent call queues
- [x] Teams Phone Integration: Use onBehalfOf parameter with Microsoft Entra Object ID for Teams Resource Account caller ID
- [x] Native STIR/SHAKEN compliance handled by Microsoft backend
- [x] Implement strict dialing rate limits to prevent "Spam Risk" flags from carriers
- [x] Voice agent call rate limits per Teams phone number
- [x] Unsubscribe & Bounce Handling: Exponential backoff retries for soft bounces
- [x] Permanent 'Failed' state mutation for hard bounces
- [x] Real-time text transcripts and parallel sentiment analysis
- [x] Visual flags for calls hitting resistance or regulatory edge cases
- [x] Conversational Filtering System: Dynamic UI generation based on user text prompts
- [x] Intent-driven shortcuts and predictive search
- [x] Visual filter chips for active constraints
- [x] Mass Email Sequencing & Deliverability: Personalization Waterfall, Dynamic Generative Copy, Deliverability Gate Dashboard
- [x] Prospect Calling & Voice Agents: 30-Second Pre-Call Brief Dashboard with AI-generated call goals and talk tracks
- [x] Autonomous Voice Agent Fleet Command for real-time monitoring
- [x] Human-in-the-Loop (HITL) Workflow: Confidence Score Routing, Split-Pane Review Interface
- [x] System Resilience & Transparency: Temporal State Management, Real-Time Reasoning Logs, Dynamic Knowledge Graphs, Natural Language Guardrails
- [x] Omnichannel Integration: Embedded Command Centers in Slack and Microsoft Teams, Interactive Notifications for approval workflows within chat threads (Approve, Reject, Modify)
- [x] Data Consistency During Migration: Implement double-write strategy to keep legacy databases and new microservice datastores synchronized
- [x] Ensure zero-downtime migration path
- [x] Deal Health Scores: Automated scoring flagging at-risk deals based on prospect engagement and momentum
- [x] Top Opportunities: Prioritized list of high-value deals nearing close dates
- [x] Win/Loss Modeling: Conversion rates analyzed by sales stage or forecast category
- [x] AI Projections: Machine learning models predicting quarterly performance based on historical win rates and seasonality

## Newly Added Features

- [x] Text-to-Speech (TTS): ElevenLabs or Azure AI Speech for hyper-realistic audio generation
- [x] Audio Storage: Cloud Blob Storage (Azure Blob or AWS S3) for .wav/.mp3 voicemail files
- [x] Message Queues: Azure Service Bus, AWS SQS, or RabbitMQ as alternatives to Kafka
- [x] Next-Gen Orchestration Engine (NGOE): Async scheduling and execution of complex AI agent tasks without blocking standard paths
- [x] Model Context Protocol (MCP): MCP Gateway for secure, standardized communication between central AI agents and distributed enterprise data silos
- [x] AI Classification: Buyer sentiment analysis (positive, objection, referral, unsubscribe) via LLM
- [x] Voice Agent Calls: Tracks autonomous voice agent interactions
- [x] Voice Agent Integration: Azure ACS Call Automation API for Teams-native outbound calling with voicemail drop
- [x] Geographic routing for data residency compliance (GDPR)
- [x] Schedule shifting to pause execution outside approved time blocks, weekends, or holidays
- [x] Dynamically shift all subsequent steps forward in time to prevent backlog burst
- [x] Alternative brokers: Azure Service Bus, AWS SQS, RabbitMQ for voice agent call queues
- [x] Teams Phone Integration: Use onBehalfOf parameter with Microsoft Entra Object ID for Teams Resource Account caller ID
- [x] Native STIR/SHAKEN compliance handled by Microsoft backend
- [x] Implement strict dialing rate limits to prevent "Spam Risk" flags from carriers
- [x] Voice agent call rate limits per Teams phone number
- [x] Unsubscribe & Bounce Handling: Exponential backoff retries for soft bounces
- [x] Permanent 'Failed' state mutation for hard bounces
- [x] Real-time text transcripts and parallel sentiment analysis
- [x] Visual flags for calls hitting resistance or regulatory edge cases
- [x] Conversational Filtering System: Dynamic UI generation based on user text prompts
- [x] Intent-driven shortcuts and predictive search
- [x] Visual filter chips for active constraints
- [x] Mass Email Sequencing & Deliverability: Personalization Waterfall, Dynamic Generative Copy, Deliverability Gate Dashboard
- [x] Prospect Calling & Voice Agents: 30-Second Pre-Call Brief Dashboard with AI-generated call goals and talk tracks
- [x] Autonomous Voice Agent Fleet Command for real-time monitoring
- [x] Human-in-the-Loop (HITL) Workflow: Confidence Score Routing, Split-Pane Review Interface
- [x] System Resilience & Transparency: Temporal State Management, Real-Time Reasoning Logs, Dynamic Knowledge Graphs, Natural Language Guardrails
- [x] Omnichannel Integration: Embedded Command Centers in Slack and Microsoft Teams, Interactive Notifications for approval workflows within chat threads (Approve, Reject, Modify)
- [x] Data Consistency During Migration: Implement double-write strategy to keep legacy databases and new microservice datastores synchronized
- [x] Ensure zero-downtime migration path
- [x] Deal Health Scores: Automated scoring flagging at-risk deals based on prospect engagement and momentum
- [x] Top Opportunities: Prioritized list of high-value deals nearing close dates
- [x] Win/Loss Modeling: Conversion rates analyzed by sales stage or forecast category
- [x] AI Projections: Machine learning models predicting quarterly performance based on historical win rates and seasonality

## Newly Added Features

- [x] Text-to-Speech (TTS): ElevenLabs or Azure AI Speech for hyper-realistic audio generation
- [ ] Audio Storage: Cloud Blob Storage (Azure Blob or AWS S3) for .wav/.mp3 voicemail files
- [ ] Message Queues: Azure Service Bus, AWS SQS, or RabbitMQ as alternatives to Kafka
- [ ] Next-Gen Orchestration Engine (NGOE): Async scheduling and execution of complex AI agent tasks without blocking standard paths
- [ ] Model Context Protocol (MCP): MCP Gateway for secure, standardized communication between central AI agents and distributed enterprise data silos
- [ ] AI Classification: Buyer sentiment analysis (positive, objection, referral, unsubscribe) via LLM
- [ ] Voice Agent Calls: Tracks autonomous voice agent interactions
- [ ] Voice Agent Integration: Azure ACS Call Automation API for Teams-native outbound calling with voicemail drop
- [ ] Geographic routing for data residency compliance (GDPR)
- [ ] Schedule shifting to pause execution outside approved time blocks, weekends, or holidays
- [ ] Dynamically shift all subsequent steps forward in time to prevent backlog burst
- [ ] Alternative brokers: Azure Service Bus, AWS SQS, RabbitMQ for voice agent call queues
- [ ] Teams Phone Integration: Use onBehalfOf parameter with Microsoft Entra Object ID for Teams Resource Account caller ID
- [ ] Native STIR/SHAKEN compliance handled by Microsoft backend
- [ ] Implement strict dialing rate limits to prevent "Spam Risk" flags from carriers
- [ ] Voice agent call rate limits per Teams phone number
- [ ] Unsubscribe & Bounce Handling: Exponential backoff retries for soft bounces
- [ ] Permanent 'Failed' state mutation for hard bounces
- [ ] Real-time text transcripts and parallel sentiment analysis
- [ ] Visual flags for calls hitting resistance or regulatory edge cases
- [ ] Conversational Filtering System: Dynamic UI generation based on user text prompts
- [ ] Intent-driven shortcuts and predictive search
- [ ] Visual filter chips for active constraints
- [ ] Mass Email Sequencing & Deliverability: Personalization Waterfall, Dynamic Generative Copy, Deliverability Gate Dashboard
- [ ] Prospect Calling & Voice Agents: 30-Second Pre-Call Brief Dashboard with AI-generated call goals and talk tracks
- [ ] Autonomous Voice Agent Fleet Command for real-time monitoring
- [ ] Human-in-the-Loop (HITL) Workflow: Confidence Score Routing, Split-Pane Review Interface
- [ ] System Resilience & Transparency: Temporal State Management, Real-Time Reasoning Logs, Dynamic Knowledge Graphs, Natural Language Guardrails
- [ ] Omnichannel Integration: Embedded Command Centers in Slack and Microsoft Teams, Interactive Notifications for approval workflows within chat threads (Approve, Reject, Modify)
- [ ] Data Consistency During Migration: Implement double-write strategy to keep legacy databases and new microservice datastores synchronized
- [ ] Ensure zero-downtime migration path
- [ ] Deal Health Scores: Automated scoring flagging at-risk deals based on prospect engagement and momentum
- [ ] Top Opportunities: Prioritized list of high-value deals nearing close dates
- [ ] Win/Loss Modeling: Conversion rates analyzed by sales stage or forecast category
- [ ] AI Projections: Machine learning models predicting quarterly performance based on historical win rates and seasonality
