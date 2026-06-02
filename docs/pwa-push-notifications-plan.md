# PWA Push Notifications - Implementation Plan

> **Project:** arijitk.in (Astro 6.4.2 blog on GitHub Pages)
> **Stack:** Astro + Supabase (REST API) + @vite-pwa/astro + GitHub Actions
> **Goal:** When a new blog post is deployed, subscribed users receive a native push notification.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Flow Diagrams](#2-flow-diagrams)
3. [Supabase Schema & Functions](#3-supabase-schema--functions)
4. [Service Worker (injectManifest)](#4-service-worker-injectmanifest)
5. [Client-Side Components](#5-client-side-components)
6. [Supabase Edge Function](#6-supabase-edge-function)
7. [GitHub Actions Pipeline](#7-github-actions-pipeline)
8. [Environment Variables & Secrets](#8-environment-variables--secrets)
9. [File Change Summary](#9-file-change-summary)
10. [Implementation Order](#10-implementation-order)
11. [Risks & Edge Cases](#11-risks--edge-cases)

---

## 1. Architecture Overview

The system has **four actors**: the user's browser, the Supabase backend, the GitHub Actions CI/CD pipeline, and the browser's push service (e.g., Firebase Cloud Messaging for Chrome, Mozilla Push Service for Firefox).

```mermaid
graph TB
    subgraph "Client (Browser)"
        SW[Service Worker<br>sw.ts]
        UI[NotificationBell +<br>NotificationBanner]
        APP[Astro App]
    end

    subgraph "Supabase"
        DB[(Database<br>push_subscriptions<br>notifications)]
        EF[Edge Function<br>send-notifications]
    end

    subgraph "CI/CD"
        GH[GitHub Actions<br>deploy.yml]
    end

    PUSH[Browser Push Service<br>FCM / Mozilla / APNs]

    UI -- "1. subscribe via Push API" --> SW
    SW -- "2. returns PushSubscription" --> UI
    UI -- "3. save subscription" --> DB
    GH -- "4. detect new post + save notification" --> DB
    GH -- "5. trigger after deploy" --> EF
    EF -- "6. read subscriptions + notifications" --> DB
    EF -- "7. send Web Push (VAPID)" --> PUSH
    PUSH -- "8. deliver push message" --> SW
    SW -- "9. showNotification()" --> APP
```

---

## 2. Flow Diagrams

### 2.1 User Subscription Flow

This happens when a user clicks the bell icon or the "Enable" button on the first-visit banner.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant SW as Service Worker
    participant PushSvc as Push Service<br>(FCM/Mozilla)
    participant Supa as Supabase<br>(RPC)

    User->>Browser: Clicks bell icon / "Enable" button
    Browser->>Browser: Check Notification.permission
    alt Permission is "default"
        Browser->>User: Show native permission prompt
        User->>Browser: Grant permission
    end
    alt Permission is "denied"
        Browser->>User: Show "blocked" tooltip
        Note right of Browser: Flow stops here.<br>User must unblock in<br>browser settings.
    end

    Browser->>SW: navigator.serviceWorker.ready
    SW-->>Browser: ServiceWorkerRegistration

    Browser->>PushSvc: reg.pushManager.subscribe({<br>  userVisibleOnly: true,<br>  applicationServerKey: VAPID_PUBLIC_KEY<br>})
    PushSvc-->>Browser: PushSubscription {<br>  endpoint, keys: { p256dh, auth }<br>}

    Browser->>Supa: POST /rpc/upsert_push_subscription<br>{ p_endpoint, p_p256dh, p_auth }
    Supa-->>Browser: 200 OK

    Browser->>Browser: localStorage.set("push-subscribed", "true")
    Browser->>User: Bell icon shows "subscribed" state
```

### 2.2 User Unsubscribe Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant SW as Service Worker
    participant PushSvc as Push Service
    participant Supa as Supabase<br>(RPC)

    User->>Browser: Clicks bell icon (currently subscribed)
    Browser->>SW: navigator.serviceWorker.ready
    SW-->>Browser: ServiceWorkerRegistration

    Browser->>PushSvc: reg.pushManager.getSubscription()
    PushSvc-->>Browser: PushSubscription (or null)

    alt Has existing subscription
        Browser->>PushSvc: subscription.unsubscribe()
        PushSvc-->>Browser: true

        Browser->>Supa: POST /rpc/remove_push_subscription<br>{ p_endpoint }
        Supa-->>Browser: 200 OK
    end

    Browser->>Browser: localStorage.remove("push-subscribed")
    Browser->>User: Bell icon shows "unsubscribed" state
```

### 2.3 Deploy Pipeline Flow (New Post Detection + Notification)

This is the CI/CD pipeline that runs on every push to `master`.

```mermaid
sequenceDiagram
    autonumber
    participant Dev as Developer
    participant GH as GitHub Actions
    participant Repo as Git Repository
    participant Supa as Supabase<br>(REST API)
    participant Pages as GitHub Pages
    participant EF as Supabase<br>Edge Function

    Dev->>Repo: git push (master)
    Repo->>GH: Trigger deploy workflow

    GH->>Repo: actions/checkout@v4<br>(fetch-depth: 0)

    GH->>GH: git diff HEAD~1 --name-only<br>--diff-filter=A<br>-- src/content/posts/
    Note right of GH: Lists only ADDED files<br>in the posts directory

    alt New post(s) found
        GH->>GH: For each new .md file:<br>  Extract title from frontmatter<br>  Extract description<br>  Compute slug from filename<br>  Build URL: https://arijitk.in/posts/{slug}/

        GH->>Supa: POST /rpc/insert_notification<br>{ p_slug, p_title, p_body, p_url }<br>Authorization: Bearer SERVICE_ROLE_KEY
        Supa-->>GH: 200 OK
        Note right of Supa: Notification row saved<br>with sent=false
    end

    GH->>Pages: Build + Deploy Astro site<br>(withastro/action@v3 +<br>deploy-pages@v4)
    Pages-->>GH: Deployment complete

    alt New post(s) were detected
        GH->>EF: POST /functions/v1/send-notifications<br>Authorization: Bearer SERVICE_ROLE_KEY
        Note right of EF: Triggered AFTER deploy<br>so the post URL is live
        EF-->>GH: 200 OK (notifications queued)
    end
```

### 2.4 Edge Function: Send Notifications Flow

This is what happens inside the `send-notifications` Supabase Edge Function.

```mermaid
sequenceDiagram
    autonumber
    participant GH as GitHub Actions
    participant EF as Edge Function<br>(Deno)
    participant DB as Supabase DB
    participant PushSvc as Push Service<br>(FCM/Mozilla/APNs)

    GH->>EF: POST /functions/v1/send-notifications

    EF->>DB: SELECT * FROM notifications<br>WHERE sent = false
    DB-->>EF: unsent_notifications[]

    alt No unsent notifications
        EF-->>GH: 200 { message: "nothing to send" }
    end

    EF->>DB: SELECT * FROM push_subscriptions
    DB-->>EF: subscriptions[]

    loop For each notification N
        loop For each subscription S
            EF->>EF: Build JWT (VAPID)<br>Sign with VAPID_PRIVATE_KEY

            EF->>EF: Encrypt payload:<br>{ title: N.title,<br>  body: N.body,<br>  url: N.url,<br>  slug: N.slug }

            EF->>PushSvc: POST S.endpoint<br>Headers: Authorization (VAPID),<br>Content-Encoding: aes128gcm<br>Body: encrypted payload

            alt 201 Created
                Note right of PushSvc: Notification will be<br>delivered to browser
            else 410 Gone
                EF->>DB: DELETE FROM push_subscriptions<br>WHERE endpoint = S.endpoint
                Note right of DB: Subscription expired,<br>cleaned up
            else 429 Too Many Requests
                EF->>EF: Log rate limit, skip
            end
        end

        EF->>DB: UPDATE notifications<br>SET sent = true<br>WHERE id = N.id
    end

    EF-->>GH: 200 { sent: count }
```

### 2.5 Push Delivery to User Flow

This is the final leg -- the push message arriving at the user's browser.

```mermaid
sequenceDiagram
    autonumber
    participant PushSvc as Push Service
    participant SW as Service Worker<br>(sw.ts)
    participant OS as Operating System<br>Notification Center
    actor User
    participant App as Astro App<br>(arijitk.in)

    PushSvc->>SW: push event<br>{ title, body, url, slug }

    SW->>SW: Parse event.data.json()

    SW->>OS: self.registration.showNotification(<br>  title,<br>  { body, icon, badge, data: { url }, tag: slug }<br>)
    OS-->>User: Native notification appears

    alt User clicks notification
        User->>SW: notificationclick event
        SW->>SW: event.notification.close()
        SW->>SW: clients.matchAll({ type: "window" })

        alt Existing tab with the blog is open
            SW->>App: client.focus() + navigate to url
        else No existing tab
            SW->>App: clients.openWindow(url)
        end

        App-->>User: Blog post page loads
    end

    alt User dismisses notification
        User->>OS: Swipe away / dismiss
        Note right of OS: notificationclose event<br>(no action needed)
    end
```

### 2.6 Complete End-to-End Flow

The full lifecycle from writing a post to a user reading it via notification.

```mermaid
sequenceDiagram
    autonumber
    participant Dev as Developer
    participant GH as GitHub Actions
    participant Supa as Supabase
    participant EF as Edge Function
    participant PushSvc as Push Service
    participant SW as Service Worker
    participant User as User

    Note over Dev,User: PHASE 1 — Prerequisite: User is subscribed<br>(see Flow 2.1)

    Dev->>GH: Push commit with new post<br>(src/content/posts/new-post.md)

    Note over GH: PHASE 2 — Detect & Prepare

    GH->>GH: git diff detects new-post.md
    GH->>GH: Parse frontmatter:<br>title = "My New Post"<br>description = "A great read"
    GH->>Supa: Save notification record<br>(slug, title, body, url)

    Note over GH: PHASE 3 — Build & Deploy

    GH->>GH: astro build
    GH->>GH: Deploy to GitHub Pages
    Note right of GH: Post is now live at<br>arijitk.in/posts/new-post/

    Note over EF: PHASE 4 — Send Notifications

    GH->>EF: Trigger send-notifications
    EF->>Supa: Fetch unsent notifications<br>+ all subscriptions
    EF->>PushSvc: Web Push to each subscriber<br>(VAPID signed, AES encrypted)

    Note over User: PHASE 5 — User Receives

    PushSvc->>SW: push event
    SW->>User: Native notification:<br>"My New Post"<br>"A great read"

    User->>SW: Clicks notification
    SW->>User: Opens arijitk.in/posts/new-post/
```

---

## 3. Supabase Schema & Functions

### 3.1 Tables

#### `push_subscriptions`

Stores each browser's push subscription data. One row per subscribed browser.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Unique subscription ID |
| `endpoint` | `text` | UNIQUE, NOT NULL | Push service URL (e.g., `https://fcm.googleapis.com/...`) |
| `p256dh` | `text` | NOT NULL | Client public key for payload encryption |
| `auth` | `text` | NOT NULL | Client auth secret for payload encryption |
| `created_at` | `timestamptz` | default `now()` | When the subscription was created |

#### `notifications`

Stores pending and sent notification payloads. One row per new blog post notification.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Unique notification ID |
| `slug` | `text` | NOT NULL | Post slug (e.g., `my-new-post`) |
| `title` | `text` | NOT NULL | Notification title (from post frontmatter) |
| `body` | `text` | NOT NULL | Notification body (post description) |
| `url` | `text` | NOT NULL | Full URL to the post |
| `sent` | `boolean` | default `false` | Whether the notification has been sent |
| `created_at` | `timestamptz` | default `now()` | When the record was created |

### 3.2 Row Level Security (RLS)

```sql
-- push_subscriptions: public can insert (subscribe) and delete (unsubscribe)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe"
  ON push_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete own subscription"
  ON push_subscriptions FOR DELETE USING (true);

-- notifications: only service_role can read/write (no public policies)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
-- (No policies = locked to service_role key only)
```

### 3.3 RPC Functions

Three server-side functions callable via Supabase REST API:

```sql
-- 1. Upsert a push subscription (called by client on subscribe)
CREATE OR REPLACE FUNCTION upsert_push_subscription(
  p_endpoint text,
  p_p256dh text,
  p_auth text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO push_subscriptions (endpoint, p256dh, auth)
  VALUES (p_endpoint, p_p256dh, p_auth)
  ON CONFLICT (endpoint) DO UPDATE
    SET p256dh = EXCLUDED.p256dh,
        auth   = EXCLUDED.auth;
END;
$$;

-- 2. Remove a push subscription (called by client on unsubscribe)
CREATE OR REPLACE FUNCTION remove_push_subscription(
  p_endpoint text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM push_subscriptions WHERE endpoint = p_endpoint;
END;
$$;

-- 3. Insert a notification record (called by CI pipeline)
CREATE OR REPLACE FUNCTION insert_notification(
  p_slug text,
  p_title text,
  p_body text,
  p_url text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO notifications (slug, title, body, url)
  VALUES (p_slug, p_title, p_body, p_url);
END;
$$;
```

### 3.4 Entity Relationship

```mermaid
erDiagram
    push_subscriptions {
        uuid id PK
        text endpoint UK
        text p256dh
        text auth
        timestamptz created_at
    }

    notifications {
        uuid id PK
        text slug
        text title
        text body
        text url
        boolean sent
        timestamptz created_at
    }

    notifications ||--o{ push_subscriptions : "sent to (via Edge Function)"
```

---

## 4. Service Worker (injectManifest)

### 4.1 Why Switch from `generateSW` to `injectManifest`

The current setup uses `generateSW`, where Workbox auto-generates the entire service worker. This approach does not allow custom event listeners (like `push` and `notificationclick`). Switching to `injectManifest` means:

- We write our own service worker file (`src/sw.ts`)
- Workbox injects the precache manifest into it at build time
- We have full control to add push notification handlers
- We manually configure runtime caching strategies (same as before, just in code)

### 4.2 `astro.config.mjs` Changes

Current (generateSW):
```js
AstroPWA({
  registerType: "autoUpdate",
  workbox: {
    skipWaiting: true,
    clientsClaim: true,
    cleanupOutdatedCaches: true,
    navigationPreload: true,
    navigateFallback: null,
    globPatterns: ["**/*.{css,js,svg,png,ico,txt,xml}"],
    additionalManifestEntries: [
      { url: "/offline", revision: commitHash },
    ],
    runtimeCaching: [ /* ... */ ],
  },
})
```

New (injectManifest):
```js
AstroPWA({
  registerType: "autoUpdate",
  strategies: "injectManifest",
  srcDir: "src",
  filename: "sw.ts",
  injectManifest: {
    globPatterns: ["**/*.{css,js,svg,png,ico,txt,xml}"],
    // Workbox will inject the precache manifest into self.__WB_MANIFEST
  },
  manifest: { /* ... unchanged ... */ },
  devOptions: { enabled: false },
})
```

Also add to `env.schema`:
```js
PUBLIC_VAPID_KEY: envField.string({ context: "client", access: "public" }),
```

### 4.3 `src/sw.ts` — Custom Service Worker

```
src/sw.ts
├── Workbox Precaching (self.__WB_MANIFEST)
├── Runtime Caching Routes
│   ├── NavigationRoute → NetworkFirst (with /offline fallback)
│   ├── Google Fonts CSS → CacheFirst
│   ├── Google Fonts files → CacheFirst
│   └── jsDelivr CDN → CacheFirst
├── Push Event Listener
│   └── Parse JSON payload → showNotification()
├── Notification Click Listener
│   └── Focus existing tab or open new window
└── Message Listener
    └── SKIP_WAITING handler
```

The service worker handles three concerns:

1. **Caching** — Same strategies as the current `generateSW` config, just expressed in code
2. **Push** — Listens for push events, displays native notifications
3. **Navigation** — Handles notification clicks to open/focus the correct page

---

## 5. Client-Side Components

### 5.1 Component Architecture

```mermaid
graph TD
    subgraph "Layout.astro"
        NAV[Nav.astro]
        BANNER[NotificationBanner.astro]
        MAIN[main content]
    end

    subgraph "Nav.astro"
        HOME[Home link]
        SEARCH[Search link]
        ABOUT[About link]
        BELL[NotificationBell.astro]
        THEME[Theme Toggle]
    end

    BELL -- "shared subscribe logic" --> BANNER
    BELL -- "saves to" --> LS[(localStorage<br>push-subscribed<br>notification-banner-dismissed)]
    BANNER -- "saves to" --> LS
    BELL -- "calls" --> SUPA[(Supabase RPC)]
    BANNER -- "calls" --> SUPA
```

### 5.2 `NotificationBell.astro`

**Location:** `src/components/NotificationBell.astro`

**Behavior:**

| State | Visual | Click Action |
|-------|--------|-------------|
| Not subscribed | Bell outline (muted) | Start subscribe flow |
| Subscribed | Bell with dot/filled (active color) | Unsubscribe |
| Unsupported | Hidden | N/A |
| Permission denied | Bell with slash (disabled) | Show tooltip: "Notifications blocked" |

**Technical Details:**

- Reads `PUBLIC_VAPID_KEY` and `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` from env
- On mount: checks `localStorage("push-subscribed")` for quick UI, then verifies with `pushManager.getSubscription()` for accuracy
- Subscribe: `Notification.requestPermission()` -> `pushManager.subscribe()` -> Supabase RPC `upsert_push_subscription`
- Unsubscribe: `subscription.unsubscribe()` -> Supabase RPC `remove_push_subscription`
- Works with Astro View Transitions (`astro:page-load` event)

### 5.3 `NotificationBanner.astro`

**Location:** `src/components/NotificationBanner.astro`

**Behavior:**

- Shows on first visit if `localStorage("notification-banner-dismissed")` is not set
- Auto-hides if `Notification.permission === "granted"` or push is already subscribed
- Has an "Enable notifications" button (triggers same flow as bell) and a dismiss "x"
- Dismissing sets `localStorage("notification-banner-dismissed") = "true"`
- Styled as a subtle top bar below the nav, matching the blog's design language

**State Machine:**

```mermaid
stateDiagram-v2
    [*] --> Check: Page loads

    Check --> Hidden: banner dismissed<br>OR already subscribed<br>OR push not supported
    Check --> Visible: First visit +<br>not subscribed +<br>push supported

    Visible --> Subscribing: User clicks "Enable"
    Visible --> Hidden: User clicks dismiss "x"

    Subscribing --> Hidden: Subscribe success
    Subscribing --> Visible: Permission denied<br>(show error state)

    Hidden --> [*]
```

### 5.4 Nav.astro Modification

Add the bell icon between the About link and the theme toggle:

```diff
  <li>
    <a href="/about" ...>About</a>
  </li>
+ <li>
+   <NotificationBell />
+ </li>
  <li>
    <button id="theme-toggle" ...>
```

### 5.5 Layout.astro Modification

Add the notification banner after the nav:

```diff
  <Nav />
+ <NotificationBanner />
  <main id="main-content">
```

The existing service worker registration script in `Layout.astro` (lines 119-154) remains as-is since it already registers `/sw.js` and handles `SKIP_WAITING`.

---

## 6. Supabase Edge Function

### 6.1 File Location

```
supabase/
├── config.toml
└── functions/
    └── send-notifications/
        └── index.ts
```

### 6.2 `send-notifications/index.ts` — Pseudocode

```
FUNCTION handler(request):
  1. Verify Authorization header (service_role key or custom auth)

  2. QUERY: SELECT * FROM notifications WHERE sent = false
     → If none, return { message: "nothing to send" }

  3. QUERY: SELECT * FROM push_subscriptions
     → If none, mark all notifications as sent, return

  4. FOR each unsent notification N:
       FOR each subscription S:
         a. Build VAPID JWT:
            - Header: { alg: "ES256", typ: "JWT" }
            - Payload: { aud: origin(S.endpoint), exp: now + 12h, sub: VAPID_SUBJECT }
            - Sign with VAPID_PRIVATE_KEY (ECDSA P-256)

         b. Encrypt notification payload using:
            - S.p256dh (client public key)
            - S.auth (client auth secret)
            - AES-128-GCM (RFC 8291)

         c. POST to S.endpoint:
            Headers:
              Authorization: vapid t=<JWT>, k=<VAPID_PUBLIC_KEY>
              Content-Type: application/octet-stream
              Content-Encoding: aes128gcm
              TTL: 86400
            Body: encrypted payload

         d. Handle response:
            - 201: Success, push accepted
            - 410: Subscription expired → DELETE from push_subscriptions
            - 404: Subscription invalid → DELETE from push_subscriptions
            - 429: Rate limited → log warning, continue

       UPDATE notifications SET sent = true WHERE id = N.id

  5. Return { sent: count }
```

### 6.3 Dependencies & Libraries

In Deno (Supabase Edge Functions runtime), there is no `web-push` npm package available. Options:

| Approach | Pros | Cons |
|----------|------|------|
| **`web-push` via npm compat** | Well-tested library | May have Node.js-specific deps |
| **Manual VAPID + encryption** | No deps, uses Web Crypto API | More code to write |
| **`@block65/webcrypto-web-push`** | Designed for Web Crypto API (Deno/CF Workers compatible) | Newer, less battle-tested |

**Recommended:** Use `web-push` via Deno's npm compatibility (`npm:web-push`) or use a lightweight Deno-native implementation with Web Crypto API.

### 6.4 Edge Function Secrets

Set via Supabase CLI or dashboard:

```bash
supabase secrets set VAPID_PUBLIC_KEY="BPx..."
supabase secrets set VAPID_PRIVATE_KEY="abc..."
supabase secrets set VAPID_SUBJECT="mailto:your@email.com"
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by the Edge Functions runtime.

---

## 7. GitHub Actions Pipeline

### 7.1 Updated `deploy.yml` Structure

```mermaid
graph TD
    subgraph "build job"
        A[Checkout<br>fetch-depth: 0] --> B[Detect new posts<br>git diff]
        B --> C{New posts<br>found?}
        C -- Yes --> D[Extract frontmatter<br>title + description]
        D --> E[Save notification to Supabase<br>POST /rpc/insert_notification]
        E --> F[Build Astro site<br>withastro/action@v3]
        C -- No --> F
    end

    subgraph "deploy job"
        G[Deploy to GitHub Pages<br>deploy-pages@v4]
    end

    subgraph "notify job (conditional)"
        H[Trigger Edge Function<br>POST /functions/v1/<br>send-notifications]
    end

    F --> G
    G --> H
    C -- "output: has_new_posts" --> H
```

### 7.2 Key Changes to `deploy.yml`

1. **Add `fetch-depth: 0`** to checkout step (need git history for `git diff`)
2. **New step: "Detect new blog posts"** — runs `git diff` to find added files in `src/content/posts/`
3. **New step: "Prepare notification data"** — parses frontmatter and POSTs to Supabase
4. **New job: "notify"** — runs after deploy, calls the Edge Function
5. **New secrets needed:** `SUPABASE_SERVICE_ROLE_KEY`, `PUBLIC_VAPID_KEY`
6. **Output passing:** The `build` job outputs `has_new_posts` so the `notify` job can conditionally run

### 7.3 Frontmatter Parsing in CI

The pipeline needs to extract `title` and `description` from markdown frontmatter like:

```yaml
---
title: "My New Post"
description: "A great read about interesting things"
date: 2026-01-15
---
```

This is done via simple `grep` + `sed` in the shell:

```bash
TITLE=$(grep '^title:' "$file" | head -1 | sed 's/^title: *//' | tr -d '"')
DESC=$(grep '^description:' "$file" | head -1 | sed 's/^description: *//' | tr -d '"')
SLUG=$(basename "$file" .md)
```

### 7.4 Edge Case: Multiple New Posts in One Push

If a developer pushes a commit that adds 3 new posts at once, the pipeline creates 3 separate notification records. The Edge Function sends all 3 as separate push notifications. Each notification has a unique `tag` (the slug), so they won't collapse into one.

### 7.5 Edge Case: Squash Merges / Force Pushes

`git diff HEAD~1` only compares against the immediate parent commit. For squash merges that include multiple commits worth of changes, this still works because the diff shows all files added in the squash. For force pushes or rebases, the diff base may be wrong. A more robust approach would be to store the last-deployed SHA in Supabase and diff against that, but `HEAD~1` is sufficient for a standard PR merge workflow.

---

## 8. Environment Variables & Secrets

### 8.1 Complete Variable Map

```mermaid
graph LR
    subgraph "GitHub Secrets"
        GS1[PUBLIC_SUPABASE_URL]
        GS2[PUBLIC_SUPABASE_ANON_KEY]
        GS3[PUBLIC_VAPID_KEY]
        GS4[SUPABASE_SERVICE_ROLE_KEY]
    end

    subgraph "Supabase Edge Function Secrets"
        ES1[VAPID_PUBLIC_KEY]
        ES2[VAPID_PRIVATE_KEY]
        ES3[VAPID_SUBJECT]
        ES4[SUPABASE_URL<br>auto-injected]
        ES5[SUPABASE_SERVICE_ROLE_KEY<br>auto-injected]
    end

    subgraph "Client-side .env"
        CE1[PUBLIC_SUPABASE_URL]
        CE2[PUBLIC_SUPABASE_ANON_KEY]
        CE3[PUBLIC_VAPID_KEY]
    end

    GS1 --> CE1
    GS2 --> CE2
    GS3 --> CE3
    GS3 --> ES1
```

### 8.2 Variable Details

| Variable | Value Example | Used By | Sensitive? |
|----------|--------------|---------|------------|
| `PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Client, CI | No |
| `PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Client | No (public key) |
| `PUBLIC_VAPID_KEY` | `BPx...` (base64url) | Client, CI, Edge Fn | No (public key) |
| `VAPID_PRIVATE_KEY` | `abc...` (base64url) | Edge Fn only | **Yes** |
| `VAPID_SUBJECT` | `mailto:arijit@arijitk.in` | Edge Fn only | No |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | CI, Edge Fn | **Yes** |

### 8.3 Generating VAPID Keys

Run once locally:

```bash
npx web-push generate-vapid-keys
```

Output:
```
Public Key:  BPxyz... (this goes in PUBLIC_VAPID_KEY)
Private Key: abc123... (this goes in VAPID_PRIVATE_KEY)
```

Store these permanently. If you regenerate them, all existing subscriptions become invalid and users must re-subscribe.

---

## 9. File Change Summary

### 9.1 New Files

| File | Purpose |
|------|---------|
| `src/sw.ts` | Custom service worker with precaching + push handlers |
| `src/components/NotificationBell.astro` | Bell icon subscribe/unsubscribe button |
| `src/components/NotificationBanner.astro` | First-visit opt-in banner |
| `supabase/config.toml` | Supabase project configuration |
| `supabase/functions/send-notifications/index.ts` | Edge Function: send Web Push to all subscribers |
| `supabase/migrations/001_push_notifications.sql` | Database schema (tables, RLS, RPC functions) |

### 9.2 Modified Files

| File | Changes |
|------|---------|
| `astro.config.mjs` | Switch to `injectManifest`, add `PUBLIC_VAPID_KEY` to env schema |
| `src/components/Nav.astro` | Add `NotificationBell` component |
| `src/components/Layout.astro` | Add `NotificationBanner` component |
| `.github/workflows/deploy.yml` | Add post detection, notification save, Edge Function trigger steps |
| `.env.example` | Add `PUBLIC_VAPID_KEY` |
| `package.json` | Potentially add `workbox-*` peer deps if not auto-resolved |

### 9.3 Dependency Impact

The `@vite-pwa/astro` plugin already includes workbox libraries. Switching to `injectManifest` uses the same workbox packages but imports them directly in `src/sw.ts`. No new npm dependencies should be needed for the client side.

For the Supabase Edge Function, `web-push` (or a Deno-native alternative) is imported directly in the function file — it's not a project-level dependency.

---

## 10. Implementation Order

Step-by-step execution plan with dependencies:

```mermaid
graph TD
    S1["Step 1<br>Generate VAPID keys<br>Configure secrets"] --> S2
    S2["Step 2<br>Run SQL migrations in Supabase<br>(tables + RLS + RPC)"] --> S3
    S3["Step 3<br>Create src/sw.ts<br>Switch astro.config.mjs to injectManifest"] --> S4
    S4["Step 4<br>Create NotificationBell.astro<br>+ NotificationBanner.astro"] --> S5
    S5["Step 5<br>Update Nav.astro + Layout.astro<br>to include new components"] --> S6
    S6["Step 6<br>Test locally<br>(subscription flow, SW push simulation)"] --> S7
    S7["Step 7<br>Create Supabase Edge Function<br>(send-notifications)"] --> S8
    S8["Step 8<br>Deploy Edge Function<br>+ set Edge Function secrets"] --> S9
    S9["Step 9<br>Update deploy.yml pipeline<br>(detect posts + trigger Edge Function)"] --> S10
    S10["Step 10<br>End-to-end test<br>(push a test post, verify notification)"]

    style S1 fill:#e8f5e9
    style S2 fill:#e8f5e9
    style S3 fill:#e3f2fd
    style S4 fill:#e3f2fd
    style S5 fill:#e3f2fd
    style S6 fill:#fff3e0
    style S7 fill:#fce4ec
    style S8 fill:#fce4ec
    style S9 fill:#f3e5f5
    style S10 fill:#fff3e0
```

### Step Details

| Step | Effort | Description |
|------|--------|-------------|
| 1 | 5 min | Run `npx web-push generate-vapid-keys`. Add keys to GitHub Secrets + local `.env` |
| 2 | 10 min | Run SQL in Supabase SQL Editor (or via migration). Verify tables and RPC functions exist |
| 3 | 30 min | Create `src/sw.ts`. Modify `astro.config.mjs` to use `injectManifest`. Verify build succeeds and caching still works |
| 4 | 45 min | Build the bell icon and banner components with full subscribe/unsubscribe logic |
| 5 | 10 min | Wire components into Nav and Layout |
| 6 | 15 min | Run `bun dev`, test subscription in browser, use Chrome DevTools > Application > Push to simulate a push event |
| 7 | 45 min | Write the Deno Edge Function with VAPID signing and payload encryption |
| 8 | 10 min | Deploy via `supabase functions deploy send-notifications`. Set secrets via `supabase secrets set` |
| 9 | 20 min | Update `deploy.yml` with new steps and job. Test with a dry-run push |
| 10 | 15 min | Add a test post, push to master, verify the full pipeline works end-to-end |

**Total estimated effort: ~3.5 hours**

---

## 11. Risks & Edge Cases

### 11.1 Browser Support

| Browser | Push API | Notes |
|---------|----------|-------|
| Chrome (Desktop) | Full support | Uses FCM |
| Chrome (Android) | Full support | Uses FCM |
| Firefox (Desktop) | Full support | Uses Mozilla Push Service |
| Firefox (Android) | Full support | Uses Mozilla Push Service |
| Edge (Desktop) | Full support | Uses FCM (Chromium-based) |
| Safari (macOS 16+) | Supported | Uses APNs |
| Safari (iOS 16.4+) | Partial | Only works if site is "Added to Home Screen" (installed as PWA) |
| Safari (iOS < 16.4) | Not supported | No Push API available |

The `NotificationBell` component should hide itself on unsupported browsers using feature detection:

```js
const pushSupported = 'serviceWorker' in navigator
  && 'PushManager' in window
  && 'Notification' in window;
```

### 11.2 Subscription Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Fresh: User visits site

    Fresh --> Prompted: Clicks bell or banner
    Prompted --> Subscribed: Grants permission
    Prompted --> Blocked: Denies permission

    Subscribed --> Unsubscribed: Clicks bell again
    Unsubscribed --> Subscribed: Clicks bell again

    Subscribed --> Expired: Browser/OS revokes<br>or subscription expires
    Expired --> [*]: Edge Function cleanup<br>(HTTP 410)

    Blocked --> [*]: Must unblock in<br>browser settings
```

### 11.3 Failure Scenarios

| Scenario | Impact | Mitigation |
|----------|--------|------------|
| Edge Function fails | Notifications not sent | Unsent notifications remain `sent=false`; can be retried manually |
| Supabase is down during deploy | Notification record not saved | Pipeline step fails but deploy continues; no notification for that post |
| VAPID keys regenerated | All existing subscriptions invalidated | Never regenerate keys; if needed, all users must re-subscribe |
| User clears browser data | Subscription lost client-side | Stale subscription remains in DB until Edge Function gets 410 and cleans it |
| Push service rate-limits | Some notifications delayed | Edge Function logs the error; push service will retry delivery |
| Multiple deploys in quick succession | Multiple notifications for same post | Use `slug` as unique tag in `showNotification()` — duplicates collapse |

### 11.4 Privacy Considerations

- Push subscriptions contain no personally identifiable information (no email, no name)
- The `endpoint` URL is opaque and managed by the browser vendor's push service
- The notification payload is end-to-end encrypted (AES-128-GCM between Edge Function and browser)
- No tracking of who reads which notification
- Users can unsubscribe at any time via the bell icon or browser settings

### 11.5 Performance Impact

- **Service worker size:** Adding push handlers adds ~2KB to the SW file (negligible)
- **Page load:** The bell icon and banner are lightweight Astro components (no JS framework overhead)
- **Build time:** `injectManifest` is slightly faster than `generateSW` since it only injects the manifest rather than generating the entire SW

---

## Appendix: Quick Reference Commands

```bash
# Generate VAPID keys
npx web-push generate-vapid-keys

# Deploy Supabase Edge Function
supabase functions deploy send-notifications

# Set Edge Function secrets
supabase secrets set VAPID_PUBLIC_KEY="..."
supabase secrets set VAPID_PRIVATE_KEY="..."
supabase secrets set VAPID_SUBJECT="mailto:you@example.com"

# Test Edge Function locally
supabase functions serve send-notifications --env-file .env

# Simulate a push event (Chrome DevTools)
# Application tab > Service Workers > Push (enter JSON payload)

# Check existing subscriptions in Supabase
# SQL: SELECT count(*) FROM push_subscriptions;

# Check pending notifications
# SQL: SELECT * FROM notifications WHERE sent = false;

# Retry unsent notifications
# SQL: UPDATE notifications SET sent = false WHERE ...;
# Then re-trigger the Edge Function
```
