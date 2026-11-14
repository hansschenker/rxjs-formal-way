# repeatWhen-persistent-notifier-post-setup: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S17-REPEATWHEN-START | {"type":"subscribe"} | {"phase":"Unsubscribed","generation":0,"notifier":"absent","reason":"none"} | subscribe(source#0) | {"phase":"Active","generation":0,"notifier":"absent","reason":"none"} |
| 1 | 1 | S17-REPEATWHEN-VALUE | {"type":"source.next","resource":{"id":"source","generation":0},"value":"initial"} | {"phase":"Active","generation":0,"notifier":"absent","reason":"none"} | downstream.N("initial") | {"phase":"Active","generation":0,"notifier":"absent","reason":"none"} |
| 2 | 2 | S17-REPEATWHEN-FIRST-SOURCE-COMPLETE | {"type":"source.complete","resource":{"id":"source","generation":0}} | {"phase":"Active","generation":0,"notifier":"absent","reason":"none"} | unsubscribe(source#0); subscribe(notifier#0); completionsSubject.N(undefined) | {"phase":"Waiting","generation":0,"notifier":"open","reason":"none"} |
| 3 | 5 | S17-REPEATWHEN-RESTART | {"type":"notifier.next"} | {"phase":"Waiting","generation":0,"notifier":"open","reason":"none"} | subscribe(source#1) | {"phase":"Active","generation":1,"notifier":"open","reason":"none"} |
| 4 | 6 | S17-REPEATWHEN-VALUE | {"type":"source.next","resource":{"id":"source","generation":1},"value":"repeated"} | {"phase":"Active","generation":1,"notifier":"open","reason":"none"} | downstream.N("repeated") | {"phase":"Active","generation":1,"notifier":"open","reason":"none"} |
| 5 | 7 | S17-REPEATWHEN-SOURCE-COMPLETE-WAIT | {"type":"source.complete","resource":{"id":"source","generation":1}} | {"phase":"Active","generation":1,"notifier":"open","reason":"none"} | unsubscribe(source#1); completionsSubject.N(undefined) | {"phase":"Waiting","generation":1,"notifier":"open","reason":"none"} |
| 6 | 8 | S17-REPEATWHEN-NOTIFIER-COMPLETE-WAIT | {"type":"notifier.complete"} | {"phase":"Waiting","generation":1,"notifier":"open","reason":"none"} | unsubscribe(notifier#0); downstream.C() | {"phase":"Closed","generation":1,"notifier":"open","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 |
|---|---|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 5 | 6 | 7 | 8 |
| Input | {"type":"subscribe"} | {"type":"source.next","resource":{"id":"source","generation":0},"value":"initial"} | {"type":"source.complete","resource":{"id":"source","generation":0}} | {"type":"notifier.next"} | {"type":"source.next","resource":{"id":"source","generation":1},"value":"repeated"} | {"type":"source.complete","resource":{"id":"source","generation":1}} | {"type":"notifier.complete"} |
| Control / state | {"phase":"Active","generation":0,"notifier":"absent","reason":"none"} | {"phase":"Active","generation":0,"notifier":"absent","reason":"none"} | {"phase":"Waiting","generation":0,"notifier":"open","reason":"none"} | {"phase":"Active","generation":1,"notifier":"open","reason":"none"} | {"phase":"Active","generation":1,"notifier":"open","reason":"none"} | {"phase":"Waiting","generation":1,"notifier":"open","reason":"none"} | {"phase":"Closed","generation":1,"notifier":"open","reason":"complete"} |
| Output notifications | none | downstream.N("initial") | completionsSubject.N(undefined) | none | downstream.N("repeated") | completionsSubject.N(undefined) | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
