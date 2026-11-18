# window-observable-boundaries: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S21-WINDOW-START | {"type":"subscribe"} | {"phase":"Unsubscribed"} | downstream.N({"windowId":0}); subscribe(source#0); subscribe(boundary#0) | {"phase":"Active","current":0,"boundaryLive":true,"windows":[{"windowId":0,"status":"open"}],"consumers":[],"usedObservers":[]} |
| 1 | 1 | S21-WINDOW-OBSERVER-LIVE | {"type":"window.subscribe","windowId":0,"observerId":"A"} | {"phase":"Active","current":0,"boundaryLive":true,"windows":[{"windowId":0,"status":"open"}],"consumers":[],"usedObservers":[]} | subscribe(windowObserver:A#0) | {"phase":"Active","current":0,"boundaryLive":true,"windows":[{"windowId":0,"status":"open"}],"consumers":[{"observerId":"A","windowId":0}],"usedObservers":["A"]} |
| 2 | 2 | S21-WINDOW-BOUNDARY-COMPLETE | {"type":"boundary.complete"} | {"phase":"Active","current":0,"boundaryLive":true,"windows":[{"windowId":0,"status":"open"}],"consumers":[{"observerId":"A","windowId":0}],"usedObservers":["A"]} | unsubscribe(boundary#0) | {"phase":"Active","current":0,"boundaryLive":false,"windows":[{"windowId":0,"status":"open"}],"consumers":[{"observerId":"A","windowId":0}],"usedObservers":["A"]} |
| 3 | 3 | S21-WINDOW-SOURCE-NEXT | {"type":"source.next","value":"still-live"} | {"phase":"Active","current":0,"boundaryLive":false,"windows":[{"windowId":0,"status":"open"}],"consumers":[{"observerId":"A","windowId":0}],"usedObservers":["A"]} | windowObserver:A.N("still-live") | {"phase":"Active","current":0,"boundaryLive":false,"windows":[{"windowId":0,"status":"open"}],"consumers":[{"observerId":"A","windowId":0}],"usedObservers":["A"]} |
| 4 | 4 | S21-WINDOW-SOURCE-COMPLETE | {"type":"source.complete"} | {"phase":"Active","current":0,"boundaryLive":false,"windows":[{"windowId":0,"status":"open"}],"consumers":[{"observerId":"A","windowId":0}],"usedObservers":["A"]} | windowObserver:A.C(); unsubscribe(windowObserver:A#0); downstream.C(); unsubscribe(source#0) | {"phase":"Stopped","current":0,"boundaryLive":false,"windows":[{"windowId":0,"status":"invalid"}],"consumers":[],"usedObservers":["A"],"reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 |
|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 | 4 |
| Input | {"type":"subscribe"} | {"type":"window.subscribe","windowId":0,"observerId":"A"} | {"type":"boundary.complete"} | {"type":"source.next","value":"still-live"} | {"type":"source.complete"} |
| Control / state | {"phase":"Active","current":0,"boundaryLive":true,"windows":[{"windowId":0,"status":"open"}],"consumers":[],"usedObservers":[]} | {"phase":"Active","current":0,"boundaryLive":true,"windows":[{"windowId":0,"status":"open"}],"consumers":[{"observerId":"A","windowId":0}],"usedObservers":["A"]} | {"phase":"Active","current":0,"boundaryLive":false,"windows":[{"windowId":0,"status":"open"}],"consumers":[{"observerId":"A","windowId":0}],"usedObservers":["A"]} | {"phase":"Active","current":0,"boundaryLive":false,"windows":[{"windowId":0,"status":"open"}],"consumers":[{"observerId":"A","windowId":0}],"usedObservers":["A"]} | {"phase":"Stopped","current":0,"boundaryLive":false,"windows":[{"windowId":0,"status":"invalid"}],"consumers":[],"usedObservers":["A"],"reason":"complete"} |
| Output notifications | downstream.N({"windowId":0}) | none | none | windowObserver:A.N("still-live") | windowObserver:A.C(); downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
