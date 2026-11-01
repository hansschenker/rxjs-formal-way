# distinct-direct-flush: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|---|
| 0 | 0 | DISTINCT-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0); subscribe(flush#0) | {"phase":"Active","keys":[],"index":0,"flushOpen":true} |
| 1 | 1 | DISTINCT-DIRECT-PASS | {"type":"source.next","value":1} | {"phase":"Active","keys":[],"index":0,"flushOpen":true} | downstream.N(1) | {"phase":"Active","keys":[1],"index":1,"flushOpen":true} |
| 2 | 2 | DISTINCT-DIRECT-DROP | {"type":"source.next","value":1} | {"phase":"Active","keys":[1],"index":1,"flushOpen":true} |  | {"phase":"Active","keys":[1],"index":2,"flushOpen":true} |
| 3 | 3 | DISTINCT-DIRECT-PASS | {"type":"source.next","value":2} | {"phase":"Active","keys":[1],"index":2,"flushOpen":true} | downstream.N(2) | {"phase":"Active","keys":[1,2],"index":3,"flushOpen":true} |
| 4 | 4 | DISTINCT-FLUSH | {"type":"flush.next"} | {"phase":"Active","keys":[1,2],"index":3,"flushOpen":true} |  | {"phase":"Active","keys":[],"index":3,"flushOpen":true} |
| 5 | 5 | DISTINCT-DIRECT-PASS | {"type":"source.next","value":1} | {"phase":"Active","keys":[],"index":3,"flushOpen":true} | downstream.N(1) | {"phase":"Active","keys":[1],"index":4,"flushOpen":true} |
| 6 | 6 | DISTINCT-FLUSH-COMPLETE | {"type":"flush.complete"} | {"phase":"Active","keys":[1],"index":4,"flushOpen":true} | unsubscribe(flush#0) | {"phase":"Active","keys":[1],"index":4,"flushOpen":false} |
| 7 | 7 | DISTINCT-DIRECT-DROP | {"type":"source.next","value":1} | {"phase":"Active","keys":[1],"index":4,"flushOpen":false} |  | {"phase":"Active","keys":[1],"index":5,"flushOpen":false} |
| 8 | 8 | DISTINCT-COMPLETE | {"type":"source.complete"} | {"phase":"Active","keys":[1],"index":5,"flushOpen":false} | downstream.C(); unsubscribe(source#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 | step 7 | step 8 |
|---|---|---|---|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
| Input | {"type":"subscribe"} | {"type":"source.next","value":1} | {"type":"source.next","value":1} | {"type":"source.next","value":2} | {"type":"flush.next"} | {"type":"source.next","value":1} | {"type":"flush.complete"} | {"type":"source.next","value":1} | {"type":"source.complete"} |
| Control / state | {"phase":"Active","keys":[],"index":0,"flushOpen":true} | {"phase":"Active","keys":[1],"index":1,"flushOpen":true} | {"phase":"Active","keys":[1],"index":2,"flushOpen":true} | {"phase":"Active","keys":[1,2],"index":3,"flushOpen":true} | {"phase":"Active","keys":[],"index":3,"flushOpen":true} | {"phase":"Active","keys":[1],"index":4,"flushOpen":true} | {"phase":"Active","keys":[1],"index":4,"flushOpen":false} | {"phase":"Active","keys":[1],"index":5,"flushOpen":false} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | downstream.N(1) | none | downstream.N(2) | none | downstream.N(1) | none | none | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
