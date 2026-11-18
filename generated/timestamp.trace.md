# timestamp-external-clock: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S21-TIMESTAMP-START | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Listening","previous":null,"nextRead":0} |
| 1 | 2 | S21-TIMESTAMP-NEXT-READ | {"type":"source.next","value":"A"} | {"phase":"Listening","previous":null,"nextRead":0} | invoke(timestamp.now#0, value=undefined, index=0) | {"phase":"ReadingNext","previous":null,"read":0,"value":"A"} |
| 2 | 2 | S21-TIMESTAMP-NEXT-RETURN | {"type":"clock.return","resource":{"id":"timestamp.now","generation":0},"reading":103} | {"phase":"ReadingNext","previous":null,"read":0,"value":"A"} | downstream.N({"value":"A","timestamp":103}) | {"phase":"Listening","previous":null,"nextRead":1} |
| 3 | 5 | S21-TIMESTAMP-NEXT-READ | {"type":"source.next","value":"B"} | {"phase":"Listening","previous":null,"nextRead":1} | invoke(timestamp.now#1, value=undefined, index=1) | {"phase":"ReadingNext","previous":null,"read":1,"value":"B"} |
| 4 | 5 | S21-TIMESTAMP-NEXT-RETURN | {"type":"clock.return","resource":{"id":"timestamp.now","generation":1},"reading":101} | {"phase":"ReadingNext","previous":null,"read":1,"value":"B"} | downstream.N({"value":"B","timestamp":101}) | {"phase":"Listening","previous":null,"nextRead":2} |
| 5 | 6 | S21-TIMESTAMP-COMPLETE | {"type":"source.complete"} | {"phase":"Listening","previous":null,"nextRead":2} | downstream.C(); unsubscribe(source#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 |
|---|---|---|---|---|---|---|
| Time | 0 | 2 | 2 | 5 | 5 | 6 |
| Input | {"type":"subscribe"} | {"type":"source.next","value":"A"} | {"type":"clock.return","resource":{"id":"timestamp.now","generation":0},"reading":103} | {"type":"source.next","value":"B"} | {"type":"clock.return","resource":{"id":"timestamp.now","generation":1},"reading":101} | {"type":"source.complete"} |
| Control / state | {"phase":"Listening","previous":null,"nextRead":0} | {"phase":"ReadingNext","previous":null,"read":0,"value":"A"} | {"phase":"Listening","previous":null,"nextRead":1} | {"phase":"ReadingNext","previous":null,"read":1,"value":"B"} | {"phase":"Listening","previous":null,"nextRead":2} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | downstream.N({"value":"A","timestamp":103}) | none | downstream.N({"value":"B","timestamp":101}) | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
