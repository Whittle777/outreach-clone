# ARCHITECTURE

System design and tech stack rules.

## Overview

This project is a headless REST API for a sales engagement platform (similar to Outreach.io or Apollo). The backend handles user authentication, prospect management, email sequences, and activity tracking.

## Tech Stack

- **Framework:** Express.js (Node.js)
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT (JSON Web Tokens) for all protected routes
- **Password Hashing:** bcrypt

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

## Immediate Goals

1. Complete Prisma/Postgres schema implementation
2. Build standard CRUD routes for:
   - Users (with authentication)
   - Prospects
   - Sequences (including Sequence Steps)
3. Ensure all protected routes use JWT validation
