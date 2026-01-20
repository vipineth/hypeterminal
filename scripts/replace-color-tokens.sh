#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"

replace() {
  local from="$1"
  local to="$2"
  rg -l0 --fixed-strings --hidden --glob '!.git' \
    --glob '*.ts' --glob '*.tsx' --glob '*.css' --glob '*.md' \
    -- "$from" "$ROOT" | xargs -0 perl -pi -e "s/\Q${from}\E/${to}/g" || true
}

replace_regex() {
  local pattern="$1"
  local to="$2"
  rg -l0 --hidden --glob '!.git' \
    --glob '*.ts' --glob '*.tsx' --glob '*.css' --glob '*.md' \
    -- "$pattern" "$ROOT" | xargs -0 perl -pi -e "s/${pattern}/${to}/g" || true
}

# Core tokens
replace "--background" "--bg"
replace "--foreground" "--fg"
replace "--surface-foreground" "--surface-fg"
replace "--primary-foreground" "--primary-fg"
replace "--secondary-foreground" "--secondary-fg"
replace "--muted-foreground" "--muted-fg"
replace "--accent-foreground" "--accent-fg"
replace "--destructive-foreground" "--danger-fg"
replace "--destructive" "--danger"
replace "--destructive-fg" "--danger-fg"
replace "--color-destructive" "--color-danger"
replace "--color-destructive-fg" "--color-danger-fg"

# Sidebar tokens -> base tokens
replace "--sidebar-foreground" "--fg"
replace "--sidebar-primary-foreground" "--primary-fg"
replace "--sidebar-accent-foreground" "--accent-fg"
replace "--sidebar-accent" "--accent"
replace "--sidebar-border" "--border"
replace "--sidebar-ring" "--ring"
replace "--sidebar-primary" "--primary"

# Terminal -> signals
replace "--terminal-green" "--positive"
replace "--terminal-red" "--negative"
replace "--terminal-cyan" "--info"
replace "--terminal-amber" "--warning"
replace "--terminal-purple" "--highlight"
replace "--status-positive" "--positive"
replace "--status-negative" "--negative"
replace "--status-info" "--info"
replace "--status-warning" "--warning"
replace "--status-highlight" "--highlight"

# Tailwind class tokens
replace "font-sans" "font-mono"
replace "font-serif" "font-mono"
replace "bg-background" "bg-bg"
replace "text-foreground" "text-fg"
replace "text-background" "text-bg"
replace "fill-foreground" "fill-fg"
replace "stroke-foreground" "stroke-fg"
replace "bg-foreground" "bg-fg"
replace "border-foreground" "border-fg"
replace "border-background" "border-bg"
replace "ring-offset-background" "ring-offset-bg"
replace "outline-background" "outline-bg"
replace "from-background" "from-bg"
replace "via-background" "via-bg"
replace "to-background" "to-bg"

replace "surface-foreground" "surface-fg"
replace "primary-foreground" "primary-fg"
replace "secondary-foreground" "secondary-fg"
replace "muted-foreground" "muted-fg"
replace "accent-foreground" "accent-fg"
replace "destructive-foreground" "danger-fg"
replace "text-destructive-fg" "text-danger-fg"
replace "bg-destructive" "bg-danger"
replace "text-destructive" "text-danger"
replace "border-destructive" "border-danger"
replace "ring-destructive" "ring-danger"
replace "shadow-[0_0_0_1px_hsl(var(--sidebar-border))]" "shadow-[0_0_0_1px_var(--border)]"
replace "shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]" "shadow-[0_0_0_1px_var(--accent)]"
replace "shadow-[0_0_0_1px_hsl(var(--border))]" "shadow-[0_0_0_1px_var(--border)]"
replace "shadow-[0_0_0_1px_hsl(var(--accent))]" "shadow-[0_0_0_1px_var(--accent)]"

replace "sidebar-foreground" "fg"
replace "sidebar-primary-foreground" "primary-fg"
replace "sidebar-accent-foreground" "accent-fg"
replace "bg-sidebar-accent" "bg-accent"
replace "bg-sidebar-border" "bg-border"
replace "bg-sidebar" "bg-bg"
replace "text-sidebar-fg" "text-fg"
replace "text-sidebar-accent-fg" "text-accent-fg"
replace "border-sidebar-border" "border-border"
replace "ring-sidebar-ring" "ring-ring"
replace "bg-bg-accent" "bg-accent"
replace "bg-bg-border" "bg-border"

# Glow class removals
replace "terminal-glow-green" ""
replace "terminal-glow-red" ""
replace "terminal-glow-cyan" ""
replace "terminal-glow-amber" ""
replace "glow-positive" ""
replace "glow-negative" ""
replace "glow-info" ""
replace "glow-warning" ""

# Shadow cleanup
replace "shadow-2xs" "shadow-xs"
replace_regex $'(^|[[:space:]"\\\'`])shadow([[:space:]"\\\'`])' '$1shadow-sm$2'
