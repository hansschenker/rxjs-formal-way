# skipLast-FIFO-2: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S19-SKIPLAST-START | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Active","pending":[],"seen":0} |
| 1 | 1 | S19-SKIPLAST-BUFFER | {"type":"source.next","value":"a"} | {"phase":"Active","pending":[],"seen":0} |  | {"phase":"Active","pending":["a"],"seen":1} |
| 2 | 2 | S19-SKIPLAST-BUFFER | {"type":"source.next","value":"b"} | {"phase":"Active","pending":["a"],"seen":1} |  | {"phase":"Active","pending":["a","b"],"seen":2} |
| 3 | 3 | S19-SKIPLAST-RELEASE-OLDEST | {"type":"source.next","value":"c"} | {"phase":"Active","pending":["a","b"],"seen":2} | downstream.N("a") | {"phase":"Active","pending":["b","c"],"seen":3} |
| 4 | 4 | S19-SKIPLAST-COMPLETE | {"type":"source.complete"} | {"phase":"Active","pending":["b","c"],"seen":3} | downstream.C(); unsubscribe(source#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 |
|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 | 4 |
| Input | {"type":"subscribe"} | {"type":"source.next","value":"a"} | {"type":"source.next","value":"b"} | {"type":"source.next","value":"c"} | {"type":"source.complete"} |
| Control / state | {"phase":"Active","pending":[],"seen":0} | {"phase":"Active","pending":["a"],"seen":1} | {"phase":"Active","pending":["a","b"],"seen":2} | {"phase":"Active","pending":["b","c"],"seen":3} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | none | downstream.N("a") | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
