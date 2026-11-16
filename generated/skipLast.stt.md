# skipLast-FIFO-2: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S19-SKIPLAST-START | Unsubscribed | subscribe | first subscription | subscribe source with empty FIFO | Retain precisely the state memory and resource ownership described by this rule. | S19-SKIPLAST-START |
| S19-SKIPLAST-IDENTITY | Active | source.next | count is zero | forward value immediately | Retain precisely the state memory and resource ownership described by this rule. | S19-SKIPLAST-IDENTITY |
| S19-SKIPLAST-BUFFER | Active | source.next | nonzero count and FIFO is not full | enqueue source value silently | Retain precisely the state memory and resource ownership described by this rule. | S19-SKIPLAST-BUFFER |
| S19-SKIPLAST-RELEASE-OLDEST | Active | source.next | positive count and FIFO already full | replace oldest buffered value with new source value; then emit previous oldest | Retain precisely the state memory and resource ownership described by this rule. | S19-SKIPLAST-RELEASE-OLDEST |
| S19-SKIPLAST-COMPLETE | Active | source.complete | source completes successfully | drop still-buffered suffix; complete without flushing | Final terminal reason; state is no longer admissible for input. | S19-SKIPLAST-COMPLETE |
| S19-SKIPLAST-ERROR | Active | source.error | source fails | drop FIFO and propagate exact error; release source | Final terminal reason; state is no longer admissible for input. | S19-SKIPLAST-ERROR |
| S19-SKIPLAST-CANCEL | Active | cancel | consumer cancels | drop FIFO and unsubscribe silently | Final terminal reason; state is no longer admissible for input. | S19-SKIPLAST-CANCEL |
