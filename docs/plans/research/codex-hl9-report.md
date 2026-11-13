**HL-9: four verified findings**

Worktree: `/Users/ankit/Documents/make/hypeterminal-wt/hl-9-agent-nonce`, base `main`. All commands run from this audit directory with Node v26.0.0. Reproductions import the actual worktree code, use independent tab-local managers and native Web Locks, and control time and lane selection deterministically. The reload test ends a native lock callback to model tab destruction.

Admission results use a local implementation of [Hyperliquid's documented nonce rules](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets), checked 2026-11-13. No signatures were produced, no exchange requests were sent, and the worktree remains unchanged. Each command below passed assertions confirming the failure and was rerun.

1. **[P1] Missing, rejected, or exhausted locks silently enable duplicate nonces.**

   Location: [nonce.ts:35](/Users/ankit/Documents/make/hypeterminal-wt/hl-9-agent-nonce/packages/hl-react/src/signing/nonce.ts:35), catch/exhaustion returns at lines 43–45, and the per-instance counter at lines 54–60.

   Every fallback manager starts an independent stride-1 sequence. Two tabs without locks return the same nonce in the same millisecond. Fallback also overlaps an existing lane-0 owner: the seventeenth manager duplicates its first nonce, and a rejected/throwing lock request does likewise.

```text
$ node repro.mjs exhaustion
exhaustion: {"leasedTabs":16,"lane0":1800000000000,"extraTab":1800000000000,"duplicate":true}

$ node repro.mjs missing
missing navigator.locks: {"nonces":[1800000000000,1800000000000],"duplicate":true}

$ node repro.mjs denied
denied: {"fallbackNonces":[1800000000000,1800000000000],"lane0":1800000000000,"duplicate":true}

$ node repro.mjs throwing
throwing: {"fallbackNonces":[1800000000000,1800000000000],"lane0":1800000000000,"duplicate":true}
```

   Actual integration through `clients.ts` and installed SDK 0.33.3 also reaches both agent signing boundaries and both main-wallet approval prompts with duplicate nonces. Fake wallets throw before generating any signature.

```text
$ NODE_NO_WARNINGS=1 node sdk-probe.mjs missing
{"mode":"missing","sdkNonceCalls":4,"agentNonces":[1800000000000,1800000000000],"mainNonces":[1800000000000,1800000000000],"mainPrimaryTypes":["HyperliquidTransaction:ApproveAgent","HyperliquidTransaction:ApproveAgent"],"callbackAddressesLowercase":true,"agentPrompts":2,"signaturesProduced":0,"networkAttempts":0}
```

   The SDK's `executeWithShell` calls the configured manager with the lowercase signer address before building/signing. Its semaphore does not supply a shared nonce counter across tab-local managers. Thus these duplicate values reach signing, violating uniqueness per signer. The main-wallet path is affected too.

2. **[P1] Distinct lanes can still issue a nonce below the stored-100 floor.**

   Location: [nonce.ts:59](/Users/ankit/Documents/make/hypeterminal-wt/hl-9-agent-nonce/packages/hl-react/src/signing/nonce.ts:59).

   One tab issues 201 nonces while the simulated clock advances 5 ms per action. Each nonce passes the local admission model. A second tab then requests its next nonce 5 ms later.

```text
$ node repro.mjs burst
burst: {"fastActions":201,"elapsedMs":1005,"fastFirst":1800000000000,"fastLast":1800000003200,"slowFirst":1800000000001,"stored100Min":1800000001616,"slowLater":1800000001009,"unused":true,"insideTimeWindow":true,"result":"below stored-100 floor"}
```

   The slower tab returns `1800000001009`, below the smallest of the signer's 100 highest stored nonces, `1800000001616`. Its nonce is unused and inside the time window but still invalid. A lane separates residues; its local counter has no knowledge of the other tab's progress. This breaks the validity requirement with working locks and only two tabs.

3. **[P1] Releasing and reacquiring a lane reissues previously allocated nonces.**

   Location: [nonce.ts:40](/Users/ankit/Documents/make/hypeterminal-wt/hl-9-agent-nonce/packages/hl-react/src/signing/nonce.ts:40) and the fresh in-memory `last` map at line 54.

   A tab issues 20 nonces over 95 simulated milliseconds. Another tab holds a separate lane. The first tab closes, releasing its native lock; its replacement reacquires that lane at elapsed time 100 ms.

```text
$ node repro.mjs reload
reload: {"oldTabLast":1800000000304,"otherTab":1800000000097,"elapsedMs":100,"reloadedTab":1800000000112,"previouslyIssuedAtIndex":7,"duplicate":true}
```

   The replacement issues `1800000000112`, already allocated by the old tab at index 7. The lock protects simultaneous lane ownership but retains no counter watermark after ownership ends. With those earlier actions signed, the replacement signs a duplicate nonce. Random lane selection cannot guarantee avoidance of this reachable reuse.

4. **[P3, synthetic stress] The counter can advance to the forbidden one-day upper boundary.**

   Location: [nonce.ts:59](/Users/ankit/Documents/make/hypeterminal-wt/hl-9-agent-nonce/packages/hl-react/src/signing/nonce.ts:59).

   At a synthetic sustained 1,000 allocations/second, the simulated clock advances 1 ms per allocation while lane-0 nonces advance 16 ms. After 5,760,001 calls over 96 simulated minutes:

```text
$ node repro.mjs window
window stress: {"calls":5760001,"elapsedMs":5760000,"now":1800005760000,"nonce":1800092160000,"upperExclusive":1800092160000,"result":"outside time window"}
```

   The returned nonce equals `T + 1 day`, which is outside the documented open interval. There is no upper-window guard or backpressure. This proves the allocator lacks the requested bound under that stress workload; the run does not establish that the exchange would accept this request rate.

