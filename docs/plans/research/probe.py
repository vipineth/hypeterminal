import json, urllib.request, sys
def info(body):
    req=urllib.request.Request("https://api.hyperliquid.xyz/info", data=json.dumps(body).encode(), headers={"content-type":"application/json"})
    return json.load(urllib.request.urlopen(req, timeout=20))
seen={}
for a in open(sys.argv[1]).read().split():
    try:
        mode=info({"type":"userAbstraction","user":a})
    except Exception as e:
        mode=f"err {e}"
    if seen.get(str(mode),0)>=3: continue
    seen[str(mode)]=seen.get(str(mode),0)+1
    aad=info({"type":"activeAssetData","user":a,"coin":"xyz:NVDA"})
    main=info({"type":"clearinghouseState","user":a})
    xyz=info({"type":"clearinghouseState","user":a,"dex":"xyz"})
    spot=info({"type":"spotClearinghouseState","user":a})
    usdc=[b for b in spot.get("balances",[]) if b["coin"]=="USDC"]
    print(json.dumps({"mode":mode,"avail":aad.get("availableToTrade"),"maxSz":aad.get("maxTradeSzs"),"lev":aad.get("leverage"),
      "mainWithdrawable":main.get("withdrawable"),"xyzWithdrawable":xyz.get("withdrawable"),"xyzAV":xyz["marginSummary"]["accountValue"],
      "spotUSDC":usdc[0]["total"] if usdc else None}))
