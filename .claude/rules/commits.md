# Commit Message Convention

Standard commit message format for this project, based on Conventional Commits.

## Format

```
<type>: <subject>
```

## Types

| Type | Description |
|------|-------------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `style` | Formatting, whitespace, missing semicolons (no code change) |
| `test` | Adding or updating tests |
| `build` | Build system or external dependencies |
| `ci` | CI/CD configuration |
| `i18n` | Translations and internationalization |
| `docs` | Documentation only |

## Subject Rules

- **Max 50 characters** - keeps git log clean
- **Lowercase** - no capital letters
- **No period** - don't end with punctuation
- **Imperative mood** - "add" not "added" or "adds"
- **What, not how** - describe the change, not the implementation

## Good Examples

```
feat: add isolated margin mode for positions
fix: correct leverage calculation for cross margin
refactor: simplify order entry validation logic
perf: memoize orderbook row calculations
style: format trading components with biome
test: add unit tests for pnl calculations
build: upgrade viem to v2.42
i18n: add korean translations for trade panel
```

## Bad Examples

```
# Too vague
feat: update stuff
fix: bug fix

# Not imperative
feat: added new feature
fix: fixes the issue

# Too long
feat: add new isolated margin mode that allows users to set individual leverage per position

# Wrong case/punctuation
Feat: Add margin mode.
FIX: correct calculation

# Describes how, not what
refactor: use useMemo instead of useEffect
```

## Multi-line Messages

For complex changes, add a body after a blank line:

```
feat: add isolated margin mode

- Support per-position leverage settings
- Add margin mode toggle in position panel
- Update order entry to respect isolated margin
```

## Breaking Changes

Prefix with `!` after the type:

```
feat!: change position data structure
refactor!: rename useAccount to useConnection
```
