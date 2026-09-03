# Handoff: build the Lean 4 agent workbench

**Audience:** a coding agent (Claude Code, Codex, Cursor, …) with shell access on
a Linux VPS or macOS dev box.

**Goal:** a Lean 4 + Mathlib environment where the agent can *see proof goal
state* rather than guessing tactics, plus the workflow pack that keeps proof
attempts from burning unbounded budget.

**Definition of done:** all five gates in [Verification](#verification) pass.

Everything below was executed and verified on Linux x86_64 (Lean 4.33.1,
Mathlib pinned `v4.33.1`). Times are from that run.

---

## 0. Preflight

| Requirement | Why |
|---|---|
| **~10 GB free disk** | Mathlib's prebuilt cache alone is ~7.5 GB |
| **~4 GB RAM** | Elaborating `import Mathlib` |
| `curl`, `git` | installers |
| `ripgrep` (`rg`) | fast local Mathlib search; without it the MCP server falls back to rate-limited remote search |

```bash
df -h .            # need ~10GB free
command -v rg git curl
```

Do not skip ripgrep. It is the difference between instant local lemma search
and hitting a shared rate limit.

---

## 1. Toolchain (`elan`)

`elan` is Lean's version manager — it installs the right Lean per project, which
matters because Mathlib pins an exact toolchain.

**macOS:**
```bash
brew install elan-init
```

**Linux (or macOS without brew):**
```bash
curl -fsSL https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh \
  | sh -s -- -y --default-toolchain stable
export PATH="$HOME/.elan/bin:$PATH"     # add to shell profile
```

> ⚠️ Homebrew also has a formula called plain `lean`. **Do not use it** — it pins
> one fixed Lean version and will fight Mathlib's toolchain pin. `elan-init` is
> the correct formula.

**Gate 1:** `elan --version && lean --version && lake --version`

---

## 2. `uv` (drives the MCP servers)

```bash
command -v uv || curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"
```

**Gate 2:** `uv --version`

---

## 3. Mathlib project

```bash
mkdir -p ~/lean-lab && cd ~/lean-lab
lake new logics math        # `math` template = Mathlib dependency preconfigured
cd logics
```

Takes ~5 min; clones 8 packages (mathlib, batteries, aesop, Qq, plausible,
proofwidgets, importGraph, Cli, LeanSearchClient).

Now the single most important command in this document:

```bash
lake exe cache get          # ~7.5 GB, 8690 prebuilt .olean files
lake build
```

> ⚠️ **Never skip `lake exe cache get`.** It downloads Mathlib prebuilt. Without
> it `lake build` compiles Mathlib from source — *hours* of CPU instead of
> minutes of download. If someone reports "Lean is unusably slow", this is
> almost always the cause.

**Gate 3:** `lake build` exits 0. Once warm, a full `import Mathlib` rebuild
should take **~15–20 s**, not minutes. If it takes minutes, the cache did not
land — re-run `lake exe cache get`.

---

## 4. Lean LSP over MCP — *the part that matters*

This is what stops the agent proving blind. Lean's interaction model is the
**goal state**: at any point in a proof, the hypotheses in scope and the current
target. Without it an agent writes Lean like Python — emit a block, run the
build, read the error, guess again — which is slow and, worse, the error text
alone does not say what you were trying to prove.

Run **from the Lean project root** so paths resolve:

```bash
claude mcp add lean-lsp -s project -- uvx lean-lsp-mcp
```

`-s project` writes a committable `.mcp.json`. Drop it for user scope.

Tools it exposes (verified names, useful when writing prompts):

| Tool | Use |
|---|---|
| `lean_goal` | goal state at a position — **the important one** |
| `lean_diagnostic_messages` | errors/warnings for a file |
| `lean_local_search` | ripgrep over local Mathlib (fast, no rate limit) |
| `lean_leansearch`, `lean_loogle`, `lean_leanfinder` | remote Mathlib search |
| `lean_multi_attempt` | try several tactics, keep what compiles |
| `lean_run_code` | run a snippet |
| `lean_code_actions` | LSP quick-fixes |

Tuning:
- `lake build` **before** first use — a cold project makes the LSP time out.
- `LEAN_MCP_DISABLED_TOOLS` trims the tool list if context is tight.
- `--repl` / `LEAN_REPL=true` speeds up snippet runs (needs the REPL package).
- `--loogle-local` avoids remote rate limits (first index is slow + memory-hungry).

**Gate 4:** `uvx lean-lsp-mcp --help` runs, and `claude mcp list` shows
`lean-lsp`. First actual use needs interactive approval — run `claude` once and
approve it.

---

## 5. Workflow pack (`lean4-skills`)

```bash
claude plugin marketplace add cameronfreer/lean4-skills
claude plugin install lean4
```

(Or `/plugin marketplace add …` + `/plugin install lean4` interactively.)

Ships 13 skills and 4 subagents for ~800 tokens always-on — cheap to leave
installed, since per-skill cost is only paid on invocation.

| Skills | `/lean4:draft`, `formalize`, `autoformalize`, `prove`, `autoprove`, `disprove`, `review`, `refactor`, `golf`, `checkpoint`, `learn`, `diagnose` |
|---|---|
| **Subagents** | `proof-golfer`, `axiom-eliminator`, `sorry-filler-deep`, `proof-repair` |

Session shape: `draft → prove → review → refactor → golf → checkpoint → push`

Two ideas worth internalising even if you skip the plugin:

1. **Being stuck is a state transition, not a grind.** The loop is
   Plan → Work → Checkpoint → Review → Replan → Continue/**Stop**, with explicit
   stop budgets. Agentic proving is expensive mostly because of attempts that
   fail; the fix is giving up early and visibly.
2. **Done = `lake build` passes + zero `sorry` + zero custom axioms.** That third
   clause is load-bearing: an agent can "close" a goal by quietly introducing an
   axiom, and the proof is then worthless. Check it:

```lean
#print axioms My.theorem
```

Only `propext`, `Classical.choice`, `Quot.sound` are acceptable — those are
Lean's own. **Anything else means the proof assumed what it was meant to prove.**

**Gate 5:** `claude plugin details lean4` lists 13 skills + 4 agents.

---

## 6. Aristotle (optional, paid, remote)

> **Observed run:** 3 `sorry`s in `lean/examples/Sorries.lean` (a propositional
> warm-up, a monotone-involution argument needing trichotomy, and a modal
> distribution lemma) → **all three filled in ~8 minutes**, one submission, no
> retries. Proofs were re-checked in our own project: clean build, zero
> `sorry`, standard axioms only. It also returns an `ARISTOTLE_SUMMARY.md`
> stating what it did and how it verified. Its trichotomy proof was
> structurally identical to the hand-written one.

[Harmonic's Aristotle](https://aristotle.harmonic.fun/) is a *different kind of
tool*: hosted heavyweight proof search you hand goals to. Not a local assistant.

```bash
uv tool install aristotlelib
export ARISTOTLE_API_KEY=...    # from aristotle.harmonic.fun
aristotle submit "Fill in all sorries. Do not modify theorem statements." \
  --project-dir .               # omit --wait; poll instead
aristotle list                  # fast; poll for STATUS (RUNNING -> IDLE)
aristotle download <id> --destination ./result   # gzip archive of the project
```

MCP wrapper, if you want it inline:
```bash
claude mcp add aristotle -e ARISTOTLE_API_KEY=$ARISTOTLE_API_KEY -- \
  uvx --from git+https://github.com/septract/lean-aristotle-mcp aristotle-mcp
```

Gotchas, all observed:

- **Aristotle pins its own toolchain.** It warned that it wants
  `leanprover/lean4:v4.28.0` while our project was on `v4.33.1`. If you plan to
  lean on Aristotle, pin your project to *its* version rather than latest.
- **Watch what you upload.** `--project-dir` ships the directory. Point it at a
  minimal dir (lakefile + toolchain + the `.lean` files), *not* a project with a
  7.5 GB `.lake/` in it. It will warn that a missing `.lake` degrades results —
  that is a real tradeoff, not a bug.
- **Latency is minutes to hours** (8 min for our 3 easy goals). Submit async
  and poll. Never block a session on it.
- **Poll with `aristotle list`, not `aristotle show`.** `list` returns a status
  table immediately; `show` streams events and will hang a scripted call (it
  blew past a 120 s timeout for us). Use `show` only interactively.
- It is a **finisher, not a driver**. State and decompose the problem locally
  with the LSP loop; hand Aristotle the genuinely hard leaf lemmas.

---

## Verification

Run all five. Any failure = stop and fix before continuing.

```bash
elan --version && lean --version && lake --version   # Gate 1
uv --version                                          # Gate 2
cd ~/lean-lab/logics && time lake build               # Gate 3 — expect ~15-20s warm
uvx lean-lsp-mcp --help >/dev/null && echo lsp-ok     # Gate 4
claude plugin details lean4                           # Gate 5
```

Then the real end-to-end test — this proves Mathlib is actually usable:

```bash
cat > Logics/Smoke.lean <<'EOF'
import Mathlib
theorem smoke {α : Type*} [LinearOrder α] (f : α → α)
    (hmono : Monotone f) (hinv : ∀ x, f (f x) = x) : ∀ x, f x = x := by
  intro x
  rcases lt_trichotomy (f x) x with h | h | h
  · have hle := hmono h.le; rw [hinv] at hle; exact absurd h (not_lt.mpr hle)
  · exact h
  · have hle := hmono h.le; rw [hinv] at hle; exact absurd h (not_lt.mpr hle)
#print axioms smoke
EOF
echo 'import Logics.Smoke' >> Logics.lean
lake build
```

Expect `'smoke' depends on axioms: [propext]` and a clean build.

---

## Known gotchas, collected

| Symptom | Cause | Fix |
|---|---|---|
| `lake build` takes hours | cache never fetched | `lake exe cache get` |
| Lean version fights Mathlib | used brew `lean` formula | use `elan-init` |
| MCP server times out | project not built | `lake build` first |
| Mathlib search rate-limited | no ripgrep | install `rg`, prefer `lean_local_search` |
| Aristotle toolchain warning | it pins v4.28.0 | pin project to match |
| Env var invisible to a running cloud container | env binds at container creation | start a new session |
| Toolchain vanishes between cloud sessions | container is ephemeral | re-run `bootstrap.sh` |

---

## Shortcut

`lean/bootstrap.sh` in this repo does steps 1–5 idempotently:

```bash
./lean/bootstrap.sh [project-dir]     # default ~/lean-lab/logics
```

Read it before running it — it installs toolchains and registers MCP servers.
