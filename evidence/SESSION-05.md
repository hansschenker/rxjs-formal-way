# Session 5 — push validation passed; read-only verification pending

Selected on **2 November 2026 Europe/Zurich**: `skip`, `takeWhile`,
`skipWhile`, `takeUntil`, `skipUntil`. No sixth export was selected.
The live baseline was `d8a7f07de80408714fe8a91df67b5f39bc5e6e57`.

Source inspection uses RxJS 7.8.2 at `e5351d02e225e275ac0e497c7b66eaa5f0c88791`.
See [the guide](../docs/SESSION-05-GATING.md) for six-tuples, value shapes,
state-dependent legal behavior, sources, time/cancellation/sharing and limits.

## Executed push validation

Implementation commit: `e0dd8aa2f04c766827fb1dabbb22d9ed1dcefaac`.
[Run 41396195583](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41396195583),
job `125117935553`, succeeded. Its retrieved log confirms dependency
installation, generation, syntax, strict types, compilation, model and native
RxJS tests, and deterministic generation checks.

```text
# tests 631
# pass 631
# fail 0
# cancelled 0
# skipped 0
Session 5: 5784 unary + 994 notifier = 6778 bounded model/RxJS comparisons.
Verified 208 deterministic projections.
```

There are 35 new pure-model tests, 35 new actual RxJS cases and 18 new
negative type assertions. The previous 561 tests and 168 views were retained.
The workflow committed the forty new generated files; the live generated
commit is `7a8cd7cf8ce68eb9d590b340252461b994fc9ffa`.

## Read-only verification requirement

This documentation-only verification change starts the existing pull-request
workflow on the already committed projections. It must skip generation and
publication, then execute `npm run check` without changing any model, test,
dependency, workflow or generated file. **Final acceptance remains pending
that run and its retrieved exact checkout and job log.**

Local preparation used Node 22.16.0 and TypeScript 5.8.3, with byte-identical
copies of the repository schema, runner, renderer and strict tsconfig.
The new models compiled, eighteen new negative assertions were checked,
thirty-five pure-model tests passed, and forty isolated projections were
inspected. Direct Git cloning and package download were unavailable locally;
no full-suite or actual RxJS success is claimed for the local container.
The successful full execution above occurred in GitHub Actions.
