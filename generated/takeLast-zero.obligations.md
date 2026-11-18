# takeLast-0: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session20-rxjs.test.mjs, tests/session20-differential.test.mjs.

## S20-TAKELAST-START-EMPTY

Reach **Unsubscribed** with **configured count is nonpositive**, then provide **subscribe**.

Expect, in order: complete result without acquiring source.

Resulting state: Closed complete; no source was subscribed.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-TAKELAST-START-EMPTY.
