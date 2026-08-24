# Scope: Orra web

The Next.js web app: the product dashboard and the public marketing landing page.

**Build approach:** Journey (ship one complete user path at a time, from landing signup through to first value). A recommendation, override freely.
**Workflow:** Beta (after build: verify the app builds and typechecks, then review it yourself). The project default level of rigor; any feature can carry its own tag to do more or less.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit. You decide when a feature is done._

## At a glance

| #   | Feature               | Phase      | Status      |
| --- | --------------------- | ---------- | ----------- |
| 1   | Landing design system | Foundation | in-progress |
| 2   | AI chat restructuring | Core       | in-progress |

## Foundations

### 1. Landing design system · in-progress

One design standard for every landing section: section polarity tokens for the light and dark inversion, a Motion plus GSAP split, a shared LandingContainer, and a landing only palette with full light values.
**Done when:** hero and manifesto run on the standard, the polarity tokens and light palette are wired, LandingContainer and the reduced motion guard exist, and no landing section hardcodes a color or uses dashboard surface tokens.

- [x] Design it (spec): `/architect landing design system`
- [x] Build it: `/develop landing design system`
  - [x] Tokens: light values plus the polarity mapping in globals.css
  - [x] Shared components: LandingContainer and the reduced motion guard
  - [x] Migration: hero and manifesto (polarity, container, no hardcoded colors, no dashboard tokens)
  - [x] Polish: hero entrance timeline (GSAP clip reveal), non overlapping grid layout, responsive neural card and manifesto heading
  - [ ] Cleanup: the font-display class, the LANDING_THEME sync, the root layout scroll check
- [ ] Verify it: run `bun check-types` and `bun build` from the root, then review the landing in light and dark mode at 360px and 375px widths
      Spec [0001](../../specs/apps/web/0001-landing-design-system/index.md)

### 2. AI chat restructuring · in-progress

Restructure the AI chat system with Plan/Act mode switching, user-selectable models via dialog-based selector, optimistic session creation, and shared tool schemas. Follows proven patterns from NightCode reference architecture.
**Done when:** Users can switch Plan/Act modes, select models via dialog, messages appear instantly on send, tool schemas are type-safe across frontend/backend, and streaming errors are handled gracefully.

- [x] Design it (spec): `/architect restructure ai chat`
- [ ] Build it: /develop ai chat restructuring
  - [ ] Shared package: tool schemas and model registry (`packages/types/src/ai-tools.ts`, `models.ts`)
  - [ ] Database: add mode, model, metadata columns (Drizzle migration)
  - [ ] Backend: update streaming service with mode filtering, model selection, error handling
  - [ ] Frontend: model selector dialog, mode toggle, optimistic session creation
  - [ ] Frontend: update streaming consumer with pending tool checks, auto-send
- [ ] Verify it: run `bun check-types` and `bun build` from the root, test Plan/Act mode switching, model selection, and streaming
- [ ] Test it: verify tool filtering in Plan mode, model fallback behavior, and incomplete tool call handling
      Spec [0001](../../specs/apps/server/ai-service/0001-restructure-ai-chat.md)
