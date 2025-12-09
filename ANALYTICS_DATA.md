# Analytics Data Flow

This document explains how the Admin Panel retrieves and displays analytics data from the `analytics_events` table.

---

## Table Schema: `analytics_events`

The analytics system uses a single table to store all user events:

```sql
CREATE TABLE public.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NULL,                    -- Links to auth.users (optional for anonymous events)
  event_name text NOT NULL,             -- e.g., 'post_viewed', 'login_success'
  properties jsonb NULL DEFAULT '{}',   -- Event-specific data (flexible JSON)
  session_id text NULL,                 -- Client-generated session ID
  page_url text NULL,                   -- URL where event occurred
  user_agent text NULL,                 -- Browser/device info
  created_at timestamptz DEFAULT now(), -- When event was recorded
  platform text NULL DEFAULT 'web',     -- 'web', 'ios', or 'android'
  
  CONSTRAINT analytics_events_pkey PRIMARY KEY (id),
  CONSTRAINT analytics_events_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES auth.users (id) ON DELETE SET NULL
);

-- Indexes for fast queries
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_user_created ON analytics_events(user_id, created_at DESC);
```

---

## How Events Are Recorded

Events are sent from the client apps (web, iOS, Android) to Supabase:

```typescript
// Example: Recording an event from the app
await supabase.from('analytics_events').insert({
  user_id: currentUser?.id,        // null if not logged in
  event_name: 'post_viewed',
  properties: { post_id: '123', post_type: 'win' },
  session_id: getSessionId(),      // Client-generated UUID per session
  page_url: window.location.href,
  user_agent: navigator.userAgent,
  platform: 'web',
});
```

### Common Event Names

#### Post Events
| Event Name | Description | Properties |
|------------|-------------|------------|
| `post_viewed` | User viewed a post | `{ post_id, post_type, post_author_id, view_source }` |
| `post_created` | User created a post | `{ post_type }` |
| `post_liked` | User liked a post | `{ post_id }` |
| `post_shared` | User shared a post | `{ post_id, share_type }` |
| `comment_created` | User commented on a post | `{ post_id }` |

#### Loop Events (Short-form Video)
| Event Name | Description | Properties |
|------------|-------------|------------|
| `loop_viewed` | User watched a loop (500ms+) | `{ loop_id, creator_id, view_source: 'feed' }` |
| `loop_liked` | User liked a loop | `{ loop_id, creator_id }` |
| `loop_commented` | User commented on a loop | `{ loop_id, creator_id, comment_length }` |

#### General Events
| Event Name | Description | Properties |
|------------|-------------|------------|
| `impression` | Content was displayed | `{ content_type, content_id }` |
| `screen_viewed` | User viewed a screen | `{ screen_name }` |
| `page_view` | Web page loaded | `{ path, referrer }` |
| `login_success` | User logged in | `{ method }` |
| `signup_complete` | User completed signup | `{ referral_code }` |
| `profile_setup` | User set up profile | `{ fields_completed }` |
| `user_followed` | User followed someone | `{ followed_user_id }` |

### Loops vs Posts Tracking

The mobile app tracks **loops** (short-form video) separately from **posts**:

```typescript
// Mobile app: lib/analytics.ts

// Track when user watches a loop for 500ms+
trackLoopViewed({ loop_id, creator_id, view_source })

// Track loop engagement
trackLoopLiked({ loop_id, creator_id })
trackLoopCommented({ loop_id, creator_id, comment_length })
```

This allows the admin panel to show separate metrics:
- **Post views** → `event_name = 'post_viewed'`
- **Loop views** → `event_name = 'loop_viewed'`

---

## How Admin Panel Queries Data

The admin panel uses the Supabase client to query `analytics_events`. All queries are in `/lib/queries.ts`.

### Connection Setup

```typescript
// /lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Query Pattern

All analytics queries follow this pattern:

```typescript
export async function getAnalyticsOverview(filters) {
  // 1. Build query with filters
  let query = supabase
    .from('analytics_events')
    .select('id, user_id, session_id, platform')
  
  // 2. Apply date filter
  if (startDate) {
    query = query.gte('created_at', startDate)
  }
  
  // 3. Apply platform filter
  if (platform !== 'all') {
    query = query.eq('platform', platform)
  }
  
  // 4. Execute and process results
  const { data, error } = await query
  
  // 5. Calculate metrics from raw data
  const uniqueUsers = new Set(data.map(e => e.user_id).filter(Boolean)).size
  
  return { uniqueUsers, ... }
}
```

---

## Metrics Explained

### Overview Stats

| Metric | Query Logic |
|--------|-------------|
| **Total Events** | `COUNT(*)` of all events in period |
| **Unique Users** | `COUNT(DISTINCT user_id)` where user_id is not null |
| **Sessions** | `COUNT(DISTINCT session_id)` where session_id is not null |
| **Avg Events/Session** | Total Events ÷ Sessions |

### Key Events (Impressions)

Tracks view-related events to measure content reach:

```typescript
const impressionEvents = ['impression', 'post_viewed', 'screen_viewed', 'page_view', 'view']

// Query events where event_name matches any impression pattern
query.or(impressionEvents.map(e => `event_name.ilike.%${e}%`).join(','))
```

| Metric | Query Logic |
|--------|-------------|
| **Today** | Impression events where `created_at >= start of today` |
| **This Week** | Impression events where `created_at >= 7 days ago` |
| **This Month** | Impression events where `created_at >= 30 days ago` |
| **Trend %** | `(this_week - previous_week) / previous_week * 100` |

### Engagement Metrics

Tracks user interactions by matching event name patterns:

```typescript
const eventPatterns = {
  likes: ['like', 'post_liked', 'liked'],
  comments: ['comment', 'comment_created', 'commented'],
  shares: ['share', 'post_shared', 'shared', 'repost'],
  follows: ['follow', 'user_followed', 'followed'],
}
```

| Metric | Calculation |
|--------|-------------|
| **Engagement Rate** | `(likes + comments + shares + follows) / impressions * 100` |

### Retention (DAU/WAU/MAU)

Active users are counted by unique `user_id` values:

```typescript
// DAU: Unique users with events TODAY
const dau = new Set(
  events.filter(e => e.created_at >= startOfToday).map(e => e.user_id)
).size

// WAU: Unique users with events in LAST 7 DAYS
const wau = new Set(
  events.filter(e => e.created_at >= sevenDaysAgo).map(e => e.user_id)
).size

// MAU: Unique users with events in LAST 30 DAYS
const mau = new Set(
  events.filter(e => e.created_at >= thirtyDaysAgo).map(e => e.user_id)
).size
```

| Ratio | Meaning |
|-------|---------|
| **DAU/WAU** | Daily stickiness - what % of weekly users come back daily |
| **DAU/MAU** | Monthly stickiness - what % of monthly users are daily active |

### User Funnel

Tracks conversion through key user journey events:

```typescript
const funnelEvents = [
  { name: 'App Open', eventName: 'app_open' },
  { name: 'Sign Up', eventName: 'signup_complete' },
  { name: 'Profile Setup', eventName: 'profile_setup' },
  { name: 'First Post', eventName: 'post_created' },
  { name: 'First Comment', eventName: 'comment_created' },
]
```

Each step counts **unique users** who completed that event. Drop-off rate shows what percentage didn't proceed to the next step.

### Session Insights

| Metric | Calculation |
|--------|-------------|
| **Avg Events/Session** | Total events ÷ unique sessions |
| **Avg Duration** | For each session: `max(created_at) - min(created_at)`, then average |
| **Bounce Rate** | Sessions with only 1 event ÷ total sessions |
| **Top Pages** | `GROUP BY page_url ORDER BY COUNT(*) DESC` |

### Platform Breakdown

Groups events by `platform` field:

```typescript
const platformCounts = {}
events.forEach(e => {
  const platform = e.platform || 'unknown'
  platformCounts[platform] = (platformCounts[platform] || 0) + 1
})
```

---

## Filtering

The admin panel supports these filters:

| Filter | Field | Options |
|--------|-------|---------|
| **Date Range** | `created_at` | Today, 7 Days, 30 Days, 90 Days, All Time |
| **Platform** | `platform` | All, Web, iOS, Android |
| **Event Type** | `event_name` | Dynamic list from unique event names |

Filters are applied via Supabase query modifiers:

```typescript
// Date filter
query.gte('created_at', startDate)

// Platform filter
query.eq('platform', 'ios')

// Event type filter
query.eq('event_name', 'post_viewed')
```

---

## Data Flow Diagram

```
┌─────────────────┐
│   Mobile App    │
│  (iOS/Android)  │
└────────┬────────┘
         │
         │ INSERT analytics_events
         ▼
┌─────────────────┐
│    Supabase     │
│  PostgreSQL DB  │
│                 │
│ analytics_events│
└────────┬────────┘
         │
         │ SELECT with filters
         ▼
┌─────────────────┐
│  Admin Panel    │
│   (Next.js)     │
│                 │
│ /lib/queries.ts │
└────────┬────────┘
         │
         │ Process & aggregate
         ▼
┌─────────────────┐
│   Analytics     │
│   Dashboard     │
│                 │
│ Charts, Stats,  │
│ Tables, Trends  │
└─────────────────┘
```

---

## Environment Variables

The admin panel requires these environment variables to connect to Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Security Notes

1. **Row Level Security (RLS)**: The admin panel uses the anon key, so ensure appropriate RLS policies are in place
2. **Read-only**: The analytics queries only SELECT data, never INSERT/UPDATE/DELETE
3. **No PII exposed**: User IDs are UUIDs, no personal information is displayed in analytics
4. **Rate limiting**: Consider adding rate limits to prevent excessive queries

---

*Last Updated: December 2024*

