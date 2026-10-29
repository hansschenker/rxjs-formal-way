# Daily RxJS 7.8.2 operator generation plan

## Guardrails

- Consult the live default branch, `planning/operator-generation.json`, `docs/ROADMAP.md`, and `planning/sessions/YYYY-MM-DD.json` in Europe/Zurich before selecting work.
- **At most five distinct operator export names in one local-date session.** One session daily; a started or closed log blocks another start that day. Multiple profiles/overloads remain one name.
- Carry unfinished names ahead of untouched names. Never repeat accepted names merely to fill a batch or run a catch-up session.
- The accepted 2026-10-28 baseline is `take`, `map`, `filter`, `scan`, `debounceTime` (seeded and unseeded scan count once).
- Preserve pinned RxJS 7.8.2 source semantics and re-use the canonical schema, trace runner, renderer, and test infrastructure.
- For each operator: scope, Cω shape, six-tuple (S,S₀,Z,A,T,G), state-dependent behavioral constraints, named guarded TypeScript transition rules, BDD/STT/diagram/manifest/obligations/JSON trace/four-lane Markdown trace and operator prose. Compare model with **actual RxJS** tests including notifications, subscription lifetime, time and teardown.
- Inspect pinned source before modeling. Keep model-predicted traces distinct from actual RxJS observations. Do not call unexecuted checks passed; acceptance requires tested revision, retrieved CI outcome, exact generation drift check and recorded evidence.
- Push without force, preserving unrelated changes, and close each dated session with completed/carryover status. When the inventory is entirely accepted within explicit profiles, pause recurring work.

## Initial batch ordering

1. **2026-10-29**: `switchMap`, `mergeMap`, `concatMap`, `exhaustMap`, `share` (M02-D/M02-E reference checkpoints).
2. `switchAll`, `mergeAll`, `concatAll`, `exhaustAll`, `shareReplay`.
3. `distinctUntilChanged`, `distinctUntilKeyChanged`, `distinct`, `pairwise`, `startWith`.
4. `skip`, `takeWhile`, `skipWhile`, `takeUntil`, `skipUntil`.
5. `reduce`, `count`, `toArray`, `min`, `max`.

After these batches, follow the original export order from the pinned `src/operators/index.ts`, retaining separate exported aliases unless deliberately documented and tested as an alias profile. The JSON queue, not this illustrative listing, is authoritative.

## Completion record

Each dated session reports names actually worked on, completed names, unfinished carryovers, associated commits, named tests, bounded scenario counts, status of syntax/type/model/runtime/generation checks, retrieved CI run/job and gaps. One partial verified model is preferable to five unchecked prose pages.
