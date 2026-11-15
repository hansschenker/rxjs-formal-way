# sequenceEqual-strict-FIFO-32: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S18-SEQUENCEEQUAL-START | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(left#0); subscribe(right#0) | {"phase":"Comparing","left":[],"right":[],"leftDone":false,"rightDone":false} |
| 1 | 1 | S18-SEQUENCEEQUAL-LEFT-QUEUE | {"type":"left.next","value":"a"} | {"phase":"Comparing","left":[],"right":[],"leftDone":false,"rightDone":false} |  | {"phase":"Comparing","left":["a"],"right":[],"leftDone":false,"rightDone":false} |
| 2 | 2 | S18-SEQUENCEEQUAL-LEFT-QUEUE | {"type":"left.next","value":"b"} | {"phase":"Comparing","left":["a"],"right":[],"leftDone":false,"rightDone":false} |  | {"phase":"Comparing","left":["a","b"],"right":[],"leftDone":false,"rightDone":false} |
| 3 | 3 | S18-SEQUENCEEQUAL-RIGHT-MATCH | {"type":"right.next","value":"a"} | {"phase":"Comparing","left":["a","b"],"right":[],"leftDone":false,"rightDone":false} |  | {"phase":"Comparing","left":["b"],"right":[],"leftDone":false,"rightDone":false} |
| 4 | 4 | S18-SEQUENCEEQUAL-RIGHT-MATCH | {"type":"right.next","value":"b"} | {"phase":"Comparing","left":["b"],"right":[],"leftDone":false,"rightDone":false} |  | {"phase":"Comparing","left":[],"right":[],"leftDone":false,"rightDone":false} |
| 5 | 5 | S18-SEQUENCEEQUAL-LEFT-FIRST-COMPLETE | {"type":"left.complete"} | {"phase":"Comparing","left":[],"right":[],"leftDone":false,"rightDone":false} | unsubscribe(left#0) | {"phase":"Comparing","left":[],"right":[],"leftDone":true,"rightDone":false} |
| 6 | 6 | S18-SEQUENCEEQUAL-RIGHT-FINAL-EQUAL | {"type":"right.complete"} | {"phase":"Comparing","left":[],"right":[],"leftDone":true,"rightDone":false} | downstream.N(true); downstream.C(); unsubscribe(right#0) | {"phase":"Closed","reason":"equal"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 |
|---|---|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
| Input | {"type":"subscribe"} | {"type":"left.next","value":"a"} | {"type":"left.next","value":"b"} | {"type":"right.next","value":"a"} | {"type":"right.next","value":"b"} | {"type":"left.complete"} | {"type":"right.complete"} |
| Control / state | {"phase":"Comparing","left":[],"right":[],"leftDone":false,"rightDone":false} | {"phase":"Comparing","left":["a"],"right":[],"leftDone":false,"rightDone":false} | {"phase":"Comparing","left":["a","b"],"right":[],"leftDone":false,"rightDone":false} | {"phase":"Comparing","left":["b"],"right":[],"leftDone":false,"rightDone":false} | {"phase":"Comparing","left":[],"right":[],"leftDone":false,"rightDone":false} | {"phase":"Comparing","left":[],"right":[],"leftDone":true,"rightDone":false} | {"phase":"Closed","reason":"equal"} |
| Output notifications | none | none | none | none | none | none | downstream.N(true); downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
