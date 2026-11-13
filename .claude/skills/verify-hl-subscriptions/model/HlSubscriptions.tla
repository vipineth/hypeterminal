--------------------------- MODULE HlSubscriptions ---------------------------
(* One l2Book key in packages/hl-react/src/store.ts, driven by useSub hooks,
   on top of WebSocketSubscriptionManager from @nktkas/hyperliquid 0.32.2.
   Each action is one JS macrotask; RunMicrotask is one promise continuation.
   File and line refs are to HEAD 1b50aa2 and the SDK's src/ folder. *)
EXTENDS Naturals, Sequences, FiniteSets

CONSTANTS MaxHooks, MountOps, Drops, ReqFails, VisFlips, MaxAttempts, MaxL

VARIABLE s
vars == <<s>>

NoRt == [on |-> FALSE, ref |-> 0, sub |-> 0, promise |-> 0, timer |-> FALSE,
         cooldown |-> FALSE, attempts |-> 0, failL |-> FALSE]
NoEntry == [on |-> FALSE, status |-> "none", stale |-> FALSE, expired |-> FALSE]
NoWd == [on |-> FALSE, had |-> FALSE, stale |-> FALSE]
NoSdk == [req |-> "none", kind |-> "none", aborted |-> FALSE]

Item(k, l, ok) == [k |-> k, l |-> l, ok |-> ok]

Init == s = [hooks |-> 0, task |-> "idle", micro |-> <<>>, calls |-> <<>>,
             rt |-> NoRt, entry |-> NoEntry, wd |-> NoWd,
             vis |-> "visible", wasHidden |-> FALSE, buffered |-> FALSE, bufExpired |-> FALSE,
             sock |-> "open", serverSub |-> FALSE,
             sdk |-> NoSdk, lis |-> {}, orphan |-> FALSE,
             mounts |-> MountOps, drops |-> Drops, fails |-> ReqFails, flips |-> VisFlips]

(* A listener is held while a subscribe() call, runtime.subscription or a
   pending `pending.then(runUnsubscribe)` (store.ts L458) can still remove it. *)
Held(t, l) ==
  \/ t.rt.sub = l
  \/ \E i \in 1..Len(t.calls) : t.calls[i].l = l
  \/ \E i \in 1..Len(t.micro) : t.micro[i].k = "chain" /\ t.micro[i].l = l

SdkHas(t) == t.lis # {} \/ t.orphan
Wire(t) == t.sock = "open" /\ t.serverSub /\ SdkHas(t)

GC(t) == [t EXCEPT !.lis = {l \in t.lis : Held(t, l)},
                   !.orphan = t.orphan \/ \E l \in t.lis : ~Held(t, l)]

FreeId(t) == CHOOSE l \in 1..MaxL : l \notin t.lis /\ ~Held(t, l)

SetStatus(t, st) == IF t.entry.on THEN [t EXCEPT !.entry.status = st] ELSE t

(* SDK unsubscribe closure, _subscriptionManager.ts L107-122 *)
Unsub(t, l) ==
  IF l \notin t.lis THEN t
  ELSE IF t.lis = {l} /\ ~t.orphan
       THEN [t EXCEPT !.lis = {}, !.sdk = NoSdk, !.serverSub = FALSE, !.rt.failL = FALSE]
       ELSE [t EXCEPT !.lis = @ \ {l}]

(* scheduleReconnect, store.ts L239-312. attempts saturates at MaxAttempts+1. *)
ScheduleReconnect(t) ==
  IF ~t.rt.on \/ t.rt.ref = 0 \/ t.rt.timer \/ t.rt.promise # 0 \/ t.rt.sub # 0 THEN t
  ELSE LET a == IF t.rt.attempts > MaxAttempts THEN t.rt.attempts ELSE t.rt.attempts + 1
       IN IF a > MaxAttempts
          THEN IF t.rt.cooldown THEN [t EXCEPT !.rt.attempts = a]
               ELSE SetStatus([t EXCEPT !.rt.attempts = a, !.rt.cooldown = TRUE], "error")
          ELSE [t EXCEPT !.rt.attempts = a, !.rt.timer = TRUE]

(* startSubscription, store.ts L314-318, calling useSub's subscribe with a
   fresh listener (useSub.ts L77-86) into SDK subscribe L69-131: the listener
   is added before the await, and a call joins an existing id's promise. *)
StartSub(t) ==
  IF ~t.rt.on \/ t.rt.ref = 0 \/ t.rt.promise # 0 \/ t.rt.sub # 0 THEN t
  ELSE LET l  == FreeId(t)
           t1 == IF SdkHas(t) THEN t
                 ELSE [t EXCEPT !.sdk = [req |-> "pending", kind |-> "initial", aborted |-> FALSE]]
           waiting == t1.sdk.req = "pending"
           t2 == [t1 EXCEPT !.lis = @ \cup {l}, !.rt.promise = l,
                            !.calls = Append(@, [l |-> l, chained |-> FALSE, queued |-> ~waiting])]
       IN IF waiting THEN t2
          ELSE [t2 EXCEPT !.micro = Append(@, Item("settle", l, t2.sdk.req = "ok"))]

(* acquireSubscription, store.ts L172-237 *)
Acquire(t) ==
  LET t1 == IF t.rt.on THEN t
            ELSE [t EXCEPT !.rt = [NoRt EXCEPT !.on = TRUE],
                           !.wd = [on |-> TRUE, had |-> FALSE, stale |-> FALSE]]
      t2 == [t1 EXCEPT !.rt.ref = @ + 1, !.rt.timer = FALSE, !.rt.cooldown = FALSE]
      t3 == IF t2.entry.on /\ t2.entry.status # "error" THEN t2
            ELSE [t2 EXCEPT !.entry = [on |-> TRUE, status |-> "subscribing", stale |-> FALSE, expired |-> FALSE],
                            !.buffered = FALSE, !.bufExpired = FALSE]
  IN StartSub(t3)

(* releaseSubscription, store.ts L414-460, with detachSingletons L154-164 *)
Release(t) ==
  IF ~t.rt.on THEN t
  ELSE IF t.rt.ref > 1 THEN [t EXCEPT !.rt.ref = @ - 1]
  ELSE LET sub  == t.rt.sub
           pend == t.rt.promise
           t1 == [t EXCEPT !.rt = NoRt, !.wd = NoWd, !.entry = NoEntry,
                           !.buffered = FALSE, !.bufExpired = FALSE, !.wasHidden = FALSE]
       IN IF sub # 0
          THEN IF sub \in t.lis /\ t.sdk.aborted THEN t1 ELSE Unsub(t1, sub)
          ELSE IF pend # 0
               THEN [t1 EXCEPT !.calls = [i \in 1..Len(t1.calls) |->
                        IF t1.calls[i].l = pend THEN [t1.calls[i] EXCEPT !.chained = TRUE]
                        ELSE t1.calls[i]]]
               ELSE t1

(* .then continuation, store.ts L319-384. It looks the runtime up by key. *)
Resolved(t, l) ==
  IF ~t.rt.on THEN Unsub(t, l)
  ELSE LET t1 == [t EXCEPT !.rt.promise = 0]
       IN IF t1.rt.ref = 0 THEN Unsub(t1, l)
          ELSE SetStatus([t1 EXCEPT !.rt.sub = l, !.rt.attempts = 0, !.rt.failL = TRUE], "active")

(* .catch continuation, store.ts L385-409 *)
Rejected(t) ==
  IF ~t.rt.on THEN t
  ELSE ScheduleReconnect(SetStatus([t EXCEPT !.rt.promise = 0, !.rt.sub = 0, !.rt.failL = FALSE], "error"))

SettleCall(t, it) ==
  LET c  == CHOOSE i \in 1..Len(t.calls) : t.calls[i].l = it.l
      chained == t.calls[c].chained
      t0 == [t EXCEPT !.calls = SelectSeq(@, LAMBDA x : x.l # it.l)]
      t1 == IF it.ok THEN Resolved(t0, it.l) ELSE Rejected(t0)
  IN IF chained THEN [t1 EXCEPT !.micro = Append(@, Item("chain", IF it.ok THEN it.l ELSE 0, FALSE))]
     ELSE t1

(* runUnsubscribe, store.ts L450-453 *)
Chain(t, l) ==
  IF l = 0 THEN t
  ELSE IF l \in t.lis /\ t.sdk.aborted THEN t
  ELSE Unsub(t, l)

(* onFailure, store.ts L337-357, fired by the shared failureSignal *)
OnFailure(t) ==
  IF t.rt.on /\ t.rt.failL
  THEN ScheduleReconnect(SetStatus([t EXCEPT !.rt.sub = 0, !.rt.failL = FALSE], "error"))
  ELSE t

Abort(t) == IF t.sdk.aborted THEN t ELSE OnFailure([t EXCEPT !.sdk.aborted = TRUE])

QueueWaiting(t, ok) ==
  LET w == SelectSeq(t.calls, LAMBDA c : ~c.queued)
  IN [t EXCEPT !.calls = [i \in 1..Len(t.calls) |-> [t.calls[i] EXCEPT !.queued = TRUE]],
               !.micro = @ \o [i \in 1..Len(w) |-> Item("settle", w[i].l, ok)]]

(* The pending subscribe request rejects: _postRequest.ts L162-169 on close,
   or a timeout or error reply. A resubscribe's rejection aborts the shared
   controller and then resolves, _subscriptionManager.ts L150-152. *)
RequestFails(t) ==
  IF t.sdk.req # "pending" THEN t
  ELSE IF t.sdk.kind = "initial"
       THEN QueueWaiting([t EXCEPT !.sdk.req = "rejected"], FALSE)
       ELSE QueueWaiting(Abort([t EXCEPT !.sdk.req = "ok"]), TRUE)

Expire(t) == [t EXCEPT !.entry.expired = t.entry.on, !.bufExpired = t.buffered]

(* socket close event via config.subscribeSocketClose (clients.ts
   createWsCloseSubscriber) into markAllStale in store.ts *)
SockClose(t) ==
  IF t.sock = "open"
  THEN RequestFails(Expire([t EXCEPT !.sock = "closed", !.serverSub = FALSE,
                                       !.entry.stale = t.entry.on \/ @]))
  ELSE t

(* setSubscriptionData, store.ts L461-487; l2Book pauses while hidden *)
SetData(t) ==
  LET t1 == IF t.wd.on THEN [t EXCEPT !.wd.had = TRUE, !.wd.stale = FALSE] ELSE t
  IN IF t1.vis = "hidden" THEN [t1 EXCEPT !.buffered = TRUE, !.bufExpired = FALSE]
     ELSE IF t1.entry.on THEN [t1 EXCEPT !.entry.status = "active", !.entry.stale = FALSE, !.entry.expired = FALSE]
     ELSE t1

(* flushVisibilityBuffer in store.ts *)
Flush(t) ==
  IF t.entry.on
  THEN [t EXCEPT !.entry.status = "active", !.entry.expired = t.bufExpired, !.buffered = FALSE, !.bufExpired = FALSE]
  ELSE [t EXCEPT !.buffered = FALSE, !.bufExpired = FALSE]

Macro == s.task = "idle" /\ s.micro = <<>>

(* A React commit runs every effect cleanup and effect in one task (useSub.ts L34-88). *)
YouMount ==
  /\ s.task = "effects" \/ Macro
  /\ s.mounts > 0 /\ s.hooks < MaxHooks
  /\ s' = GC([Acquire([s EXCEPT !.hooks = @ + 1, !.mounts = @ - 1]) EXCEPT !.task = "effects"])

YouUnmount ==
  /\ s.task = "effects" \/ Macro
  /\ s.mounts > 0 /\ s.hooks > 0
  /\ s' = GC([Release([s EXCEPT !.hooks = @ - 1, !.mounts = @ - 1]) EXCEPT !.task = "effects"])

CommitEnds == s.task = "effects" /\ s' = [s EXCEPT !.task = "idle"]

RunMicrotask ==
  /\ s.task = "idle" /\ s.micro # <<>>
  /\ LET it == Head(s.micro)
         t  == [s EXCEPT !.micro = Tail(@)]
     IN s' = GC(IF it.k = "settle" THEN SettleCall(t, it) ELSE Chain(t, it.l))

(* reconnectTimer callback, store.ts L293-311 *)
RetryTimerFires ==
  /\ Macro /\ s.rt.timer
  /\ s' = GC(StartSub(SetStatus([s EXCEPT !.rt.timer = FALSE], "subscribing")))

(* cooldownTimer callback, store.ts L269-288 *)
CooldownEnds ==
  /\ Macro /\ s.rt.cooldown
  /\ s' = GC(StartSub(SetStatus([s EXCEPT !.rt.cooldown = FALSE, !.rt.attempts = 0], "subscribing")))

SocketDrops ==
  /\ Macro /\ s.drops > 0 /\ s.sock = "open"
  /\ s' = GC(SockClose([s EXCEPT !.drops = @ - 1]))

RequestTimesOut ==
  /\ Macro /\ s.fails > 0 /\ s.sdk.req = "pending"
  /\ s' = GC(RequestFails([s EXCEPT !.fails = @ - 1]))

(* rews reconnects, then _handleOpen resubscribes finished ids, _subscriptionManager.ts L145-157 *)
SocketReopens ==
  /\ Macro /\ s.sock = "closed"
  /\ s' = IF SdkHas(s) /\ s.sdk.req \in {"ok", "rejected"}
          THEN [s EXCEPT !.sock = "open", !.sdk.req = "pending", !.sdk.kind = "resub"]
          ELSE [s EXCEPT !.sock = "open"]

ServerAcks ==
  /\ Macro /\ s.sock = "open" /\ s.sdk.req = "pending"
  /\ s' = GC(QueueWaiting([s EXCEPT !.sdk.req = "ok", !.serverSub = TRUE], TRUE))

ServerPushesBook ==
  /\ Macro /\ Wire(s)
  /\ s' = SetData(s)

(* staleness tick, staleness.ts L35-47, then the store's listener store.ts L201-209
   and triggerReconnect, clients.ts L60-66 *)
WatchdogFires ==
  /\ Macro /\ s.wd.on /\ s.wd.had /\ ~s.wd.stale /\ ~Wire(s)
  /\ s' = GC(SockClose(Expire([s EXCEPT !.wd.stale = TRUE,
                                          !.entry.stale = IF s.entry.on THEN TRUE ELSE @])))

(* visibility listener, store.ts L134-142 *)
TabHides ==
  /\ Macro /\ s.flips > 0 /\ s.vis = "visible"
  /\ s' = [s EXCEPT !.flips = @ - 1, !.vis = "hidden", !.wasHidden = s.rt.on \/ @]

TabShows ==
  /\ Macro /\ s.flips > 0 /\ s.vis = "hidden"
  /\ LET t == [s EXCEPT !.flips = @ - 1, !.vis = "visible"]
     IN s' = IF t.rt.on /\ t.wasHidden
             THEN GC(SockClose(IF t.buffered THEN Flush([t EXCEPT !.wasHidden = FALSE])
                               ELSE [t EXCEPT !.wasHidden = FALSE]))
             ELSE t

Steps ==
  \/ YouMount \/ YouUnmount \/ CommitEnds \/ RunMicrotask
  \/ RetryTimerFires \/ CooldownEnds
  \/ SocketDrops \/ RequestTimesOut \/ SocketReopens \/ ServerAcks \/ ServerPushesBook
  \/ WatchdogFires \/ TabHides \/ TabShows

(* Budgets spent and nothing pending: a legal resting state, not a deadlock. *)
NothingLeftToHappen == ~ENABLED Steps /\ UNCHANGED vars

Next == Steps \/ NothingLeftToHappen

(* Macrotasks are enabled only while the microtask queue is empty, so a
   pending timer or socket event needs strong fairness to be sure to run. *)
Fairness ==
  /\ WF_vars(CommitEnds) /\ WF_vars(RunMicrotask)
  /\ SF_vars(RetryTimerFires) /\ SF_vars(CooldownEnds)
  /\ SF_vars(SocketReopens) /\ SF_vars(ServerAcks) /\ SF_vars(ServerPushesBook)
  /\ SF_vars(WatchdogFires)

Spec == Init /\ [][Next]_vars /\ Fairness

-----------------------------------------------------------------------------
Quiet == s.task = "idle" /\ s.micro = <<>> /\ s.calls = <<>>

(* After the last hook unmounts and nothing is in flight, the SDK keeps no listener. *)
NoLeakAfterUnmount == (Quiet /\ s.hooks = 0) => ~SdkHas(s)

(* The SDK never holds a listener that nothing in the store can remove. *)
NoOrphanListener == ~s.orphan

(* Once the queue drains, runtime.subscription is a listener the SDK still holds. *)
StoreHandleLive == (s.rt.on /\ s.rt.sub # 0 /\ s.micro = <<>>) => s.rt.sub \in s.lis

(* refCount equals the number of mounted hooks. *)
RefCountMatchesHooks == /\ s.rt.on => s.rt.ref = s.hooks
                        /\ s.hooks > 0 => s.rt.on

(* Model sanity: a modeling error, not a product bug, when this breaks. *)
ModelConsistent ==
  /\ (s.sdk.req = "none") = ~SdkHas(s)
  /\ s.rt.promise # 0 => \E i \in 1..Len(s.calls) : s.calls[i].l = s.rt.promise
  /\ Len(s.calls) <= MaxL

(* An entry that says active and not stale shows data pushed since the last close or watchdog expiry. *)
LiveClaimIsFresh == (s.entry.on /\ s.entry.status = "active" /\ ~s.entry.stale) => ~s.entry.expired

(* A stale entry in a visible tab on a streaming socket ends up not stale. *)
StaleClearsOnLiveWire ==
  (s.entry.on /\ s.entry.stale /\ s.vis = "visible" /\ Wire(s))
    ~> (~s.entry.stale \/ ~s.entry.on \/ s.vis = "hidden" \/ ~Wire(s))

(* With the network healthy again and the tab visible, a mounted book gets live data and says so. *)
EventuallyLive == <>[]((s.hooks > 0 /\ s.vis = "visible") => (Wire(s) /\ s.entry.status = "active" /\ ~s.entry.stale))
=============================================================================
