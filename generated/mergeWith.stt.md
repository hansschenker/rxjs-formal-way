# mergeWith-unbounded-2: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S15-MERGEWITH-INIT | Unsubscribed | subscribe | first consumer connection | subscribe source 0 first, then every configured other input in argument order | Active; live inputs are 0 through 2; pending is empty | S15-MERGEWITH-INIT |
| S15-MERGEWITH-NEXT | Active | input.next | input resource belongs to the current live-input set | forward the exact input payload once | Active; the live-input set is unchanged; pending remains empty | S15-MERGEWITH-NEXT |
| S15-MERGEWITH-COMPLETE-WAIT | Active | input.complete | the completing input is live and at least one other input remains live | release the completed input; emit no result notification | Active; remove the completed input from the live-input set; pending remains empty | S15-MERGEWITH-COMPLETE-WAIT |
| S15-MERGEWITH-COMPLETE-LAST | Active | input.complete | the completing input is the only live input | release the final input and run its registered teardown; complete the result | Closed with reason complete; no owned input subscriptions | S15-MERGEWITH-COMPLETE-LAST |
| S15-MERGEWITH-ERROR | Active | input.error | the failing input belongs to the live-input set | forward the exact error; release every live input in subscription order | Closed with reason input-error; no owned input subscriptions | S15-MERGEWITH-ERROR |
| S15-MERGEWITH-CANCEL | Active | cancel | the result is Active and the consumer unsubscribes | release every live input in subscription order; emit no result notification | Closed with reason cancel; no owned input subscriptions | S15-MERGEWITH-CANCEL |
