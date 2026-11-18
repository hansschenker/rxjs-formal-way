# takeLast-2: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S20-TAKELAST-START | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Collecting","buffer":[]} |
| 1 | 1 | S20-TAKELAST-APPEND | {"type":"source.next","value":"A"} | {"phase":"Collecting","buffer":[]} |  | {"phase":"Collecting","buffer":["A"]} |
| 2 | 2 | S20-TAKELAST-APPEND | {"type":"source.next","value":"B"} | {"phase":"Collecting","buffer":["A"]} |  | {"phase":"Collecting","buffer":["A","B"]} |
| 3 | 4 | S20-TAKELAST-REPLACE-OLDEST | {"type":"source.next","value":"C"} | {"phase":"Collecting","buffer":["A","B"]} |  | {"phase":"Collecting","buffer":["B","C"]} |
| 4 | 6 | S20-TAKELAST-COMPLETE-FLUSH | {"type":"source.complete"} | {"phase":"Collecting","buffer":["B","C"]} | downstream.N("B"); downstream.N("C"); downstream.C(); unsubscribe(source#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 |
|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 4 | 6 |
| Input | {"type":"subscribe"} | {"type":"source.next","value":"A"} | {"type":"source.next","value":"B"} | {"type":"source.next","value":"C"} | {"type":"source.complete"} |
| Control / state | {"phase":"Collecting","buffer":[]} | {"phase":"Collecting","buffer":["A"]} | {"phase":"Collecting","buffer":["A","B"]} | {"phase":"Collecting","buffer":["B","C"]} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | none | none | downstream.N("B"); downstream.N("C"); downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
