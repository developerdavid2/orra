# 0001. Restructure AI Chat with Plan/Act Modes and Model Switching

**Date**: 2026-08-20
**Status**: Proposed

## Summary

Restructure the NeuralPay AI chat system to follow proven patterns from the NightCode reference architecture. Add Plan/Act mode switching for safety, user-selectable models via a dialog-based selector, and optimistic session creation for better perceived performance. Move tool schemas to the shared package for type safety and adopt NightCode's streaming error handling patterns for reliability.

## Context

The current AI chat implementation has several issues that impact user experience and code maintainability:

1. **No mode safety**: Users can accidentally make financial changes while just exploring
2. **Hardcoded model**: No way for users to switch between different AI models
3. **Synchronous session creation**: Users wait for server response before seeing their message
4. **Scattered tool definitions**: Tool schemas are duplicated across frontend/backend
5. **Basic error handling**: Streaming errors can crash the connection

The NightCode reference architecture demonstrates clean patterns for these exact problems. This restructuring adopts those patterns while preserving NeuralPay's existing features (context-based tool scoping, financial tools, confirmation flows).

## Requirements

**User stories**:
- As a user, I want to explore my financial data safely without accidentally making changes
- As a user, I want to switch between different AI models to compare outputs and optimize costs
- As a user, I want my messages to appear instantly when I send them
- As a user, I want clear error messages when something goes wrong
- As a developer, I want type-safe tool definitions shared across frontend/backend

**Acceptance criteria**:
- **AC-1**: Users can switch between Plan mode (read-only) and Act mode (full access) per session
- **AC-2**: Plan mode only exposes read-only tools (query transactions, get spending analysis, render charts, etc.)
- **AC-3**: Act mode exposes all tools including write operations (create budgets, recategorize transactions, etc.)
- **AC-4**: Users can select from admin-configurable AI models via a dialog-based model selector
- **AC-5**: Model selection persists per session but can be changed mid-conversation
- **AC-6**: Optimistic session creation shows user message immediately while creating session in background
- **AC-7**: Tool schemas are defined in shared package with type safety across frontend/backend
- **AC-8**: Streaming errors return error strings (not crashes) and surface to users
- **AC-9**: Incomplete tool calls are not saved to database
- **AC-10**: Tool calls auto-send after completion for better multi-step UX
- **AC-11**: Session metadata includes mode, model, context snapshots, and tool outputs

## Options considered

### Option 1: Fix in place (incremental improvements)

Make targeted improvements to the existing system without major restructuring.

**Pros**:
- Lower risk, smaller changes
- Faster to implement
- No migration needed

**Cons**:
- Doesn't address architectural issues
- Tool definitions remain scattered
- Missing proven patterns from NightCode

### Option 2: Full restructure following NightCode patterns

Adopt NightCode's architecture comprehensively: shared tool schemas, mode-based filtering, optimistic updates, and streaming error handling.

**Pros**:
- Proven patterns from production system
- Type safety across codebase
- Better user experience
- Easier to maintain and extend

**Cons**:
- Larger changeset
- Requires database migration
- More testing needed

### Option 3: Hybrid approach (recommended)

Keep current database schema (normalized messages) but adopt NightCode's patterns for tool definitions, mode switching, and streaming. Add metadata column for richer context.

**Pros**:
- Best of both worlds
- Preserves existing query capabilities
- Adopt proven patterns without over-engineering
- Simpler migration

**Cons**:
- Some compromise on pure NightCode pattern

## Decision

**Chosen option**: Option 3: Hybrid approach

Restructure the AI chat system to adopt NightCode patterns while preserving NeuralPay's existing schema and features. This provides the best balance of improved UX, type safety, and maintainability.

**Implementation skills**: `ai-sdk` (`vercel/ai`, `.agents/skills/ai-sdk/`) · `ai-elements` (`vercel/ai-elements`, `.agents/skills/ai-elements/`)

## Rationale

The NightCode reference architecture demonstrates production-proven patterns that solve NeuralPay's current issues. However, NeuralPay's normalized message schema is superior for a web SaaS with filtering and search capabilities. The hybrid approach adopts NightCode's patterns for:

1. **Mode safety**: Plan/Act modes prevent accidental financial changes
2. **Model flexibility**: User-selectable models optimize costs and quality
3. **Better UX**: Optimistic session creation improves perceived performance
4. **Type safety**: Shared tool schemas prevent duplication and errors
5. **Reliability**: Proven streaming error handling patterns

While preserving NeuralPay's strengths:

1. **Normalized messages**: Better for filtering, search, and analytics
2. **Context-based scoping**: Fine-grained tool control per financial context
3. **Existing confirmation flows**: Propose → confirm → execute pattern

## Feature design

**Data model sketch**:

```
chat_sessions (additions):
  - mode: text DEFAULT 'plan' ('plan' | 'act')
  - model: text (selected model ID)

chat_messages (additions):
  - metadata: jsonb (tool outputs, context snapshots, duration, usage)
```

**State transitions**:
- Session mode: plan ↔ act (user-controlled, immediate effect)
- Session model: any supported model ↔ any other (user-controlled, immediate effect)

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| /chat/stream | POST | sessionId, messages[], mode, model | SSE stream | bearer | 401, 402, 429 |

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| Start session | mode | Request parameter (default: 'plan') |
| Start session | model | Request parameter (default: admin-configured default) |
| Stream response | messageMetadata | Derived from request mode, model, duration, usage |
| Save message | metadata | Tool outputs, context snapshots, provider info |

**Key invariants**:
- Plan mode cannot execute write tools (enforced by tool filtering)
- Every message must have valid JSON metadata (or null)
- Session mode/model changes take effect on next request
- Incomplete tool calls are never persisted

**Security model**:
- All users can use Plan and Act modes (no tier restrictions)
- All users can access all admin-configured models (no per-user restrictions)
- Existing context-based tool scoping remains (general, transaction, budget, etc.)

**Configuration required**:
- `SUPPORTED_CHAT_MODELS` in shared package (admin-configurable model registry)
- `DEFAULT_CHAT_MODEL_ID` in shared package (default model for new sessions)

**Model availability behavior**:
- When a user's selected model becomes unavailable mid-session or is removed by admin:
  - Auto-fallback to `DEFAULT_CHAT_MODEL_ID`
  - Show toast notification: "Model unavailable, switched to default"
  - Log fallback for monitoring
- When admin changes `DEFAULT_CHAT_MODEL_ID`:
  - New sessions pick up the new default
  - Existing sessions continue with their stored model

**Incomplete tool call handling**:
- User aborts stream → discard pending tool calls, do not save
- Model fails mid-execution → save message with error metadata (`toolError: true`)
- Timeout (30s default) → save message with timeout metadata (`toolTimeout: true`)

**Auto-send behavior** (AC-10):
- After tool execution completes, auto-send tool results back to model as `tool` messages
- Display tool outputs to user as they stream (real-time)
- If multiple pending tool calls: execute sequentially, auto-send each on completion
- If tool call takes >30s: show progress indicator, allow user to cancel

**Tool list** (AC-1, AC-2, AC-3):

Read-only tools (Plan mode):
1. `queryTransactions` — Query transactions with filters
2. `getSpendingAnalysis` — Get spending breakdown by category
3. `renderSpendingChart` — Generate spending visualization data
4. `queryBudgets` — Query budgets with filters
5. `getUnbudgetedSpending` — Get uncategorized spending
6. `getAccounts` — Query bank accounts

Write tools (Act mode only):
7. `proposeBudgetCreate` — Draft new budget proposal
8. `proposeBudgetEdit` — Draft budget edit proposal
9. `proposeBudgetDelete` — Draft budget deletion proposal
10. `proposeBudgetRebalance` — Draft budget rebalance proposal
11. `proposeSpendingGoal` — Draft spending goal proposal
12. `proposeAccountCreate` — Draft account creation proposal
13. `proposeRecategorize` — Draft transaction recategorization proposal
14. `proposeInsightDismiss` — Draft insight dismissal proposal

**Mode filtering enforcement** (defense-in-depth):
- Router layer: Validate `mode` parameter, reject invalid values
- Streaming service: Filter tool schemas before passing to AI SDK
- Never send write tool schemas to AI SDK in Plan mode (eliminate, don't filter)

**Metadata column sizing**:
- Max metadata size: 1MB per message
- Truncation: Large tool outputs truncated to 100KB, remainder stored as summary
- Cleanup: Old metadata (>90 days) can be compressed or archived

**Mode/model conflict resolution**:
- Request body `mode`/`model` overrides session defaults
- Session stores last-used values as defaults for next request
- If request omits `mode`/`model`, use session defaults (or global defaults for new sessions)

**Critical test scenarios**:
- Happy path: User switches Plan → Act mode, creates budget, verifies tool execution
- Failure case: Streaming error returns error string, user can retry
- Auth/permission: User without quota sees clear upgrade message
- Model fallback: User's model becomes unavailable, auto-fallback to default with toast
- Incomplete tool: Stream dropped mid-tool-call, verify message saved with error metadata
- Mode switch: User switches Plan → Act mid-conversation, verify tool availability updates

## Build plan

1. **Create shared package tool schemas** (`packages/types/src/ai-tools.ts`), satisfies **AC-7**
   - Define Zod schemas for all 14 tools
   - Create read-only tool contracts (Plan mode)
   - Create act tool contracts (Act mode)
   - Add mode-based filtering function

2. **Create shared package model registry** (`packages/types/src/models.ts`), satisfies **AC-4**
   - Define `SUPPORTED_CHAT_MODELS` const array
   - Add model pricing information
   - Export derived types (model ID, provider, etc.)

3. **Update database schema** (Drizzle migration), satisfies **AC-11**
   - Add `mode` and `model` columns to `chat_sessions`
   - Add `metadata` JSON column to `chat_messages`
   - Generate and run migration

4. **Update ai-service streaming** (`apps/server/ai-service/src/services/streaming.service.ts`), satisfies **AC-1, AC-2, AC-3, AC-8, AC-9, AC-10**
   - Import tool schemas from shared package
   - Add mode-based tool filtering
   - Add model parameter to streamText call
   - Implement `onError` returning string pattern
   - Implement `hasPendingToolCalls` check before saving
   - Implement `sendAutomaticallyWhen` for tool completion
   - Save metadata with messages (tool outputs, context snapshots)

5. **Update ai-service router** (`apps/server/ai-service/src/routers/chat-stream.router.ts`), satisfies **AC-1, AC-5**
   - Add `mode` and `model` parameters to request body
   - Pass mode/model to streaming service
   - Update session creation/update with mode/model

6. **Update frontend model selector** (`apps/web/src/modules/chats/ui/components/chat-input.tsx`), satisfies **AC-4, AC-5**
   - Install ModelSelector component from ai-elements
   - Add model selector trigger to chat input
   - Implement model selection dialog
   - Pass selected model to streaming request

7. **Update frontend mode switching** (`apps/web/src/modules/chats/ui/components/chat-input.tsx`), satisfies **AC-1**
   - Add mode toggle (Plan/Act) to chat input
   - Pass selected mode to streaming request
   - Visual indicator of current mode

8. **Update frontend optimistic session creation** (`apps/web/src/modules/chats/ui/components/new-chat-conversation-area.tsx`), satisfies **AC-6**
   - Navigate to `/sessions/new` immediately on user message
   - Show user message optimistically
   - Create session in background
   - On success: navigate to `/sessions/{id}`
   - On error: toast + navigate back

9. **Update frontend streaming consumer** (`apps/web/src/modules/chats/hooks/use-ai-chat.ts`), satisfies **AC-8, AC-9, AC-10**
   - Implement `hasPendingToolCalls` check
   - Implement `sendAutomaticallyWhen` for tool completion
   - Handle streaming errors gracefully

10. **Update frontend session metadata** (`apps/web/src/modules/chats/ui/components/chat-stream-message.tsx`), satisfies **AC-11**
    - Display mode indicator on messages
    - Display model indicator on messages
    - Display duration and usage information

## Consequences

**Positive**:
- Users get safety via Plan mode (no accidental financial changes)
- Users can optimize costs by switching models
- Better perceived performance with optimistic session creation
- Type safety across frontend/backend with shared tool schemas
- Proven streaming error handling patterns

**Negative / tradeoffs**:
- Larger changeset requires thorough testing
- Database migration needed (add columns)
- Users must learn mode concept (mitigated by good UX)
- Model selector adds UI complexity (mitigated by clean dialog design)

**Neutral**:
- Existing context-based tool scoping preserved
- Existing confirmation flows preserved
- No changes to authentication or authorization

## Follow-up

- [ ] Add tier-based model access if needed (free vs pro models)
- [ ] Consider adding mode indicator in conversation header
- [ ] Consider adding model cost estimation in chat UI
- [ ] Add analytics tracking for mode/model usage patterns

## References

**Project sources**:
- NightCode architecture reference (user-provided)
- AI SDK documentation (node_modules/ai/docs/)
- ai-elements ModelSelector documentation (.agents/skills/ai-elements/references/model-selector.md)

**Practices & standards**:
- Plan/Act mode pattern (NightCode)
- Optimistic UI updates ( NightCode)
- Streaming error handling (NightCode)
- Shared package tool contracts (NightCode)
