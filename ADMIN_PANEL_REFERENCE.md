# Ambitious Social - Admin Panel Reference

This document provides a comprehensive reference of all app functions, database tables, and API endpoints to assist in building an admin panel for Ambitious Social.

---

## Table of Contents

1. [User Management](#1-user-management)
2. [Posts & Content](#2-posts--content)
3. [Comments System](#3-comments-system)
4. [Messaging System](#4-messaging-system)
5. [Notifications](#5-notifications)
6. [Meet Feature](#6-meet-feature-user-discovery)
7. [Media & Storage](#7-media--storage)
8. [Ambitious Daily (Articles)](#8-ambitious-daily-articles)
9. [Premium Spotlight (Ads/Sponsors)](#9-premium-spotlight-adssponsors)
10. [Edge Functions](#10-edge-functions-server-side)
11. [Database Tables Reference](#11-database-tables-reference)
12. [Constants & Limits](#12-constants--limits)
13. [Admin Panel Recommendations](#13-admin-panel-recommendations)

---

## 1. User Management

### Authentication Functions

Located in `lib/api/auth.ts`

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `signUp(data)` | Register new user with email, password, and profile data | `SignUpData` (email, password, username, full_name, date_of_birth, gender, invite_code, phone) | `User` |
| `signIn(data)` | Authenticate user with email/password | `SignInData` (email, password) | `{ user, session }` |
| `signOut()` | End current user session | None | `void` |
| `getCurrentUser()` | Get authenticated user from session | None | `User \| null` |
| `getCurrentUserProfile()` | Get current user's full profile | None | `Profile \| null` |
| `sendPasswordReset(email)` | Send password reset email | `email: string` | `void` |
| `updatePassword(newPassword)` | Update user's password | `newPassword: string` | `void` |
| `isUsernameAvailable(username)` | Check if username is taken | `username: string` | `boolean` |
| `isEmailAvailable(email)` | Check if email is registered | `email: string` | `boolean` |
| `validateInviteCode(code)` | Validate invite code for signup | `code: string` | `InviteCodeValidationResult` |

### Profile Functions

Located in `lib/api/profiles.ts`

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `getProfileByUsername(username)` | Get profile by username | `username: string` | `Profile` |
| `getProfileById(userId)` | Get profile by user ID | `userId: string` | `Profile` |
| `updateProfile(updates)` | Update current user's profile | `UpdateProfileData` | `Profile` |
| `searchProfiles(query, limit?)` | Search users by username/name | `query: string, limit?: number` | `Profile[]` |
| `getSuggestedUsers(limit?, blockedUserIds?)` | Get random user suggestions | `limit?: number, blockedUserIds?: string[]` | `Profile[]` |
| `getActiveUsers(limit?, blockedUserIds?, daysAgo?)` | Get recently active users | `limit?: number, blockedUserIds?: string[], daysAgo?: number` | `Profile[]` |
| `getStreakInfo(userId)` | Get user's streak information | `userId: string` | `StreakInfo` |
| `getUserStats(userId)` | Get user statistics | `userId: string` | `{ postsCount, likesReceived, commentsReceived, referralCount }` |
| `getStreakLeaders(limit?, blockedUserIds?)` | Get users with highest streaks | `limit?: number, blockedUserIds?: string[]` | `Profile[]` |
| `getFavoriteUsers()` | Get favorited users | None | `Profile[]` |
| `toggleFavorite(userId)` | Toggle favorite status | `userId: string` | `boolean` |
| `updateNotificationPreferences(prefs)` | Update notification settings | Notification preference object | `void` |

### Blocking Functions

Located in `lib/api/blocking.ts`

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `getBlockedUserIds()` | Get all blocked user IDs (bidirectional) | None | `string[]` |
| `getBlockedUsers()` | Get blocked user profiles | None | `Profile[]` |
| `blockUser(userId)` | Block a user | `userId: string` | `void` |
| `unblockUser(userId)` | Unblock a user | `userId: string` | `void` |
| `isUserBlocked(userId)` | Check if user is blocked | `userId: string` | `boolean` |

### Profile Data Model

```typescript
interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  email: string | null
  phone: string | null
  date_of_birth: string | null  // 'YYYY-MM-DD'
  gender: 'male' | 'female' | 'prefer-not-to-say' | null
  my_skills: string | null
  my_ambition: string | null
  help_with: string | null
  tags: string[] | null
  is_favorite?: boolean
  push_notifications_enabled?: boolean
  notif_likes_enabled?: boolean
  notif_comments_enabled?: boolean
  notif_messages_enabled?: boolean
  notif_mentions_enabled?: boolean
  notif_leaderboard_enabled?: boolean
  current_streak?: number
  longest_streak?: number
  last_post_date?: string | null
  invited_by_user_id?: string | null
  referral_count?: number
  repost_count?: number
  created_at: string
  updated_at: string
}
```

---

## 2. Posts & Content

### Posts CRUD Functions

Located in `lib/api/posts.ts`

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `getPosts(params)` | Get paginated feed posts | `{ cursor?, limit?, blockedUserIds?, postType?, userId? }` | `Post[]` |
| `getPostById(postId)` | Get single post with details | `postId: string` | `Post` |
| `createPost(data)` | Create new post | `CreatePostData` | `Post` |
| `updatePost(postId, data)` | Update existing post | `postId: string, UpdatePostData` | `Post` |
| `deletePost(postId)` | Delete a post | `postId: string` | `void` |

### Feed Query Functions

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `searchPosts(query, limit?)` | Search posts by content | `query: string, limit?: number` | `Post[]` |
| `getWeeklyTopPosts(params)` | Get top posts from last 7 days | `{ limit?, blockedUserIds? }` | `Post[]` |
| `getTodayPostCountsByType()` | Get today's post counts by type | None | `Record<PostType, number>` |

### Engagement Functions

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `toggleLike(postId)` | Like/unlike a post | `postId: string` | `boolean` (true=liked) |
| `toggleRepost(postId)` | Repost/un-repost a post | `postId: string` | `boolean` (true=reposted) |
| `incrementViewCount(postId)` | Increment post view count | `postId: string` | `void` |
| `getPostsEngagement(postIds)` | Get engagement data for posts | `postIds: string[]` | `PostsEngagementMap` |

### Post Types

| Type | Label | Description | Icon Color |
|------|-------|-------------|------------|
| `win` | Win | Victories and achievements | Yellow |
| `dream` | Dream | Dreams and aspirations | Purple |
| `ask` | Ask | Advice or help requests | Blue |
| `hangout` | Hangout | Invitations to hang out | Green |
| `intro` | Intro | Introductions (profile-only) | Pink |
| `general` | General | General thoughts/updates | Gray |

### Post Data Model

```typescript
interface Post {
  id: string
  user_id: string
  content: string
  image_url: string | null
  video_url: string | null
  location_name: string | null
  location_latitude: number | null
  location_longitude: number | null
  post_type: 'win' | 'dream' | 'ask' | 'hangout' | 'intro' | 'general'
  views_count?: number
  quoted_post_id?: string | null
  leaderboard_category?: 'referrals' | 'likes' | 'comments' | 'views' | null
  is_visible?: boolean
  created_at: string
  updated_at: string
  // Joined data
  profiles?: Profile
  likes_count?: number
  comments_count?: number
  reposts_count?: number
  is_liked?: boolean
  is_reposted?: boolean
  quoted_post?: Post
}
```

### Create/Update Post Data

```typescript
interface CreatePostData {
  content: string
  image_url?: string
  video_url?: string
  post_type?: PostType
  quoted_post_id?: string
  location_name?: string
  location_latitude?: number
  location_longitude?: number
}

interface UpdatePostData {
  content?: string
  is_visible?: boolean
}
```

---

## 3. Comments System

### Comment Functions

Located in `lib/api/comments.ts`

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `getCommentsByPostId(postId, limit?)` | Get comments for a post (nested) | `postId: string, limit?: number` | `Comment[]` |
| `createComment(data)` | Create new comment | `CreateCommentData` | `Comment` |
| `updateComment(commentId, content)` | Update comment content | `commentId: string, content: string` | `Comment` |
| `deleteComment(commentId)` | Delete a comment | `commentId: string` | `void` |
| `getReplies(parentCommentId)` | Get replies to a comment | `parentCommentId: string` | `Comment[]` |
| `toggleCommentLike(commentId)` | Like/unlike a comment | `commentId: string` | `boolean` |
| `getCommentEngagement(commentId)` | Get comment like data | `commentId: string` | `{ likes_count, is_liked }` |

### Comment Data Model

```typescript
interface Comment {
  id: string
  post_id: string
  user_id: string
  content: string
  parent_id?: string | null  // For nested replies
  created_at: string
  updated_at: string
  profiles?: Profile
  likes_count?: number
  replies_count?: number
  is_liked?: boolean
  replies?: Comment[]  // Nested structure
}

interface CreateCommentData {
  post_id: string
  content: string
  parent_id?: string  // For replies
}
```

---

## 4. Messaging System

### Conversation Functions

Located in `lib/api/messages.ts`

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `getConversations()` | Get all user conversations | None | `Conversation[]` |
| `getConversationById(conversationId)` | Get single conversation | `conversationId: string` | `Conversation` |
| `getOrCreateConversation(otherUserId)` | Get/create 1-on-1 conversation | `otherUserId: string` | `string` (conversationId) |
| `createGroupConversation(participantIds, groupName?)` | Create group chat | `participantIds: string[], groupName?: string` | `string` (conversationId) |
| `leaveConversation(conversationId)` | Leave a group conversation | `conversationId: string` | `void` |
| `addParticipants(conversationId, userIds)` | Add users to group | `conversationId: string, userIds: string[]` | `void` |
| `removeParticipant(conversationId, userId)` | Remove user from group | `conversationId: string, userId: string` | `void` |

### Message Functions

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `getMessages(conversationId, limit?)` | Get messages in conversation | `conversationId: string, limit?: number` | `Message[]` |
| `sendMessage(data)` | Send a message | `SendMessageData` | `Message` |
| `markConversationAsRead(conversationId)` | Mark conversation as read | `conversationId: string` | `void` |
| `getUnreadCount()` | Get total unread message count | None | `number` |

### Message Data Models

```typescript
interface Conversation {
  id: string
  group_name?: string | null
  created_by?: string
  created_at: string
  updated_at: string
  participants?: Profile[]
  last_message?: Message
  unread_count?: number
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string | null
  content: string
  message_type?: 'text' | 'system' | 'image' | 'video'
  created_at: string
  updated_at: string
  profiles?: Profile
}

interface SendMessageData {
  conversation_id: string
  content: string
  message_type?: 'text' | 'image' | 'video'
}
```

---

## 5. Notifications

### Notification Functions

Located in `lib/api/notifications.ts`

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `getNotifications(limit?)` | Get user's notifications | `limit?: number` | `Notification[]` |
| `getUnreadNotificationCount()` | Get unread notification count | None | `number` |
| `markNotificationAsRead(notificationId)` | Mark single notification read | `notificationId: string` | `void` |
| `markAllNotificationsAsRead()` | Mark all notifications read | None | `void` |
| `deleteNotification(notificationId)` | Delete single notification | `notificationId: string` | `void` |
| `deleteAllNotifications()` | Delete all notifications | None | `void` |

### Notification Types

| Type | Description |
|------|-------------|
| `like` | Someone liked your post |
| `comment` | Someone commented on your post |
| `follow` | Someone followed you |
| `message` | New message received |
| `mention` | Someone mentioned you |
| `post_hidden` | Your post was hidden |
| `meet_request` | Someone sent a meet request |
| `meet_accepted` | Your meet request was accepted |

### Notification Data Model

```typescript
interface Notification {
  id: string
  user_id: string
  type: NotificationType
  actor_id: string | null
  post_id: string | null
  comment_id: string | null
  conversation_id: string | null
  content: string | null
  read_at: string | null
  created_at: string
  updated_at: string
  actor?: Profile
  post?: Post
}
```

---

## 6. Meet Feature (User Discovery)

### Discovery Functions

Located in `lib/api/meet.ts`

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `getDiscoverableUsers(options?)` | Get users for discovery | `{ limit?, excludeIds?, tags?, ignoreSwipeHistory? }` | `Profile[]` |
| `recordSwipe(swipedUserId, action)` | Record pass/connect action | `swipedUserId: string, action: 'pass' \| 'connect'` | `void` |
| `getSwipedUserIds()` | Get already-swiped user IDs | None | `string[]` |
| `clearSwipeHistory(actionType?)` | Clear swipe history | `actionType?: 'pass' \| 'connect'` | `void` |

### Meet Request Functions

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `sendMeetRequest(recipientId)` | Send connection request | `recipientId: string` | `MeetRequest` |
| `getPendingRequests()` | Get incoming pending requests | None | `MeetRequest[]` |
| `getSentRequests()` | Get outgoing requests | None | `MeetRequest[]` |
| `getPendingRequestCount()` | Get pending request count | None | `number` |
| `acceptRequest(requestId)` | Accept a meet request | `requestId: string` | `string` (conversationId) |
| `declineRequest(requestId)` | Decline a meet request | `requestId: string` | `void` |
| `cancelRequest(requestId)` | Cancel sent request | `requestId: string` | `void` |

### Meet Data Models

```typescript
interface MeetSwipeHistory {
  id: string
  user_id: string
  swiped_user_id: string
  action: 'pass' | 'connect'
  created_at: string
}

interface MeetRequest {
  id: string
  requester_id: string
  recipient_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  responded_at: string | null
  requester?: Profile
  recipient?: Profile
}
```

### Swipe Retention Policy

- **Pass**: Reappears after 7 days
- **Connect**: Reappears after 30 days

---

## 7. Media & Storage

### Upload Functions

Located in `lib/api/storage.ts`

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `uploadFile(file)` | Upload any media file (auto-detects type) | `file: File` | `FileUploadResponse` |
| `uploadImage(file)` | Upload image to storage | `file: File` | `FileUploadResponse` |
| `uploadVideo(file)` | Upload video to storage | `file: File` | `FileUploadResponse` |
| `uploadAvatar(file)` | Upload profile avatar (replaces old) | `file: File` | `FileUploadResponse` |
| `deleteFile(path)` | Delete file from storage | `path: string` | `void` |

### Article Image Functions

Located in `lib/api/articles.ts`

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `getArticleImageUrl(imagePath)` | Get public URL for article image | `imagePath: string` | `string` |
| `uploadArticleImage(file, category, fileName?)` | Upload article image | `file: File, category: string, fileName?: string` | `string \| null` |
| `deleteArticleImage(imagePath)` | Delete article image | `imagePath: string` | `boolean` |

### File Upload Response

```typescript
interface FileUploadResponse {
  url: string   // Public URL
  path: string  // Storage path
}
```

### Storage Configuration

- **Bucket**: `posts` (public read, authenticated write)
- **Articles Bucket**: `articles`
- **Image Types**: JPEG, PNG, GIF, WebP
- **Video Types**: MP4, QuickTime, WebM
- **Max Image Size**: 10MB
- **Max Video Size**: 100MB
- **Max Avatar Size**: 5MB

---

## 8. Ambitious Daily (Articles)

### Article Functions

Located in `lib/api/articles.ts`

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `fetchAmbitiousDailyArticles(options?)` | Get published articles | `{ category?, limit? }` | `ApiResponse<AmbitiousDailyArticle[]>` |
| `fetchAmbitiousDailyArticle(slug)` | Get single article by slug | `slug: string` | `ApiResponse<AmbitiousDailyArticle>` |

### API Route

**Endpoint**: `/api/ambitious-daily`

| Method | Query Params | Description |
|--------|--------------|-------------|
| GET | None | Get all published articles |
| GET | `?category=Health` | Filter by category |
| GET | `?limit=10` | Limit results |
| GET | `?slug=article-slug` | Get single article |

### Article Data Model

```typescript
interface AmbitiousDailyArticle {
  id: string
  slug: string
  title: string
  subtitle?: string | null
  excerpt?: string | null
  body: string                    // Markdown content
  category: string
  coverImagePath: string
  coverImageUrl?: string | null
  readTimeLabel?: string | null
  publishedAt?: string | null
  status: 'draft' | 'scheduled' | 'published'
  isFeatured: boolean
  tags: string[]
  seoTitle?: string | null
  seoDescription?: string | null
  externalUrl?: string | null     // For linking to external sources
  createdAt: string
  updatedAt: string
}
```

### Database Table: `ambitious_daily_articles`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| slug | text | URL slug (unique) |
| title | text | Article title |
| subtitle | text | Subtitle |
| excerpt | text | Short excerpt |
| body | text | Full content (markdown) |
| category | text | Category name |
| cover_image_path | text | Storage path |
| read_time_label | text | e.g., "5 min read" |
| published_at | timestamp | Publish date |
| status | text | draft/scheduled/published |
| is_featured | boolean | Featured flag |
| tags | text[] | Article tags |
| seo_title | text | SEO title |
| seo_description | text | SEO description |
| external_url | text | External link |

---

## 9. Premium Spotlight (Ads/Sponsors)

### Spotlight Functions

Located in `lib/api/premium-spotlight.ts`

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `getPremiumSpotlight(limit?)` | Get active spotlight items | `limit?: number` | `PremiumSpotlight[]` |
| `getAllPremiumSpotlight()` | Get all items (including inactive) | None | `PremiumSpotlight[]` |

### API Route for Ad Requests

**Endpoint**: `/api/submit-ad-request`

| Method | Description |
|--------|-------------|
| POST | Submit ad/sponsor request to webhook |

### Spotlight Data Model

```typescript
interface PremiumSpotlight {
  id: string
  name: string
  logo_url: string       // Can be emoji or image URL
  tagline: string
  link: string           // External URL
  cta_text: string       // e.g., "Learn more", "Get started"
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}
```

---

## 10. Edge Functions (Server-side)

Located in `lib/api/edge-functions.ts`

These functions call Supabase Edge Functions for operations that require server-side execution.

### Push Notifications

| Function | Description | Parameters |
|----------|-------------|------------|
| `sendPushNotification(data)` | Send push notification | `{ userId, title, body, data? }` |

### Phone Verification

| Function | Description | Parameters |
|----------|-------------|------------|
| `sendVerificationCode(data)` | Send SMS verification | `{ phone }` |
| `verifyPhoneCode(data)` | Verify SMS code | `{ phone, code }` |

### Password Reset

| Function | Description | Parameters |
|----------|-------------|------------|
| `sendPasswordResetCode(email)` | Send reset code via email | `email: string` |
| `resetPasswordWithCode(code, newPassword)` | Reset with code | `code: string, newPassword: string` |
| `verifyResetCode(code)` | Verify reset code is valid | `code: string` |

### Account Management

| Function | Description | Parameters |
|----------|-------------|------------|
| `deleteAccount()` | Delete user account and data | None |

### Leaderboard

| Function | Description | Parameters |
|----------|-------------|------------|
| `submitToLeaderboard(postId, category)` | Submit post to weekly leaderboard | `postId: string, category: 'referrals' \| 'likes' \| 'comments' \| 'views'` |

---

## 11. Database Tables Reference

### Core Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (linked to auth.users) |
| `posts` | All user posts |
| `comments` | Post comments (supports nesting) |
| `likes` | Post likes |
| `reposts` | Post reposts |
| `comment_likes` | Comment likes |

### Messaging Tables

| Table | Description |
|-------|-------------|
| `conversations` | DM and group conversations |
| `conversation_participants` | Conversation membership |
| `messages` | Individual messages |

### Social Tables

| Table | Description |
|-------|-------------|
| `notifications` | In-app notifications |
| `mentions` | @mentions in posts/comments |
| `blocked_users` | User blocking relationships |
| `invite_codes` | Signup invite codes |

### Meet Feature Tables

| Table | Description |
|-------|-------------|
| `meet_swipe_history` | Swipe actions (pass/connect) |
| `meet_requests` | Connection requests |

### Content Tables

| Table | Description |
|-------|-------------|
| `ambitious_daily_articles` | Daily articles |
| `premium_spotlight` | Sponsor/advertiser listings |

---

## 12. Constants & Limits

### Rate Limits (Backend Enforced)

| Action | Hourly Limit | Daily Limit |
|--------|--------------|-------------|
| Posts | 100 | 200 |
| Comments | 120 | 500 |
| Messages | 200 | 500 |

### File Size Limits

| Type | Max Size |
|------|----------|
| Images | 10MB |
| Videos | 100MB |
| Avatars | 5MB |

### Content Length Limits

| Field | Max Length |
|-------|------------|
| Post content | 5,000 characters |
| Comment content | 2,000 characters |
| Bio | 500 characters |
| Username | 3-20 characters |

### Streak System

- **Hours between posts**: 1 hour minimum
- **Hours until streak break**: 24 hours
- Database trigger handles streak logic automatically

### Profile Tags System

Located in `lib/profileTags.ts`

- **Max tags per user**: 15
- **Total categories**: 13
- **Total tags**: 300+

**Categories:**
1. Entrepreneurship & Business
2. Finance & Investing
3. Mindset & Performance
4. Software & Tech
5. Creativity & Design
6. Marketing & Growth
7. Fitness & Health
8. Lifestyle & Interests
9. AI & Future Tech
10. Content & Influence
11. Engineering & Hard Skills
12. Personal Development & Learning
13. Ambition-Ecosystem

---

## 13. Admin Panel Recommendations

### Suggested Admin Features

#### User Management
- [ ] View all users with search/filter
- [ ] View/edit user profiles
- [ ] View user statistics and activity
- [ ] Manage blocked users list
- [ ] Generate/manage invite codes
- [ ] Reset user passwords
- [ ] Delete user accounts

#### Content Moderation
- [ ] View all posts with filters (by type, date, user)
- [ ] Hide/unhide posts (set `is_visible`)
- [ ] Delete inappropriate posts
- [ ] View/delete comments
- [ ] Moderate reported content

#### Analytics Dashboard
- [ ] Daily/weekly/monthly post counts by type
- [ ] User registration trends
- [ ] Engagement metrics (likes, comments, reposts)
- [ ] Top posts by engagement
- [ ] Streak leaderboard
- [ ] Active users metrics

#### Messaging (Monitor Only)
- [ ] View conversation counts
- [ ] Monitor for spam patterns

#### Meet Feature
- [ ] View meet request statistics
- [ ] Monitor for abuse patterns

#### Articles Management
- [ ] Create/edit/delete articles
- [ ] Manage article images
- [ ] Set featured articles
- [ ] Schedule articles
- [ ] Manage categories and tags

#### Premium Spotlight
- [ ] Create/edit/delete sponsor listings
- [ ] Manage display order
- [ ] Toggle active/inactive status
- [ ] View ad request submissions

#### System
- [ ] View rate limit hits
- [ ] Monitor Edge Function calls
- [ ] View error logs

### Security Considerations

1. **RLS Policies**: Database uses Row Level Security. Admin panel should use a service role key for unrestricted access.

2. **Blocked Users**: RLS does NOT filter blocked users. Admin queries should be aware of blocking relationships.

3. **Sensitive Data**: Protect access to:
   - User emails and phones
   - Private messages
   - Password reset functionality

4. **Audit Logging**: Consider logging admin actions (who changed what, when).

5. **Rate Limiting**: Consider rate limiting admin actions to prevent accidental bulk operations.

### Direct Database Access Queries

For admin operations not covered by existing API functions, use Supabase admin client with service role:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // Use service role, not anon key
)

// Example: Get all users with post counts
const { data: users } = await supabaseAdmin
  .from('profiles')
  .select(`
    *,
    posts:posts(count)
  `)
  .order('created_at', { ascending: false })

// Example: Hide a post (admin action)
await supabaseAdmin
  .from('posts')
  .update({ is_visible: false })
  .eq('id', postId)

// Example: Get all invite codes with usage
const { data: codes } = await supabaseAdmin
  .from('invite_codes')
  .select(`
    *,
    creator:created_by_user_id(username),
    used_by:used_by_user_id(username)
  `)
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `lib/api/auth.ts` | Authentication functions |
| `lib/api/posts.ts` | Post CRUD and engagement |
| `lib/api/profiles.ts` | User profiles |
| `lib/api/comments.ts` | Comments system |
| `lib/api/messages.ts` | Messaging/DMs |
| `lib/api/notifications.ts` | Notifications |
| `lib/api/blocking.ts` | User blocking |
| `lib/api/meet.ts` | Meet feature |
| `lib/api/storage.ts` | File uploads |
| `lib/api/articles.ts` | Ambitious Daily |
| `lib/api/premium-spotlight.ts` | Sponsors |
| `lib/api/edge-functions.ts` | Server functions |
| `types/database.ts` | Data models |
| `types/api.ts` | API types |
| `lib/constants.ts` | App constants |
| `lib/profileTags.ts` | Tag system |

---

*Last Updated: November 2024*

