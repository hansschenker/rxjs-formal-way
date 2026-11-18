# takeLast-0: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S20-TAKELAST-START-EMPTY | {"type":"subscribe"} | {"phase":"Unsubscribed"} | downstream.C() | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 |
|---|---|
| Time | 0 |
| Input | {"type":"subscribe"} |
| Control / state | {"phase":"Closed","reason":"complete"} |
| Output notifications | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
