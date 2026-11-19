# Session 22 — Count windows and pending window/auxiliary join exports

**Date:** Thursday, 19 November 2026, Europe/Zurich. **Session:** started; do not mark any operator accepted until exact CI and committed read-only generation verification are retrieved.

[Daily reservation](../planning/sessions/2026-11-19.json) fixes the only five eligible names: `windowCount`, `windowTime`, `windowToggle`, `windowWhen`, `withLatestFrom`. Entry inventory: 105 of 113 accepted, 8 pending. The next untouched exports are `zip`, `zipAll`, `zipWith`.

## Pinned source inspected

All five source implementation bodies were read at revision `e5351d02e225e275ac0e497c7b66eaa5f0c88791`, RxJS 7.8.2. Their distinct policies are:

| Export | Source-grounded behavior | Session 22 status |
|---|---|---|
| [`windowCount`](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/windowCount.ts) | Initial handle before source connection; source-count overlap/gaps; closure before next handle; orphan Subjects on cancel | [Guarded model](../src/models/session22-windowCount.ts), [model tests](../tests/session22-windowCount-model.test.mjs), [independent native tests](../tests/session22-windowCount-rxjs.test.mjs), [guide](../docs/SESSION-22-COUNT-WINDOWS.md); CI and generated views not yet recorded |
| [`windowTime`](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/windowTime.ts) | Scheduled window creation/deadlines, overlap, max-size closures, restart-on-close | Pending formal model |
| [`windowToggle`](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/windowToggle.ts) | Opening signal and per-window closing subscription; overlapping Subjects | Pending formal model |
| [`windowWhen`](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/windowWhen.ts) | Fresh closing notifier for every successive nonoverlapping window; next or complete rotates | Pending formal model |
| [`withLatestFrom`](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/withLatestFrom.ts) | Subscribes auxiliary inputs before source; source-only emission gated by all auxiliaries being ready; optional projector | Pending formal model |

## Count-window implementation work

`windowCount` has a named pure Mealy transition system with source and child-observer events, guarded legal-state constraints, three demonstration traces, Cω signature, time/sharing/teardown policies, strict TS negative assertions, and independent native RxJS observational tests. It reuses schema, runner, renderer and the existing generator. Each configured history is intended to produce eight deterministic projections; the export-level index is the additional required ninth group artifact (25 new files total for this one export).

No unexecuted test, syntax, type, generation drift or CI check is represented as passed here. Exact commits and retrieved run/job results will be added after execution. No sixth operator or second date session may be started.

## Scope and outstanding acceptance gates

The canonical `windowCount` model explicitly excludes invalid numeric arguments, arbitrary reentrancy, setup-time immediate source notifications, Subject implementation mutation and universal equivalence. **Outstanding:** execute syntax, strict TypeScript, model/native runtime tests, regenerate and commit 25 projections, verify exact drift read-only, retrieve tested revision and CI conclusions, then update tracker and dated session closure. All other selected exports remain incomplete until their own full acceptance evidence is available.

The initial five-export queue shall not be replaced by `zip` variants until these carryovers are resolved on subsequent days.
