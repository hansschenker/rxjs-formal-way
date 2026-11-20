# zipWith-3-fifo-8: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S23-ZIPWITH-START | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(input:0#0); subscribe(input:1#0); subscribe(input:2#0) | {"phase":"Active","queues":[[],[],[]],"live":[true,true,true],"received":[0,0,0],"emitted":0} |
| 1 | 1 | S23-ZIPWITH-BUFFER | {"type":"input.next","index":0,"value":"A1"} | {"phase":"Active","queues":[[],[],[]],"live":[true,true,true],"received":[0,0,0],"emitted":0} |  | {"phase":"Active","queues":[["A1"],[],[]],"live":[true,true,true],"received":[1,0,0],"emitted":0} |
| 2 | 2 | S23-ZIPWITH-BUFFER | {"type":"input.next","index":0,"value":"A2"} | {"phase":"Active","queues":[["A1"],[],[]],"live":[true,true,true],"received":[1,0,0],"emitted":0} |  | {"phase":"Active","queues":[["A1","A2"],[],[]],"live":[true,true,true],"received":[2,0,0],"emitted":0} |
| 3 | 3 | S23-ZIPWITH-COMPLETE-BUFFERED | {"type":"input.complete","index":0} | {"phase":"Active","queues":[["A1","A2"],[],[]],"live":[true,true,true],"received":[2,0,0],"emitted":0} | unsubscribe(input:0#0) | {"phase":"Active","queues":[["A1","A2"],[],[]],"live":[false,true,true],"received":[2,0,0],"emitted":0} |
| 4 | 4 | S23-ZIPWITH-BUFFER | {"type":"input.next","index":1,"value":"B1"} | {"phase":"Active","queues":[["A1","A2"],[],[]],"live":[false,true,true],"received":[2,0,0],"emitted":0} |  | {"phase":"Active","queues":[["A1","A2"],["B1"],[]],"live":[false,true,true],"received":[2,1,0],"emitted":0} |
| 5 | 5 | S23-ZIPWITH-EMIT | {"type":"input.next","index":2,"value":"C1"} | {"phase":"Active","queues":[["A1","A2"],["B1"],[]],"live":[false,true,true],"received":[2,1,0],"emitted":0} | downstream.N(["A1","B1","C1"]) | {"phase":"Active","queues":[["A2"],[],[]],"live":[false,true,true],"received":[2,1,1],"emitted":1} |
| 6 | 6 | S23-ZIPWITH-BUFFER | {"type":"input.next","index":1,"value":"B2"} | {"phase":"Active","queues":[["A2"],[],[]],"live":[false,true,true],"received":[2,1,1],"emitted":1} |  | {"phase":"Active","queues":[["A2"],["B2"],[]],"live":[false,true,true],"received":[2,2,1],"emitted":1} |
| 7 | 7 | S23-ZIPWITH-COMPLETE-BUFFERED | {"type":"input.complete","index":1} | {"phase":"Active","queues":[["A2"],["B2"],[]],"live":[false,true,true],"received":[2,2,1],"emitted":1} | unsubscribe(input:1#0) | {"phase":"Active","queues":[["A2"],["B2"],[]],"live":[false,false,true],"received":[2,2,1],"emitted":1} |
| 8 | 8 | S23-ZIPWITH-EMIT-LAST | {"type":"input.next","index":2,"value":"C2"} | {"phase":"Active","queues":[["A2"],["B2"],[]],"live":[false,false,true],"received":[2,2,1],"emitted":1} | downstream.N(["A2","B2","C2"]); downstream.C(); unsubscribe(input:2#0) | {"phase":"Closed","reason":"exhausted"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 | step 7 | step 8 |
|---|---|---|---|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
| Input | {"type":"subscribe"} | {"type":"input.next","index":0,"value":"A1"} | {"type":"input.next","index":0,"value":"A2"} | {"type":"input.complete","index":0} | {"type":"input.next","index":1,"value":"B1"} | {"type":"input.next","index":2,"value":"C1"} | {"type":"input.next","index":1,"value":"B2"} | {"type":"input.complete","index":1} | {"type":"input.next","index":2,"value":"C2"} |
| Control / state | {"phase":"Active","queues":[[],[],[]],"live":[true,true,true],"received":[0,0,0],"emitted":0} | {"phase":"Active","queues":[["A1"],[],[]],"live":[true,true,true],"received":[1,0,0],"emitted":0} | {"phase":"Active","queues":[["A1","A2"],[],[]],"live":[true,true,true],"received":[2,0,0],"emitted":0} | {"phase":"Active","queues":[["A1","A2"],[],[]],"live":[false,true,true],"received":[2,0,0],"emitted":0} | {"phase":"Active","queues":[["A1","A2"],["B1"],[]],"live":[false,true,true],"received":[2,1,0],"emitted":0} | {"phase":"Active","queues":[["A2"],[],[]],"live":[false,true,true],"received":[2,1,1],"emitted":1} | {"phase":"Active","queues":[["A2"],["B2"],[]],"live":[false,true,true],"received":[2,2,1],"emitted":1} | {"phase":"Active","queues":[["A2"],["B2"],[]],"live":[false,false,true],"received":[2,2,1],"emitted":1} | {"phase":"Closed","reason":"exhausted"} |
| Output notifications | none | none | none | none | none | downstream.N(["A1","B1","C1"]) | none | none | downstream.N(["A2","B2","C2"]); downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
