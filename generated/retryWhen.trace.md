# retryWhen-persistent-errors-notifier: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S18-RETRYWHEN-START | {"type":"subscribe"} | {"phase":"Unsubscribed","generation":0,"notifier":"absent","reason":"none"} | subscribe(source#0) | {"phase":"Active","generation":0,"notifier":"absent","reason":"none"} |
| 1 | 1 | S18-RETRYWHEN-FORWARD | {"type":"source.next","resource":{"id":"source","generation":0},"value":"first"} | {"phase":"Active","generation":0,"notifier":"absent","reason":"none"} | downstream.N("first") | {"phase":"Active","generation":0,"notifier":"absent","reason":"none"} |
| 2 | 2 | S18-RETRYWHEN-FIRST-ERROR | {"type":"source.error","resource":{"id":"source","generation":0},"error":"transient"} | {"phase":"Active","generation":0,"notifier":"absent","reason":"none"} | unsubscribe(source#0); subscribe(notifier#0); errorsSubject.N("transient") | {"phase":"Waiting","generation":0,"notifier":"open","reason":"none"} |
| 3 | 5 | S18-RETRYWHEN-RETRY | {"type":"notifier.next"} | {"phase":"Waiting","generation":0,"notifier":"open","reason":"none"} | subscribe(source#1) | {"phase":"Active","generation":1,"notifier":"open","reason":"none"} |
| 4 | 6 | S18-RETRYWHEN-FORWARD | {"type":"source.next","resource":{"id":"source","generation":1},"value":"recovered"} | {"phase":"Active","generation":1,"notifier":"open","reason":"none"} | downstream.N("recovered") | {"phase":"Active","generation":1,"notifier":"open","reason":"none"} |
| 5 | 7 | S18-RETRYWHEN-SOURCE-COMPLETE | {"type":"source.complete","resource":{"id":"source","generation":1}} | {"phase":"Active","generation":1,"notifier":"open","reason":"none"} | downstream.C(); unsubscribe(source#1); unsubscribe(notifier#0) | {"phase":"Closed","generation":1,"notifier":"open","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 |
|---|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 5 | 6 | 7 |
| Input | {"type":"subscribe"} | {"type":"source.next","resource":{"id":"source","generation":0},"value":"first"} | {"type":"source.error","resource":{"id":"source","generation":0},"error":"transient"} | {"type":"notifier.next"} | {"type":"source.next","resource":{"id":"source","generation":1},"value":"recovered"} | {"type":"source.complete","resource":{"id":"source","generation":1}} |
| Control / state | {"phase":"Active","generation":0,"notifier":"absent","reason":"none"} | {"phase":"Active","generation":0,"notifier":"absent","reason":"none"} | {"phase":"Waiting","generation":0,"notifier":"open","reason":"none"} | {"phase":"Active","generation":1,"notifier":"open","reason":"none"} | {"phase":"Active","generation":1,"notifier":"open","reason":"none"} | {"phase":"Closed","generation":1,"notifier":"open","reason":"complete"} |
| Output notifications | none | downstream.N("first") | errorsSubject.N("transient") | none | downstream.N("recovered") | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
