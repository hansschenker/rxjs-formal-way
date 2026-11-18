# timeInterval-external-clock: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S21-TIMEINTERVAL-START-READ | {"type":"subscribe"} | {"phase":"Unsubscribed"} | invoke(timeInterval.now#0, value=undefined, index=0) | {"phase":"ReadingStart","read":0} |
| 1 | 0 | S21-TIMEINTERVAL-START-RETURN | {"type":"clock.return","resource":{"id":"timeInterval.now","generation":0},"reading":100} | {"phase":"ReadingStart","read":0} | subscribe(source#0) | {"phase":"Listening","previous":100,"nextRead":1} |
| 2 | 2 | S21-TIMEINTERVAL-NEXT-READ | {"type":"source.next","value":"A"} | {"phase":"Listening","previous":100,"nextRead":1} | invoke(timeInterval.now#1, value=undefined, index=1) | {"phase":"ReadingNext","previous":100,"read":1,"value":"A"} |
| 3 | 2 | S21-TIMEINTERVAL-NEXT-RETURN | {"type":"clock.return","resource":{"id":"timeInterval.now","generation":1},"reading":103} | {"phase":"ReadingNext","previous":100,"read":1,"value":"A"} | downstream.N({"value":"A","interval":3}) | {"phase":"Listening","previous":103,"nextRead":2} |
| 4 | 5 | S21-TIMEINTERVAL-NEXT-READ | {"type":"source.next","value":"B"} | {"phase":"Listening","previous":103,"nextRead":2} | invoke(timeInterval.now#2, value=undefined, index=2) | {"phase":"ReadingNext","previous":103,"read":2,"value":"B"} |
| 5 | 5 | S21-TIMEINTERVAL-NEXT-RETURN | {"type":"clock.return","resource":{"id":"timeInterval.now","generation":2},"reading":101} | {"phase":"ReadingNext","previous":103,"read":2,"value":"B"} | downstream.N({"value":"B","interval":-2}) | {"phase":"Listening","previous":101,"nextRead":3} |
| 6 | 6 | S21-TIMEINTERVAL-COMPLETE | {"type":"source.complete"} | {"phase":"Listening","previous":101,"nextRead":3} | downstream.C(); unsubscribe(source#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 |
|---|---|---|---|---|---|---|---|
| Time | 0 | 0 | 2 | 2 | 5 | 5 | 6 |
| Input | {"type":"subscribe"} | {"type":"clock.return","resource":{"id":"timeInterval.now","generation":0},"reading":100} | {"type":"source.next","value":"A"} | {"type":"clock.return","resource":{"id":"timeInterval.now","generation":1},"reading":103} | {"type":"source.next","value":"B"} | {"type":"clock.return","resource":{"id":"timeInterval.now","generation":2},"reading":101} | {"type":"source.complete"} |
| Control / state | {"phase":"ReadingStart","read":0} | {"phase":"Listening","previous":100,"nextRead":1} | {"phase":"ReadingNext","previous":100,"read":1,"value":"A"} | {"phase":"Listening","previous":103,"nextRead":2} | {"phase":"ReadingNext","previous":103,"read":2,"value":"B"} | {"phase":"Listening","previous":101,"nextRead":3} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | none | downstream.N({"value":"A","interval":3}) | none | downstream.N({"value":"B","interval":-2}) | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
