# Apex BDR — Microsoft Integration: IT Approval Request

**Prepared by:** Henry Whittle  
**Application name:** apex-bdr  
**Azure App Registration ID:** *(your Application Client ID from Azure Portal)*  
**Deployment URL:** https://apex-bdr-production.up.railway.app  
**Date:** April 2026

---

## What Is Apex BDR?

Apex BDR is an internal sales engagement platform used by the C3.ai BDR team. It manages outbound email sequences, call lists, and prospect tracking. The Microsoft integration enables two things:

1. **Reps sign in with their C3.ai Microsoft account** (SSO — replaces username/password)
2. **Outbound calls are placed directly through each rep's Teams Phone number** via the in-app power dialer

All data stays within C3.ai infrastructure. No data is shared with third parties.

---

## Permissions Requested

### Delegated Permissions
*These act on behalf of the signed-in user. The user must be logged in for these to apply.*

| Permission | What It Does | Why It's Needed |
|---|---|---|
| `openid` | Verifies the user's identity during sign-in | Required for SSO — confirms who is signing in |
| `offline_access` | Issues refresh tokens so sessions persist | Prevents reps from re-authenticating every hour |
| `User.Read` | Reads the signed-in user's name and email | Creates the rep's account in Apex on first login |
| `Mail.Send` | Sends email from the rep's Outlook account | Outbound sequence emails come from the rep's own address, not a shared inbox |
| `Mail.Read` | Reads the rep's inbox for new messages | Detects prospect replies and out-of-office responses so sequences pause automatically |

### Application Permissions
*These run server-side without a user being present. They require admin consent.*

| Permission | What It Does | Why It's Needed |
|---|---|---|
| `Calls.Initiate.All` | Initiates outbound PSTN calls from a user's Teams Phone number | Powers the in-app power dialer — rep clicks Dial, their Teams-connected headset rings and calls the prospect |
| `Calls.AccessMedia.All` | Connects audio so the rep can hear and speak | Required alongside `Calls.Initiate.All` for the call to have audio; Microsoft hosts the media stream |

---

## What Data Is Accessed

| Data | Accessed | Stored | Retention |
|---|---|---|---|
| Rep's name and email address | Yes — at login | Yes — in app database | Until rep account is deleted |
| Rep's Microsoft Object ID (internal Azure ID) | Yes — at login | Yes — required for call API | Until rep account is deleted |
| Outbound emails sent via Outlook | Yes — to send | No — only delivery status stored | Never stored in full |
| Rep's inbox messages | Yes — to scan for replies | Only subject + sender of matched replies | 90 days |
| Call audio | No | No | Microsoft hosts; Apex never receives audio |
| Teams call metadata (connected/ended/duration) | Yes — from webhook | Yes — logged as call record | Until rep account is deleted |
| Contacts, calendar, files, Teams messages | **No** | **No** | Not requested |

---

## How Calling Works (Technical Detail)

When a rep clicks Dial in the power dialer:

1. The Apex server calls `POST https://graph.microsoft.com/v1.0/communications/calls` using the rep's Azure AD user ID
2. Microsoft Teams initiates an outbound PSTN call **from the rep's existing Teams Phone DID** to the prospect
3. The call rings on the rep's Teams-connected headset or device — no Teams application window opens
4. Microsoft sends call state events (connected, ended, duration) to a webhook on the Apex server
5. The outcome is automatically logged in the app

**The rep's Teams Phone number, Teams Phone license, and existing calling plan are used as-is.** Apex does not provision numbers, purchase calling plans, or route calls through any third-party infrastructure.

---

## Security

- **Authentication:** All reps authenticate via Microsoft SSO. No passwords are stored in Apex.
- **Tokens:** OAuth refresh tokens are stored encrypted in a Railway-hosted PostgreSQL database. The database is not publicly accessible.
- **App credentials:** The Azure app's Client ID and Client Secret are stored as environment variables on Railway, not in source code.
- **Scope:** The app only requests the permissions listed above. No admin-level directory permissions are requested.
- **Revocation:** Access can be revoked at any time by an admin via Azure Portal → Enterprise Applications → apex-bdr → Delete. All rep tokens become invalid immediately.
- **Tenant isolation:** The app uses C3.ai's tenant ID when acquiring tokens. Calls are initiated within your tenant only.

---

## How to Grant Admin Consent

### Option A — Admin Consent URL (fastest)

A Global Administrator visits this URL while signed into the C3.ai Azure tenant:

```
https://login.microsoftonline.com/organizations/adminconsent
  ?client_id=YOUR_CLIENT_ID
  &redirect_uri=https://apex-bdr-production.up.railway.app/auth/microsoft/callback
```

*(Replace `YOUR_CLIENT_ID` with the Application Client ID from the Azure Portal Overview page.)*

The admin signs in, reviews the permission list, and clicks **Accept**. All C3.ai users can then sign in without further prompts.

### Option B — Azure Portal

1. Go to **Azure Portal → Azure Active Directory → Enterprise Applications**
2. Search for **apex-bdr**
3. Click **Permissions → Grant admin consent for C3.ai**
4. Review and confirm

---

## How to Revoke Access

1. **Azure Portal → Enterprise Applications → apex-bdr → Delete**  
   This immediately invalidates all tokens. No rep can sign in or send email via the app.

2. **Per-user:** Azure Portal → Users → [rep name] → Apps & Permissions → Revoke consent for apex-bdr

---

## Questions

Contact: henry.whittle@c3.ai

The full source code for the integration is available for review on request. Key files:
- `routes/microsoftOAuth.js` — SSO sign-in and token storage
- `services/teamsCallService.js` — Calls API integration
- `routes/calls.js` — Call initiation and webhook handler
- `services/sequenceMailer.js` — Email sending via Graph API
