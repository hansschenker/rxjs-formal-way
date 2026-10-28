# scan-seeded-accumulator: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|---|
| 0 | 0 | SCAN-INIT-SEEDED | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Active","accumulator":0,"index":0} |
| 1 | 10 | SCAN-CALL | {"type":"source.next","value":1} | {"phase":"Active","accumulator":0,"index":0} | invoke(accumulator#0, value={"accumulator":0,"value":1}, index=0) | {"phase":"Calling","accumulator":0,"input":1,"callId":0,"index":1} |
| 2 | 10 | SCAN-RETURN | {"type":"callback.return","resource":{"id":"accumulator","generation":0},"value":1} | {"phase":"Calling","accumulator":0,"input":1,"callId":0,"index":1} | downstream.N(1) | {"phase":"Active","accumulator":1,"index":1} |
| 3 | 20 | SCAN-CALL | {"type":"source.next","value":2} | {"phase":"Active","accumulator":1,"index":1} | invoke(accumulator#1, value={"accumulator":1,"value":2}, index=1) | {"phase":"Calling","accumulator":1,"input":2,"callId":1,"index":2} |
| 4 | 20 | SCAN-RETURN | {"type":"callback.return","resource":{"id":"accumulator","generation":1},"value":3} | {"phase":"Calling","accumulator":1,"input":2,"callId":1,"index":2} | downstream.N(3) | {"phase":"Active","accumulator":3,"index":2} |
| 5 | 30 | SCAN-ACTIVE-COMPLETE | {"type":"source.complete"} | {"phase":"Active","accumulator":3,"index":2} | downstream.C(); unsubscribe(source#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 |
|---|---|---|---|---|---|---|
| Time | 0 | 10 | 10 | 20 | 20 | 30 |
| Input | {"type":"subscribe"} | {"type":"source.next","value":1} | {"type":"callback.return","resource":{"id":"accumulator","generation":0},"value":1} | {"type":"source.next","value":2} | {"type":"callback.return","resource":{"id":"accumulator","generation":1},"value":3} | {"type":"source.complete"} |
| Control / state | {"phase":"Active","accumulator":0,"index":0} | {"phase":"Calling","accumulator":0,"input":1,"callId":0,"index":1} | {"phase":"Active","accumulator":1,"index":1} | {"phase":"Calling","accumulator":1,"input":2,"callId":1,"index":2} | {"phase":"Active","accumulator":3,"index":2} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | downstream.N(1) | none | downstream.N(3) | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
