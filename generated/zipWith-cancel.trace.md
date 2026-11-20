# zipWith-3-fifo-8: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S23-ZIPWITH-START | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(input:0#0); subscribe(input:1#0); subscribe(input:2#0) | {"phase":"Active","queues":[[],[],[]],"live":[true,true,true],"received":[0,0,0],"emitted":0} |
| 1 | 1 | S23-ZIPWITH-BUFFER | {"type":"input.next","index":0,"value":{"pending":"A"}} | {"phase":"Active","queues":[[],[],[]],"live":[true,true,true],"received":[0,0,0],"emitted":0} |  | {"phase":"Active","queues":[[{"pending":"A"}],[],[]],"live":[true,true,true],"received":[1,0,0],"emitted":0} |
| 2 | 2 | S23-ZIPWITH-BUFFER | {"type":"input.next","index":1} | {"phase":"Active","queues":[[{"pending":"A"}],[],[]],"live":[true,true,true],"received":[1,0,0],"emitted":0} |  | {"phase":"Active","queues":[[{"pending":"A"}],[null],[]],"live":[true,true,true],"received":[1,1,0],"emitted":0} |
| 3 | 3 | S23-ZIPWITH-CANCEL | {"type":"cancel"} | {"phase":"Active","queues":[[{"pending":"A"}],[null],[]],"live":[true,true,true],"received":[1,1,0],"emitted":0} | unsubscribe(input:0#0); unsubscribe(input:1#0); unsubscribe(input:2#0) | {"phase":"Closed","reason":"cancel"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 |
|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 |
| Input | {"type":"subscribe"} | {"type":"input.next","index":0,"value":{"pending":"A"}} | {"type":"input.next","index":1} | {"type":"cancel"} |
| Control / state | {"phase":"Active","queues":[[],[],[]],"live":[true,true,true],"received":[0,0,0],"emitted":0} | {"phase":"Active","queues":[[{"pending":"A"}],[],[]],"live":[true,true,true],"received":[1,0,0],"emitted":0} | {"phase":"Active","queues":[[{"pending":"A"}],[null],[]],"live":[true,true,true],"received":[1,1,0],"emitted":0} | {"phase":"Closed","reason":"cancel"} |
| Output notifications | none | none | none | none |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
