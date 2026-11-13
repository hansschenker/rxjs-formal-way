# distinctUntilKeyChanged-property-strict: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | DISTINCTUNTILKEYCHANGED-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Active","index":0,"hasPrevious":false} |
| 1 | 1 | DISTINCTUNTILKEYCHANGED-SELECT | {"type":"source.next","value":{"code":"a"}} | {"phase":"Active","index":0,"hasPrevious":false} | invoke(key#0, value={"code":"a"}, index=0) | {"phase":"Selecting","index":1,"callId":0,"input":{"code":"a"},"hasPrevious":false} |
| 2 | 1 | DISTINCTUNTILKEYCHANGED-FIRST | {"type":"key.return","resource":{"id":"key","generation":0},"value":"a"} | {"phase":"Selecting","index":1,"callId":0,"input":{"code":"a"},"hasPrevious":false} | downstream.N({"code":"a"}) | {"phase":"Active","index":1,"hasPrevious":true,"previousKey":"a"} |
| 3 | 2 | DISTINCTUNTILKEYCHANGED-SELECT | {"type":"source.next","value":{"code":"a"}} | {"phase":"Active","index":1,"hasPrevious":true,"previousKey":"a"} | invoke(key#1, value={"code":"a"}, index=1) | {"phase":"Selecting","index":2,"callId":1,"input":{"code":"a"},"hasPrevious":true,"previousKey":"a"} |
| 4 | 2 | DISTINCTUNTILKEYCHANGED-COMPARE | {"type":"key.return","resource":{"id":"key","generation":1},"value":"a"} | {"phase":"Selecting","index":2,"callId":1,"input":{"code":"a"},"hasPrevious":true,"previousKey":"a"} | invoke(compare#1, value={"previous":"a","current":"a"}, index=1) | {"phase":"Comparing","index":2,"callId":1,"input":{"code":"a"},"previousKey":"a","key":"a"} |
| 5 | 2 | DISTINCTUNTILKEYCHANGED-SAME | {"type":"compare.return","resource":{"id":"compare","generation":1},"same":true} | {"phase":"Comparing","index":2,"callId":1,"input":{"code":"a"},"previousKey":"a","key":"a"} |  | {"phase":"Active","index":2,"hasPrevious":true,"previousKey":"a"} |
| 6 | 3 | DISTINCTUNTILKEYCHANGED-SELECT | {"type":"source.next","value":{"code":"b"}} | {"phase":"Active","index":2,"hasPrevious":true,"previousKey":"a"} | invoke(key#2, value={"code":"b"}, index=2) | {"phase":"Selecting","index":3,"callId":2,"input":{"code":"b"},"hasPrevious":true,"previousKey":"a"} |
| 7 | 3 | DISTINCTUNTILKEYCHANGED-COMPARE | {"type":"key.return","resource":{"id":"key","generation":2},"value":"b"} | {"phase":"Selecting","index":3,"callId":2,"input":{"code":"b"},"hasPrevious":true,"previousKey":"a"} | invoke(compare#2, value={"previous":"a","current":"b"}, index=2) | {"phase":"Comparing","index":3,"callId":2,"input":{"code":"b"},"previousKey":"a","key":"b"} |
| 8 | 3 | DISTINCTUNTILKEYCHANGED-CHANGE | {"type":"compare.return","resource":{"id":"compare","generation":2},"same":false} | {"phase":"Comparing","index":3,"callId":2,"input":{"code":"b"},"previousKey":"a","key":"b"} | downstream.N({"code":"b"}) | {"phase":"Active","index":3,"hasPrevious":true,"previousKey":"b"} |
| 9 | 4 | DISTINCTUNTILKEYCHANGED-COMPLETE | {"type":"source.complete"} | {"phase":"Active","index":3,"hasPrevious":true,"previousKey":"b"} | downstream.C(); unsubscribe(source#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 | step 7 | step 8 | step 9 |
|---|---|---|---|---|---|---|---|---|---|---|
| Time | 0 | 1 | 1 | 2 | 2 | 2 | 3 | 3 | 3 | 4 |
| Input | {"type":"subscribe"} | {"type":"source.next","value":{"code":"a"}} | {"type":"key.return","resource":{"id":"key","generation":0},"value":"a"} | {"type":"source.next","value":{"code":"a"}} | {"type":"key.return","resource":{"id":"key","generation":1},"value":"a"} | {"type":"compare.return","resource":{"id":"compare","generation":1},"same":true} | {"type":"source.next","value":{"code":"b"}} | {"type":"key.return","resource":{"id":"key","generation":2},"value":"b"} | {"type":"compare.return","resource":{"id":"compare","generation":2},"same":false} | {"type":"source.complete"} |
| Control / state | {"phase":"Active","index":0,"hasPrevious":false} | {"phase":"Selecting","index":1,"callId":0,"input":{"code":"a"},"hasPrevious":false} | {"phase":"Active","index":1,"hasPrevious":true,"previousKey":"a"} | {"phase":"Selecting","index":2,"callId":1,"input":{"code":"a"},"hasPrevious":true,"previousKey":"a"} | {"phase":"Comparing","index":2,"callId":1,"input":{"code":"a"},"previousKey":"a","key":"a"} | {"phase":"Active","index":2,"hasPrevious":true,"previousKey":"a"} | {"phase":"Selecting","index":3,"callId":2,"input":{"code":"b"},"hasPrevious":true,"previousKey":"a"} | {"phase":"Comparing","index":3,"callId":2,"input":{"code":"b"},"previousKey":"a","key":"b"} | {"phase":"Active","index":3,"hasPrevious":true,"previousKey":"b"} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | downstream.N({"code":"a"}) | none | none | none | none | none | downstream.N({"code":"b"}) | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
