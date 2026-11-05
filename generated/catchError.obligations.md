# catchError-one-Observable-replacement: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session08-rxjs.test.mjs.

## CATCHERROR-INIT

Reach **Unsubscribed** with **fresh execution**, then provide **subscribe**.

Expect, in order: subscribe original source.

Resulting state: await or execute selected source. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-CATCHERROR-INIT.

## CATCHERROR-SOURCE-NEXT

Reach **Source** with **original connected**, then provide **source.next**.

Expect, in order: forward exact value.

Resulting state: await or execute selected source. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-CATCHERROR-SOURCE-NEXT.

## CATCHERROR-SOURCE-ERROR

Reach **Source** with **source connected**, then provide **source.error**.

Expect, in order: request recovery selector with error and caught source.

Resulting state: await or execute selected source. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-CATCHERROR-SOURCE-ERROR.

## CATCHERROR-SELECTOR-RETURN

Reach **Calling** with **matching callback resource**, then provide **callback.return**.

Expect, in order: release original source; subscribe replacement Observable.

Resulting state: await or execute selected source. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-CATCHERROR-SELECTOR-RETURN.

## CATCHERROR-SELECTOR-THROW

Reach **Calling** with **matching selector (or synchronous throw without resource)**, then provide **callback.throw**.

Expect, in order: error with thrown value; release source.

Resulting state: closed. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-CATCHERROR-SELECTOR-THROW.

## CATCHERROR-SOURCE-COMPLETE

Reach **Source** with **original connected**, then provide **source.complete**.

Expect, in order: complete; release original source.

Resulting state: closed. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-CATCHERROR-SOURCE-COMPLETE.

## CATCHERROR-REPLACEMENT-NEXT

Reach **Replacement** with **replacement connected**, then provide **replacement.next**.

Expect, in order: forward replacement value.

Resulting state: await or execute selected source. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-CATCHERROR-REPLACEMENT-NEXT.

## CATCHERROR-REPLACEMENT-COMPLETE

Reach **Replacement** with **replacement connected**, then provide **replacement.complete**.

Expect, in order: complete; release replacement.

Resulting state: closed. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-CATCHERROR-REPLACEMENT-COMPLETE.

## CATCHERROR-REPLACEMENT-ERROR

Reach **Replacement** with **replacement connected**, then provide **replacement.error**.

Expect, in order: propagate replacement error; release replacement.

Resulting state: closed. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-CATCHERROR-REPLACEMENT-ERROR.

## CATCHERROR-CANCEL-SOURCE

Reach **Source** with **active subscription**, then provide **cancel**.

Expect, in order: unsubscribe current resource without output.

Resulting state: closed. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-CATCHERROR-CANCEL-SOURCE.

## CATCHERROR-CANCEL-CALLING

Reach **Calling** with **active subscription**, then provide **cancel**.

Expect, in order: unsubscribe current resource without output.

Resulting state: closed. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-CATCHERROR-CANCEL-CALLING.

## CATCHERROR-CANCEL-REPLACEMENT

Reach **Replacement** with **active subscription**, then provide **cancel**.

Expect, in order: unsubscribe current resource without output.

Resulting state: closed. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-CATCHERROR-CANCEL-REPLACEMENT.
