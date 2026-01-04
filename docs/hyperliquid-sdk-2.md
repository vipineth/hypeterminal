# setReferrer

## POST /exchange

> Set a referral code.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/setReferrer","version":"1.0.0"},"tags":[{"name":"setReferrer"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["setReferrer"],"description":"Set a referral code.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["setReferrer"]},"code":{"type":"string","minLength":1,"maxLength":20,"description":"Referral code."}},"required":["type","code"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."},"expiresAfter":{"type":"number","minimum":0,"description":"Expiration time of the action."}},"required":["action","nonce","signature"],"description":"Set a referral code."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# spotDeploy

## POST /exchange

> Deploying HIP-1 and HIP-2 assets.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/spotDeploy","version":"1.0.0"},"tags":[{"name":"spotDeploy"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["spotDeploy"],"description":"Deploying HIP-1 and HIP-2 assets.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"anyOf":[{"type":"object","properties":{"type":{"description":"Type of action.","enum":["spotDeploy"]},"registerToken2":{"type":"object","properties":{"spec":{"type":"object","properties":{"name":{"type":"string","description":"Token name."},"szDecimals":{"type":"number","minimum":0,"description":"Number of decimals for token size."},"weiDecimals":{"type":"number","minimum":0,"description":"Number of decimals for token amounts in wei."}},"required":["name","szDecimals","weiDecimals"],"description":"Token specifications."},"maxGas":{"type":"number","minimum":0,"description":"Maximum gas allowed for registration."},"fullName":{"type":"string","description":"Optional full token name."}},"required":["spec","maxGas"],"description":"Register token parameters."}},"required":["type","registerToken2"]},{"type":"object","properties":{"type":{"description":"Type of action.","enum":["spotDeploy"]},"userGenesis":{"type":"object","properties":{"token":{"type":"number","minimum":0,"description":"Token identifier."},"userAndWei":{"type":"array","items":{"type":"array","items":[{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42},{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"Array of tuples: [user address, genesis amount in wei]."},"existingTokenAndWei":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"Array of tuples: [existing token identifier, genesis amount in wei]."},"blacklistUsers":{"type":"array","items":{"type":"array","items":[{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42},{"type":"boolean"}],"minItems":2},"description":"Array of tuples: [user address, blacklist status] (`true` for blacklist, `false` to remove existing blacklisted user)."}},"required":["token","userAndWei","existingTokenAndWei"],"description":"User genesis parameters."}},"required":["type","userGenesis"]},{"type":"object","properties":{"type":{"description":"Type of action.","enum":["spotDeploy"]},"genesis":{"type":"object","properties":{"token":{"type":"number","minimum":0,"description":"Token identifier."},"maxSupply":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Maximum token supply."},"noHyperliquidity":{"description":"Set hyperliquidity balance to 0.","enum":[true]}},"required":["token","maxSupply"],"description":"Genesis parameters."}},"required":["type","genesis"]},{"type":"object","properties":{"type":{"description":"Type of action.","enum":["spotDeploy"]},"registerSpot":{"type":"object","properties":{"tokens":{"type":"array","items":[{"type":"number","minimum":0},{"type":"number","minimum":0}],"minItems":2,"description":"Tuple containing base and quote token indices."}},"required":["tokens"],"description":"Register spot parameters."}},"required":["type","registerSpot"]},{"type":"object","properties":{"type":{"description":"Type of action.","enum":["spotDeploy"]},"registerHyperliquidity":{"type":"object","properties":{"spot":{"type":"number","minimum":0,"description":"Spot index (distinct from base token index)."},"startPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Starting price for liquidity seeding."},"orderSz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Order size as a float (not in wei)."},"nOrders":{"type":"number","minimum":0,"description":"Total number of orders to place."},"nSeededLevels":{"type":"number","minimum":0,"description":"Number of levels to seed with USDC."}},"required":["spot","startPx","orderSz","nOrders"],"description":"Register hyperliquidity parameters."}},"required":["type","registerHyperliquidity"]},{"type":"object","properties":{"type":{"description":"Type of action.","enum":["spotDeploy"]},"setDeployerTradingFeeShare":{"type":"object","properties":{"token":{"type":"number","minimum":0,"description":"Token identifier."},"share":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?%$","description":"The deployer trading fee share. Range is 0% to 100%."}},"required":["token","share"],"description":"Set deployer trading fee share parameters."}},"required":["type","setDeployerTradingFeeShare"]},{"type":"object","properties":{"type":{"description":"Type of action.","enum":["spotDeploy"]},"enableQuoteToken":{"type":"object","properties":{"token":{"type":"number","minimum":0,"description":"The token ID to convert to a quote token."}},"required":["token"],"description":"Enable quote token parameters."}},"required":["type","enableQuoteToken"]},{"type":"object","properties":{"type":{"description":"Type of action.","enum":["spotDeploy"]},"enableAlignedQuoteToken":{"type":"object","properties":{"token":{"type":"number","minimum":0,"description":"Token identifier to enable as aligned quote token."}},"required":["token"],"description":"Enable aligned quote token parameters."}},"required":["type","enableAlignedQuoteToken"]}],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."},"expiresAfter":{"type":"number","minimum":0,"description":"Expiration time of the action."}},"required":["action","nonce","signature"],"description":"Deploying HIP-1 and HIP-2 assets."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# spotSend

## POST /exchange

> Send spot assets to another address.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/spotSend","version":"1.0.0"},"tags":[{"name":"spotSend"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["spotSend"],"description":"Send spot assets to another address.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["spotSend"]},"signatureChainId":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","description":"Chain ID in hex format for EIP-712 signing."},"hyperliquidChain":{"enum":["Mainnet","Testnet"],"description":"HyperLiquid network type."},"destination":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Destination address."},"token":{"type":"string","description":"Token identifier."},"amount":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount to send (not in wei)."},"time":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."}},"required":["type","signatureChainId","hyperliquidChain","destination","token","amount","time"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."}},"required":["action","nonce","signature"],"description":"Send spot assets to another address."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# spotUser

## POST /exchange

> Opt Out of Spot Dusting.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/spotUser","version":"1.0.0"},"tags":[{"name":"spotUser"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["spotUser"],"description":"Opt Out of Spot Dusting.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["spotUser"]},"toggleSpotDusting":{"type":"object","properties":{"optOut":{"type":"boolean","description":"Opt out of spot dusting."}},"required":["optOut"],"description":"Spot dusting options."}},"required":["type","toggleSpotDusting"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."},"expiresAfter":{"type":"number","minimum":0,"description":"Expiration time of the action."}},"required":["action","nonce","signature"],"description":"Opt Out of Spot Dusting."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# subAccountModify

## POST /exchange

> Modify a sub-account.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/subAccountModify","version":"1.0.0"},"tags":[{"name":"subAccountModify"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["subAccountModify"],"description":"Modify a sub-account.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["subAccountModify"]},"subAccountUser":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Sub-account address to modify."},"name":{"type":"string","minLength":1,"maxLength":16,"description":"New sub-account name."}},"required":["type","subAccountUser","name"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."},"expiresAfter":{"type":"number","minimum":0,"description":"Expiration time of the action."}},"required":["action","nonce","signature"],"description":"Modify a sub-account."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# subAccountSpotTransfer

## POST /exchange

> Transfer between sub-accounts (spot).

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/subAccountSpotTransfer","version":"1.0.0"},"tags":[{"name":"subAccountSpotTransfer"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["subAccountSpotTransfer"],"description":"Transfer between sub-accounts (spot).","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["subAccountSpotTransfer"]},"subAccountUser":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Sub-account address."},"isDeposit":{"type":"boolean","description":"`true` for deposit, `false` for withdrawal."},"token":{"type":"string","description":"Token identifier."},"amount":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount to send (not in wei)."}},"required":["type","subAccountUser","isDeposit","token","amount"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."},"expiresAfter":{"type":"number","minimum":0,"description":"Expiration time of the action."}},"required":["action","nonce","signature"],"description":"Transfer between sub-accounts (spot)."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# subAccountTransfer

## POST /exchange

> Transfer between sub-accounts (perpetual).

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/subAccountTransfer","version":"1.0.0"},"tags":[{"name":"subAccountTransfer"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["subAccountTransfer"],"description":"Transfer between sub-accounts (perpetual).","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["subAccountTransfer"]},"subAccountUser":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Sub-account address."},"isDeposit":{"type":"boolean","description":"`true` for deposit, `false` for withdrawal."},"usd":{"type":"number","minimum":1,"description":"Amount to transfer (float * 1e6)."}},"required":["type","subAccountUser","isDeposit","usd"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."},"expiresAfter":{"type":"number","minimum":0,"description":"Expiration time of the action."}},"required":["action","nonce","signature"],"description":"Transfer between sub-accounts (perpetual)."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# tokenDelegate

## POST /exchange

> Delegate or undelegate native tokens to or from a validator.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/tokenDelegate","version":"1.0.0"},"tags":[{"name":"tokenDelegate"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["tokenDelegate"],"description":"Delegate or undelegate native tokens to or from a validator.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["tokenDelegate"]},"signatureChainId":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","description":"Chain ID in hex format for EIP-712 signing."},"hyperliquidChain":{"enum":["Mainnet","Testnet"],"description":"HyperLiquid network type."},"validator":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Validator address."},"wei":{"type":"number","minimum":1,"description":"Amount for delegate/undelegate (float * 1e8)."},"isUndelegate":{"type":"boolean","description":"`true` for undelegate, `false` for delegate."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."}},"required":["type","signatureChainId","hyperliquidChain","validator","wei","isUndelegate","nonce"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."}},"required":["action","nonce","signature"],"description":"Delegate or undelegate native tokens to or from a validator."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# twapCancel

## POST /exchange

> Cancel a TWAP order.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/twapCancel","version":"1.0.0"},"tags":[{"name":"twapCancel"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["twapCancel"],"description":"Cancel a TWAP order.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["twapCancel"]},"a":{"type":"number","minimum":0,"description":"Asset ID."},"t":{"type":"number","minimum":0,"description":"Twap ID."}},"required":["type","a","t"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."},"vaultAddress":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Vault address (for vault trading)."},"expiresAfter":{"type":"number","minimum":0,"description":"Expiration time of the action."}},"required":["action","nonce","signature"],"description":"Cancel a TWAP order."}}},"required":true},"responses":{"200":{"description":"Response for canceling a TWAP order.","content":{"application/json":{"schema":{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["twapCancel"]},"data":{"type":"object","properties":{"status":{"anyOf":[{"type":"string"},{"type":"object","properties":{"error":{"type":"string","description":"Error message."}},"required":["error"]}],"description":"Status of the operation or error message."}},"required":["status"],"description":"Specific data."}},"required":["type","data"],"description":"Response details."}},"required":["status","response"],"description":"Response for canceling a TWAP order."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# twapOrder

## POST /exchange

> Place a TWAP order.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/twapOrder","version":"1.0.0"},"tags":[{"name":"twapOrder"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["twapOrder"],"description":"Place a TWAP order.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["twapOrder"]},"twap":{"type":"object","properties":{"a":{"type":"number","minimum":0,"description":"Asset ID."},"b":{"type":"boolean","description":"Position side (`true` for long, `false` for short)."},"s":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Size (in base currency units)."},"r":{"type":"boolean","description":"Is reduce-only?"},"m":{"type":"number","minimum":5,"maximum":1440,"description":"TWAP duration in minutes."},"t":{"type":"boolean","description":"Enable random order timing."}},"required":["a","b","s","r","m","t"],"description":"Twap parameters."}},"required":["type","twap"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."},"vaultAddress":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Vault address (for vault trading)."},"expiresAfter":{"type":"number","minimum":0,"description":"Expiration time of the action."}},"required":["action","nonce","signature"],"description":"Place a TWAP order."}}},"required":true},"responses":{"200":{"description":"Response for creating a TWAP order.","content":{"application/json":{"schema":{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["twapOrder"]},"data":{"type":"object","properties":{"status":{"anyOf":[{"type":"object","properties":{"running":{"type":"object","properties":{"twapId":{"type":"number","minimum":0,"description":"TWAP ID."}},"required":["twapId"],"description":"Running order status."}},"required":["running"]},{"type":"object","properties":{"error":{"type":"string","description":"Error message."}},"required":["error"]}],"description":"Status of the operation or error message."}},"required":["status"],"description":"Specific data."}},"required":["type","data"],"description":"Response details."}},"required":["status","response"],"description":"Response for creating a TWAP order."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# updateIsolatedMargin

## POST /exchange

> Add or remove margin from isolated position.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/updateIsolatedMargin","version":"1.0.0"},"tags":[{"name":"updateIsolatedMargin"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["updateIsolatedMargin"],"description":"Add or remove margin from isolated position.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["updateIsolatedMargin"]},"asset":{"type":"number","minimum":0,"description":"Asset ID."},"isBuy":{"type":"boolean","description":"Position side (`true` for long, `false` for short)."},"ntli":{"type":"number","description":"Amount to adjust (float * 1e6)."}},"required":["type","asset","isBuy","ntli"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."},"vaultAddress":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Vault address (for vault trading)."},"expiresAfter":{"type":"number","minimum":0,"description":"Expiration time of the action."}},"required":["action","nonce","signature"],"description":"Add or remove margin from isolated position."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# updateLeverage

## POST /exchange

> Update cross or isolated leverage on a coin.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/updateLeverage","version":"1.0.0"},"tags":[{"name":"updateLeverage"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["updateLeverage"],"description":"Update cross or isolated leverage on a coin.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["updateLeverage"]},"asset":{"type":"number","minimum":0,"description":"Asset ID."},"isCross":{"type":"boolean","description":"`true` for cross leverage, `false` for isolated leverage."},"leverage":{"type":"number","minimum":1,"description":"New leverage value."}},"required":["type","asset","isCross","leverage"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."},"vaultAddress":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Vault address (for vault trading)."},"expiresAfter":{"type":"number","minimum":0,"description":"Expiration time of the action."}},"required":["action","nonce","signature"],"description":"Update cross or isolated leverage on a coin."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# usdClassTransfer

## POST /exchange

> Transfer funds between Spot account and Perp account.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/usdClassTransfer","version":"1.0.0"},"tags":[{"name":"usdClassTransfer"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["usdClassTransfer"],"description":"Transfer funds between Spot account and Perp account.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["usdClassTransfer"]},"signatureChainId":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","description":"Chain ID in hex format for EIP-712 signing."},"hyperliquidChain":{"enum":["Mainnet","Testnet"],"description":"HyperLiquid network type."},"amount":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount to transfer (1 = $1)."},"toPerp":{"type":"boolean","description":"`true` for Spot to Perp, `false` for Perp to Spot."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."}},"required":["type","signatureChainId","hyperliquidChain","amount","toPerp","nonce"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."}},"required":["action","nonce","signature"],"description":"Transfer funds between Spot account and Perp account."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# usdSend

## POST /exchange

> Send usd to another address.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/usdSend","version":"1.0.0"},"tags":[{"name":"usdSend"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["usdSend"],"description":"Send usd to another address.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["usdSend"]},"signatureChainId":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","description":"Chain ID in hex format for EIP-712 signing."},"hyperliquidChain":{"enum":["Mainnet","Testnet"],"description":"HyperLiquid network type."},"destination":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Destination address."},"amount":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount to send (1 = $1)."},"time":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."}},"required":["type","signatureChainId","hyperliquidChain","destination","amount","time"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."}},"required":["action","nonce","signature"],"description":"Send usd to another address."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# userDexAbstraction

## POST /exchange

> Enable/disable HIP-3 DEX abstraction.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/userDexAbstraction","version":"1.0.0"},"tags":[{"name":"userDexAbstraction"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["userDexAbstraction"],"description":"Enable/disable HIP-3 DEX abstraction.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["userDexAbstraction"]},"signatureChainId":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","description":"Chain ID in hex format for EIP-712 signing."},"hyperliquidChain":{"enum":["Mainnet","Testnet"],"description":"HyperLiquid network type."},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."},"enabled":{"type":"boolean","description":"Whether to enable or disable HIP-3 DEX abstraction."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."}},"required":["type","signatureChainId","hyperliquidChain","user","enabled","nonce"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."}},"required":["action","nonce","signature"],"description":"Enable/disable HIP-3 DEX abstraction."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# validatorL1Stream

## POST /exchange

> Validator vote on risk-free rate for aligned quote asset.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/validatorL1Stream","version":"1.0.0"},"tags":[{"name":"validatorL1Stream"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["validatorL1Stream"],"description":"Validator vote on risk-free rate for aligned quote asset.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["validatorL1Stream"]},"riskFreeRate":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Risk-free rate as a decimal string (e.g., \"0.05\" for 5%)."}},"required":["type","riskFreeRate"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."},"expiresAfter":{"type":"number","minimum":0,"description":"Expiration time of the action."}},"required":["action","nonce","signature"],"description":"Validator vote on risk-free rate for aligned quote asset."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# vaultDistribute

## POST /exchange

> Distribute funds from a vault between followers.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/vaultDistribute","version":"1.0.0"},"tags":[{"name":"vaultDistribute"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["vaultDistribute"],"description":"Distribute funds from a vault between followers.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["vaultDistribute"]},"vaultAddress":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Vault address."},"usd":{"type":"number","minimum":0,"description":"Amount to distribute (float * 1e6).\nSet to 0 to close the vault."}},"required":["type","vaultAddress","usd"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."},"expiresAfter":{"type":"number","minimum":0,"description":"Expiration time of the action."}},"required":["action","nonce","signature"],"description":"Distribute funds from a vault between followers."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# vaultModify

## POST /exchange

> Modify a vault's configuration.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/vaultModify","version":"1.0.0"},"tags":[{"name":"vaultModify"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["vaultModify"],"description":"Modify a vault's configuration.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["vaultModify"]},"vaultAddress":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Vault address."},"allowDeposits":{"anyOf":[{"type":"boolean","nullable":true}],"description":"Allow deposits from followers."},"alwaysCloseOnWithdraw":{"anyOf":[{"type":"boolean","nullable":true}],"description":"Always close positions on withdrawal."}},"required":["type","vaultAddress"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."},"expiresAfter":{"type":"number","minimum":0,"description":"Expiration time of the action."}},"required":["action","nonce","signature"],"description":"Modify a vault's configuration."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# vaultTransfer

## POST /exchange

> Deposit or withdraw from a vault.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/vaultTransfer","version":"1.0.0"},"tags":[{"name":"vaultTransfer"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["vaultTransfer"],"description":"Deposit or withdraw from a vault.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["vaultTransfer"]},"vaultAddress":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Vault address."},"isDeposit":{"type":"boolean","description":"`true` for deposit, `false` for withdrawal."},"usd":{"type":"number","minimum":1,"description":"Amount for deposit/withdrawal (float * 1e6)."}},"required":["type","vaultAddress","isDeposit","usd"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."},"expiresAfter":{"type":"number","minimum":0,"description":"Expiration time of the action."}},"required":["action","nonce","signature"],"description":"Deposit or withdraw from a vault."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# withdraw3

## POST /exchange

> Initiate a withdrawal request.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/withdraw3","version":"1.0.0"},"tags":[{"name":"withdraw3"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["withdraw3"],"description":"Initiate a withdrawal request.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["withdraw3"]},"signatureChainId":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","description":"Chain ID in hex format for EIP-712 signing."},"hyperliquidChain":{"enum":["Mainnet","Testnet"],"description":"HyperLiquid network type."},"destination":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Destination address."},"amount":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount to withdraw (1 = $1)."},"time":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."}},"required":["type","signatureChainId","hyperliquidChain","destination","amount","time"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."}},"required":["action","nonce","signature"],"description":"Initiate a withdrawal request."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# Subscription Methods


# activeAssetCtx

## Subscribe to activeAssetCtx

> Subscription to context events for a specific perpetual asset.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid Subscription - activeAssetCtx","version":"1.0.0"},"tags":[{"name":"activeAssetCtx"}],"servers":[{"url":"wss://api.hyperliquid.xyz/ws","description":"Mainnet WebSocket"},{"url":"wss://api.hyperliquid-testnet.xyz/ws","description":"Testnet WebSocket"}],"paths":{"/":{"post":{"tags":["activeAssetCtx"],"summary":"Subscribe to activeAssetCtx","description":"Subscription to context events for a specific perpetual asset.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of subscription.","enum":["activeAssetCtx"]},"coin":{"type":"string","description":"Asset symbol (e.g., BTC)."}},"required":["type","coin"],"description":"Subscription to context events for a specific perpetual asset."}}},"required":true},"responses":{"200":{"description":"Event of active perpetual asset context.","content":{"application/json":{"schema":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol (e.g., BTC)."},"ctx":{"type":"object","properties":{"prevDayPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Previous day's closing price."},"dayNtlVlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Daily notional volume."},"markPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Mark price."},"midPx":{"anyOf":[{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","nullable":true}],"description":"Mid price."},"funding":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Funding rate."},"openInterest":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total open interest."},"premium":{"anyOf":[{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","nullable":true}],"description":"Premium price."},"oraclePx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Oracle price."},"impactPxs":{"anyOf":[{"type":"array","items":{"type":"string"},"nullable":true}],"description":"Array of impact prices."},"dayBaseVlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Daily volume in base currency."}},"required":["prevDayPx","dayNtlVlm","markPx","midPx","funding","openInterest","premium","oraclePx","impactPxs","dayBaseVlm"],"description":"Context for a specific perpetual asset."}},"required":["coin","ctx"],"description":"Event of active perpetual asset context."}}}}}}}}}
```


# activeAssetData

## Subscribe to activeAssetData

> Subscription to active asset data events for a specific user and coin.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid Subscription - activeAssetData","version":"1.0.0"},"tags":[{"name":"activeAssetData"}],"servers":[{"url":"wss://api.hyperliquid.xyz/ws","description":"Mainnet WebSocket"},{"url":"wss://api.hyperliquid-testnet.xyz/ws","description":"Testnet WebSocket"}],"paths":{"/":{"post":{"tags":["activeAssetData"],"summary":"Subscribe to activeAssetData","description":"Subscription to active asset data events for a specific user and coin.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of subscription.","enum":["activeAssetData"]},"coin":{"type":"string","description":"Asset symbol (e.g., BTC)."},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","coin","user"],"description":"Subscription to active asset data events for a specific user and coin."}}},"required":true},"responses":{"200":{"description":"Event of user active asset data.","content":{"application/json":{"schema":{"type":"object","properties":{"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."},"coin":{"type":"string","description":"Asset symbol (e.g., BTC)."},"leverage":{"oneOf":[{"type":"object","properties":{"type":{"description":"Leverage type.","enum":["isolated"]},"value":{"type":"number","minimum":1,"description":"Leverage value used."},"rawUsd":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount of USD used (1 = $1)."}},"required":["type","value","rawUsd"]},{"type":"object","properties":{"type":{"description":"Leverage type.","enum":["cross"]},"value":{"type":"number","minimum":1,"description":"Leverage value used."}},"required":["type","value"]}],"description":"Leverage configuration."},"maxTradeSzs":{"type":"array","items":[{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"},{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"}],"minItems":2,"description":"Maximum trade size range [min, max]."},"availableToTrade":{"type":"array","items":[{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"},{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"}],"minItems":2,"description":"Available to trade range [min, max]."},"markPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Mark price."}},"required":["user","coin","leverage","maxTradeSzs","availableToTrade","markPx"],"description":"Event of user active asset data."}}}}}}}}}
```


# activeSpotAssetCtx

## Subscribe to activeSpotAssetCtx

> Subscription to context events for a specific spot asset.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid Subscription - activeSpotAssetCtx","version":"1.0.0"},"tags":[{"name":"activeSpotAssetCtx"}],"servers":[{"url":"wss://api.hyperliquid.xyz/ws","description":"Mainnet WebSocket"},{"url":"wss://api.hyperliquid-testnet.xyz/ws","description":"Testnet WebSocket"}],"paths":{"/":{"post":{"tags":["activeSpotAssetCtx"],"summary":"Subscribe to activeSpotAssetCtx","description":"Subscription to context events for a specific spot asset.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of subscription.","enum":["activeAssetCtx"]},"coin":{"type":"string","description":"Asset ID (e.g., @1)."}},"required":["type","coin"],"description":"Subscription to context events for a specific spot asset."}}},"required":true},"responses":{"200":{"description":"Event of active spot asset context.","content":{"application/json":{"schema":{"type":"object","properties":{"coin":{"type":"string","description":"Asset ID (e.g., @1)."},"ctx":{"type":"object","properties":{"prevDayPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Previous day's closing price."},"dayNtlVlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Daily notional volume."},"markPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Mark price."},"midPx":{"anyOf":[{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","nullable":true}],"description":"Mid price."},"circulatingSupply":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Circulating supply."},"coin":{"type":"string","description":"Asset symbol."},"totalSupply":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total supply."},"dayBaseVlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Daily volume in base currency."}},"required":["prevDayPx","dayNtlVlm","markPx","midPx","circulatingSupply","coin","totalSupply","dayBaseVlm"],"description":"Context for a specific spot asset."}},"required":["coin","ctx"],"description":"Event of active spot asset context."}}}}}}}}}
```


# allDexsAssetCtxs

## Subscribe to allDexsAssetCtxs

> Subscription to asset context events for all DEXs.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid Subscription - allDexsAssetCtxs","version":"1.0.0"},"tags":[{"name":"allDexsAssetCtxs"}],"servers":[{"url":"wss://api.hyperliquid.xyz/ws","description":"Mainnet WebSocket"},{"url":"wss://api.hyperliquid-testnet.xyz/ws","description":"Testnet WebSocket"}],"paths":{"/":{"post":{"tags":["allDexsAssetCtxs"],"summary":"Subscribe to allDexsAssetCtxs","description":"Subscription to asset context events for all DEXs.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of subscription.","enum":["allDexsAssetCtxs"]}},"required":["type"],"description":"Subscription to asset context events for all DEXs."}}},"required":true},"responses":{"200":{"description":"Event of asset contexts for all DEXs.","content":{"application/json":{"schema":{"type":"object","properties":{"ctxs":{"type":"array","items":{"type":"array","items":[{"type":"string"},{"type":"array","items":{"type":"object","properties":{"prevDayPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Previous day's closing price."},"dayNtlVlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Daily notional volume."},"markPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Mark price."},"midPx":{"anyOf":[{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","nullable":true}],"description":"Mid price."},"funding":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Funding rate."},"openInterest":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total open interest."},"premium":{"anyOf":[{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","nullable":true}],"description":"Premium price."},"oraclePx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Oracle price."},"impactPxs":{"anyOf":[{"type":"array","items":{"type":"string"},"nullable":true}],"description":"Array of impact prices."},"dayBaseVlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Daily volume in base currency."}},"required":["prevDayPx","dayNtlVlm","markPx","midPx","funding","openInterest","premium","oraclePx","impactPxs","dayBaseVlm"],"description":"Perpetual asset context."}}],"minItems":2},"description":"Array of tuples of dex names and contexts for each perpetual asset."}},"required":["ctxs"],"description":"Event of asset contexts for all DEXs."}}}}}}}}}
```


# allDexsClearinghouseState

## Subscribe to allDexsClearinghouseState

> Subscription to clearinghouse state events for all DEXs for a specific user.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid Subscription - allDexsClearinghouseState","version":"1.0.0"},"tags":[{"name":"allDexsClearinghouseState"}],"servers":[{"url":"wss://api.hyperliquid.xyz/ws","description":"Mainnet WebSocket"},{"url":"wss://api.hyperliquid-testnet.xyz/ws","description":"Testnet WebSocket"}],"paths":{"/":{"post":{"tags":["allDexsClearinghouseState"],"summary":"Subscribe to allDexsClearinghouseState","description":"Subscription to clearinghouse state events for all DEXs for a specific user.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of subscription.","enum":["allDexsClearinghouseState"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Subscription to clearinghouse state events for all DEXs for a specific user."}}},"required":true},"responses":{"200":{"description":"Event of clearinghouse states for all DEXs for a specific user.","content":{"application/json":{"schema":{"type":"object","properties":{"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."},"clearinghouseStates":{"type":"array","items":{"type":"array","items":[{"type":"string"},{"type":"object","properties":{"marginSummary":{"type":"object","properties":{"accountValue":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total account value."},"totalNtlPos":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total notional position value."},"totalRawUsd":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total raw USD value."},"totalMarginUsed":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total margin used."}},"required":["accountValue","totalNtlPos","totalRawUsd","totalMarginUsed"],"description":"Margin summary details."},"crossMarginSummary":{"type":"object","properties":{"accountValue":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total account value."},"totalNtlPos":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total notional position value."},"totalRawUsd":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total raw USD value."},"totalMarginUsed":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total margin used."}},"required":["accountValue","totalNtlPos","totalRawUsd","totalMarginUsed"],"description":"Cross-margin summary details."},"crossMaintenanceMarginUsed":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Maintenance margin used for cross-margin positions."},"withdrawable":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount available for withdrawal."},"assetPositions":{"type":"array","items":{"type":"object","properties":{"type":{"description":"Position type.","enum":["oneWay"]},"position":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"szi":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Signed position size."},"leverage":{"oneOf":[{"type":"object","properties":{"type":{"description":"Leverage type.","enum":["isolated"]},"value":{"type":"number","minimum":1,"description":"Leverage value used."},"rawUsd":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount of USD used (1 = $1)."}},"required":["type","value","rawUsd"]},{"type":"object","properties":{"type":{"description":"Leverage type.","enum":["cross"]},"value":{"type":"number","minimum":1,"description":"Leverage value used."}},"required":["type","value"]}],"description":"Leverage details."},"entryPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Average entry price."},"positionValue":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Position value."},"unrealizedPnl":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Unrealized profit and loss."},"returnOnEquity":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Return on equity."},"liquidationPx":{"anyOf":[{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","nullable":true}],"description":"Liquidation price."},"marginUsed":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Margin used."},"maxLeverage":{"type":"number","minimum":1,"description":"Maximum allowed leverage."},"cumFunding":{"type":"object","properties":{"allTime":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Total funding paid or received since account opening."},"sinceOpen":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Funding accumulated since the position was opened."},"sinceChange":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Funding accumulated since the last change in position size."}},"required":["allTime","sinceOpen","sinceChange"],"description":"Cumulative funding details."}},"required":["coin","szi","leverage","entryPx","positionValue","unrealizedPnl","returnOnEquity","liquidationPx","marginUsed","maxLeverage","cumFunding"],"description":"Position details."}},"required":["type","position"]},"description":"Array of asset positions."},"time":{"type":"number","minimum":0,"description":"Timestamp when data was retrieved (in ms since epoch)."}},"required":["marginSummary","crossMarginSummary","crossMaintenanceMarginUsed","withdrawable","assetPositions","time"],"description":"Account summary for perpetual trading."}],"minItems":2},"description":"Array of tuples of dex names and clearinghouse states."}},"required":["user","clearinghouseStates"],"description":"Event of clearinghouse states for all DEXs for a specific user."}}}}}}}}}
```


# allMids

## Subscribe to allMids

> Subscription to mid price events for all coins.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid Subscription - allMids","version":"1.0.0"},"tags":[{"name":"allMids"}],"servers":[{"url":"wss://api.hyperliquid.xyz/ws","description":"Mainnet WebSocket"},{"url":"wss://api.hyperliquid-testnet.xyz/ws","description":"Testnet WebSocket"}],"paths":{"/":{"post":{"tags":["allMids"],"summary":"Subscribe to allMids","description":"Subscription to mid price events for all coins.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of subscription.","enum":["allMids"]},"dex":{"type":"string","description":"DEX name (empty string for main dex)."}},"required":["type"],"description":"Subscription to mid price events for all coins."}}},"required":true},"responses":{"200":{"description":"Event of mid prices for all assets.","content":{"application/json":{"schema":{"type":"object","properties":{"mids":{"type":"object","additionalProperties":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"},"description":"Mapping of coin symbols to mid prices."},"dex":{"type":"string","description":"DEX name (empty string for main dex)."}},"required":["mids"],"description":"Event of mid prices for all assets."}}}}}}}}}
```


# assetCtxs

## Subscribe to assetCtxs

> Subscription to context events for all perpetual assets.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid Subscription - assetCtxs","version":"1.0.0"},"tags":[{"name":"assetCtxs"}],"servers":[{"url":"wss://api.hyperliquid.xyz/ws","description":"Mainnet WebSocket"},{"url":"wss://api.hyperliquid-testnet.xyz/ws","description":"Testnet WebSocket"}],"paths":{"/":{"post":{"tags":["assetCtxs"],"summary":"Subscribe to assetCtxs","description":"Subscription to context events for all perpetual assets.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of subscription.","enum":["assetCtxs"]},"dex":{"type":"string","description":"DEX name (empty string for main dex)."}},"required":["type"],"description":"Subscription to context events for all perpetual assets."}}},"required":true},"responses":{"200":{"description":"Event of asset contexts for all perpetual assets on a specified DEX.","content":{"application/json":{"schema":{"type":"object","properties":{"dex":{"type":"string","description":"DEX name (empty string for main dex)."},"ctxs":{"type":"array","items":{"type":"object","properties":{"prevDayPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Previous day's closing price."},"dayNtlVlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Daily notional volume."},"markPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Mark price."},"midPx":{"anyOf":[{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","nullable":true}],"description":"Mid price."},"funding":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Funding rate."},"openInterest":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total open interest."},"premium":{"anyOf":[{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","nullable":true}],"description":"Premium price."},"oraclePx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Oracle price."},"impactPxs":{"anyOf":[{"type":"array","items":{"type":"string"},"nullable":true}],"description":"Array of impact prices."},"dayBaseVlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Daily volume in base currency."}},"required":["prevDayPx","dayNtlVlm","markPx","midPx","funding","openInterest","premium","oraclePx","impactPxs","dayBaseVlm"],"description":"Perpetual asset context."},"description":"Array of context information for each perpetual asset."}},"required":["dex","ctxs"],"description":"Event of asset contexts for all perpetual assets on a specified DEX."}}}}}}}}}
```


# bbo

## Subscribe to bbo

> Subscription to best bid and offer events for a specific asset.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid Subscription - bbo","version":"1.0.0"},"tags":[{"name":"bbo"}],"servers":[{"url":"wss://api.hyperliquid.xyz/ws","description":"Mainnet WebSocket"},{"url":"wss://api.hyperliquid-testnet.xyz/ws","description":"Testnet WebSocket"}],"paths":{"/":{"post":{"tags":["bbo"],"summary":"Subscribe to bbo","description":"Subscription to best bid and offer events for a specific asset.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of subscription.","enum":["bbo"]},"coin":{"type":"string","description":"Asset symbol (e.g., BTC)."}},"required":["type","coin"],"description":"Subscription to best bid and offer events for a specific asset."}}},"required":true},"responses":{"200":{"description":"Event of best bid and offer.","content":{"application/json":{"schema":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol (e.g., BTC)."},"time":{"type":"number","minimum":0,"description":"Time of the BBO update (in ms since epoch)."},"bbo":{"type":"array","items":[{"type":"object","properties":{"px":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Price."},"sz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total size."},"n":{"type":"number","minimum":0,"description":"Number of individual orders."}},"required":["px","sz","n"],"description":"L2 order book level."},{"type":"object","properties":{"px":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Price."},"sz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total size."},"n":{"type":"number","minimum":0,"description":"Number of individual orders."}},"required":["px","sz","n"],"description":"L2 order book level."}],"minItems":2,"description":"Best bid and offer tuple [bid, offer], either can be undefined if unavailable."}},"required":["coin","time","bbo"],"description":"Event of best bid and offer."}}}}}}}}}
```


# candle

## Subscribe to candle

> Subscription to candlestick events for a specific asset and time interval.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid Subscription - candle","version":"1.0.0"},"tags":[{"name":"candle"}],"servers":[{"url":"wss://api.hyperliquid.xyz/ws","description":"Mainnet WebSocket"},{"url":"wss://api.hyperliquid-testnet.xyz/ws","description":"Testnet WebSocket"}],"paths":{"/":{"post":{"tags":["candle"],"summary":"Subscribe to candle","description":"Subscription to candlestick events for a specific asset and time interval.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of subscription.","enum":["candle"]},"coin":{"type":"string","description":"Asset symbol (e.g., BTC)."},"interval":{"enum":["1m","3m","5m","15m","30m","1h","2h","4h","8h","12h","1d","3d","1w","1M"],"description":"Time interval."}},"required":["type","coin","interval"],"description":"Subscription to candlestick events for a specific asset and time interval."}}},"required":true},"responses":{"200":{"description":"Event of candlestick data point.","content":{"application/json":{"schema":{"type":"object","properties":{"t":{"type":"number","minimum":0,"description":"Opening timestamp (ms since epoch)."},"T":{"type":"number","minimum":0,"description":"Closing timestamp (ms since epoch)."},"s":{"type":"string","description":"Asset symbol."},"i":{"enum":["1m","3m","5m","15m","30m","1h","2h","4h","8h","12h","1d","3d","1w","1M"],"description":"Time interval."},"o":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Opening price."},"c":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Closing price."},"h":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Highest price."},"l":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Lowest price."},"v":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total volume traded in base currency."},"n":{"type":"number","minimum":0,"description":"Number of trades executed."}},"required":["t","T","s","i","o","c","h","l","v","n"],"description":"Event of candlestick data point."}}}}}}}}}
```


# clearinghouseState

## Subscribe to clearinghouseState

> Subscription to clearinghouse state events for a specific user.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid Subscription - clearinghouseState","version":"1.0.0"},"tags":[{"name":"clearinghouseState"}],"servers":[{"url":"wss://api.hyperliquid.xyz/ws","description":"Mainnet WebSocket"},{"url":"wss://api.hyperliquid-testnet.xyz/ws","description":"Testnet WebSocket"}],"paths":{"/":{"post":{"tags":["clearinghouseState"],"summary":"Subscribe to clearinghouseState","description":"Subscription to clearinghouse state events for a specific user.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of subscription.","enum":["clearinghouseState"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."},"dex":{"type":"string","description":"DEX name (empty string for main dex)."}},"required":["type","user"],"description":"Subscription to clearinghouse state events for a specific user."}}},"required":true},"responses":{"200":{"description":"Event of clearinghouse state for a specific user.","content":{"application/json":{"schema":{"type":"object","properties":{"dex":{"type":"string","description":"DEX name (empty string for main dex)."},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."},"clearinghouseState":{"type":"object","properties":{"marginSummary":{"type":"object","properties":{"accountValue":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total account value."},"totalNtlPos":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total notional position value."},"totalRawUsd":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total raw USD value."},"totalMarginUsed":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total margin used."}},"required":["accountValue","totalNtlPos","totalRawUsd","totalMarginUsed"],"description":"Margin summary details."},"crossMarginSummary":{"type":"object","properties":{"accountValue":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total account value."},"totalNtlPos":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total notional position value."},"totalRawUsd":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total raw USD value."},"totalMarginUsed":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total margin used."}},"required":["accountValue","totalNtlPos","totalRawUsd","totalMarginUsed"],"description":"Cross-margin summary details."},"crossMaintenanceMarginUsed":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Maintenance margin used for cross-margin positions."},"withdrawable":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount available for withdrawal."},"assetPositions":{"type":"array","items":{"type":"object","properties":{"type":{"description":"Position type.","enum":["oneWay"]},"position":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"szi":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Signed position size."},"leverage":{"oneOf":[{"type":"object","properties":{"type":{"description":"Leverage type.","enum":["isolated"]},"value":{"type":"number","minimum":1,"description":"Leverage value used."},"rawUsd":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount of USD used (1 = $1)."}},"required":["type","value","rawUsd"]},{"type":"object","properties":{"type":{"description":"Leverage type.","enum":["cross"]},"value":{"type":"number","minimum":1,"description":"Leverage value used."}},"required":["type","value"]}],"description":"Leverage details."},"entryPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Average entry price."},"positionValue":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Position value."},"unrealizedPnl":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Unrealized profit and loss."},"returnOnEquity":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Return on equity."},"liquidationPx":{"anyOf":[{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","nullable":true}],"description":"Liquidation price."},"marginUsed":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Margin used."},"maxLeverage":{"type":"number","minimum":1,"description":"Maximum allowed leverage."},"cumFunding":{"type":"object","properties":{"allTime":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Total funding paid or received since account opening."},"sinceOpen":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Funding accumulated since the position was opened."},"sinceChange":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Funding accumulated since the last change in position size."}},"required":["allTime","sinceOpen","sinceChange"],"description":"Cumulative funding details."}},"required":["coin","szi","leverage","entryPx","positionValue","unrealizedPnl","returnOnEquity","liquidationPx","marginUsed","maxLeverage","cumFunding"],"description":"Position details."}},"required":["type","position"]},"description":"Array of asset positions."},"time":{"type":"number","minimum":0,"description":"Timestamp when data was retrieved (in ms since epoch)."}},"required":["marginSummary","crossMarginSummary","crossMaintenanceMarginUsed","withdrawable","assetPositions","time"],"description":"Account summary for perpetual trading."}},"required":["dex","user","clearinghouseState"],"description":"Event of clearinghouse state for a specific user."}}}}}}}}}
```


# explorerBlock

## Subscribe to explorerBlock

> Subscription to explorer block events.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid Subscription - explorerBlock","version":"1.0.0"},"tags":[{"name":"explorerBlock"}],"servers":[{"url":"wss://api.hyperliquid.xyz/ws","description":"Mainnet WebSocket"},{"url":"wss://api.hyperliquid-testnet.xyz/ws","description":"Testnet WebSocket"}],"paths":{"/":{"post":{"tags":["explorerBlock"],"summary":"Subscribe to explorerBlock","description":"Subscription to explorer block events.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of subscription.","enum":["explorerBlock"]}},"required":["type"],"description":"Subscription to explorer block events."}}},"required":true},"responses":{"200":{"description":"Event of array of block details.","content":{"application/json":{"schema":{"type":"array","items":{"type":"object","properties":{"blockTime":{"type":"number","minimum":0,"description":"Block creation timestamp."},"hash":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Block hash."},"height":{"type":"number","minimum":0,"description":"Block height in chain."},"numTxs":{"type":"number","minimum":0,"description":"Total transactions in block."},"proposer":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Block proposer address."}},"required":["blockTime","hash","height","numTxs","proposer"]},"description":"Event of array of block details."}}}}}}}}}
```


# explorerTxs

## Subscribe to explorerTxs

> Subscription to explorer transaction events.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid Subscription - explorerTxs","version":"1.0.0"},"tags":[{"name":"explorerTxs"}],"servers":[{"url":"wss://api.hyperliquid.xyz/ws","description":"Mainnet WebSocket"},{"url":"wss://api.hyperliquid-testnet.xyz/ws","description":"Testnet WebSocket"}],"paths":{"/":{"post":{"tags":["explorerTxs"],"summary":"Subscribe to explorerTxs","description":"Subscription to explorer transaction events.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of subscription.","enum":["explorerTxs"]}},"required":["type"],"description":"Subscription to explorer transaction events."}}},"required":true},"responses":{"200":{"description":"Event of array of transaction details.","content":{"application/json":{"schema":{"type":"array","items":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"type":"string","description":"Action type."}},"required":["type"],"description":"Action performed in transaction."},"block":{"type":"number","minimum":0,"description":"Block number where transaction was included."},"error":{"anyOf":[{"type":"string","nullable":true}],"description":"Error message if transaction failed."},"hash":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Transaction hash."},"time":{"type":"number","minimum":0,"description":"Transaction creation timestamp."},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Creator's address."}},"required":["action","block","error","hash","time","user"],"description":"Explorer transaction."},"description":"Event of array of transaction details."}}}}}}}}}
```


# l2Book

## Subscribe to l2Book

> Subscription to L2 order book events for a specific asset.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid Subscription - l2Book","version":"1.0.0"},"tags":[{"name":"l2Book"}],"servers":[{"url":"wss://api.hyperliquid.xyz/ws","description":"Mainnet WebSocket"},{"url":"wss://api.hyperliquid-testnet.xyz/ws","description":"Testnet WebSocket"}],"paths":{"/":{"post":{"tags":["l2Book"],"summary":"Subscribe to l2Book","description":"Subscription to L2 order book events for a specific asset.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of subscription.","enum":["l2Book"]},"coin":{"type":"string","description":"Asset symbol (e.g., BTC)."},"nSigFigs":{"anyOf":[{"enum":[2,3,4,5],"nullable":true}],"description":"Number of significant figures."},"mantissa":{"anyOf":[{"enum":[2,5],"nullable":true}],"description":"Mantissa for aggregation (if `nSigFigs` is 5)."}},"required":["type","coin"],"description":"Subscription to L2 order book events for a specific asset."}}},"required":true},"responses":{"200":{"description":"Event of L2 order book snapshot.","content":{"application/json":{"schema":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"time":{"type":"number","minimum":0,"description":"Timestamp of the snapshot (in ms since epoch)."},"levels":{"type":"array","items":[{"type":"array","items":{"type":"object","properties":{"px":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Price."},"sz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total size."},"n":{"type":"number","minimum":0,"description":"Number of individual orders."}},"required":["px","sz","n"],"description":"L2 order book level."}},{"type":"array","items":{"type":"object","properties":{"px":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Price."},"sz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total size."},"n":{"type":"number","minimum":0,"description":"Number of individual orders."}},"required":["px","sz","n"],"description":"L2 order book level."}}],"minItems":2,"description":"Bid and ask levels (index 0 = bids, index 1 = asks)."}},"required":["coin","time","levels"],"description":"Event of L2 order book snapshot."}}}}}}}}}
```


# notification

## Subscribe to notification

> Subscription to notification events for a specific user.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid Subscription - notification","version":"1.0.0"},"tags":[{"name":"notification"}],"servers":[{"url":"wss://api.hyperliquid.xyz/ws","description":"Mainnet WebSocket"},{"url":"wss://api.hyperliquid-testnet.xyz/ws","description":"Testnet WebSocket"}],"paths":{"/":{"post":{"tags":["notification"],"summary":"Subscribe to notification","description":"Subscription to notification events for a specific user.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of subscription.","enum":["notification"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Subscription to notification events for a specific user."}}},"required":true},"responses":{"200":{"description":"Event of user notification.","content":{"application/json":{"schema":{"type":"object","properties":{"notification":{"type":"string","description":"Notification content."}},"required":["notification"],"description":"Event of user notification."}}}}}}}}}
```


# openOrders

## Subscribe to openOrders

> Subscription to open order events for a specific user.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid Subscription - openOrders","version":"1.0.0"},"tags":[{"name":"openOrders"}],"servers":[{"url":"wss://api.hyperliquid.xyz/ws","description":"Mainnet WebSocket"},{"url":"wss://api.hyperliquid-testnet.xyz/ws","description":"Testnet WebSocket"}],"paths":{"/":{"post":{"tags":["openOrders"],"summary":"Subscribe to openOrders","description":"Subscription to open order events for a specific user.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of subscription.","enum":["openOrders"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."},"dex":{"type":"string","description":"DEX name (empty string for main dex)."}},"required":["type","user"],"description":"Subscription to open order events for a specific user."}}},"required":true},"responses":{"200":{"description":"Event of open orders for a specific user.","content":{"application/json":{"schema":{"type":"object","properties":{"dex":{"type":"string","description":"DEX name (empty string for main dex)."},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."},"orders":{"type":"array","items":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"side":{"enum":["B","A"],"description":"Order side (\"B\" = Bid/Buy, \"A\" = Ask/Sell)."},"limitPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Limit price."},"sz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Size."},"oid":{"type":"number","minimum":0,"description":"Order ID."},"timestamp":{"type":"number","minimum":0,"description":"Timestamp when the order was placed (in ms since epoch)."},"origSz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Original size at order placement."},"triggerCondition":{"type":"string","description":"Condition for triggering the order."},"isTrigger":{"type":"boolean","description":"Indicates if the order is a trigger order."},"triggerPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Trigger price."},"children":{"type":"array","items":{},"description":"Child orders associated with this order."},"isPositionTpsl":{"type":"boolean","description":"Indicates if the order is a position TP/SL order."},"reduceOnly":{"type":"boolean","description":"Indicates whether the order is reduce-only."},"orderType":{"enum":["Market","Limit","Stop Market","Stop Limit","Take Profit Market","Take Profit Limit"],"description":"Order type for market execution.\n- `\"Market\"`: Executes immediately at the market price.\n- `\"Limit\"`: Executes at the specified limit price or better.\n- `\"Stop Market\"`: Activates as a market order when a stop price is reached.\n- `\"Stop Limit\"`: Activates as a limit order when a stop price is reached.\n- `\"Take Profit Market\"`: Executes as a market order when a take profit price is reached.\n- `\"Take Profit Limit\"`: Executes as a limit order when a take profit price is reached. "},"tif":{"anyOf":[{"enum":["Gtc","Ioc","Alo","FrontendMarket","LiquidationMarket"],"nullable":true}],"description":"Time-in-force:\n- `\"Gtc\"`: Remains active until filled or canceled.\n- `\"Ioc\"`: Fills immediately or cancels any unfilled portion.\n- `\"Alo\"`: Adds liquidity only.\n- `\"FrontendMarket\"`: Similar to Ioc, used in Hyperliquid UI.\n- `\"LiquidationMarket\"`: Similar to Ioc, used in Hyperliquid UI."},"cloid":{"anyOf":[{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":34,"maxLength":34,"nullable":true}],"description":"Client Order ID."}},"required":["coin","side","limitPx","sz","oid","timestamp","origSz","triggerCondition","isTrigger","triggerPx","children","isPositionTpsl","reduceOnly","orderType","tif","cloid"],"description":"Open order with additional display information."},"description":"Array of open orders with additional display information."}},"required":["dex","user","orders"],"description":"Event of open orders for a specific user."}}}}}}}}}
```


# orderUpdates

## Subscribe to orderUpdates

> Subscription to order updates for a specific user.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid Subscription - orderUpdates","version":"1.0.0"},"tags":[{"name":"orderUpdates"}],"servers":[{"url":"wss://api.hyperliquid.xyz/ws","description":"Mainnet WebSocket"},{"url":"wss://api.hyperliquid-testnet.xyz/ws","description":"Testnet WebSocket"}],"paths":{"/":{"post":{"tags":["orderUpdates"],"summary":"Subscribe to orderUpdates","description":"Subscription to order updates for a specific user.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of subscription.","enum":["orderUpdates"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Subscription to order updates for a specific user."}}},"required":true},"responses":{"200":{"description":"Event of array of orders with their current processing status.","content":{"application/json":{"schema":{"type":"array","items":{"type":"object","properties":{"order":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"side":{"enum":["B","A"],"description":"Order side (\"B\" = Bid/Buy, \"A\" = Ask/Sell)."},"limitPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Limit price."},"sz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Size."},"oid":{"type":"number","minimum":0,"description":"Order ID."},"timestamp":{"type":"number","minimum":0,"description":"Timestamp when the order was placed (in ms since epoch)."},"origSz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Original size at order placement."},"cloid":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":34,"maxLength":34,"description":"Client Order ID."},"reduceOnly":{"description":"Indicates if the order is reduce-only.","enum":[true]}},"required":["coin","side","limitPx","sz","oid","timestamp","origSz"],"description":"Order details."},"status":{"enum":["open","filled","canceled","triggered","rejected","marginCanceled","vaultWithdrawalCanceled","openInterestCapCanceled","selfTradeCanceled","reduceOnlyCanceled","siblingFilledCanceled","delistedCanceled","liquidatedCanceled","scheduledCancel","tickRejected","minTradeNtlRejected","perpMarginRejected","reduceOnlyRejected","badAloPxRejected","iocCancelRejected","badTriggerPxRejected","marketOrderNoLiquidityRejected","positionIncreaseAtOpenInterestCapRejected","positionFlipAtOpenInterestCapRejected","tooAggressiveAtOpenInterestCapRejected","openInterestIncreaseRejected","insufficientSpotBalanceRejected","oracleRejected","perpMaxPositionRejected"],"description":"Order processing status.\n- `\"open\"`: Order active and waiting to be filled.\n- `\"filled\"`: Order fully executed.\n- `\"canceled\"`: Order canceled by the user.\n- `\"triggered\"`: Order triggered and awaiting execution.\n- `\"rejected\"`: Order rejected by the system.\n- `\"marginCanceled\"`: Order canceled due to insufficient margin.\n- `\"vaultWithdrawalCanceled\"`: Canceled due to a user withdrawal from vault.\n- `\"openInterestCapCanceled\"`: Canceled due to order being too aggressive when open interest was at cap.\n- `\"selfTradeCanceled\"`: Canceled due to self-trade prevention.\n- `\"reduceOnlyCanceled\"`: Canceled reduced-only order that does not reduce position.\n- `\"siblingFilledCanceled\"`: Canceled due to sibling ordering being filled.\n- `\"delistedCanceled\"`: Canceled due to asset delisting.\n- `\"liquidatedCanceled\"`: Canceled due to liquidation.\n- `\"scheduledCancel\"`: Canceled due to exceeding scheduled cancel deadline (dead man's switch).\n- `\"tickRejected\"`: Rejected due to invalid tick price.\n- `\"minTradeNtlRejected\"`: Rejected due to order notional below minimum.\n- `\"perpMarginRejected\"`: Rejected due to insufficient margin.\n- `\"reduceOnlyRejected\"`: Rejected due to reduce only.\n- `\"badAloPxRejected\"`: Rejected due to post-only immediate match.\n- `\"iocCancelRejected\"`: Rejected due to IOC not able to match.\n- `\"badTriggerPxRejected\"`: Rejected due to invalid TP/SL price.\n- `\"marketOrderNoLiquidityRejected\"`: Rejected due to lack of liquidity for market order.\n- `\"positionIncreaseAtOpenInterestCapRejected\"`: Rejected due to open interest cap.\n- `\"positionFlipAtOpenInterestCapRejected\"`: Rejected due to open interest cap.\n- `\"tooAggressiveAtOpenInterestCapRejected\"`: Rejected due to price too aggressive at open interest cap.\n- `\"openInterestIncreaseRejected\"`: Rejected due to open interest cap.\n- `\"insufficientSpotBalanceRejected\"`: Rejected due to insufficient spot balance.\n- `\"oracleRejected\"`: Rejected due to price too far from oracle.\n- `\"perpMaxPositionRejected\"`: Rejected due to exceeding margin tier limit at current leverage."},"statusTimestamp":{"type":"number","minimum":0,"description":"Timestamp when the status was last updated (in ms since epoch)."}},"required":["order","status","statusTimestamp"]},"description":"Event of array of orders with their current processing status."}}}}}}}}}
```


# spotAssetCtxs

## Subscribe to spotAssetCtxs

> Subscription to context events for all spot assets.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid Subscription - spotAssetCtxs","version":"1.0.0"},"tags":[{"name":"spotAssetCtxs"}],"servers":[{"url":"wss://api.hyperliquid.xyz/ws","description":"Mainnet WebSocket"},{"url":"wss://api.hyperliquid-testnet.xyz/ws","description":"Testnet WebSocket"}],"paths":{"/":{"post":{"tags":["spotAssetCtxs"],"summary":"Subscribe to spotAssetCtxs","description":"Subscription to context events for all spot assets.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of subscription.","enum":["spotAssetCtxs"]}},"required":["type"],"description":"Subscription to context events for all spot assets."}}},"required":true},"responses":{"200":{"description":"Event of spot asset contexts.","content":{"application/json":{"schema":{"type":"array","items":{"type":"object","properties":{"prevDayPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Previous day's closing price."},"dayNtlVlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Daily notional volume."},"markPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Mark price."},"midPx":{"anyOf":[{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","nullable":true}],"description":"Mid price."},"circulatingSupply":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Circulating supply."},"coin":{"type":"string","description":"Asset symbol."},"totalSupply":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total supply."},"dayBaseVlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Daily volume in base currency."}},"required":["prevDayPx","dayNtlVlm","markPx","midPx","circulatingSupply","coin","totalSupply","dayBaseVlm"],"description":"Spot asset context."},"description":"Event of spot asset contexts."}}}}}}}}}
```


# spotState

## Subscribe to spotState

> Subscription to spot state events for a specific user.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid Subscription - spotState","version":"1.0.0"},"tags":[{"name":"spotState"}],"servers":[{"url":"wss://api.hyperliquid.xyz/ws","description":"Mainnet WebSocket"},{"url":"wss://api.hyperliquid-testnet.xyz/ws","description":"Testnet WebSocket"}],"paths":{"/":{"post":{"tags":["spotState"],"summary":"Subscribe to spotState","description":"Subscription to spot state events for a specific user.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of subscription.","enum":["spotState"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."},"ignorePortfolioMargin":{"type":"boolean","description":"Whether to ignore portfolio margin calculations."}},"required":["type","user"],"description":"Subscription to spot state events for a specific user."}}},"required":true},"responses":{"200":{"description":"Event of user spot state.","content":{"application/json":{"schema":{"type":"object","properties":{"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."},"spotState":{"type":"object","properties":{"balances":{"type":"array","items":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"token":{"type":"number","minimum":0,"description":"Unique identifier for the token."},"total":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total balance."},"hold":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount on hold."},"entryNtl":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Entry notional value."}},"required":["coin","token","total","hold","entryNtl"]},"description":"Array of available token balances."},"evmEscrows":{"type":"array","items":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"token":{"type":"number","minimum":0,"description":"Unique identifier for the token."},"total":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total balance."}},"required":["coin","token","total"]},"description":"Array of escrowed balances."}},"required":["balances"],"description":"Account summary for spot trading."}},"required":["user","spotState"],"description":"Event of user spot state."}}}}}}}}}
```


# trades

## Subscribe to trades

> Subscription to trade events for a specific asset.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid Subscription - trades","version":"1.0.0"},"tags":[{"name":"trades"}],"servers":[{"url":"wss://api.hyperliquid.xyz/ws","description":"Mainnet WebSocket"},{"url":"wss://api.hyperliquid-testnet.xyz/ws","description":"Testnet WebSocket"}],"paths":{"/":{"post":{"tags":["trades"],"summary":"Subscribe to trades","description":"Subscription to trade events for a specific asset.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of subscription.","enum":["trades"]},"coin":{"type":"string","description":"Asset symbol (e.g., BTC)."}},"required":["type","coin"],"description":"Subscription to trade events for a specific asset."}}},"required":true},"responses":{"200":{"description":"Event of array of trades for a specific asset.","content":{"application/json":{"schema":{"type":"array","items":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol (e.g., BTC)."},"side":{"enum":["B","A"],"description":"Trade side (\"B\" = Bid/Buy, \"A\" = Ask/Sell)."},"px":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Trade price."},"sz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Trade size."},"time":{"type":"number","minimum":0,"description":"Trade timestamp (in ms since epoch)."},"hash":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Transaction hash."},"tid":{"type":"number","minimum":0,"description":"Trade ID."},"users":{"type":"array","items":[{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42},{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42}],"minItems":2,"description":"Addresses of users involved in the trade [Maker, Taker]."}},"required":["coin","side","px","sz","time","hash","tid","users"]},"description":"Event of array of trades for a specific asset."}}}}}}}}}
```


# twapStates

## Subscribe to twapStates

> Subscribe to TWAP states updates for a specific user.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid Subscription - twapStates","version":"1.0.0"},"tags":[{"name":"twapStates"}],"servers":[{"url":"wss://api.hyperliquid.xyz/ws","description":"Mainnet WebSocket"},{"url":"wss://api.hyperliquid-testnet.xyz/ws","description":"Testnet WebSocket"}],"paths":{"/":{"post":{"tags":["twapStates"],"summary":"Subscribe to twapStates","description":"Subscribe to TWAP states updates for a specific user.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of subscription.","enum":["twapStates"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."},"dex":{"type":"string","description":"DEX name (empty string for main dex)."}},"required":["type","user"],"description":"Subscribe to TWAP states updates for a specific user."}}},"required":true},"responses":{"200":{"description":"Event of user TWAP states.","content":{"application/json":{"schema":{"type":"object","properties":{"dex":{"type":"string","description":"DEX name (empty string for main dex)."},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."},"states":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"executedNtl":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Executed notional value."},"executedSz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Executed size."},"minutes":{"type":"number","minimum":0,"description":"Duration in minutes."},"randomize":{"type":"boolean","description":"Indicates if the TWAP randomizes execution."},"reduceOnly":{"type":"boolean","description":"Indicates if the order is reduce-only."},"side":{"enum":["B","A"],"description":"Order side (\"B\" = Bid/Buy, \"A\" = Ask/Sell)."},"sz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Order size."},"timestamp":{"type":"number","minimum":0,"description":"Start time of the TWAP order (in ms since epoch)."},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["coin","executedNtl","executedSz","minutes","randomize","reduceOnly","side","sz","timestamp","user"],"description":"TWAP order state."}],"minItems":2},"description":"Array of tuples of TWAP ID and TWAP state."}},"required":["dex","user","states"],"description":"Event of user TWAP states."}}}}}}}}}
```


# userEvents

## Subscribe to userEvents

> Subscription to user events for a specific user.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid Subscription - userEvents","version":"1.0.0"},"tags":[{"name":"userEvents"}],"servers":[{"url":"wss://api.hyperliquid.xyz/ws","description":"Mainnet WebSocket"},{"url":"wss://api.hyperliquid-testnet.xyz/ws","description":"Testnet WebSocket"}],"paths":{"/":{"post":{"tags":["userEvents"],"summary":"Subscribe to userEvents","description":"Subscription to user events for a specific user.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of subscription.","enum":["userEvents"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Subscription to user events for a specific user."}}},"required":true},"responses":{"200":{"description":"Event of one of possible user events.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"fills":{"type":"array","items":{"allOf":[{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"px":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Price."},"sz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Size."},"side":{"enum":["B","A"],"description":"Order side (\"B\" = Bid/Buy, \"A\" = Ask/Sell)."},"time":{"type":"number","minimum":0,"description":"Timestamp when the trade occurred (in ms since epoch)."},"startPosition":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Start position size."},"dir":{"type":"string","description":"Direction indicator for frontend display."},"closedPnl":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Realized PnL."},"hash":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"L1 transaction hash."},"oid":{"type":"number","minimum":0,"description":"Order ID."},"crossed":{"type":"boolean","description":"Indicates if the fill was a taker order."},"fee":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Fee charged or rebate received (negative indicates rebate)."},"tid":{"type":"number","minimum":0,"description":"Unique transaction identifier for a partial fill of an order."},"feeToken":{"type":"string","description":"Token in which the fee is denominated (e.g., \"USDC\")."},"twapId":{"anyOf":[{"type":"number","minimum":0,"nullable":true}],"description":"ID of the TWAP."}},"required":["coin","px","sz","side","time","startPosition","dir","closedPnl","hash","oid","crossed","fee","tid","feeToken","twapId"],"description":"User fill."},{"type":"object","properties":{"cloid":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":34,"maxLength":34,"description":"Client Order ID."},"liquidation":{"type":"object","properties":{"liquidatedUser":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Address of the liquidated user."},"markPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Mark price at the time of liquidation."},"method":{"enum":["market","backstop"],"description":"Liquidation method."}},"required":["liquidatedUser","markPx","method"],"description":"Liquidation details."}},"required":[]}]},"description":"Array of user trade fills."}},"required":["fills"]},{"type":"object","properties":{"funding":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"usdc":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Amount transferred in USDC."},"szi":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Signed position size."},"fundingRate":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Applied funding rate."},"nSamples":{"anyOf":[{"type":"number","minimum":0,"nullable":true}],"description":"Number of samples."}},"required":["coin","usdc","szi","fundingRate","nSamples"],"description":"Funding update details."}},"required":["funding"]},{"type":"object","properties":{"liquidation":{"type":"object","properties":{"lid":{"type":"number","minimum":0,"description":"Unique liquidation ID."},"liquidator":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Address of the liquidator."},"liquidated_user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Address of the liquidated user."},"liquidated_ntl_pos":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Notional position size that was liquidated."},"liquidated_account_value":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Account value at time of liquidation."}},"required":["lid","liquidator","liquidated_user","liquidated_ntl_pos","liquidated_account_value"],"description":"Liquidation details."}},"required":["liquidation"]},{"type":"object","properties":{"nonUserCancel":{"type":"array","items":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol (e.g., BTC)."},"oid":{"type":"number","minimum":0,"description":"Order ID."}},"required":["coin","oid"]},"description":"Array of non-user initiated order cancellations."}},"required":["nonUserCancel"]},{"type":"object","properties":{"twapHistory":{"type":"array","items":{"type":"object","properties":{"time":{"type":"number","minimum":0,"description":"Creation time of the history record (in seconds since epoch)."},"state":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"executedNtl":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Executed notional value."},"executedSz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Executed size."},"minutes":{"type":"number","minimum":0,"description":"Duration in minutes."},"randomize":{"type":"boolean","description":"Indicates if the TWAP randomizes execution."},"reduceOnly":{"type":"boolean","description":"Indicates if the order is reduce-only."},"side":{"enum":["B","A"],"description":"Order side (\"B\" = Bid/Buy, \"A\" = Ask/Sell)."},"sz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Order size."},"timestamp":{"type":"number","minimum":0,"description":"Start time of the TWAP order (in ms since epoch)."},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["coin","executedNtl","executedSz","minutes","randomize","reduceOnly","side","sz","timestamp","user"],"description":"State of the TWAP order."},"status":{"oneOf":[{"type":"object","properties":{"status":{"enum":["finished","activated","terminated"],"description":"Status of the TWAP order."}},"required":["status"]},{"type":"object","properties":{"status":{"description":"Status of the TWAP order.","enum":["error"]},"description":{"type":"string","description":"Error message."}},"required":["status","description"]}],"description":"Current status of the TWAP order.\n- `\"finished\"`: Fully executed.\n- `\"activated\"`: Active and executing.\n- `\"terminated\"`: Terminated.\n- `\"error\"`: An error occurred."},"twapId":{"type":"number","minimum":0,"description":"ID of the TWAP."}},"required":["time","state","status"]},"description":"Array of user's TWAP history."}},"required":["twapHistory"]},{"type":"object","properties":{"twapSliceFills":{"type":"array","items":{"type":"object","properties":{"fill":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"px":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Price."},"sz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Size."},"side":{"enum":["B","A"],"description":"Order side (\"B\" = Bid/Buy, \"A\" = Ask/Sell)."},"time":{"type":"number","minimum":0,"description":"Timestamp when the trade occurred (in ms since epoch)."},"startPosition":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Start position size."},"dir":{"type":"string","description":"Direction indicator for frontend display."},"closedPnl":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Realized PnL."},"hash":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"L1 transaction hash."},"oid":{"type":"number","minimum":0,"description":"Order ID."},"crossed":{"type":"boolean","description":"Indicates if the fill was a taker order."},"fee":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Fee charged or rebate received (negative indicates rebate)."},"tid":{"type":"number","minimum":0,"description":"Unique transaction identifier for a partial fill of an order."},"feeToken":{"type":"string","description":"Token in which the fee is denominated (e.g., \"USDC\")."},"twapId":{"anyOf":[{"type":"number","minimum":0,"nullable":true}],"description":"ID of the TWAP."}},"required":["coin","px","sz","side","time","startPosition","dir","closedPnl","hash","oid","crossed","fee","tid","feeToken","twapId"],"description":"TWAP fill record."},"twapId":{"type":"number","minimum":0,"description":"ID of the TWAP."}},"required":["fill","twapId"]},"description":"Array of user's twap slice fills."}},"required":["twapSliceFills"]}],"description":"Event of one of possible user events."}}}}}}}}}
```


# userFills

## Subscribe to userFills

> Subscription to user fill events for a specific user.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid Subscription - userFills","version":"1.0.0"},"tags":[{"name":"userFills"}],"servers":[{"url":"wss://api.hyperliquid.xyz/ws","description":"Mainnet WebSocket"},{"url":"wss://api.hyperliquid-testnet.xyz/ws","description":"Testnet WebSocket"}],"paths":{"/":{"post":{"tags":["userFills"],"summary":"Subscribe to userFills","description":"Subscription to user fill events for a specific user.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of subscription.","enum":["userFills"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."},"aggregateByTime":{"type":"boolean","description":"If true, partial fills are aggregated when a crossing order fills multiple resting orders."}},"required":["type","user"],"description":"Subscription to user fill events for a specific user."}}},"required":true},"responses":{"200":{"description":"Event of user trade fill.","content":{"application/json":{"schema":{"type":"object","properties":{"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."},"fills":{"type":"array","items":{"allOf":[{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"px":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Price."},"sz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Size."},"side":{"enum":["B","A"],"description":"Order side (\"B\" = Bid/Buy, \"A\" = Ask/Sell)."},"time":{"type":"number","minimum":0,"description":"Timestamp when the trade occurred (in ms since epoch)."},"startPosition":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Start position size."},"dir":{"type":"string","description":"Direction indicator for frontend display."},"closedPnl":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Realized PnL."},"hash":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"L1 transaction hash."},"oid":{"type":"number","minimum":0,"description":"Order ID."},"crossed":{"type":"boolean","description":"Indicates if the fill was a taker order."},"fee":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Fee charged or rebate received (negative indicates rebate)."},"tid":{"type":"number","minimum":0,"description":"Unique transaction identifier for a partial fill of an order."},"feeToken":{"type":"string","description":"Token in which the fee is denominated (e.g., \"USDC\")."},"twapId":{"anyOf":[{"type":"number","minimum":0,"nullable":true}],"description":"ID of the TWAP."}},"required":["coin","px","sz","side","time","startPosition","dir","closedPnl","hash","oid","crossed","fee","tid","feeToken","twapId"],"description":"User fill."},{"type":"object","properties":{"cloid":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":34,"maxLength":34,"description":"Client Order ID."},"liquidation":{"type":"object","properties":{"liquidatedUser":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Address of the liquidated user."},"markPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Mark price at the time of liquidation."},"method":{"enum":["market","backstop"],"description":"Liquidation method."}},"required":["liquidatedUser","markPx","method"],"description":"Liquidation details."}},"required":[]}]},"description":"Array of user trade fills."},"isSnapshot":{"description":"Whether this is an initial snapshot.","enum":[true]}},"required":["user","fills"],"description":"Event of user trade fill."}}}}}}}}}
```


# userFundings

## Subscribe to userFundings

> Subscription to user funding events for a specific user.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid Subscription - userFundings","version":"1.0.0"},"tags":[{"name":"userFundings"}],"servers":[{"url":"wss://api.hyperliquid.xyz/ws","description":"Mainnet WebSocket"},{"url":"wss://api.hyperliquid-testnet.xyz/ws","description":"Testnet WebSocket"}],"paths":{"/":{"post":{"tags":["userFundings"],"summary":"Subscribe to userFundings","description":"Subscription to user funding events for a specific user.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of subscription.","enum":["userFundings"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Subscription to user funding events for a specific user."}}},"required":true},"responses":{"200":{"description":"Event of user fundings.","content":{"application/json":{"schema":{"type":"object","properties":{"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."},"fundings":{"type":"array","items":{"type":"object","properties":{"time":{"type":"number","minimum":0,"description":"Timestamp of the update (in ms since epoch)."},"coin":{"type":"string","description":"Asset symbol."},"usdc":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Amount transferred in USDC."},"szi":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Signed position size."},"fundingRate":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Applied funding rate."},"nSamples":{"anyOf":[{"type":"number","minimum":0,"nullable":true}],"description":"Number of samples."}},"required":["time","coin","usdc","szi","fundingRate","nSamples"]},"description":"Array of user funding ledger updates."},"isSnapshot":{"description":"Whether this is an initial snapshot.","enum":[true]}},"required":["user","fundings"],"description":"Event of user fundings."}}}}}}}}}
```


# userHistoricalOrders

## Subscribe to userHistoricalOrders

> Subscription to user historical orders for a specific user.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid Subscription - userHistoricalOrders","version":"1.0.0"},"tags":[{"name":"userHistoricalOrders"}],"servers":[{"url":"wss://api.hyperliquid.xyz/ws","description":"Mainnet WebSocket"},{"url":"wss://api.hyperliquid-testnet.xyz/ws","description":"Testnet WebSocket"}],"paths":{"/":{"post":{"tags":["userHistoricalOrders"],"summary":"Subscribe to userHistoricalOrders","description":"Subscription to user historical orders for a specific user.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of subscription.","enum":["userHistoricalOrders"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Subscription to user historical orders for a specific user."}}},"required":true},"responses":{"200":{"description":"Event of user historical orders.","content":{"application/json":{"schema":{"type":"object","properties":{"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."},"orderHistory":{"type":"array","items":{"type":"object","properties":{"order":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"side":{"enum":["B","A"],"description":"Order side (\"B\" = Bid/Buy, \"A\" = Ask/Sell)."},"limitPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Limit price."},"sz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Size."},"oid":{"type":"number","minimum":0,"description":"Order ID."},"timestamp":{"type":"number","minimum":0,"description":"Timestamp when the order was placed (in ms since epoch)."},"origSz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Original size at order placement."},"triggerCondition":{"type":"string","description":"Condition for triggering the order."},"isTrigger":{"type":"boolean","description":"Indicates if the order is a trigger order."},"triggerPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Trigger price."},"children":{"type":"array","items":{},"description":"Child orders associated with this order."},"isPositionTpsl":{"type":"boolean","description":"Indicates if the order is a position TP/SL order."},"reduceOnly":{"type":"boolean","description":"Indicates whether the order is reduce-only."},"orderType":{"enum":["Market","Limit","Stop Market","Stop Limit","Take Profit Market","Take Profit Limit"],"description":"Order type for market execution.\n- `\"Market\"`: Executes immediately at the market price.\n- `\"Limit\"`: Executes at the specified limit price or better.\n- `\"Stop Market\"`: Activates as a market order when a stop price is reached.\n- `\"Stop Limit\"`: Activates as a limit order when a stop price is reached.\n- `\"Take Profit Market\"`: Executes as a market order when a take profit price is reached.\n- `\"Take Profit Limit\"`: Executes as a limit order when a take profit price is reached. "},"tif":{"anyOf":[{"enum":["Gtc","Ioc","Alo","FrontendMarket","LiquidationMarket"],"nullable":true}],"description":"Time-in-force:\n- `\"Gtc\"`: Remains active until filled or canceled.\n- `\"Ioc\"`: Fills immediately or cancels any unfilled portion.\n- `\"Alo\"`: Adds liquidity only.\n- `\"FrontendMarket\"`: Similar to Ioc, used in Hyperliquid UI.\n- `\"LiquidationMarket\"`: Similar to Ioc, used in Hyperliquid UI."},"cloid":{"anyOf":[{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":34,"maxLength":34,"nullable":true}],"description":"Client Order ID."}},"required":["coin","side","limitPx","sz","oid","timestamp","origSz","triggerCondition","isTrigger","triggerPx","children","isPositionTpsl","reduceOnly","orderType","tif","cloid"],"description":"Open order with additional display information."},"status":{"enum":["open","filled","canceled","triggered","rejected","marginCanceled","vaultWithdrawalCanceled","openInterestCapCanceled","selfTradeCanceled","reduceOnlyCanceled","siblingFilledCanceled","delistedCanceled","liquidatedCanceled","scheduledCancel","tickRejected","minTradeNtlRejected","perpMarginRejected","reduceOnlyRejected","badAloPxRejected","iocCancelRejected","badTriggerPxRejected","marketOrderNoLiquidityRejected","positionIncreaseAtOpenInterestCapRejected","positionFlipAtOpenInterestCapRejected","tooAggressiveAtOpenInterestCapRejected","openInterestIncreaseRejected","insufficientSpotBalanceRejected","oracleRejected","perpMaxPositionRejected"],"description":"Order processing status.\n- `\"open\"`: Order active and waiting to be filled.\n- `\"filled\"`: Order fully executed.\n- `\"canceled\"`: Order canceled by the user.\n- `\"triggered\"`: Order triggered and awaiting execution.\n- `\"rejected\"`: Order rejected by the system.\n- `\"marginCanceled\"`: Order canceled due to insufficient margin.\n- `\"vaultWithdrawalCanceled\"`: Canceled due to a user withdrawal from vault.\n- `\"openInterestCapCanceled\"`: Canceled due to order being too aggressive when open interest was at cap.\n- `\"selfTradeCanceled\"`: Canceled due to self-trade prevention.\n- `\"reduceOnlyCanceled\"`: Canceled reduced-only order that does not reduce position.\n- `\"siblingFilledCanceled\"`: Canceled due to sibling ordering being filled.\n- `\"delistedCanceled\"`: Canceled due to asset delisting.\n- `\"liquidatedCanceled\"`: Canceled due to liquidation.\n- `\"scheduledCancel\"`: Canceled due to exceeding scheduled cancel deadline (dead man's switch).\n- `\"tickRejected\"`: Rejected due to invalid tick price.\n- `\"minTradeNtlRejected\"`: Rejected due to order notional below minimum.\n- `\"perpMarginRejected\"`: Rejected due to insufficient margin.\n- `\"reduceOnlyRejected\"`: Rejected due to reduce only.\n- `\"badAloPxRejected\"`: Rejected due to post-only immediate match.\n- `\"iocCancelRejected\"`: Rejected due to IOC not able to match.\n- `\"badTriggerPxRejected\"`: Rejected due to invalid TP/SL price.\n- `\"marketOrderNoLiquidityRejected\"`: Rejected due to lack of liquidity for market order.\n- `\"positionIncreaseAtOpenInterestCapRejected\"`: Rejected due to open interest cap.\n- `\"positionFlipAtOpenInterestCapRejected\"`: Rejected due to open interest cap.\n- `\"tooAggressiveAtOpenInterestCapRejected\"`: Rejected due to price too aggressive at open interest cap.\n- `\"openInterestIncreaseRejected\"`: Rejected due to open interest cap.\n- `\"insufficientSpotBalanceRejected\"`: Rejected due to insufficient spot balance.\n- `\"oracleRejected\"`: Rejected due to price too far from oracle.\n- `\"perpMaxPositionRejected\"`: Rejected due to exceeding margin tier limit at current leverage."},"statusTimestamp":{"type":"number","minimum":0,"description":"Timestamp when the status was last updated (in ms since epoch)."}},"required":["order","status","statusTimestamp"]},"description":"Array of frontend orders with current processing status."},"isSnapshot":{"description":"Whether this is an initial snapshot.","enum":[true]}},"required":["user","orderHistory"],"description":"Event of user historical orders."}}}}}}}}}
```


# userNonFundingLedgerUpdates

## Subscribe to userNonFundingLedgerUpdates

> Subscription to user non-funding ledger updates for a specific user.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid Subscription - userNonFundingLedgerUpdates","version":"1.0.0"},"tags":[{"name":"userNonFundingLedgerUpdates"}],"servers":[{"url":"wss://api.hyperliquid.xyz/ws","description":"Mainnet WebSocket"},{"url":"wss://api.hyperliquid-testnet.xyz/ws","description":"Testnet WebSocket"}],"paths":{"/":{"post":{"tags":["userNonFundingLedgerUpdates"],"summary":"Subscribe to userNonFundingLedgerUpdates","description":"Subscription to user non-funding ledger updates for a specific user.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of subscription.","enum":["userNonFundingLedgerUpdates"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Subscription to user non-funding ledger updates for a specific user."}}},"required":true},"responses":{"200":{"description":"Event of user non-funding ledger updates.","content":{"application/json":{"schema":{"type":"object","properties":{"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."},"nonFundingLedgerUpdates":{"type":"array","items":{"type":"object","properties":{"time":{"type":"number","minimum":0,"description":"Timestamp of the update (in ms since epoch)."},"hash":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"L1 transaction hash."},"delta":{"oneOf":[{"type":"object","properties":{"type":{"description":"Update type.","enum":["accountClassTransfer"]},"usdc":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount transferred in USDC."},"toPerp":{"type":"boolean","description":"Indicates if the transfer is to the perpetual account."}},"required":["type","usdc","toPerp"]},{"type":"object","properties":{"type":{"description":"Update type.","enum":["deposit"]},"usdc":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount deposited in USDC."}},"required":["type","usdc"]},{"type":"object","properties":{"type":{"description":"Update type.","enum":["internalTransfer"]},"usdc":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount transferred in USDC."},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Initiator address."},"destination":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Destination address."},"fee":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Transfer fee."}},"required":["type","usdc","user","destination","fee"]},{"type":"object","properties":{"type":{"description":"Update type.","enum":["liquidation"]},"liquidatedNtlPos":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total notional value of liquidated positions."},"accountValue":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Account value at liquidation time."},"leverageType":{"enum":["Cross","Isolated"],"description":"Leverage type for liquidated positions."},"liquidatedPositions":{"type":"array","items":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol of the liquidated position."},"szi":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Signed position size liquidated."}},"required":["coin","szi"]},"description":"Details of each liquidated position."}},"required":["type","liquidatedNtlPos","accountValue","leverageType","liquidatedPositions"]},{"type":"object","properties":{"type":{"description":"Update type.","enum":["rewardsClaim"]},"amount":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount of rewards claimed."},"token":{"type":"string","description":"Token symbol."}},"required":["type","amount","token"]},{"type":"object","properties":{"type":{"description":"Update type.","enum":["spotTransfer"]},"token":{"type":"string","description":"Token symbol."},"amount":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount transferred."},"usdcValue":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Equivalent USDC value."},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Initiator address."},"destination":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Destination address."},"fee":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Transfer fee."},"nativeTokenFee":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Fee in native token."},"nonce":{"anyOf":[{"type":"number","minimum":0,"nullable":true}],"description":"Nonce of the transfer."},"feeToken":{"type":"string","description":"Token in which the fee is denominated (e.g., \"USDC\")."}},"required":["type","token","amount","usdcValue","user","destination","fee","nativeTokenFee","nonce","feeToken"]},{"type":"object","properties":{"type":{"description":"Update type.","enum":["subAccountTransfer"]},"usdc":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount transferred in USDC."},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Initiator address."},"destination":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Destination address."}},"required":["type","usdc","user","destination"]},{"type":"object","properties":{"type":{"description":"Update type.","enum":["vaultCreate"]},"vault":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Address of the created vault."},"usdc":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Initial allocated amount in USDC."},"fee":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Vault creation fee."}},"required":["type","vault","usdc","fee"]},{"type":"object","properties":{"type":{"description":"Update type.","enum":["vaultDeposit"]},"vault":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Address of the target vault."},"usdc":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount deposited in USDC."}},"required":["type","vault","usdc"]},{"type":"object","properties":{"type":{"description":"Update type.","enum":["vaultDistribution"]},"vault":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Address of the vault distributing funds."},"usdc":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount distributed in USDC."}},"required":["type","vault","usdc"]},{"type":"object","properties":{"type":{"description":"Update type.","enum":["vaultWithdraw"]},"vault":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Vault address."},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Address of the user withdrawing funds."},"requestedUsd":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Withdrawal request amount in USD."},"commission":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Withdrawal commission fee."},"closingCost":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Closing cost associated with positions."},"basis":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Basis value for withdrawal calculation."},"netWithdrawnUsd":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Net withdrawn amount in USD after fees and costs."}},"required":["type","vault","user","requestedUsd","commission","closingCost","basis","netWithdrawnUsd"]},{"type":"object","properties":{"type":{"description":"Update type.","enum":["withdraw"]},"usdc":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount withdrawn in USDC."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"fee":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Withdrawal fee."}},"required":["type","usdc","nonce","fee"]},{"type":"object","properties":{"type":{"description":"Update type.","enum":["send"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Address of the sender."},"destination":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Destination address."},"sourceDex":{"type":"string","description":"Source DEX (\"\" for default USDC perp DEX, \"spot\" for spot)."},"destinationDex":{"type":"string","description":"Destination DEX (\"\" for default USDC perp DEX, \"spot\" for spot)."},"token":{"type":"string","description":"Token identifier."},"amount":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount to send (not in wei)."},"usdcValue":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Equivalent USDC value."},"fee":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Transfer fee."},"nativeTokenFee":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Fee in native token."},"nonce":{"type":"number","minimum":0,"description":"Nonce of the transfer."},"feeToken":{"type":"string","description":"Token in which the fee is denominated (e.g., \"USDC\")."}},"required":["type","user","destination","sourceDex","destinationDex","token","amount","usdcValue","fee","nativeTokenFee","nonce","feeToken"]},{"type":"object","properties":{"type":{"description":"Update type.","enum":["deployGasAuction"]},"token":{"type":"string","description":"Token symbol."},"amount":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount in the specified token."}},"required":["type","token","amount"]},{"type":"object","properties":{"type":{"description":"Update type.","enum":["cStakingTransfer"]},"token":{"type":"string","description":"Token symbol."},"amount":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount in the specified token."},"isDeposit":{"type":"boolean","description":"`true` for deposit, `false` for withdrawal."}},"required":["type","token","amount","isDeposit"]}],"description":"Update details."}},"required":["time","hash","delta"]},"description":"Array of user's non-funding ledger update."},"isSnapshot":{"description":"Whether this is an initial snapshot.","enum":[true]}},"required":["user","nonFundingLedgerUpdates"],"description":"Event of user non-funding ledger updates."}}}}}}}}}
```


# userTwapHistory

## Subscribe to userTwapHistory

> Subscription to user TWAP history events for a specific user.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid Subscription - userTwapHistory","version":"1.0.0"},"tags":[{"name":"userTwapHistory"}],"servers":[{"url":"wss://api.hyperliquid.xyz/ws","description":"Mainnet WebSocket"},{"url":"wss://api.hyperliquid-testnet.xyz/ws","description":"Testnet WebSocket"}],"paths":{"/":{"post":{"tags":["userTwapHistory"],"summary":"Subscribe to userTwapHistory","description":"Subscription to user TWAP history events for a specific user.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of subscription.","enum":["userTwapHistory"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Subscription to user TWAP history events for a specific user."}}},"required":true},"responses":{"200":{"description":"Event of user TWAP history.","content":{"application/json":{"schema":{"type":"object","properties":{"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."},"history":{"type":"array","items":{"type":"object","properties":{"time":{"type":"number","minimum":0,"description":"Creation time of the history record (in seconds since epoch)."},"state":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"executedNtl":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Executed notional value."},"executedSz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Executed size."},"minutes":{"type":"number","minimum":0,"description":"Duration in minutes."},"randomize":{"type":"boolean","description":"Indicates if the TWAP randomizes execution."},"reduceOnly":{"type":"boolean","description":"Indicates if the order is reduce-only."},"side":{"enum":["B","A"],"description":"Order side (\"B\" = Bid/Buy, \"A\" = Ask/Sell)."},"sz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Order size."},"timestamp":{"type":"number","minimum":0,"description":"Start time of the TWAP order (in ms since epoch)."},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["coin","executedNtl","executedSz","minutes","randomize","reduceOnly","side","sz","timestamp","user"],"description":"State of the TWAP order."},"status":{"oneOf":[{"type":"object","properties":{"status":{"enum":["finished","activated","terminated"],"description":"Status of the TWAP order."}},"required":["status"]},{"type":"object","properties":{"status":{"description":"Status of the TWAP order.","enum":["error"]},"description":{"type":"string","description":"Error message."}},"required":["status","description"]}],"description":"Current status of the TWAP order.\n- `\"finished\"`: Fully executed.\n- `\"activated\"`: Active and executing.\n- `\"terminated\"`: Terminated.\n- `\"error\"`: An error occurred."},"twapId":{"type":"number","minimum":0,"description":"ID of the TWAP."}},"required":["time","state","status"]},"description":"Array of user's TWAP history."},"isSnapshot":{"description":"Whether this is an initial snapshot.","enum":[true]}},"required":["user","history"],"description":"Event of user TWAP history."}}}}}}}}}
```


# userTwapSliceFills

## Subscribe to userTwapSliceFills

> Subscription to user TWAP slice fill events for a specific user.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid Subscription - userTwapSliceFills","version":"1.0.0"},"tags":[{"name":"userTwapSliceFills"}],"servers":[{"url":"wss://api.hyperliquid.xyz/ws","description":"Mainnet WebSocket"},{"url":"wss://api.hyperliquid-testnet.xyz/ws","description":"Testnet WebSocket"}],"paths":{"/":{"post":{"tags":["userTwapSliceFills"],"summary":"Subscribe to userTwapSliceFills","description":"Subscription to user TWAP slice fill events for a specific user.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of subscription.","enum":["userTwapSliceFills"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Subscription to user TWAP slice fill events for a specific user."}}},"required":true},"responses":{"200":{"description":"Event of user TWAP slice fill.","content":{"application/json":{"schema":{"type":"object","properties":{"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."},"twapSliceFills":{"type":"array","items":{"type":"object","properties":{"fill":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"px":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Price."},"sz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Size."},"side":{"enum":["B","A"],"description":"Order side (\"B\" = Bid/Buy, \"A\" = Ask/Sell)."},"time":{"type":"number","minimum":0,"description":"Timestamp when the trade occurred (in ms since epoch)."},"startPosition":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Start position size."},"dir":{"type":"string","description":"Direction indicator for frontend display."},"closedPnl":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Realized PnL."},"hash":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"L1 transaction hash."},"oid":{"type":"number","minimum":0,"description":"Order ID."},"crossed":{"type":"boolean","description":"Indicates if the fill was a taker order."},"fee":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Fee charged or rebate received (negative indicates rebate)."},"tid":{"type":"number","minimum":0,"description":"Unique transaction identifier for a partial fill of an order."},"feeToken":{"type":"string","description":"Token in which the fee is denominated (e.g., \"USDC\")."},"twapId":{"anyOf":[{"type":"number","minimum":0,"nullable":true}],"description":"ID of the TWAP."}},"required":["coin","px","sz","side","time","startPosition","dir","closedPnl","hash","oid","crossed","fee","tid","feeToken","twapId"],"description":"TWAP fill record."},"twapId":{"type":"number","minimum":0,"description":"ID of the TWAP."}},"required":["fill","twapId"]},"description":"Array of user's twap slice fills."},"isSnapshot":{"description":"Whether this is an initial snapshot.","enum":[true]}},"required":["user","twapSliceFills"],"description":"Event of user TWAP slice fill."}}}}}}}}}
```


# webData2

## Subscribe to webData2

> Subscription to comprehensive user and market data events.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid Subscription - webData2","version":"1.0.0"},"tags":[{"name":"webData2"}],"servers":[{"url":"wss://api.hyperliquid.xyz/ws","description":"Mainnet WebSocket"},{"url":"wss://api.hyperliquid-testnet.xyz/ws","description":"Testnet WebSocket"}],"paths":{"/":{"post":{"tags":["webData2"],"summary":"Subscribe to webData2","description":"Subscription to comprehensive user and market data events.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of subscription.","enum":["webData2"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Subscription to comprehensive user and market data events."}}},"required":true},"responses":{"200":{"description":"Event of comprehensive user and market data.","content":{"application/json":{"schema":{"type":"object","properties":{"clearinghouseState":{"type":"object","properties":{"marginSummary":{"type":"object","properties":{"accountValue":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total account value."},"totalNtlPos":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total notional position value."},"totalRawUsd":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total raw USD value."},"totalMarginUsed":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total margin used."}},"required":["accountValue","totalNtlPos","totalRawUsd","totalMarginUsed"],"description":"Margin summary details."},"crossMarginSummary":{"type":"object","properties":{"accountValue":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total account value."},"totalNtlPos":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total notional position value."},"totalRawUsd":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total raw USD value."},"totalMarginUsed":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total margin used."}},"required":["accountValue","totalNtlPos","totalRawUsd","totalMarginUsed"],"description":"Cross-margin summary details."},"crossMaintenanceMarginUsed":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Maintenance margin used for cross-margin positions."},"withdrawable":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount available for withdrawal."},"assetPositions":{"type":"array","items":{"type":"object","properties":{"type":{"description":"Position type.","enum":["oneWay"]},"position":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"szi":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Signed position size."},"leverage":{"oneOf":[{"type":"object","properties":{"type":{"description":"Leverage type.","enum":["isolated"]},"value":{"type":"number","minimum":1,"description":"Leverage value used."},"rawUsd":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount of USD used (1 = $1)."}},"required":["type","value","rawUsd"]},{"type":"object","properties":{"type":{"description":"Leverage type.","enum":["cross"]},"value":{"type":"number","minimum":1,"description":"Leverage value used."}},"required":["type","value"]}],"description":"Leverage details."},"entryPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Average entry price."},"positionValue":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Position value."},"unrealizedPnl":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Unrealized profit and loss."},"returnOnEquity":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Return on equity."},"liquidationPx":{"anyOf":[{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","nullable":true}],"description":"Liquidation price."},"marginUsed":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Margin used."},"maxLeverage":{"type":"number","minimum":1,"description":"Maximum allowed leverage."},"cumFunding":{"type":"object","properties":{"allTime":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Total funding paid or received since account opening."},"sinceOpen":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Funding accumulated since the position was opened."},"sinceChange":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Funding accumulated since the last change in position size."}},"required":["allTime","sinceOpen","sinceChange"],"description":"Cumulative funding details."}},"required":["coin","szi","leverage","entryPx","positionValue","unrealizedPnl","returnOnEquity","liquidationPx","marginUsed","maxLeverage","cumFunding"],"description":"Position details."}},"required":["type","position"]},"description":"Array of asset positions."},"time":{"type":"number","minimum":0,"description":"Timestamp when data was retrieved (in ms since epoch)."}},"required":["marginSummary","crossMarginSummary","crossMaintenanceMarginUsed","withdrawable","assetPositions","time"],"description":"Account summary for perpetual trading."},"leadingVaults":{"type":"array","items":{"type":"object","properties":{"address":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Vault address."},"name":{"type":"string","description":"Vault name."}},"required":["address","name"]},"description":"Array of leading vaults for a user."},"totalVaultEquity":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total equity in vaults."},"openOrders":{"type":"array","items":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"side":{"enum":["B","A"],"description":"Order side (\"B\" = Bid/Buy, \"A\" = Ask/Sell)."},"limitPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Limit price."},"sz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Size."},"oid":{"type":"number","minimum":0,"description":"Order ID."},"timestamp":{"type":"number","minimum":0,"description":"Timestamp when the order was placed (in ms since epoch)."},"origSz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Original size at order placement."},"triggerCondition":{"type":"string","description":"Condition for triggering the order."},"isTrigger":{"type":"boolean","description":"Indicates if the order is a trigger order."},"triggerPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Trigger price."},"children":{"type":"array","items":{},"description":"Child orders associated with this order."},"isPositionTpsl":{"type":"boolean","description":"Indicates if the order is a position TP/SL order."},"reduceOnly":{"type":"boolean","description":"Indicates whether the order is reduce-only."},"orderType":{"enum":["Market","Limit","Stop Market","Stop Limit","Take Profit Market","Take Profit Limit"],"description":"Order type for market execution.\n- `\"Market\"`: Executes immediately at the market price.\n- `\"Limit\"`: Executes at the specified limit price or better.\n- `\"Stop Market\"`: Activates as a market order when a stop price is reached.\n- `\"Stop Limit\"`: Activates as a limit order when a stop price is reached.\n- `\"Take Profit Market\"`: Executes as a market order when a take profit price is reached.\n- `\"Take Profit Limit\"`: Executes as a limit order when a take profit price is reached. "},"tif":{"anyOf":[{"enum":["Gtc","Ioc","Alo","FrontendMarket","LiquidationMarket"],"nullable":true}],"description":"Time-in-force:\n- `\"Gtc\"`: Remains active until filled or canceled.\n- `\"Ioc\"`: Fills immediately or cancels any unfilled portion.\n- `\"Alo\"`: Adds liquidity only.\n- `\"FrontendMarket\"`: Similar to Ioc, used in Hyperliquid UI.\n- `\"LiquidationMarket\"`: Similar to Ioc, used in Hyperliquid UI."},"cloid":{"anyOf":[{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":34,"maxLength":34,"nullable":true}],"description":"Client Order ID."}},"required":["coin","side","limitPx","sz","oid","timestamp","origSz","triggerCondition","isTrigger","triggerPx","children","isPositionTpsl","reduceOnly","orderType","tif","cloid"],"description":"Open order with additional display information."},"description":"Array of open orders with additional display information."},"agentAddress":{"anyOf":[{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"nullable":true}],"description":"Agent address if one exists."},"agentValidUntil":{"anyOf":[{"type":"number","minimum":0,"nullable":true}],"description":"Timestamp until which the agent is valid."},"cumLedger":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Cumulative ledger value."},"meta":{"type":"object","properties":{"universe":{"type":"array","items":{"type":"object","properties":{"szDecimals":{"type":"number","minimum":0,"description":"Minimum decimal places for order sizes."},"name":{"type":"string","description":"Name of the universe."},"maxLeverage":{"type":"number","minimum":1,"description":"Maximum allowed leverage."},"marginTableId":{"type":"number","minimum":0,"description":"Unique identifier for the margin requirements table."},"onlyIsolated":{"description":"Indicates if only isolated margin trading is allowed.","enum":[true]},"isDelisted":{"description":"Indicates if the universe is delisted.","enum":[true]},"marginMode":{"enum":["strictIsolated","noCross"],"description":"Trading margin mode constraint."},"growthMode":{"description":"Indicates if growth mode is enabled.","enum":["enabled"]},"lastGrowthModeChangeTime":{"type":"string","pattern":"^\\d{4}-(?:0[1-9]|1[0-2])-(?:[12]\\d|0[1-9]|3[01])[T ](?:0\\d|1\\d|2[0-3])(?::[0-5]\\d){2}(?:\\.\\d{1,9})?$","description":"Timestamp of the last growth mode change."}},"required":["szDecimals","name","maxLeverage","marginTableId"]},"description":"Trading universes available for perpetual trading."},"marginTables":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"object","properties":{"description":{"type":"string","description":"Description of the margin table."},"marginTiers":{"type":"array","items":{"type":"object","properties":{"lowerBound":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Lower position size boundary for this tier."},"maxLeverage":{"type":"number","minimum":1,"description":"Maximum allowed leverage for this tier."}},"required":["lowerBound","maxLeverage"]},"description":"Array of margin tiers defining leverage limits."}},"required":["description","marginTiers"],"description":"Margin requirements table with multiple tiers."}],"minItems":2},"description":"Margin requirement tables for different leverage tiers."},"collateralToken":{"type":"number","minimum":0,"description":"Collateral token index."}},"required":["universe","marginTables","collateralToken"],"description":"Metadata for perpetual assets."},"assetCtxs":{"type":"array","items":{"type":"object","properties":{"prevDayPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Previous day's closing price."},"dayNtlVlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Daily notional volume."},"markPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Mark price."},"midPx":{"anyOf":[{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","nullable":true}],"description":"Mid price."},"funding":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Funding rate."},"openInterest":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total open interest."},"premium":{"anyOf":[{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","nullable":true}],"description":"Premium price."},"oraclePx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Oracle price."},"impactPxs":{"anyOf":[{"type":"array","items":{"type":"string"},"nullable":true}],"description":"Array of impact prices."},"dayBaseVlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Daily volume in base currency."}},"required":["prevDayPx","dayNtlVlm","markPx","midPx","funding","openInterest","premium","oraclePx","impactPxs","dayBaseVlm"],"description":"Perpetual asset context."},"description":"Array of contexts for each perpetual asset."},"serverTime":{"type":"number","minimum":0,"description":"Server timestamp (in ms since epoch)."},"isVault":{"type":"boolean","description":"Whether this account is a vault."},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."},"twapStates":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"executedNtl":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Executed notional value."},"executedSz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Executed size."},"minutes":{"type":"number","minimum":0,"description":"Duration in minutes."},"randomize":{"type":"boolean","description":"Indicates if the TWAP randomizes execution."},"reduceOnly":{"type":"boolean","description":"Indicates if the order is reduce-only."},"side":{"enum":["B","A"],"description":"Order side (\"B\" = Bid/Buy, \"A\" = Ask/Sell)."},"sz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Order size."},"timestamp":{"type":"number","minimum":0,"description":"Start time of the TWAP order (in ms since epoch)."},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["coin","executedNtl","executedSz","minutes","randomize","reduceOnly","side","sz","timestamp","user"],"description":"TWAP order state."}],"minItems":2},"description":"Array of tuples containing TWAP order ID and its state."},"spotState":{"type":"object","properties":{"balances":{"type":"array","items":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"token":{"type":"number","minimum":0,"description":"Unique identifier for the token."},"total":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total balance."},"hold":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount on hold."},"entryNtl":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Entry notional value."}},"required":["coin","token","total","hold","entryNtl"]},"description":"Array of available token balances."},"evmEscrows":{"type":"array","items":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"token":{"type":"number","minimum":0,"description":"Unique identifier for the token."},"total":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total balance."}},"required":["coin","token","total"]},"description":"Array of escrowed balances."}},"required":["balances"],"description":"Account summary for spot trading."},"spotAssetCtxs":{"type":"array","items":{"type":"object","properties":{"prevDayPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Previous day's closing price."},"dayNtlVlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Daily notional volume."},"markPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Mark price."},"midPx":{"anyOf":[{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","nullable":true}],"description":"Mid price."},"circulatingSupply":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Circulating supply."},"coin":{"type":"string","description":"Asset symbol."},"totalSupply":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total supply."},"dayBaseVlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Daily volume in base currency."}},"required":["prevDayPx","dayNtlVlm","markPx","midPx","circulatingSupply","coin","totalSupply","dayBaseVlm"],"description":"Spot asset context."},"description":"Asset context for each spot asset."},"optOutOfSpotDusting":{"description":"Whether the user has opted out of spot dusting.","enum":[true]},"perpsAtOpenInterestCap":{"type":"array","items":{"type":"string"},"description":"Assets currently at their open interest cap."}},"required":["clearinghouseState","leadingVaults","totalVaultEquity","openOrders","agentAddress","agentValidUntil","cumLedger","meta","assetCtxs","serverTime","isVault","user","twapStates","spotAssetCtxs"],"description":"Event of comprehensive user and market data."}}}}}}}}}
```


# webData3

## Subscribe to webData3

> Subscription to comprehensive user and market data events.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid Subscription - webData3","version":"1.0.0"},"tags":[{"name":"webData3"}],"servers":[{"url":"wss://api.hyperliquid.xyz/ws","description":"Mainnet WebSocket"},{"url":"wss://api.hyperliquid-testnet.xyz/ws","description":"Testnet WebSocket"}],"paths":{"/":{"post":{"tags":["webData3"],"summary":"Subscribe to webData3","description":"Subscription to comprehensive user and market data events.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of subscription.","enum":["webData3"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Subscription to comprehensive user and market data events."}}},"required":true},"responses":{"200":{"description":"Event of comprehensive user and market data.","content":{"application/json":{"schema":{"type":"object","properties":{"userState":{"type":"object","properties":{"agentAddress":{"anyOf":[{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"nullable":true}],"description":"Agent address if one exists."},"agentValidUntil":{"anyOf":[{"type":"number","minimum":0,"nullable":true}],"description":"Timestamp until which the agent is valid."},"cumLedger":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Cumulative ledger value."},"serverTime":{"type":"number","minimum":0,"description":"Server timestamp (in ms since epoch)."},"isVault":{"type":"boolean","description":"Whether this account is a vault."},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."},"optOutOfSpotDusting":{"description":"Whether the user has opted out of spot dusting.","enum":[true]},"dexAbstractionEnabled":{"type":"boolean","description":"Whether DEX abstraction is enabled."},"abstraction":{"enum":["dexAbstraction","disabled"],"description":"Abstraction mode for the user account."}},"required":["agentAddress","agentValidUntil","cumLedger","serverTime","isVault","user"],"description":"User state information."},"perpDexStates":{"type":"array","items":{"type":"object","properties":{"totalVaultEquity":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total equity in vaults."},"perpsAtOpenInterestCap":{"type":"array","items":{"type":"string"},"description":"Assets currently at their open interest cap."},"leadingVaults":{"type":"array","items":{"type":"object","properties":{"address":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Vault address."},"name":{"type":"string","description":"Vault name."}},"required":["address","name"]},"description":"Array of leading vaults."}},"required":["totalVaultEquity"]},"description":"Array of perpetual DEX states."}},"required":["userState","perpDexStates"],"description":"Event of comprehensive user and market data."}}}}}}}}}
```


# Symbol Converter

Utility for converting human-readable asset symbols to Hyperliquid asset IDs.

Hyperliquid uses numeric asset IDs internally:

* **Perpetuals:** `0`, `1`, `2`, ... (index in `meta.universe`)
* **Spot:** `10000 + index` (e.g., `10107` for HYPE/USDC)
* **Builder DEX:** `100000 + dex_index * 10000 + asset_index`

See [Asset IDs](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/asset-ids) in Hyperliquid docs.

## Import

```ts
import { SymbolConverter } from "@nktkas/hyperliquid/utils";
```

## Usage

```ts
import { HttpTransport } from "@nktkas/hyperliquid";
import { SymbolConverter } from "@nktkas/hyperliquid/utils";

const transport = new HttpTransport();
const converter = await SymbolConverter.create({ transport });

// Perpetual
converter.getAssetId("BTC"); // 0
converter.getSzDecimals("BTC"); // 5

// Spot market (BASE/QUOTE format)
converter.getAssetId("HYPE/USDC"); // 10107
converter.getSzDecimals("HYPE/USDC"); // 2
converter.getSpotPairId("HYPE/USDC"); // "@107"
```

## With Builder DEX

Builder DEX assets require explicit opt-in:

```ts
// Load specific dexs
const converter = await SymbolConverter.create({
  transport,
  dexs: ["test"], // load only "test" dex
});

// Or load all dexs
const converter = await SymbolConverter.create({
  transport,
  dexs: true, // load all available dexs
});

converter.getAssetId("test:ABC"); // 110000
```

## Methods

### getAssetId

Returns the numeric asset ID for use in exchange requests.

```ts
converter.getAssetId("BTC"); // 0 (perpetual)
converter.getAssetId("HYPE/USDC"); // 10107 (spot)
converter.getAssetId("test:ABC"); // 110000 (builder dex)
converter.getAssetId("UNKNOWN"); // undefined
```

### getSzDecimals

Returns the size decimals for an asset. Used for formatting order sizes and prices.

```ts
converter.getSzDecimals("BTC"); // 5 → size like "0.00001"
converter.getSzDecimals("HYPE/USDC"); // 2 → size like "0.01"
```

### getSpotPairId

Returns the spot pair ID for info endpoints and subscriptions (l2Book, trades, etc.).

```ts
converter.getSpotPairId("HYPE/USDC"); // "@107"
converter.getSpotPairId("PURR/USDC"); // "PURR/USDC" (special case)
```

### reload

Refreshes asset mappings from the API. Useful when new assets are listed.

```ts
await converter.reload();
```

## Parameters

### transport (required)

* **Type:** [`HttpTransport`](https://nktkas.gitbook.io/hyperliquid/core-concepts/transports#httptransport) | [`WebSocketTransport`](https://nktkas.gitbook.io/hyperliquid/core-concepts/transports#websockettransport)

Transport instance for API requests.

### dexs (optional)

* **Type:** `string[]` | `boolean`
* **Default:** `false`

Builder DEX support:

* `false` or omitted - don't load builder dexs
* `true` - load all available dexs
* `["dex1", "dex2"]` - load only specified dexs

```ts
// Don't load dexs (default)
await SymbolConverter.create({ transport });

// Load all dexs
await SymbolConverter.create({ transport, dexs: true });

// Load specific dexs
await SymbolConverter.create({ transport, dexs: ["test"] });
```


# Formatting

Utilities for formatting prices and sizes according to Hyperliquid's [tick and lot size rules](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/tick-and-lot-size).

## Import

```ts
import { formatPrice, formatSize } from "@nktkas/hyperliquid/utils";
```

## formatPrice

Formats a price according to Hyperliquid rules:

* Maximum 5 significant figures
* Maximum `(6 - szDecimals)` decimal places for perps, `(8 - szDecimals)` for spot
* Integer prices are always allowed regardless of significant figures

```ts
import { formatPrice } from "@nktkas/hyperliquid/utils";

// Perpetual (default)
formatPrice("1234.5", 0); // "1234.5" ✓
formatPrice("1234.56", 0); // "1234.5" (truncated to 5 sig figs)
formatPrice("0.001234", 0); // "0.001234" ✓
formatPrice("0.0012345", 0); // "0.001234" (truncated to 5 sig figs)

// Spot market
formatPrice("0.0001234", 0, "spot"); // "0.0001234" ✓
formatPrice("0.00012345", 2, "spot"); // "0.000123" (max 6 decimals for szDecimals=2)

// Integer prices always allowed
formatPrice("123456", 0); // "123456" ✓
```

### Parameters

#### price (required)

* **Type:** `string` | `number`

The price to format.

#### szDecimals (required)

* **Type:** `number`

Size decimals of the asset. Get from [`SymbolConverter.getSzDecimals()`](https://nktkas.gitbook.io/hyperliquid/symbol-converter#getszdecimals) or `meta` response.

#### type (optional)

* **Type:** `"perp"` | `"spot"`
* **Default:** `"perp"`

Market type. Affects maximum decimal places (6 for perp, 8 for spot).

### Throws

* `RangeError` - if the formatted price becomes `0` after truncation

```ts
formatPrice("0.0000001", 0); // throws RangeError: Price is too small and was truncated to 0
```

## formatSize

Formats a size by truncating to `szDecimals` decimal places.

```ts
import { formatSize } from "@nktkas/hyperliquid/utils";

formatSize("1.23456789", 5); // "1.23456"
formatSize("1.23456789", 2); // "1.23"
formatSize("1.999", 0); // "1"
```

### Parameters

#### size (required)

* **Type:** `string` | `number`

The size to format.

#### szDecimals (required)

* **Type:** `number`

Size decimals of the asset. Get from [`SymbolConverter.getSzDecimals()`](https://nktkas.gitbook.io/hyperliquid/symbol-converter#getszdecimals) or `meta` response.

### Throws

* `RangeError` - if the formatted size becomes `0` after truncation (prevents accidentally closing entire position)

```ts
formatSize("0.001", 2); // throws RangeError: Size is too small and was truncated to 0
```

## Example: Placing an Order

```ts
import { ExchangeClient, HttpTransport } from "@nktkas/hyperliquid";
import { formatPrice, formatSize, SymbolConverter } from "@nktkas/hyperliquid/utils";

const transport = new HttpTransport();
const converter = await SymbolConverter.create({ transport });
const client = new ExchangeClient({ transport, wallet });

const symbol = "BTC";
const assetId = converter.getAssetId(symbol); // 0
const szDecimals = converter.getSzDecimals(symbol); // 5

const price = formatPrice("97123.456789", szDecimals); // "97123"
const size = formatSize("0.00123456789", szDecimals); // "0.00123"

await client.order({
  orders: [{
    a: assetId,
    b: true,
    p: price,
    s: size,
    r: false,
    t: { limit: { tif: "Gtc" } },
  }],
  grouping: "na",
});
```


# Signing

Low-level utilities for signing Hyperliquid transactions. Most users don't need this - [`ExchangeClient`](https://nktkas.gitbook.io/hyperliquid/core-concepts/clients#exchangeclient) handles signing automatically.

Use these utilities when:

* **Custom wallet integration** - implement `AbstractViemLocalAccount` to use hardware wallets, MPC, or other signing systems
* **Signing unsupported actions** - sign new action types that are not yet implemented in the SDK

## Import

```ts
import {
  createL1ActionHash,
  PrivateKeySigner,
  signL1Action,
  signMultiSigAction,
  signUserSignedAction,
} from "@nktkas/hyperliquid/signing";
```

## PrivateKeySigner

Lightweight signer that doesn't require viem or ethers.

```ts
import { PrivateKeySigner } from "@nktkas/hyperliquid/signing";

const signer = new PrivateKeySigner("0xabc123...");
console.log(signer.address); // "0x..."
```

Use with `ExchangeClient`:

```ts
import { ExchangeClient, HttpTransport } from "@nktkas/hyperliquid";
import { PrivateKeySigner } from "@nktkas/hyperliquid/signing";

const client = new ExchangeClient({
  transport: new HttpTransport(),
  wallet: new PrivateKeySigner("0x..."),
});
```

## signL1Action

Signs an L1 action - trading operations like orders, cancels, leverage updates, TWAP, vault operations, etc.

```ts
import { signL1Action } from "@nktkas/hyperliquid/signing";
import { privateKeyToAccount } from "viem/accounts";

const wallet = privateKeyToAccount("0x...");

const action = {
  type: "cancel",
  cancels: [{ a: 0, o: 12345 }],
};
const nonce = Date.now();

const signature = await signL1Action({ wallet, action, nonce });

// Send manually
const response = await fetch("https://api.hyperliquid.xyz/exchange", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action, signature, nonce }),
});
```

### Parameters

#### wallet (required)

* **Type:** `AbstractWallet`

Wallet to sign (viem, ethers, or PrivateKeySigner).

#### action (required)

* **Type:** `Record<string, unknown>`

Action object. Key order matters for hash calculation.

#### nonce (required)

* **Type:** `number`

Timestamp in milliseconds.

#### isTestnet (optional)

* **Type:** `boolean`
* **Default:** `false`

Use testnet instead of mainnet.

#### vaultAddress (optional)

* **Type:** `` `0x${string}` ``

[Vault address](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#subaccounts-and-vaults) for trading on behalf of a vault.

#### expiresAfter (optional)

* **Type:** `number`

[Expiration time](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#expires-after) of the action in milliseconds since epoch.

{% hint style="warning" %}
The action hash depends on key order. Use valibot schema to guarantee correct order:

```ts
import { CancelByCloidRequest } from "@nktkas/hyperliquid/api/exchange";
import * as v from "valibot";

const action = v.parse(CancelByCloidRequest.entries.action, {
  cancels: [{ cloid: 12345, asset: 0 }],
  type: "cancel",
});
// => { type, cancels: [{ asset, cloid }] }
```

{% endhint %}

## signUserSignedAction

Signs a user-signed action - transfers and administrative operations like withdraw, usdSend, spotSend, approveAgent, etc. Uses EIP-712 typed data with `signatureChainId`.

```ts
import { signUserSignedAction } from "@nktkas/hyperliquid/signing";
import { ApproveAgentTypes } from "@nktkas/hyperliquid/api/exchange";
import { privateKeyToAccount } from "viem/accounts";

const wallet = privateKeyToAccount("0x...");

const action = {
  type: "approveAgent",
  signatureChainId: "0x66eee",
  hyperliquidChain: "Mainnet",
  agentAddress: "0x...",
  agentName: "MyAgent",
  nonce: Date.now(),
};

const signature = await signUserSignedAction({
  wallet,
  action,
  types: ApproveAgentTypes,
});
```

### Parameters

#### wallet (required)

* **Type:** `AbstractWallet`

Wallet to sign (viem, ethers, or PrivateKeySigner).

#### action (required)

* **Type:** `object`

Action object with `signatureChainId` field.

#### types (required)

* **Type:** `object`

EIP-712 types for the action. Import from `@nktkas/hyperliquid/api/exchange` (e.g., `ApproveAgentTypes`).

## signMultiSigAction

Signs a multi-signature action. Requires signatures from multiple signers collected beforehand.

```ts
import { signL1Action, signMultiSigAction } from "@nktkas/hyperliquid/signing";
import { privateKeyToAccount } from "viem/accounts";

const multiSigUser = "0x..."; // multi-sig account address
const signerKeys = ["0x...", "0x..."]; // private keys of all signers
const leader = privateKeyToAccount(signerKeys[0] as `0x${string}`);

const action = {
  type: "scheduleCancel",
  time: Date.now() + 10000,
};
const nonce = Date.now();

// Collect signatures from all signers
const signatures = await Promise.all(
  signerKeys.map((key) =>
    signL1Action({
      wallet: privateKeyToAccount(key as `0x${string}`),
      action: [multiSigUser.toLowerCase(), leader.address.toLowerCase(), action],
      nonce,
      isTestnet: false,
    })
  ),
);

// Sign the multi-sig wrapper
const multiSigAction = {
  type: "multiSig",
  signatureChainId: "0x66eee",
  signatures,
  payload: {
    multiSigUser,
    outerSigner: leader.address,
    action,
  },
};

const signature = await signMultiSigAction({
  wallet: leader,
  action: multiSigAction,
  nonce,
});
```

## createL1ActionHash

Creates a hash of an L1 action without signing. Used internally by `signL1Action` as `connectionId` in EIP-712 structure. The hash depends on key order in the action object.

```ts
import { createL1ActionHash } from "@nktkas/hyperliquid/signing";

const action = {
  type: "cancel",
  cancels: [{ a: 0, o: 12345 }],
};

const hash = createL1ActionHash({
  action,
  nonce: Date.now(),
});
// => "0x..."
```

## AbstractWallet

The SDK accepts any wallet that implements `signTypedData`. Supported out of the box:

* **viem:** [Local accounts](https://viem.sh/docs/accounts/local), [JSON-RPC accounts](https://viem.sh/docs/accounts/jsonRpc)
* **ethers:** [Wallet](https://docs.ethers.org/v6/api/wallet/), [JsonRpcSigner](https://docs.ethers.org/v6/api/providers/jsonrpc/#JsonRpcSigner)
* Any object with `address` and `signTypedData` method

```ts
// viem
import { privateKeyToAccount } from "viem/accounts";
const wallet = privateKeyToAccount("0x...");

// ethers
import { Wallet } from "ethers";
const wallet = new Wallet("0x...");

// SDK (no viem or ethers dependency)
import { PrivateKeySigner } from "@nktkas/hyperliquid/signing";
const wallet = new PrivateKeySigner("0x...");
```


# Tree-shaking

The SDK supports tree-shaking through granular imports - reduce bundle size by \~50% by importing only the functions you need.

## Import

```ts
// Granular imports (tree-shakeable)
import { clearinghouseState } from "@nktkas/hyperliquid/api/info";
import { order } from "@nktkas/hyperliquid/api/exchange";
import { candle } from "@nktkas/hyperliquid/api/subscription";
```

## Usage

Functions have the same names as client methods. Instead of `client.order(...)`, you call `order(config, ...)`:

```ts
import { HttpTransport } from "@nktkas/hyperliquid";
import { order } from "@nktkas/hyperliquid/api/exchange";
import { privateKeyToAccount } from "viem/accounts";

const transport = new HttpTransport();
const wallet = privateKeyToAccount("0x...");

// Function takes config as first argument
const result = await order(
  { transport, wallet },
  {
    orders: [{
      a: 0,
      b: true,
      p: "30000",
      s: "0.1",
      r: false,
      t: { limit: { tif: "Gtc" } },
    }],
    grouping: "na",
  },
);
```

Compare with client approach:

```ts
import { ExchangeClient, HttpTransport } from "@nktkas/hyperliquid";
import { privateKeyToAccount } from "viem/accounts";

const client = new ExchangeClient({
  transport: new HttpTransport(),
  wallet: privateKeyToAccount("0x..."),
});

// Method on client instance
const result = await client.order({
  orders: [{
    a: 0,
    b: true,
    p: "30000",
    s: "0.1",
    r: false,
    t: { limit: { tif: "Gtc" } },
  }],
  grouping: "na",
});
```

## Info Functions

Info functions only need `transport`:

```ts
import { HttpTransport } from "@nktkas/hyperliquid";
import { allMids } from "@nktkas/hyperliquid/api/info";

const transport = new HttpTransport();

const mids = await allMids({ transport });
```

## Subscription Functions

Subscription functions require `WebSocketTransport`:

```ts
import { WebSocketTransport } from "@nktkas/hyperliquid";
import { trades } from "@nktkas/hyperliquid/api/subscription";

const transport = new WebSocketTransport();

const subscription = await trades({ transport }, { coin: "BTC" }, (data) => {
  console.log(data);
});
```

## Available Exports

| Export Path                            | Description                                                        |
| -------------------------------------- | ------------------------------------------------------------------ |
| `@nktkas/hyperliquid/api/info`         | Info API functions (`clearinghouseState`, `meta`, `allMids`, etc.) |
| `@nktkas/hyperliquid/api/exchange`     | Exchange API functions (`order`, `cancel`, `withdraw3`, etc.)      |
| `@nktkas/hyperliquid/api/subscription` | Subscription functions (`candle`, `trades`, `l2Book`, etc.)        |

## Valibot Schemas

These exports also include [valibot](https://valibot.dev) schemas for every API method:

```ts
import { ClearinghouseStateRequest, ClearinghouseStateResponse } from "@nktkas/hyperliquid/api/info";
import { OrderRequest, OrderResponse } from "@nktkas/hyperliquid/api/exchange";
```

### Available Schemas

Each method exports:

* `*Request` - full request schema (with `type`, `nonce`, `signature` for exchange)
* `*Response` - response schema from API

### Use Cases

**TypeScript types:**

```ts
import { ClearinghouseStateResponse } from "@nktkas/hyperliquid/api/info";
import * as v from "valibot";

type State = v.InferOutput<typeof ClearinghouseStateResponse>;
```

**Runtime validation:**

```ts
import { OrderRequest } from "@nktkas/hyperliquid/api/exchange";
import * as v from "valibot";

// Validate data before sending
const validated = v.parse(OrderRequest, {
  action: {
    type: "order",
    orders: [{ a: 0, b: true, p: "30000", s: "0.1", r: false, t: { limit: { tif: "Gtc" } } }],
    grouping: "na",
  },
  nonce: Date.now(),
  signature: { r: "0x...", s: "0x...", v: 27 },
});
```

**Field descriptions:**

Schemas include descriptions for all fields via `v.description()`, useful for generating documentation or exploring the API structure.


# CLI

Command-line interface for interacting with Hyperliquid API without writing code.

## Usage

```sh
npx @nktkas/hyperliquid <endpoint> <method> [options]
```

### endpoint

* **Type:** `"info"` | `"exchange"`

API endpoint to use:

* `info` - query market data and account state
* `exchange` - execute trading operations (requires `--private-key`)

### method

Method name matching the SDK client methods (e.g., `allMids`, `order`, `cancel`).

Run `npx @nktkas/hyperliquid --help` for the full list.

### --testnet

Use testnet instead of mainnet.

```sh
npx @nktkas/hyperliquid info allMids --testnet
```

### --timeout

* **Type:** `number`
* **Default:** `10000`

Request timeout in milliseconds.

```sh
npx @nktkas/hyperliquid info allMids --timeout 5000
```

### --private-key

* **Type:** `` `0x${string}` ``

Private key for exchange operations. Required for `exchange` endpoint.

```sh
npx @nktkas/hyperliquid exchange cancel --private-key 0x... --cancels '[{"a":0,"o":12345}]'
```

> \[!WARNING] Passing private keys via command line is insecure. Use environment variables:
>
> ```sh
> npx @nktkas/hyperliquid exchange cancel --private-key $PRIVATE_KEY --cancels '[{"a":0,"o":12345}]'
> ```

### --vault

* **Type:** `` `0x${string}` ``

Vault address for trading on behalf of a vault.

```sh
npx @nktkas/hyperliquid exchange order --private-key 0x... --vault 0x... --orders '[...]'
```

### --offline

Generate request payload without sending. Useful for debugging or signing transactions offline.

```sh
npx @nktkas/hyperliquid exchange order --private-key 0x... --offline --orders '[...]'
```

## Examples

### Info Endpoint

```sh
# Get all mid prices
npx @nktkas/hyperliquid info allMids

# Get ETH order book
npx @nktkas/hyperliquid info l2Book --coin ETH --nSigFigs 3

# Get user portfolio
npx @nktkas/hyperliquid info portfolio --user 0x...

# Get candle data
npx @nktkas/hyperliquid info candleSnapshot --coin BTC --interval 1h --startTime 1700000000000
```

### Exchange Endpoint

```sh
# Place limit order
npx @nktkas/hyperliquid exchange order --private-key 0x... \
  --orders '[{"a":0,"b":true,"p":"30000","s":"0.1","r":false,"t":{"limit":{"tif":"Gtc"}}}]'

# Cancel order
npx @nktkas/hyperliquid exchange cancel --private-key 0x... \
  --cancels '[{"a":0,"o":12345}]'

# Update leverage
npx @nktkas/hyperliquid exchange updateLeverage --private-key 0x... \
  --asset 0 --isCross true --leverage 5

# Withdraw funds
npx @nktkas/hyperliquid exchange withdraw3 --private-key 0x... \
  --destination 0x... --amount 100.5
```

## JSON Arguments

Some methods require JSON arguments. Escape quotes properly for your shell:

```sh
# Bash/Zsh
--orders '[{"a":0,"b":true}]'

# PowerShell
--orders '[{\"a\":0,\"b\":true}]'

# Windows CMD
--orders "[{\"a\":0,\"b\":true}]"
```

## Output

CLI outputs JSON to stdout. Format with [jq](https://jqlang.org/) or PowerShell:

```sh
# jq (cross-platform)
npx @nktkas/hyperliquid info allMids | jq .

# PowerShell (Windows)
npx @nktkas/hyperliquid info allMids | ConvertFrom-Json | ConvertTo-Json -Depth 10
```


# FAQ

## How to create a market order?

Hyperliquid doesn't have traditional market orders. Use a limit order with `tif: "Ioc"` (Immediate or Cancel) and a price that guarantees immediate execution:

```ts
import { ExchangeClient, HttpTransport, InfoClient } from "@nktkas/hyperliquid";
import { privateKeyToAccount } from "viem/accounts";

const info = new InfoClient({ transport: new HttpTransport() });
const exchange = new ExchangeClient({
  transport: new HttpTransport(),
  wallet: privateKeyToAccount("0x..."),
});

// Get current price
const mids = await info.allMids();
const currentPrice = parseFloat(mids["ETH"]);

// Buy: set price above current (e.g., +1%)
const buyPrice = currentPrice * 1.01;

// Sell: set price below current (e.g., -1%)
const sellPrice = currentPrice * 0.99;

await exchange.order({
  orders: [{
    a: 4,
    b: true,
    p: buyPrice,
    s: "0.1",
    r: false,
    t: { limit: { tif: "Ioc" } }, // Immediate or Cancel
  }],
  grouping: "na",
});
```

## How to use Agent Wallet?

[Agent wallets](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets#api-wallets) can sign on behalf of your master account. Use the agent's private key instead of master account's:

```ts
import { ExchangeClient, HttpTransport } from "@nktkas/hyperliquid";
import { privateKeyToAccount } from "viem/accounts";

const client = new ExchangeClient({
  transport: new HttpTransport(),
  wallet: privateKeyToAccount("0x..."), // agent's private key
});
```

Create an agent via `approveAgent` method or through the [Hyperliquid UI](https://app.hyperliquid.xyz/API).

## How to trade on behalf of a Vault or Sub-Account?

Pass [vault or sub-account address](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#subaccounts-and-vaults) via `vaultAddress` option:

```ts
// Per-request
await client.order({ ... }, { vaultAddress: "0x..." });

// Or set default for all requests
const client = new ExchangeClient({
  transport: new HttpTransport(),
  wallet: privateKeyToAccount("0x..."),
  defaultVaultAddress: "0x...",
});
```

## How to sign with MetaMask or other browser wallets?

L1 actions use chain ID `1337` (dev network, not in wallets by default) and sign an action hash instead of readable order details. Users will see `Agent { source: "a", connectionId: "0x..." }` - not useful.

**Solution:** Use [Agent Wallet](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets#api-wallets) for trading. Master account signs once to approve the agent.

