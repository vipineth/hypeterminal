# Feature: [Feature Name]

## Meta

| Field | Value |
|-------|-------|
| Priority | High / Medium / Low |
| Status | Planned / In Progress / Review / Done |
| Created | YYYY-MM-DD |
| Updated | YYYY-MM-DD |

## Summary

<!-- 1-2 sentence description of what this feature does and why it's needed -->

## User Stories

<!-- Who needs this and what do they want to accomplish? -->

- As a [user type], I want to [action] so that [benefit]
- As a [user type], I want to [action] so that [benefit]

## Requirements

### Must Have

- [ ] Requirement 1
- [ ] Requirement 2

### Nice to Have

- [ ] Optional requirement 1
- [ ] Optional requirement 2

## Tasks

<!-- Ordered implementation steps with checkboxes -->

1. [ ] Task 1 - Description
2. [ ] Task 2 - Description
3. [ ] Task 3 - Description

## Technical Spec

### Finding the Right API

1. **Discover methods by intent** → `docs/hyperliquid-sdk-directory.md`
   - Scan "Want to..." tables to find method names
   - Note the type: (I)nfo, (E)xchange, or (S)ubscription

2. **Get full parameter schema** → `docs/hyperliquid-sdk-1.md` or `docs/hyperliquid-sdk-2.md`
   - Info methods: sdk-1 lines 1036-1775
   - Exchange methods: sdk-1 lines 1776-2054 + sdk-2 lines 1-220
   - Subscriptions: sdk-2 lines 221-540
   - Signing utilities: sdk-2 lines 799-1060

### SDK/API Details

<!-- Relevant SDK methods, API endpoints, data structures -->

```typescript
// Code examples, type definitions, etc.
```

### Hooks to Use

<!-- Which existing hooks to use or new hooks needed -->

- `useExampleHook` - Purpose

### State Management

<!-- Zustand stores, context, or other state needed -->

```typescript
// State shape example
```

## Files

### Modify

<!-- Existing files that need changes -->

- `path/to/file.tsx` - What to change

### Create

<!-- New files to create -->

- `path/to/new-file.tsx` - Purpose

## UI/UX

<!-- Describe the user interface, include wireframes or screenshots if available -->

### Components

- **ComponentName** - Description of what it renders

### User Flow

1. User does X
2. System shows Y
3. User confirms Z

## Edge Cases

<!-- Things to handle or watch out for -->

- Edge case 1 - How to handle
- Edge case 2 - How to handle

## Research Notes

<!-- Any findings from exploring the codebase or SDK docs -->

- Finding 1
- Finding 2

## Open Questions

<!-- Unresolved decisions or things to clarify -->

- [ ] Question 1?
- [ ] Question 2?
