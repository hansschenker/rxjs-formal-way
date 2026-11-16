# switchScan-latest-inner-seed: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | SWITCHSCAN-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed","accumulator":0} | subscribe(outer#0) | {"phase":"Active","index":0,"active":[],"queue":[],"accumulator":0} |
| 1 | 1 | SWITCHSCAN-ADMIT | {"type":"outer.next","value":1} | {"phase":"Active","index":0,"active":[],"queue":[],"accumulator":0} | invoke(accumulator#0, value={"accumulator":0,"value":1}, index=0) | {"phase":"Calling","resume":"Active","index":1,"active":[],"queue":[],"callId":0,"input":1,"accumulator":0} |
| 2 | 1 | SWITCHSCAN-RETURN-ACTIVE | {"type":"callback.return","resource":{"id":"accumulator","generation":0},"value":"a"} | {"phase":"Calling","resume":"Active","index":1,"active":[],"queue":[],"callId":0,"input":1,"accumulator":0} | subscribe(inner#0) | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"a"}],"queue":[],"accumulator":0} |
| 3 | 2 | SWITCHSCAN-NEXT-ACTIVE | {"type":"inner.next","resource":{"id":"inner","generation":0},"value":4} | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"a"}],"queue":[],"accumulator":0} | downstream.N(4) | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"a"}],"queue":[],"accumulator":4} |
| 4 | 3 | SWITCHSCAN-REPLACE | {"type":"outer.next","value":2} | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"a"}],"queue":[],"accumulator":4} | unsubscribe(inner#0); invoke(accumulator#1, value={"accumulator":4,"value":2}, index=1) | {"phase":"Calling","resume":"Active","index":2,"active":[],"queue":[],"callId":1,"input":2,"accumulator":4} |
| 5 | 3 | SWITCHSCAN-RETURN-ACTIVE | {"type":"callback.return","resource":{"id":"accumulator","generation":1},"value":"b"} | {"phase":"Calling","resume":"Active","index":2,"active":[],"queue":[],"callId":1,"input":2,"accumulator":4} | subscribe(inner#1) | {"phase":"Active","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"b"}],"queue":[],"accumulator":4} |
| 6 | 4 | SWITCHSCAN-OUTER-WAIT | {"type":"outer.complete"} | {"phase":"Active","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"b"}],"queue":[],"accumulator":4} | unsubscribe(outer#0) | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"b"}],"queue":[],"accumulator":4} |
| 7 | 5 | SWITCHSCAN-NEXT-DRAINING | {"type":"inner.next","resource":{"id":"inner","generation":1},"value":7} | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"b"}],"queue":[],"accumulator":4} | downstream.N(7) | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"b"}],"queue":[],"accumulator":7} |
| 8 | 6 | SWITCHSCAN-LAST-INNER | {"type":"inner.complete","resource":{"id":"inner","generation":1}} | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"b"}],"queue":[],"accumulator":7} | downstream.C(); unsubscribe(inner#1) | {"phase":"Closed","reason":"complete","accumulator":7} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 | step 7 | step 8 |
|---|---|---|---|---|---|---|---|---|---|
| Time | 0 | 1 | 1 | 2 | 3 | 3 | 4 | 5 | 6 |
| Input | {"type":"subscribe"} | {"type":"outer.next","value":1} | {"type":"callback.return","resource":{"id":"accumulator","generation":0},"value":"a"} | {"type":"inner.next","resource":{"id":"inner","generation":0},"value":4} | {"type":"outer.next","value":2} | {"type":"callback.return","resource":{"id":"accumulator","generation":1},"value":"b"} | {"type":"outer.complete"} | {"type":"inner.next","resource":{"id":"inner","generation":1},"value":7} | {"type":"inner.complete","resource":{"id":"inner","generation":1}} |
| Control / state | {"phase":"Active","index":0,"active":[],"queue":[],"accumulator":0} | {"phase":"Calling","resume":"Active","index":1,"active":[],"queue":[],"callId":0,"input":1,"accumulator":0} | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"a"}],"queue":[],"accumulator":0} | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"a"}],"queue":[],"accumulator":4} | {"phase":"Calling","resume":"Active","index":2,"active":[],"queue":[],"callId":1,"input":2,"accumulator":4} | {"phase":"Active","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"b"}],"queue":[],"accumulator":4} | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"b"}],"queue":[],"accumulator":4} | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"b"}],"queue":[],"accumulator":7} | {"phase":"Closed","reason":"complete","accumulator":7} |
| Output notifications | none | none | none | downstream.N(4) | none | none | none | downstream.N(7) | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
