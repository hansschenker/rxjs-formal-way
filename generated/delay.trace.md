# delay-fixed-timer-3: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|---|
| 0 | 0 | DELAY-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Active","sourceLive":true,"nextId":0,"items":[]} |
| 1 | 1 | DELAY-SOURCE-NEXT | {"type":"source.next","now":1,"value":1} | {"phase":"Active","sourceLive":true,"nextId":0,"items":[]} | schedule(timer#0, delay=3) | {"phase":"Active","sourceLive":true,"nextId":1,"items":[{"id":0,"value":1,"stage":"pending","deadline":4}]} |
| 2 | 2 | DELAY-SOURCE-NEXT | {"type":"source.next","now":2,"value":2} | {"phase":"Active","sourceLive":true,"nextId":1,"items":[{"id":0,"value":1,"stage":"pending","deadline":4}]} | schedule(timer#1, delay=3) | {"phase":"Active","sourceLive":true,"nextId":2,"items":[{"id":0,"value":1,"stage":"pending","deadline":4},{"id":1,"value":2,"stage":"pending","deadline":5}]} |
| 3 | 3 | DELAY-SOURCE-COMPLETE-WAIT | {"type":"source.complete"} | {"phase":"Active","sourceLive":true,"nextId":2,"items":[{"id":0,"value":1,"stage":"pending","deadline":4},{"id":1,"value":2,"stage":"pending","deadline":5}]} | unsubscribe(source#0) | {"phase":"Active","sourceLive":false,"nextId":2,"items":[{"id":0,"value":1,"stage":"pending","deadline":4},{"id":1,"value":2,"stage":"pending","deadline":5}]} |
| 4 | 4 | DELAY-TIMER-FIRE | {"type":"timer.fire","resource":{"id":"timer","generation":0},"now":4} | {"phase":"Active","sourceLive":false,"nextId":2,"items":[{"id":0,"value":1,"stage":"pending","deadline":4},{"id":1,"value":2,"stage":"pending","deadline":5}]} | cancel-timer(timer#0); downstream.N(1) | {"phase":"Active","sourceLive":false,"nextId":2,"items":[{"id":1,"value":2,"stage":"pending","deadline":5}]} |
| 5 | 5 | DELAY-TIMER-FINAL | {"type":"timer.fire","resource":{"id":"timer","generation":1},"now":5} | {"phase":"Active","sourceLive":false,"nextId":2,"items":[{"id":1,"value":2,"stage":"pending","deadline":5}]} | cancel-timer(timer#1); downstream.N(2); downstream.C() | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 |
|---|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 | 4 | 5 |
| Input | {"type":"subscribe"} | {"type":"source.next","now":1,"value":1} | {"type":"source.next","now":2,"value":2} | {"type":"source.complete"} | {"type":"timer.fire","resource":{"id":"timer","generation":0},"now":4} | {"type":"timer.fire","resource":{"id":"timer","generation":1},"now":5} |
| Control / state | {"phase":"Active","sourceLive":true,"nextId":0,"items":[]} | {"phase":"Active","sourceLive":true,"nextId":1,"items":[{"id":0,"value":1,"stage":"pending","deadline":4}]} | {"phase":"Active","sourceLive":true,"nextId":2,"items":[{"id":0,"value":1,"stage":"pending","deadline":4},{"id":1,"value":2,"stage":"pending","deadline":5}]} | {"phase":"Active","sourceLive":false,"nextId":2,"items":[{"id":0,"value":1,"stage":"pending","deadline":4},{"id":1,"value":2,"stage":"pending","deadline":5}]} | {"phase":"Active","sourceLive":false,"nextId":2,"items":[{"id":1,"value":2,"stage":"pending","deadline":5}]} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | none | none | downstream.N(1) | downstream.N(2); downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
