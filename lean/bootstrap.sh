#!/usr/bin/env bash
# Bootstrap a Lean 4 + Mathlib workbench with agent tooling wired in.
#
# Idempotent: safe to re-run. Designed for ephemeral cloud containers where
# the toolchain has to be rebuilt from scratch each session.
#
#   ./lean/bootstrap.sh [project-dir]      # default: $HOME/lean-lab/logics
set -euo pipefail

PROJECT_DIR="${1:-$HOME/lean-lab/logics}"
PROJECT_NAME="$(basename "$PROJECT_DIR")"
PARENT_DIR="$(dirname "$PROJECT_DIR")"

log() { printf '\n==> %s\n' "$*"; }

# --- 1. elan (Lean toolchain manager) -------------------------------------
# Homebrew also ships `elan-init`, but on Linux the upstream script is the
# canonical path and avoids pulling in all of Homebrew.
if ! command -v elan >/dev/null 2>&1; then
  log "Installing elan"
  curl -fsSL https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh \
    | sh -s -- -y --default-toolchain stable
fi
export PATH="$HOME/.elan/bin:$PATH"
elan --version

# --- 2. uv (drives the MCP servers and the Aristotle CLI) -----------------
if ! command -v uv >/dev/null 2>&1; then
  log "Installing uv"
  curl -LsSf https://astral.sh/uv/install.sh | sh
fi
export PATH="$HOME/.local/bin:$PATH"

# ripgrep powers lean-lsp-mcp's fast local Mathlib search; without it the
# server falls back to slower rate-limited remote search.
command -v rg >/dev/null 2>&1 || log "WARNING: ripgrep not found; install it for fast local Mathlib search"

# --- 3. Mathlib project ---------------------------------------------------
if [ ! -f "$PROJECT_DIR/lakefile.toml" ]; then
  log "Scaffolding Mathlib project at $PROJECT_DIR"
  mkdir -p "$PARENT_DIR"
  ( cd "$PARENT_DIR" && lake new "$PROJECT_NAME" math )
fi

cd "$PROJECT_DIR"

# `cache get` downloads prebuilt .olean files. Skipping it means compiling
# Mathlib from source, which is hours of CPU instead of minutes of download.
log "Fetching prebuilt Mathlib cache"
lake exe cache get

log "Building"
lake build

# --- 4. Agent tooling -----------------------------------------------------
log "Installing Aristotle CLI (Harmonic)"
uv tool install --quiet aristotlelib || true

log "Registering MCP servers with Claude Code"
if command -v claude >/dev/null 2>&1; then
  # Live goal state, diagnostics, hover docs, and Mathlib search over LSP.
  claude mcp add lean-lsp -s project -- uvx lean-lsp-mcp 2>/dev/null \
    || echo "    lean-lsp already registered"

  # Aristotle only registers when a key is present; it is a paid remote prover.
  if [ -n "${ARISTOTLE_API_KEY:-}" ]; then
    claude mcp add aristotle -s project -e "ARISTOTLE_API_KEY=$ARISTOTLE_API_KEY" -- \
      uvx --from git+https://github.com/septract/lean-aristotle-mcp aristotle-mcp 2>/dev/null \
      || echo "    aristotle already registered"
  else
    echo "    ARISTOTLE_API_KEY unset; skipping Aristotle MCP"
  fi
  # Workflow pack: prove/review/golf loop, axiom checks, proof subagents.
  claude plugin marketplace add cameronfreer/lean4-skills 2>/dev/null || true
  claude plugin install lean4 2>/dev/null || echo "    lean4 plugin already installed"
else
  echo "    claude CLI not found; register MCP servers manually (see lean/README.md)"
fi

log "Done. Project: $PROJECT_DIR"
echo "Add to your shell profile:"
echo '  export PATH="$HOME/.elan/bin:$HOME/.local/bin:$PATH"'
