---
name: doc-code
description: "Generate documentation using Procida's Diátaxis framework"
---

# /doc-code Command

Generate documentation for code using Procida's Diátaxis framework.

## Usage

```bash
# As flag (after implementing)
> Build the auth system --structure-first --doc-code

# As standalone command
> /doc-code src/services/AuthService.ts
> /doc-code src/features/dashboard/
> /doc-code --type=how-to src/features/export/
```

## Behavior

When invoked, perform these steps:

### 1. Analyze What Was Built

Examine the code to determine what documentation is needed:

| Code Type | Primary Doc | Secondary Docs |
|-----------|-------------|----------------|
| Public API (functions, classes) | Reference | How-to if complex |
| New feature | How-to | Reference for API |
| Complex system | Explanation | Reference + How-to |
| New capability for users | Tutorial (if first of its kind) | How-to |

### 2. Apply Procida's Diátaxis Framework

Each doc type has a specific purpose:

```
TUTORIALS      - Learning-oriented - For newcomers
HOW-TO GUIDES  - Task-oriented    - For practitioners
REFERENCE      - Info-oriented    - For lookup
EXPLANATION    - Understanding    - For context
```

**Key rule**: Never mix types in one document.

### 3. Generate Documentation

#### For Public APIs → Reference Docs

Create inline documentation (JSDoc/JavaDoc) plus external reference:

```typescript
/**
 * Authenticates a user and returns access tokens.
 *
 * @param credentials - Email and password
 * @returns Access and refresh tokens
 * @throws AuthError if credentials are invalid
 *
 * @example
 * ```typescript
 * const tokens = await auth.login({
 *   email: 'user@example.com',
 *   password: 'secret'
 * });
 * ```
 */
async function login(credentials: Credentials): Promise<Tokens>
```

#### For Features → How-To Guides

```markdown
# How to Configure Authentication

## Prerequisites
- Completed initial setup
- Admin access

## Steps
1. Enable the auth module
2. Configure OAuth provider
3. Set up redirect URLs
4. Test the flow

## Troubleshooting
- **Error X**: Solution Y
```

#### For Complex Systems → Explanation

```markdown
# Authentication Architecture

## Why JWT Over Sessions

We chose JWT because...

## Token Flow

```
Login → Validate → Generate Access Token → Store Refresh Token
```

## Security Considerations
...

## Trade-offs
...
```

#### For New Capabilities → Tutorials (rare)

Only for genuinely new features users need to learn:

```markdown
# Tutorial: Build Your First Dashboard Widget

## What You'll Learn
- Create a widget
- Connect to data
- Configure display

## Step 1: Create the Widget
[Explicit steps, no choices]
```

### 4. Determine Placement

| Doc Type | Inline | File Location |
|----------|--------|---------------|
| Reference (API) | JSDoc/JavaDoc | `docs/api/` |
| How-To | - | `docs/how-to/` or README |
| Explanation | - | `docs/architecture/` |
| Tutorial | - | `docs/tutorials/` |

### 5. Verify Completeness

Check:
- [ ] All public functions/classes have inline docs
- [ ] Examples are runnable (copy-paste should work)
- [ ] Links between docs are valid
- [ ] No mixed doc types

## Response Format

```markdown
## Documentation Generated

### Analysis
- Built: [what was implemented]
- Primary doc type: [Reference/How-To/Explanation/Tutorial]
- Reason: [why this type]

### Documents Created

**1. [Type] - [Location]**
[Summary of content]

**2. [Type] - [Location]**
[Summary of content]

### Inline Documentation Added
- `src/file.ts`: [X] functions documented

### Verification
- [x] All public APIs documented
- [x] Examples are runnable
- [x] Links verified
- [x] No mixed doc types
```

## Options

| Option | Effect |
|--------|--------|
| `--type=tutorial` | Force tutorial format |
| `--type=how-to` | Force how-to format |
| `--type=reference` | Force reference format |
| `--type=explanation` | Force explanation format |
| (no option) | Auto-detect appropriate type |

## Integration with Canon

This command activates the Procida canon skill automatically.

The Procida lens ensures:
- Docs serve readers, not writers
- Each doc has one clear purpose
- Structure matches the doc type
- No teaching in reference, no reference in tutorials

## Examples

### After Building a Feature

```
> Build the notification system --structure-first --doc-code

[Claude builds feature, then generates docs]

## Documentation Generated

### Analysis
- Built: NotificationService with send(), schedule(), cancel() methods
- Primary doc type: Reference (public API)
- Secondary: How-to (common use cases)

### Documents Created

**1. Reference - Inline JSDoc + docs/api/notifications.md**
- All 3 public methods documented
- Parameter types, return values, exceptions
- Runnable examples for each

**2. How-To - docs/how-to/send-notifications.md**
- How to send immediate notifications
- How to schedule notifications
- How to handle delivery failures

### Verification
- [x] All public APIs documented
- [x] Examples are runnable
- [x] Links verified
```

### Documenting Existing Code

```
> /doc-code src/services/UserService.ts

## Documentation Generated

### Analysis
- File: UserService.ts (420 lines, 12 public methods)
- Current docs: 3/12 methods documented (25%)
- Type: Reference (service API)

### Documents Created

**1. Inline JSDoc**
- Added documentation to 9 undocumented methods
- Added @example to all 12 methods
- Added @throws where applicable

**2. Reference - docs/api/user-service.md**
- Complete method reference
- Type definitions
- Error codes

### Verification
- [x] All 12 public methods documented
- [x] Examples tested and runnable
- [x] Consistent format throughout
```

### Architecture Documentation

```
> /doc-code --type=explanation src/auth/

## Documentation Generated

### Analysis
- Module: Authentication system
- Complexity: High (OAuth, JWT, refresh tokens)
- Type: Explanation (requested)

### Documents Created

**1. Explanation - docs/architecture/auth-system.md**

# Authentication Architecture

## Overview
The auth system uses JWT with refresh token rotation...

## Why This Approach
We chose JWT over sessions because:
1. Stateless scaling
2. Mobile client support
3. API-first architecture

## Token Flow
[Diagram and explanation]

## Security Considerations
- Refresh token rotation prevents replay attacks
- Access tokens expire after 15 minutes
- Refresh tokens are stored httpOnly

## Trade-offs
Pros: Scalability, simplicity
Cons: Token revocation requires blacklist

## Alternatives Considered
- Session-based auth (rejected: scaling)
- Magic links (rejected: UX for frequent actions)
```
