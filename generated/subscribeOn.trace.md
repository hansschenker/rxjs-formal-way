# subscribeOn-virtualFIFO-delay-2: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S19-SUBSCRIBEON-SCHEDULE | {"type":"subscribe"} | {"phase":"Unsubscribed"} | schedule(subscription-action#0, delay=2) | {"phase":"Pending","deadline":2} |
| 1 | 2 | S19-SUBSCRIBEON-CONNECT | {"type":"timer.fire","resource":{"id":"subscription-action","generation":0},"now":2} | {"phase":"Pending","deadline":2} | subscribe(source#0) | {"phase":"Active"} |
| 2 | 2 | S19-SUBSCRIBEON-NEXT | {"type":"source.next","value":4} | {"phase":"Active"} | downstream.N(4) | {"phase":"Active"} |
| 3 | 3 | S19-SUBSCRIBEON-COMPLETE | {"type":"source.complete"} | {"phase":"Active"} | downstream.C(); unsubscribe(source#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 |
|---|---|---|---|---|
| Time | 0 | 2 | 2 | 3 |
| Input | {"type":"subscribe"} | {"type":"timer.fire","resource":{"id":"subscription-action","generation":0},"now":2} | {"type":"source.next","value":4} | {"type":"source.complete"} |
| Control / state | {"phase":"Pending","deadline":2} | {"phase":"Active"} | {"phase":"Active"} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | downstream.N(4) | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
