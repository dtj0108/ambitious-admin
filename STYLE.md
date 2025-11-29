# Ambitious Social - Style Guide

**Version:** 1.0.5
**Last Updated:** January 2025

This comprehensive style guide provides all design system specifications for building the web version of Ambitious Social. All values match the mobile app exactly to ensure visual consistency across platforms.

---

## Table of Contents

1. [Brand Identity](#brand-identity)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Border Radius](#border-radius)
6. [Shadows & Elevation](#shadows--elevation)
7. [Component Styles](#component-styles)
8. [Post Type System](#post-type-system)
9. [Iconography](#iconography)
10. [Animations & Transitions](#animations--transitions)
11. [Interaction Patterns](#interaction-patterns)
12. [Accessibility](#accessibility)
13. [Dark Mode](#dark-mode)
14. [Responsive Design](#responsive-design)
15. [UI States](#ui-states)
16. [Code Examples](#code-examples)

---

## Brand Identity

### Mission
Ambitious Social is a social media platform built for ambitious people to share wins, dreams, ask for help, and connect with like-minded individuals.

### Brand Personality
- **Ambitious**: Forward-thinking, goal-oriented
- **Supportive**: Community-focused, helpful
- **Modern**: Clean, minimalist design
- **Authentic**: Real conversations, genuine connections

### Voice & Tone
- Encouraging and motivational
- Friendly but professional
- Clear and concise
- Positive and uplifting

---

## Color System

### Theme Structure

Ambitious Social supports both **light** and **dark** themes. Use CSS custom properties for easy theme switching.

### Dark Theme (Default)

```css
:root[data-theme="dark"] {
  /* Backgrounds */
  --color-background: #000000;
  --color-surface: #0A0A0A;
  --color-card: #1A1A1A;
  --color-elevated: #2A2A2A;

  /* Text */
  --color-text: #E0E0E0;
  --color-text-secondary: #B0B0B0;
  --color-text-tertiary: #707070;
  --color-text-disabled: #505050;

  /* Borders */
  --color-border: #2A2A2A;
  --color-border-light: #1A1A1A;
  --color-border-strong: #404040;

  /* Primary Colors */
  --color-primary: #4A9EFF;
  --color-primary-light: rgba(74, 158, 255, 0.1);
  --color-primary-dark: #0051D5;

  /* Semantic Colors */
  --color-success: #00C853;
  --color-error: #CC0000;
  --color-warning: #FF9800;

  /* Special */
  --color-overlay: rgba(0, 0, 0, 0.5);
  --color-backdrop: rgba(0, 0, 0, 0.3);
}
```

### Light Theme

```css
:root[data-theme="light"] {
  /* Backgrounds */
  --color-background: #FFFFFF;
  --color-surface: #F8F9FA;
  --color-card: #FFFFFF;
  --color-elevated: #F0F0F0;

  /* Text */
  --color-text: #1C1E21;
  --color-text-secondary: #65676B;
  --color-text-tertiary: #8A8D91;
  --color-text-disabled: #BCC0C4;

  /* Borders */
  --color-border: #E1E4E8;
  --color-border-light: #F0F0F0;
  --color-border-strong: #C8CCD0;

  /* Primary Colors (same as dark) */
  --color-primary: #4A9EFF;
  --color-primary-light: rgba(74, 158, 255, 0.1);
  --color-primary-dark: #0051D5;

  /* Semantic Colors (same as dark) */
  --color-success: #00C853;
  --color-error: #CC0000;
  --color-warning: #FF9800;

  /* Special */
  --color-overlay: rgba(0, 0, 0, 0.3);
  --color-backdrop: rgba(0, 0, 0, 0.2);
}
```

### Post Type Colors

```css
:root {
  /* Post Type Badges */
  --color-post-win: #FFD700;
  --color-post-win-bg: rgba(255, 215, 0, 0.1);

  --color-post-dream: #4A9EFF;
  --color-post-dream-bg: rgba(74, 158, 255, 0.1);

  --color-post-ask: #FF9500;
  --color-post-ask-bg: rgba(255, 149, 0, 0.1);

  --color-post-hangout: #5856D6;
  --color-post-hangout-bg: rgba(88, 86, 214, 0.1);

  --color-post-intro: #4A9EFF;
  --color-post-intro-bg: rgba(74, 158, 255, 0.1);

  --color-post-general: #909090;
  --color-post-general-bg: rgba(144, 144, 144, 0.1);
}
```

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Dark theme colors
        dark: {
          background: '#000000',
          surface: '#0A0A0A',
          card: '#1A1A1A',
          elevated: '#2A2A2A',
          text: '#E0E0E0',
          'text-secondary': '#B0B0B0',
          'text-tertiary': '#707070',
          border: '#2A2A2A',
        },
        // Light theme colors
        light: {
          background: '#FFFFFF',
          surface: '#F8F9FA',
          card: '#FFFFFF',
          elevated: '#F0F0F0',
          text: '#1C1E21',
          'text-secondary': '#65676B',
          'text-tertiary': '#8A8D91',
          border: '#E1E4E8',
        },
        // Primary & semantic
        primary: '#4A9EFF',
        'primary-dark': '#0051D5',
        success: '#00C853',
        error: '#CC0000',
        warning: '#FF9800',
        // Post types
        'post-win': '#FFD700',
        'post-dream': '#4A9EFF',
        'post-ask': '#FF9500',
        'post-hangout': '#5856D6',
      },
    },
  },
};
```

---

## Typography

### Font Families

```css
:root {
  /* System font stack for optimal readability */
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
               'Helvetica Neue', Arial, sans-serif;
  --font-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Courier New', monospace;
}

body {
  font-family: var(--font-sans);
}
```

### Type Scale

```css
:root {
  /* Font Sizes */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 2rem;      /* 32px */

  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;

  /* Font Weights */
  --font-normal: 400;
  --font-medium: 600;
  --font-bold: 700;
}
```

### Typography Styles

```css
/* Headings */
h1 {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  line-height: 1.25;
  color: var(--color-text);
}

h2 {
  font-size: var(--text-2xl);
  font-weight: var(--font-medium);
  line-height: 1.33;
  color: var(--color-text);
}

h3 {
  font-size: var(--text-xl);
  font-weight: var(--font-medium);
  line-height: 1.4;
  color: var(--color-text);
}

/* Body Text */
body, p {
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  color: var(--color-text);
}

/* Small Text */
.text-small {
  font-size: var(--text-sm);
  line-height: 1.43;
}

.text-caption {
  font-size: var(--text-xs);
  line-height: 1.5;
  color: var(--color-text-secondary);
}
```

### Tailwind Typography

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      fontWeight: {
        normal: '400',
        medium: '600',
        bold: '700',
      },
    },
  },
};
```

---

## Spacing & Layout

### Spacing Scale (8-point grid)

```css
:root {
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-5: 1.25rem;  /* 20px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-12: 3rem;    /* 48px */
  --space-16: 4rem;    /* 64px */
}
```

### Layout Containers

```css
/* Max-width container for content */
.container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}

@media (min-width: 768px) {
  .container {
    max-width: 768px;
  }
}

@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
  }
}
```

### Screen Padding

- **Mobile**: 16px horizontal padding
- **Tablet/Desktop**: Same 16px, but content max-width constrains layout
- **Cards**: 16px internal padding
- **Sections**: 24px vertical spacing

---

## Border Radius

```css
:root {
  --radius-sm: 0.25rem;    /* 4px - Tags, small buttons */
  --radius-md: 0.5rem;     /* 8px - Buttons, inputs */
  --radius-lg: 0.75rem;    /* 12px - Cards */
  --radius-xl: 1rem;       /* 16px - Large cards */
  --radius-full: 9999px;   /* Pills, avatars */
}
```

### Usage Examples

```css
/* Buttons and Inputs */
button, input {
  border-radius: var(--radius-md);
}

/* Cards */
.card {
  border-radius: var(--radius-lg);
}

/* Avatars */
.avatar {
  border-radius: var(--radius-full);
}
```

---

## Shadows & Elevation

```css
:root {
  /* Small - Subtle elevation */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

  /* Medium - Cards, dropdowns */
  --shadow-md: 0 2px 8px 0 rgba(0, 0, 0, 0.1);

  /* Large - Modals, popovers */
  --shadow-lg: 0 4px 12px 0 rgba(0, 0, 0, 0.15);
}
```

### Usage

```css
.card {
  box-shadow: var(--shadow-md);
}

.modal {
  box-shadow: var(--shadow-lg);
}
```

---

## Component Styles

### Buttons

#### Primary Button

```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  color: #FFFFFF;
  background-color: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 150ms ease-out;
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

.btn-primary:active {
  transform: scale(0.98);
  opacity: 0.8;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

#### Secondary Button

```css
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  background-color: var(--color-elevated);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 150ms ease-out;
}

.btn-secondary:hover {
  background-color: var(--color-card);
}
```

#### Danger Button

```css
.btn-danger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-error);
  background-color: var(--color-card);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 150ms ease-out;
}
```

#### React + Tailwind Example

```tsx
// components/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  children,
  onClick,
  disabled,
  loading
}: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center min-h-[48px] px-6 py-3 font-semibold rounded-lg transition-all duration-150"

  const variantClasses = {
    primary: "bg-primary text-white border border-primary hover:bg-primary-dark active:scale-[0.98]",
    secondary: "bg-elevated text-secondary border border-border-strong hover:bg-card",
    danger: "bg-card text-error border border-error hover:bg-elevated",
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} disabled:opacity-50`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? <Spinner /> : children}
    </button>
  )
}
```

### Input Fields

```css
.input {
  width: 100%;
  min-height: 48px;
  padding: 12px 16px;
  font-size: 1rem;
  color: var(--color-text);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all 150ms ease-out;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  border-width: 2px;
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input.error {
  border-color: var(--color-error);
}

.input::placeholder {
  color: var(--color-text-tertiary);
  font-style: italic;
}
```

### Cards

```css
.card {
  background-color: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-md);
  transition: transform 150ms ease-out;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

#### Post Card

```css
.post-card {
  background-color: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
  box-shadow: var(--shadow-md);
}

.post-card__header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.post-card__content {
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  color: var(--color-text);
  margin-bottom: var(--space-4);
}

.post-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border-light);
}
```

### Avatars

```css
.avatar {
  display: inline-block;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  object-fit: cover;
}

/* Sizes */
.avatar-sm {
  width: 32px;
  height: 32px;
}

.avatar-md {
  width: 40px;
  height: 40px;
}

.avatar-lg {
  width: 48px;
  height: 48px;
}

.avatar-xl {
  width: 80px;
  height: 80px;
}

/* Fallback with initials */
.avatar-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-card);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  font-weight: 600;
  border-radius: var(--radius-full);
}
```

#### React Example

```tsx
interface AvatarProps {
  src?: string;
  username?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Avatar({ src, username, size = 'md' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-20 h-20 text-2xl',
  }

  if (src) {
    return (
      <img
        src={src}
        alt={username}
        className={`avatar rounded-full border border-border object-cover ${sizeClasses[size]}`}
      />
    )
  }

  const initial = username ? username[0].toUpperCase() : '?'

  return (
    <div className={`avatar-fallback flex items-center justify-center rounded-full border border-border bg-card text-text font-semibold ${sizeClasses[size]}`}>
      {initial}
    </div>
  )
}
```

---

## Post Type System

Each post has a type badge with specific colors and icons.

### Post Types

| Type | Icon | Color | Background | Label |
|------|------|-------|------------|-------|
| **Win** | Trophy | #FFD700 | rgba(255, 215, 0, 0.1) | Win |
| **Dream** | Rocket | #4A9EFF | rgba(74, 158, 255, 0.1) | Dream |
| **Ask** | Help Circle | #FF9500 | rgba(255, 149, 0, 0.1) | Ask |
| **Hangout** | People | #5856D6 | rgba(88, 86, 214, 0.1) | Hangout |
| **Intro** | Hand | #4A9EFF | rgba(74, 158, 255, 0.1) | Intro |
| **General** | Chat Bubble | #909090 | rgba(144, 144, 144, 0.1) | Post |

### Post Type Badge Component

```css
.post-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Variant classes */
.post-badge--win {
  color: #FFD700;
  background-color: rgba(255, 215, 0, 0.1);
}

.post-badge--dream {
  color: #4A9EFF;
  background-color: rgba(74, 158, 255, 0.1);
}

.post-badge--ask {
  color: #FF9500;
  background-color: rgba(255, 149, 0, 0.1);
}

.post-badge--hangout {
  color: #5856D6;
  background-color: rgba(88, 86, 214, 0.1);
}

.post-badge--intro {
  color: #4A9EFF;
  background-color: rgba(74, 158, 255, 0.1);
}

.post-badge--general {
  color: #909090;
  background-color: rgba(144, 144, 144, 0.1);
}
```

#### React Example

```tsx
import { Trophy, Rocket, HelpCircle, Users, Hand, MessageCircle } from 'lucide-react'

type PostType = 'win' | 'dream' | 'ask' | 'hangout' | 'intro' | 'general'

const postTypeConfig = {
  win: { icon: Trophy, label: 'Win', color: '#FFD700', bg: 'rgba(255, 215, 0, 0.1)' },
  dream: { icon: Rocket, label: 'Dream', color: '#4A9EFF', bg: 'rgba(74, 158, 255, 0.1)' },
  ask: { icon: HelpCircle, label: 'Ask', color: '#FF9500', bg: 'rgba(255, 149, 0, 0.1)' },
  hangout: { icon: Users, label: 'Hangout', color: '#5856D6', bg: 'rgba(88, 86, 214, 0.1)' },
  intro: { icon: Hand, label: 'Intro', color: '#4A9EFF', bg: 'rgba(74, 158, 255, 0.1)' },
  general: { icon: MessageCircle, label: 'Post', color: '#909090', bg: 'rgba(144, 144, 144, 0.1)' },
}

export function PostTypeBadge({ type }: { type: PostType }) {
  const config = postTypeConfig[type]
  const Icon = config.icon

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide"
      style={{ color: config.color, backgroundColor: config.bg }}
    >
      <Icon size={12} />
      {config.label}
    </span>
  )
}
```

---

## Iconography

### Recommended Libraries

For web, use one of these React icon libraries:

- **Lucide React** (recommended): https://lucide.dev/
- **Heroicons**: https://heroicons.com/
- **React Icons**: https://react-icons.github.io/react-icons/

### Icon Sizes

```css
:root {
  --icon-xs: 16px;
  --icon-sm: 20px;
  --icon-md: 24px;
  --icon-lg: 32px;
}
```

### Common Icons Mapping

| Action | Mobile (Ionicons) | Web (Lucide) |
|--------|------------------|--------------|
| Like | heart | Heart |
| Comment | chatbubble-outline | MessageCircle |
| Repost | repeat | Repeat |
| Share | share-outline | Share2 |
| Delete | trash-outline | Trash2 |
| Edit | pencil | Edit2 |
| Settings | settings-outline | Settings |
| User | person-outline | User |
| Close | close | X |
| Menu | menu | Menu |
| Search | search | Search |

### Usage Example

```tsx
import { Heart, MessageCircle, Repeat, Share2 } from 'lucide-react'

function PostActions() {
  return (
    <div className="flex gap-6">
      <button className="flex items-center gap-2">
        <Heart size={20} />
        <span>42</span>
      </button>
      <button className="flex items-center gap-2">
        <MessageCircle size={20} />
        <span>12</span>
      </button>
      <button className="flex items-center gap-2">
        <Repeat size={20} />
        <span>5</span>
      </button>
      <button>
        <Share2 size={20} />
      </button>
    </div>
  )
}
```

---

## Animations & Transitions

### Timing Functions

```css
:root {
  --ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0.0, 0.2, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### Duration

```css
:root {
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
}
```

### Common Animations

#### Button Press

```css
.btn:active {
  transform: scale(0.96);
  opacity: 0.8;
  transition: all var(--duration-fast) var(--ease-out);
}
```

#### Like Animation

```css
@keyframes like {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.like-button.liked {
  animation: like var(--duration-slow) var(--ease-spring);
  color: #FF4458;
}
```

#### Fade In

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn var(--duration-normal) var(--ease-out);
}
```

#### Skeleton Loading

```css
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface) 0%,
    var(--color-elevated) 50%,
    var(--color-surface) 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite linear;
}
```

---

## Interaction Patterns

### Touch/Click Targets

```css
/* Minimum touch target size */
button, a, input[type="checkbox"], input[type="radio"] {
  min-width: 44px;
  min-height: 44px;
}
```

### Hover States (Web-Specific)

```css
.interactive:hover {
  background-color: var(--color-elevated);
  cursor: pointer;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.link:hover {
  color: var(--color-primary);
  text-decoration: underline;
}
```

### Focus States (Keyboard Navigation)

```css
*:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

*:focus:not(:focus-visible) {
  outline: none;
}

*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Loading States

```css
.loading {
  position: relative;
  pointer-events: none;
  opacity: 0.6;
}

.loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  margin: -10px 0 0 -10px;
  border: 2px solid var(--color-primary);
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## Accessibility

### Color Contrast

Ensure all text meets WCAG AA standards:
- **Normal text**: 4.5:1 contrast ratio
- **Large text** (18px+ or 14px+ bold): 3:1 contrast ratio
- **UI components**: 3:1 contrast ratio

### Focus Indicators

```css
/* Always show focus for keyboard navigation */
*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

### ARIA Labels

```tsx
// Good example
<button aria-label="Like post">
  <Heart size={20} />
</button>

// Image with alt text
<img src={post.image_url} alt={`Image from ${post.username}`} />

// Loading state
<button aria-busy="true" aria-label="Posting...">
  <Spinner />
</button>
```

### Screen Reader Only Text

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

---

## Dark Mode

### Implementation with CSS Variables

```typescript
// hooks/useTheme.ts
import { useEffect, useState } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    // Get saved preference or system preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

    setTheme(savedTheme || systemTheme)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return { theme, toggleTheme }
}
```

### Theme Toggle Component

```tsx
import { Moon, Sun } from 'lucide-react'
import { useTheme } from './hooks/useTheme'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-elevated transition-colors"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  )
}
```

---

## Responsive Design

### Breakpoints

```css
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
}
```

### Media Queries

```css
/* Mobile first approach */

/* Base styles (mobile) */
.container {
  padding: 1rem;
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }

  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
    margin: 0 auto;
  }

  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Responsive Typography

```css
html {
  font-size: 16px;
}

@media (min-width: 768px) {
  html {
    font-size: 17px;
  }
}

@media (min-width: 1024px) {
  html {
    font-size: 18px;
  }
}
```

---

## UI States

### Empty States

```tsx
import { Inbox } from 'lucide-react'

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon size={48} className="text-text-tertiary mb-4" />
      <h3 className="text-xl font-semibold text-text mb-2">{title}</h3>
      <p className="text-text-secondary mb-6 max-w-sm">{description}</p>
      {action}
    </div>
  )
}

// Usage
<EmptyState
  icon={MessageCircle}
  title="No posts yet"
  description="Be the first to share something with the community!"
  action={<Button>Create Post</Button>}
/>
```

### Loading States

```tsx
export function SkeletonPost() {
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-surface skeleton" />
        <div className="flex-1">
          <div className="h-4 w-32 bg-surface skeleton mb-2" />
          <div className="h-3 w-24 bg-surface skeleton" />
        </div>
      </div>
      <div className="h-4 bg-surface skeleton mb-2" />
      <div className="h-4 bg-surface skeleton w-3/4" />
    </div>
  )
}
```

### Error States

```tsx
import { AlertCircle } from 'lucide-react'

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle size={48} className="text-error mb-4" />
      <h3 className="text-xl font-semibold text-text mb-2">Something went wrong</h3>
      <p className="text-text-secondary mb-6 max-w-sm">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  )
}
```

---

## Code Examples

### Complete Post Card Component (React + Tailwind)

```tsx
import { Heart, MessageCircle, Repeat, Share2, MoreHorizontal } from 'lucide-react'
import { Avatar } from './Avatar'
import { PostTypeBadge } from './PostTypeBadge'
import { formatDistanceToNow } from 'date-fns'

interface PostCardProps {
  post: {
    id: string
    content: string
    post_type: PostType
    created_at: string
    likes_count: number
    comments_count: number
    reposts_count: number
    is_liked: boolean
    is_reposted: boolean
    profiles: {
      username: string
      full_name: string
      avatar_url?: string
    }
  }
  onLike: (postId: string) => void
  onComment: (postId: string) => void
  onRepost: (postId: string) => void
}

export function PostCard({ post, onLike, onComment, onRepost }: PostCardProps) {
  return (
    <article className="bg-card border border-border rounded-lg p-4 mb-4 shadow-md hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar
            src={post.profiles.avatar_url}
            username={post.profiles.username}
            size="md"
          />
          <div>
            <p className="font-semibold text-text">{post.profiles.full_name}</p>
            <p className="text-sm text-text-secondary">@{post.profiles.username}</p>
          </div>
        </div>
        <button className="p-2 hover:bg-elevated rounded-full transition-colors">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Post Type Badge */}
      <div className="mb-3">
        <PostTypeBadge type={post.post_type} />
      </div>

      {/* Content */}
      <p className="text-text leading-normal mb-4">
        {post.content}
      </p>

      {/* Timestamp */}
      <p className="text-xs text-text-tertiary mb-4">
        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
      </p>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-border-light">
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-2 hover:text-error transition-colors ${
            post.is_liked ? 'text-error' : 'text-text-secondary'
          }`}
        >
          <Heart size={20} fill={post.is_liked ? 'currentColor' : 'none'} />
          <span className="text-sm">{post.likes_count}</span>
        </button>

        <button
          onClick={() => onComment(post.id)}
          className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors"
        >
          <MessageCircle size={20} />
          <span className="text-sm">{post.comments_count}</span>
        </button>

        <button
          onClick={() => onRepost(post.id)}
          className={`flex items-center gap-2 hover:text-success transition-colors ${
            post.is_reposted ? 'text-success' : 'text-text-secondary'
          }`}
        >
          <Repeat size={20} />
          <span className="text-sm">{post.reposts_count}</span>
        </button>

        <button className="text-text-secondary hover:text-primary transition-colors">
          <Share2 size={20} />
        </button>
      </div>
    </article>
  )
}
```

---

## Quick Reference

### Common CSS Classes (Tailwind)

```tsx
// Buttons
className="btn-primary bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark"
className="btn-secondary bg-elevated border border-border-strong px-6 py-3 rounded-lg"

// Cards
className="card bg-card border border-border rounded-lg p-4 shadow-md"

// Text
className="text-text"                    // Primary text
className="text-text-secondary"          // Secondary text
className="text-text-tertiary"           // Tertiary text

// Spacing
className="p-4"      // Padding 16px
className="m-4"      // Margin 16px
className="gap-3"    // Gap 12px

// Flex
className="flex items-center justify-between gap-4"

// Grid
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
```

---

**End of Style Guide**

For implementation questions or missing specifications, refer to the mobile codebase in `lib/theme.ts` and component files.
