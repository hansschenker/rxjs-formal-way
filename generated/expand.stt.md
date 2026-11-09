# expand-unbounded: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| EXPAND-INIT | Unsubscribed | subscribe | fresh execution | subscribe outer source | updated control and memory | S12-EXPAND-INIT |
| EXPAND-OUTER-ADMIT | Active | outer.next | capacity available | emit input first; invoke projection with zero-based expansion index | updated control and memory | S12-EXPAND-OUTER-ADMIT |
| EXPAND-INNER-ADMIT-ACTIVE | Active | inner.next | known inner and expansion capacity available | emit recursive value; feed recursive value into projection | updated control and memory | S12-EXPAND-INNER-ADMIT-ACTIVE |
| EXPAND-INNER-ADMIT-DRAINING | Draining | inner.next | known inner and expansion capacity available | emit recursive value; feed recursive value into projection | updated control and memory | S12-EXPAND-INNER-ADMIT-DRAINING |
| EXPAND-PROJECT-RETURN | Calling | callback.return | correlated projection return while outer open | subscribe returned inner occurrence | updated control and memory | S12-EXPAND-PROJECT-RETURN |
| EXPAND-PROJECT-RETURN-DRAINING | Calling | callback.return | correlated projection return after outer completion | subscribe returned inner occurrence | updated control and memory | S12-EXPAND-PROJECT-RETURN-DRAINING |
| EXPAND-PROJECT-THROW | Calling | callback.throw | correlated projection throws | error downstream; release all owned subscriptions | terminal state with no owned live work | S12-EXPAND-PROJECT-THROW |
| EXPAND-INNER-COMPLETE-ACTIVE | Active | inner.complete | known inner completes with no queued value | release completed inner | updated control and memory | S12-EXPAND-INNER-COMPLETE-ACTIVE |
| EXPAND-INNER-COMPLETE-DRAINING-MORE | Draining | inner.complete | known inner completes but other recursive work remains | release completed inner | updated control and memory | S12-EXPAND-INNER-COMPLETE-DRAINING-MORE |
| EXPAND-INNER-COMPLETE-DRAINING-LAST | Draining | inner.complete | last known inner completes and no queue remains | release completed inner; complete downstream | terminal state with no owned live work | S12-EXPAND-INNER-COMPLETE-DRAINING-LAST |
| EXPAND-INNER-ERROR-ACTIVE | Active | inner.error | known inner errors | forward exact error; release outer if open and all active inners | terminal state with no owned live work | S12-EXPAND-INNER-ERROR-ACTIVE |
| EXPAND-INNER-ERROR-DRAINING | Draining | inner.error | known inner errors | forward exact error; release outer if open and all active inners | terminal state with no owned live work | S12-EXPAND-INNER-ERROR-DRAINING |
| EXPAND-OUTER-COMPLETE | Active | outer.complete | recursive work remains active or queued | release outer and wait | updated control and memory | S12-EXPAND-OUTER-COMPLETE |
| EXPAND-OUTER-COMPLETE-IDLE | Active | outer.complete | no recursive work remains | release outer; complete downstream | terminal state with no owned live work | S12-EXPAND-OUTER-COMPLETE-IDLE |
| EXPAND-OUTER-ERROR | Active | outer.error | outer errors | forward exact error; release outer and all active inners | terminal state with no owned live work | S12-EXPAND-OUTER-ERROR |
| EXPAND-CANCEL-ACTIVE | Active | cancel | downstream closes | release owned subscriptions silently | terminal state with no owned live work | S12-EXPAND-CANCEL-ACTIVE |
| EXPAND-CANCEL-DRAINING | Draining | cancel | downstream closes | release owned subscriptions silently | terminal state with no owned live work | S12-EXPAND-CANCEL-DRAINING |
| EXPAND-CANCEL-CALLING | Calling | cancel | downstream closes between callback request and outcome | release owned subscriptions silently | terminal state with no owned live work | S12-EXPAND-CANCEL-CALLING |
