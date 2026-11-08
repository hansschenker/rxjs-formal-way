# endWith-unscheduled-2: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|---|
| 0 | 0 | ENDWITH-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Active"} |
| 1 | 1 | ENDWITH-PASS | {"type":"source.next","value":1} | {"phase":"Active"} | downstream.N(1) | {"phase":"Active"} |
| 2 | 2 | ENDWITH-SUFFIX-BEGIN | {"type":"source.complete"} | {"phase":"Active"} | unsubscribe(source#0) | {"phase":"Suffix","index":0} |
| 3 | 2 | ENDWITH-SUFFIX-NEXT | {"type":"suffix.next"} | {"phase":"Suffix","index":0} | downstream.N("suffix-one") | {"phase":"Suffix","index":1} |
| 4 | 2 | ENDWITH-SUFFIX-NEXT | {"type":"suffix.next"} | {"phase":"Suffix","index":1} | downstream.N("suffix-two") | {"phase":"Suffix","index":2} |
| 5 | 2 | ENDWITH-SUFFIX-COMPLETE | {"type":"suffix.complete"} | {"phase":"Suffix","index":2} | downstream.C() | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 |
|---|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 2 | 2 | 2 |
| Input | {"type":"subscribe"} | {"type":"source.next","value":1} | {"type":"source.complete"} | {"type":"suffix.next"} | {"type":"suffix.next"} | {"type":"suffix.complete"} |
| Control / state | {"phase":"Active"} | {"phase":"Active"} | {"phase":"Suffix","index":0} | {"phase":"Suffix","index":1} | {"phase":"Suffix","index":2} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | downstream.N(1) | none | downstream.N("suffix-one") | downstream.N("suffix-two") | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
