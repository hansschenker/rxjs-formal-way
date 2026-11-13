# distinctUntilChanged-identity-strict: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | DISTINCTUNTILCHANGED-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Active","index":0,"hasPrevious":false} |
| 1 | 1 | DISTINCTUNTILCHANGED-SELECT | {"type":"source.next","value":1} | {"phase":"Active","index":0,"hasPrevious":false} | invoke(key#0, value=1, index=0) | {"phase":"Selecting","index":1,"callId":0,"input":1,"hasPrevious":false} |
| 2 | 1 | DISTINCTUNTILCHANGED-FIRST | {"type":"key.return","resource":{"id":"key","generation":0},"value":1} | {"phase":"Selecting","index":1,"callId":0,"input":1,"hasPrevious":false} | downstream.N(1) | {"phase":"Active","index":1,"hasPrevious":true,"previousKey":1} |
| 3 | 2 | DISTINCTUNTILCHANGED-SELECT | {"type":"source.next","value":1} | {"phase":"Active","index":1,"hasPrevious":true,"previousKey":1} | invoke(key#1, value=1, index=1) | {"phase":"Selecting","index":2,"callId":1,"input":1,"hasPrevious":true,"previousKey":1} |
| 4 | 2 | DISTINCTUNTILCHANGED-COMPARE | {"type":"key.return","resource":{"id":"key","generation":1},"value":1} | {"phase":"Selecting","index":2,"callId":1,"input":1,"hasPrevious":true,"previousKey":1} | invoke(compare#1, value={"previous":1,"current":1}, index=1) | {"phase":"Comparing","index":2,"callId":1,"input":1,"previousKey":1,"key":1} |
| 5 | 2 | DISTINCTUNTILCHANGED-SAME | {"type":"compare.return","resource":{"id":"compare","generation":1},"same":true} | {"phase":"Comparing","index":2,"callId":1,"input":1,"previousKey":1,"key":1} |  | {"phase":"Active","index":2,"hasPrevious":true,"previousKey":1} |
| 6 | 3 | DISTINCTUNTILCHANGED-SELECT | {"type":"source.next","value":2} | {"phase":"Active","index":2,"hasPrevious":true,"previousKey":1} | invoke(key#2, value=2, index=2) | {"phase":"Selecting","index":3,"callId":2,"input":2,"hasPrevious":true,"previousKey":1} |
| 7 | 3 | DISTINCTUNTILCHANGED-COMPARE | {"type":"key.return","resource":{"id":"key","generation":2},"value":2} | {"phase":"Selecting","index":3,"callId":2,"input":2,"hasPrevious":true,"previousKey":1} | invoke(compare#2, value={"previous":1,"current":2}, index=2) | {"phase":"Comparing","index":3,"callId":2,"input":2,"previousKey":1,"key":2} |
| 8 | 3 | DISTINCTUNTILCHANGED-CHANGE | {"type":"compare.return","resource":{"id":"compare","generation":2},"same":false} | {"phase":"Comparing","index":3,"callId":2,"input":2,"previousKey":1,"key":2} | downstream.N(2) | {"phase":"Active","index":3,"hasPrevious":true,"previousKey":2} |
| 9 | 4 | DISTINCTUNTILCHANGED-COMPLETE | {"type":"source.complete"} | {"phase":"Active","index":3,"hasPrevious":true,"previousKey":2} | downstream.C(); unsubscribe(source#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 | step 7 | step 8 | step 9 |
|---|---|---|---|---|---|---|---|---|---|---|
| Time | 0 | 1 | 1 | 2 | 2 | 2 | 3 | 3 | 3 | 4 |
| Input | {"type":"subscribe"} | {"type":"source.next","value":1} | {"type":"key.return","resource":{"id":"key","generation":0},"value":1} | {"type":"source.next","value":1} | {"type":"key.return","resource":{"id":"key","generation":1},"value":1} | {"type":"compare.return","resource":{"id":"compare","generation":1},"same":true} | {"type":"source.next","value":2} | {"type":"key.return","resource":{"id":"key","generation":2},"value":2} | {"type":"compare.return","resource":{"id":"compare","generation":2},"same":false} | {"type":"source.complete"} |
| Control / state | {"phase":"Active","index":0,"hasPrevious":false} | {"phase":"Selecting","index":1,"callId":0,"input":1,"hasPrevious":false} | {"phase":"Active","index":1,"hasPrevious":true,"previousKey":1} | {"phase":"Selecting","index":2,"callId":1,"input":1,"hasPrevious":true,"previousKey":1} | {"phase":"Comparing","index":2,"callId":1,"input":1,"previousKey":1,"key":1} | {"phase":"Active","index":2,"hasPrevious":true,"previousKey":1} | {"phase":"Selecting","index":3,"callId":2,"input":2,"hasPrevious":true,"previousKey":1} | {"phase":"Comparing","index":3,"callId":2,"input":2,"previousKey":1,"key":2} | {"phase":"Active","index":3,"hasPrevious":true,"previousKey":2} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | downstream.N(1) | none | none | none | none | none | downstream.N(2) | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
