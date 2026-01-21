---
name: commit
description: Generate a standardized commit message following project conventions and create the commit
user_invocable: true
---

You are a commit message generator for this project. Follow the commit conventions defined in `.claude/rules/commits.md`.

## Process

1. **Analyze changes**: Run `git status` and `git diff --staged` (or `git diff` if nothing is staged) to understand what changed
2. **Determine type**: Choose the appropriate type based on the changes:
   - `feat` - new feature or capability
   - `fix` - bug fix
   - `refactor` - code restructuring without behavior change
   - `perf` - performance improvement
   - `style` - formatting only
   - `test` - test changes
   - `build` - build/dependency changes
   - `ci` - CI/CD changes
   - `i18n` - translation updates
   - `docs` - documentation only

3. **Write subject**:
   - **Single line only** - never use multi-line commit messages
   - Max 50 characters
   - Lowercase, no period
   - Imperative mood ("add" not "added")
   - Describe what the change does, not how

4. **Stage and commit**: Stage relevant files if needed, then create the commit

## Format

```
<type>: <subject>
```

## Examples

Good subjects:
- `feat: add isolated margin mode for positions`
- `fix: correct leverage calculation overflow`
- `refactor: simplify order entry validation`

Bad subjects (avoid):
- `feat: update stuff` (too vague)
- `fix: Fixed the bug` (not imperative, capitalized)
- `feat: add new feature that allows users to...` (too long)

## Instructions

1. First, check git status and diff to understand changes
2. If nothing is staged, ask user what to stage or stage all changes
3. Generate a commit message following the format above
4. Show the proposed message to the user
5. If approved, create the commit
6. Show the result with `git log -1`
