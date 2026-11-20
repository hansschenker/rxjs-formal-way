# zipAll-deferred-fifo-8-8: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S23-ZIPALL-START | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(outer#0) | {"phase":"Collecting","sources":[]} |
| 1 | 3 | S23-ZIPALL-OUTER-EMPTY | {"type":"outer.complete"} | {"phase":"Collecting","sources":[]} | downstream.C(); unsubscribe(outer#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 |
|---|---|---|
| Time | 0 | 3 |
| Input | {"type":"subscribe"} | {"type":"outer.complete"} |
| Control / state | {"phase":"Collecting","sources":[]} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
