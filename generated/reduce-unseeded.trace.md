# reduce-unseeded: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|---|
| 0 | 0 | AGG-REDUCE-UNSEEDED-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Collecting","index":0,"memory":{"present":false}} |
| 1 | 1 | AGG-REDUCE-UNSEEDED-FIRST | {"type":"source.next","value":2} | {"phase":"Collecting","index":0,"memory":{"present":false}} |  | {"phase":"Collecting","index":1,"memory":{"present":true,"value":2}} |
| 2 | 2 | AGG-REDUCE-UNSEEDED-CALL | {"type":"source.next","value":3} | {"phase":"Collecting","index":1,"memory":{"present":true,"value":2}} | invoke(aggregate-callback#1, value={"previous":2,"incoming":3}, index=1) | {"phase":"Calling","index":2,"callId":1,"memory":{"present":true,"value":2},"input":3} |
| 3 | 2 | AGG-REDUCE-UNSEEDED-RETURN | {"type":"callback.return","resource":{"id":"aggregate-callback","generation":1},"value":5} | {"phase":"Calling","index":2,"callId":1,"memory":{"present":true,"value":2},"input":3} |  | {"phase":"Collecting","index":2,"memory":{"present":true,"value":5}} |
| 4 | 3 | AGG-REDUCE-UNSEEDED-COMPLETE-SOME | {"type":"source.complete"} | {"phase":"Collecting","index":2,"memory":{"present":true,"value":5}} | downstream.N(5); downstream.C(); unsubscribe(source#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 |
|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 2 | 3 |
| Input | {"type":"subscribe"} | {"type":"source.next","value":2} | {"type":"source.next","value":3} | {"type":"callback.return","resource":{"id":"aggregate-callback","generation":1},"value":5} | {"type":"source.complete"} |
| Control / state | {"phase":"Collecting","index":0,"memory":{"present":false}} | {"phase":"Collecting","index":1,"memory":{"present":true,"value":2}} | {"phase":"Calling","index":2,"callId":1,"memory":{"present":true,"value":2},"input":3} | {"phase":"Collecting","index":2,"memory":{"present":true,"value":5}} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | none | none | downstream.N(5); downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
