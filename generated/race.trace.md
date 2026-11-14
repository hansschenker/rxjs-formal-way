# race-fixed-observables-atomic-subscription: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S17-RACE-SUBSCRIBE | {"type":"subscribe"} | {"phase":"Unsubscribed","live":[],"winner":null,"reason":"none"} | subscribe(input#0); subscribe(input#1); subscribe(input#2) | {"phase":"Racing","live":[0,1,2],"winner":null,"reason":"none"} |
| 1 | 1 | S17-RACE-FIRST-NEXT | {"type":"input.next","resource":{"id":"input","generation":2},"value":"winner first"} | {"phase":"Racing","live":[0,1,2],"winner":null,"reason":"none"} | unsubscribe(input#0); unsubscribe(input#1); downstream.N("winner first") | {"phase":"Winner","live":[2],"winner":2,"reason":"none"} |
| 2 | 2 | S17-RACE-WINNER-NEXT | {"type":"input.next","resource":{"id":"input","generation":2},"value":"winner second"} | {"phase":"Winner","live":[2],"winner":2,"reason":"none"} | downstream.N("winner second") | {"phase":"Winner","live":[2],"winner":2,"reason":"none"} |
| 3 | 3 | S17-RACE-WINNER-COMPLETE | {"type":"input.complete","resource":{"id":"input","generation":2}} | {"phase":"Winner","live":[2],"winner":2,"reason":"none"} | downstream.C(); unsubscribe(input#2) | {"phase":"Closed","live":[],"winner":2,"reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 |
|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 |
| Input | {"type":"subscribe"} | {"type":"input.next","resource":{"id":"input","generation":2},"value":"winner first"} | {"type":"input.next","resource":{"id":"input","generation":2},"value":"winner second"} | {"type":"input.complete","resource":{"id":"input","generation":2}} |
| Control / state | {"phase":"Racing","live":[0,1,2],"winner":null,"reason":"none"} | {"phase":"Winner","live":[2],"winner":2,"reason":"none"} | {"phase":"Winner","live":[2],"winner":2,"reason":"none"} | {"phase":"Closed","live":[],"winner":2,"reason":"complete"} |
| Output notifications | none | downstream.N("winner first") | downstream.N("winner second") | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
