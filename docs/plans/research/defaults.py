import json, urllib.request, time
def info(body):
    for i in range(6):
        try:
            req=urllib.request.Request("https://api.hyperliquid.xyz/info", data=json.dumps(body).encode(), headers={"content-type":"application/json"})
            return json.load(urllib.request.urlopen(req, timeout=20))
        except urllib.error.HTTPError as e:
            if e.code!=429: raise
            time.sleep(4*(i+1))
modes=json.load(open("modes.json"))
n=0
for a,m in modes:
    if m not in ("default","disabled"): continue
    main=info({"type":"clearinghouseState","user":a}); time.sleep(0.35)
    spot=info({"type":"spotClearinghouseState","user":a}); time.sleep(0.35)
    usdc=next((b["total"] for b in spot.get("balances",[]) if b["coin"]=="USDC"),"0")
    if float(main["withdrawable"])<50 and float(usdc)<50: continue
    aad=info({"type":"activeAssetData","user":a,"coin":"xyz:NVDA"}); time.sleep(0.35)
    xyz=info({"type":"clearinghouseState","user":a,"dex":"xyz"}); time.sleep(0.35)
    print(json.dumps({"mode":m,"mainW":main["withdrawable"],"spotUSDC":usdc,"xyzW":xyz["withdrawable"],"avail":aad.get("availableToTrade")}),flush=True)
    n+=1
    if n>=14: break
