# zipAll-deferred-fifo-8-8: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S23-ZIPALL-START | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(outer#0) | {"phase":"Collecting","sources":[]} |
| 1 | 1 | S23-ZIPALL-COLLECT | {"type":"outer.next","value":"letters"} | {"phase":"Collecting","sources":[]} |  | {"phase":"Collecting","sources":["letters"]} |
| 2 | 2 | S23-ZIPALL-COLLECT | {"type":"outer.next","value":"digits"} | {"phase":"Collecting","sources":["letters"]} |  | {"phase":"Collecting","sources":["letters","digits"]} |
| 3 | 3 | S23-ZIPALL-OUTER-JOIN | {"type":"outer.complete"} | {"phase":"Collecting","sources":["letters","digits"]} | subscribe(inner#0); subscribe(inner#1); unsubscribe(outer#0) | {"phase":"Joining","emitted":0,"slots":[{"source":"letters","queue":[],"live":true,"received":0},{"source":"digits","queue":[],"live":true,"received":0}]} |
| 4 | 4 | S23-ZIPALL-INNER-BUFFER | {"type":"inner.next","index":0,"value":"A"} | {"phase":"Joining","emitted":0,"slots":[{"source":"letters","queue":[],"live":true,"received":0},{"source":"digits","queue":[],"live":true,"received":0}]} |  | {"phase":"Joining","emitted":0,"slots":[{"source":"letters","queue":["A"],"live":true,"received":1},{"source":"digits","queue":[],"live":true,"received":0}]} |
| 5 | 5 | S23-ZIPALL-INNER-BUFFER | {"type":"inner.next","index":0,"value":"B"} | {"phase":"Joining","emitted":0,"slots":[{"source":"letters","queue":["A"],"live":true,"received":1},{"source":"digits","queue":[],"live":true,"received":0}]} |  | {"phase":"Joining","emitted":0,"slots":[{"source":"letters","queue":["A","B"],"live":true,"received":2},{"source":"digits","queue":[],"live":true,"received":0}]} |
| 6 | 6 | S23-ZIPALL-INNER-COMPLETE-BUFFERED | {"type":"inner.complete","index":0} | {"phase":"Joining","emitted":0,"slots":[{"source":"letters","queue":["A","B"],"live":true,"received":2},{"source":"digits","queue":[],"live":true,"received":0}]} | unsubscribe(inner#0) | {"phase":"Joining","emitted":0,"slots":[{"source":"letters","queue":["A","B"],"live":false,"received":2},{"source":"digits","queue":[],"live":true,"received":0}]} |
| 7 | 7 | S23-ZIPALL-INNER-EMIT | {"type":"inner.next","index":1,"value":"1"} | {"phase":"Joining","emitted":0,"slots":[{"source":"letters","queue":["A","B"],"live":false,"received":2},{"source":"digits","queue":[],"live":true,"received":0}]} | downstream.N(["A","1"]) | {"phase":"Joining","emitted":1,"slots":[{"source":"letters","queue":["B"],"live":false,"received":2},{"source":"digits","queue":[],"live":true,"received":1}]} |
| 8 | 8 | S23-ZIPALL-INNER-DRAIN | {"type":"inner.next","index":1,"value":"2"} | {"phase":"Joining","emitted":1,"slots":[{"source":"letters","queue":["B"],"live":false,"received":2},{"source":"digits","queue":[],"live":true,"received":1}]} | downstream.N(["B","2"]); unsubscribe(inner#1); downstream.C() | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 | step 7 | step 8 |
|---|---|---|---|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
| Input | {"type":"subscribe"} | {"type":"outer.next","value":"letters"} | {"type":"outer.next","value":"digits"} | {"type":"outer.complete"} | {"type":"inner.next","index":0,"value":"A"} | {"type":"inner.next","index":0,"value":"B"} | {"type":"inner.complete","index":0} | {"type":"inner.next","index":1,"value":"1"} | {"type":"inner.next","index":1,"value":"2"} |
| Control / state | {"phase":"Collecting","sources":[]} | {"phase":"Collecting","sources":["letters"]} | {"phase":"Collecting","sources":["letters","digits"]} | {"phase":"Joining","emitted":0,"slots":[{"source":"letters","queue":[],"live":true,"received":0},{"source":"digits","queue":[],"live":true,"received":0}]} | {"phase":"Joining","emitted":0,"slots":[{"source":"letters","queue":["A"],"live":true,"received":1},{"source":"digits","queue":[],"live":true,"received":0}]} | {"phase":"Joining","emitted":0,"slots":[{"source":"letters","queue":["A","B"],"live":true,"received":2},{"source":"digits","queue":[],"live":true,"received":0}]} | {"phase":"Joining","emitted":0,"slots":[{"source":"letters","queue":["A","B"],"live":false,"received":2},{"source":"digits","queue":[],"live":true,"received":0}]} | {"phase":"Joining","emitted":1,"slots":[{"source":"letters","queue":["B"],"live":false,"received":2},{"source":"digits","queue":[],"live":true,"received":1}]} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | none | none | none | none | none | downstream.N(["A","1"]) | downstream.N(["B","2"]); downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
