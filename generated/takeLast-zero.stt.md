# takeLast-0: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S20-TAKELAST-START-EMPTY | Unsubscribed | subscribe | configured count is nonpositive | complete result without acquiring source | Closed complete; no source was subscribed. | S20-TAKELAST-START-EMPTY |
