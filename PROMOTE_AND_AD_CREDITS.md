# Promote Section & Ad Credits System

**Version:** 1.0.0  
**Last Updated:** November 2025

This document explains the Promote section, ad credits system, and referral OG image functionality.

---

## Table of Contents

1. [Overview](#overview)
2. [Promote Section](#promote-section)
3. [Ad Credits System](#ad-credits-system)
4. [Earning Credits](#earning-credits)
5. [Referral OG Image](#referral-og-image)
6. [Database Schema](#database-schema)
7. [API Functions](#api-functions)
8. [Testing](#testing)

---

## Overview

The Promote section allows users to:
- View their ad credit balance
- Earn credits through posts and referrals
- (Coming soon) Create and run ads on the platform

**Key Features:**
- $1 credit for every post
- $5 credit for referring a new user
- $5 credit bonus for being referred
- Beautiful OG images for referral link sharing

---

## Promote Section

### Pages

| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/promote` | Overview with balance, quick actions, recent transactions |
| Create Ad | `/promote/create` | Explains ad types (Feed Ads, Loops, Meet Boost) |
| Earn Credits | `/promote/earn` | Details on earning through posts and referrals |
| Analytics | `/promote/analytics` | Coming soon - ad performance metrics |
| Billing | `/promote/billing` | Coming soon - purchase credits, payment methods |
| History | `/promote/history` | Full transaction history |

### Navigation

The Promote section is accessible from the main sidebar via the "Promote" button. It has its own left sidebar with navigation to all promote pages.

### Files

```
app/promote/
├── page.tsx          # Dashboard
├── create/
│   └── page.tsx      # Create Ad
├── earn/
│   └── page.tsx      # Earn Credits
├── analytics/
│   └── page.tsx      # Analytics (coming soon)
├── billing/
│   └── page.tsx      # Billing (coming soon)
└── history/
    └── page.tsx      # Transaction History
```

---

## Ad Credits System

### How Credits Work

- Credits are stored as integers (1 credit = $1)
- Users can earn credits through posts and referrals
- Credits can be spent on promotions (coming mid-January 2026)
- All transactions are logged for audit trail

### Credit Types

| Type | Description |
|------|-------------|
| `admin_grant` | Manually granted by admin |
| `promotion_spend` | Spent on advertising |
| `refund` | Refunded from cancelled promotion |
| `post_reward` | Earned from making a post |
| `referral_reward` | Earned from referring someone |
| `referral_bonus` | Bonus for being referred |

---

## Earning Credits

### Post Rewards

**Amount:** $1 per post

When a user creates a post, they automatically receive $1 in ad credits.

**Implementation:**
- `hooks/mutations/useCreatePost.ts` calls `creditUserForPost()` after successful post creation
- Duplicate prevention: Each post can only give credit once (tracked in `post_credit_log` table)

### Referral Rewards

**Amount:** $5 for referrer + $5 for new user

When someone signs up using a referral link:
1. The referrer gets $5
2. The new user gets $5 bonus

**How to share referral link:**
1. Go to `/promote` or `/promote/earn`
2. Click "Copy Invite Link"
3. Share the link: `https://ambitious.social/signup?ref=username`

**Implementation:**
- Signup page captures `?ref=` parameter
- After signup, `processReferralSignup()` is called
- Both users are credited
- Tracked in `referrals` table to prevent duplicates

### Configuring Rewards

Reward amounts are configurable in `lib/constants.ts`:

```typescript
export const AD_CREDIT_REWARDS = {
  POST_REWARD: 1,           // $1 per post
  REFERRAL_REWARD: 5,       // $5 for referrer
  REFERRAL_BONUS: 5,        // $5 for new user
}
```

---

## Referral OG Image

When users share their referral link on social media (iMessage, Twitter, Discord, etc.), a beautiful branded preview image is shown.

### Preview Content

- Light gradient background (matches platform style)
- Gift icon with blue gradient
- "You're invited to Ambitious!" headline
- "@username invited you to join"
- "$5 FREE in Ad Credits" badge
- Ambitious branding

### How It Works

1. **OG Image Route:** `app/api/og/referral/route.tsx`
   - Generates a 1200x630 PNG image dynamically
   - Accepts `?ref=username` parameter

2. **Signup Page Metadata:** `app/(auth)/signup/page.tsx`
   - Uses `generateMetadata` to set OG tags
   - Points `og:image` to the referral image route

### Testing OG Images

**Direct image test:**
```
https://ambitious.social/api/og/referral?ref=yourusername
```

**Full link test (use these tools):**
- [Facebook Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [opengraph.xyz](https://www.opengraph.xyz/)

**Cache busting:** Add `?v=1` to force fresh preview:
```
https://ambitious.social/signup?ref=drew&v=1
```

---

## Database Schema

### Tables

Run the migrations in order:
1. `supabase-ad-credits-migration.sql` - Core tables
2. `supabase-ad-credits-referrals-migration.sql` - Referral tracking

#### `ad_credits`

Stores user credit balances.

```sql
CREATE TABLE ad_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  balance INTEGER DEFAULT 0,
  lifetime_credits INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `ad_credit_transactions`

Audit log of all credit changes.

```sql
CREATE TABLE ad_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `referrals`

Tracks who referred whom.

```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  credits_awarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `post_credit_log`

Prevents duplicate post rewards.

```sql
CREATE TABLE post_credit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE UNIQUE,
  credit_amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API Functions

### Location: `lib/api/ad-credits.ts`

#### `getAdCredits(userId)`
Fetches user's current credit balance.

#### `getCreditTransactions(userId, limit?)`
Fetches user's transaction history.

#### `creditUser(userId, amount, type, description?, createdBy?)`
Internal helper to add/deduct credits and log transaction.

#### `creditUserForPost(userId, postId)`
Awards $1 for a post. Prevents duplicates.

#### `processReferralSignup(newUserId, referrerUsername)`
Awards $5 to both referrer and new user. Prevents duplicates.

### React Query Hooks

Location: `hooks/queries/useAdCredits.ts`

```typescript
// Get current user's credit balance
const { data: credits } = useAdCredits()

// Get transaction history
const { data: transactions } = useCreditTransactions(10)
```

---

## Testing

### Local Testing

1. **OG Image:** Visit `http://localhost:3000/api/og/referral?ref=testuser`

2. **Credit Balance:** Log in and visit `/promote`

3. **Post Reward:** Create a post, check if balance increases by $1

4. **Referral:** 
   - Copy invite link from `/promote`
   - Open in incognito, complete signup
   - Check both accounts for $5 credit

### Production Testing

1. Deploy to Vercel

2. Test OG image: `https://ambitious.social/api/og/referral?ref=yourusername`

3. Share referral link in iMessage/Discord - should show preview

4. Use [opengraph.xyz](https://www.opengraph.xyz/) to verify metadata

---

## Future Enhancements

- [ ] Ad creation flow (Feed Ads, Loops, Meet Boost)
- [ ] Credit purchasing via Stripe
- [ ] Analytics dashboard with ad performance
- [ ] Admin panel for managing credits
- [ ] Referral leaderboard

---

## Related Files

```
lib/
├── api/
│   └── ad-credits.ts         # API functions
├── constants.ts              # Reward amounts

hooks/
├── queries/
│   └── useAdCredits.ts       # React Query hooks
├── mutations/
│   └── useCreatePost.ts      # Updated to award credits

app/
├── (auth)/signup/
│   ├── page.tsx              # OG metadata
│   └── SignupForm.tsx        # Signup form
├── api/og/referral/
│   └── route.tsx             # OG image generator
└── promote/                  # All promote pages

types/
└── database.ts               # TypeScript types

supabase-ad-credits-migration.sql
supabase-ad-credits-referrals-migration.sql
```

