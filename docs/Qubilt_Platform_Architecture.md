# Qubilt — Modular Open-Source Business Platform
## Complete Platform Architecture & Build Plan v1.0

---

## 1. Vision & Brand

**Qubilt** ("Kyu-bilt", rhymes with "built") is a modular, self-hostable business platform where every capability — from project management to CRM to chat — is a **plugin** that can be independently enabled, disabled, installed, or replaced. An integrated **Marketplace** allows third-party developers to build, distribute, and sell module licenses.

**Positioning:** Think Nextcloud meets Notion meets Jira meets Salesforce — but fully modular, fully open-source at the core, with an ecosystem for paid extensions.

**Primary tagline:** Build your business, block by block.

### 1.1 Brand Identity Summary

| Element | Specification |
|---------|--------------|
| **Name** | Qubilt |
| **Pronunciation** | "Kyu-bilt" — never QUBILT, qubilt, or Q-bilt |
| **npm scope** | `@qubilt` |
| **Domain** | qubilt.com |
| **Logo mark** | Isometric cube with breakout block at bottom-right corner |
| **Primary color** | `#8B5CF6` (Purple 500) |
| **Display font** | Plus Jakarta Sans 800 |
| **Mono font** | JetBrains Mono |
| **Corner radius** | 12px (cards), 8px (buttons/inputs) |

### 1.2 Tagline Hierarchy

| Context | Tagline |
|---------|---------|
| **Primary** | Build your business, block by block. |
| **Technical** | The modular platform for everything. |
| **Marketing** | One platform. Every module you need. |
| **Enterprise** | Deploy once. Run everything. |
| **Compact** | Modular business OS. |

---

## 2. Platform Principles

1. **Everything is a Module** — Even core PM features are modules. The kernel only handles auth, routing, permissions, storage, events, and the module lifecycle.
2. **Module Isolation** — Modules declare their own routes, DB migrations, UI panels, permissions, settings, and event handlers. They can depend on other modules but never reach into their internals directly.
3. **Cross-Module Communication** — Via a typed Event Bus (pub/sub). Modules emit events; others subscribe. No direct imports between modules.
4. **Admin Control** — Workspace admins enable/disable modules per workspace or per project. Users never see disabled modules.
5. **Marketplace-Ready** — Third-party modules follow the same API contract as first-party ones. The marketplace handles distribution, licensing, versioning, and payments.
6. **API-First** — Every module exposes a REST API. The frontend consumes the same API that external integrations use.

---

## 3. Design System

> **This section is the canonical reference for all UI decisions. Claude Code must follow these specifications exactly. Do not deviate without updating this document first.**

### 3.1 Design Philosophy

Qubilt's UI is inspired by **Linear** — fast, sharp, opinionated, and beautiful in both light and dark. The isometric cube logo is the design metaphor: structured and systematic, but with moments of expressiveness breaking out of the grid. Every UI decision should reflect:

- **Precision over decoration** — Use color purposefully, not decoratively
- **Speed as a feature** — Micro-animations that feel fast, not flashy
- **Information density balanced** — Comfortable breathing room (Notion/Height density), not sparse, not cramped
- **Keyboard-first feel** — Even in visual design, everything should feel like it responds to intent

### 3.2 Color Palette

#### Raw Palette Tokens

```css
/* tokens/colors.css */

:root {
  /* Primary Purple */
  --color-purple-50:  #F5F3FF;
  --color-purple-100: #EDE9FE;
  --color-purple-200: #DDD6FE;
  --color-purple-300: #C4B5FD;
  --color-purple-400: #A78BFA;
  --color-purple-500: #8B5CF6;  /* ★ Primary brand color */
  --color-purple-600: #7C3AED;
  --color-purple-700: #6D28D9;
  --color-purple-800: #5B21B6;
  --color-purple-900: #4C1D95;
  --color-purple-950: #1E1B4B;

  /* Violet-Tinted Neutrals — never use pure grays */
  --color-neutral-50:  #FAFAFE;
  --color-neutral-100: #F1F0F7;
  --color-neutral-200: #E4E2EE;
  --color-neutral-300: #C9C6D9;
  --color-neutral-400: #9E99B7;
  --color-neutral-500: #756F94;
  --color-neutral-600: #5A5478;
  --color-neutral-700: #433E5C;
  --color-neutral-800: #2D2942;
  --color-neutral-900: #1A1730;
  --color-neutral-950: #0F0B1E;

  /* Semantic */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error:   #EF4444;
  --color-info:    #6366F1;
}
```

#### Semantic Token Mapping

```css
/* tokens/themes/light.css */
[data-theme="light"] {
  /* Surfaces */
  --surface-base:       var(--color-neutral-50);
  --surface-raised:     #FFFFFF;
  --surface-overlay:    #FFFFFF;
  --surface-sunken:     var(--color-neutral-100);
  --surface-inverse:    var(--color-neutral-950);

  /* Borders */
  --border-default:     var(--color-neutral-200);
  --border-strong:      var(--color-neutral-300);
  --border-focus:       var(--color-purple-500);
  --border-inverse:     var(--color-neutral-700);

  /* Text */
  --text-primary:       var(--color-neutral-950);
  --text-secondary:     var(--color-neutral-600);
  --text-tertiary:      var(--color-neutral-400);
  --text-disabled:      var(--color-neutral-300);
  --text-inverse:       var(--color-neutral-50);
  --text-on-accent:     #FFFFFF;

  /* Accent */
  --accent-default:     var(--color-purple-500);
  --accent-hover:       var(--color-purple-600);
  --accent-pressed:     var(--color-purple-700);
  --accent-subtle:      var(--color-purple-100);
  --accent-subtle-text: var(--color-purple-700);

  /* Sidebar */
  --sidebar-bg:         #FFFFFF;
  --sidebar-border:     var(--color-neutral-200);
  --sidebar-item-hover: var(--color-neutral-100);
  --sidebar-item-active-bg:   var(--color-purple-100);
  --sidebar-item-active-text: var(--color-purple-700);
}

/* tokens/themes/dark.css */
[data-theme="dark"] {
  /* Surfaces */
  --surface-base:       var(--color-neutral-950);
  --surface-raised:     var(--color-neutral-900);
  --surface-overlay:    var(--color-neutral-800);
  --surface-sunken:     #080614;
  --surface-inverse:    var(--color-neutral-50);

  /* Borders */
  --border-default:     var(--color-neutral-800);
  --border-strong:      var(--color-neutral-700);
  --border-focus:       var(--color-purple-400);
  --border-inverse:     var(--color-neutral-300);

  /* Text */
  --text-primary:       var(--color-neutral-50);
  --text-secondary:     var(--color-neutral-400);
  --text-tertiary:      var(--color-neutral-600);
  --text-disabled:      var(--color-neutral-700);
  --text-inverse:       var(--color-neutral-950);
  --text-on-accent:     #FFFFFF;

  /* Accent */
  --accent-default:     var(--color-purple-400);
  --accent-hover:       var(--color-purple-300);
  --accent-pressed:     var(--color-purple-200);
  --accent-subtle:      rgba(139,92,246,0.15);
  --accent-subtle-text: var(--color-purple-300);

  /* Sidebar */
  --sidebar-bg:         var(--color-neutral-950);
  --sidebar-border:     var(--color-neutral-800);
  --sidebar-item-hover: rgba(255,255,255,0.05);
  --sidebar-item-active-bg:   rgba(139,92,246,0.15);
  --sidebar-item-active-text: var(--color-purple-300);
}
```

### 3.3 Module Accent Colors

Each module gets a unique accent color following Linear's team color pattern. These are used for the module icon background, active sidebar indicator, and subtle tints within the module's UI.

| Module | Accent | Hex | Usage |
|--------|--------|-----|-------|
| **Projects / PM** | Blue | `#3B82F6` | Task highlights, Gantt bars |
| **Wiki** | Amber | `#F59E0B` | Page icons, callout borders |
| **Chat** | Green | `#10B981` | Online indicators, message accents |
| **CRM** | Pink | `#EC4899` | Deal stages, contact chips |
| **Helpdesk** | Orange | `#F97316` | Priority badges, SLA timers |
| **HR / People** | Teal | `#14B8A6` | Employee status, leave calendar |
| **Finance** | Emerald | `#059669` | Invoice status, revenue charts |
| **OKRs** | Purple | `#8B5CF6` | Progress rings, alignment tree |
| **Assets** | Slate | `#64748B` | Category chips, status badges |
| **Whiteboard** | Fuchsia | `#D946EF` | Canvas accents, brush colors |
| **Video** | Red | `#EF4444` | Recording indicator, live status |
| **Code** | Cyan | `#06B6D4` | Syntax highlighting, file type |
| **Forums** | Indigo | `#6366F1` | Post categories, vote count |
| **Marketplace** | Violet gradient | `#7C3AED→#A855F7` | Store badges, publisher tags |

Each module accent is defined as a CSS variable pair:
```css
--module-pm-accent:      #3B82F6;
--module-pm-accent-bg:   rgba(59,130,246,0.1);  /* light */
--module-pm-accent-dark: rgba(59,130,246,0.15); /* dark */
```

### 3.4 Typography

```css
/* tokens/typography.css */
:root {
  --font-display: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  --font-mono:    'JetBrains Mono', 'Fira Code', monospace;

  /* Type scale */
  --text-display: 48px;  /* font-weight: 800; letter-spacing: -1.5px */
  --text-h1:      36px;  /* font-weight: 800; letter-spacing: -1px  */
  --text-h2:      24px;  /* font-weight: 700; letter-spacing: -0.5px */
  --text-h3:      18px;  /* font-weight: 700; letter-spacing: 0     */
  --text-body:    16px;  /* font-weight: 400; line-height: 1.6      */
  --text-small:   14px;  /* font-weight: 500; line-height: 1.5      */
  --text-overline: 12px; /* font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase */
  --text-mono:    14px;  /* JetBrains Mono; line-height: 1.7        */
}
```

**Google Fonts import (add to shell `index.html`):**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### 3.5 Spacing Scale

Base unit: **4px**. All spacing must use this scale.

```css
/* tokens/spacing.css */
:root {
  --space-0:  0px;
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
}
```

### 3.6 Border Radius

```css
/* tokens/radius.css */
:root {
  --radius-sm:   4px;   /* small tags, badges */
  --radius-md:   8px;   /* buttons, inputs    */
  --radius-lg:   12px;  /* cards, panels      */
  --radius-xl:   16px;  /* modals, drawers    */
  --radius-full: 9999px;/* pills, avatars      */
}
```

### 3.7 Elevation & Shadows

Linear-style — subtle, not dramatic. Shadow base color uses the dark neutral `#0F0B1E`.

```css
/* tokens/shadows.css */
:root {
  --shadow-0: none;
  --shadow-1: 0 1px 3px rgba(15,11,30,0.08), 0 1px 2px rgba(15,11,30,0.04);
  --shadow-2: 0 4px 12px rgba(15,11,30,0.10), 0 2px 4px rgba(15,11,30,0.06);
  --shadow-3: 0 8px 24px rgba(15,11,30,0.14), 0 4px 8px rgba(15,11,30,0.08);
  --shadow-4: 0 20px 48px rgba(15,11,30,0.22), 0 8px 16px rgba(15,11,30,0.10);
}

/* Usage:
  shadow-0 → flat elements, tables
  shadow-1 → cards, inputs on focus
  shadow-2 → dropdowns, popovers, tooltips
  shadow-3 → modals, drawers, dialogs
  shadow-4 → command palette (Cmd+K)
*/
```

### 3.8 Motion Tokens

```css
/* tokens/motion.css */
:root {
  --duration-fast:   100ms;
  --duration-base:   150ms;
  --duration-slow:   250ms;
  --duration-slower: 400ms;

  /* Linear's signature spring-like easing */
  --ease-default: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in:      cubic-bezier(0.4, 0, 1, 1);
  --ease-out:     cubic-bezier(0, 0, 0.2, 1);
  --ease-linear:  linear;
}

/* Standard transition shorthand */
.transition-default { transition: all var(--duration-base) var(--ease-default); }
```

### 3.9 Sidebar Behavior

The sidebar is **collapsible**: expanded by default (240px), collapses to icon-only mode (56px). User preference is persisted in `localStorage`.

```
Expanded:                    Collapsed:
┌────────────────────┐       ┌──────┐
│ ◉ Qubilt      [←] │       │  ◉   │
│ ─────────────────  │       │ ──── │
│ 📋 Projects        │       │  📋  │
│ 📖 Wiki            │       │  📖  │
│ 💬 Chat            │       │  💬  │
│ 🤝 CRM             │       │  🤝  │
└────────────────────┘       └──────┘
```

- Collapse toggle: chevron button at top-right of sidebar
- Collapsed state: icons only, tooltips on hover
- Mobile (< 768px): sidebar becomes a slide-over drawer, hidden by default
- Active item: `accent-subtle` background + `accent-subtle-text` color + 2px left border in module accent color

### 3.10 Component Specifications

#### Buttons

```
Primary:   bg=accent-default, text=white, hover=accent-hover
Secondary: bg=surface-raised, border=border-default, hover=surface-sunken
Ghost:     bg=transparent, text=text-secondary, hover=surface-sunken
Danger:    bg=error, text=white, hover=darkened error

Height: 36px (default), 32px (sm), 40px (lg)
Padding: 0 16px
Border-radius: var(--radius-md) = 8px
Font: 14px / 600
```

#### Inputs

```
Height: 36px
Border: 1px solid var(--border-default)
Border-radius: var(--radius-md) = 8px
Focus: border-color=var(--border-focus), box-shadow=0 0 0 3px rgba(139,92,246,0.15)
Background: var(--surface-raised)
Font: 14px / 400
```

#### Cards

```
Background: var(--surface-raised)
Border: 1px solid var(--border-default)
Border-radius: var(--radius-lg) = 12px
Shadow: var(--shadow-1)
Padding: 24px (default), 16px (compact)
```

#### Badges / Tags

```
Border-radius: var(--radius-sm) = 4px
Padding: 2px 8px
Font: 12px / 600
```

### 3.11 Theming Architecture

The kernel provides a `ThemeProvider` that applies the correct CSS class to `<html>`:

```tsx
// Resolves in order: workspace custom theme > user preference > system preference
<html data-theme="light | dark">
```

Workspace admins can override specific CSS variables (stored in the `Theme` DB table) — these are injected as a `<style>` tag at runtime, after the base theme:

```html
<!-- Base theme (built at deploy time) -->
<link rel="stylesheet" href="/tokens/light.css">

<!-- Workspace custom theme (injected at runtime) -->
<style id="workspace-theme">
  [data-theme] {
    --accent-default: #E11D48;  /* workspace chose red as brand color */
    --accent-hover: #BE123C;
  }
</style>
```

---

## 4. Platform Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND SHELL                           │
│  React App Shell (routing, layout, auth, module UI loader)      │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐            │
│  │ PM UI │ │CRM UI │ │Chat UI│ │Docs UI│ │ ...   │  ← Module  │
│  │Plugin │ │Plugin │ │Plugin │ │Plugin │ │Plugins│    UI Panels │
│  └───────┘ └───────┘ └───────┘ └───────┘ └───────┘            │
├─────────────────────────────────────────────────────────────────┤
│                      API GATEWAY / ROUTER                       │
│  Route prefix per module: /api/v1/pm/*, /api/v1/crm/*, etc.    │
├─────────────────────────────────────────────────────────────────┤
│                       PLATFORM KERNEL                           │
│  ┌──────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐            │
│  │   Auth   │ │  RBAC  │ │Event Bus │ │ Module   │            │
│  │ Service  │ │ Engine │ │ (Redis)  │ │ Registry │            │
│  └──────────┘ └────────┘ └──────────┘ └──────────┘            │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐            │
│  │ Storage  │ │Notification│ │  Jobs  │ │ Search   │            │
│  │ Service  │ │ Service   │ │ Queue  │ │ Index    │            │
│  └──────────┘ └──────────┘ └────────┘ └──────────┘            │
├─────────────────────────────────────────────────────────────────┤
│                        MODULE LAYER                             │
│  CORE MODULES (ship with platform):                             │
│  ┌────────────┐ ┌─────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │  Project   │ │  Wiki / │ │  Chat /  │ │  CRM             │ │
│  │  Management│ │  Docs   │ │Messaging │ │ (Contacts/Deals) │ │
│  └────────────┘ └─────────┘ └──────────┘ └──────────────────┘ │
│  ┌────────────┐ ┌─────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │  Helpdesk  │ │  HR /   │ │ Finance  │ │  OKRs / Goals    │ │
│  │  Ticketing │ │  People │ │  Invoice │ │                  │ │
│  └────────────┘ └─────────┘ └──────────┘ └──────────────────┘ │
│  ┌────────────┐ ┌─────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Whiteboard │ │  Video  │ │   Code   │ │ Asset/Inventory  │ │
│  │            │ │  Conf.  │ │  Editor  │ │                  │ │
│  └────────────┘ └─────────┘ └──────────┘ └──────────────────┘ │
│  MARKETPLACE MODULES (third-party):                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Installed via Marketplace → same module interface        │  │
│  └──────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                        DATA LAYER                               │
│  PostgreSQL 16+ │ Redis 7+ │ S3/MinIO │ Meilisearch (optional) │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Tech Stack

| Layer | Technology | Version | Why |
|-------|-----------|---------|-----|
| **Runtime** | Node.js | 20 LTS | Platform uniformity |
| **Backend Framework** | NestJS | 10+ | Module system maps perfectly to plugin architecture |
| **ORM** | Prisma | 6.x | Per-module schemas, type-safe queries |
| **Database** | PostgreSQL | 16+ | JSONB, ltree, FTS, partitioning |
| **Cache / Pub-Sub** | Redis | 7+ | Event bus, sessions, cache, presence, queues |
| **Job Queue** | BullMQ | Latest | Background jobs, scheduled tasks, email |
| **Search** | Meilisearch | Latest | Fast full-text; falls back to `pg_trgm` |
| **Frontend** | React | 18.x | Ecosystem + workforce availability |
| **Routing** | React Router | 7.x | Nested layouts, lazy loading |
| **Server State** | TanStack Query | 5.x | Server cache, optimistic updates |
| **Client State** | Zustand | 5.x | Lightweight global state |
| **UI Kit** | shadcn/ui + Tailwind CSS | v4 | Accessible, themeable, composable |
| **Rich Text** | TipTap | 2.x | Collaborative editing, extensible |
| **Whiteboard** | tldraw | v3+ | Open-source infinite canvas |
| **Video** | LiveKit | Latest | WebRTC SFU, self-hosted |
| **Code Editor** | Monaco Editor | Latest | VS Code's engine |
| **Real-time** | Socket.IO | 4.x | Live updates, presence, chat |
| **Auth** | Passport.js + Custom | Latest | Local, LDAP, OIDC, SAML, 2FA (TOTP) |
| **File Storage** | S3-compatible (MinIO) | Latest | Abstracted; works with AWS S3, local |
| **Email** | Nodemailer + MJML | Latest | Transactional templates |
| **Collaboration** | Y.js | Latest | CRDT for wiki and whiteboard co-editing |
| **Monorepo** | Turborepo + pnpm workspaces | Latest | Per-module packages, parallel builds |
| **Testing** | Vitest + Supertest + Playwright | Latest | Unit / Integration / E2E |
| **Containerization** | Docker + Docker Compose | Latest | Dev + production deployment |
| **CI/CD** | GitHub Actions | — | Automated test, build, publish |

---

## 6. Module System (The Kernel)

### 6.1 Module Interface (Backend)

Every module — first-party or third-party — implements this contract:

```typescript
// packages/module-sdk/src/types.ts

export interface QubiltModule {
  /** Unique identifier: e.g. "@qubilt/pm", "@acme/custom-crm" */
  id: string;

  /** Human-readable name */
  name: string;

  /** Semantic version */
  version: string;

  /** Module description */
  description: string;

  /** Icon (Lucide icon name or URL) */
  icon: string;

  /** Category for marketplace */
  category: ModuleCategory;

  /** Module dependencies (other module IDs) */
  dependencies?: string[];

  /** The NestJS module class */
  module: Type<any>; // NestJS DynamicModule

  /**
   * Database schema path (Prisma schema file).
   * The kernel runs migrations per module in dependency order.
   */
  prismaSchema?: string;

  /** Permissions this module registers */
  permissions?: PermissionDefinition[];

  /** Settings schema (JSON Schema) for admin config */
  settingsSchema?: Record<string, any>;

  /** Navigation items to register in the sidebar */
  navigation?: NavigationItem[];

  /** Dashboard widgets this module provides */
  widgets?: WidgetDefinition[];

  /** Event subscriptions */
  eventHandlers?: EventSubscription[];

  /** Search providers (what entities are searchable) */
  searchProviders?: SearchProvider[];

  /** Module accent color (hex) — used in sidebar and icon backgrounds */
  accentColor: string;

  /** Lifecycle hooks */
  onInstall?(): Promise<void>;
  onEnable?(workspaceId: string): Promise<void>;
  onDisable?(workspaceId: string): Promise<void>;
  onUninstall?(): Promise<void>;
}

export interface PermissionDefinition {
  key: string;           // "pm.work_packages.view"
  name: string;          // "View work packages"
  category: string;      // "Project Management"
  description?: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  scope: 'global' | 'project' | 'personal';
  position?: number;
  parent?: string;
  requiredPermission?: string;
  accentColor?: string;   // Overrides module default for this nav item
}

export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  component: string;     // Frontend component path
  defaultSize: { w: number; h: number };
  scopes: ('project_overview' | 'my_page' | 'dashboard')[];
}

export interface EventSubscription {
  event: string;         // e.g. "work_package.created"
  handler: string;       // Method name on a registered service
}

export interface SearchProvider {
  entity: string;
  displayName: string;
  searchFields: string[];
  resultMapper: (item: any) => SearchResult;
}

export type ModuleCategory =
  | 'project-management'
  | 'collaboration'
  | 'communication'
  | 'crm-sales'
  | 'hr-people'
  | 'finance'
  | 'development'
  | 'analytics'
  | 'productivity'
  | 'integration'
  | 'other';
```

### 6.2 Module Interface (Frontend)

```typescript
// packages/module-sdk/src/frontend-types.ts

export interface QubiltModuleFrontend {
  id: string;

  /** Module accent color — applied to sidebar item border, icon bg */
  accentColor: string;

  /** Lazy-loaded route definitions */
  routes: ModuleRoute[];

  /** Sidebar navigation items */
  navigation: NavigationItem[];

  /** Dashboard widgets (React components) */
  widgets?: Record<string, React.LazyExoticComponent<any>>;

  /** Slash-command contributions for the command palette */
  commands?: CommandDefinition[];

  /** Settings panel component */
  settingsPanel?: React.LazyExoticComponent<any>;

  /** Contributions to other modules' UI (extension points) */
  extensions?: ExtensionPoint[];
}

export interface ModuleRoute {
  path: string;
  component: React.LazyExoticComponent<any>;
  layout?: 'project' | 'global' | 'admin' | 'fullscreen';
  requiredPermission?: string;
}

export interface ExtensionPoint {
  /** Where to inject: e.g. "work_package.detail.sidebar" */
  slot: string;
  component: React.LazyExoticComponent<any>;
  priority?: number;
}
```

### 6.3 Module Registry & Lifecycle

```
Install → Migrate DB → Register permissions → Register routes →
Enable per workspace → Load frontend → Active

Disable → Remove from sidebar → Hide routes → Keep data

Uninstall → Run onUninstall hook → Drop module tables (optional) → Remove
```

### 6.4 Event Bus

```typescript
// Typed events — each module extends the global EventMap via declaration merging

interface EventBus {
  emit<T extends keyof EventMap>(event: T, payload: EventMap[T]): void;
  on<T extends keyof EventMap>(event: T, handler: (payload: EventMap[T]) => void): void;
}

interface EventMap {
  // Kernel events
  'user.created':    { userId: string };
  'user.updated':    { userId: string; changes: string[] };
  'module.enabled':  { moduleId: string; workspaceId: string };
  'module.disabled': { moduleId: string; workspaceId: string };
}

// PM module extends:
declare module '@qubilt/event-bus' {
  interface EventMap {
    'work_package.created':  { workPackageId: string; projectId: string };
    'work_package.updated':  { workPackageId: string; changes: JournalDetail[] };
    'work_package.assigned': { workPackageId: string; assigneeId: string; subject: string };
    'work_package.deleted':  { workPackageId: string };
    'time_entry.created':    { userId: string; hours: number; projectId: string; workPackageId: string };
  }
}

// CRM module extends:
declare module '@qubilt/event-bus' {
  interface EventMap {
    'deal.created':       { dealId: string };
    'deal.stage_changed': { dealId: string; oldStage: string; newStage: string };
    'deal.closed_won':    { dealId: string; contactId: string; value: number };
    'contact.created':    { contactId: string };
  }
}

// Helpdesk extends:
declare module '@qubilt/event-bus' {
  interface EventMap {
    'ticket.created':   { ticketId: string };
    'ticket.escalated': { ticketId: string; reason: string };
    'ticket.resolved':  { ticketId: string };
  }
}
```

### 6.5 Extension Slots (Frontend)

Modules expose "slots" where other modules inject UI panels:

```tsx
// In the PM module's WorkPackageDetail component:
<ExtensionSlot name="work_package.detail.sidebar" context={{ workPackageId }} />

// The CRM module registers into this slot:
extensions: [{
  slot: 'work_package.detail.sidebar',
  component: lazy(() => import('./LinkedDealsPanel')),
}]

// The Helpdesk module also registers:
extensions: [{
  slot: 'work_package.detail.sidebar',
  component: lazy(() => import('./LinkedTicketsPanel')),
}]
```

**Standard extension slots:**

| Slot | Provided by | Description |
|------|-------------|-------------|
| `work_package.detail.sidebar` | PM | Right sidebar in WP detail |
| `work_package.detail.tab` | PM | Extra tabs in WP detail |
| `contact.detail.sidebar` | CRM | Right sidebar in contact detail |
| `ticket.detail.sidebar` | Helpdesk | Right sidebar in ticket detail |
| `project.overview.widgets` | Kernel | Project overview dashboard |
| `global.topbar.actions` | Kernel | Top bar action buttons |
| `user.profile.sections` | Kernel | Extra sections in user profile |

---

## 7. Monorepo Structure

```
qubilt/
├── apps/
│   ├── api/                              # NestJS API (thin shell that loads modules)
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── kernel/
│   │   │   │   ├── kernel.module.ts
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.module.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── strategies/
│   │   │   │   │   │   ├── local.strategy.ts
│   │   │   │   │   │   ├── jwt.strategy.ts
│   │   │   │   │   │   ├── ldap.strategy.ts
│   │   │   │   │   │   ├── oidc.strategy.ts
│   │   │   │   │   │   └── saml.strategy.ts
│   │   │   │   │   ├── two-factor/
│   │   │   │   │   │   ├── totp.service.ts
│   │   │   │   │   │   └── totp.controller.ts
│   │   │   │   │   └── guards/
│   │   │   │   │       ├── auth.guard.ts
│   │   │   │   │       ├── roles.guard.ts
│   │   │   │   │       └── module-enabled.guard.ts
│   │   │   │   ├── users/
│   │   │   │   ├── workspaces/
│   │   │   │   ├── rbac/
│   │   │   │   ├── modules/
│   │   │   │   │   ├── module-registry.service.ts
│   │   │   │   │   ├── module-lifecycle.service.ts
│   │   │   │   │   └── module-loader.ts
│   │   │   │   ├── events/
│   │   │   │   │   ├── event-bus.module.ts
│   │   │   │   │   └── event-bus.service.ts
│   │   │   │   ├── storage/
│   │   │   │   │   ├── storage.module.ts
│   │   │   │   │   ├── storage.service.ts
│   │   │   │   │   └── adapters/
│   │   │   │   │       ├── local.adapter.ts
│   │   │   │   │       ├── s3.adapter.ts
│   │   │   │   │       └── storage.interface.ts
│   │   │   │   ├── notifications/
│   │   │   │   │   ├── notification.service.ts
│   │   │   │   │   ├── email.service.ts
│   │   │   │   │   └── templates/
│   │   │   │   ├── jobs/
│   │   │   │   ├── search/
│   │   │   │   ├── settings/
│   │   │   │   ├── themes/
│   │   │   │   ├── webhooks/
│   │   │   │   ├── audit/
│   │   │   │   ├── realtime/
│   │   │   │   └── marketplace/
│   │   │   ├── database/
│   │   │   │   ├── prisma/
│   │   │   │   │   ├── kernel.prisma
│   │   │   │   │   ├── migrations/
│   │   │   │   │   └── seed.ts
│   │   │   │   └── migration-runner.ts
│   │   │   └── config/
│   │   ├── nest-cli.json
│   │   └── package.json
│   │
│   ├── web/                              # React frontend shell
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── shell/
│   │   │   │   ├── AppShell.tsx          # Main layout (sidebar + content)
│   │   │   │   ├── Sidebar.tsx           # Collapsible sidebar, module nav
│   │   │   │   ├── SidebarItem.tsx       # Nav item w/ accent color support
│   │   │   │   ├── TopBar.tsx
│   │   │   │   ├── CommandPalette.tsx    # Cmd+K
│   │   │   │   ├── NotificationCenter.tsx
│   │   │   │   ├── ModuleRouter.tsx      # Lazy-loads module routes
│   │   │   │   ├── ExtensionSlot.tsx
│   │   │   │   ├── ThemeProvider.tsx     # Resolves and applies theme
│   │   │   │   └── ModuleLoader.tsx
│   │   │   ├── pages/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── Login.tsx
│   │   │   │   │   ├── Register.tsx
│   │   │   │   │   ├── ForgotPassword.tsx
│   │   │   │   │   └── TwoFactor.tsx
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── MyPage.tsx
│   │   │   │   │   └── WidgetGrid.tsx
│   │   │   │   ├── admin/
│   │   │   │   │   ├── AdminLayout.tsx
│   │   │   │   │   ├── Users.tsx
│   │   │   │   │   ├── Roles.tsx
│   │   │   │   │   ├── Modules.tsx
│   │   │   │   │   ├── Marketplace.tsx
│   │   │   │   │   ├── Themes.tsx
│   │   │   │   │   ├── Settings.tsx
│   │   │   │   │   └── AuditLog.tsx
│   │   │   │   └── projects/
│   │   │   │       ├── ProjectList.tsx
│   │   │   │       ├── ProjectLayout.tsx
│   │   │   │       └── ProjectSettings.tsx
│   │   │   ├── components/
│   │   │   │   ├── ui/                   # shadcn/ui primitives
│   │   │   │   ├── editor/               # TipTap rich text
│   │   │   │   ├── data-table/
│   │   │   │   ├── kanban/
│   │   │   │   ├── calendar/
│   │   │   │   ├── file-upload/
│   │   │   │   ├── user-picker/
│   │   │   │   └── charts/
│   │   │   ├── hooks/
│   │   │   ├── stores/                   # Zustand: auth, ui, modules
│   │   │   ├── lib/                      # API client, socket, permissions
│   │   │   ├── tokens/                   # CSS token files (imported here)
│   │   │   │   ├── colors.css
│   │   │   │   ├── typography.css
│   │   │   │   ├── spacing.css
│   │   │   │   ├── radius.css
│   │   │   │   ├── shadows.css
│   │   │   │   ├── motion.css
│   │   │   │   └── themes/
│   │   │   │       ├── light.css
│   │   │   │       └── dark.css
│   │   │   └── types/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── marketplace-api/                  # Marketplace backend (separate NestJS service)
│       ├── src/
│       │   ├── listings/
│       │   ├── publishers/
│       │   ├── licenses/
│       │   ├── payments/
│       │   ├── reviews/
│       │   └── distribution/
│       └── package.json
│
├── modules/
│   ├── pm/             # Project Management
│   ├── wiki/           # Knowledge Base / Docs
│   ├── chat/           # Chat / Messaging
│   ├── crm/            # CRM
│   ├── helpdesk/       # Helpdesk / Ticketing
│   ├── hr/             # HR / People
│   ├── finance/        # Finance / Invoicing
│   ├── okrs/           # OKRs / Goals
│   ├── assets/         # Asset / Inventory
│   ├── whiteboard/     # Whiteboard
│   ├── video/          # Video Conferencing
│   ├── code/           # Code Editor
│   └── forums/         # Forums
│   # Each module follows this internal structure:
│   # module-name/
│   #   api/src/          (NestJS module, controllers, services, prisma schema)
│   #   ui/src/           (React routes, components, widgets, manifest.ts)
│
├── packages/
│   ├── module-sdk/       # QubiltModule interface, decorators, event bus, hooks
│   ├── shared/           # Global types, Zod schemas, permission keys, event names
│   └── ui-kit/           # Shared React components: DataTable, Kanban, Calendar, etc.
│
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   ├── Dockerfile.api
│   ├── Dockerfile.web
│   └── Dockerfile.marketplace
│
├── docs/
│   ├── module-development-guide.md
│   ├── marketplace-publisher-guide.md
│   ├── api-reference.md
│   ├── deployment-guide.md
│   └── architecture.md
│
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── .env.example
```

---

## 8. Kernel Database Schema

The kernel owns identity, workspaces, RBAC, module registry, and all cross-cutting concerns. Each module owns its own schema in a separate Prisma file, sharing the same PostgreSQL database with prefixed table names.

```prisma
// apps/api/src/database/prisma/kernel.prisma

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "multiSchema"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── WORKSPACES ───────────────────────────────────────────────────

model Workspace {
  id          String   @id @default(cuid())
  name        String   @db.VarChar(255)
  slug        String   @unique @db.VarChar(100)
  logoUrl     String?
  plan        String   @default("free") @db.VarChar(50)
  ownerId     String
  settings    Json     @default("{}")
  theme       Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  owner            User              @relation("WorkspaceOwner", fields: [ownerId], references: [id])
  members          WorkspaceMember[]
  enabledModules   WorkspaceModule[]
  projects         Project[]
  roles            Role[]
  settings_entries Setting[]
  invitations      Invitation[]
  auditLogs        AuditLog[]
  themes           Theme[]
  webhooks         Webhook[]

  @@map("workspaces")
}

model WorkspaceMember {
  id          String   @id @default(cuid())
  workspaceId String
  userId      String
  roleId      String
  joinedAt    DateTime @default(now())

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      Role      @relation(fields: [roleId], references: [id])

  @@unique([workspaceId, userId])
  @@map("workspace_members")
}

// ─── USERS & AUTH ─────────────────────────────────────────────────

model User {
  id             String     @id @default(cuid())
  email          String     @unique @db.VarChar(255)
  username       String     @unique @db.VarChar(100)
  displayName    String     @db.VarChar(255)
  avatarUrl      String?
  hashedPassword String?
  status         UserStatus @default(ACTIVE)
  language       String     @default("en") @db.VarChar(10)
  timeZone       String     @default("UTC") @db.VarChar(100)
  emailVerified  Boolean    @default(false)
  lastLoginAt    DateTime?
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt

  twoFactorEnabled Boolean  @default(false)
  twoFactorSecret  String?  @db.VarChar(255)
  backupCodes      String[] @default([])

  authProviders        UserAuthProvider[]
  ownedWorkspaces      Workspace[]           @relation("WorkspaceOwner")
  workspaceMemberships WorkspaceMember[]
  projectMemberships   ProjectMember[]
  sessions             Session[]
  apiKeys              ApiKey[]
  notifications        Notification[]
  notificationPrefs    NotificationPreference[]
  auditLogs            AuditLog[]

  @@map("users")
}

enum UserStatus {
  ACTIVE
  INVITED
  LOCKED
  DEACTIVATED
}

model UserAuthProvider {
  id             String @id @default(cuid())
  userId         String
  provider       String @db.VarChar(50)   // "ldap", "oidc", "saml", "google", "github"
  providerUserId String @db.VarChar(255)
  metadata       Json?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerUserId])
  @@map("user_auth_providers")
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique @db.VarChar(512)
  userAgent String?  @db.VarChar(512)
  ipAddress String?  @db.VarChar(45)
  expiresAt DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@map("sessions")
}

model ApiKey {
  id          String    @id @default(cuid())
  userId      String
  name        String    @db.VarChar(255)
  keyHash     String    @unique @db.VarChar(255)
  keyPrefix   String    @db.VarChar(10)
  permissions String[]  @default([])
  lastUsedAt  DateTime?
  expiresAt   DateTime?
  createdAt   DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("api_keys")
}

model Invitation {
  id          String    @id @default(cuid())
  workspaceId String
  email       String    @db.VarChar(255)
  roleId      String
  token       String    @unique @db.VarChar(255)
  invitedBy   String
  acceptedAt  DateTime?
  expiresAt   DateTime
  createdAt   DateTime  @default(now())

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@map("invitations")
}

// ─── PROJECTS ─────────────────────────────────────────────────────

model Project {
  id          String   @id @default(cuid())
  workspaceId String
  name        String   @db.VarChar(255)
  identifier  String   @db.VarChar(100)    // Short code e.g. "PROJ"
  description String?  @db.Text
  isPublic    Boolean  @default(false)
  active      Boolean  @default(true)
  parentId    String?
  lft         Int      @default(0)         // Nested set for hierarchy
  rgt         Int      @default(0)
  icon        String?  @db.VarChar(50)
  color       String?  @db.VarChar(7)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  workspace      Workspace       @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  parent         Project?        @relation("ProjectHierarchy", fields: [parentId], references: [id])
  children       Project[]       @relation("ProjectHierarchy")
  members        ProjectMember[]
  enabledModules ProjectModule[]

  @@unique([workspaceId, identifier])
  @@index([workspaceId])
  @@index([parentId])
  @@map("projects")
}

model ProjectMember {
  id        String   @id @default(cuid())
  projectId String
  userId    String
  createdAt DateTime @default(now())

  project Project             @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  roles   ProjectMemberRole[]

  @@unique([projectId, userId])
  @@map("project_members")
}

model ProjectMemberRole {
  id              String        @id @default(cuid())
  projectMemberId String
  roleId          String

  projectMember ProjectMember @relation(fields: [projectMemberId], references: [id], onDelete: Cascade)
  role          Role          @relation(fields: [roleId], references: [id])

  @@unique([projectMemberId, roleId])
  @@map("project_member_roles")
}

model ProjectModule {
  id        String @id @default(cuid())
  projectId String
  moduleId  String @db.VarChar(100)

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@unique([projectId, moduleId])
  @@map("project_modules")
}

// ─── RBAC ─────────────────────────────────────────────────────────

model Role {
  id          String   @id @default(cuid())
  workspaceId String
  name        String   @db.VarChar(255)
  description String?  @db.Text
  builtin     String?  @db.VarChar(50)     // "admin", "member", "viewer", null for custom
  position    Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  workspace        Workspace           @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  permissions      RolePermission[]
  workspaceMembers WorkspaceMember[]
  projectMembers   ProjectMemberRole[]

  @@unique([workspaceId, name])
  @@map("roles")
}

model RolePermission {
  id         String @id @default(cuid())
  roleId     String
  permission String @db.VarChar(150)  // "pm.work_packages.edit"

  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([roleId, permission])
  @@map("role_permissions")
}

// ─── MODULE REGISTRY ──────────────────────────────────────────────

model InstalledModule {
  id            String        @id @default(cuid())
  moduleId      String        @db.VarChar(100)  // "@qubilt/pm"
  version       String        @db.VarChar(50)
  source        ModuleSource
  licenseKey    String?       @db.VarChar(512)
  licenseStatus LicenseStatus @default(ACTIVE)
  installedAt   DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  enabledInWorkspaces WorkspaceModule[]

  @@unique([moduleId])
  @@map("installed_modules")
}

model WorkspaceModule {
  id                String  @id @default(cuid())
  workspaceId       String
  installedModuleId String
  enabled           Boolean @default(true)
  settings          Json    @default("{}")

  workspace       Workspace       @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  installedModule InstalledModule @relation(fields: [installedModuleId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, installedModuleId])
  @@map("workspace_modules")
}

enum ModuleSource {
  CORE
  MARKETPLACE
  CUSTOM
}

enum LicenseStatus {
  ACTIVE
  EXPIRED
  TRIAL
  INVALID
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────

model Notification {
  id           String    @id @default(cuid())
  recipientId  String
  moduleId     String    @db.VarChar(100)
  reason       String    @db.VarChar(100)
  title        String    @db.VarChar(500)
  body         String?   @db.Text
  resourceType String    @db.VarChar(100)
  resourceId   String
  link         String?   @db.VarChar(500)
  readAt       DateTime?
  emailSent    Boolean   @default(false)
  createdAt    DateTime  @default(now())

  recipient User @relation(fields: [recipientId], references: [id], onDelete: Cascade)

  @@index([recipientId, readAt])
  @@map("notifications")
}

model NotificationPreference {
  id       String  @id @default(cuid())
  userId   String
  moduleId String  @db.VarChar(100)
  event    String  @db.VarChar(100)
  inApp    Boolean @default(true)
  email    Boolean @default(true)
  push     Boolean @default(false)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, moduleId, event])
  @@map("notification_preferences")
}

// ─── AUDIT LOG ────────────────────────────────────────────────────

model AuditLog {
  id           String   @id @default(cuid())
  workspaceId  String
  userId       String?
  moduleId     String   @db.VarChar(100)
  action       String   @db.VarChar(100)
  resourceType String   @db.VarChar(100)
  resourceId   String
  changes      Json?
  ipAddress    String?  @db.VarChar(45)
  userAgent    String?  @db.VarChar(512)
  createdAt    DateTime @default(now())

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user      User?     @relation(fields: [userId], references: [id])

  @@index([workspaceId, createdAt])
  @@index([resourceType, resourceId])
  @@map("audit_logs")
}

// ─── ATTACHMENTS ──────────────────────────────────────────────────

model Attachment {
  id            String   @id @default(cuid())
  workspaceId   String
  moduleId      String   @db.VarChar(100)
  containerType String   @db.VarChar(100)
  containerId   String
  fileName      String   @db.VarChar(255)
  fileSize      Int
  mimeType      String   @db.VarChar(255)
  storagePath   String   @db.VarChar(512)
  digest        String?  @db.VarChar(128)
  virusScanned  Boolean  @default(false)
  uploadedById  String
  createdAt     DateTime @default(now())

  @@index([containerType, containerId])
  @@index([workspaceId])
  @@map("attachments")
}

// ─── SETTINGS ─────────────────────────────────────────────────────

model Setting {
  id          String @id @default(cuid())
  workspaceId String
  moduleId    String @default("kernel") @db.VarChar(100)
  key         String @db.VarChar(255)
  value       Json

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, moduleId, key])
  @@map("settings")
}

// ─── WEBHOOKS ─────────────────────────────────────────────────────

model Webhook {
  id          String   @id @default(cuid())
  workspaceId String
  name        String   @db.VarChar(255)
  url         String   @db.VarChar(2000)
  secret      String?  @db.VarChar(255)
  events      String[]
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  deliveries WebhookDelivery[]
  workspace  Workspace         @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@map("webhooks")
}

model WebhookDelivery {
  id          String   @id @default(cuid())
  webhookId   String
  event       String   @db.VarChar(100)
  payload     Json
  statusCode  Int?
  response    String?  @db.Text
  success     Boolean  @default(false)
  deliveredAt DateTime @default(now())

  webhook Webhook @relation(fields: [webhookId], references: [id], onDelete: Cascade)

  @@index([webhookId, deliveredAt])
  @@map("webhook_deliveries")
}

// ─── THEMES ───────────────────────────────────────────────────────

model Theme {
  id          String   @id @default(cuid())
  workspaceId String
  name        String   @db.VarChar(255)
  variables   Json     // CSS variable overrides
  logoUrl     String?
  faviconUrl  String?
  isActive    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@map("themes")
}
```

---

## 9. Module Database Schemas

> **All module schemas use the same PostgreSQL database as the kernel, but own their own tables with a module-specific prefix. Migrations are run per-module in dependency order by the kernel's migration runner.**

### 9.1 PM Module Schema

```prisma
// modules/pm/api/src/prisma/pm.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── WORK PACKAGE TYPES & STATUSES ────────────────────────────────

model PmType {
  id          String  @id @default(cuid())
  workspaceId String
  name        String  @db.VarChar(100)
  color       String  @db.VarChar(7)
  isDefault   Boolean @default(false)
  isMilestone Boolean @default(false)
  position    Int     @default(0)

  workPackages   PmWorkPackage[]
  workflowStates PmWorkflowState[]

  @@unique([workspaceId, name])
  @@map("pm_types")
}

model PmStatus {
  id          String          @id @default(cuid())
  workspaceId String
  name        String          @db.VarChar(100)
  color       String          @db.VarChar(7)
  isClosed    Boolean         @default(false)
  isDefault   Boolean         @default(false)
  isReadonly  Boolean         @default(false)
  position    Int             @default(0)

  workPackages   PmWorkPackage[]
  workflowStates PmWorkflowState[]

  @@unique([workspaceId, name])
  @@map("pm_statuses")
}

model PmPriority {
  id          String @id @default(cuid())
  workspaceId String
  name        String @db.VarChar(100)
  color       String @db.VarChar(7)
  isDefault   Boolean @default(false)
  isActive    Boolean @default(true)
  position    Int    @default(0)

  workPackages PmWorkPackage[]

  @@unique([workspaceId, name])
  @@map("pm_priorities")
}

// ─── WORK PACKAGES ────────────────────────────────────────────────

model PmWorkPackage {
  id          String    @id @default(cuid())
  projectId   String                          // FK to kernel projects table
  typeId      String
  statusId    String
  priorityId  String?
  subject     String    @db.VarChar(500)
  description String?   @db.Text
  assigneeId  String?                         // FK to kernel users table
  authorId    String                          // FK to kernel users table
  parentId    String?
  lft         Int       @default(0)           // Nested set for WBS
  rgt         Int       @default(0)
  startDate   DateTime? @db.Date
  dueDate     DateTime? @db.Date
  estimatedHours Decimal? @db.Decimal(10,2)
  spentHours  Decimal   @default(0) @db.Decimal(10,2)
  percentDone Int       @default(0)           // 0-100
  versionId   String?
  categoryId  String?
  storyPoints Int?
  position    Int       @default(0)           // Manual sort order
  scheduleManually Boolean @default(false)    // Override auto-scheduling
  ignoreNonWorkingDays Boolean @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  closedAt    DateTime?

  type     PmType     @relation(fields: [typeId], references: [id])
  status   PmStatus   @relation(fields: [statusId], references: [id])
  priority PmPriority? @relation(fields: [priorityId], references: [id])
  version  PmVersion?  @relation(fields: [versionId], references: [id])
  category PmCategory? @relation(fields: [categoryId], references: [id])
  parent   PmWorkPackage?  @relation("WPHierarchy", fields: [parentId], references: [id])
  children PmWorkPackage[] @relation("WPHierarchy")

  relations     PmRelation[]    @relation("SourceWP")
  relationsFrom PmRelation[]    @relation("TargetWP")
  timeEntries   PmTimeEntry[]
  journals      PmJournal[]
  customValues  PmCustomValue[]
  boardCards    PmBoardCard[]
  budgetItems   PmBudgetItem[]

  @@index([projectId])
  @@index([assigneeId])
  @@index([statusId])
  @@index([parentId])
  @@map("pm_work_packages")
}

// ─── VERSIONS / MILESTONES ────────────────────────────────────────

model PmVersion {
  id          String        @id @default(cuid())
  projectId   String
  name        String        @db.VarChar(255)
  description String?       @db.Text
  status      VersionStatus @default(OPEN)
  startDate   DateTime?     @db.Date
  dueDate     DateTime?     @db.Date
  sharing     VersionSharing @default(NONE)
  wikiPageId  String?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  workPackages PmWorkPackage[]

  @@index([projectId])
  @@map("pm_versions")
}

enum VersionStatus  { OPEN LOCKED CLOSED }
enum VersionSharing { NONE DESCENDANTS HIERARCHY TREE SYSTEM }

// ─── CATEGORIES ───────────────────────────────────────────────────

model PmCategory {
  id          String @id @default(cuid())
  projectId   String
  name        String @db.VarChar(255)
  defaultAssigneeId String?

  workPackages PmWorkPackage[]

  @@unique([projectId, name])
  @@map("pm_categories")
}

// ─── RELATIONS ────────────────────────────────────────────────────

model PmRelation {
  id           String       @id @default(cuid())
  fromId       String
  toId         String
  type         RelationType
  delay        Int?         // Days (for "follows" relation)
  description  String?      @db.VarChar(255)
  createdAt    DateTime     @default(now())

  from PmWorkPackage @relation("SourceWP", fields: [fromId], references: [id], onDelete: Cascade)
  to   PmWorkPackage @relation("TargetWP", fields: [toId], references: [id], onDelete: Cascade)

  @@unique([fromId, toId, type])
  @@map("pm_relations")
}

enum RelationType {
  RELATES
  DUPLICATES
  DUPLICATED_BY
  BLOCKS
  BLOCKED_BY
  PRECEDES
  FOLLOWS
  INCLUDES
  PART_OF
  REQUIRES
  REQUIRED_BY
}

// ─── TIME ENTRIES ─────────────────────────────────────────────────

model PmTimeEntry {
  id            String   @id @default(cuid())
  workPackageId String?
  projectId     String
  userId        String
  hours         Decimal  @db.Decimal(10,2)
  comment       String?  @db.Text
  spentOn       DateTime @db.Date
  activityId    String?
  billable      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  workPackage PmWorkPackage? @relation(fields: [workPackageId], references: [id])
  activity    PmTimeActivity? @relation(fields: [activityId], references: [id])

  @@index([projectId])
  @@index([userId])
  @@map("pm_time_entries")
}

model PmTimeActivity {
  id          String  @id @default(cuid())
  workspaceId String
  name        String  @db.VarChar(100)
  isDefault   Boolean @default(false)
  isActive    Boolean @default(true)

  timeEntries PmTimeEntry[]

  @@map("pm_time_activities")
}

// ─── CUSTOM FIELDS ────────────────────────────────────────────────

model PmCustomField {
  id             String          @id @default(cuid())
  workspaceId    String
  name           String          @db.VarChar(255)
  fieldFormat    CustomFieldType
  isRequired     Boolean         @default(false)
  isFilter       Boolean         @default(false)
  searchable     Boolean         @default(false)
  defaultValue   String?         @db.Text
  possibleValues Json?           // For list/hierarchy types
  position       Int             @default(0)
  createdAt      DateTime        @default(now())

  customValues PmCustomValue[]

  @@map("pm_custom_fields")
}

enum CustomFieldType {
  STRING
  TEXT
  INTEGER
  FLOAT
  BOOL
  DATE
  DATETIME
  LIST
  MULTI_LIST
  USER
  VERSION
  HIERARCHY    // Enterprise: nested option tree
}

model PmCustomValue {
  id            String @id @default(cuid())
  workPackageId String
  customFieldId String
  value         String @db.Text

  workPackage PmWorkPackage @relation(fields: [workPackageId], references: [id], onDelete: Cascade)
  customField PmCustomField @relation(fields: [customFieldId], references: [id], onDelete: Cascade)

  @@unique([workPackageId, customFieldId])
  @@map("pm_custom_values")
}

// ─── JOURNALS (ACTIVITY LOG) ──────────────────────────────────────

model PmJournal {
  id            String   @id @default(cuid())
  workPackageId String
  userId        String
  notes         String?  @db.Text
  createdAt     DateTime @default(now())

  workPackage PmWorkPackage  @relation(fields: [workPackageId], references: [id], onDelete: Cascade)
  details     PmJournalDetail[]

  @@index([workPackageId])
  @@map("pm_journals")
}

model PmJournalDetail {
  id        String  @id @default(cuid())
  journalId String
  property  String  @db.VarChar(100)
  oldValue  String? @db.Text
  newValue  String? @db.Text

  journal PmJournal @relation(fields: [journalId], references: [id], onDelete: Cascade)

  @@map("pm_journal_details")
}

// ─── BOARDS ───────────────────────────────────────────────────────

model PmBoard {
  id        String    @id @default(cuid())
  projectId String
  name      String    @db.VarChar(255)
  type      BoardType
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  columns PmBoardColumn[]

  @@index([projectId])
  @@map("pm_boards")
}

enum BoardType {
  MANUAL
  STATUS
  ASSIGNEE
  VERSION
  SUBPROJECT
  PARENT_CHILD
}

model PmBoardColumn {
  id       String @id @default(cuid())
  boardId  String
  name     String @db.VarChar(255)
  position Int    @default(0)
  query    Json?  // Filter query for dynamic columns (status/assignee boards)

  board PmBoard      @relation(fields: [boardId], references: [id], onDelete: Cascade)
  cards PmBoardCard[]

  @@map("pm_board_columns")
}

model PmBoardCard {
  id            String @id @default(cuid())
  columnId      String
  workPackageId String
  position      Int    @default(0)

  column      PmBoardColumn @relation(fields: [columnId], references: [id], onDelete: Cascade)
  workPackage PmWorkPackage @relation(fields: [workPackageId], references: [id], onDelete: Cascade)

  @@unique([columnId, workPackageId])
  @@map("pm_board_cards")
}

// ─── WORKFLOWS ────────────────────────────────────────────────────

model PmWorkflowState {
  id          String @id @default(cuid())
  workspaceId String
  typeId      String
  statusId    String
  roleId      String
  allowCreate Boolean @default(false)

  type   PmType   @relation(fields: [typeId], references: [id], onDelete: Cascade)
  status PmStatus @relation(fields: [statusId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, typeId, statusId, roleId])
  @@map("pm_workflow_states")
}

// ─── SPRINTS / BACKLOGS ───────────────────────────────────────────

model PmSprint {
  id          String      @id @default(cuid())
  projectId   String
  versionId   String?
  name        String      @db.VarChar(255)
  status      SprintStatus @default(PLANNING)
  startDate   DateTime?   @db.Date
  endDate     DateTime?   @db.Date
  goal        String?     @db.Text
  createdAt   DateTime    @default(now())

  @@index([projectId])
  @@map("pm_sprints")
}

enum SprintStatus { PLANNING ACTIVE CLOSED }

// ─── BASELINES ────────────────────────────────────────────────────

model PmBaseline {
  id        String   @id @default(cuid())
  projectId String
  name      String   @db.VarChar(255)
  snapshotAt DateTime
  data      Json     // Serialized WP state at snapshot time
  createdAt DateTime @default(now())
  createdBy String

  @@index([projectId])
  @@map("pm_baselines")
}

// ─── BUDGETS ──────────────────────────────────────────────────────

model PmBudget {
  id          String   @id @default(cuid())
  projectId   String
  versionId   String?
  name        String   @db.VarChar(255)
  description String?  @db.Text
  createdAt   DateTime @default(now())

  items PmBudgetItem[]

  @@map("pm_budgets")
}

model PmBudgetItem {
  id            String         @id @default(cuid())
  budgetId      String
  workPackageId String?
  type          BudgetItemType
  description   String         @db.VarChar(255)
  amount        Decimal        @db.Decimal(14,2)

  budget      PmBudget       @relation(fields: [budgetId], references: [id], onDelete: Cascade)
  workPackage PmWorkPackage? @relation(fields: [workPackageId], references: [id])

  @@map("pm_budget_items")
}

enum BudgetItemType { LABOR MATERIAL }

// ─── SAVED QUERIES ────────────────────────────────────────────────

model PmQuery {
  id          String   @id @default(cuid())
  projectId   String?  // null = global query
  userId      String?  // null = public query
  name        String   @db.VarChar(255)
  filters     Json     @default("[]")
  sortBy      Json     @default("[]")
  groupBy     String?  @db.VarChar(100)
  columns     Json     @default("[]")
  isPublic    Boolean  @default(false)
  isDefault   Boolean  @default(false)
  displayType String   @default("list") @db.VarChar(50)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("pm_queries")
}
```

### 9.2 Wiki Module Schema

```prisma
// modules/wiki/api/src/prisma/wiki.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model WikiPage {
  id          String    @id @default(cuid())
  projectId   String?   // null = workspace-level wiki
  workspaceId String
  parentId    String?
  slug        String    @db.VarChar(255)
  title       String    @db.VarChar(500)
  icon        String?   @db.VarChar(50)   // emoji or icon name
  coverUrl    String?
  position    Int       @default(0)
  lft         Int       @default(0)       // Nested set
  rgt         Int       @default(0)
  isLocked    Boolean   @default(false)
  isTemplate  Boolean   @default(false)
  authorId    String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  parent   WikiPage?  @relation("PageHierarchy", fields: [parentId], references: [id])
  children WikiPage[] @relation("PageHierarchy")

  versions      WikiPageVersion[]
  currentVersion WikiPageContent?
  databases     WikiDatabase[]

  @@unique([workspaceId, slug])
  @@index([projectId])
  @@index([workspaceId])
  @@map("wiki_pages")
}

model WikiPageContent {
  id        String   @id @default(cuid())
  pageId    String   @unique
  content   Json     // TipTap ProseMirror JSON
  textContent String @db.Text  // Extracted plain text for search
  wordCount Int      @default(0)
  updatedAt DateTime @updatedAt
  updatedBy String

  page WikiPage @relation(fields: [pageId], references: [id], onDelete: Cascade)

  @@map("wiki_page_contents")
}

model WikiPageVersion {
  id        String   @id @default(cuid())
  pageId    String
  content   Json     // Full TipTap JSON at this point in time
  summary   String?  @db.VarChar(255)
  authorId  String
  version   Int
  createdAt DateTime @default(now())

  page WikiPage @relation(fields: [pageId], references: [id], onDelete: Cascade)

  @@index([pageId])
  @@map("wiki_page_versions")
}

model WikiDatabase {
  id       String       @id @default(cuid())
  pageId   String
  name     String       @db.VarChar(255)
  icon     String?      @db.VarChar(50)
  schema   Json         // Column definitions
  viewType DatabaseView @default(TABLE)
  filters  Json         @default("[]")
  sortBy   Json         @default("[]")
  groupBy  String?

  page  WikiPage      @relation(fields: [pageId], references: [id], onDelete: Cascade)
  rows  WikiDatabaseRow[]

  @@map("wiki_databases")
}

enum DatabaseView { TABLE BOARD GALLERY CALENDAR LIST }

model WikiDatabaseRow {
  id         String   @id @default(cuid())
  databaseId String
  data       Json     // { columnId: value } map
  position   Int      @default(0)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  database WikiDatabase @relation(fields: [databaseId], references: [id], onDelete: Cascade)

  @@map("wiki_database_rows")
}

model WikiTemplate {
  id          String   @id @default(cuid())
  workspaceId String
  name        String   @db.VarChar(255)
  description String?  @db.Text
  icon        String?
  content     Json     // TipTap JSON template
  category    String   @db.VarChar(100)
  isBuiltIn   Boolean  @default(false)
  createdAt   DateTime @default(now())

  @@map("wiki_templates")
}
```

### 9.3 Chat Module Schema

```prisma
// modules/chat/api/src/prisma/chat.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model ChatChannel {
  id          String      @id @default(cuid())
  workspaceId String
  projectId   String?     // null = workspace-level channel
  name        String      @db.VarChar(100)
  description String?     @db.Text
  type        ChannelType
  isArchived  Boolean     @default(false)
  isReadonly  Boolean     @default(false)
  createdById String
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  members  ChatChannelMember[]
  messages ChatMessage[]

  @@unique([workspaceId, name])
  @@index([workspaceId])
  @@map("chat_channels")
}

enum ChannelType { PUBLIC PRIVATE DIRECT GROUP DM }

model ChatChannelMember {
  id          String    @id @default(cuid())
  channelId   String
  userId      String
  role        ChannelRole @default(MEMBER)
  lastReadAt  DateTime?
  mutedUntil  DateTime?
  joinedAt    DateTime  @default(now())

  channel ChatChannel @relation(fields: [channelId], references: [id], onDelete: Cascade)

  @@unique([channelId, userId])
  @@map("chat_channel_members")
}

enum ChannelRole { OWNER ADMIN MEMBER }

model ChatMessage {
  id          String      @id @default(cuid())
  channelId   String
  userId      String
  threadId    String?     // Parent message ID for threads
  content     Json        // Rich text (TipTap JSON) with mentions, links
  textContent String      @db.Text  // Plain text for search
  type        MessageType @default(TEXT)
  editedAt    DateTime?
  deletedAt   DateTime?
  isPinned    Boolean     @default(false)
  createdAt   DateTime    @default(now())

  channel     ChatChannel  @relation(fields: [channelId], references: [id], onDelete: Cascade)
  thread      ChatMessage? @relation("MessageThread", fields: [threadId], references: [id])
  replies     ChatMessage[] @relation("MessageThread")
  reactions   ChatReaction[]
  attachments ChatAttachment[]

  @@index([channelId, createdAt])
  @@index([threadId])
  @@map("chat_messages")
}

enum MessageType { TEXT SYSTEM FILE INTEGRATION }

model ChatReaction {
  id        String   @id @default(cuid())
  messageId String
  userId    String
  emoji     String   @db.VarChar(50)
  createdAt DateTime @default(now())

  message ChatMessage @relation(fields: [messageId], references: [id], onDelete: Cascade)

  @@unique([messageId, userId, emoji])
  @@map("chat_reactions")
}

model ChatAttachment {
  id         String @id @default(cuid())
  messageId  String
  fileName   String @db.VarChar(255)
  fileSize   Int
  mimeType   String @db.VarChar(255)
  storagePath String @db.VarChar(512)
  thumbnailPath String?

  message ChatMessage @relation(fields: [messageId], references: [id], onDelete: Cascade)

  @@map("chat_attachments")
}

model ChatBookmark {
  id        String   @id @default(cuid())
  channelId String
  messageId String
  userId    String
  note      String?  @db.VarChar(255)
  createdAt DateTime @default(now())

  @@unique([messageId, userId])
  @@map("chat_bookmarks")
}
```

### 9.4 CRM Module Schema

```prisma
// modules/crm/api/src/prisma/crm.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model CrmContact {
  id          String      @id @default(cuid())
  workspaceId String
  type        ContactType @default(PERSON)
  firstName   String?     @db.VarChar(100)
  lastName    String?     @db.VarChar(100)
  email       String?     @db.VarChar(255)
  phone       String?     @db.VarChar(50)
  jobTitle    String?     @db.VarChar(255)
  company     String?     @db.VarChar(255)   // FK to organization contact
  organizationId String?
  avatarUrl   String?
  ownerId     String                           // FK to kernel users
  tags        String[]    @default([])
  customData  Json        @default("{}")
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  organization CrmContact?  @relation("ContactOrg", fields: [organizationId], references: [id])
  employees    CrmContact[] @relation("ContactOrg")

  deals      CrmDeal[]       @relation("DealContact")
  activities CrmActivity[]
  notes      CrmNote[]

  @@index([workspaceId])
  @@index([email])
  @@map("crm_contacts")
}

enum ContactType { PERSON ORGANIZATION }

model CrmPipeline {
  id          String   @id @default(cuid())
  workspaceId String
  name        String   @db.VarChar(255)
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())

  stages CrmPipelineStage[]
  deals  CrmDeal[]

  @@map("crm_pipelines")
}

model CrmPipelineStage {
  id          String    @id @default(cuid())
  pipelineId  String
  name        String    @db.VarChar(255)
  probability Int       @default(0)  // 0-100%
  color       String    @db.VarChar(7)
  position    Int       @default(0)
  isClosed    Boolean   @default(false)
  isWon       Boolean   @default(false)

  pipeline CrmPipeline @relation(fields: [pipelineId], references: [id], onDelete: Cascade)
  deals    CrmDeal[]

  @@map("crm_pipeline_stages")
}

model CrmDeal {
  id          String      @id @default(cuid())
  workspaceId String
  pipelineId  String
  stageId     String
  name        String      @db.VarChar(500)
  value       Decimal?    @db.Decimal(14,2)
  currency    String      @default("USD") @db.VarChar(3)
  expectedCloseDate DateTime? @db.Date
  ownerId     String
  contactId   String?
  status      DealStatus  @default(OPEN)
  lostReason  String?     @db.Text
  customData  Json        @default("{}")
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  closedAt    DateTime?

  pipeline    CrmPipeline      @relation(fields: [pipelineId], references: [id])
  stage       CrmPipelineStage @relation(fields: [stageId], references: [id])
  contact     CrmContact?      @relation("DealContact", fields: [contactId], references: [id])
  activities  CrmActivity[]
  notes       CrmNote[]

  @@index([workspaceId])
  @@index([stageId])
  @@map("crm_deals")
}

enum DealStatus { OPEN WON LOST }

model CrmActivity {
  id          String       @id @default(cuid())
  workspaceId String
  type        ActivityType
  subject     String       @db.VarChar(500)
  notes       String?      @db.Text
  dueAt       DateTime?
  completedAt DateTime?
  contactId   String?
  dealId      String?
  userId      String
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  contact CrmContact? @relation(fields: [contactId], references: [id])
  deal    CrmDeal?    @relation(fields: [dealId], references: [id])

  @@index([contactId])
  @@index([dealId])
  @@map("crm_activities")
}

enum ActivityType { CALL EMAIL MEETING TASK NOTE DEMO }

model CrmNote {
  id        String   @id @default(cuid())
  contactId String?
  dealId    String?
  userId    String
  content   String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  contact CrmContact? @relation(fields: [contactId], references: [id])
  deal    CrmDeal?    @relation(fields: [dealId], references: [id])

  @@map("crm_notes")
}
```


---

## 10. Marketplace Architecture

### 10.1 How It Works

```
┌──────────────────────────────────────────────────────────┐
│               QUBILT MARKETPLACE                          │
│                                                          │
│  Publisher Dashboard          Module Registry             │
│  ┌──────────────┐            ┌──────────────────┐        │
│  │ Upload module│──publish──▶│ NPM-like package │        │
│  │ Set pricing  │            │ registry          │        │
│  │ Manage keys  │            └────────┬─────────┘        │
│  └──────────────┘                     │                  │
│                                       │ install          │
│  License Server                       ▼                  │
│  ┌──────────────┐            ┌──────────────────┐        │
│  │ Generate keys│◀──verify──│ Qubilt Instance   │        │
│  │ Validate     │            │ (self-hosted)     │        │
│  │ Track usage  │            └──────────────────┘        │
│  └──────────────┘                                        │
│                                                          │
│  Payments (Stripe Connect)                               │
│  ┌──────────────┐                                        │
│  │ Process subs │  Platform takes 20% commission         │
│  │ Pay publishers│                                       │
│  └──────────────┘                                        │
└──────────────────────────────────────────────────────────┘
```

### 10.2 Module Package Format

Marketplace modules are distributed as npm packages under the `@qubilt` scope or publisher's own scope:

```
@acme/custom-analytics/
├── dist/
│   ├── api/          # Compiled NestJS module
│   └── ui/           # Compiled React components
├── prisma/
│   └── custom-analytics.prisma
├── manifest.json     # Module metadata, permissions, nav items, accentColor
├── README.md
├── CHANGELOG.md
└── package.json
```

### 10.3 License Validation

```typescript
interface LicenseCheck {
  moduleId:   string;
  instanceId: string;    // Unique Qubilt installation ID
  licenseKey: string;
  userCount:  number;
}

interface LicenseResponse {
  valid:      boolean;
  plan:       string;
  maxUsers:   number;
  expiresAt:  string;
  features:   string[];
}

// Offline grace period:  72 hours
// Check interval:        every 24 hours
// Failure mode:          read-only after grace period expires
```

---

## 11. Enterprise Features (All Included in Core)

| Feature | Module | Notes |
|---------|--------|-------|
| Status Boards (Kanban) | PM | Auto-syncs columns with WP statuses |
| Assignee Boards | PM | Grouped by assignee |
| Version Boards | PM | Grouped by milestone/version |
| Subproject Boards | PM | WPs across sub-projects |
| Parent-Child Boards (WBS) | PM | Hierarchical WP tree |
| Baseline Comparisons | PM | Snapshot + visual Gantt diff |
| Team Planner | PM | Calendar-style resource allocation |
| Intelligent Workflows | PM | Custom action buttons, bulk operations |
| Hierarchy Custom Fields | PM | Nested option trees |
| Date Alerts | PM | Email alerts for overdue/approaching dates |
| Gantt PDF Export | PM | Server-side PDF rendering |
| Dashboard Chart Widgets | PM | Burndown, velocity, WP distribution |
| Custom Theme & Logo | Kernel | CSS variable overrides + logo upload |
| Configurable WP Forms | PM | Admin-defined form layouts per type |
| 2FA (TOTP) | Kernel | Authenticator app compatible |
| LDAP Group Sync | Kernel | LDAP groups → Qubilt roles |
| OpenID Connect SSO | Kernel | Google, Azure AD, Keycloak, etc. |
| SAML SSO | Kernel | Okta, OneLogin, etc. |
| Virus Scanning | Kernel | ClamAV for uploads |
| Read-only Mode | Kernel | Lock workspace (maintenance) |
| Session Management | Kernel | View/revoke active sessions |

---

## 12. Security Architecture

| Layer | Measure |
|-------|---------|
| **Authentication** | bcrypt passwords, JWT + session tokens, 2FA TOTP, SSO OIDC/SAML |
| **Authorization** | RBAC with per-module permission keys; checked at controller + service layer |
| **Module Isolation** | Modules access other modules only via Event Bus or explicitly exported services — never direct DB access |
| **API Security** | Rate limiting (nestjs-throttler), CORS, Helmet.js, class-validator DTOs |
| **File Security** | ClamAV virus scan, MIME type validation, max size limits, signed URLs for private files |
| **Data** | TLS everywhere, encrypted at rest (PostgreSQL), field-level encryption for secrets (2FA keys, API tokens) |
| **Audit** | Every mutation logged to AuditLog with userId, IP, changes diff |
| **Sessions** | Server-side session store in Redis, configurable expiry, concurrent session limits |
| **Webhooks** | HMAC-SHA256 signed payloads |
| **Marketplace** | Module code review, sandboxed execution, license validation |

---

## 13. Deployment Topologies

### Single-Server (Small Team)
```yaml
# docker-compose.yml — single VPS
services:
  api:       NestJS app
  web:       Nginx + React build
  postgres:  PostgreSQL 16
  redis:     Redis 7
  minio:     MinIO (S3-compatible storage)
  livekit:   LiveKit (optional, video)
  meili:     Meilisearch (optional, search)
```

### Scalable (Enterprise)
```
Kubernetes:
  API:         HPA — multiple replicas behind load balancer
  Web:         CDN + static hosting (Cloudflare, Vercel)
  DB:          Managed PostgreSQL (RDS, Cloud SQL, Supabase)
  Redis:       Managed Redis (ElastiCache, Upstash)
  Storage:     AWS S3 / GCS
  LiveKit:     Dedicated media server nodes
  Marketplace: Separate NestJS service
  Meilisearch: Dedicated search cluster
```

---

## 14. Cross-Module Integration Examples

```typescript
// CRM deal closed → auto-create PM delivery project
@OnEvent('crm.deal.closed_won')
async handleDealWon(payload: { dealId: string; contactId: string; value: number }) {
  const deal = await this.crmService.getDeal(payload.dealId);
  await this.pmService.createProject({
    name: `Delivery: ${deal.name}`,
    templateId: 'client-delivery-template',
    metadata: { linkedDealId: deal.id },
  });
}

// Helpdesk ticket escalated → create PM work package
@OnEvent('helpdesk.ticket.escalated')
async handleEscalation(payload: { ticketId: string; reason: string }) {
  await this.pmService.createWorkPackage({
    type: 'Bug',
    subject: `Escalated: #${payload.ticketId}`,
    link: `/helpdesk/tickets/${payload.ticketId}`,
  });
}

// PM time entry logged → finance billable hours
@OnEvent('pm.time_entry.created')
async handleTimeEntry(payload: { userId: string; hours: number; projectId: string; workPackageId: string }) {
  await this.financeService.recordBillableTime(payload);
}

// WP assigned → notify via Chat DM
@OnEvent('pm.work_package.assigned')
async notifyAssignee(payload: { assigneeId: string; wpId: string; subject: string }) {
  await this.chatService.sendDirectMessage({
    to: payload.assigneeId,
    text: `📋 You've been assigned: [${payload.subject}](/pm/work-packages/${payload.wpId})`,
  });
}
```

---

## 15. Phased Build Plan

> Each phase maps to one or more **Claude Code sessions**. Each session has a bounded scope — a single session should not exceed ~400 lines of new code. Break sessions at logical boundaries.

### Phase 0 — Platform Kernel (Weeks 1–3)

#### Session 0-A: Monorepo Bootstrap
- [ ] Init Turborepo + pnpm workspaces
- [ ] Configure TypeScript project references
- [ ] Set up `packages/shared` with global types + Zod schemas
- [ ] Set up `packages/module-sdk` with `QubiltModule` interface
- [ ] Docker Compose: PostgreSQL, Redis, MinIO
- [ ] `.env.example` with all required vars

#### Session 0-B: Kernel Database + Auth Backend
- [ ] Prisma kernel schema (full schema from Section 8)
- [ ] Initial migration
- [ ] Seed: default workspace, admin user, built-in roles
- [ ] NestJS kernel module setup
- [ ] Auth module: local strategy, JWT, sessions, bcrypt
- [ ] Auth controller: register, login, logout, refresh
- [ ] User management CRUD

#### Session 0-C: RBAC + Workspace + Module Registry
- [ ] Workspace create/manage endpoints
- [ ] RBAC engine: roles, permissions, guards
- [ ] `module-registry.service.ts` + `module-lifecycle.service.ts`
- [ ] Module loader (backend)
- [ ] Event bus setup (Redis pub/sub)

#### Session 0-D: Supporting Kernel Services
- [ ] File storage abstraction (local + S3 adapters)
- [ ] Notification service (in-app + email framework with Nodemailer)
- [ ] Audit log service
- [ ] Settings service
- [ ] BullMQ job queue setup
- [ ] Socket.IO gateway (real-time foundation)

#### Session 0-E: 2FA + SSO Foundations
- [ ] TOTP service (2FA setup, verify, backup codes)
- [ ] TOTP controller endpoints
- [ ] Passport LDAP strategy skeleton
- [ ] OIDC strategy skeleton (Google, Azure AD)
- [ ] Session management endpoints (list, revoke)

#### Session 0-F: React Shell — Foundation
- [ ] Vite + React 18 + TypeScript setup
- [ ] CSS token files (all files from Section 3)
- [ ] ThemeProvider (system preference + manual toggle)
- [ ] Zustand stores: auth, ui, modules
- [ ] API client (axios instance, interceptors, refresh)
- [ ] Socket.IO client hook

#### Session 0-G: React Shell — Layout + Auth Pages
- [ ] AppShell layout (sidebar + main content)
- [ ] Sidebar (collapsible, icons-only mode, module nav items)
- [ ] SidebarItem with accent color support
- [ ] TopBar (search placeholder, notifications, user menu)
- [ ] Login, Register, ForgotPassword, TwoFactor pages
- [ ] Auth guards + redirect logic

#### Session 0-H: React Shell — Admin + Command Palette
- [ ] Admin layout + Users page
- [ ] Admin Roles page
- [ ] Admin Modules page (enable/disable)
- [ ] Command palette (Cmd+K) — shell-level commands
- [ ] Notification center
- [ ] MyPage dashboard shell (empty widget grid)
- [ ] ModuleRouter (lazy-loads module routes)
- [ ] ExtensionSlot component

---

### Phase 1 — Project Management Module (Weeks 3–7)

#### Session 1-A: PM Backend — Core Entities
- [ ] PM Prisma schema (full schema from Section 9.1)
- [ ] Initial PM migration
- [ ] Types, Statuses, Priorities CRUD endpoints
- [ ] Work Packages CRUD (create, read, update, delete)
- [ ] Work Package relations
- [ ] Work Package journals (activity log)

#### Session 1-B: PM Backend — Custom Fields + Workflows
- [ ] Custom fields CRUD
- [ ] Custom values on work packages
- [ ] Workflow states (type × status × role matrix)
- [ ] Configurable WP form layouts
- [ ] Status transition validation middleware

#### Session 1-C: PM Backend — Versions, Sprints, Queries
- [ ] Versions (milestones) CRUD
- [ ] Categories CRUD
- [ ] Sprint/backlog management
- [ ] Saved queries (filters, sort, groupBy, columns)
- [ ] Work package bulk update endpoint

#### Session 1-D: PM Backend — Time, Budget, Scheduling
- [ ] Time entries CRUD
- [ ] Time activities CRUD
- [ ] Budget + budget items CRUD
- [ ] Auto-scheduling engine (DAG, topological sort)
- [ ] Date alerts (BullMQ scheduled jobs)

#### Session 1-E: PM Backend — Boards + Baselines
- [ ] Boards CRUD (all 6 board types)
- [ ] Board columns + cards
- [ ] Dynamic board sync (status/assignee boards auto-rebuild)
- [ ] Baselines: create snapshot, retrieve, compare
- [ ] Gantt PDF export (Puppeteer)

#### Session 1-F: PM Frontend — Work Package List + Detail
- [ ] PM module manifest + registration
- [ ] WorkPackageList page (sortable, filterable table)
- [ ] WPFilters component (saved query support)
- [ ] WorkPackageDetail page
- [ ] WPForm (create/edit)
- [ ] Type/status/priority inline editing
- [ ] Activity journal display

#### Session 1-G: PM Frontend — Gantt + Boards
- [ ] GanttView page (SVG-based, interactive)
- [ ] GanttBar (drag to resize, move)
- [ ] BaselineCompare overlay
- [ ] BoardsView page
- [ ] SprintBoard (Scrum board)
- [ ] Board column + card components

#### Session 1-H: PM Frontend — Calendar, Backlog, Team Planner
- [ ] CalendarView page
- [ ] BacklogView (sprint planning)
- [ ] BurndownChart component
- [ ] TeamPlanner (resource calendar)
- [ ] TimeTracker page
- [ ] Budgets page
- [ ] Dashboard widgets: WPTable, WPCalendar, SpentTime, ProjectStatus

---

### Phase 2 — Wiki Module (Weeks 7–9)

#### Session 2-A: Wiki Backend
- [ ] Wiki Prisma schema (Section 9.2) + migration
- [ ] Pages CRUD (hierarchy, slug, versioning)
- [ ] Page content save + version history
- [ ] Page templates CRUD
- [ ] Inline databases CRUD (rows, schema)
- [ ] Y.js WebSocket provider (collaborative editing)

#### Session 2-B: Wiki Frontend
- [ ] Wiki module manifest
- [ ] WikiTree sidebar (hierarchy, drag-to-reorder)
- [ ] WikiPage route + TipTap editor
- [ ] Slash command menu (all block types)
- [ ] PageEditor with real-time collaboration (Y.js)
- [ ] BlockMenu (callout, toggle, code, table, embed, divider)
- [ ] VersionDiff viewer
- [ ] DatabaseView (Notion-like table/board/gallery)
- [ ] InlineDatabase embed in pages

---

### Phase 3 — Chat Module (Weeks 9–11)

#### Session 3-A: Chat Backend
- [ ] Chat Prisma schema (Section 9.3) + migration
- [ ] Channels CRUD (public, private, DM, group DM)
- [ ] Messages CRUD with threading
- [ ] Reactions, pins, bookmarks
- [ ] @mentions (emit notification events)
- [ ] Socket.IO namespace for real-time chat
- [ ] Typing indicators, online presence (Redis)
- [ ] Message search (Meilisearch index)

#### Session 3-B: Chat Frontend
- [ ] Chat module manifest
- [ ] ChatLayout with ChannelList sidebar
- [ ] MessageList (virtual scrolling)
- [ ] MessageComposer (TipTap-based, @mentions, emoji)
- [ ] ThreadPanel (slide-in thread view)
- [ ] EmojiPicker
- [ ] UserPresence indicators
- [ ] File sharing in chat

---

### Phase 4 — CRM Module (Weeks 11–13)

#### Session 4-A: CRM Backend
- [ ] CRM Prisma schema (Section 9.4) + migration
- [ ] Contacts CRUD (people + organizations)
- [ ] Pipelines + stages CRUD
- [ ] Deals CRUD + stage transitions (emit events)
- [ ] Activities CRUD
- [ ] Notes CRUD
- [ ] Revenue forecasting + funnel report endpoints
- [ ] CSV import/export

#### Session 4-B: CRM Frontend
- [ ] CRM module manifest
- [ ] ContactList page (filterable, sortable)
- [ ] ContactDetail page (timeline, linked deals)
- [ ] DealPipeline page (Kanban board)
- [ ] PipelineBoard + DealCard components
- [ ] ActivityTimeline component
- [ ] RevenueChart + funnel chart
- [ ] CRMDashboard with summary widgets

---

### Phases 5–13 — Remaining Modules

Follow the same Session A (backend) + Session B (frontend) pattern for:

- **Phase 5:** Helpdesk (tickets, queues, SLAs, customer portal)
- **Phase 6:** HR (employees, org chart, leave, attendance)
- **Phase 7:** Finance (invoices, expenses, tax, PDF generation)
- **Phase 8:** OKRs (objectives, key results, check-ins, alignment tree)
- **Phase 9:** Assets (registry, assignments, maintenance, QR codes)
- **Phase 10:** Whiteboard (tldraw embedded, Y.js collab, export)
- **Phase 11:** Video (LiveKit rooms, recording, scheduled calls)
- **Phase 12:** Code Editor (Monaco, snippets, Git integration)
- **Phase 13:** Forums (boards, threads, moderation, reputation)

---

### Phase 14 — Marketplace (Weeks 22–24)

#### Session 14-A: Marketplace Backend Service
- [ ] Separate NestJS service (`apps/marketplace-api`)
- [ ] Publisher registration + authentication
- [ ] Module upload + versioning (npm-like registry)
- [ ] Manifest validation against `QubiltModule` interface
- [ ] License key generation (UUID + HMAC)
- [ ] License validation endpoint (called by Qubilt instances)
- [ ] Stripe Connect integration (publisher onboarding, payouts)
- [ ] Module review workflow (submitted → reviewed → approved)
- [ ] Ratings & reviews endpoints

#### Session 14-B: Marketplace Frontend (In-App)
- [ ] Admin Marketplace page (browse, search, filter by category)
- [ ] Module detail page (description, screenshots, reviews)
- [ ] Install flow (license key entry or purchase)
- [ ] Automatic update notifications
- [ ] Publisher analytics dashboard

---

### Phase 15 — Auth Completion (Weeks 24–25)

- [ ] OIDC full implementation (Google, Azure AD, Keycloak)
- [ ] SAML 2.0 (Okta, OneLogin)
- [ ] LDAP with group sync (LDAP groups → Qubilt roles)
- [ ] ClamAV virus scanning (hook into storage service)
- [ ] Read-only workspace mode
- [ ] Password policies (strength, expiry, history)
- [ ] Session management UI (list devices, revoke)

---

### Phase 16 — Polish & Production (Weeks 25–27)

- [ ] Custom theme editor (color picker, font selector, logo upload)
- [ ] Global search (aggregate Meilisearch across all modules)
- [ ] Responsive design pass (mobile sidebar drawer, touch targets)
- [ ] Accessibility audit (WCAG 2.1 AA) — keyboard nav, ARIA, focus management
- [ ] i18n framework (react-i18next) + English base strings
- [ ] Performance: virtual scrolling on all long lists, code splitting per module
- [ ] Rate limiting, security headers, CORS hardening
- [ ] Docker production config (multi-stage builds, health checks)
- [ ] GitHub Actions CI/CD (lint → test → build → publish Docker image)
- [ ] Documentation: deployment guide, API reference, module dev guide
- [ ] Landing page / marketing site (separate repo)

---

## 16. Claude Code Workflow & Context7 Rules

> **CRITICAL: This section is MANDATORY for all development on Qubilt. Every coding session must follow these rules. No exceptions.**

### 16.1 The Golden Rule

```
BEFORE writing ANY code that uses a library:
  1. Call resolve-library-id to get the Context7 library ID
  2. Call query-docs with the library ID + your specific question
  3. ONLY THEN write code using the patterns from the returned docs
```

**Never assume you know the API.** Libraries change between major versions. NestJS 10 patterns differ from NestJS 11. React Router 6 is fundamentally different from React Router 7. Prisma 5 schemas differ from Prisma 6. **Always verify with Context7 first.**

### 16.2 Pinned Library IDs

#### Backend

| Library | Version | Context7 ID |
|---------|---------|-------------|
| NestJS | 10+ | `/nestjs/docs.nestjs.com` |
| Prisma | 6.x | `/prisma/docs` |
| BullMQ | Latest | `/taskforcesh/bullmq` |
| NestJS Bull | Latest | `/nestjs/bull` |
| Socket.IO | 4.x | `/websites/socket_io_v4` |
| Passport Local | Latest | `/jaredhanson/passport-local` |
| Passport OAuth2 | Latest | `/jaredhanson/passport-oauth2` |
| Meilisearch | Latest | `/meilisearch/documentation` |

#### Frontend

| Library | Version | Context7 ID |
|---------|---------|-------------|
| React | 18.x | `/websites/react_dev` |
| React Router | 7.x | `/remix-run/react-router` |
| TanStack Query | 5.x | `/tanstack/query` |
| Zustand | 5.x | `/pmndrs/zustand` |
| Tailwind CSS | 4.x | `/websites/tailwindcss` |
| shadcn/ui | Latest | `/shadcn-ui/ui` |
| Vite | 5.x | `/vitejs/vite` |

#### Rich Content & Collaboration

| Library | Version | Context7 ID |
|---------|---------|-------------|
| TipTap | 2.x | `/ueberdosis/tiptap-docs` |
| Y.js | Latest | `/yjs/yjs` |
| tldraw | v3+ | `/tldraw/tldraw` |
| Monaco Editor | Latest | `/microsoft/monaco-editor` |
| Monaco React | Latest | `/suren-atoyan/monaco-react` |
| LiveKit | Latest | `/websites/livekit_io` |

#### Monorepo

| Library | Version | Context7 ID |
|---------|---------|-------------|
| Turborepo | Latest | `/vercel/turborepo` |

### 16.3 Step-by-Step Context7 Usage

**Step 1 — Resolve ID (if not in table above):**
```
resolve-library-id("library name")
→ Pick result with highest score + most snippets from reputable source
```

**Step 2 — Query for your specific task (be precise):**
```
query-docs("/nestjs/docs.nestjs.com", "dynamic module forRootAsync custom providers NestJS 10")
```

**Step 3 — Write code from the returned documentation only.**

### 16.4 Mandatory Lookup Scenarios

| Scenario | What to Query |
|----------|--------------|
| New NestJS module | Module setup, providers, dependency injection |
| Prisma schema change | Schema syntax, relations, migration commands |
| React component with hooks | Hook API, patterns for React 18 |
| React Router setup | v7 — very different from v6, always look up |
| TanStack Query | `useQuery`, `useMutation`, `QueryClient`, optimistic updates |
| Zustand store | Store creation, middleware, devtools |
| Tailwind CSS v4 | Config, new v4 syntax, custom theme |
| shadcn/ui component | Installation, usage, customization |
| Socket.IO rooms | Server namespaces, rooms, broadcasting |
| TipTap editor | Extensions, React integration, commands |
| Y.js collab | Shared types, providers, awareness |
| tldraw embed | React component, persistence, custom shapes |
| Monaco embed | React wrapper, TypeScript config, themes |
| BullMQ jobs | Queue, worker, repeatable jobs, retries |
| LiveKit video | Room creation, tokens, React SDK |
| Meilisearch | Index setup, searchable attributes, filters |
| Turborepo | `turbo.json` pipeline, caching, task deps |

### 16.5 Reference Query Examples

```bash
# NestJS dynamic module
query-docs("/nestjs/docs.nestjs.com", "dynamic module forRootAsync ConfigModule")

# Prisma multi-schema separate files
query-docs("/prisma/docs", "multiple schema files prisma client generation")

# React Router 7 lazy nested routes
query-docs("/remix-run/react-router", "lazy route createBrowserRouter nested layouts")

# TanStack Query optimistic updates
query-docs("/tanstack/query", "optimistic update useMutation setQueryData rollback")

# Socket.IO rooms NestJS gateway
query-docs("/websites/socket_io_v4", "rooms join leave broadcast NestJS gateway")

# TipTap slash commands
query-docs("/ueberdosis/tiptap-docs", "slash commands suggestion plugin React")

# BullMQ cron repeatable jobs
query-docs("/taskforcesh/bullmq", "repeatable jobs cron retry backoff")

# tldraw persistence custom shapes
query-docs("/tldraw/tldraw", "persistence store custom shape React")

# Y.js WebSocket collab
query-docs("/yjs/yjs", "WebSocket provider y-websocket awareness cursor")

# Tailwind v4 CSS variables
query-docs("/websites/tailwindcss", "CSS variables custom theme v4 configuration")

# shadcn DataTable
query-docs("/shadcn-ui/ui", "data table tanstack sorting filtering pagination")

# LiveKit React SDK room
query-docs("/websites/livekit_io", "LiveKitRoom React SDK VideoTrack connect")

# Meilisearch index setup
query-docs("/meilisearch/documentation", "index searchable filterable sortable attributes")
```

### 16.6 Session Checklist

Every Claude Code session must begin with:

```markdown
## Pre-coding checklist
- [ ] Read Section 15 to confirm current phase and session scope
- [ ] Identify all libraries involved in this session
- [ ] Confirm library IDs from Section 16.2 table
- [ ] Query Context7 for each library's relevant API
- [ ] Verify returned docs match pinned versions
- [ ] Write code from verified patterns only
- [ ] Run tests after each logical unit
- [ ] Commit with message: "phase(X-Y): description"
```

---

*Qubilt Platform Architecture v1.0 — Build your business, block by block.*
*Last updated: 2026-03-07*

---

## 9.5 Helpdesk Module Schema

```prisma
// modules/helpdesk/api/src/prisma/helpdesk.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── QUEUES ───────────────────────────────────────────────────────

model HdQueue {
  id               String   @id @default(cuid())
  workspaceId      String
  name             String   @db.VarChar(255)
  description      String?  @db.Text
  isPublic         Boolean  @default(true)   // Accessible to customer portal
  defaultAssigneeId String?
  defaultPriorityId String?
  slaPolicyId      String?
  emailAddress     String?  @db.VarChar(255) // Inbound email routing
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  tickets    HdTicket[]
  slaPolicy  HdSlaPolicy? @relation(fields: [slaPolicyId], references: [id])
  members    HdQueueMember[]

  @@unique([workspaceId, name])
  @@map("hd_queues")
}

model HdQueueMember {
  id      String @id @default(cuid())
  queueId String
  userId  String
  role    String @default("agent") @db.VarChar(50) // "agent" | "manager"

  queue HdQueue @relation(fields: [queueId], references: [id], onDelete: Cascade)

  @@unique([queueId, userId])
  @@map("hd_queue_members")
}

// ─── TICKETS ──────────────────────────────────────────────────────

model HdTicket {
  id           String         @id @default(cuid())
  workspaceId  String
  queueId      String
  number       Int                               // Auto-incrementing per workspace
  subject      String         @db.VarChar(500)
  status       TicketStatus   @default(NEW)
  priority     TicketPriority @default(MEDIUM)
  type         TicketType     @default(QUESTION)
  requesterId  String                            // FK to users OR customer
  assigneeId   String?
  assignedTeam String?        @db.VarChar(100)
  tags         String[]       @default([])
  dueAt        DateTime?
  firstResponseAt DateTime?
  resolvedAt   DateTime?
  closedAt     DateTime?
  reopenCount  Int            @default(0)
  satisfactionRating Int?                       // 1-5 CSAT score
  satisfactionComment String? @db.Text
  source       TicketSource   @default(WEB)
  customData   Json           @default("{}")
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  queue      HdQueue          @relation(fields: [queueId], references: [id])
  messages   HdTicketMessage[]
  comments   HdTicketComment[]
  slaBreaches HdSlaBreach[]
  linkedWPs  HdLinkedWorkPackage[]
  watchers   HdTicketWatcher[]

  @@unique([workspaceId, number])
  @@index([workspaceId, status])
  @@index([assigneeId])
  @@index([queueId])
  @@map("hd_tickets")
}

enum TicketStatus   { NEW OPEN PENDING HOLD SOLVED CLOSED }
enum TicketPriority { LOW MEDIUM HIGH URGENT }
enum TicketType     { QUESTION INCIDENT PROBLEM TASK }
enum TicketSource   { WEB EMAIL PHONE API CHAT PORTAL }

model HdTicketMessage {
  id         String      @id @default(cuid())
  ticketId   String
  authorId   String?                           // null = customer (portal)
  authorEmail String?    @db.VarChar(255)      // For email-originated messages
  body       String      @db.Text
  bodyHtml   String?     @db.Text
  isPublic   Boolean     @default(true)        // false = internal note
  channel    String      @default("web") @db.VarChar(50)
  createdAt  DateTime    @default(now())
  editedAt   DateTime?

  ticket      HdTicket          @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  attachments HdMessageAttachment[]

  @@index([ticketId])
  @@map("hd_ticket_messages")
}

model HdMessageAttachment {
  id          String @id @default(cuid())
  messageId   String
  fileName    String @db.VarChar(255)
  fileSize    Int
  mimeType    String @db.VarChar(255)
  storagePath String @db.VarChar(512)

  message HdTicketMessage @relation(fields: [messageId], references: [id], onDelete: Cascade)

  @@map("hd_message_attachments")
}

model HdTicketComment {
  id       String   @id @default(cuid())
  ticketId String
  userId   String
  content  String   @db.Text
  createdAt DateTime @default(now())

  ticket HdTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)

  @@map("hd_ticket_comments")
}

model HdTicketWatcher {
  id       String @id @default(cuid())
  ticketId String
  userId   String

  ticket HdTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)

  @@unique([ticketId, userId])
  @@map("hd_ticket_watchers")
}

model HdLinkedWorkPackage {
  id            String @id @default(cuid())
  ticketId      String
  workPackageId String  // FK to pm_work_packages

  ticket HdTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)

  @@unique([ticketId, workPackageId])
  @@map("hd_linked_work_packages")
}

// ─── SLA POLICIES ─────────────────────────────────────────────────

model HdSlaPolicy {
  id          String   @id @default(cuid())
  workspaceId String
  name        String   @db.VarChar(255)
  description String?  @db.Text
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  queues    HdQueue[]
  rules     HdSlaRule[]
  breaches  HdSlaBreach[]

  @@map("hd_sla_policies")
}

model HdSlaRule {
  id                  String         @id @default(cuid())
  policyId            String
  priority            TicketPriority
  firstResponseHours  Int            // Business hours
  resolutionHours     Int            // Business hours

  policy HdSlaPolicy @relation(fields: [policyId], references: [id], onDelete: Cascade)

  @@unique([policyId, priority])
  @@map("hd_sla_rules")
}

model HdSlaBreach {
  id         String   @id @default(cuid())
  ticketId   String
  policyId   String
  type       String   @db.VarChar(50) // "first_response" | "resolution"
  breachedAt DateTime
  hoursLate  Decimal  @db.Decimal(6,2)

  ticket HdTicket    @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  policy HdSlaPolicy @relation(fields: [policyId], references: [id])

  @@map("hd_sla_breaches")
}

// ─── KNOWLEDGE BASE ───────────────────────────────────────────────

model HdArticle {
  id          String        @id @default(cuid())
  workspaceId String
  categoryId  String?
  title       String        @db.VarChar(500)
  content     Json          // TipTap JSON
  textContent String        @db.Text
  status      ArticleStatus @default(DRAFT)
  authorId    String
  viewCount   Int           @default(0)
  helpful     Int           @default(0)
  notHelpful  Int           @default(0)
  tags        String[]      @default([])
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  publishedAt DateTime?

  category HdArticleCategory? @relation(fields: [categoryId], references: [id])

  @@index([workspaceId, status])
  @@map("hd_articles")
}

enum ArticleStatus { DRAFT PUBLISHED ARCHIVED }

model HdArticleCategory {
  id          String @id @default(cuid())
  workspaceId String
  name        String @db.VarChar(255)
  description String? @db.Text
  parentId    String?
  position    Int    @default(0)
  icon        String? @db.VarChar(50)

  parent   HdArticleCategory?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children HdArticleCategory[] @relation("CategoryHierarchy")
  articles HdArticle[]

  @@map("hd_article_categories")
}

// ─── AUTOMATION RULES ─────────────────────────────────────────────

model HdAutomationRule {
  id          String   @id @default(cuid())
  workspaceId String
  name        String   @db.VarChar(255)
  isActive    Boolean  @default(true)
  trigger     Json     // { event: "ticket.created", conditions: [...] }
  actions     Json     // [{ type: "assign", value: "..." }, ...]
  position    Int      @default(0)
  runCount    Int      @default(0)
  lastRunAt   DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("hd_automation_rules")
}

// ─── CUSTOMER PORTAL ──────────────────────────────────────────────

model HdPortalCustomer {
  id          String   @id @default(cuid())
  workspaceId String
  email       String   @db.VarChar(255)
  name        String   @db.VarChar(255)
  company     String?  @db.VarChar(255)
  hashedPassword String?
  createdAt   DateTime @default(now())

  @@unique([workspaceId, email])
  @@map("hd_portal_customers")
}
```


---

## 9.6 HR / People Module Schema

```prisma
// modules/hr/api/src/prisma/hr.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── EMPLOYEES ────────────────────────────────────────────────────

model HrEmployee {
  id             String         @id @default(cuid())
  workspaceId    String
  userId         String         @unique              // FK to kernel users
  employeeNumber String?        @db.VarChar(50)
  status         EmployeeStatus @default(ACTIVE)
  departmentId   String?
  positionId     String?
  managerId      String?
  locationId     String?
  hireDate       DateTime       @db.Date
  terminationDate DateTime?     @db.Date
  terminationReason String?     @db.Text

  // Personal
  firstName      String         @db.VarChar(100)
  lastName       String         @db.VarChar(100)
  preferredName  String?        @db.VarChar(100)
  dateOfBirth    DateTime?      @db.Date
  gender         String?        @db.VarChar(50)
  nationality    String?        @db.VarChar(100)
  personalEmail  String?        @db.VarChar(255)
  workEmail      String         @db.VarChar(255)
  phone          String?        @db.VarChar(50)
  address        Json?

  // Employment
  employmentType EmploymentType @default(FULL_TIME)
  workSchedule   String?        @db.VarChar(100)
  fte            Decimal        @default(1.0) @db.Decimal(4,2) // 1.0 = full-time
  currency       String         @default("USD") @db.VarChar(3)
  salary         Decimal?       @db.Decimal(14,2)
  salaryPeriod   String         @default("monthly") @db.VarChar(20)

  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  department    HrDepartment? @relation(fields: [departmentId], references: [id])
  position      HrPosition?   @relation(fields: [positionId], references: [id])
  manager       HrEmployee?   @relation("ReportsTo", fields: [managerId], references: [id])
  directReports HrEmployee[]  @relation("ReportsTo")
  location      HrLocation?   @relation(fields: [locationId], references: [id])

  leaveRequests     HrLeaveRequest[]
  leaveBalances     HrLeaveBalance[]
  attendanceRecords HrAttendance[]
  documents         HrDocument[]
  customValues      HrCustomValue[]
  compensationHistory HrCompensation[]
  trainings         HrTrainingEnrollment[]
  reviews           HrPerformanceReview[]

  @@index([workspaceId])
  @@index([managerId])
  @@map("hr_employees")
}

enum EmployeeStatus { ACTIVE INACTIVE ON_LEAVE TERMINATED }
enum EmploymentType { FULL_TIME PART_TIME CONTRACT INTERN FREELANCE }

// ─── DEPARTMENTS & POSITIONS ──────────────────────────────────────

model HrDepartment {
  id          String  @id @default(cuid())
  workspaceId String
  name        String  @db.VarChar(255)
  code        String? @db.VarChar(50)
  parentId    String?
  headId      String?   // FK to hr_employees
  costCenter  String? @db.VarChar(100)

  parent      HrDepartment?  @relation("DeptHierarchy", fields: [parentId], references: [id])
  children    HrDepartment[] @relation("DeptHierarchy")
  employees   HrEmployee[]

  @@unique([workspaceId, name])
  @@map("hr_departments")
}

model HrPosition {
  id          String  @id @default(cuid())
  workspaceId String
  title       String  @db.VarChar(255)
  code        String? @db.VarChar(50)
  grade       String? @db.VarChar(50)
  minSalary   Decimal? @db.Decimal(14,2)
  maxSalary   Decimal? @db.Decimal(14,2)
  description String?  @db.Text

  employees HrEmployee[]

  @@map("hr_positions")
}

model HrLocation {
  id          String  @id @default(cuid())
  workspaceId String
  name        String  @db.VarChar(255)
  country     String  @db.VarChar(100)
  city        String? @db.VarChar(100)
  timezone    String  @db.VarChar(100)
  address     Json?

  employees HrEmployee[]

  @@map("hr_locations")
}

// ─── LEAVE ────────────────────────────────────────────────────────

model HrLeaveType {
  id             String  @id @default(cuid())
  workspaceId    String
  name           String  @db.VarChar(255)
  color          String  @db.VarChar(7)
  accrualBasis   String  @default("annual") @db.VarChar(50) // "annual" | "monthly" | "none"
  defaultDays    Decimal @db.Decimal(6,2)
  maxCarryover   Decimal @default(0) @db.Decimal(6,2)
  isPaid         Boolean @default(true)
  requiresApproval Boolean @default(true)
  allowHalfDays  Boolean @default(true)
  isActive       Boolean @default(true)

  balances  HrLeaveBalance[]
  requests  HrLeaveRequest[]

  @@unique([workspaceId, name])
  @@map("hr_leave_types")
}

model HrLeaveBalance {
  id           String  @id @default(cuid())
  employeeId   String
  leaveTypeId  String
  year         Int
  totalDays    Decimal @db.Decimal(6,2)
  usedDays     Decimal @default(0) @db.Decimal(6,2)
  pendingDays  Decimal @default(0) @db.Decimal(6,2)
  carriedOver  Decimal @default(0) @db.Decimal(6,2)

  employee  HrEmployee  @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  leaveType HrLeaveType @relation(fields: [leaveTypeId], references: [id])

  @@unique([employeeId, leaveTypeId, year])
  @@map("hr_leave_balances")
}

model HrLeaveRequest {
  id          String        @id @default(cuid())
  employeeId  String
  leaveTypeId String
  startDate   DateTime      @db.Date
  endDate     DateTime      @db.Date
  totalDays   Decimal       @db.Decimal(6,2)
  halfDay     Boolean       @default(false)
  halfDayPeriod String?     @db.VarChar(10)  // "AM" | "PM"
  reason      String?       @db.Text
  status      LeaveStatus   @default(PENDING)
  approvedBy  String?
  approvedAt  DateTime?
  rejectedReason String?    @db.Text
  cancelledAt DateTime?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  employee  HrEmployee  @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  leaveType HrLeaveType @relation(fields: [leaveTypeId], references: [id])

  @@index([employeeId])
  @@map("hr_leave_requests")
}

enum LeaveStatus { PENDING APPROVED REJECTED CANCELLED }

// ─── ATTENDANCE ───────────────────────────────────────────────────

model HrAttendance {
  id         String    @id @default(cuid())
  employeeId String
  date       DateTime  @db.Date
  checkIn    DateTime?
  checkOut   DateTime?
  hoursWorked Decimal? @db.Decimal(5,2)
  status     String    @default("present") @db.VarChar(50) // "present" | "absent" | "late" | "half-day"
  note       String?   @db.VarChar(255)

  employee HrEmployee @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  @@unique([employeeId, date])
  @@index([employeeId])
  @@map("hr_attendance")
}

// ─── COMPENSATION HISTORY ─────────────────────────────────────────

model HrCompensation {
  id          String   @id @default(cuid())
  employeeId  String
  effectiveDate DateTime @db.Date
  salary      Decimal  @db.Decimal(14,2)
  currency    String   @db.VarChar(3)
  period      String   @db.VarChar(20)  // "monthly" | "annual" | "hourly"
  reason      String?  @db.VarChar(255) // "merit" | "promotion" | "market-adjustment"
  notes       String?  @db.Text
  createdBy   String
  createdAt   DateTime @default(now())

  employee HrEmployee @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  @@index([employeeId])
  @@map("hr_compensation_history")
}

// ─── DOCUMENTS ────────────────────────────────────────────────────

model HrDocument {
  id          String   @id @default(cuid())
  employeeId  String
  name        String   @db.VarChar(255)
  category    String   @db.VarChar(100) // "contract" | "id" | "certificate" | "other"
  storagePath String   @db.VarChar(512)
  fileSize    Int
  mimeType    String   @db.VarChar(255)
  expiresAt   DateTime? @db.Date
  uploadedBy  String
  createdAt   DateTime @default(now())

  employee HrEmployee @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  @@map("hr_documents")
}

// ─── PERFORMANCE REVIEWS ──────────────────────────────────────────

model HrReviewCycle {
  id          String   @id @default(cuid())
  workspaceId String
  name        String   @db.VarChar(255)
  startDate   DateTime @db.Date
  endDate     DateTime @db.Date
  status      String   @default("draft") @db.VarChar(50) // "draft" | "active" | "closed"
  createdAt   DateTime @default(now())

  reviews HrPerformanceReview[]

  @@map("hr_review_cycles")
}

model HrPerformanceReview {
  id          String       @id @default(cuid())
  cycleId     String
  employeeId  String
  reviewerId  String
  status      ReviewStatus @default(PENDING)
  selfRating  Decimal?     @db.Decimal(3,1)
  managerRating Decimal?   @db.Decimal(3,1)
  overallRating Decimal?   @db.Decimal(3,1)
  selfComments  String?    @db.Text
  managerComments String?  @db.Text
  goals       Json?        // Goal ratings array
  submittedAt DateTime?
  acknowledgedAt DateTime?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  cycle    HrReviewCycle @relation(fields: [cycleId], references: [id])
  employee HrEmployee    @relation(fields: [employeeId], references: [id])

  @@unique([cycleId, employeeId])
  @@map("hr_performance_reviews")
}

enum ReviewStatus { PENDING SELF_REVIEW MANAGER_REVIEW COMPLETED ACKNOWLEDGED }

// ─── TRAINING ─────────────────────────────────────────────────────

model HrTraining {
  id          String   @id @default(cuid())
  workspaceId String
  name        String   @db.VarChar(255)
  description String?  @db.Text
  provider    String?  @db.VarChar(255)
  duration    Int?                           // Minutes
  cost        Decimal? @db.Decimal(10,2)
  isRequired  Boolean  @default(false)
  expiryMonths Int?                          // Recertification period
  createdAt   DateTime @default(now())

  enrollments HrTrainingEnrollment[]

  @@map("hr_trainings")
}

model HrTrainingEnrollment {
  id          String           @id @default(cuid())
  trainingId  String
  employeeId  String
  status      TrainingStatus   @default(ENROLLED)
  enrolledAt  DateTime         @default(now())
  completedAt DateTime?
  score       Decimal?         @db.Decimal(5,2)
  expiresAt   DateTime?

  training HrTraining @relation(fields: [trainingId], references: [id])
  employee HrEmployee @relation(fields: [employeeId], references: [id])

  @@unique([trainingId, employeeId])
  @@map("hr_training_enrollments")
}

enum TrainingStatus { ENROLLED IN_PROGRESS COMPLETED FAILED EXPIRED }

// ─── CUSTOM FIELDS ────────────────────────────────────────────────

model HrCustomField {
  id          String   @id @default(cuid())
  workspaceId String
  name        String   @db.VarChar(255)
  fieldType   String   @db.VarChar(50) // "text" | "number" | "date" | "list" | "boolean"
  options     Json?    // For list types
  isRequired  Boolean  @default(false)
  position    Int      @default(0)

  values HrCustomValue[]

  @@map("hr_custom_fields")
}

model HrCustomValue {
  id           String @id @default(cuid())
  employeeId   String
  customFieldId String
  value        String @db.Text

  employee    HrEmployee    @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  customField HrCustomField @relation(fields: [customFieldId], references: [id], onDelete: Cascade)

  @@unique([employeeId, customFieldId])
  @@map("hr_custom_values")
}
```


---

## 9.7 Finance Module Schema

```prisma
// modules/finance/api/src/prisma/finance.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── CLIENTS ──────────────────────────────────────────────────────

model FinClient {
  id          String   @id @default(cuid())
  workspaceId String
  name        String   @db.VarChar(255)
  contactId   String?                       // FK to crm_contacts (optional link)
  email       String?  @db.VarChar(255)
  phone       String?  @db.VarChar(50)
  address     Json?
  taxId       String?  @db.VarChar(100)
  currency    String   @default("USD") @db.VarChar(3)
  paymentTerms Int     @default(30)         // Days net
  notes       String?  @db.Text
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  invoices FinInvoice[]
  expenses FinExpense[]

  @@index([workspaceId])
  @@map("fin_clients")
}

// ─── INVOICES ─────────────────────────────────────────────────────

model FinInvoice {
  id           String        @id @default(cuid())
  workspaceId  String
  clientId     String
  projectId    String?                       // FK to kernel projects
  number       String        @db.VarChar(50)
  status       InvoiceStatus @default(DRAFT)
  currency     String        @default("USD") @db.VarChar(3)
  issueDate    DateTime      @db.Date
  dueDate      DateTime      @db.Date
  subtotal     Decimal       @default(0) @db.Decimal(14,2)
  discountType String?       @db.VarChar(20) // "percent" | "fixed"
  discountValue Decimal      @default(0) @db.Decimal(14,2)
  taxAmount    Decimal       @default(0) @db.Decimal(14,2)
  total        Decimal       @default(0) @db.Decimal(14,2)
  amountPaid   Decimal       @default(0) @db.Decimal(14,2)
  amountDue    Decimal       @default(0) @db.Decimal(14,2)
  notes        String?       @db.Text
  terms        String?       @db.Text
  pdfPath      String?       @db.VarChar(512)
  sentAt       DateTime?
  paidAt       DateTime?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  client   FinClient         @relation(fields: [clientId], references: [id])
  lineItems FinLineItem[]
  taxes    FinInvoiceTax[]
  payments FinPayment[]
  reminders FinPaymentReminder[]

  @@unique([workspaceId, number])
  @@index([workspaceId, status])
  @@index([clientId])
  @@map("fin_invoices")
}

enum InvoiceStatus { DRAFT SENT VIEWED PARTIAL PAID OVERDUE VOID CANCELLED }

model FinLineItem {
  id          String   @id @default(cuid())
  invoiceId   String
  description String   @db.VarChar(500)
  quantity    Decimal  @db.Decimal(10,3)
  unitPrice   Decimal  @db.Decimal(14,4)
  unit        String?  @db.VarChar(50)     // "hours" | "units" | "days"
  discount    Decimal  @default(0) @db.Decimal(5,2) // percent
  amount      Decimal  @db.Decimal(14,2)
  taxRateId   String?
  sortOrder   Int      @default(0)
  timeEntryIds String[] @default([])        // Linked PM time entries

  invoice FinInvoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  taxRate FinTaxRate? @relation(fields: [taxRateId], references: [id])

  @@map("fin_line_items")
}

// ─── TAX RATES ────────────────────────────────────────────────────

model FinTaxRate {
  id          String  @id @default(cuid())
  workspaceId String
  name        String  @db.VarChar(255)    // "GST 10%", "VAT 20%"
  rate        Decimal @db.Decimal(6,4)    // e.g. 0.1000 = 10%
  taxNumber   String? @db.VarChar(100)
  isDefault   Boolean @default(false)
  isActive    Boolean @default(true)

  lineItems    FinLineItem[]
  invoiceTaxes FinInvoiceTax[]

  @@unique([workspaceId, name])
  @@map("fin_tax_rates")
}

model FinInvoiceTax {
  id        String  @id @default(cuid())
  invoiceId String
  taxRateId String
  taxable   Decimal @db.Decimal(14,2)
  amount    Decimal @db.Decimal(14,2)

  invoice FinInvoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  taxRate FinTaxRate @relation(fields: [taxRateId], references: [id])

  @@unique([invoiceId, taxRateId])
  @@map("fin_invoice_taxes")
}

// ─── PAYMENTS ─────────────────────────────────────────────────────

model FinPayment {
  id          String        @id @default(cuid())
  invoiceId   String
  amount      Decimal       @db.Decimal(14,2)
  currency    String        @db.VarChar(3)
  method      PaymentMethod @default(BANK_TRANSFER)
  reference   String?       @db.VarChar(255)
  paidAt      DateTime      @db.Date
  notes       String?       @db.Text
  createdAt   DateTime      @default(now())
  createdBy   String

  invoice FinInvoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  @@index([invoiceId])
  @@map("fin_payments")
}

enum PaymentMethod { BANK_TRANSFER CREDIT_CARD PAYPAL STRIPE CHECK CASH CRYPTO OTHER }

model FinPaymentReminder {
  id        String   @id @default(cuid())
  invoiceId String
  sentAt    DateTime
  type      String   @db.VarChar(50) // "due_soon" | "overdue_7d" | "overdue_14d" | "overdue_30d"

  invoice FinInvoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  @@map("fin_payment_reminders")
}

// ─── EXPENSES ─────────────────────────────────────────────────────

model FinExpense {
  id           String         @id @default(cuid())
  workspaceId  String
  clientId     String?
  projectId    String?
  userId       String                              // Who submitted
  categoryId   String?
  date         DateTime       @db.Date
  description  String         @db.VarChar(500)
  amount       Decimal        @db.Decimal(14,2)
  currency     String         @default("USD") @db.VarChar(3)
  taxAmount    Decimal        @default(0) @db.Decimal(14,2)
  isBillable   Boolean        @default(false)
  isReimbursable Boolean      @default(true)
  status       ExpenseStatus  @default(SUBMITTED)
  approvedBy   String?
  approvedAt   DateTime?
  receiptPath  String?        @db.VarChar(512)
  notes        String?        @db.Text
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  client   FinClient?         @relation(fields: [clientId], references: [id])
  category FinExpenseCategory? @relation(fields: [categoryId], references: [id])

  @@index([workspaceId, status])
  @@map("fin_expenses")
}

enum ExpenseStatus { SUBMITTED APPROVED REJECTED REIMBURSED }

model FinExpenseCategory {
  id          String @id @default(cuid())
  workspaceId String
  name        String @db.VarChar(255)
  code        String? @db.VarChar(50)
  isActive    Boolean @default(true)

  expenses FinExpense[]

  @@unique([workspaceId, name])
  @@map("fin_expense_categories")
}

// ─── RECURRING INVOICES ───────────────────────────────────────────

model FinRecurringInvoice {
  id          String   @id @default(cuid())
  workspaceId String
  clientId    String
  templateData Json    // Snapshot of invoice structure (line items, etc.)
  frequency   String   @db.VarChar(50) // "weekly" | "monthly" | "quarterly" | "annually"
  startDate   DateTime @db.Date
  endDate     DateTime? @db.Date
  nextRunAt   DateTime
  lastRunAt   DateTime?
  runCount    Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  @@map("fin_recurring_invoices")
}

// ─── CHART OF ACCOUNTS ────────────────────────────────────────────

model FinAccount {
  id          String   @id @default(cuid())
  workspaceId String
  code        String   @db.VarChar(50)
  name        String   @db.VarChar(255)
  type        String   @db.VarChar(50)  // "revenue" | "expense" | "asset" | "liability" | "equity"
  parentId    String?
  isActive    Boolean  @default(true)
  description String?  @db.Text

  parent   FinAccount?  @relation("AccountHierarchy", fields: [parentId], references: [id])
  children FinAccount[] @relation("AccountHierarchy")

  @@unique([workspaceId, code])
  @@map("fin_accounts")
}

// ─── INVOICE TEMPLATES ────────────────────────────────────────────

model FinInvoiceTemplate {
  id          String   @id @default(cuid())
  workspaceId String
  name        String   @db.VarChar(255)
  logoUrl     String?
  primaryColor String? @db.VarChar(7)
  footerText  String?  @db.Text
  layout      String   @default("standard") @db.VarChar(50)
  isDefault   Boolean  @default(false)

  @@map("fin_invoice_templates")
}
```


---

## 9.8 OKRs / Goals Module Schema

```prisma
// modules/okrs/api/src/prisma/okrs.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── CYCLES ───────────────────────────────────────────────────────

model OkrCycle {
  id          String      @id @default(cuid())
  workspaceId String
  name        String      @db.VarChar(255)   // "Q1 2026", "FY2026"
  type        CycleType   @default(QUARTERLY)
  startDate   DateTime    @db.Date
  endDate     DateTime    @db.Date
  status      CycleStatus @default(PLANNING)
  parentId    String?                          // Annual cycle → quarterly children

  parent   OkrCycle?  @relation("CycleHierarchy", fields: [parentId], references: [id])
  children OkrCycle[] @relation("CycleHierarchy")

  objectives OkrObjective[]

  @@index([workspaceId])
  @@map("okr_cycles")
}

enum CycleType   { ANNUAL QUARTERLY MONTHLY CUSTOM }
enum CycleStatus { PLANNING ACTIVE REVIEW CLOSED }

// ─── OBJECTIVES ───────────────────────────────────────────────────

model OkrObjective {
  id          String            @id @default(cuid())
  workspaceId String
  cycleId     String
  parentId    String?                              // Cascading OKR tree
  title       String            @db.VarChar(500)
  description String?           @db.Text
  ownerId     String                               // FK to kernel users
  teamId      String?           @db.VarChar(100)  // Department / team name
  status      ObjectiveStatus   @default(ON_TRACK)
  progress    Decimal           @default(0) @db.Decimal(5,2)  // 0-100, auto-calculated
  manualProgress Boolean        @default(false)
  isPrivate   Boolean           @default(false)
  tags        String[]          @default([])
  position    Int               @default(0)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  cycle      OkrCycle       @relation(fields: [cycleId], references: [id])
  parent     OkrObjective?  @relation("ObjectiveHierarchy", fields: [parentId], references: [id])
  children   OkrObjective[] @relation("ObjectiveHierarchy")
  keyResults OkrKeyResult[]
  checkins   OkrCheckin[]
  alignments OkrAlignment[] @relation("ChildObjective")
  alignedTo  OkrAlignment[] @relation("ParentObjective")

  @@index([workspaceId, cycleId])
  @@map("okr_objectives")
}

enum ObjectiveStatus { ON_TRACK AT_RISK BEHIND CLOSED ACHIEVED }

// ─── KEY RESULTS ──────────────────────────────────────────────────

model OkrKeyResult {
  id           String         @id @default(cuid())
  objectiveId  String
  title        String         @db.VarChar(500)
  description  String?        @db.Text
  type         KeyResultType  @default(NUMERIC)
  ownerId      String
  startValue   Decimal        @default(0) @db.Decimal(14,4)
  targetValue  Decimal        @db.Decimal(14,4)
  currentValue Decimal        @default(0) @db.Decimal(14,4)
  unit         String?        @db.VarChar(50)   // "%", "users", "$", "NPS"
  progress     Decimal        @default(0) @db.Decimal(5,2)
  status       ObjectiveStatus @default(ON_TRACK)
  dueDate      DateTime?      @db.Date
  position     Int            @default(0)
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  objective OkrObjective @relation(fields: [objectiveId], references: [id], onDelete: Cascade)
  updates   OkrKeyResultUpdate[]

  @@index([objectiveId])
  @@map("okr_key_results")
}

enum KeyResultType {
  NUMERIC       // e.g. reach 1000 signups
  PERCENTAGE    // e.g. increase NPS by 15%
  BOOLEAN       // e.g. launch feature X
  MILESTONE     // e.g. complete 3 milestones
}

// ─── PROGRESS UPDATES ─────────────────────────────────────────────

model OkrKeyResultUpdate {
  id            String   @id @default(cuid())
  keyResultId   String
  userId        String
  previousValue Decimal  @db.Decimal(14,4)
  newValue      Decimal  @db.Decimal(14,4)
  progress      Decimal  @db.Decimal(5,2)
  note          String?  @db.Text
  confidence    Int?     // 1-10 confidence score
  createdAt     DateTime @default(now())

  keyResult OkrKeyResult @relation(fields: [keyResultId], references: [id], onDelete: Cascade)

  @@index([keyResultId])
  @@map("okr_key_result_updates")
}

// ─── CHECK-INS ────────────────────────────────────────────────────

model OkrCheckin {
  id          String          @id @default(cuid())
  objectiveId String
  userId      String
  status      ObjectiveStatus
  confidence  Int?            // 1-10
  message     String?         @db.Text
  mood        String?         @db.VarChar(20)   // "great" | "good" | "okay" | "bad"
  createdAt   DateTime        @default(now())

  objective OkrObjective @relation(fields: [objectiveId], references: [id], onDelete: Cascade)

  @@index([objectiveId])
  @@map("okr_checkins")
}

// ─── ALIGNMENT ────────────────────────────────────────────────────

model OkrAlignment {
  id               String @id @default(cuid())
  parentObjectiveId String
  childObjectiveId  String
  alignmentType     String @default("contributes") @db.VarChar(50)

  parent OkrObjective @relation("ParentObjective", fields: [parentObjectiveId], references: [id], onDelete: Cascade)
  child  OkrObjective @relation("ChildObjective",  fields: [childObjectiveId],  references: [id], onDelete: Cascade)

  @@unique([parentObjectiveId, childObjectiveId])
  @@map("okr_alignments")
}
```

---

## 9.9 Asset / Inventory Module Schema

```prisma
// modules/assets/api/src/prisma/assets.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── ASSET CATEGORIES ─────────────────────────────────────────────

model AssetCategory {
  id          String  @id @default(cuid())
  workspaceId String
  name        String  @db.VarChar(255)
  parentId    String?
  icon        String? @db.VarChar(50)
  deprecationMethod String? @db.VarChar(50) // "straight-line" | "declining-balance"
  usefulLifeYears Int?

  parent   AssetCategory?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children AssetCategory[] @relation("CategoryHierarchy")
  assets   Asset[]

  @@unique([workspaceId, name])
  @@map("asset_categories")
}

// ─── ASSETS ───────────────────────────────────────────────────────

model Asset {
  id             String       @id @default(cuid())
  workspaceId    String
  categoryId     String?
  assetTag       String       @db.VarChar(100)     // Internal ID / barcode
  serialNumber   String?      @db.VarChar(255)
  name           String       @db.VarChar(255)
  description    String?      @db.Text
  brand          String?      @db.VarChar(100)
  model          String?      @db.VarChar(100)
  status         AssetStatus  @default(AVAILABLE)
  locationId     String?                            // FK to hr_locations
  assignedToId   String?                            // FK to kernel users
  purchaseDate   DateTime?    @db.Date
  purchasePrice  Decimal?     @db.Decimal(14,2)
  currency       String?      @db.VarChar(3)
  vendor         String?      @db.VarChar(255)
  warrantyExpiry DateTime?    @db.Date
  notes          String?      @db.Text
  qrCode         String?      @db.Text              // Stored QR SVG or URL
  customData     Json         @default("{}")
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  category   AssetCategory? @relation(fields: [categoryId], references: [id])
  assignments AssetAssignment[]
  maintenance AssetMaintenance[]
  documents   AssetDocument[]

  @@unique([workspaceId, assetTag])
  @@index([workspaceId])
  @@index([assignedToId])
  @@map("assets")
}

enum AssetStatus { AVAILABLE ASSIGNED IN_REPAIR RETIRED DISPOSED LOST }

// ─── ASSIGNMENTS ──────────────────────────────────────────────────

model AssetAssignment {
  id         String    @id @default(cuid())
  assetId    String
  userId     String
  assignedBy String
  assignedAt DateTime  @default(now())
  returnedAt DateTime?
  notes      String?   @db.VarChar(255)
  condition  String?   @db.VarChar(50)   // "new" | "good" | "fair" | "poor"

  asset Asset @relation(fields: [assetId], references: [id], onDelete: Cascade)

  @@index([assetId])
  @@map("asset_assignments")
}

// ─── MAINTENANCE ──────────────────────────────────────────────────

model AssetMaintenance {
  id          String            @id @default(cuid())
  assetId     String
  type        MaintenanceType
  scheduledAt DateTime          @db.Date
  completedAt DateTime?         @db.Date
  cost        Decimal?          @db.Decimal(10,2)
  vendor      String?           @db.VarChar(255)
  notes       String?           @db.Text
  nextDueAt   DateTime?         @db.Date
  createdBy   String
  createdAt   DateTime          @default(now())

  asset Asset @relation(fields: [assetId], references: [id], onDelete: Cascade)

  @@index([assetId])
  @@map("asset_maintenance")
}

enum MaintenanceType { PREVENTIVE CORRECTIVE INSPECTION CALIBRATION }

// ─── DOCUMENTS ────────────────────────────────────────────────────

model AssetDocument {
  id          String   @id @default(cuid())
  assetId     String
  name        String   @db.VarChar(255)
  type        String   @db.VarChar(50)   // "manual" | "invoice" | "warranty" | "certificate"
  storagePath String   @db.VarChar(512)
  mimeType    String   @db.VarChar(255)
  uploadedBy  String
  createdAt   DateTime @default(now())

  asset Asset @relation(fields: [assetId], references: [id], onDelete: Cascade)

  @@map("asset_documents")
}

// ─── INVENTORY ITEMS (Consumables) ────────────────────────────────

model InventoryItem {
  id           String   @id @default(cuid())
  workspaceId  String
  name         String   @db.VarChar(255)
  sku          String?  @db.VarChar(100)
  categoryId   String?
  quantity     Decimal  @default(0) @db.Decimal(10,3)
  minQuantity  Decimal  @default(0) @db.Decimal(10,3)  // Low stock alert threshold
  unit         String   @default("unit") @db.VarChar(50)
  costPerUnit  Decimal? @db.Decimal(10,4)
  location     String?  @db.VarChar(255)
  notes        String?  @db.Text
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  transactions InventoryTransaction[]

  @@index([workspaceId])
  @@map("inventory_items")
}

model InventoryTransaction {
  id        String   @id @default(cuid())
  itemId    String
  type      String   @db.VarChar(50)    // "in" | "out" | "adjustment"
  quantity  Decimal  @db.Decimal(10,3)
  reference String?  @db.VarChar(255)   // PO number, user ID, etc.
  userId    String
  notes     String?  @db.VarChar(255)
  createdAt DateTime @default(now())

  item InventoryItem @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@index([itemId])
  @@map("inventory_transactions")
}
```


---

## 9.10 Whiteboard Module Schema

```prisma
// modules/whiteboard/api/src/prisma/whiteboard.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Whiteboard {
  id          String   @id @default(cuid())
  workspaceId String
  projectId   String?
  title       String   @db.VarChar(255)
  description String?  @db.Text
  thumbnail   String?  @db.VarChar(512)     // S3 path to preview image
  isTemplate  Boolean  @default(false)
  createdById String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  content    WhiteboardContent?
  versions   WhiteboardVersion[]
  members    WhiteboardMember[]

  @@index([workspaceId])
  @@index([projectId])
  @@map("whiteboards")
}

model WhiteboardContent {
  id           String   @id @default(cuid())
  whiteboardId String   @unique
  snapshot     Json     // tldraw TLRecord store snapshot
  schemaVersion String  @db.VarChar(20)  // tldraw schema version e.g. "com.tldraw.schema/1/0/0"
  updatedAt    DateTime @updatedAt
  updatedBy    String

  whiteboard Whiteboard @relation(fields: [whiteboardId], references: [id], onDelete: Cascade)

  @@map("whiteboard_contents")
}

model WhiteboardVersion {
  id           String   @id @default(cuid())
  whiteboardId String
  snapshot     Json     // Full tldraw store snapshot at this point
  summary      String?  @db.VarChar(255)
  createdById  String
  createdAt    DateTime @default(now())

  whiteboard Whiteboard @relation(fields: [whiteboardId], references: [id], onDelete: Cascade)

  @@index([whiteboardId])
  @@map("whiteboard_versions")
}

model WhiteboardMember {
  id           String @id @default(cuid())
  whiteboardId String
  userId       String
  permission   String @default("edit") @db.VarChar(20) // "view" | "comment" | "edit"
  joinedAt     DateTime @default(now())

  whiteboard Whiteboard @relation(fields: [whiteboardId], references: [id], onDelete: Cascade)

  @@unique([whiteboardId, userId])
  @@map("whiteboard_members")
}

model WhiteboardTemplate {
  id          String   @id @default(cuid())
  workspaceId String?  // null = global built-in template
  name        String   @db.VarChar(255)
  description String?  @db.Text
  category    String   @db.VarChar(100)   // "retrospective" | "planning" | "diagram" | "wireframe"
  thumbnail   String?  @db.VarChar(512)
  snapshot    Json     // tldraw snapshot
  isBuiltIn   Boolean  @default(false)
  useCount    Int      @default(0)
  createdAt   DateTime @default(now())

  @@map("whiteboard_templates")
}
```

---

## 9.11 Video Conferencing Module Schema

```prisma
// modules/video/api/src/prisma/video.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model VideoRoom {
  id          String     @id @default(cuid())
  workspaceId String
  projectId   String?
  livekitRoomName String @unique @db.VarChar(255)  // LiveKit room identifier
  title       String     @db.VarChar(255)
  description String?    @db.Text
  type        RoomType   @default(MEETING)
  hostId      String
  status      RoomStatus @default(SCHEDULED)
  isRecorded  Boolean    @default(false)
  scheduledAt DateTime?
  startedAt   DateTime?
  endedAt     DateTime?
  maxParticipants Int    @default(50)
  requiresPassword Boolean @default(false)
  passwordHash String?   @db.VarChar(255)
  settings    Json       @default("{}")
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  participants VideoParticipant[]
  recordings   VideoRecording[]

  @@index([workspaceId])
  @@map("video_rooms")
}

enum RoomType   { MEETING WEBINAR CALL BROADCAST }
enum RoomStatus { SCHEDULED LIVE ENDED CANCELLED }

model VideoParticipant {
  id         String   @id @default(cuid())
  roomId     String
  userId     String
  role       String   @default("participant") @db.VarChar(50) // "host" | "co-host" | "participant" | "viewer"
  joinedAt   DateTime @default(now())
  leftAt     DateTime?
  durationSeconds Int @default(0)
  token      String?  @db.VarChar(2048) // LiveKit access token (short-lived)

  room VideoRoom @relation(fields: [roomId], references: [id], onDelete: Cascade)

  @@index([roomId])
  @@map("video_participants")
}

model VideoRecording {
  id          String          @id @default(cuid())
  roomId      String
  livekitEgressId String?     @db.VarChar(255)
  status      RecordingStatus @default(PROCESSING)
  storagePath String?         @db.VarChar(512)
  duration    Int?            // Seconds
  fileSize    Int?            // Bytes
  mimeType    String?         @db.VarChar(100)
  thumbnailPath String?       @db.VarChar(512)
  transcriptPath String?      @db.VarChar(512)
  startedAt   DateTime        @default(now())
  completedAt DateTime?
  expiresAt   DateTime?       // Auto-delete after X days

  room VideoRoom @relation(fields: [roomId], references: [id], onDelete: Cascade)

  @@map("video_recordings")
}

enum RecordingStatus { PROCESSING READY FAILED DELETED }

model VideoCalendarEvent {
  id          String   @id @default(cuid())
  roomId      String
  title       String   @db.VarChar(255)
  description String?  @db.Text
  scheduledAt DateTime
  duration    Int      @default(60)  // Minutes
  timezone    String   @db.VarChar(100)
  invitees    String[] @default([])  // User IDs
  recurRule   String?  @db.VarChar(255)  // RRULE string
  meetingLink String?  @db.VarChar(512)  // External link if applicable
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("video_calendar_events")
}
```

---

## 9.12 Code Editor Module Schema

```prisma
// modules/code/api/src/prisma/code.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model CodeSnippet {
  id          String   @id @default(cuid())
  workspaceId String
  projectId   String?
  authorId    String
  title       String   @db.VarChar(255)
  description String?  @db.Text
  language    String   @db.VarChar(50)    // "typescript" | "python" | "sql" etc.
  code        String   @db.Text
  isPublic    Boolean  @default(false)
  tags        String[] @default([])
  forkCount   Int      @default(0)
  forkedFromId String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  forkedFrom CodeSnippet?  @relation("SnippetFork", fields: [forkedFromId], references: [id])
  forks      CodeSnippet[] @relation("SnippetFork")
  comments   CodeComment[]
  stars      CodeSnippetStar[]
  versions   CodeSnippetVersion[]

  @@index([workspaceId])
  @@map("code_snippets")
}

model CodeSnippetVersion {
  id        String   @id @default(cuid())
  snippetId String
  code      String   @db.Text
  message   String?  @db.VarChar(255)
  authorId  String
  version   Int
  createdAt DateTime @default(now())

  snippet CodeSnippet @relation(fields: [snippetId], references: [id], onDelete: Cascade)

  @@index([snippetId])
  @@map("code_snippet_versions")
}

model CodeComment {
  id        String   @id @default(cuid())
  snippetId String
  authorId  String
  content   String   @db.Text
  line      Int?     // Optional line number reference
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  snippet CodeSnippet @relation(fields: [snippetId], references: [id], onDelete: Cascade)

  @@map("code_comments")
}

model CodeSnippetStar {
  id        String   @id @default(cuid())
  snippetId String
  userId    String
  createdAt DateTime @default(now())

  snippet CodeSnippet @relation(fields: [snippetId], references: [id], onDelete: Cascade)

  @@unique([snippetId, userId])
  @@map("code_snippet_stars")
}

model CodeTemplate {
  id          String   @id @default(cuid())
  workspaceId String?
  name        String   @db.VarChar(255)
  description String?  @db.Text
  language    String   @db.VarChar(50)
  code        String   @db.Text
  category    String   @db.VarChar(100)
  isBuiltIn   Boolean  @default(false)
  createdAt   DateTime @default(now())

  @@map("code_templates")
}

model CodePlayground {
  id          String   @id @default(cuid())
  workspaceId String
  projectId   String?
  createdById String
  title       String   @db.VarChar(255)
  description String?  @db.Text
  files       Json     // [{ name, language, content }]
  settings    Json     @default("{}")  // run config, env vars (encrypted), etc.
  isTemplate  Boolean  @default(false)
  shareToken  String?  @unique @db.VarChar(100)  // Public share link
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  collaborators CodePlaygroundCollaborator[]

  @@index([workspaceId])
  @@map("code_playgrounds")
}

model CodePlaygroundCollaborator {
  id           String @id @default(cuid())
  playgroundId String
  userId       String
  permission   String @default("edit") @db.VarChar(20)

  playground CodePlayground @relation(fields: [playgroundId], references: [id], onDelete: Cascade)

  @@unique([playgroundId, userId])
  @@map("code_playground_collaborators")
}
```

---

## 9.13 Forums Module Schema

```prisma
// modules/forums/api/src/prisma/forums.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── BOARDS & CATEGORIES ──────────────────────────────────────────

model ForumCategory {
  id          String   @id @default(cuid())
  workspaceId String
  name        String   @db.VarChar(255)
  description String?  @db.Text
  color       String?  @db.VarChar(7)
  position    Int      @default(0)

  boards ForumBoard[]

  @@unique([workspaceId, name])
  @@map("forum_categories")
}

model ForumBoard {
  id          String   @id @default(cuid())
  workspaceId String
  categoryId  String?
  name        String   @db.VarChar(255)
  description String?  @db.Text
  slug        String   @db.VarChar(100)
  icon        String?  @db.VarChar(50)
  isPrivate   Boolean  @default(false)
  isReadonly  Boolean  @default(false)
  isArchived  Boolean  @default(false)
  position    Int      @default(0)
  threadCount Int      @default(0)
  postCount   Int      @default(0)
  lastPostAt  DateTime?
  createdAt   DateTime @default(now())

  category ForumCategory? @relation(fields: [categoryId], references: [id])
  threads  ForumThread[]

  @@unique([workspaceId, slug])
  @@map("forum_boards")
}

// ─── THREADS ──────────────────────────────────────────────────────

model ForumThread {
  id         String       @id @default(cuid())
  boardId    String
  authorId   String
  title      String       @db.VarChar(500)
  slug       String       @db.VarChar(512)
  type       ThreadType   @default(DISCUSSION)
  status     ThreadStatus @default(OPEN)
  isPinned   Boolean      @default(false)
  isLocked   Boolean      @default(false)
  isFeatured Boolean      @default(false)
  tags       String[]     @default([])
  viewCount  Int          @default(0)
  postCount  Int          @default(0)
  upvotes    Int          @default(0)
  lastPostAt DateTime     @default(now())
  solvedPostId String?    // For Q&A type: marks accepted answer
  createdAt  DateTime     @default(now())
  updatedAt  DateTime     @updatedAt

  board       ForumBoard    @relation(fields: [boardId], references: [id])
  posts       ForumPost[]
  subscribers ForumSubscription[]

  @@unique([boardId, slug])
  @@index([boardId, lastPostAt])
  @@map("forum_threads")
}

enum ThreadType   { DISCUSSION QUESTION ANNOUNCEMENT POLL }
enum ThreadStatus { OPEN CLOSED SOLVED ARCHIVED }

// ─── POSTS ────────────────────────────────────────────────────────

model ForumPost {
  id        String   @id @default(cuid())
  threadId  String
  authorId  String
  parentId  String?                   // For nested replies
  content   Json     // TipTap JSON
  textContent String @db.Text
  isFirstPost Boolean @default(false) // The OP post
  isSolution Boolean @default(false)  // Marked as accepted answer
  upvotes   Int      @default(0)
  downvotes Int      @default(0)
  editedAt  DateTime?
  deletedAt DateTime?
  deletedBy String?
  ipAddress String?  @db.VarChar(45)  // For moderation
  createdAt DateTime @default(now())

  thread    ForumThread   @relation(fields: [threadId], references: [id], onDelete: Cascade)
  parent    ForumPost?    @relation("PostReplies", fields: [parentId], references: [id])
  replies   ForumPost[]   @relation("PostReplies")
  votes     ForumPostVote[]
  reports   ForumReport[]
  attachments ForumPostAttachment[]

  @@index([threadId, createdAt])
  @@map("forum_posts")
}

model ForumPostVote {
  id     String @id @default(cuid())
  postId String
  userId String
  value  Int    // 1 = upvote, -1 = downvote

  post ForumPost @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@unique([postId, userId])
  @@map("forum_post_votes")
}

model ForumPostAttachment {
  id          String @id @default(cuid())
  postId      String
  fileName    String @db.VarChar(255)
  fileSize    Int
  mimeType    String @db.VarChar(255)
  storagePath String @db.VarChar(512)

  post ForumPost @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@map("forum_post_attachments")
}

// ─── REPUTATION & BADGES ──────────────────────────────────────────

model ForumUserStats {
  id          String @id @default(cuid())
  workspaceId String
  userId      String
  reputation  Int    @default(0)
  postCount   Int    @default(0)
  solutionsCount Int @default(0)
  receivedUpvotes Int @default(0)
  level       String @default("newcomer") @db.VarChar(50)

  @@unique([workspaceId, userId])
  @@map("forum_user_stats")
}

model ForumBadge {
  id          String @id @default(cuid())
  workspaceId String
  name        String @db.VarChar(100)
  description String @db.VarChar(255)
  icon        String @db.VarChar(50)
  color       String @db.VarChar(7)
  tier        String @default("bronze") @db.VarChar(20) // "bronze" | "silver" | "gold"
  criteria    Json   // Trigger conditions

  awards ForumBadgeAward[]

  @@map("forum_badges")
}

model ForumBadgeAward {
  id        String   @id @default(cuid())
  badgeId   String
  userId    String
  awardedAt DateTime @default(now())
  reason    String?  @db.VarChar(255)

  badge ForumBadge @relation(fields: [badgeId], references: [id])

  @@unique([badgeId, userId])
  @@map("forum_badge_awards")
}

// ─── SUBSCRIPTIONS & MODERATION ───────────────────────────────────

model ForumSubscription {
  id        String   @id @default(cuid())
  threadId  String
  userId    String
  createdAt DateTime @default(now())

  thread ForumThread @relation(fields: [threadId], references: [id], onDelete: Cascade)

  @@unique([threadId, userId])
  @@map("forum_subscriptions")
}

model ForumReport {
  id       String   @id @default(cuid())
  postId   String
  userId   String
  reason   String   @db.VarChar(100) // "spam" | "abuse" | "off-topic" | "other"
  details  String?  @db.Text
  status   String   @default("pending") @db.VarChar(50) // "pending" | "reviewed" | "dismissed"
  resolvedBy String?
  resolvedAt DateTime?
  createdAt DateTime @default(now())

  post ForumPost @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@map("forum_reports")
}

model ForumPoll {
  id        String   @id @default(cuid())
  threadId  String   @unique
  question  String   @db.VarChar(500)
  options   Json     // [{ id, text, voteCount }]
  endsAt    DateTime?
  allowMultiple Boolean @default(false)
  createdAt DateTime @default(now())

  votes ForumPollVote[]

  @@map("forum_polls")
}

model ForumPollVote {
  id       String   @id @default(cuid())
  pollId   String
  userId   String
  optionIds String[]  // Supports multi-vote
  createdAt DateTime @default(now())

  poll ForumPoll @relation(fields: [pollId], references: [id], onDelete: Cascade)

  @@unique([pollId, userId])
  @@map("forum_poll_votes")
}
```

