# connect-default-Subject-merge-two: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|---|
| 0 | 0 | CONNECT-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | invoke(selector#0, value=undefined, index=0) | {"phase":"Preparing"} |
| 1 | 0 | CONNECT-SELECTOR-READY | {"type":"selector.return","resource":{"id":"selector","generation":0}} | {"phase":"Preparing"} | subscribe(selected#0); subscribe(source#0) | {"phase":"Active"} |
| 2 | 1 | CONNECT-BROADCAST | {"type":"source.next","value":1} | {"phase":"Active"} | downstream.N(1); downstream.N(1) | {"phase":"Active"} |
| 3 | 2 | CONNECT-BROADCAST | {"type":"source.next","value":2} | {"phase":"Active"} | downstream.N(2); downstream.N(2) | {"phase":"Active"} |
| 4 | 3 | CONNECT-COMPLETE | {"type":"source.complete"} | {"phase":"Active"} | downstream.C(); unsubscribe(selected#0); unsubscribe(source#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 |
|---|---|---|---|---|---|
| Time | 0 | 0 | 1 | 2 | 3 |
| Input | {"type":"subscribe"} | {"type":"selector.return","resource":{"id":"selector","generation":0}} | {"type":"source.next","value":1} | {"type":"source.next","value":2} | {"type":"source.complete"} |
| Control / state | {"phase":"Preparing"} | {"phase":"Active"} | {"phase":"Active"} | {"phase":"Active"} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | downstream.N(1); downstream.N(1) | downstream.N(2); downstream.N(2) | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
