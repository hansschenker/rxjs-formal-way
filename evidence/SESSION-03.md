# Session 3 — evidence ledger (pending validation)

31 October 2026, Europe/Zurich. Carryovers from the unfinished 30 October
reservation: `switchAll`, `mergeAll`, `concatAll`, `exhaustAll`,
`shareReplay`. The previously accepted ten operators are not regenerated.

## Provenance
- RxJS 7.8.2 at `e5351d02e225e275ac0e497c7b66eaa5f0c88791`.
- Sources inspected: four `*All` forwarding aliases, `shareReplay.ts`,
  `ReplaySubject.ts`, existing `mergeInternals.ts`, and `share.ts`.
- The four All profiles reuse the accepted flattening transducer and
  require identity-matched source-token returns. `shareReplay` composes
  reviewed share connection rules with an explicit replay buffer and clock.

## Validation status

Not yet accepted. GitHub Actions is the authoritative runtime environment
because direct GitHub clone and local dependency installation are unavailable
in the model container. Tests, type checks, generation, and drift checks
must be confirmed by retrieved job logs before any named operator is
marked accepted. An unexecuted test is not a pass.

The final acceptance record must identify exact implementation, generated
artifact, and read-only tested revision, plus run/job URLs, test counts and
remaining exclusions. The 30 October log is not retroactively closed;
the five carryovers are worked only in the 31 October session.
