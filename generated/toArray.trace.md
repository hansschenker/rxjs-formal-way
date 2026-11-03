# toArray-plain: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|---|
| 0 | 0 | AGG-TOARRAY-PLAIN-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Collecting","index":0,"memory":{"present":true,"value":[]}} |
| 1 | 1 | AGG-TOARRAY-PLAIN-APPEND | {"type":"source.next","value":"a"} | {"phase":"Collecting","index":0,"memory":{"present":true,"value":[]}} |  | {"phase":"Collecting","index":1,"memory":{"present":true,"value":["a"]}} |
| 2 | 2 | AGG-TOARRAY-PLAIN-APPEND | {"type":"source.next","value":"b"} | {"phase":"Collecting","index":1,"memory":{"present":true,"value":["a"]}} |  | {"phase":"Collecting","index":2,"memory":{"present":true,"value":["a","b"]}} |
| 3 | 3 | AGG-TOARRAY-PLAIN-COMPLETE-SOME | {"type":"source.complete"} | {"phase":"Collecting","index":2,"memory":{"present":true,"value":["a","b"]}} | downstream.N(["a","b"]); downstream.C(); unsubscribe(source#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 |
|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 |
| Input | {"type":"subscribe"} | {"type":"source.next","value":"a"} | {"type":"source.next","value":"b"} | {"type":"source.complete"} |
| Control / state | {"phase":"Collecting","index":0,"memory":{"present":true,"value":[]}} | {"phase":"Collecting","index":1,"memory":{"present":true,"value":["a"]}} | {"phase":"Collecting","index":2,"memory":{"present":true,"value":["a","b"]}} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | none | downstream.N(["a","b"]); downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
