import { buildOrderPlan } from '/Users/ankit/Documents/make/hypeterminal/apps/terminal/src/domain/trade/order-intent.ts';
import { formatSizeForOrder, formatPriceForOrder } from '/Users/ankit/Documents/make/hypeterminal/apps/terminal/src/domain/trade/orders.ts';
import { deriveOrderEntry } from '/Users/ankit/Documents/make/hypeterminal/apps/terminal/src/domain/trade/order/derive.ts';
import { validateSlPrice } from '/Users/ankit/Documents/make/hypeterminal/apps/terminal/src/lib/trade/tpsl.ts';
import { scaleLevelMinNotionalValidator } from '/Users/ankit/Documents/make/hypeterminal/apps/terminal/src/lib/errors/definitions/scale.ts';
import { insufficientQuoteBalanceValidator } from '/Users/ankit/Documents/make/hypeterminal/apps/terminal/src/lib/errors/definitions/spot-balance.ts';
import { validateSpotOrder } from '/Users/ankit/Documents/make/hypeterminal/apps/terminal/src/lib/errors/stacks/spot-order.ts';
import { convertFeeToPercentageString } from '/Users/ankit/Documents/make/hypeterminal/packages/hl-react/src/signing/agent-utils.ts';
import { formatPrice, formatSize } from '/Users/ankit/Documents/make/hypeterminal/apps/terminal/node_modules/@nktkas/hyperliquid/esm/utils/mod.js';
import { createNonceManager } from '/Users/ankit/Documents/make/hypeterminal/apps/terminal/node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/_base/_nonce.js';
import { assertSuccessResponse } from '/Users/ankit/Documents/make/hypeterminal/apps/terminal/node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/_base/errors.js';

const base:any = {kind:'entry', assetId:0, side:'buy', orderType:'limit', sizeValue:1, szDecimals:2, markPx:100, price:100, slippageBps:250, reduceOnly:false, tif:'Gtc', limitPriceInput:'100', triggerPriceInput:'', scaleStartPriceInput:'', scaleEndPriceInput:'', scaleLevelsNum:null, tpSlEnabled:false, canUseTpSl:false, tpPriceNum:null, slPriceNum:null};
const which = process.argv[2];
if (which === 'claims') {
 console.log('size(100,0):',formatSizeForOrder(100,0),'SDK:',formatSize(100,0));
 console.log('price(0.092424):',formatPriceForOrder(0.092424),'SDK szDecimals=1:',formatPrice(0.092424,1,'perp'));
 console.log('fee(10):',convertFeeToPercentageString(10));
 try { assertSuccessResponse({status:'ok',response:{type:'order',data:{statuses:[{filled:{totalSz:'1',avgPx:'100',oid:1}},{error:'bad TP'}]}}}); } catch(e:any) { console.log('SDK:',e.name,e.message,'statuses='+JSON.stringify(e.response.response.data.statuses)); }
}
if (which === 'scale') {
 const plan=buildOrderPlan({...base,orderType:'scale',sizeValue:18,szDecimals:0,scaleStartPriceInput:'100',scaleEndPriceInput:'104',scaleLevelsNum:5});
 console.log('requested=18 sizes='+JSON.stringify(plan.orders.map(o=>o.s))+' total='+plan.orders.reduce((s,o)=>s+Number(o.s),0)+' errors='+JSON.stringify(plan.errors));
 console.log('SDK replacement sizes='+JSON.stringify(Array(5).fill(formatSize(18/5,0))));
 console.log('all SDK tick/lot checks pass='+plan.orders.every(o=>formatPrice(o.p,0,'perp')===o.p&&formatSize(o.s,0)===o.s));
 const c:any={scaleOrder:true,scaleStartPriceNum:1,scaleEndPriceNum:20,scaleLevelsNum:2,sizeValue:4};
 const p=buildOrderPlan({...base,orderType:'scale',sizeValue:4,scaleStartPriceInput:'1',scaleEndPriceInput:'20',scaleLevelsNum:2});
 console.log('min-notional validator='+scaleLevelMinNotionalValidator.validate(c)+' wireNotionals='+JSON.stringify(p.orders.map(o=>Number(o.s)*Number(o.p))));
}
if (which === 'quote-budget') {
 const market:any={kind:'spot',name:'@1',pairName:'HYPE/USDC',assetId:10001,szDecimals:2,tokensInfo:[{name:'HYPE',displayName:'HYPE'},{name:'USDC',displayName:'USDC'}]};
 const entry=deriveOrderEntry({isConnected:true,market,side:'buy',conversionPrice:100,sizeMode:'quote',sizeInput:'100',spotBalances:[{coin:'USDC',token:0,total:'150',hold:'0',entryNtl:'0'}] as any,maxTradeSzs:null,availableToTrade:null});
 const p=buildOrderPlan({...base,assetId:10001,sizeValue:entry.sizeValue,markPx:100,price:200,limitPriceInput:'200'});
 console.log('quoteInput=100 mark=100 limit=200 quoteBalance=150');
 console.log('derivedSize='+entry.sizeValue+' validatedOrderValue='+entry.orderValue+' quoteCheck='+insufficientQuoteBalanceValidator.validate({...entry,side:'buy',quoteAvailable:150} as any));
 console.log('fullSpotValidation='+JSON.stringify(validateSpotOrder({isConnected:true,isWalletLoading:false,isReadyToTrade:true,needsAgentApproval:false,availableBalance:150,hasMarket:true,hasAssetIndex:true,side:'buy',usesLimitPrice:true,price:200,sizeValue:entry.sizeValue,orderValue:entry.orderValue,baseAvailable:0,quoteAvailable:150,baseToken:'HYPE',quoteToken:'USDC'})));
 console.log('wire='+JSON.stringify(p.orders[0])+' wireNotional='+Number(p.orders[0].s)*Number(p.orders[0].p));
}
if (which === 'stop-profit') {
 console.log('long entry=100 mark=120 proposedStop=110');
 console.log('modal validator using entry:',validateSlPrice(100,110,'buy'));
 console.log('same validator using mark:',validateSlPrice(120,110,'buy'));
 console.log('long entry=100 mark=80 proposedStop=90: entryValidator='+validateSlPrice(100,90,'buy')+' markValidator='+validateSlPrice(80,90,'buy'));
}
if (which === 'nonce') {
 Date.now=()=>1800000000000;
 const key='same-persisted-agent:false';
 const tab1=createNonceManager(),tab2=createNonceManager();
 console.log('tab1 nonce:',tab1.getNonce(key));
 console.log('tab2 nonce:',tab2.getNonce(key));
 console.log('tab1 next nonce:',tab1.getNonce(key));
 console.log('tab2 next nonce:',tab2.getNonce(key));
}
if (which === 'zero-tpsl') {
 const p=buildOrderPlan({kind:'positionTpsl',assetId:0,isLong:true,tpPriceNum:120,slPriceNum:90});
 console.log('positionTpsl='+JSON.stringify(p));
 try {console.log(formatSize(p.orders[0].s,2));} catch(e:any) {console.log('formatSize(positionTpsl.s,2):',e.name,e.message);}
}
if (which === 'twap') {
 const p=buildOrderPlan({...base,orderType:'twap',sizeValue:3});
 console.log('buildOrderPlan entry orderType=twap: '+JSON.stringify(p));
}
