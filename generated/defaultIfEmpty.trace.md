# defaultIfEmpty-opaque-fallback: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|---|
| 0 | 0 | DEFAULTIFEMPTY-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Active","hasValue":false} |
| 1 | 3 | DEFAULTIFEMPTY-EMPTY | {"type":"source.complete"} | {"phase":"Active","hasValue":false} | downstream.N("fallback"); downstream.C(); unsubscribe(source#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 |
|---|---|---|
| Time | 0 | 3 |
| Input | {"type":"subscribe"} | {"type":"source.complete"} |
| Control / state | {"phase":"Active","hasValue":false} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | downstream.N("fallback"); downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
