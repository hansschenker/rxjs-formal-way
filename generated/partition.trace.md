# partition-two-independent-branch-subscriptions: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S15-PARTITION-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0); subscribe(source#1) | {"phase":"Active","pass":{"status":"live","index":0,"pending":null},"fail":{"status":"live","index":0,"pending":null}} |
| 1 | 1 | S15-PARTITION-PREDICATE-REQUEST | {"type":"source.next","branch":"pass","value":2} | {"phase":"Active","pass":{"status":"live","index":0,"pending":null},"fail":{"status":"live","index":0,"pending":null}} | invoke(predicate-pass#0, value=2, index=0) | {"phase":"Active","pass":{"status":"live","index":1,"pending":{"index":0,"value":2}},"fail":{"status":"live","index":0,"pending":null}} |
| 2 | 1 | S15-PARTITION-PREDICATE-RETURN | {"type":"predicate.return","resource":{"id":"predicate-pass","generation":0},"result":true} | {"phase":"Active","pass":{"status":"live","index":1,"pending":{"index":0,"value":2}},"fail":{"status":"live","index":0,"pending":null}} | pass.N(2) | {"phase":"Active","pass":{"status":"live","index":1,"pending":null},"fail":{"status":"live","index":0,"pending":null}} |
| 3 | 2 | S15-PARTITION-PREDICATE-REQUEST | {"type":"source.next","branch":"fail","value":3} | {"phase":"Active","pass":{"status":"live","index":1,"pending":null},"fail":{"status":"live","index":0,"pending":null}} | invoke(predicate-fail#0, value=3, index=0) | {"phase":"Active","pass":{"status":"live","index":1,"pending":null},"fail":{"status":"live","index":1,"pending":{"index":0,"value":3}}} |
| 4 | 2 | S15-PARTITION-PREDICATE-RETURN | {"type":"predicate.return","resource":{"id":"predicate-fail","generation":0},"result":false} | {"phase":"Active","pass":{"status":"live","index":1,"pending":null},"fail":{"status":"live","index":1,"pending":{"index":0,"value":3}}} | fail.N(3) | {"phase":"Active","pass":{"status":"live","index":1,"pending":null},"fail":{"status":"live","index":1,"pending":null}} |
| 5 | 3 | S15-PARTITION-SOURCE-COMPLETE-PASS-WAIT | {"type":"source.complete","branch":"pass"} | {"phase":"Active","pass":{"status":"live","index":1,"pending":null},"fail":{"status":"live","index":1,"pending":null}} | pass.C(); unsubscribe(source#0) | {"phase":"Active","pass":{"status":"closed","index":1,"pending":null},"fail":{"status":"live","index":1,"pending":null}} |
| 6 | 4 | S15-PARTITION-SOURCE-COMPLETE-FAIL-LAST | {"type":"source.complete","branch":"fail"} | {"phase":"Active","pass":{"status":"closed","index":1,"pending":null},"fail":{"status":"live","index":1,"pending":null}} | fail.C(); unsubscribe(source#1) | {"phase":"Closed","reason":"both-closed"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 |
|---|---|---|---|---|---|---|---|
| Time | 0 | 1 | 1 | 2 | 2 | 3 | 4 |
| Input | {"type":"subscribe"} | {"type":"source.next","branch":"pass","value":2} | {"type":"predicate.return","resource":{"id":"predicate-pass","generation":0},"result":true} | {"type":"source.next","branch":"fail","value":3} | {"type":"predicate.return","resource":{"id":"predicate-fail","generation":0},"result":false} | {"type":"source.complete","branch":"pass"} | {"type":"source.complete","branch":"fail"} |
| Control / state | {"phase":"Active","pass":{"status":"live","index":0,"pending":null},"fail":{"status":"live","index":0,"pending":null}} | {"phase":"Active","pass":{"status":"live","index":1,"pending":{"index":0,"value":2}},"fail":{"status":"live","index":0,"pending":null}} | {"phase":"Active","pass":{"status":"live","index":1,"pending":null},"fail":{"status":"live","index":0,"pending":null}} | {"phase":"Active","pass":{"status":"live","index":1,"pending":null},"fail":{"status":"live","index":1,"pending":{"index":0,"value":3}}} | {"phase":"Active","pass":{"status":"live","index":1,"pending":null},"fail":{"status":"live","index":1,"pending":null}} | {"phase":"Active","pass":{"status":"closed","index":1,"pending":null},"fail":{"status":"live","index":1,"pending":null}} | {"phase":"Closed","reason":"both-closed"} |
| Output notifications | none | none | pass.N(2) | none | fail.N(3) | pass.C() | fail.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
