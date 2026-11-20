# zipAll-deferred-fifo-8-8: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S23-ZIPALL-START | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(outer#0) | {"phase":"Collecting","sources":[]} |
| 1 | 1 | S23-ZIPALL-COLLECT | {"type":"outer.next","value":"left"} | {"phase":"Collecting","sources":[]} |  | {"phase":"Collecting","sources":["left"]} |
| 2 | 2 | S23-ZIPALL-COLLECT | {"type":"outer.next","value":"right"} | {"phase":"Collecting","sources":["left"]} |  | {"phase":"Collecting","sources":["left","right"]} |
| 3 | 3 | S23-ZIPALL-OUTER-JOIN | {"type":"outer.complete"} | {"phase":"Collecting","sources":["left","right"]} | subscribe(inner#0); subscribe(inner#1); unsubscribe(outer#0) | {"phase":"Joining","emitted":0,"slots":[{"source":"left","queue":[],"live":true,"received":0},{"source":"right","queue":[],"live":true,"received":0}]} |
| 4 | 4 | S23-ZIPALL-INNER-BUFFER | {"type":"inner.next","index":0,"value":"unmatched"} | {"phase":"Joining","emitted":0,"slots":[{"source":"left","queue":[],"live":true,"received":0},{"source":"right","queue":[],"live":true,"received":0}]} |  | {"phase":"Joining","emitted":0,"slots":[{"source":"left","queue":["unmatched"],"live":true,"received":1},{"source":"right","queue":[],"live":true,"received":0}]} |
| 5 | 5 | S23-ZIPALL-CANCEL-JOIN | {"type":"cancel"} | {"phase":"Joining","emitted":0,"slots":[{"source":"left","queue":["unmatched"],"live":true,"received":1},{"source":"right","queue":[],"live":true,"received":0}]} | unsubscribe(inner#0); unsubscribe(inner#1) | {"phase":"Closed","reason":"cancel"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 |
|---|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 | 4 | 5 |
| Input | {"type":"subscribe"} | {"type":"outer.next","value":"left"} | {"type":"outer.next","value":"right"} | {"type":"outer.complete"} | {"type":"inner.next","index":0,"value":"unmatched"} | {"type":"cancel"} |
| Control / state | {"phase":"Collecting","sources":[]} | {"phase":"Collecting","sources":["left"]} | {"phase":"Collecting","sources":["left","right"]} | {"phase":"Joining","emitted":0,"slots":[{"source":"left","queue":[],"live":true,"received":0},{"source":"right","queue":[],"live":true,"received":0}]} | {"phase":"Joining","emitted":0,"slots":[{"source":"left","queue":["unmatched"],"live":true,"received":1},{"source":"right","queue":[],"live":true,"received":0}]} | {"phase":"Closed","reason":"cancel"} |
| Output notifications | none | none | none | none | none | none |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
