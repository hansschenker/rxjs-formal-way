# zip-3-fifo-8: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S23-ZIP-START | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(input:0#0); subscribe(input:1#0); subscribe(input:2#0) | {"phase":"Active","queues":[[],[],[]],"live":[true,true,true],"received":[0,0,0],"emitted":0} |
| 1 | 1 | S23-ZIP-BUFFER | {"type":"input.next","index":2,"value":"queued"} | {"phase":"Active","queues":[[],[],[]],"live":[true,true,true],"received":[0,0,0],"emitted":0} |  | {"phase":"Active","queues":[[],[],["queued"]],"live":[true,true,true],"received":[0,0,1],"emitted":0} |
| 2 | 2 | S23-ZIP-COMPLETE-BUFFERED | {"type":"input.complete","index":2} | {"phase":"Active","queues":[[],[],["queued"]],"live":[true,true,true],"received":[0,0,1],"emitted":0} | unsubscribe(input:2#0) | {"phase":"Active","queues":[[],[],["queued"]],"live":[true,true,false],"received":[0,0,1],"emitted":0} |
| 3 | 3 | S23-ZIP-BUFFER | {"type":"input.next","index":0,"value":"waiting"} | {"phase":"Active","queues":[[],[],["queued"]],"live":[true,true,false],"received":[0,0,1],"emitted":0} |  | {"phase":"Active","queues":[["waiting"],[],["queued"]],"live":[true,true,false],"received":[1,0,1],"emitted":0} |
| 4 | 4 | S23-ZIP-CANCEL | {"type":"cancel"} | {"phase":"Active","queues":[["waiting"],[],["queued"]],"live":[true,true,false],"received":[1,0,1],"emitted":0} | unsubscribe(input:0#0); unsubscribe(input:1#0) | {"phase":"Closed","reason":"cancel"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 |
|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 | 4 |
| Input | {"type":"subscribe"} | {"type":"input.next","index":2,"value":"queued"} | {"type":"input.complete","index":2} | {"type":"input.next","index":0,"value":"waiting"} | {"type":"cancel"} |
| Control / state | {"phase":"Active","queues":[[],[],[]],"live":[true,true,true],"received":[0,0,0],"emitted":0} | {"phase":"Active","queues":[[],[],["queued"]],"live":[true,true,true],"received":[0,0,1],"emitted":0} | {"phase":"Active","queues":[[],[],["queued"]],"live":[true,true,false],"received":[0,0,1],"emitted":0} | {"phase":"Active","queues":[["waiting"],[],["queued"]],"live":[true,true,false],"received":[1,0,1],"emitted":0} | {"phase":"Closed","reason":"cancel"} |
| Output notifications | none | none | none | none | none |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
