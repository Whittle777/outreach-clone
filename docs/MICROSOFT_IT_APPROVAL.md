# Apex BDR — Microsoft Integration Approval Request

**Prepared by:** Henry Whittle (henry.whittle@c3.ai)  
**App name in Azure:** apex-bdr  
**Deployment URL:** https://apex-bdr-production.up.railway.app  
**Date:** May 2026

---

## What We Need From You (30 seconds)

A Global Administrator visits the URL below while signed into the C3.ai Azure tenant and clicks **Accept**:

```
https://login.microsoftonline.com/[C3AI_TENANT_ID]/adminconsent
  ?client_id=[APEX_CLIENT_ID]
  &redirect_uri=https://apex-bdr-production.up.railway.app/auth/microsoft/callback
```

*(Henry: replace `[C3AI_TENANT_ID]` with your tenant ID and `[APEX_CLIENT_ID]` with your Azure app Client ID before sending)*

That's it. All C3.ai BDR reps can then sign in and use the app without any further prompts.

**Alternatively via portal:**  
Azure Portal → Azure Active Directory → Enterprise Applications → search "apex-bdr" → Permissions → **Grant admin consent for C3.ai**

---

## What Is Apex BDR?

An internal sales engagement tool used exclusively by the C3.ai BDR team (~5–10 people). It does three things:

1. **Reps sign in with their C3.ai Microsoft account** — no separate username/password
2. **Outbound sequence emails send from each rep's own Outlook address** — not a shared inbox
3. **Outbound calls place through each rep's existing Teams Phone number** — rep clicks Dial, their headset rings

Nothing is exposed to customers or the public. Only C3.ai employees with a company email address can sign in.

---

## Permissions Requested

### Delegated — act on behalf of the signed-in rep only

| Permission | Plain English | Why |
|---|---|---|
| `openid` | Confirm the user's identity at sign-in | Required for SSO |
| `offline_access` | Keep the session alive without re-prompting every hour | Usability |
| `User.Read` | Read the rep's name and email address | Create their account in the app on first login |
| `Mail.Send` | Send email from the rep's Outlook account | Sequence emails go from henry.whittle@c3.ai, not a shared address |
| `Mail.Read` | Scan the rep's inbox for replies | Auto-pause sequences when a prospect replies or is out of office |

**Key point on delegated permissions:** These only activate when the rep is actively signed in. The app cannot access a rep's email while they're logged out. Each permission is scoped to that individual rep's data only — not the broader tenant.

### Application — run server-side for outbound calling

| Permission | Plain English | Why |
|---|---|---|
| `Calls.Initiate.All` | Place an outbound call from a rep's Teams Phone number | Rep clicks Dial in the app → their headset rings → prospect is called |
| `Calls.AccessMedia.All` | Connect the audio channel for the call | Required by Microsoft alongside Calls.Initiate.All for any PSTN call |

**Key point on calling permissions:** These fire only when a rep manually clicks Dial on a specific prospect record. There is no automated dialing, no scheduled calling, and no bulk operations. Each call is a deliberate one-click action by a signed-in rep.

---

## What Data Is Accessed and Stored

| Data | Accessed | Stored by Apex | Retention |
|---|---|---|---|
| Rep's name and work email | Yes — at login | Yes | Until rep account is deleted |
| Rep's Microsoft Object ID | Yes — at login | Yes — required to place calls via the API | Until rep account is deleted |
| OAuth refresh token | Yes — at login | Yes — stored in the app database to maintain the session | Until rep disconnects their account |
| Outbound emails content | Yes — to send them | No — only subject line and sent timestamp | N/A |
| Rep's inbox | Yes — scanned for replies from prospects | Only subject and sender of matched replies | 90 days |
| Call audio | No | No — Microsoft routes audio between the rep's headset and the prospect; Apex never receives it | N/A |
| Call metadata (duration, outcome) | Yes — from Microsoft webhook | Yes | Until rep account is deleted |
| Calendar, contacts, files, Teams chat | No | No | Not requested |

---

## Security

- **No passwords stored.** All authentication is via Microsoft SSO. Apex stores only the OAuth refresh token issued by Microsoft.
- **Tokens are stored in a private PostgreSQL database** on Railway (US-based, not publicly accessible). Connection requires credentials not exposed in source code.
- **App credentials** (Client ID and Client Secret) are environment variables on Railway, not in the source code or repository.
- **Tenant isolation.** The app is configured with C3.ai's tenant ID. It cannot acquire tokens for users outside the C3.ai directory.
- **No third-party data sharing.** Prospect and rep data does not leave the app or get shared with any external service.
- **Source code is available for review** — see files listed at the bottom of this document.

---

## How to Restrict Access (Recommended)

You can limit sign-in to the BDR team only, so the app is not available to all C3.ai employees:

1. Azure Portal → Enterprise Applications → apex-bdr
2. Under **Properties**, set **Assignment required** to **Yes**
3. Under **Users and groups**, add only the BDR team members or an existing security group

This means only assigned users can sign in, even after admin consent is granted.

---

## How to Revoke Access Instantly

- **Revoke all access:** Azure Portal → Enterprise Applications → apex-bdr → Delete. All rep sessions and tokens are immediately invalidated.
- **Revoke one rep:** Azure Portal → Users → [rep name] → Apps and permissions → Remove apex-bdr.

---

## Source Code Available for Review

henry.whittle@c3.ai can provide read access to the private repository on request. Key files:

| File | What it does |
|---|---|
| `routes/microsoftOAuth.js` | Handles sign-in, token exchange, stores refresh token |
| `services/sequenceMailer.js` | Sends outbound emails via Graph API (Mail.Send) |
| `services/replyDetector.js` | Reads inbox to detect prospect replies (Mail.Read) |
| `services/teamsCallService.js` | Places outbound calls via Graph Calls API |
| `routes/calls.js` | Receives call state webhooks from Microsoft |

---

## Questions

Contact henry.whittle@c3.ai or schedule a call for a live walkthrough of the app.
