# raceWith-fixed-observables-atomic-subscription: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S17-RACEWITH-SUBSCRIBE | {"type":"subscribe"} | {"phase":"Unsubscribed","live":[],"winner":null,"reason":"none"} | subscribe(input#0); subscribe(input#1); subscribe(input#2) | {"phase":"Racing","live":[0,1,2],"winner":null,"reason":"none"} |
| 1 | 2 | S17-RACEWITH-FIRST-NEXT | {"type":"input.next","resource":{"id":"input","generation":1},"value":10} | {"phase":"Racing","live":[0,1,2],"winner":null,"reason":"none"} | unsubscribe(input#0); unsubscribe(input#2); downstream.N(10) | {"phase":"Winner","live":[1],"winner":1,"reason":"none"} |
| 2 | 3 | S17-RACEWITH-WINNER-NEXT | {"type":"input.next","resource":{"id":"input","generation":1},"value":11} | {"phase":"Winner","live":[1],"winner":1,"reason":"none"} | downstream.N(11) | {"phase":"Winner","live":[1],"winner":1,"reason":"none"} |
| 3 | 4 | S17-RACEWITH-WINNER-COMPLETE | {"type":"input.complete","resource":{"id":"input","generation":1}} | {"phase":"Winner","live":[1],"winner":1,"reason":"none"} | downstream.C(); unsubscribe(input#1) | {"phase":"Closed","live":[],"winner":1,"reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 |
|---|---|---|---|---|
| Time | 0 | 2 | 3 | 4 |
| Input | {"type":"subscribe"} | {"type":"input.next","resource":{"id":"input","generation":1},"value":10} | {"type":"input.next","resource":{"id":"input","generation":1},"value":11} | {"type":"input.complete","resource":{"id":"input","generation":1}} |
| Control / state | {"phase":"Racing","live":[0,1,2],"winner":null,"reason":"none"} | {"phase":"Winner","live":[1],"winner":1,"reason":"none"} | {"phase":"Winner","live":[1],"winner":1,"reason":"none"} | {"phase":"Closed","live":[],"winner":1,"reason":"complete"} |
| Output notifications | none | downstream.N(10) | downstream.N(11) | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
