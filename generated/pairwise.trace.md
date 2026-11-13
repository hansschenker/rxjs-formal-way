# pairwise-reference: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | PAIRWISE-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Active","hasPrevious":false} |
| 1 | 1 | PAIRWISE-FIRST | {"type":"source.next","value":"a"} | {"phase":"Active","hasPrevious":false} |  | {"phase":"Active","hasPrevious":true,"previous":"a"} |
| 2 | 2 | PAIRWISE-NEXT | {"type":"source.next","value":"b"} | {"phase":"Active","hasPrevious":true,"previous":"a"} | downstream.N(["a","b"]) | {"phase":"Active","hasPrevious":true,"previous":"b"} |
| 3 | 3 | PAIRWISE-NEXT | {"type":"source.next","value":"c"} | {"phase":"Active","hasPrevious":true,"previous":"b"} | downstream.N(["b","c"]) | {"phase":"Active","hasPrevious":true,"previous":"c"} |
| 4 | 4 | PAIRWISE-COMPLETE | {"type":"source.complete"} | {"phase":"Active","hasPrevious":true,"previous":"c"} | downstream.C(); unsubscribe(source#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 |
|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 | 4 |
| Input | {"type":"subscribe"} | {"type":"source.next","value":"a"} | {"type":"source.next","value":"b"} | {"type":"source.next","value":"c"} | {"type":"source.complete"} |
| Control / state | {"phase":"Active","hasPrevious":false} | {"phase":"Active","hasPrevious":true,"previous":"a"} | {"phase":"Active","hasPrevious":true,"previous":"b"} | {"phase":"Active","hasPrevious":true,"previous":"c"} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | downstream.N(["a","b"]) | downstream.N(["b","c"]) | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
