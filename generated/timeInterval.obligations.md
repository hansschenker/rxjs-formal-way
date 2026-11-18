# timeInterval-external-clock: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session21-clock-rxjs.test.mjs, tests/session21-clock-differential.test.mjs.

## S21-TIMEINTERVAL-START-READ

Reach **Unsubscribed** with **first result connection**, then provide **subscribe**.

Expect, in order: request scheduler.now before source acquisition.

Resulting state: ReadingStart for read zero; no source subscription exists yet.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-TIMEINTERVAL-START-READ.

## S21-TIMEINTERVAL-START-RETURN

Reach **ReadingStart** with **matching initial read returns a finite number**, then provide **clock.return**.

Expect, in order: subscribe source.

Resulting state: Listening with previous=reading and nextRead=1.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-TIMEINTERVAL-START-RETURN.

## S21-TIMEINTERVAL-START-THROW

Reach **ReadingStart** with **matching initial read throws**, then provide **clock.throw**.

Expect, in order: forward exact provider error without acquiring source.

Resulting state: Closed error; no source resource requires release.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-TIMEINTERVAL-START-THROW.

## S21-TIMEINTERVAL-NEXT-READ

Reach **Listening** with **source is live and next read index can advance safely**, then provide **source.next**.

Expect, in order: retain exact value and request provider.now.

Resulting state: ReadingNext with the source value and correlated read index retained.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-TIMEINTERVAL-NEXT-READ.

## S21-TIMEINTERVAL-NEXT-RETURN

Reach **ReadingNext** with **matching read is finite and reading minus previous remains finite**, then provide **clock.return**.

Expect, in order: emit a fresh record containing the same value and reading minus previous.

Resulting state: Listening with previous replaced by this reading and nextRead advanced.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-TIMEINTERVAL-NEXT-RETURN.

## S21-TIMEINTERVAL-NEXT-THROW

Reach **ReadingNext** with **matching next-value read throws**, then provide **clock.throw**.

Expect, in order: forward exact provider error; release source without forwarding pending value.

Resulting state: Closed error; pending value and baseline are discarded.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-TIMEINTERVAL-NEXT-THROW.

## S21-TIMEINTERVAL-COMPLETE

Reach **Listening** with **source completes while no read is pending**, then provide **source.complete**.

Expect, in order: complete downstream; release source; perform no clock read.

Resulting state: Closed complete with no retained memory.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-TIMEINTERVAL-COMPLETE.

## S21-TIMEINTERVAL-ERROR

Reach **Listening** with **source fails while no read is pending**, then provide **source.error**.

Expect, in order: forward exact source error; release source; perform no clock read.

Resulting state: Closed error with no retained memory.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-TIMEINTERVAL-ERROR.

## S21-TIMEINTERVAL-CANCEL

Reach **Listening** with **consumer cancels between source reactions**, then provide **cancel**.

Expect, in order: release source silently; perform no clock read.

Resulting state: Closed cancel; memory discarded.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-TIMEINTERVAL-CANCEL.
