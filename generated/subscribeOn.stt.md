# subscribeOn-virtualFIFO-delay-2: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S19-SUBSCRIBEON-SCHEDULE | Unsubscribed | subscribe | downstream starts | schedule subscription action with delay; do not acquire source yet | Retain precisely the state memory and resource ownership described by this rule. | S19-SUBSCRIBEON-SCHEDULE |
| S19-SUBSCRIBEON-CONNECT | Pending | timer.fire | matching scheduler action at/after due time | subscribe source inside scheduled action | Retain precisely the state memory and resource ownership described by this rule. | S19-SUBSCRIBEON-CONNECT |
| S19-SUBSCRIBEON-PENDING-CANCEL | Pending | cancel | unsubscribe before scheduled action runs | cancel scheduler action; never subscribe source | Final terminal reason; state is no longer admissible for input. | S19-SUBSCRIBEON-PENDING-CANCEL |
| S19-SUBSCRIBEON-NEXT | Active | source.next | scheduled source subscription is now live | forward source value immediately | Retain precisely the state memory and resource ownership described by this rule. | S19-SUBSCRIBEON-NEXT |
| S19-SUBSCRIBEON-COMPLETE | Active | source.complete | live source completes | complete and release source | Final terminal reason; state is no longer admissible for input. | S19-SUBSCRIBEON-COMPLETE |
| S19-SUBSCRIBEON-ERROR | Active | source.error | live source fails | propagate original error and release source | Final terminal reason; state is no longer admissible for input. | S19-SUBSCRIBEON-ERROR |
| S19-SUBSCRIBEON-ACTIVE-CANCEL | Active | cancel | consumer unsubscribes after source acquisition | unsubscribe source silently | Final terminal reason; state is no longer admissible for input. | S19-SUBSCRIBEON-ACTIVE-CANCEL |
