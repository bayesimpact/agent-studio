# Live provider regressions

Everything in this folder talks to LIVE LLM endpoints (vLLM deployments,
Vertex AI). **None of it runs in CI**, by construction:

- jest does not even COLLECT `*.live.spec.ts` files unless
  `LIVE_PROVIDER_REGRESSIONS=1` is set (`testPathIgnorePatterns` in
  `jest.config.ts`) — importing them needs network credentials and node
  flags, so they must never load in CI. Name every new live spec
  `*.live.spec.ts` to inherit this exclusion.
- The `describe.skip` gate on the same env var is kept inside the specs as a
  second layer.
- `measure-voluntary-rate.ts` is a plain ts-node script (deliberately not a
  `*.spec.ts`, so jest never collects it).

## Contract suites

One production-shaped turn per provider/model (`provider-cases.ts` is the
shared matrix; unavailable providers auto-skip with a visible reason):

- `turn-summary.live.spec.ts` — RAG turn on the handbook fixture: grounded
  answer (the fixture value is deliberately NOT the statutory number, so a
  correct answer proves retrieval) + `submit_turn_summary` executed exactly
  once (voluntarily or through the forced end-of-turn generation, never both).
- `fat-prompt-turn-summary.live.spec.ts` — no-RAG agent with a ~9k-token
  system prompt and strict guardrails (anonymized production shape), across
  greeting / service question / strict refusal / off-topic.

Run them with (NODE_OPTIONS required by google-auth dynamic imports):

```bash
LIVE_PROVIDER_REGRESSIONS=1 NODE_OPTIONS=--experimental-vm-modules \
  npx jest --runInBand --forceExit src/external/llm/providers/live-regressions
```

## Behavior measurement (not a test)

The contract suites assert outcomes; `measure-voluntary-rate.ts` observes the
steps and measures HOW the outcome was reached (voluntary call vs would-need
the forced generation, lookup ran or skipped), over repeated attempts. Use it
to evaluate prompt-engineering iterations before changing production wording:

```bash
npx ts-node --transpile-only -r tsconfig-paths/register \
  src/external/llm/providers/live-regressions/measure-voluntary-rate.ts \
  --model gemini-3.1-flash-lite --scenario fat --attempts 5
```

The serving-level counterpart of these suites (raw vLLM behavior: parser
regressions, tool_choice modes) lives in the infra repo:
`infra/vllm/gemma4-regressions/`.
