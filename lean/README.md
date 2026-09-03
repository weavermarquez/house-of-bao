# Lean 4 workbench for coding agents

Notes from setting up Lean 4 + Mathlib so a coding agent (Claude Code, Cowork,
Codex, …) can actually prove things rather than guess at them.

## TL;DR

```bash
./lean/bootstrap.sh          # elan + Mathlib project + cache + MCP wiring
```

Then, in Claude Code, from the Lean project root:

```
/plugin marketplace add cameronfreer/lean4-skills
/plugin install lean4
```

Both also work headlessly, which is what the bootstrap uses:

```bash
claude plugin marketplace add cameronfreer/lean4-skills
claude plugin install lean4
```

That is the whole stack: **elan** for the toolchain, **lean-lsp-mcp** so the
agent can see goal state, and **lean4-skills** for the proving workflow.

## Why the LSP server is the part that matters

The default failure mode is an agent writing Lean the way it writes Python:
emit a block, run the build, read the error, guess again. That is miserable in
Lean, because the build is slow and the error text alone does not tell you what
you were actually trying to prove.

Lean's interaction model is the *goal state* — at any point inside a proof, the
hypotheses in scope and the target. Human Lean users have this in their editor
continuously. An agent without it is working blind.

[`lean-lsp-mcp`](https://github.com/oOo0oOo/lean-lsp-mcp) exposes the Lean
language server over MCP, so the agent gets diagnostics, goal state at a
cursor position, term elaboration, and hover docs — plus Mathlib search via
LeanSearch, Loogle, Lean Finder, Lean Hammer, and Lean State Search.

Install (from the Lean project root, so paths resolve):

```bash
claude mcp add lean-lsp -s project -- uvx lean-lsp-mcp
```

Practical notes:

- Run `lake build` once by hand first. A cold project makes the LSP time out.
- Install `ripgrep`; `lean_local_search` uses it, and it is much faster and less
  rate-limited than the remote search backends.
- `LEAN_MCP_DISABLED_TOOLS` trims the tool list if the context budget is tight.
- Setting `LEAN_REPL=true` (with the REPL package added) speeds up snippet runs.

## The workflow layer

[`cameronfreer/lean4-skills`](https://github.com/cameronfreer/lean4-skills) is
the most developed public workflow pack — this is the "Acerfur" work. It is
host-agnostic (Claude Code, Codex, Gemini CLI, Cursor share the core skill; only
the invocation surface differs), and Claude Code gets the fullest surface:
commands, hooks, guardrails, and subagents.

Twelve workflows, invoked as `/lean4:<name>`:

| Stage | Workflows |
|---|---|
| Synthesis | `draft`, `formalize`, `autoformalize` |
| Proving | `prove`, `autoprove` |
| Refutation | `disprove` |
| Quality | `review`, `refactor`, `golf`, `checkpoint`, `learn`, `diagnose` |

All the proving workflows run the same loop:

> Plan → Work → Checkpoint → Review → Replan → Continue/Stop

The interesting design choice is that **being stuck is a state transition**, not
something to grind on. When a goal resists, the workflow forces a review and
replan instead of letting the agent burn budget re-rolling tactics — which is
the standard way agentic proving gets expensive. `autoprove` carries an explicit
stop budget for the same reason.

Verified component inventory (`claude plugin details lean4`, v4.8.2): 13 skills,
4 subagents — `proof-golfer`, `axiom-eliminator`, `sorry-filler-deep`,
`proof-repair` — and 3 harness-only hooks (SessionStart, UserPromptSubmit,
PreToolUse). Always-on context cost is ~800 tokens; individual skills cost
~2–12k each only when invoked. That is a cheap thing to leave installed.

The suggested session shape:

```
draft → prove → review → refactor → golf → checkpoint → git push
```

Its success criterion is worth stealing regardless of tooling: **`lake build`
passes, zero `sorry`, zero custom axioms.** That last clause matters — an agent
can "close" a goal by quietly introducing an axiom, and the proof is then
worthless. `checkpoint` runs `#print axioms` to catch it.

Related: [`CBirkbeck/mathlib-quality`](https://github.com/CBirkbeck/mathlib-quality),
a narrower skill for golfing Lean up to Mathlib contribution standards.

## Aristotle (Harmonic)

[Aristotle](https://aristotle.harmonic.fun/) is a different kind of tool: a
hosted, heavyweight proof search you hand a goal to, not a local assistant. You
give it Lean with `sorry` holes and it tries to fill them; it also formalizes
from natural language or LaTeX.

The CLI is installed by the bootstrap:

```bash
uv tool install aristotlelib
export ARISTOTLE_API_KEY=...      # from aristotle.harmonic.fun
aristotle submit --project-dir . --wait
```

Subcommands: `submit`, `continue`, `formalize`, `download`, `list`, `show`,
`tasks`, `cancel`.

There is also an MCP wrapper,
[`septract/lean-aristotle-mcp`](https://github.com/septract/lean-aristotle-mcp),
exposing `prove`, `prove_file`, `formalize` plus polling counterparts:

```bash
claude mcp add aristotle -e ARISTOTLE_API_KEY=$ARISTOTLE_API_KEY -- \
  uvx --from git+https://github.com/septract/lean-aristotle-mcp aristotle-mcp
```

Caveats, because they shape how you use it:

- **Latency is minutes to hours.** Simple goals land in 1–5 minutes; hard ones
  run for hours. Submit async (`wait=False`) and poll; do not block a session
  on it.
- **You need an account.** Sign-up and key generation are at
  aristotle.harmonic.fun; pricing is not published, and there is a separate
  research grant program.
- It is a *finisher*, not a *driver*. The sensible division of labour is: use
  the local agent + LSP to state the theorem, decompose it, and get the
  structure right; hand the genuinely hard leaf lemmas to Aristotle.

## Honest assessment

The literature converges on one point: agentic theorem proving is
[expensive](https://arxiv.org/pdf/2606.04883), and most of the cost goes into
attempts that fail. Everything above is really about making failure cheap and
visible — LSP so the agent sees the goal instead of guessing, explicit stop
budgets so it gives up early, axiom checks so a fake success gets caught.

The setup cost is real but one-time-ish: Mathlib is ~7 GB of prebuilt `.olean`
cache. On an ephemeral container that is a per-session download, which is why
the bootstrap script exists.

## References

- [oOo0oOo/lean-lsp-mcp](https://github.com/oOo0oOo/lean-lsp-mcp) — Lean LSP over MCP
- [cameronfreer/lean4-skills](https://github.com/cameronfreer/lean4-skills) — workflow pack
- [CBirkbeck/mathlib-quality](https://github.com/CBirkbeck/mathlib-quality) — golfing skill
- [septract/lean-aristotle-mcp](https://github.com/septract/lean-aristotle-mcp) — Aristotle MCP
- [aristotlelib](https://pypi.org/project/aristotlelib/) — Aristotle SDK/CLI
- [Optimizing the Cost-Quality Tradeoff of Agentic Theorem Provers in Lean](https://arxiv.org/pdf/2606.04883)
- [Aristotle API case study: the Grasshopper Problem](https://arxiv.org/pdf/2605.20120)

## Running on ephemeral containers

Two things bit us setting this up in Claude Code on the web, both worth knowing:

**The toolchain does not persist.** The container is reclaimed after inactivity
and the repo is re-cloned fresh, so the ~7.5 GB Mathlib cache is gone every
session. `bootstrap.sh` exists precisely so that is a ten-minute command rather
than an afternoon.

**Environment variables are bound at container creation.** Saving
`ARISTOTLE_API_KEY` in the environment settings does *not* propagate into a
container that is already running, and there is no refresh — the key only shows
up in the next session. If you need it mid-session, the options are to start a
new session or to schedule a wake-up that lands on a fresh container.

See [HANDOFF.md](HANDOFF.md) for the step-by-step build instructions to hand to an agent.

## Verified on this box

Linux x86_64, Lean 4.33.1, Mathlib pinned to `v4.33.1`:

| Step | Result |
|---|---|
| `elan` + toolchain install | ~1 min |
| `lake new logics math` (clone deps) | ~5 min, 8 packages |
| `lake exe cache get` | 8690 prebuilt `.olean` files, ~7.5 GB on disk |
| `lake build` with full `import Mathlib` | **17 s**, 8709 jobs |
| `claude plugin install lean4` | v4.8.2, 13 skills + 4 subagents |
| `uvx lean-lsp-mcp` | starts clean |
| `aristotle` CLI | v2.1.0 installed |

Three sample theorems in `examples/` were proved and axiom-checked
(`lean/examples/Proved.lean`):

```
'Proved.contrapositive_iff'       depends on axioms: [propext, Classical.choice, Quot.sound]
'Proved.monotone_involution_id'   depends on axioms: [propext]
'Proved.box_distrib'              does not depend on any axioms
```

Only Lean's three standard axioms appear — no custom axiom was introduced, which
is the check that catches a "proof" that quietly assumed its own conclusion.

The headline number is that 17 s rebuild. Once the cache is warm, the
edit/check loop is fast enough for an agent to work interactively; it is the
cold-start download, not the type-checking, that costs you.
