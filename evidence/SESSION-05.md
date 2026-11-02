# Session 5 — validation pending

Selected on **2 November 2026 Europe/Zurich**: `skip`, `takeWhile`,
`skipWhile`, `takeUntil`, `skipUntil`. No sixth export was selected.
The live baseline was `d8a7f07de80408714fe8a91df67b5f39bc5e6e57`.

Source inspection uses RxJS 7.8.2 at `e5351d02e225e275ac0e497c7b66eaa5f0c88791`.
See [the guide](../docs/SESSION-05-GATING.md) for six-tuples, value shapes,
state-dependent legal behavior, sources, time/cancellation/sharing and limits.

Local preparation used Node 22.16.0 and TypeScript 5.8.3, with byte-identical
copies of the repository schema, runner, renderer and strict tsconfig.
The new models compiled, 18 new negative type assertions compiled as expected,
35 pure-model tests passed and 40 local projections were generated for inspection.
This is a subset preparation check, not a claim that the full repository or
actual RxJS suite passed locally. Direct Git cloning and package download
were unavailable in the container.

**Native RxJS tests, complete suite and committed-file drift validation are
not yet accepted.** GitHub Actions must execute the unchanged full check
command and a separate no-regeneration check. Exact tested commits and
retrieved run/job outcomes will replace this pending record before acceptance.
The runtime suite specifies 6,778 bounded model/native comparisons; this is
an intended test domain, not an executed success claim.
