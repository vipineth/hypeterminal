# About Hyperliquid

### **What is Hyperliquid?**

Hyperliquid is a performant blockchain built with the vision of a fully onchain open financial system. Liquidity, user applications, and trading activity synergize on a unified platform that will ultimately house all of finance.&#x20;

### Technical overview

Hyperliquid is a layer one blockchain (L1) written and optimized from first principles.&#x20;

Hyperliquid uses a custom consensus algorithm called HyperBFT inspired by Hotstuff and its successors. Both the algorithm and networking stack are optimized from the ground up to support the unique demands of the L1.&#x20;

Hyperliquid state execution is split into two broad components: HyperCore and the HyperEVM. HyperCore includes fully onchain perpetual futures and spot order books. Every order, cancel, trade, and liquidation happens transparently with one-block finality inherited from HyperBFT. HyperCore currently supports 200k orders / second, with throughput constantly improving as the node software is further optimized.

The HyperEVM brings the familiar general-purpose smart contract platform pioneered by Ethereum to the Hyperliquid blockchain. With the HyperEVM, the performant liquidity and financial primitives of HyperCore are available as permissionless building blocks for all users and builders. See the HyperEVM documentation section for more technical details.

<figure><img src="https://2356094849-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FyUdp569E6w18GdfqlGvJ%2Fuploads%2FPgVwhFtylBB2kaxhQtZz%2FStack.png?alt=media&#x26;token=fb5b86d0-95be-41bb-91d3-d08c8603c284" alt="" width="563"><figcaption></figcaption></figure>


# Hyperliquid 101 for non-crypto audiences

Hyperliquid is a blockchain designed to upgrade the existing financial system. Just as electronic trading dramatically improved markets in the 2000s, Hyperliquid offers an opportunity for a massive technical upgrade of the existing financial system through a transparent, open, and performant blockchain.&#x20;

Hyperliquid is best known for perpetual futures<sup>1</sup> and spot trading, which drives billions in daily volume. >$1B in annualized fees go toward programmatically buying back the HYPE token. HYPE is used to secure the network, pay for network costs, provide trading fee discounts, and more.&#x20;

In the same way that AWS provides the cloud infrastructure for developers to build on the internet, Hyperliquid provides the liquidity infrastructure for developers to build financial applications. Independent teams using Hyperliquid’s liquidity infrastructure (e.g., mobile apps, trading terminals, self-custodial wallets) have generated >$45M in revenue through builder codes, which monetize user activity<sup>2</sup>. The ecosystem extends beyond trading, supporting borrowing, lending, minting compliant stablecoins, and launching perpetual contracts on any asset.

Hyperliquid modernizes market structure through:

* Transparency: All transactions are recorded on a public ledger, meaning anyone can view and verify them in real-time.
* Open access: Anyone can use and build applications without centralized gatekeepers.
* Resilience: A permissionless set of independent validators secure the network.&#x20;
* Performance: Up to 200,000 transactions per second can be processed. &#x20;

Core development is led by Hyperliquid Labs, with multiple teams contributing to the blockchain and ecosystem. Development has been fully self-funded, with no VCs or external capital. Hyperliquid’s vision is to be the credibly neutral infrastructure for finance; building from a clean slate is a prerequisite for that neutrality.  <br>

Footnotes&#x20;

1 Perpetual futures (perps) are a type of derivative contract. Compared to conventional futures, liquidity is concentrated in one instrument that never expires, so users don't have to roll positions on expiry or worry about physical delivery. Compared to options, perps also have better liquidity because there is no fragmentation across different expiries and strike prices. Perps are easier for users to understand and a way to express a leveraged directional position without expressing a view on volatility.&#x20;

2 For a dashboard on app monetization through builder codes, see: <https://www.flowscan.xyz/builders>


# Core contributors

Hyperliquid Labs is a core contributor supporting the growth of Hyperliquid, led by [Jeff](https://twitter.com/chameleon_jeff) and iliensinc, who are classmates from Harvard. Other members of the team are from Caltech and MIT and previously worked at Airtable, Citadel, Hudson River Trading, and Nuro.&#x20;

The team used to do proprietary market making in crypto in 2020 and expanded into defi in the summer of 2022. Existing platforms were plagued with issues, such as poor market design, bad tech, and clunky UX. It was easy to make money trading on these protocols, but disappointing to see how far behind defi was compared to its centralized counterparts. The team set out to build a product that could solve these issues and provide users with a seamless trading experience.&#x20;

Designing a performant decentralized L1 with an order book DEX built-in requires an intimate understanding of quantitative trading, cutting-edge blockchain technology, and clean UX, which the team is well-positioned to deliver. The team actively engages with and listens to the community; you are welcome to join the [Discord server](https://discord.gg/hyperliquid) to ask questions and share feedback.

Lastly, Hyperliquid Labs is self-funded and has not taken any external capital, which allows the team to focus on building a product they believe in without external pressure.


# Onboarding


# How to start trading

### What do I need to trade on Hyperliquid?

You can trade on Hyperliquid with a normal defi wallet or by logging in with your email address.

If you choose to use a normal defi wallet, you need: &#x20;

1. An EVM wallet
   * If you don’t already have an EVM wallet (e.g., Rabby, MetaMask, WalletConnect, Coinbase Wallet), you can set one up easily at <https://rabby.io/>.&#x20;
   * After downloading a wallet extension for your browser, create a new wallet.
   * Your wallet has a secret recovery phrase – anyone with access to your password or seed phrase can access your funds. Do not share your private key with anyone. Best practice is to record your seed phrase and store it in a safe physical location.
2. Collateral
   * USDC and ETH (gas to deposit) on Arbitrum, or
   * BTC on Bitcoin, ETH/ENA on Ethereum, SOL/2Z/BONK/FARTCOIN/PUMP/SPX on Solana, MON on Monad, or XPL on Plasma which can be traded for USDC on Hyperliquid

### How do I onboard to Hyperliquid?

There are many different interfaces and apps you can use, including

* [Based](https://based.one/) (web, iOS, Android)
* [Dexari](https://dexari.com/) (iOS, Android)
* [Lootbase](https://lootbase.com/) (iOS, Android)
* [Phantom](https://phantom.com/) (web extension, iOS, Android)
* [app.hyperliquid.xyz](https://app.hyperliquid.xyz/trade) (web)

If you choose to log in to app.hyperliquid.xyz with email:&#x20;

1. Click the "Connect" button and enter your email address. After you press "Submit," within a few seconds, a 6 digit code will be sent to your email. Type in the 6 digit code to login.&#x20;
2. Now you're connected. All that's left is to deposit. A new blockchain address is created for your email address. You can send USDC over Arbitrum, BTC on Bitcoin, ETH/ENA on Ethereum, SOL/2Z/BONK/FARTCOIN/PUMP/SPX on Solana, MON on Monad, or XPL on Plasma. It’s easy to do from a centralized exchange or another defi wallet.&#x20;

If you choose to connect to app.hyperliquid.xyz with a defi wallet:&#x20;

1. Click the “Connect” button and choose a wallet to connect. A pop-up will appear in your wallet extension asking you to connect to Hyperliquid. Press “Connect.”
2. Click the “Enable Trading” button. A pop-up will appear in your wallet extension asking you to sign a gas-less transaction. Press "Sign." &#x20;
3. Deposit to Hyperliquid, choosing from USDC on Arbitrum, BTC on Bitcoin, ETH/ENA on Ethereum, SOL/2Z/BONK/FARTCOIN/PUMP/SPX on Solana, MON on Monad, or XPL on Plasma.
   1. For USDC: enter the amount you want to deposit and click “Deposit.” Confirm the transaction in your EVM wallet.&#x20;
   2. For the others: send the spot asset to the destination address shown. Note that you will have to sell this asset for USDC, USDH, or USDT, depending on what quote asset is used for the assets you're interested in trading.&#x20;
4. You're now ready to trade.

### How do I trade perpetuals on Hyperliquid?

With perpetual contracts, you use USDC as collateral to long or short the token instead of buying the token itself, like in spot trading.&#x20;

1. Using the token selector, choose a token that you want to open a position in.&#x20;
2. Decide if you want to long or short that token. If you expect the token price to go up, you want to long. If you expect the token price to go down, you want to short.
3. Use the slider or type in the size of your position. Position size = your leverage amount \* your collateral&#x20;
4. Lastly, click Place Order. Click Confirm in the modal that appears. You can check the “Don’t show this again” box so you don’t have to confirm each order in the future.&#x20;

### How do I bridge USDC onto Hyperliquid?

1. You will need ETH and USDC on the Arbitrum network, since Hyperliquid’s native bridge is between Hyperliquid and Arbitrum. ETH will only be used as gas for transactions to deposit USDC. Trading on Hyperliquid does not cost gas.
   1. You can use various bridges, such as <https://bridge.arbitrum.io/>, <https://app.debridge.finance/>, <https://swap.mayan.finance/>, <https://app.across.to/bridge?>, <https://routernitro.com/swap>, <https://jumper.exchange/>, and <https://synapseprotocol.com/>
   2. Alternatively, you can move funds directly to Arbitrum from a centralized exchange, if you’re already using one.
2. Once you have ETH and USDC on Arbitrum, you can deposit by clicking the “Deposit” button on [https://app.hyperliquid.xyz/trade](https://hyperliquid.xyz/trade)

### How do I withdraw USDC from Hyperliquid?

1. On [https://app.hyperliquid.xyz/trade](https://hyperliquid.xyz/trade), click the “Withdraw” button in the bottom right.
2. Enter the amount of USDC you would like to withdraw and click “Withdraw to Arbitrum.” This transaction does not cost gas. There is a $1 withdrawal fee instead.


# How to use the HyperEVM

## For users:

### How do I add the HyperEVM to my wallet extension?

You can add the HyperEVM to your wallet extension by using Chainlist (<https://chainlist.org/chain/999>) or following these steps: [ ](https://chainlist.org/chain/999)

In your wallet extension, click “Add Custom Network” and enter the information below: &#x20;

Chain ID: 999&#x20;

Network Name: Hyperliquid&#x20;

RPC URL:[ https://rpc.hyperliquid.xyz/evm](https://rpc.hyperliquid.xyz/evm)&#x20;

Block explorer URL (optional):&#x20;

1. <https://hyperevmscan.io/>
2. <https://purrsec.com/>&#x20;
3. <https://www.hyperscan.com/>

Currency Symbol: HYPE

<figure><img src="https://2356094849-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FyUdp569E6w18GdfqlGvJ%2Fuploads%2Fv6qDC8gb3VDKlyizuuY9%2Fimage.png?alt=media&#x26;token=d84bee95-9b5c-4dda-b395-6b4464ff78fc" alt="" width="375"><figcaption></figcaption></figure>

### How do I move assets to and from the HyperEVM?

You can send assets to the HyperEVM from your Spot balances on HyperCore and vice versa by clicking the “Transfer to/from EVM” button on the Balances table of the Trade or Portfolio pages or clicking the "EVM <-> Core Transfer" button at the top of the Portfolio page. &#x20;

You can also send your HYPE to 0x2222222222222222222222222222222222222222 from either your Spot balances or from the EVM to transfer. Note that this only works for HYPE; sending other assets will lead to them being lost. Each spot asset has a unique transfer address.&#x20;

Sending from the HyperEVM to your Spot balances costs gas in HYPE on the HyperEVM. Sending from your Spot balances to the HyperEVM cost gas in HYPE on HyperCore (Spot). &#x20;

<figure><img src="https://2356094849-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FyUdp569E6w18GdfqlGvJ%2Fuploads%2FBYObU8WVK89lpgV9OkO9%2Fimage.png?alt=media&#x26;token=5a752e35-39f8-4dc6-a6ef-2950d8c0ccdf" alt="" width="375"><figcaption></figcaption></figure>

### What can I do on the HyperEVM?

Various teams are building applications, tooling, etc. on the HyperEVM. There are many community initiatives to track new releases on the HyperEVM, including:

<https://www.hypurr.co/ecosystem-projects>,[ https://hyperliquid.wiki/](https://hyperliquid.wiki/),[ https://data.asxn.xyz/dashboard/hyperliquid-ecosystem](https://data.asxn.xyz/dashboard/hyperliquid-ecosystem), <https://hl.eco/>, and the #hyperevm-eco channel in <https://discord.gg/hyperliquid>&#x20;

### How does the HyperEVM interact with the rest of the Hyperliquid blockchain?&#x20;

Hyperliquid is one state with HyperCore state (e.g., perps, spot, order books, other trading features) and HyperEVM state. Because everything is secured by the same HyperBFT consensus, there will ultimately be seamless integration between the two. You can build an application on the HyperEVM involving lending, trading, yield generation, etc. That application can directly access the liquidity on the order books, so that defi has CEX-like functionality for the first time. The application token can also list on native Hyperliquid trading permissionlessly, so that trading happens on the same chain as building.

### Why does gas spike?

While the Hyperliquid native blockchain is one of the most performant, high throughput blockchains today, the HyperEVM was intentionally launched with lower initial throughput. Because HyperCore and the HyperEVM share the same state, it is technically risky to allow the HyperEVM to consume more bandwidth on initial launch. The HyperEVM throughput will be increased over time in a gradual technical rollout.

Gas spikes on any chain when there is more demand than supply of blockspace. The HyperEVM uses the same gas system as Ethereum and many L2s, where there is a base fee and a priority fee: <https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1559.md>

### Can I send HYPE on the HyperEVM to a centralized exchange?

First confirm with the CEX that they support the HyperEVM. Note that the HyperEVM is one part of the Hyperliquid blockchain. HyperCore (e.g., perps, spot, and other trading features) and the HyperEVM are separate parts of the same blockchain. Some CEXs support sending and receiving HYPE from Spot balances on HyperCore, but not the HyperEVM. Always remember to do a test transaction when you are trying something for the first time.&#x20;

### How do I bridge assets to the HyperEVM from another chain?&#x20;

There are many different bridges / swaps, including:&#x20;

* LayerZero: <https://www.hyperbridge.xyz/>
* DeBridge: [https://app.debridge.finance/](https://app.debridge.finance/?inputChain=1\&outputChain=999\&inputCurrency=\&outputCurrency=\&dlnMode=simple)
* Gas.zip: <https://www.gas.zip/>
* Jumper: <https://jumper.exchange/>
* Cortex for HYPE: <https://cortexprotocol.com/agent?q=buy%20hype>
* Garden for BTC: <https://app.garden.finance/>&#x20;
* Mintify for ETH: <https://mintify.xyz/crypto>
* USDT0 for USDT0: <https://usdt0.to/transfer>
* Stargate for USDe: <https://stargate.finance/bridge?srcChain=ethereum&srcToken=0x4c9EDD5852cd905f086C759E8383e09bff1E68B3&dstChain=hyperliquid&dstToken=0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34>

## For builders:&#x20;

### What can I build on the HyperEVM?

Any application from other chains can already be built with the limited launch. The HyperEVM is a fully functional EVM of its own. Other features live on testnet will gradually roll out to mainnet.

### How do I set up an RPC? What RPCs are available?

There is one rpc hosted at rpc.hyperliquid.xyz/evm

Other builders are launching their own as well. Users may run a node, but it is not a requirement to serve an RPC, as all data is uploaded real-time to S3. See python SDK for an example: <https://github.com/hyperliquid-dex/hyperliquid-python-sdk/blob/master/examples/evm\\_block\\_indexer.py>

### How do I get gas on the HyperEVM?

The native token, HYPE, is the gas token on the HyperEVM. You can buy HYPE with USDC on Hyperliquid and then transfer from HyperCore to the HyperEVM. You can also use the bridges mentioned in [#how-do-i-bridge-assets-to-the-hyperevm-from-another-chain](#how-do-i-bridge-assets-to-the-hyperevm-from-another-chain "mention")

### What version of the EVM is the HyperEVM based on?

Cancun without blobs

### What is the difference between the HyperEVM and other EVMs, like Ethereum?

Functionality is largely the same, which makes it easy to build similar tooling and applications. The main differences are:

1. Dual block system: fast small blocks and slow big blocks
2. Interactions with the native side of the Hyperliquid state, providing a seamless onboarding for all Hyperliquid users to the HyperEVM


# How to stake HYPE

You can use different websites to stake HYPE on HyperCore, including:&#x20;

* <https://app.hyperliquid.xyz/staking/>
* <https://stake.nansen.ai/stake/hyperliquid>
* <https://app.validao.xyz/stake/hyperliquid>
* <https://hypurrscan.io/staking>

1. You will need HYPE in your Spot Balance on HyperCore. If you have HYPE on the HyperEVM, you would need to [transfer it from the HyperEVM](https://hyperliquid.gitbook.io/hyperliquid-docs/onboarding/how-to-use-the-hyperevm#how-do-i-move-assets-to-and-from-the-hyperevm) to HyperCore.
2. Transfer HYPE from your Spot Balance to your Staking Balance.

<div data-full-width="false"><figure><img src="https://2356094849-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FyUdp569E6w18GdfqlGvJ%2Fuploads%2FIbrHzX6DDRSvLlxdBWMS%2Fimage.png?alt=media&#x26;token=05cc2a03-b566-48fe-9835-9069cc9b0947" alt="" width="375"><figcaption></figcaption></figure></div>

3. Choose a validator to stake to. Staking to a validator has a 1 day lockup.&#x20;

To unstake, follow the same process in reverse

1. Unstake from a validator.
2. Transfer from your Staking Balance to your Spot Balance. This takes 7 days.&#x20;
3. After 7 days, the HYPE will appear in your Spot Balance.

For further questions, you can refer to the [Staking](https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-docs/hypercore/staking) section.


# Connect mobile via QR code

1. Connect via your wallet extension (e.g., Rabby, MetaMask) on desktop
2. On your phone, click the "Connect" button and select the option "Link Desktop Wallet." You will be prompted to activate your camera and scan a QR code&#x20;
3. On your desktop, click the PC+mobile icon in the top right of the navigation bar and sign the pop-up in your wallet extension. A QR code will appear
4. Use your phone camera to scan the QR code&#x20;

Now you can trade on the go with your phone.


# Export your email wallet

As a reminder, the Hyperliquid bridge contract only accepts Arbitrum USDC sent over Arbitrum. If you accidentally send the wrong asset to your defi wallet:&#x20;

1. Make sure you are logged in with the same email address
2. Click "Export Email Wallet" in the settings dropdown in the navigation bar
3. Follow the steps in the pop-up to copy your private key
4. Import your private key into the wallet extension of your choice&#x20;


# Testnet faucet

To use the testnet faucet, you need to have deposited on mainnet with the same address. You can then claim 1,000 mock USDC from the testnet faucet: <https://app.hyperliquid-testnet.xyz/drip>

If you are using an email login, Privy generates a different wallet address for mainnet and testnet. You can [export-your-email-wallet](https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-docs/onboarding/export-your-email-wallet "mention") from mainnet, import it into a wallet extension (e.g., [Rabby](https://support.rabby.io/hc/en-us/articles/11477459275279-How-to-migrate-from-other-wallets-to-Rabby-Wallet) or Metamask), and connect it to testnet.&#x20;


# HyperCore


# Overview

### Consensus

Hyperliquid is secured by HyperBFT, a variant of HotStuff consensus. Like most proof of stake chains, blocks are produced by validators in proportion to the native token staked to each validator.&#x20;

### Execution

The Hyperliquid state is comprised of HyperCore and the general purpose HyperEVM.&#x20;

HyperCore include margin and matching engine state. Importantly, HyperCore does not rely on the crutch of off-chain order books. A core design principle is full decentralization with one consistent order of transactions achieved through HyperBFT consensus.&#x20;

### Latency

Consensus currently uses an optimized consensus algorithm called HyperBFT, which is optimized for end-to-end latency. End-to-end latency is measured as duration between sending request to receiving committed response.&#x20;

For an order placed from a geographically co-located client, end-to-end latency has a median 0.2 seconds and 99th percentile 0.9 seconds. This performance allows users to port over automated strategies from other crypto venues with minimal changes and gives retail users instant feedback through the UI.

### Throughput

Mainnet currently supports approximately 200k orders/sec. The current bottleneck is execution. The consensus algorithm and networking stack can scale to millions of orders per second once the execution can keep up. There are plans to further optimize the execution logic once the need arises.&#x20;


# Bridge

Deposits to the bridge are signed by the validators and are credited when more than 2/3 of the staking power has signed the deposit.

Withdrawals from Hyperliquid are immediately deducted from the L1 balance, and validators sign the withdrawal as separate transactions. When 2/3 of the staking power has signed the withdrawal, an EVM transaction can be sent to the bridge to request the withdrawal.&#x20;

After a withdrawal is requested, there is a dispute period during which the bridge can be locked for a malicious withdrawal that does not match the Hyperliquid state. Cold wallet signatures of 2/3 of the stake-weighted validator set are required to unlock the bridge. &#x20;

After the dispute period, finalization transactions are sent, which distribute the USDC to the corresponding destination addresses. There is a similar mechanism to maintain the set of active validators and their corresponding stake on the bridge contract.&#x20;

Withdrawals do not require any Arbitrum ETH from the user. Instead, a withdrawal gas fee of 1 USDC is paid by the user on Hyperliquid to cover the Arbitrum gas costs of the validators. &#x20;

The bridge and its logic in relation to the L1 staking have been audited by Zellic. See the Hyperliquid Github repository for the full bridge code, and the [Audits](https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-docs/audits) section for the audit reports.


# API servers

API servers listen to updates from a node and maintains the blockchain state locally. The API server serves information about this state and also forwards user transactions to the node. The API serves two sources of data, REST and Websocket.&#x20;

When user transactions are sent to an API server, they are forwarded to the connected node, which then gossips the transaction as part of the HyperBFT consensus algorithm. Once the transaction has been included in a committed block on the L1, the API server responds to the original request with the execution response from the L1.


# Clearinghouse

The perps clearinghouse is a component of the execution state on HyperCore. It manages the perps margin state for each address, which includes balance and positions.&#x20;

Deposits are first credited to an address's cross margin balance. Positions by default are also opened in cross margin mode. Isolated margin is also supported, which allows users to allocate margin towards a specific position, disassociating the liquidation risk of that position with all other positions.

The spot clearinghouse analogously manages spot user state for each address, including token balances and holds.


# Oracle

The validators are responsible for publishing spot oracle prices for each perp asset every 3 seconds. The oracle prices are used to compute funding rates. They are also a component in the `mark price` which is used for margining, liquidations, and triggering TP/SL orders.

The spot oracle prices are computed by each validator as the weighted median of Binance, OKX, Bybit, Kraken, Kucoin, Gate IO, MEXC, and Hyperliquid spot mid prices for each asset, with weights 3, 2, 2, 1, 1, 1, 1, 1 respectively. Perps on assets which have primary spot liquidity on Hyperliquid (e.g. HYPE) do not include external sources in the oracle until sufficient liquidity is met. Perps on assets that have primary spot liquidity outside of Hyperliquid (e.g. BTC) do not include Hyperliquid spot prices in the oracle.

The final oracle price used by the clearinghouse is the weighted median of each validator's submitted oracle prices, where the validators are weighted by their stake.


# Order book

HyperCore state includes an order book for each asset. The order book works in similarly to centralized exchanges. Orders are added where price is an integer multiple of the tick size, and size is an integer multiple of lot size. Orders are matched in price-time priority.&#x20;

Operations on order books for perp assets take a reference to the clearinghouse, as all positions and margin checks are handled there. Margin checks happen on the opening of a new order, and again for the resting side at the matching of each order. This ensures that the margining system is consistent despite oracle price fluctuations after the resting order is placed.

One unique aspect of the Hyperliquid L1 is that the mempool and consensus logic are semantically aware of transactions that interact with HyperCore order books. Within a block, actions are sorted

1. Actions that do not send GTC or IOC orders to any book
2. Cancels
3. Actions that send at least one GTC or IOC

Within each category, actions are sorted in the order they were proposed by the block proposer. Modifies are categorized according to the new order they place.    &#x20;


# Staking

### Basics

HYPE staking on Hyperliquid happens within HyperCore. Just as USDC can be transferred between perps and spot accounts, HYPE can be transferred between spot and staking accounts.&#x20;

Within the staking account, HYPE may be staked to any number of validators. Here and in other docs, *delegate* and *stake* are used interchangeably, as Hyperliquid only supports delegated proof of stake.&#x20;

Each validator has a self-delegation requirement of 10k HYPE to become active. The self-delegation requirement is locked for one year. Any time that the self-delegation for a validator drops below 10k HYPE, the validator enters undelegate-only mode. In other words, where all future delegations to this validator are disabled, so the validator's total stake can only decrease going forward.&#x20;

Once active, validators produce blocks and receive rewards proportional to their total delegated stake. Validators may charge a commission to their delegators. This commission cannot be increased unless the new commission is less than or equal to 1%. This prevents scenarios where a validator attracts a large amount of stake and then raises the commission significantly to take advantage of unaware stakers.

Delegations to a particular validator have a lockup duration of 1 day. After this lockup, delegations may be partially or fully undelegated at any time. Undelegated balances instantly reflect in staking account balance.&#x20;

Transfers from spot account to staking account are instant. However, transfers from staking account to spot account have a 7 day unstaking queue. Most other proof of stake chains have a similar mechanism, which ensures that large-scale consensus attacks are penalized by slashing or social layer mechanisms. There is currently no automatic slashing implemented. Each address may have at most 5 pending withdrawals in the unstaking queue.&#x20;

As an example, if you initiate a staking to spot transfer of 100 HYPE at 08:00:00 UTC on March 11 and a transfer of 50 HYPE at 09:00:00 UTC on March 12, the 100 HYPE transfer will be finalized at 08:00:01 UTC on March 18 and the 50 HYPE transfer will be finalized at 09:00:01 UTC on March 19.&#x20;

The staking reward rate formula is inspired by Ethereum, where the reward rate is inversely proportional to the square root of total HYPE staked. At 400M total HYPE staked, the yearly reward rate is approximately 2.37% per year. Staking rewards come from the future emissions reserve.

Rewards are accrued every minute and distributed to stakers every day. Rewards are redelegated automatically to the staked validator, i.e. compounded. Rewards are based on the minimum balance that a delegator has staked during each staking epoch (100k rounds, as explained below).

### Technical Details

The notion of a *quorum* is essential to modern proof of stake consensus algorithms such as HyperBFT. A quorum is any set of validators that has more than ⅔ of the total stake in the network. The operating requirement of consensus is that a quorum of stake is honest (non-Byzantine). Therefore it is an essential responsibility of every staker to only delegate to trusted validators.&#x20;

HyperBFT consensus proceeds in *rounds*, which is a fundamental discrete bundle of transactions along with signatures from a quorum of validators. Each *round* may be *committed* after certain conditions are met, after which it is sent to the execution state for processing. A key property of the consensus algorithm is that all honest nodes agree on the ordered list of committed rounds.

Rounds may result in a new execution state block. Execution blocks are indexed by a separate increasing counter called *height*. Height only increments on consensus rounds with at least one transaction.

The validator set evolves in epochs of 100k rounds, which is approximately 90 minutes on mainnet. The validators and consensus stakes are static for each staking epoch.

Validators may vote to jail peers that do not respond with adequate latency or frequency to the consensus messages of the voter. Upon receiving a quorum of jail votes, a validator becomes *jailed* and no longer participates in consensus. A jailed validator does not produce rewards for its delegators. A validator may unjail themselves by diagnosing and fixing the causes, subject to onchain unjailing rate limits. Note that jailing is not the same slashing, which is reserved for provably malicious behavior such as double-signing blocks at the same round.&#x20;


# Vaults

Vaults are a powerful and flexible primitive built into HyperCore. Strategies running on vaults benefit from the same advanced features as the DEX, from liquidations of overleveraged accounts to high throughput market making strategies. No more depositing into vaults that simply rebalance two tokens.&#x20;

Anyone can deposit into a vault to earn a share of the profits. In exchange, the vault owner receives 10% of the total profits. (Note that protocol vaults do not have any fees or profit share). Vaults can be managed by an individual trader or automated by a market maker. All strategies come with their own risk, and users should carefully assess the risks and performance history of a vault before depositing. &#x20;


# Protocol vaults

Hyperliquidity Provider (HLP) is a protocol vault that provides liquidity to Hyperliquid through multiple market making strategies, performs liquidations, supplies USDC in Earn, and accrues a portion of trading fees.

HLP democratizes strategies typically reserved for privileged parties on other exchanges. The community can provide liquidity for the vault and share its pnl. HLP is fully community-owned.

The deposit lock-up period is 4 days. This means you can withdraw 4 days after your most recent deposit. E.g., if you deposited on Sep 14 at 08:00, you would be able to withdraw on Sep 18 at 08:00.

For more information about HLP, see these blog posts:&#x20;

<https://medium.com/@hyperliquid/hyperliquidity-provider-hlp-democratizing-market-making-bb114b1dff0f>\
<https://medium.com/@hyperliquid/hlp-update-3-months-in-42327abe3e57>\
Note that the blog posts may not be up-to-date.


# For vault leaders

### What are the benefits of creating a vault as a leader?

Vault leaders receive a 10% profit share for managing the vault. Vaults can be a great way for a trader to share strategies with his or her community.&#x20;

### How do I create a vault?

Anyone can create a vault:&#x20;

1. Choose a name and write a description for your vault. Note that this cannot be changed later.&#x20;
2. Deposit a minimum of 100 USDC into your vault.

Creating a vault requires a 100 USDC gas fee, which is distributed to the protocol in the same manner as trading fees.

To ensure vault leaders have skin in the game, you must maintain ≥5% of the vault at all times. You cannot withdraw from your vault if it would cause your share to fall below 5%.&#x20;

### How do I manage my vault?

On the Trade page, select the address dropdown in the navigation bar. Select the vault you want to trade on behalf of in the dropdown. Now, all trades you make will apply to your vault, and everything on the Trade page will reflect your vault.&#x20;

To switch back to your personal account, select "Master" at the top of the address dropdown.  &#x20;

### What assets can a vault trade?&#x20;

Vaults can trade validator-operated perps. They cannot trade spot or HIP-3 perps.&#x20;

### How do I close my vault?

On your vault’s dedicated page, click the Leader Actions dropdown and select “Close Vault”. A modal will appear to confirm that you want to close your vault. All positions must be closed before the vault can close. All depositors will receive their share of the vault when it is closed.

### What happens to open positions in a vault when someone withdraws?

When someone withdraws from a vault, if there is enough margin to keep the open positions according to the leverages set, the withdrawal does not affect open positions.

If there is not enough margin available, open orders that are using margin will be canceled. Orders will be canceled in increasing order of margin used. &#x20;

If there is still not enough margin available, 20% of positions are automatically closed. This is repeated until enough margin is freed up such that the user's withdrawal can be processed. Vault leaders can also set vaults to always proportionally close positions on withdrawals to maintain similar liquidation prices for positions.


# For vault depositors

### What are the benefits of depositing into a vault?

By depositing, you earn a share of the profits, or losses, of the vault. If there are specific traders you admire or support, you can deposit into their vault to get exposure to their trading strategies.&#x20;

Let’s say you deposit 100 USDC into a vault, whose total deposits are 900 USDC. The vault total is now 1,000 USDC, and you represent 10% of the vault. Over time, the vault grows to be 2,000 USDC, while no one else has deposited or withdrawn from the vault. You withdraw 200 USDC (10%) less 10 USDC (10% profit share to the leader), which totals 190 USDC. There may be some slippage as you withdraw and open positions are closed.&#x20;

Note that trading is inherently risky, and vaults’ past performance is not a guarantee of future returns.&#x20;

### How do I find a vault to deposit into?

On <https://app.hyperliquid.xyz/vaults>, you can view statistics of different vaults, including APY and total deposits (TVL).&#x20;

You can click on a specific vault to see more information, such as pnl, max drawdown, volume, open positions, and trade history. You can see how many people have deposited into the vault and for how long they’ve been supporting the vault.&#x20;

### How do I deposit into a vault?

Depositing into a vault is simple. On a vault’s dedicated page, enter the amount you would like to deposit and click “Deposit.”

### How do I check the performance of vaults I’ve deposited into?

You can track any vault’s performance on its dedicated page. Select the “Your Performance” heading to see how your deposits have performed.&#x20;

On the Portfolio page, you’ll find your total balance across all vaults.&#x20;

### How do I withdraw from a vault?

Withdrawing is as simple as depositing. On a vault’s dedicated page, click the Withdraw heading, then enter the amount you’d like to withdraw and click “Withdraw.”

HLP has a lock-up period of 4 days. User vaults have a lock-up period of 1 day.&#x20;


# Multi-sig

Advanced Feature

HyperCore supports native multi-sig actions. This allows multiple private keys to control a single account for additional security. Unlike other chains, multi-sig is available as a built-in primitive on HyperCore as opposed to relying on smart contracts.&#x20;

The multi-sig workflow is described below:

* To convert a user to a multi-sig user, the user sends a `ConvertToMultiSigUser` action with the authorized users and the minimum required number of authorized users required to sign an action. Authorized users must be existing users on Hyperliquid. Once a user has been converted into a multi-sig user, all its actions must be sent via multi-sig.&#x20;
* To send an action, each authorized user must sign a payload to produce a signature. A `MultiSig` action wraps around any normal action and includes a list of signatures from authorized users.&#x20;
* The `MutiSig` payload also contains the target multi-sig user and the authorized user who will ultimately send the `MultiSig` action to the blockchain. The sender of the final action is also known as the `leader` (transaction lead address) of the multi-sig action.
  * When a multi-sig action is sent, only the nonce set of the authorized user who sent the transaction is validated and updated.
  * Similarly to normal actions, the leader can also be an API wallet of an authorized user. In this case, the nonce of the API wallet is checked and updated.&#x20;
* A multi-sig user's set of authorized users and/or the threshold may be updated by sending a `MultiSig` action wrapping a`ConvertToMultiSigUser` action describing the new state.
* A multi-sig user can be converted back to a normal user by sending a `ConvertToMultiSigUser` via multi-sig. In this case, the set of authorized users can be set to empty and conversion to normal user will be performed.

Miscellaneous notes:&#x20;

* The leader (transaction lead address) must be an authorized user, not the multi-sig account
* Each signature must use the same information, e.g., same nonce, transaction lead address, etc.&#x20;
* The leader must collect all signatures before submitting the action&#x20;
* A user can be a multi-sig user and an authorized user for another multi-sig user at the same time. A user may be an authorized user for multiple multi-sig users. The maximum allowed number of authorized users for a given multi-sig user is 10.&#x20;

Important for HyperEVM users: Converting a user to a multi-sig still leaves the HyperEVM user controllable by the original wallet. CoreWriter does not work for multi-sig users. In general, multi-sig users should not interact with the HyperEVM before or after conversion.

See the Python SDK for code examples.


# Permissionless spot quote assets

Becoming a spot quote asset is permissionless.&#x20;

The requirements for becoming a permissionless spot quote asset are as follows:

1. Wei decimals of 8 and size decimals of 2
2. Zero deployer fee share on the quote token
3. 200k HYPE staked, subject to the following slashing criteria based on validator voting:&#x20;
   1. A peg mechanism to a price of 1 USD. A future network upgrade could increase the scope to other non-dollar stable assets&#x20;
      1. QUOTE/USDC should have 100k USDC size on both sides within the price range from 0.998 and 1.002, inclusive&#x20;
      2. QUOTE/USDC should have 1M USDC size on both sides within 0.99 and 1.01, inclusive&#x20;
   2. A liquid HYPE/QUOTE book&#x20;
      1. HYPE/QUOTE should have 50k QUOTE size on both sides within a spread of 0.5%, inclusive

USDC and USDT are not subject to the staking requirement due to their longstanding track record and established scale.&#x20;

The 200k HYPE staked by the deployer are subject to slashing based on validator vote for poor quality quote assets. Upon deployment, this stake is committed for 3 years, after which it can be unstaked. This gives builders and users some assurance when choosing a quote asset.&#x20;

For any of the conditions above, if there is a three-day period during which the condition is not satisfied for a majority of uniformly-spaced 1 second samples, the quote asset will be considered slashable. Validators will vote on the amount to slash when such conditions are violated.&#x20;

Becoming a quote asset is now permissionless on testnet, where the staking requirement is 50 HYPE for ease of testing. Once the requirements above are met, the token deployer sends an `enableQuoteToken` transaction to convert the token into a quote token. This deployer action is irreversible and has no gas cost.&#x20;

Transfer fees for new accounts can be paid in 1 unit of a spot quote asset.


# Aligned quote assets

The Hyperliquid protocol will support “aligned stablecoins” as a permissionless primitive for stablecoin issuers to leverage Hyperliquid’s unique distribution and scale together with the protocol. Aligned stablecoins offer lower trading fees, better market maker rebates, and higher volume contribution toward fee tiers when used as the quote asset for a spot pair or the collateral asset for HIP-3 perps.&#x20;

Hyperliquid will continue to support a wide variety of permissionless quote assets for spot and perps trading. There will be continual technical developments to ensure that the Hyperliquid L1 is the most performant infrastructure for general purpose asset issuance, liquidity, and building.

To be clear, the motivation behind alignment is not to exclude any issuers, but rather to introduce an opt-in setting for new stablecoin teams to bootstrap their network effects and share upside proportionally with the protocol. Aligned stables and other assets serve different purposes and audiences, and will coexist and complement each other. Similar to the builder-protocol synergy of permissionless spot listings, HIP-3, and builder codes, aligned stablecoins are part of the infrastructure to move all of finance onchain.

**Aligned stable benefits, applied to spot and perp trading:**

1. 20% lower taker fees&#x20;
2. 50% better maker rebates
3. 20% more volume contribution toward fee tiers

Offchain conditions are ultimately voted upon by validator quorum, as any such conditions are not able to be reflected directly in protocol execution. Like on most other blockchains, independent validators on Hyperliquid achieve consensus on a self-contained state machine’s execution. This state machine’s evolution is entirely onchain. In the case of the offchain conditions for an aligned stablecoin, this evolution is driven by validator vote.

The following reflect views expressed by Hyperliquid Labs after careful consideration about the best outcome for the protocol and users.

**Onchain requirements:**

1. Enabled as a permissionless quote token
2. 800k additional staked HYPE by deployer, meaning a total of 1M staked HYPE including the 200k staked HYPE for the quote token deployment. This is to give builders and users assurance to use the aligned stablecoin.
3. 50% of the deployer’s offchain reserve income must flow to the protocol. Validators may vote to update the calculation methodology as regulatory standards evolve. There will be follow-up work on the precise definition of risk-free rate, which will be updated according to an onchain stake-weighted median of validator reported values. A CoreWriter action will allow the deployer to reflect the exact minted balance from HyperEVM directly to HyperCore, which will allow a fully automated fee share mechanism as part of L1 execution.

**Offchain requirements, enforced through onchain quorum of validator votes:**

1. The stablecoin is 1:1 backed by cash, short-term US treasuries, and tokenized US treasury or money market funds to the extent permitted under applicable regulatory frameworks. Aligned issuers must also provide par redemption at all times, with a publicly disclosed and timely redemption service consistent with their applicable regulatory regime. These conditions can be revisited by the validators, in the spirit of building a regulatorily compliant chain for payments and banking opportunities. The guiding requirement is that a large percentage of the world's circulating dollars could compliantly be converted to the aligned stablecoin in the context of existing businesses and use cases in the financial world.
2. The full supply is natively minted on HyperEVM. Any supply on other chains or offchain must first be minted on HyperEVM as the source chain.
3. The deployer can only deploy assets that directly support the aligned stablecoin. For example, the underlying treasuries could be issued onchain. The net effect is that the deployer must share half of its offchain yield income through the existence of the aligned stablecoin. The deployer and its affiliates may not receive any economic benefits tied to conversion of the aligned stablecoin into another asset. "Benefit" includes but is not limited to revenue share, order-flow payments or any form of rate-linked compensation.
4. The team building an aligned stablecoin must be independent and dedicated to building on Hyperliquid.&#x20;

### FAQ

1\. Offchain requirements are overly restrictive. The protocol should only enforce strictly onchain requirements such as staking requirements and yield share.

Onchain requirements are almost always preferable to offchain ones. They are simpler, objective, and do not require validator enforcement. However, the real world is inherently nuanced and complex. Given the opportunity size of becoming the premier stablecoin chain and the difficulty with associated yield being fully offchain, the protocol must compromise with a system that accomplishes the goal of true alignment. The only obvious way to accomplish this goal is through validator quorum enforcing offchain conditions. That being said, the feedback is duly noted that conditions should be as simple as possible while accomplishing these goals.&#x20;

2\. The requirements are too strict and will dampen the quality of projects ready to immediately deploy on Hyperliquid.

Two responses. Firstly, the benefits of aligned stablecoins are substantial but by no means a requirement for a successful stablecoin deployment. Furthermore, many stablecoins that may not qualify for alignment will naturally have their own incentivization opportunities coming out of a much higher top-line yield. The opportunity exists for many stable assets to thrive and synergize. Secondly, even if a project insists on "aligned or nothing" and deprioritizes deployment on Hyperliquid as a result, the tradeoff can still be worthwhile for the protocol. The sheer size of the stablecoin opportunity as part of housing all finance is worth more than any short term metric boosts such as trading volume or TVL incentivized by specific stablecoin deployers.

3\. Users will naturally choose the most aligned stablecoins, so the offchain conditions are not necessary.

While this would be true in an ideal state of the world, it's important to be realistic about the probability of it playing out. Such an outcome depends on 1) competent deployers choosing to remain aligned with the protocol and 2) users doing research, correctly identifying the most protocol-aligned stablecoin, and actively choosing to use it. Neither of these conditions are guaranteed. The protocol unfortunately does not have the luxury of experimentation here, and given the size of the opportunity, it would be too risky to leave this level of uncertainty in the outcome. Any aligned stable that achieves massive success will owe its initial distribution to the protocol. It is only fair that deployers seeking this benefit should recognize and commit upfront to sharing back with the protocol and community.

4\. The requirements kill the prospect of alternative stablecoins.

This is not the intention and should have been clearer in the first draft of the proposal. The projected market for regulated stablecoins is orders of magnitude larger than that for alternative stablecoins. Of course, there is no guarantee on this outcome, but much of Hyperliquid's success has come from building infrastructure with real-world, practical context. Furthermore, alternative stablecoins usually have different yield characteristics that can offset the lack of trading benefits from alignment.&#x20;


# HyperEVM

The Hyperliquid blockchain features two key parts: HyperCore and HyperEVM. The HyperEVM is not a separate chain, but rather, secured by the same HyperBFT consensus as HyperCore. This lets the HyperEVM interact directly with parts of HyperCore, such as spot and perp order books.

### What can I do on the HyperEVM?&#x20;

Explore directories of apps, tools, and more built by community members: [HypurrCo](https://www.hypurr.co/ecosystem-projects), [HL Eco](https://hl.eco/projects), [ASXN](https://data.asxn.xyz/dashboard/hyperliquid-ecosystem), and [Hyperliquid.wiki](https://hyperliquid.wiki/). Visit the [HyperEVM onboarding FAQ](https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-docs/onboarding/how-to-use-the-hyperevm) for more questions.&#x20;

### Why build on the HyperEVM?

Builders can plug into a mature, liquid, and performant onchain order books with HyperCore + HyperEVM on Hyperliquid. In addition, Hyperliquid has a captive audience of users who want to be at the forefront of financial change; they are excited to try new applications and conduct finance onchain. See the [HyperEVM developer section](https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-docs/for-developers/hyperevm) for more technical details and [tools for HyperEVM builders](https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-docs/hyperevm/tools-for-hyperevm-builders) for resources. &#x20;

As one example, a project XYZ could deploy an ERC20 contract on the HyperEVM using standard EVM tooling and deploy a corresponding spot asset XYZ permissionlessly in the HyperCore spot auction. Once the HyperCore token and HyperEVM contract are linked, users can use the same XYZ token on HyperEVM applications and trade it with on the native spot order book. This has two key improvements compared to CEX listings: 1) The entire process is permissionless, with no behind-the-scenes negotiations for preferential treatment and 2) There is no bridging risk between HyperCore and HyperEVM as one unified state. Trading and building on the same chain is a 10x product improvement over CEXs.

As another example, a lending protocol could set up a pool contract that accepts token XYZ as collateral and lends out another token ABC to the borrower. To determine the liquidation threshold, the lending smart contract can read XYZ/ABC prices directly from the HyperCore order books using a read precompile. For a Solidity developer, this is as simple as calling a built-in function. Suppose the borrower's position requires liquidation. The lending smart contract can send orders directly swapping XYZ and ABC on the HyperCore order books using a write system contract. Again, this is a simple built-in function in Solidity. In a few lines of code, the lending protocol has implemented protocolized liquidations similar to how perps function on HyperCore. A theme of the HyperEVM is to abstract away the deep liquidity on HyperCore as a building block for arbitrary user applications.

### What stage is the HyperEVM in?&#x20;

The HyperEVM is in the alpha stage. There are three reasons behind this gradual roll-out approach.&#x20;

First, this stays true to Hyperliquid’s “no insiders” principle; everyone has equal access and starts on a level playing field. The tradeoff is that HyperEVM did not launch with the same tooling you might see on other chains, since no one is given a heads up nor paid for an integration or marketing. These short term obstacles are worth it to be a fair, credibly neutral platform in the long-run.&#x20;

Second, a gradual roll-out is the safest way to upgrade a complex system doing billions of dollars of volume a day and protect against performance degradation or downtime.&#x20;

Third, shipping an MVP and iterating live with user feedback allows development to adjust more nimbly. Testnets are useful for technical testing, but systems can only be hardened through real economic use.&#x20;

As such, higher throughput and write system contracts are not live on mainnet yet, but will be in due time.&#x20;


# Tools for HyperEVM builders

See the [Builder Tools section](https://app.gitbook.com/s/Pp4dGfcVbne4UPhbQJxf/hyperevm-tools)


# Hyperliquid Improvement Proposals (HIPs)


# HIP-1: Native token standard

HIP-1 is a capped supply fungible token standard. It also features onchain spot order books between pairs of HIP-1 tokens.

The sender of the token genesis transaction will specify the following:

1. `name`: human readable, maximum 6 characters, no uniqueness constraints.
2. `weiDecimals`: the conversion rate from the minimal integer unit of the token to a human-interpretable float. For example, ETH on EVM networks has `weiDecimals = 18` and BTC on Bitcoin network has `weiDecimals = 8`.
3. `szDecimals`: the minimum tradable number of decimals on spot order books. In other words, the lot size of the token on all spot order books will be `10 ** (weiDecimals - szDecimals)`. It is required that `szDecimals + 5 <= weiDecimals`.
4. `maxSupply`: the maximum and initial supply. The supply may decrease over time due to spot order book fees or future burn mechanisms.
5. `initialWei`: optional genesis balances specified by the sender of the transaction. This could include a multisig treasury, an initial bridge mint, etc.
6. `anchorTokenWei` the sender of the transaction can specify existing HIP-1 tokens to proportionally receieve genesis balances.
7. `hyperliquidityInit`: parameters for initializing the Hyperliquidity for the USDC spot pair. See HIP-2 section for more details.

The deployment transaction of the token will generate a globally unique hash by which the execution logic will index the token.

### Gas cost for deployment

Like all transactions, gas costs will ultimately be paid in the native Hyperliquid token. Currently, the following gas cost is in HYPE.

1. The gas cost of deployment is decided through a dutch auction with duration 31 hours. In this period, the deployment gas decreases linearly from `initial_price` to `500 HYPE` . The initial price is `500 HYPE` if the last auction failed to complete, otherwise 2 times the last gas price.
2. Genesis to existing anchor tokens holders are proportional to `balance - 1e-6 * anchorTokenMaxSupply`at the time of the deployed token's genesis. If this value is negative, no genesis tokens are received. In particular, this means genesis holders must hold at least 0.0001% of the anchor token's max supply at genesis to be included in the deployed token's genesis.
3. Potential workaround for constraint (2): a small initial USDC gas fee (value TBD) for the initial state update of each `(address, token)` pair, either through trading or transfer. Further trades and transfers to initialized ledgers are gas free within the standard Hyperliquid fill rate conditions.

### IMPORTANT GAS DETAILS:

The only time-sensitive step of the process is the very first step of deploying the token, where the deployer specifies name, szDecimals, and weiDecimals. This step is when the gas is charged and the token is locked in. It is recommended to take all the necessary time after this step to reduce errors. There is no time limit once the gas is paid.

Deployment is a complex multi-stage process, and it is possible to get in a state where your deployment is stuck. For example, Hyperliquidity and total supply may be incompatible. It is the deployer's responsibility to try the exact deployment on testnet first: <https://app.hyperliquid-testnet.xyz/deploySpot>. Gas cannot be refunded if the deployment is stuck.

### Deploying existing assets

One common deployment pattern is to use HyperCore's onchain spot order books for trading an asset that exists externally. For example, this includes assets bridged from other chains or tokenized RWAs like stablecoins. These deployers often use the HyperEVM for minting in order to leverage battle-tested multichain bridging, including the following options:

* LayerZero: <https://docs.layerzero.network/v2/developers/hyperliquid/hyperliquid-concepts>
* Axelar: <https://axelarscan.io/resources/chains>
* Chainlink: <https://docs.chain.link/ccip/tools-resources/network-specific/hyperliquid-integration-guide>
* Debridge: <https://docs.debridge.com/dmp-details/dmp/protocol-overview>
* Wormhole: <https://wormhole.com/docs/products/messaging/get-started/>

To deploy a HyperEVM minted ERC-20 token for trading on HyperCore, the deployer must pay the deployment gas cost in the permissionless HIP-1 Dutch auction on HyperCore detailed above. The gas cost pays for order book and HyperCore token states, which are charged to the deployer instead of future users. The ticker is a unique onchain identifier, but as with all onchain data, frontends may display a different name.&#x20;

For the simplest setup, during the genesis step, the deployer can put the max supply (or `2^64-1` for maximum flexibility) in the system address. See [here](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/hyperevm/hypercore-less-than-greater-than-hyperevm-transfers#system-addresses) for how system address is determined based on the HyperCore token index. Usually deployers of bridged assets elect not to use Hyperliquidity, which can be configured with the `noHyperliquidity` field.

Once the HyperCore token and HyperEVM ERC-20 address are linked, transfers to the system address on the HyperEVM will reflect in the sender's HyperCore balance, and vice versa. It's highly recommended to test the exact setup on testnet.&#x20;

### USDC&#x20;

USDC is currently used for all perps margining. With HIP-1, USDC also becomes a spot token with an atomic transfer between perps and spot wallet USDC. Spot USDC has `szDecimals = weiDecimals = 8` to allow for a wide range of HIP-1 token prices.

### Spot trading&#x20;

HIP-1 tokens trade on order books parametrized by `base` and `quote` tokens, where limit orders are commitments to exchange `sz * 10 ** (weiDecimalsBase - szDecimalsBase)` units of the base token for `px * sz * 10 ** (weiDecimalsQuote - szDecimalsQuote)` units of the quote token. Any HIP-1 token will be initialized with a native spot order book where the quote token is Spot USDC. Trading of arbitrary pairs of native tokens can be enabled in the future.

### Trading fees&#x20;

Native spot and perps order books share the same volume-based fee schedule for each address. Fees collected in non-USDC HIP-1 native tokens are sent to the deployer, i.e. the deployer's fee share defaults to 100%. The base token deployer can set this percentage in the range of \[0, 100%] but only lower than the previous value afterwards. The portion of base token fees that is not redirected to the deployer is burned. For other quote tokens besides USDC, the fees are sent to the Assistance Fund. Quote token deployers cannot configure a trading fee share.

For legacy tokens that were deployed before the deployer fee share was implemented, deployers can increase the fee share once from zero to a positive value. After this one-time change, the fee share can only decrease. The deployer fee share for legacy tokens cannot be set back to exactly zero after being set to a positive value.

### Spot dust conversion

Spot dusting occurs once a day at 00:00 UTC. All spot balances that are less than 1 lot size with notional value <= 1 USD will be dusted. Here, the notional value is computed as the prevailing mid price of the token against USDC, times the token balance. All users’ dust across a token is aggregated, and a market sell order is automatically submitted to the book. If the aggregate dust is smaller than one lot size, then that dust is burned. Otherwise, the USDC from the successfully converted dust will be allocated back to all dusted users on a weighted basis, where the weighting is equal to the user’s fraction of the aggregate dust.&#x20;

Dusting will not occur if 1) the book is one-sided or 2) the amount of notional dust is too high such that the book would be impacted by this operation. For PURR, this is 10000 USDC; for all other tokens, this is 3000 USDC. Note: the amount of USDC received may be less than the notional amount computed from the mid because of slippage incurred while dusting or if there was insufficient liquidity to convert the total dust across all users.&#x20;


# HIP-2: Hyperliquidity

### Motivation&#x20;

Though HIP-1 is sufficient as a permissionless token standard, in practice it is often crucial to bootstrap liquidity. One of Hyperliquid's core design principles is that liquidity should be democratized. For perps trading, HLP can quote deep and tight liquidity based on CEX perp and spot prices, but a new model is needed for HIP-1 tokens that are in early phases of price discovery.

Hyperliquidity is inspired by Uniswap, while interoperating with a native onchain order book to support sophisticated order book liquidity from end users. HIP-2 is a fully decentralized onchain strategy that is part of Hyperliquid's block transition logic. Unlike conventional automated order book strategies, there are no operators. The strategy logic is secured by the same consensus that operates the order book itself. Note that Hyperliquidity is currently only available on spot pairs against USDC.&#x20;

Hyperliquidity is parametrized by

1. `spot`: a spot order book asset with USDC quote returned by a deployment of HIP-1
2. `startPx`: the initial price of the range
3. `nOrders`: the number of orders in the range
4. `orderSz`: the size of a full order in the range
5. `nSeededLevels`: the number of levels that begin as bids instead of asks. Note that for each additional bid level added by incrementing `nSeededLevels` the deployer needs to fund Hyperliquidity with `px * sz` worth of USDC. For fixed `nOrders`, increasing seeded levels decreases the total supply because it reduces the genesis supply of Hyperliquidity.

Each Hyperliquidity strategy has a price range defined recursively `px_0 = startPx`, `px_i = round(px_{i-1} * 1.003)`. The strategy updates on every block where the block time is at least 3 seconds since the previous update block. After each update:

1. Strategy targets `nFull = floor(balance / orderSz)` full ask orders and a `balance % orderSz` partial ask order if the partial order is nonzero. To the extent that ALO orders are not rejected, these orders are ensured.
2. Each fully filled tranche is modified to an order of side `orderSz` on the side with available balance, with the exception of the single partial order from (1) if it exists.

The resulting strategy guarantees a 0.3% spread every 3 seconds. Like smart-contract based pools on general purpose chains, Hyperliquidity requires no maintenance in the form of user transactions. One key improvement is that Hyperliquidity participates in a general purpose order book. Active liquidity providers can join in liquidity provision alongside Hyperliquidity at any time, allowing markets to adapt to increasing demand for liquidity.


# HIP-3: Builder-deployed perpetuals

The Hyperliquid protocol supports permissionless builder-deployed perps (HIP-3), a key milestone toward fully decentralizing the perp listing process.&#x20;

The deployer of a perp market is responsible for

1. Market definition, including the oracle definition and contract specifications
2. Market operation, including setting oracle prices, leverage limits, and settling the market if needed

HIP-3 inherits the HyperCore stack including its high performance margining and order books. For example, the API to trade HIP-3 perps is unified with other HyperCore actions. To trade HIP-3 assets, the asset ID simply needs to be set using the schema [here](https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-docs/for-developers/api/asset-ids).

## Spec

1. The staking requirement for mainnet will be 500k HYPE. This requirement is expected to decrease over time as the infrastructure matures. Any amount staked above the most recent requirement can be unstaked. The staking requirement is maintained for 30 days even after all of the deployer's perps have been halted.
2. Any deployer that meets the staking requirement can deploy one perp dex. As a reminder, each perp dex features independent margining, order books, and deployer settings. A future upgrade may support multiple dex deployments sharing the same deployer and staking requirement.
3. Any quote asset can be used as the collateral asset for a dex. As a reminder, assets that fail to meet the permissionless quote asset requirements will lose quote asset status based on onchain validator vote. Such a vote would also disable perp dexs that use this asset as collateral.
4. HIP-3 deployers are not subject to slashing related to quote assets. On a future upgrade, dexs with disabled quote assets would support migration to a new collateral token. This is not expected to happen on mainnet, as quote token deployers have their separate staking and slashing conditions. In summary, the quote asset choice is important for trading fee and product considerations, but is not an existential risk for HIP-3 deployers.
5. The first 3 assets deployed in any perp dex do not require auction participation. Additional assets go through a Dutch auction with the same hyperparameters (including frequency and minimum price) as the HIP-1 auction. The HIP-3 auction for additional perps is shared across all perp dexs. Future upgrades will support improved ergonomics around reserving assets for time-sensitive future deployments.
6. Isolated-only margin mode is required. Cross margin will be supported in a future upgrade.
7. HIP-3 markets incorporate the usual sources of trading fee discounts, including staking discounts, referral rewards, and aligned collateral discount. From the deployer perspective, the fee share is fixed at 50%. From the user perspective, fees are 2x the usual fees on validator-operated perp markets. The net effect is that the protocol collects the same fee regardless of whether the trade is on an HIP-3 or a validator-operated perp. User rebates are unaffected, and do not interact with the deployer. Deployer configurability of fees will be supported in a future upgrade.
8. Aligned stablecoin collateral will automatically receive reduced fees once the alignment condition (which is being updated based on user and deployer feedback) is implemented.

## Settlement

The deployer may settle an asset using the `haltTrading` action. This cancels all orders and settles positions to the current mark price. The same action can be used to resume trading, effectively recycling the asset. This could be used to list dated contracts without participating in the deployment auction for each new contract.

Once all assets are settled, a deployer's required stake is free to be unstaked.

## Oracle

While the oracle is completely general at the protocol level, perps make the most mathematical sense when there is a well-defined underlying asset or data feed which is difficult to manipulate and has underlying economic significance. Most price indices are not amenable as perp oracle sources. Deployers should consider edge cases carefully before listing markets, as they are subject to slashing for all listed markets on their DEX.

## **Slashing**&#x20;

Note: in all usages below, "slashing" is only in the context of HIP-3.&#x20;

To ensure high quality markets and protect users, deployers must maintain 500k staked HYPE. In the event of malicious market operation, validators have the authority to slash the deployer’s stake by conducting a stake-weighted vote. Even if the deployer has unstaked and initiated a staking withdrawal, the stake is still slashable during the 7-day unstaking queue.&#x20;

While slashing is ultimately by validator quorum, the protocol guidelines have been distilled from careful testnet analysis, user feedback, and deployer feedback. The guiding principle is that slashing is to prevent behavior that jeopardizes protocol correctness, uptime, or performance. A useful rule of thumb is that any slashable behavior should be accompanied by a bug fix in the protocol implementation. Therefore, HIP-3 should not require slashing in its final state. However, slashing is an important safety mechanism for a practical rollout of this large feature set.&#x20;

Slashing is technical and does not distinguish between malicious and incompetent behavior. Relatedly, slashing does not distinguish between

1. A deployer that deviates from a well-designed contract spec
2. A deployer that faithfully follows a poorly designed contract spec
3. A deployer whose private keys are compromised

The key factor is the effect of the deployer's actions on the protocol. Note that any bugs discovered are generously covered by the bug bounty program, provided such discoveries meet the terms of that program, including being responsibly disclosed without being exploited. These reports are greatly appreciated.&#x20;

Even attempted malicious deployer inputs that do not cause protocol issues are slashable. Similarly, inputs that do cause protocol issues but that are not irregular are not slashable. In particular, bugs under normal operation that are unrelated to the deployer inputs are not within scope of slashing. The interpretation of "irregular" inputs is to be determined by validator vote, and includes inputs that exploit edge cases or loopholes that circumvent system limits. All deployer transactions are onchain, and can be independently analyzed by any interested parties.&#x20;

Some malicious behavior is valid by protocol definition, but incorrect by certain subjective interpretations. The slashing principle provides that the protocol should not intervene in subjective matters. The motivation is that while proof-of-stake blockchains could hard fork on undesirable state transitions, they very rarely do. Neutrality of the platform is an incredibly important feature to preserve. Relatedly, the slashed stake by the deployer is burned instead of being distributed to affected users. This is again based on proof-of-stake principles and prevents some forms of misaligned incentives between users and deployers. While the protocol layer does not enforce subjective irregularities, the downstream application and social layers can. Ultimately, the deployer's reputation and future success is always at stake.&#x20;

The amount slashed in a given instance is ultimately a stake-weighted median of validator votes. However, as a general guideline, irregular inputs that cause invalid state transitions or prolonged network downtime can be slashed up to 100%. Irregular inputs causing brief network downtime can be partially slashed up to 50%. Invalid inputs that cause network degradation or performance issues can be partially slashed up to 20%.&#x20;

Lastly, the slashing conditions are independent of the staker composition. Therefore, LST operators should carefully diligence deployers. LST operators should also carefully and clearly communicate slashing risks to their users. A self-bonding requirement for deployers could make sense.&#x20;

In the most likely outcome, slashing never happens on mainnet. A large amount of technical work has gone into making HIP-3 a self-contained and technically robust system. Barring implementation issues, HIP-3 inherits Hyperliquid's carefully designed mathematical solvency guarantees.


# Frontend checks

There are many ways to reach invalid configurations during the spot deploy process. To avoid this, deployers can try intended deployments on testnet first. For automated deployment integrations, the following is a list of client-side checks that may be helpful.

### Token Deployment

```typescript
    if (szDecimals === undefined || weiDecimals === undefined) {
      displayAlert(
        "Size decimals and Wei decimals must be specified.",
        "error"
      );
      return;
    }
    if (szDecimals > 2 || szDecimals < 0) {
      displayAlert("Size decimals must be between 0 and 2.", "error");
      return;
    }
    if (weiDecimals > 8 || weiDecimals < 0) {
      displayAlert("Wei decimals must be between 0 and 8.", "error");
      return;
    }
    if (szDecimals + 5 > weiDecimals) {
      displayAlert("weiDecimals must be at least szDecimals + 5.", "error");
      return;
    }

```

### Set Deployer Trading Fee Share

```typescript
    if (deployerTradingFeeShare === undefined) {
      displayAlert("Deployer trading fee share must be specified.", "error");
      return;
    }
  
    if (deployerTradingFeeShare < 0 || deployerTradingFeeShare > 100) {
      displayAlert(
        "Deployer trading fee share must be between 0 and 100.",
        "error"
      );
      return;
    }
```

### User and Anchor Token Genesis

```typescript
    if (blacklistUser !== "") {
      if (amount !== "" || user !== "" || existingToken !== undefined) {
        displayAlert("Can only specify blacklist user by itself.", "error");
        return;
      }
    } else {
      if (amount.toString().length > 19) {
        displayAlert(`Can only enter up to 19 digits for Amount.`, "error");
        return;
      }

      const hypotheticalTotalSupply =
        BigInt(activeTokenDeployState?.totalGenesisBalanceWei ?? 0) +
        BigInt(amount);

      if (hypotheticalTotalSupply > MAX_UINT_64 / BigInt(2)) {
        displayAlert(
          "Total supply would be too large with this addition",
          "error"
        );
        return;
      }

      const minStartPrice = getMinStartPrice(szDecimals);
      if (
        minStartPrice *
          Number(formatUnits(hypotheticalTotalSupply, weiDecimals)) >
        MAX_MARKET_CAP_MILLIONS_START * 1e6
      ) {
        displayAlert(
          "Total supply would be too large even at smallest possible Hyperliquidity initial price",
          "error"
        );
        return;
      }

      if (
        (!isAddress(user) && existingToken === undefined) ||
        (isAddress(user) && existingToken !== undefined)
      ) {
        displayAlert(
          "Exactly one of user or existing token must be specified.",
          "error"
        );
        return;
      }

      if (user.toLowerCase() === HYPERLIQUIDITY_USER) {
        displayAlert(
          "Cannot assign genesis balance to hyperliquidity user",
          "error"
        );
        return;
      }
    }

    if (!activeTokenDeployState || activeTokenDeployState.token === undefined) {
      displayAlert(
        "Need to handle fetching previously created token.",
        "error"
      );
      return;
    }

    const minWei = getWei(100000, activeTokenDeployState.spec.weiDecimals);
    if (
      existingToken !== undefined &&
      !isAddress(user) &&
      BigInt(amount) < BigInt(minWei)
    ) {
      displayAlert(
        `Using an existing token as anchor token for genesis requires a minimum amount of 100,000 ${activeTokenDeployState.spec.name} (wei=${minWei}).`,
        "error"
      );
      return;
    }

```

### Hyperliquidity

<pre class="language-typescript"><code class="lang-typescript">    const PX_GAP = 0.003;
    const MAX_N_ORDERS = 4000;
    const MAX_MARKET_CAP_BILLIONS_END = 100;
    const MIN_MARKET_CAP_BILLIONS_END = 1;
<strong>    const MAX_MARKET_CAP_MILLIONS_START = 10;
</strong><strong>    const MAX_UINT_64 = BigInt("18446744073709551615");
</strong>
    if (
      startPx === undefined ||
      orderSz === undefined ||
      orderCount === undefined ||
      nSeededLevels === undefined
    ) {
      displayAlert(
        "Lowest price, order size, number of orders and number of seeded levels must be specified.",
        "error"
      );
      return;
    }

    const minStartPx = getMinStartPx(szDecimals);
    if (startPx &#x3C; minStartPx) {
      displayAlert(
        `First order price must be at least ${roundPx(
          minStartPx,
          szDecimals,
          true
        )}`,
        "error"
      );
      return;
    }

    if (startPx * orderSz &#x3C; 1) {
      displayAlert("First order size must be at least 1 USDC", "error");
      return;
    }

    if (!activeTokenDeployState || activeTokenDeployState.spots.length === 0) {
      displayAlert(
        "Unexpected error: spot and token should already be registered.",
        "error"
      );
      return;
    }

    const pxRange = Math.ceil(Math.pow(1 + PX_GAP, orderCount));
    const endPx = startPx * pxRange;
    // 1e9 instead of 1e8 because backend checks against u64::MAX / 10
    if (
      pxRange > 1_000_000 ||
      hyperliquidityTotalWei > MAX_UINT_64 ||
      endPx * orderSz * 1e9 > MAX_UINT_64
    ) {
      displayAlert(
        "Total Hyperliquidity token allocation is too large.",
        "error"
      );
      return;
    }

    const minTotalGenesisBalanceSz = 100_000_000;
    if (totalSupply * Math.pow(10, szDecimals) &#x3C; minTotalGenesisBalanceSz) {
      displayAlert(
        `Total genesis balance must be at least ${minTotalGenesisBalanceSz} lots (minimal tradeable units, i.e. one lot is 0.01 if szDecimals is 2)`,
        "error"
      );
      return;
    }

    const endMarketCap = totalSupply * endPx;
    if (endMarketCap > MAX_MARKET_CAP_BILLIONS_END * 1e9) {
      displayAlert(
        `Market cap must be &#x3C;${MAX_MARKET_CAP_BILLIONS_END}B USDC at Hyperliquidity end price`,
        "error"
      );
      return;
    }

    if (endMarketCap &#x3C; MIN_MARKET_CAP_BILLIONS_END * 1e9) {
      displayAlert(
        `Market cap must be >${MIN_MARKET_CAP_BILLIONS_END}B USDC at Hyperliquidity end price`,
        "error"
      );
      return;
    }

    if (totalSupply * startPx > MAX_MARKET_CAP_MILLIONS_START * 1e6) {
      displayAlert(
        `Market cap must be &#x3C;${MAX_MARKET_CAP_MILLIONS_START}M USDC at Hyperliquidity start price`,
        "error"
      );
      return;
    }

    if (orderCount &#x3C; 10) {
      displayAlert("Hyperliquidity must have at least 10 orders", "error");
      return;
    }

    if ((orderSz * orderCount) / totalSupply &#x3C;= 0.01) {
      displayAlert("Hyperliquidity must be >1% of total supply", "error");
      return;
    }
    
    if (usdcNeeded > webData.clearinghouseState.withdrawable) {
      displayAlert(
        "Insufficient perps USDC to deploy seeded levels",
        "error"
      );
      return;
    }
</code></pre>


# Trading


# Fees

Fees are based on your rolling 14 day volume and are assessed at the end of each day in UTC. Sub-account volume counts toward the master account and all sub-accounts share the same fee tier. Vault volume is treated separately from the master account. Referral rewards apply for a user's first $1B in volume and referral discounts apply for a user's first $25M in volume.

Maker rebates are paid out continuously on each trade directly to the trading wallet. Users can claim referral rewards from the Referrals page.&#x20;

There are separate fee schedules for perps vs spot. Perps and spot volume will be counted together to determine your fee tier, and spot volume will count double toward your fee tier. i.e., `(14d weighted volume) = (14d perps volume) + 2 * (14d spot volume)`.

For each user, there is one fee tier across all assets, including perps, HIP-3 perps, and spot. When growth mode is activated for an HIP-3 perp, protocol fees, rebates, volume contributions, and L1 user rate limit contributions are reduced by 90%. HIP-3 deployers can configure an additional fee share between 0-300% (0-100% for growth mode). If the share is above 100%, the protocol fee is also increased to be equal to the deployer fee.

Spot pairs between two spot quote assets have 80% lower taker fees, maker rebates, and user volume contribution.

[aligned-quote-assets](https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-docs/hypercore/aligned-quote-assets "mention") benefit from 20% lower taker fees, 50% better maker rebates, and 20% more volume contribution toward fee tiers.

### Perps fee tiers

|      |                         | Base rate |        | Diamond |         | Platinum |         | Gold    |         | Silver  |         | Bronze  |         | Wood    |         |
| ---- | ----------------------- | --------- | ------ | ------- | ------- | -------- | ------- | ------- | ------- | ------- | ------- | ------- | ------- | ------- | ------- |
| Tier | 14d weighted volume ($) | Taker     | Maker  | Taker   | Maker   | Taker    | Maker   | Taker   | Maker   | Taker   | Maker   | Taker   | Maker   | Taker   | Maker   |
| 0    |                         | 0.045%    | 0.015% | 0.0270% | 0.0090% | 0.0315%  | 0.0105% | 0.0360% | 0.0120% | 0.0383% | 0.0128% | 0.0405% | 0.0135% | 0.0428% | 0.0143% |
| 1    | >5M                     | 0.040%    | 0.012% | 0.0240% | 0.0072% | 0.0280%  | 0.0084% | 0.0320% | 0.0096% | 0.0340% | 0.0102% | 0.0360% | 0.0108% | 0.0380% | 0.0114% |
| 2    | >25M                    | 0.035%    | 0.008% | 0.0210% | 0.0048% | 0.0245%  | 0.0056% | 0.0280% | 0.0064% | 0.0298% | 0.0068% | 0.0315% | 0.0072% | 0.0333% | 0.0076% |
| 3    | >100M                   | 0.030%    | 0.004% | 0.0180% | 0.0024% | 0.0210%  | 0.0028% | 0.0240% | 0.0032% | 0.0255% | 0.0034% | 0.0270% | 0.0036% | 0.0285% | 0.0038% |
| 4    | >500M                   | 0.028%    | 0.000% | 0.0168% | 0.0000% | 0.0196%  | 0.0000% | 0.0224% | 0.0000% | 0.0238% | 0.0000% | 0.0252% | 0.0000% | 0.0266% | 0.0000% |
| 5    | >2B                     | 0.026%    | 0.000% | 0.0156% | 0.0000% | 0.0182%  | 0.0000% | 0.0208% | 0.0000% | 0.0221% | 0.0000% | 0.0234% | 0.0000% | 0.0247% | 0.0000% |
| 6    | >7B                     | 0.024%    | 0.000% | 0.0144% | 0.0000% | 0.0168%  | 0.0000% | 0.0192% | 0.0000% | 0.0204% | 0.0000% | 0.0216% | 0.0000% | 0.0228% | 0.0000% |

### Spot fee tiers

| Spot |                         | Base rate |        | Diamond |         | Platinum |         | Gold    |         | Silver  |         | Bronze  |         | Wood    |         |
| ---- | ----------------------- | --------- | ------ | ------- | ------- | -------- | ------- | ------- | ------- | ------- | ------- | ------- | ------- | ------- | ------- |
| Tier | 14d weighted volume ($) | Taker     | Maker  | Taker   | Maker   | Taker    | Maker   | Taker   | Maker   | Taker   | Maker   | Taker   | Maker   | Taker   | Maker   |
| 0    |                         | 0.070%    | 0.040% | 0.0420% | 0.0240% | 0.0490%  | 0.0280% | 0.0560% | 0.0320% | 0.0595% | 0.0340% | 0.0630% | 0.0360% | 0.0665% | 0.0380% |
| 1    | >5M                     | 0.060%    | 0.030% | 0.0360% | 0.0180% | 0.0420%  | 0.0210% | 0.0480% | 0.0240% | 0.0510% | 0.0255% | 0.0540% | 0.0270% | 0.0570% | 0.0285% |
| 2    | >25M                    | 0.050%    | 0.020% | 0.0300% | 0.0120% | 0.0350%  | 0.0140% | 0.0400% | 0.0160% | 0.0425% | 0.0170% | 0.0450% | 0.0180% | 0.0475% | 0.0190% |
| 3    | >100M                   | 0.040%    | 0.010% | 0.0240% | 0.0060% | 0.0280%  | 0.0070% | 0.0320% | 0.0080% | 0.0340% | 0.0085% | 0.0360% | 0.0090% | 0.0380% | 0.0095% |
| 4    | >500M                   | 0.035%    | 0.000% | 0.0210% | 0.0000% | 0.0245%  | 0.0000% | 0.0280% | 0.0000% | 0.0298% | 0.0000% | 0.0315% | 0.0000% | 0.0333% | 0.0000% |
| 5    | >2B                     | 0.030%    | 0.000% | 0.0180% | 0.0000% | 0.0210%  | 0.0000% | 0.0240% | 0.0000% | 0.0255% | 0.0000% | 0.0270% | 0.0000% | 0.0285% | 0.0000% |
| 6    | >7B                     | 0.025%    | 0.000% | 0.0150% | 0.0000% | 0.0175%  | 0.0000% | 0.0200% | 0.0000% | 0.0213% | 0.0000% | 0.0225% | 0.0000% | 0.0238% | 0.0000% |

### Staking tiers

| Tier     | HYPE staked | Trading fee discount |
| -------- | ----------- | -------------------- |
| Wood     | >10         | 5%                   |
| Bronze   | >100        | 10%                  |
| Silver   | >1,000      | 15%                  |
| Gold     | >10,000     | 20%                  |
| Platinum | >100,000    | 30%                  |
| Diamond  | >500,000    | 40%                  |

### Maker rebates

| Tier | 14d weighted maker volume | Maker fee |
| ---- | ------------------------- | --------- |
| 1    | >0.5%                     | -0.001%   |
| 2    | >1.5%                     | -0.002%   |
| 3    | >3.0%                     | -0.003%   |

On most other protocols, the team or insiders are the main beneficiaries of fees. On Hyperliquid, fees are entirely directed to the community (HLP, the assistance fund, and deployers). Spot and HIP-3 perp deployers may choose to keep up to 50% of trading fees generated by their deployed assets. For security, the assistance fund holds a majority of its assets in HYPE, which is the most liquid native asset on the Hyperliquid L1. The assistance fund uses the system address `0xfefefefefefefefefefefefefefefefefefefefe` . The assistance fund operates entirely onchain in a fully automated manner as part of the L1 execution. The assistance fund requires validator quorum to use in special situations.

### Staking linking

A "staking user" and a "trading user" can be linked so that the staking user's HYPE staked can be attributed to the trading user's fees. A few important points to note:

* The staking user will be able to unilaterally control the trading user. In particular, linking to a specific staking user essentially gives them full control of funds in the trading account.
* Linking is permanent. Unlinking is not supported.
* The staking user will not receive any staking-related fee discount after being linked.
* Linking requires the trading user to send an action first, and then the staking user to finalize the link. See "Link Staking" at app.hyperliquid.xyz/portfolio for details.&#x20;
* No action is required if you plan to trade and stake from the same address.&#x20;

### Fee formula for developers

```typescript
type Args =
  | {
      type: "spot";
      isStablePair: boolean;
    }
  | {
      type: "perp";
      deployerFeeScale: number;
      growthMode: boolean;
    };

function feeRates(
  fees: { makerRate: number; takerRate: number }, // fees from userFees info endpoint
  activeReferralDiscount: number, // number from userFees info endpoint
  isAlignedQuoteToken: boolean,
  args: Args,
) {
  const scaleIfStablePair = args.type === "spot" && args.isStablePair ? 0.2 : 1;
  let scaleIfHip3 = 1;
  let growthModeScale = 1;
  let deployerShare = 0;
  if (args.type === "perp") {
    scaleIfHip3 =
      args.deployerFeeScale < 1
        ? args.deployerFeeScale + 1
        : args.deployerFeeScale * 2;
    deployerShare =
      args.deployerFeeScale < 1
        ? args.deployerFeeScale / (1 + args.deployerFeeScale)
        : 0.5;
    growthModeScale = args.growthMode ? 0.1 : 1;
  }

  let makerPercentage =
    fees.makerRate * 100 * scaleIfStablePair * growthModeScale;
  if (makerPercentage > 0) {
    makerPercentage *= scaleIfHip3 * (1 - activeReferralDiscount);
  } else {
    const makerRebateScaleIfAlignedQuoteToken = isAlignedQuoteToken
      ? (1 - deployerShare) * 1.5 + deployerShare
      : 1;
    makerPercentage *= makerRebateScaleIfAlignedQuoteToken;
  }

  let takerPercentage =
    fees.takerRate *
    100 *
    scaleIfStablePair *
    scaleIfHip3 *
    growthModeScale *
    (1 - activeReferralDiscount);
  if (isAlignedQuoteToken) {
    const takerScaleIfAlignedQuoteToken = isAlignedQuoteToken
      ? (1 - deployerShare) * 0.8 + deployerShare
      : 1;
    takerPercentage *= takerScaleIfAlignedQuoteToken;
  }

  return { makerPercentage, takerPercentage };
}
```


# Builder codes

*Note: The term "builder" in the context of builder codes does not refer to block builders within consensus, but rather "defi builders" who build applications on Hyperliquid.*

**Builder codes** allow builders to receive a fee on fills that they send on behalf of a user. They are set per-order for maximal flexibility. The user must approve a maximum builder fee for each builder, and can revoke permissions at any time. Builder codes are processed entirely onchain as part of the fee logic.

In order to use builder codes, the end user would first approve a max fee for the builder address via the `ApproveBuilderFee` action. This action must be signed by the user's main wallet, not an agent/API wallet. The builder must have at least 100 USDC in perps account value.&#x20;

Builder codes currently only apply to fees that are collected in the quote or collateral asset. In other words, builder codes do not apply to the buying side of spot trades but apply to both sides of perp trades. Builder fees charged can be at most 0.1% on perps and 1% on spot.

Once the authorization is complete, future order actions sent on behalf of the user may include an optional builder parameter: `{"b": address, "f": number}`. `b` is the address of the builder and `f` is the builder fee to charge in tenths of basis points. I.e. a value of 10 means 1 basis point.&#x20;

Builders can claim fees from builder codes through the usual referral reward claim process.

For example code see the Python SDK <https://github.com/hyperliquid-dex/hyperliquid-python-sdk/blob/master/examples/basic_builder_fee.py>

### API for builders

The approved maximum builder fee for a user can be queried via an info request `{"type": "maxBuilderFee", "user": "0x...", "builder": "0x..."}.`

The total builder fees collected for a builder is part of the referral state response from info request `{"type": "referral", "user": "0x..."}`.

The trades that use a particular builder code are uploaded in compressed LZ4 format to `https://stats-data.hyperliquid.xyz/Mainnet/builder_fills/{builder_address}/{YYYYMMDD}.csv.lz4`e.g. `https://stats-data.hyperliquid.xyz/Mainnet/builder_fills/0x123.../20241031.csv.lz4`&#x20;

Important: Note that these URLs are case sensitive, and require that `builder_address`be entirely lowercase.&#x20;


# Perpetual assets

Hyperliquid currently supports trading of 100+ assets. Assets are added according to community input. Ultimately Hyperliquid will feature a decentralized and permissionless listing process.&#x20;

Max leverage varies by asset, ranging from 3x to 40x. Maintenance margin is half of the initial margin at max leverage. E.g., if max leverage is 20x, the maintenance margin is 2.5%.


# Contract specifications

Hyperliquid perpetuals are derivatives products without expiration date. Instead, they rely on funding payments to ensure convergence to the underlying spot price over time. See [funding](https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-docs/trading/funding "mention") for more information.&#x20;

Hyperliquid has one main style of margining for perpetual contracts: USDC margining, USDT denominated linear contracts. That is, the oracle price is denominated in USDT, but the collateral is USDC. This allows for the best combination of liquidity and accessibility. Note that no conversions with the USDC/USDT exchange rate are applied, so these contracts are technically quanto contracts where USDT pnl is denominated in USDC.

When the spot asset's primary source of liquidity is USDC denominated, the oracle price is denominated in USDC. Currently, the only USDC-denominated perpetual contracts are PURR-USD and HYPE-USD, where the most liquid spot oracle source is Hyperliquid spot.

Hyperliquid's contract specifications are simpler than most platforms. There are few contract-specific details and no address-specific restrictions.

|                             |                                                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Instrument type             | Linear perpetual                                                                                                                           |
| Contract                    | 1 unit of underlying spot asset                                                                                                            |
| Underlying asset / ticker   | Hyperliquid oracle index of underlying spot asset                                                                                          |
| Initial margin fraction     | 1 / (leverage set by user)                                                                                                                 |
| Maintenance margin fraction | Half of maximum initial margin fraction                                                                                                    |
| Mark price                  | See [here](https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-docs/trading/robust-price-indices)                                  |
| Delivery / expiration       | N/A (funding payments every hour)                                                                                                          |
| Position limit              | N/A                                                                                                                                        |
| Account type                | Per-wallet cross or isolated margin                                                                                                        |
| Funding impact notional     | <p>20000 USDC for BTC and ETH</p><p>6000 USDC for all other assets </p>                                                                    |
| Maximum market order value  | $15,000,000 for max leverage >= 25, $5,000,000 for max leverage in \[20, 25), $2,000,000 for max leverage in \[10, 20), otherwise $500,000 |
| Maximum limit order value   | 10 \* maximum market order value                                                                                                           |


# Margining

Margin computations follow similar formulas to major centralized derivatives exchanges.

### Margin Mode

When opening a position, a margin mode is selected. *Cross margin* is the default, which allows for maximal capital efficiency by sharing collateral between all other cross margin positions. *Isolated margin* is also supported, which allows an asset's collateral to be constrained to that asset. Liquidations in that asset do not affect other isolated positions or cross positions. Similarly, cross liquidations or other isolated liquidations do not affect the original isolated position.&#x20;

Some assets are *isolated-only*, which functions the same as isolated margin with the additional constraint that margin cannot be removed. Margin is proportionally removed as the position is closed.&#x20;

### Initial Margin and Leverage

Leverage can be set by a user to any integer between 1 and the max leverage. Max leverage depends on the asset.&#x20;

The margin required to open a position is `position_size * mark_price / leverage`. The initial margin is used by the position and cannot be withdrawn for cross margin positions. Isolated positions support adding and removing margin after opening the position. Unrealized pnl for cross margin positions will automatically be available as initial margin for new positions, while isolated positions will apply unrealized pnl as additional margin for the open position.\
\
The leverage of an existing position can be increased without closing the position. Leverage is only checked upon opening a position. Afterwards, the user is responsible for monitoring the leverage usage to avoid liquidation. Possible actions to take on positions with negative unrealized pnl include partially or fully closing the position, adding margin (if isolated), and depositing USDC (if cross).

### Unrealized PNL and transfer margin requirements

Unrealized pnl can be withdrawn from isolated positions or cross account, but only if the remaining margin is at least 10% of the total notional position value of all open positions. The margin remaining must also meet the initial margin requirement, i.e. `transfer_margin_required = max(initial_margin_required, 0.1 * total_position_value)`&#x20;

Here, "transferring" includes any action that removes margin from a position, other than trading. Examples include withdrawals, transfer to spot wallet, and isolated margin transfers.

### Maintenance Margin and Liquidations

Cross positions are liquidated when the account value (including unrealized pnl) is less than the *maintenance margin* times the total open notional position. The maintenance margin is currently set to half of the initial margin at max leverage.&#x20;

Isolated positions are liquidated by the same maintenance margin logic, but the only inputs to the computation are the isolated margin and the notional value of the isolated position.


# Portfolio margin

Pre-alpha mode

Under portfolio margin, a user’s spot and perps trading are unified for greater capital efficiency. Furthermore, portfolio margin accounts automatically earn yield on all borrowable assets not actively used for trading.

Portfolio margin unlocks functionality such as the carry trade where a spot balance is offset by a short perps position, collateralized by the spot balance. Spot and perp pnl offset each other, protecting against liquidation on the perp position. More generally, spot and perps trading can be performed from a single unified balance. For example, a user could also hold HYPE and immediately buy ETH on the ETH/USDH book. All HIP-3 DEXs are included in portfolio margin, though not all HIP-3 DEX collateral assets are borrowable. Future HyperCore asset classes and primitives will support portfolio margin as well.

Users can supply eligible quote assets to earn yield. This synergizes and composes with HyperEVM lending protocols. In a future upgrade, CoreWriter will expose the same supply action for smart contracts. Portfolio margin intentionally does not bring a full-fledged lending market to HyperCore, as that is best built by independent teams on the EVM. For example, HyperCore lending is not tokenized, but an EVM protocol could do so by launching a fully onchain yield-bearing ERC20 token contract through CoreWriter and precompiles. Portfolio margin introduces organic demand to borrow and should expand the value proposition of teams building on the HyperEVM.

IMPORTANT: Portfolio margin is a complex technical upgrade and requires bootstrapping the supply side for borrowable assets. Therefore, portfolio margin will launch in pre-alpha mode where borrowable asset caps are extremely low. Users should test with new accounts or subaccounts with <$1k in value. Portfolio margin accounts will fall back to non-portfolio margin behavior when caps are hit. In pre-alpha mode, only USDC is borrowable, and HYPE is the only collateral asset. USDH will be added as borrowable and BTC as collateral before the alpha phase. Details will be added to the Docs.

### LTV and borrowing

Under portfolio margin, eligible collateral assets have an LTV (loan-to-value) ratio between 0 and 1. During pre-alpha, HYPE will have an LTV of 0.5. When placing spot and perp orders under portfolio margin, insufficient balance will automatically borrowed against eligible collateral up to `token_balance * borrow_oracle_price * ltv` , where price is denominated in the asset being borrowed.

Borrowed assets accrue interest continuously, and are indexed hourly to match the perp funding interval. Portfolio margin users pay interest on borrowed assets and earn interest on idle assets according to the same rate. During pre-alpha, the borrow interest rate for stablecoins is set at `0.05 + 4.75 * max(0, utilization - 0.8)` APY, compounded continuously depending on the instantaneous value of `utilization = total_borrowed_value / total_supplied_value` . Earned interest is accrued proportionally to all suppliers. The protocol retains 10% of borrowed interest as a buffer for future liquidations.

### Liquidations

Portfolio margin is a generalization of cross margin. Instead of margining all perp positions within one DEX together, all cross margin perp positions and spot balances are collectively margined together within one account. Sub-accounts are still treated separately under portfolio margin.&#x20;

Liquidations are triggered when the entire portfolio margin account is below its portfolio maintenance margin requirement. Users can monitor this requirement via the *portfolio margin ratio,* defined as

{% code overflow="wrap" %}

```latex
portfolio_margin_ratio = portfolio_maintenance_requirement / portfolio_liquidation_value

where

portfolio_maintenance_requirement = min_borrow_offset + sum_{dex} cross_maintenance_margin(dex) + sum_{token} borrowed_size_for_maintenance(token) * borrow_oracle_price(token)

portfolio_liquidation_value = sum_{borrowable_token} portfolio_balance(token) + min(borrow_cap(USDC), sum_{collateral_token} [min(portfolio_balance(token), supply_cap(token)) * borrow_oracle_price(token) * liquidation_threshold(token)])

liquidation_threshold(token) = 0.5 + 0.5 * LTV(token)

borrow_oracle_price(token) = median(HL_spot_USDC_price, HL_perp_mark_price * USDT_USDC_oracle, HL_perp_oracle_price * USDT_USDC_oracle)

USDT_USDC_oracle = 1 / HL_spot_oracle_price(USDC)

min_borrow_offset = 20 USDC
```

{% endcode %}

The account becomes liquidatable when portfolio\_margin\_ratio > 0.95. All notional values in the above definition are converted to USDC using `borrow_oracle_price(token)` .

During mainnet pre-alpha, the caps per user will begin at `borrow_cap(USDC) = 1000` and `supply_cap(HYPE) = 200`. After borrow caps are hit, additional margin used must be supplied by the user using the settlement asset regardless of whether portfolio margin is active. Therefore, the best way to test the full portfolio margin behavior is to use small test accounts.

Depending on the order of oracle price updates, either perp positions or spot borrows may be liquidated first. In other words, once portfolio margin ratio is liquidatable, users should not expect a deterministic liquidation sequence.


# Margin tiers

Like most centralized exchanges, the tiered leverage formula on Hyperliquid is as follows:

`maintenance_margin = notional_position_value * maintenance_margin_rate - maintenance_deduction`&#x20;

On Hyperliquid, `maintenance_margin_rate` and `maintenance_deduction` depend only on the margin tiers, not the asset.

`maintenance_margin_rate(tier = n) = (Initial Margin Rate at Maximum leverage at tier n) / 2` . For example, at 20x max leverage, `maintenance_margin_rate = 2.5%`.

Maintenance deduction is defined at each tier to account for the different maintenance margin rates used at previous tiers:

`maintenance_deduction(tier = 0) = 0`  &#x20;

`maintenance_deduction(tier = n) = maintenance_deduction(tier = n - 1) + notional_position_lower_bound(tier = n) * (maintenance_margin_rate(tier = n) - maintenance_margin_rate(tier = n - 1))` for `n > 0`&#x20;

In other words, maintenance deduction is defined so that new positions opened at each tier increase maintenance margin at `maintenance_margin_rate` , while having the total maintenance margin be a continuous function of position size.

Margin tables have unique IDs and the tiers can be found in the `meta` Info response. For IDs less than 50, there is a single tier with max leverage equal to the ID.

### Mainnet Margin Tiers

Mainnet margin tiers are enabled for the assets below:

#### BTC

| Notional Position Value (USDC) | Max Leverage |
| ------------------------------ | ------------ |
| 0-150M                         | 40           |
| >150M                          | 20           |

#### ETH

| Notional Position Value (USDC) | Max Leverage |
| ------------------------------ | ------------ |
| 0-100M                         | 25           |
| >100M                          | 15           |

#### SOL

| Notional Position Value (USDC) | Max Leverage |
| ------------------------------ | ------------ |
| 0-70M                          | 20           |
| >70M                           | 10           |

#### XRP

| Notional Position Value (USDC) | Max Leverage |
| ------------------------------ | ------------ |
| 0-40M                          | 20           |
| >40M                           | 10           |

#### DOGE, kPEPE, SUI, WLD, TRUMP, LTC, ENA, POPCAT, WIF, AAVE, kBONK, LINK, CRV, AVAX, ADA, UNI, NEAR, TIA, APT, BCH, HYPE, FARTCOIN

| Notional Position Value (USDC) | Max Leverage |
| ------------------------------ | ------------ |
| 0-20M                          | 10           |
| >20M                           | 5            |

#### OP, ARB, LDO, TON, MKR, ONDO, JUP, INJ, kSHIB, SEI, TRX, BNB, DOT

| Notional Position Value (USDC) | Max Leverage |
| ------------------------------ | ------------ |
| 0-3M                           | 10           |
| >3M                            | 5            |

### Testnet Margin Tiers

The tiers on testnet are lower than mainnet would feature, for ease of testing.&#x20;

#### LDO, ARB, MKR, ATOM, PAXG, TAO, ICP, AVAX, FARTCOIN - testnet only

| Notional Position Value (USDC) | Max Leverage |
| ------------------------------ | ------------ |
| 0-10k                          | 10           |
| >10k                           | 5            |

#### DOGE, TIA, SUI, kSHIB, AAVE, TON - testnet only

| Notional Position Value (USDC) | Max Leverage |
| ------------------------------ | ------------ |
| 0-20k                          | 10           |
| 20-100k                        | 5            |
| >100k                          | 3            |

#### ETH - testnet only

| Notional Position Value (USDC) | Max Leverage |
| ------------------------------ | ------------ |
| 0-20k                          | 25           |
| 20-50k                         | 10           |
| 50-200k                        | 5            |
| >200k                          | 3            |

#### BTC - testnet only

| Notional Position Value (USDC) | Max Leverage |
| ------------------------------ | ------------ |
| 0-10k                          | 40           |
| 10-50k                         | 25           |
| 50-100k                        | 10           |
| 100k-300k                      | 5            |
| >300k                          | 3            |


# Robust price indices

Hyperliquid makes use of several robust prices based on order book and external data to minimize risk of market manipulation.

*Oracle price* is used to compute funding rates. This weighted median of CEX prices is robust because it does not depend on hyperliquid's market data at all. Oracle prices are updated by the validators approximately once every three seconds.

*Mark price* is the median of the following prices:

1. Oracle price plus a 150 second exponential moving average (EMA) of the difference between Hyperliquid's mid price and the oracle price
2. The median of best bid, best ask, last trade on Hyperliquid
3. Median of Binance, OKX, Bybit, Gate IO, MEXC perp mid prices with weights 3, 2, 2, 1, 1, respectively

If exactly two out of the three inputs above exist, the 30 second EMA of the median of best bid, best ask, and last trade on Hyperliquid is also added to the median inputs.

Mark price is an unbiased and robust estimate of the fair perp price, and is used for margining, liquidations, triggering TP/SL, and computing unrealized pnl. Mark price is updated whenever validators publish new oracle prices. Therefore, mark and oracle price are updated approximately once every 3 seconds.

The EMA update formula is defined as follows for an update value of `sample` at duration `t` since the last update

`ema = numerator / denominator`

`numerator -> numerator * exp(-t / 2.5 minutes) + sample * t`&#x20;

`denominator -> denominator * exp(-t / 2.5 minutes) + t`


# Liquidations

### Overview

A liquidation event occurs when a trader's positions move against them to the point where the account equity falls below the maintenance margin. The maintenance margin is half of the initial margin at max leverage, which varies from 3-40x. In other words, the maintenance margin is between 1.25% (for 40x max leverage assets) and 16.7% (for 3x max leverage assets) depending on the asset.

When the account equity drops below maintenance margin, the positions are first attempted to be entirely closed by sending market orders to the book. The orders are for the full size of the position, and may be fully or partially closed. If the positions are entirely or partially closed such that the maintenance margin requirements are met, any remaining collateral remains with the trader.

If the account equity drops below 2/3 of the maintenance margin without successful liquidation through the book, a backstop liquidation happens through the liquidator vault. See Liquidator Vault explanation below for more details.

When a cross position is backstop liquidated, the trader's cross positions and cross margin are all transferred to the liquidator. In particular, if the trader has no isolated positions, the trader ends up with zero account equity.

When an isolated position is backstop liquidated, that isolated position and isolated margin are transferred to the liquidator. The user's cross margin and positions are untouched.

During backstop liquidation, the maintenance margin is not returned to the user. This is because the liquidator vault requires a buffer to make sure backstop liquidations are profitable on average. In order to avoid losing the maintenance margin, traders can place stop loss orders or exit the positions before the mark price reaches the liquidation price.

Liquidations use the mark price, which combines external CEX prices with Hyperliquid's book state. This makes liquidations more robust than using a single instantaneous book price. During times of high volatility or on highly leveraged positions, mark price may be significantly different from book price. It is recommended to use the exact formula for precise monitoring of liquidations.

### Motivation

As described above, the majority of liquidations on Hyperliquid are sent directly to the order book. This allows all users to compete for the liquidation flow, and allows the liquidated user to keep any remaining margin. Unlike CEXs there is no clearance fee on liquidations.&#x20;

The resulting system is transparent and prioritizes retaining as much capital as possible for the liquidated user.

### Partial Liquidations

For liquidatable positions larger than 100k USDC (10k USDC on testnet for easier testing), only 20% of the position will be sent as a market liquidation order to the book. After a block where any position of a user is partially liquidated, there is a cooldown period of 30 seconds. During this cooldown period, all market liquidation orders for that user will be for the entire position.

### Liquidator Vault

Backstop liquidations on Hyperliquid are democratized through the liquidator vault, which is a component strategy of HLP. Positions that are below 2/3 of the maintenance margin can be taken over by the liquidator vault.&#x20;

On average, backstop liquidations are profitable for the liquidator. On most venues, this profit goes to the exchange operator or privileged market makers who internalize the flow. On Hyperliquid, the pnl stream from liquidations go entirely to the community through HLP.&#x20;

### Computing Liquidation Price

When entering a trade, an estimated liquidation price is shown. This estimation may be inaccurate compared to the position's estimated liquidation price due to changing liquidity on the book.

Once a position is opened, a liquidation price is shown. This price has the certainty of the entry price, but still may not be the actual liquidation price due to funding payments or changes in unrealized pnl in other positions (for cross margin positions).

The actual liquidation price is independent on the leverage set for cross margin positions. A cross margin position at lower leverage simply uses more collateral.

The liquidation price does depend on leverage set for isolated margin positions, because the amount of isolated margin allocated depends on the initial margin set.

When there is insufficient margin to make the trade, the liquidation price estimate assumes that the account is topped up to the initial margin requirement.&#x20;

The precise formula for the liquidation price of a position is

`liq_price = price - side * margin_available / position_size / (1 - l * side)`

where

`l = 1 / MAINTENANCE_LEVERAGE` . For assets with margin tiers, maintenance leverage depends on the unique margin tier corresponding to the position value at the liquidation price.

`side = 1 for long and -1 for short`

`margin_available (cross) = account_value - maintenance_margin_required`

`margin_available (isolated) = isolated_margin - maintenance_margin_required`


# Auto-deleveraging

Auto-deleveraging strictly ensures that the platform stays solvent. If a user's account value or isolated position value becomes negative, the users on the opposite side of the position are ranked by unrealized pnl and leverage used. Backstop liquidated positions have no special treatment in the ADL queue logic. The specific sorting index to determine the affected users in profit is `(mark_price / entry_price) * (notional_position / account_value)`. Those traders' positions are closed at the previous mark price against the now underwater user, ensuring that the platform has no bad debt. &#x20;

Auto-deleveraging is an important final safeguard on the solvency of the platform. There is a strict invariant that under all operations, a user who has no open positions will not socialize any losses of the platform.


# Funding

### Overview

Funding rates for crypto perpetual contracts are a mechanism that is used to ensure the price of the contract stays close to the underlying asset's price.&#x20;

The funding rate is a periodic fee that is paid by one side of the contract (either long or short) to the other side. Funding is purely peer-to-peer and no fees are collected on the payments.

The rate is calculated based on the difference between the contract's price and the spot price of the underlying asset. For consistency with CEXs, interest rate component is predetermined at 0.01% every 8 hours, which is 0.00125% every hour, or 11.6% APR paid to short. This represents the difference in cost to borrow USD versus spot crypto.&#x20;

The premium component fluctuates based on the difference between the perpetual contract's price and the underlying spot oracle price. If the contract's price is higher than the oracle price, the premium and hence the funding rate will be positive, and the long position will pay the short position. Conversely, if the contract's price is lower than the spot price, the funding rate will be negative, and the short position will pay the long position.

The funding rate on Hyperliquid is paid every hour. The funding rate is added or subtracted from the balance of contract holders at the funding interval.

Funding rates are designed to prevent large price disparities between the perpetual contract and the underlying asset. When the funding rate is high, it can incentivize traders to take the opposite position and help to bring the contract's price closer to the spot price of the underlying asset.

### Technical details

Funding on Hyperliquid is designed to closely match the process used by centralized perpetual exchanges.&#x20;

The funding rate formula applies to 8 hour funding rate. However, funding is paid every hour at one eighth of the computed rate for each hour.

The specific formula is `Funding Rate (F) = Average Premium Index (P) + clamp (interest rate - Premium Index (P), -0.0005, 0.0005)`. The premium is sampled every 5 seconds and averaged over the hour.

As described in the [clearinghouse](https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-docs/hypercore/clearinghouse) section, the oracle prices are computed by each validator as the weighted median of CEX spot prices for each asset, with weights depending on the liquidity of the CEX.&#x20;

`premium = impact_price_difference / oracle_price`&#x20;

where&#x20;

`impact_price_difference = max(impact_bid_px - oracle_px, 0) - max(oracle_px - impact_ask_px, 0)`&#x20;

and `impact_bid_px` and `impact_ask_px` are the average execution prices to trade`impact_notional_usd` on the bid and ask sides, respectively. See the contract specifications for the impact notional used, as well as other contract specific parameters.

Funding on Hyperliquid is capped at 4%/hour. Note that this is much less aggressive capping than CEX counterparts. The funding cap and funding interval do not depend on the asset.&#x20;

Note that the funding payment at the end of the interval is `position_size * oracle_price * funding_rate`. In particular, the spot oracle price is used to convert the position size to notional value, *not the mark price.*

### Numerical Example

Here is an explicit example computation:

1. The interest rate is 0.01% (fixed).
2. The perpetual contract is trading at a premium, with the impact bid price being $10,100, and the spot price at $10,000.
3. The premium index is calculated as the difference between the two prices, which is $100 in this case.
4. The funding interval is 1 hour.
5. You hold a long position of 10 contracts, each representing 1 BTC.

First, calculate the premium:

Premium = (Impact bid price - Spot Price) / Spot Price = ($10,100 - $10,000) / $10,000 Premium = 0.01 (or 1%)

Next, clamp the interest rate minus the premium rate at 0.05%:

Clamped Difference = min(max(Interest Rate - Premium Rate, -0.05%), 0.05%)&#x20;

Clamped Difference = min(max(0.01% - 1%, -0.05%), 0.05%)&#x20;

Clamped Difference = min(max(-0.99%, -0.05%), 0.05%) Clamped Difference = -0.05%

Now, calculate the funding rate:

Funding Rate = Premium Rate + Clamped Difference Funding Rate = 1% + (-0.05%)&#x20;

Funding Rate = 0.95%


# Order book

The order book works in essentially the same way as all centralized exchanges but is fully on-chain. Orders are added where price is an integer multiple of the tick size, and size is an integer multiple of lot size. The orders are matched in price-time priority.&#x20;

See this[ ](https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-docs/hypercore/order-book)[section](https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-docs/hypercore/order-book) for further details on order book implementation.


# Order types

### Order types:

* Market: An order that executes immediately at the current market price
* Limit: An order that executes at the selected limit price or better
* Stop Market: A market order that is activated when the price reaches the selected trigger price. For long orders, the trigger price needs to be higher than the mid price. For short orders, the trigger price needs to be lower than the mid price
* Stop Limit: A limit order that is activated when the price reaches the selected trigger price
* Take Market:  A market order that is activated when the price reaches the selected trigger price. For long orders, the trigger price needs to be lower than the mid price. For short orders, the trigger price needs to be higher than the mid price
* Take Limit: A limit order that is activated when the price reaches the selected trigger price
* Scale: Multiple limit orders in a set price range &#x20;
* TWAP: A large order divided into smaller suborders and executed in 30 second intervals. TWAP suborders have a maximum slippage of 3%&#x20;

### TWAP details:&#x20;

During execution, a TWAP order attempts to meet an execution target which is defined as the elapsed time divided by the total time times the total size. A suborder is sent every 30 seconds during the course of the TWAP.&#x20;

A suborder is constrained to have a max slippage of 3%. When suborders do not fully fill because of market conditions (e.g., wide spread, low liquidity, etc.), the TWAP may fall behind its execution target. In this case, the TWAP will try to catch up to this execution target during later suborders. These later suborders will be larger but subject to the constraint of 3 times the normal suborder size (defined as total TWAP size divided by number of suborders). It is possible that if too many suborders did not fill then the TWAP order may not fully catch up to the total size by the end. Like normal market orders, TWAP suborders do not fill during the post-only period of a network upgrade.

### Order options:

* Reduce Only: An order that reduces a current position as opposed to opening a new position in the opposite direction&#x20;
* Good Til Cancel (GTC): An order that rests on the order book until it is filled or canceled&#x20;
* Post Only (ALO): An order that is added to the order book but doesn’t execute immediately. It is only executed as a resting order
* Immediate or Cancel (IOC): An order that will be canceled if it is not immediately filled
* Take Profit: An order that triggers when the Take Profit (TP) price is reached.
* Stop Loss: An order that triggers when the Stop Loss (SL) price is reached
* TP and SL orders are often used by traders to set targets and protect profits or minimize losses on positions. TP and SL are automatically market orders. You can set a limit price and configure the amount of the position to have a TP or SL


# Take profit and stop loss orders (TP/SL)

TP/SL orders close your position when a certain profit (resp. loss) has realized on your position.

The [mark price](https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-docs/trading/robust-price-indices) is used to trigger TP/SL orders.&#x20;

TP/SL orders can be dragged on the TradingView chart. Note that dragging in a way that causes the order to immediately execute will lead to an error. Usually this prevents user mistakes, but if this is your desired behavior you can manually close the order from the position table or order form.&#x20;

### Limit vs Market TP/SL orders

Users can choose between TP/SL market and limit orders. TP/SL market orders have a slippage tolerance of 10%.

By setting the limit price on TP/SL orders, users can control the slippage tolerance of a triggered order. The more aggressive the limit price, the more likely the TP/SL order will be filled upon triggering, but the higher the potential slippage upon filling.&#x20;

As a concrete example, a SL order to close a long with trigger price $10 and limit price $10 will hit the book when the mark price drops below $10. If the price drops from $11 to $9 instantly it is quite likely this SL order would rest at $10 instead of filling. However, if the limit price were $8 instead of $10, it's likely to fill at some price between $9 and $8.&#x20;

### TP/SL associated with a position

TP/SL opened from the position form will have a size equal to the entire position by default. These orders will attempt to close the entire position at the time of trigger. If a specific size is configured on these TP/SL orders, they will be fixed-sized (i.e. they will not resize with the position after being placed).

Position TP/SL orders are the most beginner-friendly because they have simple placement and cancelation criteria.

### TP/SL associated with a parent order (a.k.a one-cancels-other, OCO)&#x20;

This style of TP/SL is more complicated. Read the below carefully to avoid unexpected outcomes.

TP/SL opened from the order form have a fixed size equal to the order they are tied to.

If the parent order is fully filled at placement, the children TP and/or SL orders are immediately placed. This behavior is similar to the TP/SL assocated with a position.

When the parent order is not fully filled, the children orders enter an untriggered state. The TP/SL orders have not been placed, and upon cancelation of an unfilled parent order, the child TP/SL orders will be canceled.

If the trader cancels a partially filled parent order, ***the child TP/SL orders are fully canceled as well***. If the trader desires a TP/SL for the partially filled size, they must do so manually, e.g. by placing a separate TP/SL orders associated with the new position.

However, if the parent order is partially filled and then canceled due to insufficient margin, the TP/SL orders will be placed as if the order were fully filled.&#x20;

In conclusion, ***children TP/SL orders associated with a parent order will be placed if and only if the parent order fully fills or is partially filled followed by a cancelation for insufficient margin***.  &#x20;


# Entry price and pnl

On the Hyperliquid DEX, entry price, unrealized pnl, and closed pnl are purely frontend components provided for user convenience. The fundamental accounting is based on margin (balance for spot) and trades.&#x20;

### Perps

Perp trades are considered `opening` when the absolute value of the position increases. In other words, longing when already long or shorting when already short.

For opening trades, the entry price is updated to an average of current entry price and trade price weighted by size.

For closing trades, the entry price is kept the same.

Unrealized pnl is defined as `side * (mark_price - entry_price) * position_size` where `side = 1` for a long position and `side = -1` for a short position

Closed pnl is `fee + side * (mark_price - entry_price) * position_size` for a closing trade and only the fee for an opening trade.

### Spot

Spot trades use the same formulas as perps with the following modifications: Spot trades are considered `opening` for buys and `closing` for sells. Transfers are treated as buys or sells at mark price, and genesis distributions are treated as having entry price at `10000 USDC` market cap. Note that while 0 is the correct answer as genesis distributions are not bought, it leads to undefined return on equity.&#x20;

Pre-existing spot balances are assigned an entry price equal to the first trade or send after the feature was enabled around July 3 08:00 UTC.


# Self-trade prevention

Trades between the same address cancel the resting order instead of causing a fill. No fees are deducted, nor does the the cancel show up in the trade feed.

On CEXs this behavior is often labeled as "expire maker." This is a commonly preferred behavior for market making algorithms, where the aggressing order would like to continue getting fills against liquidity behind the maker order up until the limit price.


# Hyperps

### High level summary

*Hyperps* (Hyperliquid-only perps) trade like perpetual contracts that users are familiar with, but do not require an underlying spot or index oracle price. Instead, the funding rate is determined relative to a moving average hyperp mark price in place of the usual spot price. This makes the hyperp price more stable and less susceptible to manipulation, unlike usual pre-launch futures.&#x20;

This new derivative design does not require an underlying asset or index that exists at all points of the hyperp's lifetime, only that the underlying asset or index eventually exists for settlement or conversion.&#x20;

When trading hyperps, funding rates are very important to consider. If there is heavy price momentum in one direction, funding will heavily incentivize positions in the opposite direction for the next eight hours. As always, be sure to understand the contract before trading.

### Conversion to vanilla perps

For a hyperp tracking ABC, shortly after when ABC/USDT is listed on Binance, OKX, or Bybit spot trading, ABC-USD will convert to a normal ABC-USD perp.

### Hyperp mechanism details

Hyperps work just like normal perpetual contracts, except the external spot/index oracle price is replaced with an 8 hour exponentially weighted moving average of the last day's minutely mark prices.&#x20;

Precisely, `oracle_price(t) = min[sum_{i=0}^1439 [(t - i minutes < t_list ? initial_mark_price : mark_price(t - i minutes)) * exp(-i/480)] * (1 - exp(-1/480)) / (1 - exp(-3)), intial_mark_price * 4]`

Here `a ? b : c` evaluates to `b` if `a` is true and otherwise `c.`

Samples are taken on the first block after each unix minute, but the timestamps used are the nearest exact minute multiples. When there are fewer than 480 mark price samples, the initial mark price is used as the padding value.

Funding rate premium samples are computed as 1% of the usual clamped interest rate and premium formula. See Funding docs for more details.

The mark price of Hyperps incorporate the weighted median of pre-launch perp prices from CEXs as a component in the usual mark price formula. Despite the often significantly different contract specifications between hyperps and other venues' pre-launch perp markets, they are nonetheless included as mark price inputs to provide greater mark price stability during volatility.&#x20;

Note that the mark price of hyperps are capped at 10x the 8-hour mark price EMA. The oracle price is also restricted to be at most 4 times the one month average mark price as an additional safeguard against manipulation.


# Delisting

Validators vote on whether to delist validator-operated perps. If validators vote to delist an asset, the perps will settle to the 1 hour time weighted spot oracle price before delisting. This is a settlement mechanism used by many centralized exchanges.&#x20;

When an asset is delisted, all positions are settled and open orders are cancelled. Users who wish to avoid automatic settlement should close their positions beforehand. After settlement, no new orders will be accepted.


# Market making

There is no DMM program, special rebates / fees, or latency advantages. Anyone is welcome to MM. You can find the Python SDK here: <https://github.com/hyperliquid-dex/hyperliquid-python-sdk\\>
\
If you have technical integration questions, it's recommended to start in the Discord channel for #api-traders: <https://discord.gg/hyperliquid>


# Portfolio graphs

The portfolio page shows account value and P\&L graphs on 24 hour, 7 day, and 30 day time horizons.&#x20;

`Account value` includes unrealized pnl from cross and isolated margin positions, as well as vault balances.&#x20;

Pnl is defined as `account value` plus net deposits, i.e. `account value + deposits - withdrawals`.

Note that these graphs are samples on deposits and withdrawals and also every 15 minutes. Therefore, they are not recommended to precise accounting purposes, as the interpolation between samples may not reflect the actual change in unrealized pnl in between two consecutive samples.


# Miscellaneous UI

### Max Drawdown

The max drawdown on the portfolio page is only used on the frontend for users' convenience. It does not affect any margining or computations on Hyperliquid. Users who care about the precise formula can get their account value and pnl history and compute it however they choose.

The formula used on the frontend is the maximum over times `end > start` of the value `(pnl(end) - pnl(start)) / account_value(start)`&#x20;

Note that the denominator is account value and the numerator is pnl. Also note that this not equal to absolute max drawdown divided by some account value. Each possible time range considered uses its own denominator.&#x20;


# Validators


# Running a validator

GitHub repository for detailed instructions on how to run a non-validator and validator: <https://github.com/hyperliquid-dex/node>

Running validating and non-validating nodes is permissionless, meaning anyone can choose to do so. The active set of validators is determined transparently based on the top twenty-one by stake.


# Delegation program

### Overview

Validators play a critical role in maintaining the integrity and efficiency of Hyperliquid. The Hyper Foundation Delegation Program is designed to:&#x20;

* Enhance network security by delegating tokens to reliable and high-performing validators.
* Promote diversity across the validator network to enhance decentralization.
* Support validators committed to the growth and stability of the Hyperliquid ecosystem.

Testnet performance will be a criterion for mainnet delegation, particularly when mainnet performance metrics are not available for a given validator. Delegations will be monitored on an ongoing basis. The Foundation reserves the right to cease delegation at any time.

The Foundation validators will strongly consider participation in the Delegation Program as a factor for trusting peer validators. Those interested in running a mainnet validator are highly encouraged to apply for the Delegation Program before setting up a mainnet validator.

### Eligibility

* You must have 10k HYPE in one address before applying. The minimum self-delegation amount is 10k HYPE. Note that the minimum self-delegation amount is locked for one year.
* You must run at least two non-validator nodes with 95% uptime if your application is accepted. The IP addresses of these nodes will be shared publicly and attributed to you on documentation pages. Others will use your non-validators as seed nodes to connect to. The IP addresses must be static, e.g. using elastic IP addresses on AWS. Important: Do not open any non-validator ports to the public until an announcement to open up mainnet non-validators. Never open validator ports to the public.
* You must comply with applicable laws and regulations.&#x20;
* You must successfully complete KYC/KYB processes.&#x20;
* You must not be from a restricted jurisdiction, which includes, but is not limited to, Ontario, the U.S., Cuba, Iran, Myanmar, North Korea, Syria, and certain Russian-occupied regions of Ukraine.&#x20;
* The Foundation reserves the right to adjust the above eligibility criteria at any time.

### Apply

* Fill out the [application form](https://forms.gle/Mheitp58BkjU1qK8A).
* Following review of your application, you may be invited to provide KYC/KYB details.
* If your application is accepted and KYC/KYB is completed, you will need to review and accept the Program Terms.


# Referrals

### How do I refer someone to Hyperliquid?

You can create a referral code on <https://app.hyperliquid.xyz/referrals> after you’ve done $10,000 in volume. You will receive 10% of referred users' fees, less any fee discount they receive. Referral rewards apply for a user's first $1B in volume and referral discounts apply for a user's first $25M in volume.&#x20;

Share your referral code with other traders using a unique link: app.hyperliquid.xyz/join/YOURCODE.&#x20;

Referral rewards accrue for all quote assets and can be claimed once >$1. Claimed referral rewards are reflected in your spot balance. &#x20;

### How do I use a referral code?

Enter a referral code on <https://app.hyperliquid.xyz/referrals> or use a friend's referral link. Using a referral code will give you a 4% discount on your fees for your first $25M in volume. Referral discounts do not apply to vaults or sub-accounts because those are treated as independent accounts in the clearinghouse.


# Proposal: Staking referral program

*At this time, there is no definitive implementation for the staking referral program ready for mainnet. Based on extensive user and builder feedback, it is being re-evaluated to ensure fairness for all builders and a healthy builder ecosystem.*&#x20;

Details for the original proposal for a staking referral program are below:&#x20;

Builders and referrers who stake HYPE will be able to keep a percentage of their referred users’ trading fees, up to a maximum of 40% for builders and referrers at the highest staking tier. All builders and referrers with staked HYPE will automatically enjoy these benefits once the feature is enabled on mainnet.

Furthermore, builders and referrers will be able to share up to 50% of the staking referral revenue back to the referred user. This allows referrers to offer better than the default rates to new users.

### What are builder codes and referral codes?&#x20;

Builder codes allow interfaces routing through Hyperliquid to charge a custom fee on a per-order basis. This additional fee is called a builder fee and goes 100% to the builder. The new staking referral program is strictly more revenue for builders.

Referral codes are applied when a user joins via a referral link. Unlike builder codes, referral codes are tied to users and apply regardless of how the user trades in perpetuity. Note that builder codes override referral codes for that order, and referral codes are disabled after the user trades $1B cumulative volume.&#x20;

### How it works

The staking referral program interacts with staking tier fee discounts and the VIP tier fee schedule. If a builder or referrer has a higher staking tier than their referred user on a trade, they keep up to 100% of the difference. The percentage kept by the builder or referrer decreases as the volume tier of the referred user increases, starting at 100% for VIP 0 and ending at 40% for VIP 6.&#x20;

As an example: Alice has 100k staked HYPE, which gives a trading fee discount of 30%. Bob has 100 staked HYPE, which gives a trading fee discount of 10%, and Bob is at VIP 1. If Bob uses Alice’s builder or referral code, Alice can keep (30% - 10%) \* 90% = 18% of the fees that Bob pays. Alice could share with Bob up to 9% of his fees. In other words, Bob could receive up to a 9% trading fee discount using Alice’s builder or referral code.&#x20;

<table><thead><tr><th width="140.3671875">VIP tier</th><th width="208.53515625">14d weighted volume ($)</th><th width="265.47265625">Amount kept by builder or referrer</th></tr></thead><tbody><tr><td>0</td><td></td><td>100%</td></tr><tr><td>1</td><td>>5M</td><td>90%</td></tr><tr><td>2</td><td>>25M</td><td>80%</td></tr><tr><td>3</td><td>>100M</td><td>70%</td></tr><tr><td>4</td><td>>500M</td><td>60%</td></tr><tr><td>5</td><td>>2B</td><td>50%</td></tr><tr><td>6</td><td>>7B</td><td>40%</td></tr></tbody></table>

*Note these tiers correspond to the fee schedules in* [fees](https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-docs/trading/fees "mention")


# Points

The points program began on November 1, 2023. 1,000,000 points were distributed weekly to users for 6 months, ending May 1, 2024. Points are meant to reward users who contribute to the protocol’s success.

Affiliates earned 1 point for every 4 points their referred users earned. Points criteria was updated on a recurring basis. Points distributions were based on weekly activity ending Wednesdays at 00:00 UTC. Distributions took place on Thursdays. Points were also distributed for the closed alpha period up through October 31, 2023.

The L1 phase of points began on May 29, 2024 and ended in November 2024. 700,000 points were distributed weekly. Activity from May 1-28, 2024 received a multiplier. Hyperliquid reserves the right to modify previous point distributions under its sole discretion.


# Historical data

The examples below use the AWS CLI (see <https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html>) and LZ4 (<https://github.com/lz4/lz4> or install from your package manager).

Note that the requester of the data must pay for transfer costs.

### Asset data

Historical data is uploaded to the bucket `hyperliquid-archive`  approximately once a month. **There is no guarantee of timely updates and data may be missing.**&#x20;

L2 book snapshots are available in market\_data and asset contexts are available in asset\_ctxs. No other historical data sets are provided via S3 (e.g. candles or spot asset data). You can use the API to record additional historical data sets yourself.&#x20;

Format: `s3://hyperliquid-archive/market_data/[date]/[hour]/[datatype]/[coin].lz4` or `s3://hyperliquid-archive/asset_ctxs/[date].csv.lz4`

```
aws s3 cp s3://hyperliquid-archive/market_data/20230916/9/l2Book/SOL.lz4 /tmp/SOL.lz4 --request-payer requester
unlz4 --rm /tmp/SOL.lz4
head /tmp/SOL
```

### Trade data

`s3://hl-mainnet-node-data/node_fills_by_block` has fills which are streamed via `--write-fills --batch-by-block` from a non-validating node. Older data is in a different format at `s3://hl-mainnet-node-data/node_fills` and `s3://hl-mainnet-node-data/node_trades` . `node_fills` matches the API format, while `node_trades` does not.

### Historical node data

`s3://hl-mainnet-node-data/explorer_blocks`and `s3://hl-mainnet-node-data/replica_cmds` contain historical explorer blocks and L1 transactions. &#x20;


# Risks

### Smart contract risk

The onchain perp DEX depends on the correctness and security of the Arbitrum bridge smart contracts. Bugs or vulnerabilities in the smart contracts could result in the loss of user funds.&#x20;

### L1 risk

Hyperliquid runs on its own L1 which has not undergone as extensive testing and scrutiny as other established L1s like Ethereum. The network may experience downtime due to consensus or other issues.

### Market liquidity risk

As a relatively new protocol, there could be a potential risk of low liquidity, especially in the early stages. This can lead to significant price slippage for traders, negatively affecting the overall trading experience and possibly leading to substantial losses.

### Oracle manipulation risk

Hyperliquid relies on price oracles maintained by the validators to supply market data. If an oracle is compromised or manipulated for an extended period of time, the mark price could be affected and liquidations could occur before the price reverts to its fair value.

### Risk mitigation

There are additional measures in place to prevent oracle manipulation attacks on less liquid assets. One such restriction is open interest caps, which are based on a combination of liquidity, basis, and leverage in the system.&#x20;

When an asset hits the open interest cap, no new positions can be opened. Furthermore, orders cannot rest further than 1% from the oracle price. HLP is exempt from these rules in order to continue quoting liquidity.

Note that this is not an exhaustive list of potential risks.&#x20;


# Bug bounty program

### In scope

* On mainnet, any bug that would cause an outage or logical error on nodes or API servers is in scope.&#x20;
* On testnet, testnet-only features of the HyperEVM and its interaction with HyperCore are also in scope. Note that for features that are not live on mainnet, the bounty payment for EVM bugs will not match a mainnet bug of the same severity.&#x20;
* Other experimental features on testnet are not in scope, unless otherwise announced, though bug reports are still appreciated for these features.

### Submission process

* Write a report regarding the bug and include detailed reproduction steps and a proof of concept to validate your findings. Submit your report to <bugbounty@hyperfoundation.org>.
* If the same bug is reported by multiple individuals or entities, the first report will be honored.&#x20;
* Rewards will be paid in USDC on Hyperliquid for responsible disclosure of bugs based on their severity.&#x20;
* We agree not to pursue legal action in respect of any research conducted in good faith and in compliance with this program.&#x20;
* The time and energy that go into all bug reports is deeply appreciated.

### Prohibited activity&#x20;

* Testing on mainnet code; all testing should be done on testnet or local forks.
* Phishing or other social engineering attacks.
* Extended, large scale DDOS attacks. Attacks involving mishandling of temporary spikes in load are allowed.
* Testing with third-party systems and applications (e.g. browser extensions) as well as websites (e.g. SSO providers, advertising networks).
* Submitting ransom demands or threats.
* Publicly disclosing a bug report before it has been fixed and paid.
* Threatening to publish or publishing anyone’s personally identifiable information or other sensitive information without their consent.
* Exploiting vulnerabilities for personal financial gain beyond the rewards described in this program.
* Attempting to bypass these procedures or engaging in unauthorized activities outside the outlined scope.

### Eligibility

* You must submit your report to <bugbounty@hyperfoundation.org>. Do not use external sites.&#x20;
* You must comply with the KYC/KYB policy and procedures.&#x20;
* You must be able to receive USDC on Hyperliquid.&#x20;
* You must maintain confidentiality regarding vulnerabilities and communications until authorized for disclosure by us.
* We must be able to reproduce your findings. All bounty submissions will be paid out based on their classification. Classification examples are subject to change. &#x20;
* Contributors to the development of the code being tested are not eligible to participate in the program in relation to such code.

### Ineligibility

* Reports lacking sufficient detail, including step-by-step instructions, reproducible examples, or proof of concept.
* Vulnerabilities that require highly unlikely or unreasonable user behavior to exploit.
* Vulnerabilities caused by outdated software, unpatched browsers, or systems no longer supported by Hyperliquid.
* Vulnerabilities that rely on root access, jailbreaking, or other modifications to user devices.
* Issues within third-party libraries, extensions, tools, or applications that do not lead to a direct Hyperliquid vulnerability.
* Bugs or errors unrelated to security, such as minor performance issues.
* Bugs or errors contingent on extreme or unrealistic market conditions that do not reflect real-world scenarios.

### General conditions

* Payment will not be made for submissions that do not meet the program’s requirements or that are excluded under the program’s scope or ineligibility criteria.&#x20;
* We reserve the right to determine the validity and classification of any submission at our sole discretion.
* All submissions become the property of the Hyper Foundation. We reserve the right to use, modify, or disclose submissions for security purposes without requiring additional consent.

### Classification examples

* Critical (<1M USDC): Significant loss of user funds. Violation of L1 execution invariants.
* High (<50k USDC): Network downtime that does not lead to incorrect state.
* Medium (<10k USDC): API server performance issues.&#x20;

For the avoidance of doubt, rewards are determined based on the severity of the issue reported, and payouts may vary within the ranges listed above. Severity is determined based on both impact and likelihood of occurrence.


# Audits

The Hyperliquid bridge contract has been audited by Zellic.

{% file src="<https://2356094849-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FyUdp569E6w18GdfqlGvJ%2Fuploads%2FRhEpax5uWlJelxdFNb9c%2F2312%20Hyperliquid%20-%20Zellic%20Audit%20Report.pdf?alt=media&token=1e76a9b0-3a04-4d44-a8c9-a468e60cf7f1>" %}
Final report
{% endfile %}

{% file src="<https://2356094849-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FyUdp569E6w18GdfqlGvJ%2Fuploads%2FuiAL7ufANHbcsrAvZgLQ%2F2308%20Hyperliquid%20-%20Zellic%20Audit%20Report.pdf?alt=media&token=7450a0f9-c2c8-4c3e-907a-5619b431e86c>" %}
First report
{% endfile %}

&#x20;


# Brand kit

{% file src="<https://2356094849-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FyUdp569E6w18GdfqlGvJ%2Fuploads%2Fmi1dRSncSoAlCu8g0vuz%2FHyperliquid%20logo%20PNG%20format.zip?alt=media&token=7b20dd95-b83d-4a92-bbcd-6def2c3e1b96>" %}

{% file src="<https://2356094849-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FyUdp569E6w18GdfqlGvJ%2Fuploads%2F8KvZR8Tg59khzampvMOm%2FHyperliquid%20logo%20SVG%20format.zip?alt=media&token=c0342344-c834-4fb5-bcdc-be0b59635c6e>" %}

{% file src="<https://2356094849-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FyUdp569E6w18GdfqlGvJ%2Fuploads%2FPhUx7c6A9q4PERXlYDEb%2FHyperliquid%20banner.jpg?alt=media&token=b6c595bf-95b9-40d4-aea5-068ae3e8d195>" %}

{% file src="<https://2356094849-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FyUdp569E6w18GdfqlGvJ%2Fuploads%2FOvPiTf8wbNODw6cY8fCm%2FHypurr.zip?alt=media&token=5a3263c9-257b-42ab-b19d-c843b3085dea>" %}

{% file src="<https://2356094849-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FyUdp569E6w18GdfqlGvJ%2Fuploads%2F7YGVYWXnZUXMyIKbVzLi%2FHypurr%202.zip?alt=media&token=43795e46-2506-476e-913e-1b4db3bb7c65>" %}

{% file src="<https://2356094849-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FyUdp569E6w18GdfqlGvJ%2Fuploads%2FKnoXPKrAHz1N4xXVy5DY%2FHypurr%203.zip?alt=media&token=de4b2f7c-7ad8-47e8-80fe-fc8c1dd31b05>" %}

{% file src="<https://2356094849-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FyUdp569E6w18GdfqlGvJ%2Fuploads%2FXqGPqUqpNLyQv9kx1e48%2FEVM%2C%20Core%2C%20Powered%20by%20Hyperliquid.zip?alt=media&token=2e17477f-eb0b-42d5-a027-6fe9bb70a1f0>" %}


# API

Documentation for the Hyperliquid public API

Python SDK: <https://github.com/hyperliquid-dex/hyperliquid-python-sdk>

Typescript SDKs written by members of the community:\
<https://github.com/nktkas/hyperliquid>\
<https://github.com/nomeida/hyperliquid>

Rust SDK (not maintained): <https://github.com/hyperliquid-dex/hyperliquid-rust-sdk>&#x20;

CCXT also maintains integrations in multiple languages that conforms with the standard CCXT API: <https://docs.ccxt.com/#/exchanges/hyperliquid><br>

All example API calls use the mainnet url (<https://api.hyperliquid.xyz>), but you can make the same requests against testnet using the corresponding url (<https://api.hyperliquid-testnet.xyz>)


# Notation

The current v0 API currently uses some nonstandard notation. Relevant standardization will be batched into a breaking v1 API change.

<table><thead><tr><th width="231.33333333333331">Abbreviation</th><th>Full name</th><th>Explanation</th></tr></thead><tbody><tr><td>Px</td><td>Price</td><td></td></tr><tr><td>Sz</td><td>Size</td><td>In units of coin, i.e. base currency</td></tr><tr><td>Szi</td><td>Signed size </td><td>Positive for long, negative for short</td></tr><tr><td>Ntl</td><td>Notional</td><td>USD amount, Px * Sz </td></tr><tr><td>Side</td><td>Side of trade or book</td><td>B = Bid = Buy, A = Ask = Short. Side is aggressing side for trades.</td></tr><tr><td>Asset</td><td>Asset</td><td>An integer representing the asset being traded. See below for explanation</td></tr><tr><td>Tif</td><td>Time in force</td><td>GTC = good until canceled, ALO = add liquidity only (post only), IOC = immediate or cancel</td></tr></tbody></table>


# Asset IDs

Perpetual endpoints expect an integer for `asset`, which is the index of the coin found in the `meta` info response. E.g. `BTC = 0` on mainnet.

Spot endpoints expect `10000 + spotInfo["index"]` where `spotInfo` is the corresponding object in `spotMeta` that has the desired quote and base tokens. For example, when submitting an order for `PURR/USDC`, the asset that should be used is `10000` because its asset index in the spot info is `0`.

Builder-deployed perps expect `100000 + perp_dex_index * 10000 + index_in_meta` . For example, `test:ABC` on testnet has `perp_dex_index = 1` ,`index_in_meta = 0` , `asset = 110000` . Note that builder-deployed perps always have name in the format `{dex}:{coin}` .

### Examples

Note that spot ID is different from token ID, and that mainnet and testnet have different asset IDs. For example, for HYPE:

Mainnet token ID: 150

Mainnet spot ID: 107

Testnet token ID: 1105

Testnet spot ID: 1035


# Tick and lot size

Both Price (px) and Size (sz) have a maximum number of decimals that are accepted.&#x20;

Prices can have up to 5 significant figures, but no more than `MAX_DECIMALS - szDecimals` decimal places where `MAX_DECIMALS` is 6 for perps and 8 for spot. Integer prices are always allowed, regardless of the number of significant figures. E.g. `123456` is a valid price even though `12345.6` is not.

Sizes are rounded to the `szDecimals` of that asset. For example, if `szDecimals = 3` then `1.001` is a valid size but `1.0001` is not.&#x20;

`szDecimals` for an asset is found in the meta response to the info endpoint

### Perp price examples

`1234.5` is valid but `1234.56` is not (too many significant figures)

`0.001234` is valid, but `0.0012345` is not (more than 6 decimal places)

If `szDecimals = 1` , `0.01234` is valid but `0.012345` is not (more than `6 - szDecimals` decimal places)

### Spot price examples

`0.0001234` is valid if `szDecimals` is 0 or 1, but not if `szDecimals` is greater than 2 (more than 8-2 decimal places).&#x20;

### Signing

Note that if implementing signing, trailing zeroes should be removed. See [Signing](https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-docs/for-developers/api/signing) for more details.


# Nonces and API wallets

### Background&#x20;

A decentralized L1 must prevent replay attacks. When a user signs a USDC transfer transaction, the receiver cannot broadcast it multiple times to drain the sender's wallet. To solve this Ethereum stores a "nonce" for each address, which is a number that starts at 0. Each transaction must use exactly "nonce + 1" to be included.

### API wallets

These are also known as `agent wallets` in the docs. A master account can approve API wallets to sign on behalf of the master account or any of the sub-accounts.&#x20;

Note that API wallets are only used to sign. To query the account data associated with a master or sub-account, you must pass in the actual address of that account. A common pitfall is to use the agent wallet which leads to an empty result.

### API wallet pruning

API wallets and their associated nonce state may be pruned in the following cases:

1. The wallet is deregistered. This happens to an existing unnamed API Wallet when an ApproveAgent action is sent to register a new unnamed API Wallet. This also happens to an existing named API Wallet when an ApproveAgent action is sent with a matching name.
2. The wallet expires.
3. The account that registered the agent no longer has funds.

**Important:** for those using API wallets programmatically, it is **strongly** suggested to not reuse their addresses. Once an agent is deregistered, its used nonce state may be pruned. Generate a new agent wallet on future use to avoid unexpected behavior. For example, previously signed actions can be replayed once the nonce set is pruned.

### Hyperliquid nonces&#x20;

Ethereum's design does not work for an onchain order book. A market making strategy can send thousands of orders and cancels in a second. Requiring a precise ordering of inclusion on the blockchain will break any strategy.

On Hyperliquid, the 100 highest nonces are stored per address. Every new transaction must have nonce larger than the smallest nonce in this set and also never have been used before. Nonces are tracked per signer, which is the user address if signed with private key of the address, or the agent address if signed with an API wallet.&#x20;

Nonces must be within `(T - 2 days, T + 1 day)`, where `T` is the unix millisecond timestamp on the block of the transaction.

The following steps may help port over an automated strategy from a centralized exchange:

1. Use a API wallet per trading process. Note that nonces are stored per signer (i.e. private key), so separate subaccounts signed by the same API wallet will share the nonce tracker of the API wallet. It's recommended to use separate API wallets for different subaccounts.
2. In each trading process, have a task that periodically batches order and cancel requests every 0.1 seconds. It is recommended to batch IOC and GTC orders separately from ALO orders because ALO order-only batches are prioritized by the validators.
3. The trading logic tasks send orders and cancels to the batching task.
4. For each batch of orders or cancels, fetch and increment an atomic counter that ensures a unique nonce for the address. The atomic counter can be fast-forwarded to current unix milliseconds if needed.

This structure is robust to out-of-order transactions within 2 seconds, which should be sufficient for an automated strategy geographically near an API server.

### Suggestions for subaccount and vault users

Note that nonces are stored per signer, which is the address of the private key used to sign the transaction. Therefore, it's recommended that each trading process or frontend session use a separate private key for signing. In particular, a single API wallet signing for a user, vault, or subaccount all share the same nonce set.

If users want to use multiple subaccounts in parallel, it would easier to generate two separate API wallets under the master account, and use one API wallet for each subaccount. This avoids collisions between the nonce set used by each subaccount.


# Info endpoint

The info endpoint is used to fetch information about the exchange and specific users. The different request bodies result in different corresponding response body schemas.

### Pagination

Responses that take a time range will only return 500 elements or distinct blocks of data. To query larger ranges, use the last returned timestamp as the next `startTime` for pagination.

### Perpetuals vs Spot

The endpoints in this section as well as websocket subscriptions work for both Perpetuals and Spot. For perpetuals `coin` is the name returned in the `meta` response. For Spot, coin should be `PURR/USDC` for PURR, and `@{index}` e.g. `@1` for all other spot tokens where index is the index of the spot pair in the `universe` field of the `spotMeta` response. For example, the spot index for HYPE on mainnet is `@107` because the token index of HYPE is 150 and the spot pair `@107` has tokens `[150, 0]`. Note that some assets may be remapped on user interfaces. For example, `BTC/USDC` on app.hyperliquid.xyz corresponds to `UBTC/USDC` on mainnet HyperCore. The L1 name on the [token details page](https://app.hyperliquid.xyz/explorer/token/0x8f254b963e8468305d409b33aa137c67) can be used to detect remappings.

### User address

To query the account data associated with a master or sub-account, you must pass in the actual address of that account. A common pitfall is to use an agent wallet's address which leads to an empty result.

## Retrieve mids for all coins

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

Note that if the book is empty, the last trade price will be used as a fallback

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                   | Type   | Description                                                                                                                            |
| -------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| type<mark style="color:red;">\*</mark> | String | "allMids"                                                                                                                              |
| dex                                    | String | Perp dex name. Defaults to the empty string which represents the first perp dex. Spot mids are only included with the first perp dex.. |

{% tabs %}
{% tab title="200: OK Successful Response" %}

```json
{
    "APE": "4.33245",
    "ARB": "1.21695"
}
```

{% endtab %}
{% endtabs %}

## Retrieve a user's open orders

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

See a user's open orders

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                   | Type   | Description                                                                                                                                  |
| -------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| type<mark style="color:red;">\*</mark> | String | "openOrders"                                                                                                                                 |
| user<mark style="color:red;">\*</mark> | String | Address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000.                                                 |
| dex                                    | String | Perp dex name. Defaults to the empty string which represents the first perp dex. Spot open orders are only included with the first perp dex. |

{% tabs %}
{% tab title="200: OK Successful R" %}

```json
[
    {
        "coin": "BTC",
        "limitPx": "29792.0",
        "oid": 91490942,
        "side": "A",
        "sz": "0.0",
        "timestamp": 1681247412573
    }
]
```

{% endtab %}
{% endtabs %}

## Retrieve a user's open orders with additional frontend info

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                   | Type   | Description                                                                                                                                  |
| -------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| type<mark style="color:red;">\*</mark> | String | "frontendOpenOrders"                                                                                                                         |
| user<mark style="color:red;">\*</mark> | String | Address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000.                                                 |
| dex                                    | String | Perp dex name. Defaults to the empty string which represents the first perp dex. Spot open orders are only included with the first perp dex. |

{% tabs %}
{% tab title="200: OK " %}

```json
[
    {
        "coin": "BTC",
        "isPositionTpsl": false,
        "isTrigger": false,
        "limitPx": "29792.0",
        "oid": 91490942,
        "orderType": "Limit",
        "origSz": "5.0",
        "reduceOnly": false,
        "side": "A",
        "sz": "5.0",
        "timestamp": 1681247412573,
        "triggerCondition": "N/A",
        "triggerPx": "0.0",
    }
]
```

{% endtab %}
{% endtabs %}

## Retrieve a user's fills

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

Returns at most 2000 most recent fills

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                   | Type   | Description                                                                                                                                                                                               |
| -------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| type<mark style="color:red;">\*</mark> | String | "userFills"                                                                                                                                                                                               |
| user<mark style="color:red;">\*</mark> | String | Address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000.                                                                                                              |
| aggregateByTime                        | bool   | When true, partial fills are combined when a crossing order gets filled by multiple different resting orders. Resting orders filled by multiple crossing orders are only aggregated if in the same block. |

{% tabs %}
{% tab title="200: OK" %}

```json
[
    // Perp fill
    {
        "closedPnl": "0.0",
        "coin": "AVAX",
        "crossed": false,
        "dir": "Open Long",
        "hash": "0xa166e3fa63c25663024b03f2e0da011a00307e4017465df020210d3d432e7cb8",
        "oid": 90542681,
        "px": "18.435",
        "side": "B",
        "startPosition": "26.86",
        "sz": "93.53",
        "time": 1681222254710,
        "fee": "0.01", // the total fee, inclusive of builderFee below
        "feeToken": "USDC",
        "builderFee": "0.01", // this is optional and will not be present if 0
        "tid": 118906512037719
    },
    // Spot fill - note the difference in the "coin" format. Refer to 
    // https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/asset-ids
    // for more information on how spot asset IDs work
    {
        "coin": "@107",
        "px": "18.62041381",
        "sz": "43.84",
        "side": "A",
        "time": 1735969713869,
        "startPosition": "10659.65434798",
        "dir": "Sell",
        "closedPnl": "8722.988077",
        "hash": "0x2222138cc516e3fe746c0411dd733f02e60086f43205af2ae37c93f6a792430b",
        "oid": 59071663721,
        "crossed": true,
        "fee": "0.304521",
        "tid": 907359904431134,
        "feeToken": "USDC"
    }
]
```

{% endtab %}
{% endtabs %}

## Retrieve a user's fills by time

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

Returns at most 2000 fills per response and only the 10000 most recent fills are available

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                                                                                                                                                               |
| ------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| type<mark style="color:red;">\*</mark>      | String | userFillsByTime                                                                                                                                                                                           |
| user<mark style="color:red;">\*</mark>      | String | Address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000.                                                                                                              |
| startTime<mark style="color:red;">\*</mark> | int    | Start time in milliseconds, inclusive                                                                                                                                                                     |
| endTime                                     | int    | End time in milliseconds, inclusive. Defaults to current time.                                                                                                                                            |
| aggregateByTime                             | bool   | When true, partial fills are combined when a crossing order gets filled by multiple different resting orders. Resting orders filled by multiple crossing orders are only aggregated if in the same block. |

{% tabs %}
{% tab title="200: OK Number of fills is limited to 2000" %}

```json
[
    // Perp fill
    {
        "closedPnl": "0.0",
        "coin": "AVAX",
        "crossed": false,
        "dir": "Open Long",
        "hash": "0xa166e3fa63c25663024b03f2e0da011a00307e4017465df020210d3d432e7cb8",
        "oid": 90542681,
        "px": "18.435",
        "side": "B",
        "startPosition": "26.86",
        "sz": "93.53",
        "time": 1681222254710,
        "fee": "0.01", // the total fee, inclusive of builderFee below
        "feeToken": "USDC",
        "builderFee": "0.01", // this is optional and will not be present if 0
        "tid": 118906512037719
    },
    // Spot fill - note the difference in the "coin" format. Refer to 
    // https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/asset-ids
    // for more information on how spot asset IDs work
    {
        "coin": "@107",
        "px": "18.62041381",
        "sz": "43.84",
        "side": "A",
        "time": 1735969713869,
        "startPosition": "10659.65434798",
        "dir": "Sell",
        "closedPnl": "8722.988077",
        "hash": "0x2222138cc516e3fe746c0411dd733f02e60086f43205af2ae37c93f6a792430b",
        "oid": 59071663721,
        "crossed": true,
        "fee": "0.304521",
        "tid": 907359904431134,
        "feeToken": "USDC"
    }
]
```

{% endtab %}
{% endtabs %}

## Query user rate limits

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

#### Request Body

| Name | Type   | Description                                                                                 |
| ---- | ------ | ------------------------------------------------------------------------------------------- |
| user | String | Address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000 |
| type | String | userRateLimit                                                                               |

{% tabs %}
{% tab title="200: OK A successful response" %}

```json
{
  "cumVlm": "2854574.593578",
  "nRequestsUsed": 2890, // max(0, cumulative_used minus reserved)
  "nRequestsCap": 2864574, 
  "nRequestsSurplus": 0, // max(0, reserved minus cumulative_used)
}
```

{% endtab %}
{% endtabs %}

## Query order status by oid or cloid

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

#### Request Body

| Name                                   | Type             | Description                                                                                  |
| -------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------- |
| user<mark style="color:red;">\*</mark> | String           | Address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000. |
| type<mark style="color:red;">\*</mark> | String           | "orderStatus"                                                                                |
| oid<mark style="color:red;">\*</mark>  | uint64 or string | Either u64 representing the order id or 16-byte hex string representing the client order id  |

The \<status> string returned has the following possible values:

| Order status                              | Explanation                                                                       |
| ----------------------------------------- | --------------------------------------------------------------------------------- |
| open                                      | Placed successfully                                                               |
| filled                                    | Filled                                                                            |
| canceled                                  | Canceled by user                                                                  |
| triggered                                 | Trigger order triggered                                                           |
| rejected                                  | Rejected at time of placement                                                     |
| marginCanceled                            | Canceled because insufficient margin to fill                                      |
| vaultWithdrawalCanceled                   | Vaults only. Canceled due to a user's withdrawal from vault                       |
| openInterestCapCanceled                   | Canceled due to order being too aggressive when open interest was at cap          |
| selfTradeCanceled                         | Canceled due to self-trade prevention                                             |
| reduceOnlyCanceled                        | Canceled reduced-only order that does not reduce position                         |
| siblingFilledCanceled                     | TP/SL only. Canceled due to sibling ordering being filled                         |
| delistedCanceled                          | Canceled due to asset delisting                                                   |
| liquidatedCanceled                        | Canceled due to liquidation                                                       |
| scheduledCancel                           | API only. Canceled due to exceeding scheduled cancel deadline (dead man's switch) |
| tickRejected                              | Rejected due to invalid tick price                                                |
| minTradeNtlRejected                       | Rejected due to order notional below minimum                                      |
| perpMarginRejected                        | Rejected due to insufficient margin                                               |
| reduceOnlyRejected                        | Rejected due to reduce only                                                       |
| badAloPxRejected                          | Rejected due to post-only immediate match                                         |
| iocCancelRejected                         | Rejected due to IOC not able to match                                             |
| badTriggerPxRejected                      | Rejected due to invalid TP/SL price                                               |
| marketOrderNoLiquidityRejected            | Rejected due to lack of liquidity for market order                                |
| positionIncreaseAtOpenInterestCapRejected | Rejected due to open interest cap                                                 |
| positionFlipAtOpenInterestCapRejected     | Rejected due to open interest cap                                                 |
| tooAggressiveAtOpenInterestCapRejected    | Rejected due to price too aggressive at open interest cap                         |
| openInterestIncreaseRejected              | Rejected due to open interest cap                                                 |
| insufficientSpotBalanceRejected           | Rejected due to insufficient spot balance                                         |
| oracleRejected                            | Rejected due to price too far from oracle                                         |
| perpMaxPositionRejected                   | Rejected due to exceeding margin tier limit at current leverage                   |

{% tabs %}
{% tab title="200: OK A successful response" %}

```json
{
  "status": "order",
  "order": {
    "order": {
      "coin": "ETH",
      "side": "A",
      "limitPx": "2412.7",
      "sz": "0.0",
      "oid": 1,
      "timestamp": 1724361546645,
      "triggerCondition": "N/A",
      "isTrigger": false,
      "triggerPx": "0.0",
      "children": [],
      "isPositionTpsl": false,
      "reduceOnly": true,
      "orderType": "Market",
      "origSz": "0.0076",
      "tif": "FrontendMarket",
      "cloid": null
    },
    "status": <status>,
    "statusTimestamp": 1724361546645
  }
}
```

{% endtab %}

{% tab title="200: OK Missing Order" %}

```json
{
  "status": "unknownOid"
}
```

{% endtab %}
{% endtabs %}

## L2 book snapshot

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

Returns at most 20 levels per side

**Headers**

| Name                                           | Value              |
| ---------------------------------------------- | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | "application/json" |

**Body**

| Name                                   | Type   | Description                                                                                                                               |
| -------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| type<mark style="color:red;">\*</mark> | String | "l2Book"                                                                                                                                  |
| coin<mark style="color:red;">\*</mark> | String | coin                                                                                                                                      |
| nSigFigs                               | Number | Optional field to aggregate levels to `nSigFigs` significant figures. Valid values are 2, 3, 4, 5, and `null`, which means full precision |
| mantissa                               | Number | Optional field to aggregate levels. This field is only allowed if nSigFigs is 5. Accepts values of 1, 2 or 5.                             |

**Response**

{% tabs %}
{% tab title="200: OK" %}

```json
{
  "coin": "BTC",
  "time": 1754450974231,
  "levels": [
    [
      {
        "px": "113377.0",
        "sz": "7.6699",
        "n": 17 // number of levels
      },
      {
        "px": "113376.0",
        "sz": "4.13714",
        "n": 8
      },
    ],
    [
      {
        "px": "113397.0",
        "sz": "0.11543",
        "n": 3
      }
    ]
  ]
}
```

{% endtab %}
{% endtabs %}

## Candle snapshot

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

Only the most recent 5000 candles are available

Supported intervals: "1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "8h", "12h", "1d", "3d", "1w", "1M"

**Headers**

| Name                                           | Value              |
| ---------------------------------------------- | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | "application/json" |

**Body**

| Name                                   | Type   | Description                                                                                    |
| -------------------------------------- | ------ | ---------------------------------------------------------------------------------------------- |
| type<mark style="color:red;">\*</mark> | String | "candleSnapshot"                                                                               |
| req<mark style="color:red;">\*</mark>  | Object | {"coin": \<coin>, "interval": "15m", "startTime": \<epoch millis>, "endTime": \<epoch millis>} |

**Response**

{% tabs %}
{% tab title="200: OK" %}

```json
[
  {
    "T": 1681924499999,
    "c": "29258.0",
    "h": "29309.0",
    "i": "15m",
    "l": "29250.0",
    "n": 189,
    "o": "29295.0",
    "s": "BTC",
    "t": 1681923600000,
    "v": "0.98639"
  }
]
```

{% endtab %}
{% endtabs %}

## Check builder fee approval

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

**Headers**

| Name                                           | Value              |
| ---------------------------------------------- | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | "application/json" |

**Body**

| Name                                      | Type   | Description                                                                                  |
| ----------------------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| type<mark style="color:red;">\*</mark>    | String | "maxBuilderFee"                                                                              |
| user<mark style="color:red;">\*</mark>    | String | Address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000. |
| builder<mark style="color:red;">\*</mark> | String | Address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000. |

**Response**

{% tabs %}
{% tab title="200: OK" %}

```json
1 // maximum fee approved in tenths of a basis point i.e. 1 means 0.001%
```

{% endtab %}
{% endtabs %}

## Retrieve a user's historical orders

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

Returns at most 2000 most recent historical orders

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                   | Type   | Description                                                                                  |
| -------------------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| type<mark style="color:red;">\*</mark> | String | "historicalOrders"                                                                           |
| user<mark style="color:red;">\*</mark> | String | Address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000. |

{% tabs %}
{% tab title="200: OK" %}

```json
[
  {
    "order": {
      "coin": "ETH",
      "side": "A",
      "limitPx": "2412.7",
      "sz": "0.0",
      "oid": 1,
      "timestamp": 1724361546645,
      "triggerCondition": "N/A",
      "isTrigger": false,
      "triggerPx": "0.0",
      "children": [],
      "isPositionTpsl": false,
      "reduceOnly": true,
      "orderType": "Market",
      "origSz": "0.0076",
      "tif": "FrontendMarket",
      "cloid": null
    },
    "status": "filled" | "open" | "canceled" | "triggered" | "rejected" | "marginCanceled",
    "statusTimestamp": 1724361546645
  }
]
```

{% endtab %}
{% endtabs %}

## Retrieve a user's TWAP slice fills

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

Returns at most 2000 most recent TWAP slice fills

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                   | Type   | Description                                                                                  |
| -------------------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| type<mark style="color:red;">\*</mark> | String | "userTwapSliceFills"                                                                         |
| user<mark style="color:red;">\*</mark> | String | Address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000. |

{% tabs %}
{% tab title="200: OK" %}

```json
[
    {
        "fill": {
            "closedPnl": "0.0",
            "coin": "AVAX",
            "crossed": true,
            "dir": "Open Long",
            "hash": "0x0000000000000000000000000000000000000000000000000000000000000000", // TWAP fills have a hash of 0
            "oid": 90542681,
            "px": "18.435",
            "side": "B",
            "startPosition": "26.86",
            "sz": "93.53",
            "time": 1681222254710,
            "fee": "0.01",
            "feeToken": "USDC",
            "tid": 118906512037719
        },
        "twapId": 3156
    }
]
```

{% endtab %}
{% endtabs %}

## Retrieve a user's subaccounts

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                   | Type   | Description                                                                                  |
| -------------------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| type<mark style="color:red;">\*</mark> | String | "subAccounts"                                                                                |
| user<mark style="color:red;">\*</mark> | String | Address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000. |

{% tabs %}
{% tab title="200: OK" %}

```json
[
  {
    "name": "Test",
    "subAccountUser": "0x035605fc2f24d65300227189025e90a0d947f16c",
    "master": "0x8c967e73e6b15087c42a10d344cff4c96d877f1d",
    "clearinghouseState": {
      "marginSummary": {
        "accountValue": "29.78001",
        "totalNtlPos": "0.0",
        "totalRawUsd": "29.78001",
        "totalMarginUsed": "0.0"
      },
      "crossMarginSummary": {
        "accountValue": "29.78001",
        "totalNtlPos": "0.0",
        "totalRawUsd": "29.78001",
        "totalMarginUsed": "0.0"
      },
      "crossMaintenanceMarginUsed": "0.0",
      "withdrawable": "29.78001",
      "assetPositions": [],
      "time": 1733968369395
    },
    "spotState": {
      "balances": [
        {
          "coin": "USDC",
          "token": 0,
          "total": "0.22",
          "hold": "0.0",
          "entryNtl": "0.0"
        }
      ]
    }
  }
]
```

{% endtab %}
{% endtabs %}

## Retrieve details for a vault

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                           | Type   | Description                                                                                  |
| ---------------------------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| type<mark style="color:red;">\*</mark>         | String | "vaultDetails"                                                                               |
| vaultAddress<mark style="color:red;">\*</mark> | String | Address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000. |
| user                                           | String | Address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000. |

{% tabs %}
{% tab title="200: OK" %}

```json
{
  "name": "Test",
  "vaultAddress": "0xdfc24b077bc1425ad1dea75bcb6f8158e10df303",
  "leader": "0x677d831aef5328190852e24f13c46cac05f984e7",
  "description": "This community-owned vault provides liquidity to Hyperliquid through multiple market making strategies, performs liquidations, and accrues platform fees.",
  "portfolio": [
    [
      "day",
      {
        "accountValueHistory": [
          [
            1734397526634,
            "329265410.90790099"
          ]
        ],
        "pnlHistory": [
          [
            1734397526634,
            "0.0"
          ],
        ],
        "vlm": "0.0"
      }
    ],
    [
      "week" | "month" | "allTime" | "perpDay" | "perpWeek" | "perpMonth" | "perpAllTime",
      {...}
    ]
  ],
  "apr": 0.36387129259090006,
  "followerState": null,
  "leaderFraction": 0.0007904828725729887,
  "leaderCommission": 0,
  "followers": [
    {
      "user": "0x005844b2ffb2e122cf4244be7dbcb4f84924907c",
      "vaultEquity": "714491.71026243",
      "pnl": "3203.43026143",
      "allTimePnl": "79843.74476743",
      "daysFollowing": 388,
      "vaultEntryTime": 1700926145201,
      "lockupUntil": 1734824439201
    }
  ],
  "maxDistributable": 94856870.164485,
  "maxWithdrawable": 742557.680863,
  "isClosed": false,
  "relationship": {
    "type": "parent",
    "data": {
      "childAddresses": [
        "0x010461c14e146ac35fe42271bdc1134ee31c703a",
        "0x2e3d94f0562703b25c83308a05046ddaf9a8dd14",
        "0x31ca8395cf837de08b24da3f660e77761dfb974b"
      ]
    }
  },
  "allowDeposits": true,
  "alwaysCloseOnWithdraw": false
}  
```

{% endtab %}
{% endtabs %}

## Retrieve a user's vault deposits

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                   | Type   | Description                                                                                  |
| -------------------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| type<mark style="color:red;">\*</mark> | String | "userVaultEquities"                                                                          |
| user<mark style="color:red;">\*</mark> | String | Address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000. |

{% tabs %}
{% tab title="200: OK" %}

```json
[
  {
    "vaultAddress": "0xdfc24b077bc1425ad1dea75bcb6f8158e10df303",
    "equity": "742500.082809",
  }
]
```

{% endtab %}
{% endtabs %}

## Query a user's role

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                   | Type   | Description                                                                                  |
| -------------------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| type<mark style="color:red;">\*</mark> | String | "userRole"                                                                                   |
| user<mark style="color:red;">\*</mark> | String | Address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000. |

{% tabs %}
{% tab title="User" %}

```
{"role":"user"} # "missing", "user", "agent", "vault", or "subAccount"
```

{% endtab %}

{% tab title="Agent" %}

```
{"role":"agent", "data": {"user": "0x..."}}
```

{% endtab %}

{% tab title="Vault" %}

```
{"role":"vault"}
```

{% endtab %}

{% tab title="Subaccount" %}

```
{"role":"subAccount", "data":{"master":"0x..."}}
```

{% endtab %}

{% tab title="Missing" %}

```
{"role":"missing"}
```

{% endtab %}
{% endtabs %}

## Query a user's portfolio

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                   | Type   | Description                                                          |
| -------------------------------------- | ------ | -------------------------------------------------------------------- |
| type<mark style="color:red;">\*</mark> | String | "portfolio"                                                          |
| user<mark style="color:red;">\*</mark> | String | hexadecimal format; e.g. 0x0000000000000000000000000000000000000000. |

{% tabs %}
{% tab title="200: OK" %}

```json
[
  [
    "day",
    {
      "accountValueHistory": [
        [
          1741886630493,
          "0.0"
        ],
        [
          1741895270493,
          "0.0"
        ],
        ...
      ],
      "pnlHistory": [
        [
          1741886630493,
          "0.0"
        ],
        [
          1741895270493,
          "0.0"
        ],
        ...
      ],
      "vlm": "0.0"
    }
  ],
  ["week", { ... }],
  ["month", { ... }],
  ["allTime", { ... }],
  ["perpDay", { ... }],
  ["perpWeek", { ... }],
  ["perpMonth", { ... }],
  ["perpAllTime", { ... }]
]
```

{% endtab %}
{% endtabs %}

## Query a user's referral information

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                   | Type   | Description                                                          |
| -------------------------------------- | ------ | -------------------------------------------------------------------- |
| type<mark style="color:red;">\*</mark> | String | "referral"                                                           |
| user<mark style="color:red;">\*</mark> | String | hexadecimal format; e.g. 0x0000000000000000000000000000000000000000. |

{% tabs %}
{% tab title="200: OK" %}

```json
{
    "referredBy": {
        "referrer": "0x5ac99df645f3414876c816caa18b2d234024b487",
        "code": "TESTNET"
    },
    "cumVlm": "149428030.6628420055", // USDC Only
    "unclaimedRewards": "11.047361", // USDC Only
    "claimedRewards": "22.743781", // USDC Only
    "builderRewards": "0.027802", // USDC Only
    "tokenToState":[
      0,
      {
         "cumVlm":"149428030.6628420055",
         "unclaimedRewards":"11.047361",
         "claimedRewards":"22.743781",
         "builderRewards":"0.027802"
      }
   ],
    "referrerState": {
        "stage": "ready",
        "data": {
            "code": "TEST",
            "referralStates": [
                {
                    "cumVlm": "960652.017122",
                    "cumRewardedFeesSinceReferred": "196.838825",
                    "cumFeesRewardedToReferrer": "19.683748",
                    "timeJoined": 1679425029416,
                    "user": "0x11af2b93dcb3568b7bf2b6bd6182d260a9495728"
                },
                {
                    "cumVlm": "438278.672653",
                    "cumRewardedFeesSinceReferred": "97.628107",
                    "cumFeesRewardedToReferrer": "9.762562",
                    "timeJoined": 1679423947882,
                    "user": "0x3f69d170055913103a034a418953b8695e4e42fa"
                }
            ]
        }
    },
    "rewardHistory": []
}
```

{% endtab %}
{% endtabs %}

Note that rewardHistory is for legacy rewards. Claimed rewards are now returned in nonFundingLedgerUpdate

## Query a user's fees

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                   | Type   | Description                                                          |
| -------------------------------------- | ------ | -------------------------------------------------------------------- |
| type<mark style="color:red;">\*</mark> | String | "userFees"                                                           |
| user<mark style="color:red;">\*</mark> | String | hexadecimal format; e.g. 0x0000000000000000000000000000000000000000. |

{% tabs %}
{% tab title="200: OK" %}

```json
{
  "dailyUserVlm": [
    {
      "date": "2025-05-23",
      "userCross": "0.0",
      "userAdd": "0.0",
      "exchange": "2852367.0770729999"
    },
    ...
  ],
  "feeSchedule": {
    "cross": "0.00045",
    "add": "0.00015",
    "spotCross": "0.0007",
    "spotAdd": "0.0004",
    "tiers": {
      "vip": [
        {
          "ntlCutoff": "5000000.0",
          "cross": "0.0004",
          "add": "0.00012",
          "spotCross": "0.0006",
          "spotAdd": "0.0003"
        },
        ...
      ],
      "mm": [
        {
          "makerFractionCutoff": "0.005",
          "add": "-0.00001"
        },
        ...
      ]
    },
    "referralDiscount": "0.04",
    "stakingDiscountTiers": [
      {
        "bpsOfMaxSupply": "0.0",
        "discount": "0.0"
      },
      {
        "bpsOfMaxSupply": "0.0001",
        "discount": "0.05"
      },
      ...
    ]
  },
  "userCrossRate": "0.000315",
  "userAddRate": "0.000105",
  "userSpotCrossRate": "0.00049",
  "userSpotAddRate": "0.00028",
  "activeReferralDiscount": "0.0",
  "trial": null,
  "feeTrialReward": "0.0",
  "nextTrialAvailableTimestamp": null,
  "stakingLink": {
    "type": "tradingUser",
    "stakingUser": "0x54c049d9c7d3c92c2462bf3d28e083f3d6805061"
  },
  "activeStakingDiscount": {
    "bpsOfMaxSupply": "4.7577998927",
    "discount": "0.3"
  }
}
```

{% endtab %}
{% endtabs %}

## Query a user's staking delegations

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                   | Type   | Description                                                          |
| -------------------------------------- | ------ | -------------------------------------------------------------------- |
| type<mark style="color:red;">\*</mark> | String | "delegations"                                                        |
| user<mark style="color:red;">\*</mark> | String | hexadecimal format; e.g. 0x0000000000000000000000000000000000000000. |

{% tabs %}
{% tab title="200: OK" %}

```json
[
    {
        "validator":"0x5ac99df645f3414876c816caa18b2d234024b487",
        "amount":"12060.16529862",
        "lockedUntilTimestamp":1735466781353
    },
    ...
]
```

{% endtab %}
{% endtabs %}

## Query a user's staking summary

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                   | Type   | Description                                                          |
| -------------------------------------- | ------ | -------------------------------------------------------------------- |
| type<mark style="color:red;">\*</mark> | String | "delegatorSummary"                                                   |
| user<mark style="color:red;">\*</mark> | String | hexadecimal format; e.g. 0x0000000000000000000000000000000000000000. |

{% tabs %}
{% tab title="200: OK" %}

```json
{
    "delegated": "12060.16529862",
    "undelegated": "0.0",
    "totalPendingWithdrawal": "0.0",
    "nPendingWithdrawals": 0
}
```

{% endtab %}
{% endtabs %}

## Query a user's staking history

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                   | Type   | Description                                                          |
| -------------------------------------- | ------ | -------------------------------------------------------------------- |
| type<mark style="color:red;">\*</mark> | String | "delegatorHistory"                                                   |
| user<mark style="color:red;">\*</mark> | String | hexadecimal format; e.g. 0x0000000000000000000000000000000000000000. |

{% tabs %}
{% tab title="200: OK" %}

```json
[
    {
        "time": 1735380381353,
        "hash": "0x55492465cb523f90815a041a226ba90147008d4b221a24ae8dc35a0dbede4ea4",
        "delta": {
            "delegate": {
                "validator": "0x5ac99df645f3414876c816caa18b2d234024b487",
                "amount": "10000.0",
                "isUndelegate": false
            }
        }
    },
    ...
]
```

{% endtab %}
{% endtabs %}

## Query a user's staking rewards

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                   | Type   | Description                                                          |
| -------------------------------------- | ------ | -------------------------------------------------------------------- |
| type<mark style="color:red;">\*</mark> | String | "delegatorRewards"                                                   |
| user<mark style="color:red;">\*</mark> | String | hexadecimal format; e.g. 0x0000000000000000000000000000000000000000. |

{% tabs %}
{% tab title="200: OK" %}

```json
[
    {
        "time": 1736726400073,
        "source": "delegation",
        "totalAmount": "0.73117184"
    },
    {
        "time": 1736726400073,
        "source": "commission",
        "totalAmount": "130.76445876"
    },
    ...
]
```

{% endtab %}
{% endtabs %}

## Query a user's HIP-3 DEX abstraction state

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                   | Type   | Description                                                          |
| -------------------------------------- | ------ | -------------------------------------------------------------------- |
| type<mark style="color:red;">\*</mark> | String | "userDexAbstraction"                                                 |
| user<mark style="color:red;">\*</mark> | String | hexadecimal format; e.g. 0x0000000000000000000000000000000000000000. |

{% tabs %}
{% tab title="200: OK" %}

```json
true
```

{% endtab %}
{% endtabs %}

## Query aligned quote token status

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                    | Type   | Description             |
| --------------------------------------- | ------ | ----------------------- |
| type<mark style="color:red;">\*</mark>  | String | "alignedQuoteTokenInfo" |
| token<mark style="color:red;">\*</mark> | Number | token index             |

{% tabs %}
{% tab title="200: OK" %}

```json
{
    "isAligned": true,
    "firstAlignedTime": 1758949452538,
    "evmMintedSupply": "0.0",
    "dailyAmountOwed": [
        [
            "2025-10-04",
            "0.0"
        ],
        [
            "2025-10-05",
            "0.0"
        ],
        ...
    ],
    "predictedRate": "0.01"
}

```

{% endtab %}
{% endtabs %}


# Perpetuals

The section documents the info endpoints that are specific to perpetuals. See Rate limits section for rate limiting logic and weights.

## Retrieve all perpetual dexs

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                   | Type   | Description |
| -------------------------------------- | ------ | ----------- |
| type<mark style="color:red;">\*</mark> | String | "perpDexs"  |

{% tabs %}
{% tab title="200: OK Successful Response" %}

```json
[
  null,
  {
    "name": "test",
    "fullName": "test dex",
    "deployer": "0x5e89b26d8d66da9888c835c9bfcc2aa51813e152",
    "oracleUpdater": null,
    "feeRecipient": null,
    "assetToStreamingOiCap": [["COIN1", "100000.0"], ["COIN2", "200000.0"]],
    "assetToFundingMultiplier": [["COIN1", "1.0"], ["COIN2", "2.0"]]
  }
]
```

{% endtab %}
{% endtabs %}

## Retrieve perpetuals metadata (universe and margin tables)

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                   | Type   | Description                                                                      |
| -------------------------------------- | ------ | -------------------------------------------------------------------------------- |
| type<mark style="color:red;">\*</mark> | String | "meta"                                                                           |
| dex                                    | String | Perp dex name. Defaults to the empty string which represents the first perp dex. |

{% tabs %}
{% tab title="200: OK Successful Response" %}

```json
{
    "universe": [
        {
            "name": "BTC",
            "szDecimals": 5,
            "maxLeverage": 50
        },
        {
            "name": "ETH",
            "szDecimals": 4,
            "maxLeverage": 50
        },
        {
            "name": "HPOS",
            "szDecimals": 0,
            "maxLeverage": 3,
            "onlyIsolated": true
        },
        {
            "name": "LOOM",
            "szDecimals": 1,
            "maxLeverage": 3,
            "isDelisted": true,
            "marginMode": "strictIsolated", // "strictIsolated" means margin cannot be removed, "noCross" means only isolated margin allowed
            "onlyIsolated": true // deprecated. Means either "strictIsolated" or "noCross"
        }
    ],
    "marginTables": [
        [
            50,
            {
                "description": "",
                "marginTiers": [
                    {
                        "lowerBound": "0.0",
                        "maxLeverage": 50
                    }
                ]
            }
        ],
        [
            51,
            {
                "description": "tiered 10x",
                "marginTiers": [
                    {
                        "lowerBound": "0.0",
                        "maxLeverage": 10
                    },
                    {
                        "lowerBound": "3000000.0",
                        "maxLeverage": 5
                    }
                ]
            }
        ]
    ]
}
```

{% endtab %}
{% endtabs %}

## Retrieve perpetuals asset contexts (includes mark price, current funding, open interest, etc.)

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                   | Type   | Description        |
| -------------------------------------- | ------ | ------------------ |
| type<mark style="color:red;">\*</mark> | String | "metaAndAssetCtxs" |

{% tabs %}
{% tab title="200: OK Successful Response" %}

```json
[
{
     "universe": [
        {
            "name": "BTC",
            "szDecimals": 5,
            "maxLeverage": 50
        },
        {
            "name": "ETH",
            "szDecimals": 4,
            "maxLeverage": 50
        },
        {
            "name": "HPOS",
            "szDecimals": 0,
            "maxLeverage": 3,
            "onlyIsolated": true
        }
    ]
},
[
    {
        "dayNtlVlm":"1169046.29406",
         "funding":"0.0000125",
         "impactPxs":[
            "14.3047",
            "14.3444"
         ],
         "markPx":"14.3161",
         "midPx":"14.314",
         "openInterest":"688.11",
         "oraclePx":"14.32",
         "premium":"0.00031774",
         "prevDayPx":"15.322"
    },
    {
         "dayNtlVlm":"1426126.295175",
         "funding":"0.0000125",
         "impactPxs":[
            "6.0386",
            "6.0562"
         ],
         "markPx":"6.0436",
         "midPx":"6.0431",
         "openInterest":"1882.55",
         "oraclePx":"6.0457",
         "premium":"0.00028119",
         "prevDayPx":"6.3611"
      },
      {
         "dayNtlVlm":"809774.565507",
         "funding":"0.0000125",
         "impactPxs":[
            "8.4505",
            "8.4722"
         ],
         "markPx":"8.4542",
         "midPx":"8.4557",
         "openInterest":"2912.05",
         "oraclePx":"8.4585",
         "premium":"0.00033694",
         "prevDayPx":"8.8097"
      }
]
]
```

{% endtab %}
{% endtabs %}

## Retrieve user's perpetuals account summary

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

See a user's open positions and margin summary for perpetuals trading

#### Headers

| Name                                           | Type | Description        |
| ---------------------------------------------- | ---- | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> |      | "application/json" |

#### Request Body

| Name                                   | Type   | Description                                                                                          |
| -------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| type<mark style="color:red;">\*</mark> | String | "clearinghouseState"                                                                                 |
| user<mark style="color:red;">\*</mark> | String | Onchain address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000. |
| dex                                    | String | Perp dex name. Defaults to the empty string which represents the first perp dex.                     |

{% tabs %}
{% tab title="200: OK Successful Response" %}

```json
{
  "assetPositions": [
    {
      "position": {
        "coin": "ETH",
        "cumFunding": {
          "allTime": "514.085417",
          "sinceChange": "0.0",
          "sinceOpen": "0.0"
        },
        "entryPx": "2986.3",
        "leverage": {
          "rawUsd": "-95.059824",
          "type": "isolated",
          "value": 20
        },
        "liquidationPx": "2866.26936529",
        "marginUsed": "4.967826",
        "maxLeverage": 50,
        "positionValue": "100.02765",
        "returnOnEquity": "-0.0026789",
        "szi": "0.0335",
        "unrealizedPnl": "-0.0134"
      },
      "type": "oneWay"
    }
  ],
  "crossMaintenanceMarginUsed": "0.0",
  "crossMarginSummary": {
    "accountValue": "13104.514502",
    "totalMarginUsed": "0.0",
    "totalNtlPos": "0.0",
    "totalRawUsd": "13104.514502"
  },
  "marginSummary": {
    "accountValue": "13109.482328",
    "totalMarginUsed": "4.967826",
    "totalNtlPos": "100.02765",
    "totalRawUsd": "13009.454678"
  },
  "time": 1708622398623,
  "withdrawable": "13104.514502"
}
```

{% endtab %}
{% endtabs %}

## Retrieve a user's funding history or non-funding ledger updates

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

Note: Non-funding ledger updates include deposits, transfers, and withdrawals.

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                                                  |
| ------------------------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| type<mark style="color:red;">\*</mark>      | String | "userFunding" or "userNonFundingLedgerUpdates"                                               |
| user<mark style="color:red;">\*</mark>      | String | Address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000. |
| startTime<mark style="color:red;">\*</mark> | int    | Start time in milliseconds, inclusive                                                        |
| endTime                                     | int    | End time in milliseconds, inclusive. Defaults to current time.                               |

{% tabs %}
{% tab title="200: OK Successful Response" %}

```json
[
    {
        "delta": {
            "coin":"ETH",
            "fundingRate":"0.0000417",
            "szi":"49.1477",
            "type":"funding",
            "usdc":"-3.625312"
        },
        "hash":"0xa166e3fa63c25663024b03f2e0da011a00307e4017465df020210d3d432e7cb8",
        "time":1681222254710
    },
    ...
]
```

{% endtab %}
{% endtabs %}

## Retrieve historical funding rates

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                    |
| ------------------------------------------- | ------ | -------------------------------------------------------------- |
| type<mark style="color:red;">\*</mark>      | String | "fundingHistory"                                               |
| coin<mark style="color:red;">\*</mark>      | String | Coin, e.g. "ETH"                                               |
| startTime<mark style="color:red;">\*</mark> | int    | Start time in milliseconds, inclusive                          |
| endTime                                     | int    | End time in milliseconds, inclusive. Defaults to current time. |

{% tabs %}
{% tab title="200: OK" %}

<pre class="language-json"><code class="lang-json">[
    {
        "coin":"ETH",
        "fundingRate": "-0.00022196",
        "premium": "-0.00052196",
        "time":1683849600076
<strong>    }
</strong>]
</code></pre>

{% endtab %}
{% endtabs %}

## Retrieve predicted funding rates for different venues

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                   | Type   | Description         |
| -------------------------------------- | ------ | ------------------- |
| type<mark style="color:red;">\*</mark> | String | "predictedFundings" |

{% tabs %}
{% tab title="200: OK Successful Response" %}

```json
[
  [
    "AVAX",
    [
      [
        "BinPerp",
        {
          "fundingRate": "0.0001",
          "nextFundingTime": 1733961600000
        }
      ],
      [
        "HlPerp",
        {
          "fundingRate": "0.0000125",
          "nextFundingTime": 1733958000000
        }
      ],
      [
        "BybitPerp",
        {
          "fundingRate": "0.0001",
          "nextFundingTime": 1733961600000
        }
      ]
    ]
  ],...
]
```

{% endtab %}
{% endtabs %}

## Query perps at open interest caps

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                   | Type   | Description              |
| -------------------------------------- | ------ | ------------------------ |
| type<mark style="color:red;">\*</mark> | String | "perpsAtOpenInterestCap" |

{% tabs %}
{% tab title="200: OK Successful Response" %}

```json
["BADGER","CANTO","FTM","LOOM","PURR"]
```

{% endtab %}
{% endtabs %}

## Retrieve information about the Perp Deploy Auction

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                   | Type   | Description               |
| -------------------------------------- | ------ | ------------------------- |
| type<mark style="color:red;">\*</mark> | String | "perpDeployAuctionStatus" |

{% tabs %}
{% tab title="200: OK Successful Response" %}

```json
{
  "startTimeSeconds": 1747656000,
  "durationSeconds": 111600,
  "startGas": "500.0",
  "currentGas": "500.0",
  "endGas": null
}
```

{% endtab %}
{% endtabs %}

## Retrieve User's Active Asset Data

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                   | Type   | Description                                                                                                                                         |
| -------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| type<mark style="color:red;">\*</mark> | String | "activeAssetData"                                                                                                                                   |
| user<mark style="color:red;">\*</mark> | String | Address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000.                                                        |
| coin<mark style="color:red;">\*</mark> | String | Coin, e.g. "ETH". See [here](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint#perpetuals-vs-spot) for more details. |

{% tabs %}
{% tab title="200: OK" %}

```json
{
  "user": "0xb65822a30bbaaa68942d6f4c43d78704faeabbbb",
  "coin": "APT",
  "leverage": {
    "type": "cross",
    "value": 3
  },
  "maxTradeSzs": ["24836370.4400000013", "24836370.4400000013"],
  "availableToTrade": ["37019438.0284740031", "37019438.0284740031"],
  "markPx": "4.4716"
}
```

{% endtab %}
{% endtabs %}

## Retrieve Builder-Deployed Perp Market Limits

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                   | Type   | Description                                                                    |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------ |
| type<mark style="color:red;">\*</mark> | String | "perpDexLimits"                                                                |
| dex<mark style="color:red;">\*</mark>  | String | Perp dex name of builder-deployed dex market. The empty string is not allowed. |

{% tabs %}
{% tab title="200: OK" %}

```json
{
  "totalOiCap": "10000000.0",
  "oiSzCapPerPerp": "10000000000.0",
  "maxTransferNtl": "100000000.0",
  "coinToOiCap": [["COIN1", "100000.0"], ["COIN2", "200000.0"]],
}
```

{% endtab %}
{% endtabs %}

## Get Perp Market Status

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                   | Type   | Description                                                                                   |
| -------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| type<mark style="color:red;">\*</mark> | String | "perpDexStatus"                                                                               |
| dex<mark style="color:red;">\*</mark>  | String | Perp dex name of builder-deployed dex market. The empty string represents the first perp dex. |

{% tabs %}
{% tab title="200: OK" %}

```json
{
  "totalNetDeposit": "4103492112.4478230476"
}
```

{% endtab %}
{% endtabs %}


# Spot

The section documents the info endpoints that are specific to spot.

## Retrieve spot metadata

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

**Headers**

| Name                                           | Value              |
| ---------------------------------------------- | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | "application/json" |

**Body**

| Name                                   | Type   | Description |
| -------------------------------------- | ------ | ----------- |
| type<mark style="color:red;">\*</mark> | String | "spotMeta"  |

**Response**

{% tabs %}
{% tab title="200: OK Successful Response" %}

```json
{
    "tokens": [
        {
            "name": "USDC",
            "szDecimals": 8,
            "weiDecimals" 8,
            "index": 0,
            "tokenId": "0x6d1e7cde53ba9467b783cb7c530ce054",
            "isCanonical": true,
            "evmContract":null,
            "fullName":null
        },
        {
            "name": "PURR",
            "szDecimals": 0,
            "weiDecimals": 5,
            "index": 1,
            "tokenId": "0xc1fb593aeffbeb02f85e0308e9956a90",
            "isCanonical": true,
            "evmContract":null,
            "fullName":null
        },
        {
            "name": "HFUN",
            "szDecimals": 2,
            "weiDecimals": 8,
            "index": 2,
            "tokenId": "0xbaf265ef389da684513d98d68edf4eae",
            "isCanonical": false,
            "evmContract":null,
            "fullName":null
        },
    ],
    "universe": [
        {
            "name": "PURR/USDC",
            "tokens": [1, 0],
            "index": 0,
            "isCanonical": true
        },
        {
            "tokens": [2, 0],
            "name": "@1",
            "index": 1,
            "isCanonical": false
        },
    ]
}
```

{% endtab %}
{% endtabs %}

## Retrieve spot asset contexts

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                   | Type   | Description            |
| -------------------------------------- | ------ | ---------------------- |
| type<mark style="color:red;">\*</mark> | String | "spotMetaAndAssetCtxs" |

{% tabs %}
{% tab title="200: OK Successful Response" %}

```json
[
{
    "tokens": [
        {
            "name": "USDC",
            "szDecimals": 8,
            "weiDecimals" 8,
            "index": 0,
            "tokenId": "0x6d1e7cde53ba9467b783cb7c530ce054",
            "isCanonical": true,
            "evmContract":null,
            "fullName":null
        },
        {
            "name": "PURR",
            "szDecimals": 0,
            "weiDecimals": 5,
            "index": 1,
            "tokenId": "0xc1fb593aeffbeb02f85e0308e9956a90",
            "isCanonical": true,
            "evmContract":null,
            "fullName":null
        }
    ],
    "universe": [
        {
            "name": "PURR/USDC",
            "tokens": [1, 0],
            "index": 0,
            "isCanonical": true
        }
    ]
},
[
    {
        "dayNtlVlm":"8906.0",
        "markPx":"0.14",
        "midPx":"0.209265",
        "prevDayPx":"0.20432"
    }
]
]
```

{% endtab %}
{% endtabs %}

## Retrieve a user's token balances

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

See a user's token balances

#### Headers

| Name                                           | Type | Description        |
| ---------------------------------------------- | ---- | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> |      | "application/json" |

#### Request Body

| Name                                   | Type   | Description                                                                                          |
| -------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| type<mark style="color:red;">\*</mark> | String | "spotClearinghouseState"                                                                             |
| user<mark style="color:red;">\*</mark> | String | Onchain address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000. |

{% tabs %}
{% tab title="200: OK Successful Response" %}

```json
{
    "balances": [
        {
            "coin": "USDC",
            "token": 0,
            "hold": "0.0",
            "total": "14.625485",
            "entryNtl": "0.0"
        },
        {
            "coin": "PURR",
            "token": 1,
            "hold": "0",
            "total": "2000",
            "entryNtl": "1234.56",
        }
    ]
}
```

{% endtab %}
{% endtabs %}

## Retrieve information about the Spot Deploy Auction

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

**Headers**

| Name                                           | Value              |
| ---------------------------------------------- | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | "application/json" |

**Body**

| Name                                   | Type   | Description                                                                                          |
| -------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| type<mark style="color:red;">\*</mark> | String | "spotDeployState"                                                                                    |
| user<mark style="color:red;">\*</mark> | String | Onchain address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000. |

**Response**

{% tabs %}
{% tab title="200: OK Successful Response" %}

```json
{
  "states": [
    {
      "token": 150,
      "spec" : {
        "name": "HYPE",
        "szDecimals": 2,
        "weiDecimals": 8,
      },
      "fullName": "Hyperliquid",
      "spots": [107],
      "maxSupply": 1000000000,
      "hyperliquidityGenesisBalance": "120000",
      "totalGenesisBalanceWei": "100000000000000000",
      "userGenesisBalances": [
        ("0xdddddddddddddddddddddddddddddddddddddddd", "428,062,211")...
      ],
      "existingTokenGenesisBalances": [
        (1, "0")...
      ]
    }
  ],
  "gasAuction": {
    "startTimeSeconds": 1733929200,
    "durationSeconds": 111600,
    "startGas": "181305.90046",
    "currentGas": null,
    "endGas": "181291.247358"
  }
}
```

{% endtab %}
{% endtabs %}

## Retrieve information about the Spot Pair Deploy Auction

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

Note: This returns the status of the Dutch auction for spot pair deployments between existing base and quote tokens. Participation in this auction is permissionless through the same action as the `registerSpot` phase of base token deployment.

#### Headers

| Name                                           | Value              |
| ---------------------------------------------- | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | "application/json" |

#### Body

| Name                                   | Type   | Description                   |
| -------------------------------------- | ------ | ----------------------------- |
| type<mark style="color:red;">\*</mark> | String | "spotPairDeployAuctionStatus" |

{% tabs %}
{% tab title="200: OK Successful Response" %}

```json
{
  "startTimeSeconds":1755468000,
  "durationSeconds":111600,
  "startGas":"500.0",
  "currentGas":"500.0",
  "endGas":null
}
```

{% endtab %}
{% endtabs %}

## Retrieve information about a token

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/info`

**Headers**

| Name                                           | Value              |
| ---------------------------------------------- | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | "application/json" |

**Body**

| Name                                      | Type   | Description                                                                             |
| ----------------------------------------- | ------ | --------------------------------------------------------------------------------------- |
| type<mark style="color:red;">\*</mark>    | String | "tokenDetails"                                                                          |
| tokenId<mark style="color:red;">\*</mark> | String | Onchain id in 34-character hexadecimal format; e.g. 0x00000000000000000000000000000000. |

**Response**

{% tabs %}
{% tab title="200: OK Successful Response" %}

```json
{
  "name": "TEST",
  "maxSupply": "1852229076.12716007",
  "totalSupply": "851681534.05516005",
  "circulatingSupply": "851681534.05516005",
  "szDecimals": 0,
  "weiDecimals": 5,
  "midPx": "3.2049",
  "markPx": "3.2025",
  "prevDayPx": "3.2025",
  "genesis": {
    "userBalances": [
      [
        "0x0000000000000000000000000000000000000001",
        "1000000000.0"
      ],
      [
        "0xffffffffffffffffffffffffffffffffffffffff",
        "1000000000.0"
      ]
    ],
    "existingTokenBalances": []
  },
  "deployer": "0x0000000000000000000000000000000000000001",
  "deployGas": "100.0",
  "deployTime": "2024-06-05T10:50:59.434",
  "seededUsdc": "0.0",
  "nonCirculatingUserBalances": [],
  "futureEmissions": "0.0"
}
```

{% endtab %}
{% endtabs %}


# Exchange endpoint

The exchange endpoint is used to interact with and trade on the Hyperliquid chain. See the Python SDK for code to generate signatures for these requests.

### Asset

Many of the requests take asset as an input. For perpetuals this is the index in the `universe` field returned by the`meta` response. For spot assets, use `10000 + index` where `index` is the corresponding index in `spotMeta.universe`. For example, when submitting an order for `PURR/USDC`, the asset that should be used is `10000` because its asset index in the spot metadata is `0`.

### Subaccounts and vaults

Subaccounts and vaults do not have private keys. To perform actions on behalf of a subaccount or vault signing should be done by the master account and the vaultAddress field should be set to the address of the subaccount or vault. The basic\_vault.py example in the Python SDK demonstrates this.

### Expires After

Some actions support an optional field `expiresAfter` which is a timestamp in milliseconds after which the action will be rejected. User-signed actions such as Core USDC transfer do not support the `expiresAfter` field. Note that actions consume 5x the usual address-based rate limit when canceled due to a stale `expiresAfter` field.&#x20;

See the Python SDK for details on how to incorporate this field when signing.&#x20;

## Place an order

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

See Python SDK for full featured examples on the fields of the order request.

For limit orders, TIF (time-in-force) sets the behavior of the order upon first hitting the book.

ALO (add liquidity only, i.e. "post only") will be canceled instead of immediately matching.

IOC (immediate or cancel) will have the unfilled part canceled instead of resting.

GTC (good til canceled) orders have no special behavior.

Client Order ID (cloid) is an optional 128 bit hex string, e.g. `0x1234567890abcdef1234567890abcdef`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                                                                                                                                                                                              |       |                                                                                                                                                      |                                                                                                       |              |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p>  "type": "order",<br>  "orders": \[{</p><p>    "a": Number,</p><p>    "b": Boolean,</p><p>    "p": String,</p><p>    "s": String,</p><p>    "r": Boolean,</p><p>    "t": {</p><p>      "limit": {</p><p>        "tif": "Alo" | "Ioc" | "Gtc" </p><p>      } or</p><p>      "trigger": {</p><p>         "isMarket": Boolean,</p><p>         "triggerPx": String,</p><p>         "tpsl": "tp" | "sl"</p><p>       }</p><p>    },</p><p>    "c": Cloid (optional)</p><p>  }],</p><p>  "grouping": "na" | "normalTpsl" | "positionTpsl",</p><p>  "builder": Optional({"b": "address", "f": Number})</p><p>}<br><br>Meaning of keys:<br>a is asset<br>b is isBuy<br>p is price<br>s is size<br>r is reduceOnly<br>t is type<br>c is cloid (client order id)<br><br>Meaning of keys in optional builder argument:<br>b is the address the should receive the additional fee<br>f is the size of the fee in tenths of a basis point e.g. if f is 10, 1bp of the order notional  will be charged to the user and sent to the builder</p> |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds                                                                                                                                                                                 |       |                                                                                                                                                      |                                                                                                       |              |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                                                                                                          |       |                                                                                                                                                      |                                                                                                       |              |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| vaultAddress                                | String | If trading on behalf of a vault or subaccount, its Onchain address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000                                                                                   |       |                                                                                                                                                      |                                                                                                       |              |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| expiresAfter                                | Number | Timestamp in milliseconds                                                                                                                                                                                                                |       |                                                                                                                                                      |                                                                                                       |              |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

{% tabs %}
{% tab title="200: OK Successful Response (resting)" %}

```
{
   "status":"ok",
   "response":{
      "type":"order",
      "data":{
         "statuses":[
            {
               "resting":{
                  "oid":77738308
               }
            }
         ]
      }
   }
}
```

{% endtab %}

{% tab title="200: OK Error Response" %}

```
{
   "status":"ok",
   "response":{
      "type":"order",
      "data":{
         "statuses":[
            {
               "error":"Order must have minimum value of $10."
            }
         ]
      }
   }
}
```

{% endtab %}

{% tab title="200: OK Successful Response (filled)" %}

```
{
   "status":"ok",
   "response":{
      "type":"order",
      "data":{
         "statuses":[
            {
               "filled":{
                  "totalSz":"0.02",
                  "avgPx":"1891.4",
                  "oid":77747314
               }
            }
         ]
      }
   }
}
```

{% endtab %}
{% endtabs %}

## Cancel order(s)

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                                                                                                                                                                      |
| ------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p>  "type": "cancel",</p><p>  "cancels": \[</p><p>    {</p><p>      "a": Number,</p><p>      "o": Number</p><p>    }</p><p>  ]</p><p>}<br><br>Meaning of keys:<br>a is asset<br>o is oid (order id)</p> |
|                                             |        |                                                                                                                                                                                                                  |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds                                                                                                                                                         |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                                                                                  |
| vaultAddress                                | String | If trading on behalf of a vault or subaccount, its address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000                                                                   |
| expiresAfter                                | Number | Timestamp in milliseconds                                                                                                                                                                                        |

{% tabs %}
{% tab title="200: OK Successful Response" %}

```
{
   "status":"ok",
   "response":{
      "type":"cancel",
      "data":{
         "statuses":[
            "success"
         ]
      }
   }
}
```

{% endtab %}

{% tab title="200: OK Error Response" %}

```
{
   "status":"ok",
   "response":{
      "type":"cancel",
      "data":{
         "statuses":[
            {
               "error":"Order was never placed, already canceled, or filled."
            }
         ]
      }
   }
}
```

{% endtab %}
{% endtabs %}

## Cancel order(s) by cloid

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`&#x20;

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                                                                                                                        |
| ------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p>  "type": "cancelByCloid",</p><p>  "cancels": \[</p><p>    {</p><p>      "asset": Number,</p><p>      "cloid": String</p><p>    }</p><p>  ]</p><p>}</p> |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds                                                                                                           |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                                    |
| vaultAddress                                | String | If trading on behalf of a vault or subaccount, its address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000                     |
| expiresAfter                                | Number | Timestamp in milliseconds                                                                                                                                          |

{% tabs %}
{% tab title="200: OK Successful Response" %}

{% endtab %}

{% tab title="200: OK Error Response" %}

{% endtab %}
{% endtabs %}

## Schedule cancel (dead man's switch)

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`&#x20;

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                                                                                                    |
| ------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p>  "type": "scheduleCancel",</p><p>  "time": number (optional)</p><p>}</p>                                                           |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds                                                                                       |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                |
| vaultAddress                                | String | If trading on behalf of a vault or subaccount, its address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000 |
| expiresAfter                                | Number | Timestamp in milliseconds                                                                                                                      |

Schedule a cancel-all operation at a future time. Not including time will remove the scheduled cancel operation. The time must be at least 5 seconds after the current time. Once the time comes, all open orders will be canceled and a trigger count will be incremented. The max number of triggers per day is 10. This trigger count is reset at 00:00 UTC.

## Modify an order

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange` &#x20;

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                                                                                                            |                                                                                                                                                                                                                   |       |                                                                                                                                                      |                                                                                                                                                                                                                                       |
| ------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p>  "type": "modify",</p><p>  "oid": Number                                                                                                   | Cloid,</p><p>  "order": {</p><p>    "a": Number,</p><p>    "b": Boolean,</p><p>    "p": String,</p><p>    "s": String,</p><p>    "r": Boolean,</p><p>    "t": {</p><p>      "limit": {</p><p>        "tif": "Alo" | "Ioc" | "Gtc" </p><p>      } or</p><p>      "trigger": {</p><p>         "isMarket": Boolean,</p><p>         "triggerPx": String,</p><p>         "tpsl": "tp" | "sl"</p><p>       }</p><p>    },</p><p>    "c": Cloid (optional)</p><p>  }</p><p>}<br><br>Meaning of keys:<br>a is asset<br>b is isBuy<br>p is price<br>s is size<br>r is reduceOnly<br>t is type<br>c is cloid (client order id)</p> |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds                                                                                               |                                                                                                                                                                                                                   |       |                                                                                                                                                      |                                                                                                                                                                                                                                       |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                        |                                                                                                                                                                                                                   |       |                                                                                                                                                      |                                                                                                                                                                                                                                       |
| vaultAddress                                | String | If trading on behalf of a vault or subaccount, its Onchain address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000 |                                                                                                                                                                                                                   |       |                                                                                                                                                      |                                                                                                                                                                                                                                       |
| expiresAfter                                | Number | Timestamp in milliseconds                                                                                                                              |                                                                                                                                                                                                                   |       |                                                                                                                                                      |                                                                                                                                                                                                                                       |

{% tabs %}
{% tab title="200: OK Successful Response" %}

{% endtab %}

{% tab title="200: OK Error Response" %}

{% endtab %}
{% endtabs %}

## Modify multiple orders

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                                                                                                            |                                                                                                                                                                                                                                     |       |                                                                                                                                                                |                                                                                                                                                                                                                                                          |
| ------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p>  "type": "batchModify",</p><p>  "modifies": \[{</p><p>    "oid": Number                                                                    | Cloid,</p><p>    "order": {</p><p>      "a": Number,</p><p>      "b": Boolean,</p><p>      "p": String,</p><p>      "s": String,</p><p>      "r": Boolean,</p><p>      "t": {</p><p>        "limit": {</p><p>          "tif": "Alo" | "Ioc" | "Gtc" </p><p>        } or</p><p>        "trigger": {</p><p>           "isMarket": Boolean,</p><p>           "triggerPx": String,</p><p>           "tpsl": "tp" | "sl"</p><p>         }</p><p>      },</p><p>      "c": Cloid (optional)</p><p>    }</p><p>  }]</p><p>}<br><br>Meaning of keys:<br>a is asset<br>b is isBuy<br>p is price<br>s is size<br>r is reduceOnly<br>t is type<br>c is cloid (client order id)</p> |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds                                                                                               |                                                                                                                                                                                                                                     |       |                                                                                                                                                                |                                                                                                                                                                                                                                                          |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                        |                                                                                                                                                                                                                                     |       |                                                                                                                                                                |                                                                                                                                                                                                                                                          |
| vaultAddress                                | String | If trading on behalf of a vault or subaccount, its Onchain address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000 |                                                                                                                                                                                                                                     |       |                                                                                                                                                                |                                                                                                                                                                                                                                                          |
| expiresAfter                                | Number | Timestamp in milliseconds                                                                                                                              |                                                                                                                                                                                                                                     |       |                                                                                                                                                                |                                                                                                                                                                                                                                                          |

## Update leverage

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

Update cross or isolated leverage on a coin.&#x20;

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                                                                                                                                                                                                         |
| ------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p>  "type": "updateLeverage",</p><p>  "asset": index of coin,</p><p>  "isCross": true or false if updating cross-leverage,</p><p>  "leverage": integer representing new leverage, subject to leverage constraints on that coin</p><p>}</p> |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds                                                                                                                                                                                            |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                                                                                                                     |
| vaultAddress                                | String | If trading on behalf of a vault or subaccount, its Onchain address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000                                                                                              |
| expiresAfter                                | Number | Timestamp in milliseconds                                                                                                                                                                                                                           |

{% tabs %}
{% tab title="200: OK Successful response" %}

```
{'status': 'ok', 'response': {'type': 'default'}}
```

{% endtab %}
{% endtabs %}

## Update isolated margin

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

Add or remove margin from isolated position

Note that to target a specific leverage instead of a USDC value of margin change, there is an alternate action `{"type": "topUpIsolatedOnlyMargin", "asset": <asset>, "leverage": <float string>}`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                                                                                                                                                                                                                                             |
| ------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p>  "type": "updateIsolatedMargin",</p><p>  "asset": index of coin,</p><p>  "isBuy": true, (this parameter won't have any effect until hedge mode is introduced)</p><p>  "ntli": int representing amount to add or remove with 6 decimals, e.g. 1000000 for 1 usd,</p><p>}</p> |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds                                                                                                                                                                                                                                |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                                                                                                                                                         |
| vaultAddress                                | String | If trading on behalf of a vault or subaccount, its Onchain address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000                                                                                                                                  |
| expiresAfter                                | Number | Timestamp in milliseconds                                                                                                                                                                                                                                                               |

{% tabs %}
{% tab title="200: OK Successful response" %}

```
{'status': 'ok', 'response': {'type': 'default'}}
```

{% endtab %}
{% endtabs %}

## Core USDC transfer

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

Send usd to another address. This transfer does not touch the EVM bridge. The signature format is human readable for wallet interfaces.

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p>  "type": "usdSend",</p><p>  "hyperliquidChain": "Mainnet" (on testnet use "Testnet" instead),<br>  "signatureChainId": the id of the chain used when signing in hexadecimal format; e.g. "0xa4b1" for Arbitrum,</p><p>  "destination": address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000,</p><p>   "amount": amount of usd to send as a string, e.g. "1" for 1 usd,</p><p>     "time": current timestamp in milliseconds as a Number, should match nonce</p><p>}</p> |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

{% tabs %}
{% tab title="200: OK Successful Response" %}

```
{'status': 'ok', 'response': {'type': 'default'}}
```

{% endtab %}
{% endtabs %}

## Core spot transfer

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

Send spot assets to another address. This transfer does not touch the EVM bridge. The signature format is human readable for wallet interfaces.

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p>  "type": "spotSend",</p><p>  "hyperliquidChain": "Mainnet" (on testnet use "Testnet" instead),<br>  "signatureChainId": the id of the chain used when signing in hexadecimal format; e.g. "0xa4b1" for Arbitrum,</p><p>  "destination": address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000,<br>  "token": tokenName:tokenId; e.g. "PURR:0xc4bf3f870c0e9465323c0b6ed28096c2",</p><p>   "amount": amount of token to send as a string, e.g. "0.01",</p><p>     "time": current timestamp in milliseconds as a Number, should match nonce</p><p>}</p> |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

{% tabs %}
{% tab title="200: OK Successful Response" %}

```
{'status': 'ok', 'response': {'type': 'default'}}
```

{% endtab %}
{% endtabs %}

```
Example sign typed data for generating the signature:
{
  "types": {
    "HyperliquidTransaction:SpotSend": [
      {
        "name": "hyperliquidChain",
        "type": "string"
      },
      {
        "name": "destination",
        "type": "string"
      },
      {
        "name": "token",
        "type": "string"
      },
      {
        "name": "amount",
        "type": "string"
      },
      {
        "name": "time",
        "type": "uint64"
      }
    ]
  },
  "primaryType": "HyperliquidTransaction:SpotSend",
  "domain": {
    "name": "HyperliquidSignTransaction",
    "version": "1",
    "chainId": 42161,
    "verifyingContract": "0x0000000000000000000000000000000000000000"
  },
  "message": {
    "destination": "0x0000000000000000000000000000000000000000",
    "token": "PURR:0xc1fb593aeffbeb02f85e0308e9956a90",
    "amount": "0.1",
    "time": 1716531066415,
    "hyperliquidChain": "Mainnet"
  }
}
```

## Initiate a withdrawal request

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

This method is used to initiate the withdrawal flow. After making this request, the L1 validators will sign and send the withdrawal request to the bridge contract. There is a $1 fee for withdrawing at the time of this writing and withdrawals take approximately 5 minutes to finalize.

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{<br>  "type": "withdraw3",</p><p>  "hyperliquidChain": "Mainnet" (on testnet use "Testnet" instead),<br>  "signatureChainId": the id of the chain used when signing in hexadecimal format; e.g. "0xa4b1" for Arbitrum,</p><p>  "amount": amount of usd to send as a string, e.g. "1" for 1 usd,</p><p>  "time": current timestamp in milliseconds as a Number, should match nonce,</p><p>  "destination": address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000</p><p>}</p> |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds, must match the nonce in the action Object above                                                                                                                                                                                                                                                                                                                                                                                                             |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

{% tabs %}
{% tab title="200: OK " %}

```
{'status': 'ok', 'response': {'type': 'default'}}
```

{% endtab %}
{% endtabs %}

## Transfer from Spot account to Perp account (and vice versa)

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

This method is used to transfer USDC from the user's spot wallet to perp wallet and vice versa.

**Headers**

| Name                                           | Value              |
| ---------------------------------------------- | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | "application/json" |

**Body**

<table><thead><tr><th>Name</th><th width="200">Type</th><th>Description</th></tr></thead><tbody><tr><td>action<mark style="color:red;">*</mark></td><td>Object</td><td><p>{</p><p>  "type": "usdClassTransfer",</p><p>  "hyperliquidChain": "Mainnet" (on testnet use "Testnet" instead),<br>  "signatureChainId": the id of the chain used when signing in hexadecimal format; e.g. "0xa4b1" for Arbitrum,</p><p> "amount": amount of usd to transfer as a string, e.g. "1" for 1 usd. If you want to use this action for a subaccount, you can include subaccount: address after the amount, e.g. "1" subaccount:0x0000000000000000000000000000000000000000,</p><p>  "toPerp": true if (spot -> perp) else false,</p><p>"nonce": current timestamp in milliseconds as a Number, must match nonce in outer request body</p><p>}</p></td></tr><tr><td>nonce<mark style="color:red;">*</mark></td><td>Number</td><td>Recommended to use the current timestamp in milliseconds, must match the nonce in the action Object above</td></tr><tr><td>signature<mark style="color:red;">*</mark></td><td>Object</td><td></td></tr></tbody></table>

**Response**

{% tabs %}
{% tab title="200: OK" %}

```json
{'status': 'ok', 'response': {'type': 'default'}}
```

{% endtab %}
{% endtabs %}

## Send Asset

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

This generalized method is used to transfer tokens between different perp DEXs, spot balance, users, and/or sub-accounts. Use "" to specify the default USDC perp DEX and "spot" to specify spot. Only the collateral token can be transferred to or from a perp DEX.

#### Headers

| Name                                           | Value              |
| ---------------------------------------------- | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | `application/json` |

#### Body

| Name                                        | Type   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p>  "type": "sendAsset",</p><p>  "hyperliquidChain": "Mainnet" (on testnet use "Testnet" instead),</p><p>  "signatureChainId": the id of the chain used when signing in hexadecimal format; e.g. "0xa4b1" for Arbitrum,</p><p>  "destination": address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000,</p><p>  "sourceDex": name of perp dex to transfer from,</p><p>  "destinationDex": name of the perp dex to transfer to,</p><p>  "token": tokenName:tokenId; e.g. "PURR:0xc4bf3f870c0e9465323c0b6ed28096c2",</p><p>  "amount": amount of token to send as a string; e.g. "0.01",</p><p>  "fromSubAccount": address in 42-character hexadecimal format or empty string if not from a subaccount,</p><p>  "nonce": current timestamp in milliseconds as a Number, should match nonce</p><p>}</p> |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds, must match the nonce in the action Object above                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

#### Response

{% tabs %}
{% tab title="200: OK" %}

```
{'status': 'ok', 'response': {'type': 'default'}}
```

{% endtab %}
{% endtabs %}

## Deposit into staking

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

This method is used to transfer native token from the user's spot account into staking for delegating to validators.&#x20;

#### Headers

| Name                                           | Value              |
| ---------------------------------------------- | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | `application/json` |

#### Body

| Name                                        | Type   | Description                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p>  "type": "cDeposit",</p><p>  "hyperliquidChain": "Mainnet" (on testnet use "Testnet" instead),<br>  "signatureChainId": the id of the chain used when signing in hexadecimal format; e.g. "0xa4b1" for Arbitrum,</p><p> "wei": amount of wei to transfer as a number,</p><p>"nonce": current timestamp in milliseconds as a Number, must match nonce in outer request body</p><p>}</p> |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds, must match the nonce in the action Object above                                                                                                                                                                                                                                                                                          |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                                                                                                                                                                                                                                                                    |

#### Response

{% tabs %}
{% tab title="200: OK" %}

```json
{'status': 'ok', 'response': {'type': 'default'}}
```

{% endtab %}
{% endtabs %}

## Withdraw from staking

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

This method is used to transfer native token from staking into the user's spot account. Note that transfers from staking to spot account go through a 7 day unstaking queue.

#### Headers

| Name                                           | Value              |
| ---------------------------------------------- | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | `application/json` |

#### Body

| Name                                        | Type   | Description                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p>  "type": "cWithdraw",</p><p>  "hyperliquidChain": "Mainnet" (on testnet use "Testnet" instead),<br>  "signatureChainId": the id of the chain used when signing in hexadecimal format; e.g. "0xa4b1" for Arbitrum,</p><p> "wei": amount of wei to transfer as a number,</p><p>"nonce": current timestamp in milliseconds as a Number, must match nonce in outer request body</p><p>}</p> |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds, must match the nonce in the action Object above                                                                                                                                                                                                                                                                                           |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                                                                                                                                                                                                                                                                     |

#### Response

{% tabs %}
{% tab title="200: OK" %}

```json
{'status': 'ok', 'response': {'type': 'default'}}
```

{% endtab %}
{% endtabs %}

## Delegate or undelegate stake from validator

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

Delegate or undelegate native tokens to or from a validator. Note that delegations to a particular validator have a lockup duration of 1 day.

#### Headers

| Name                                           | Value              |
| ---------------------------------------------- | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | `application/json` |

#### Body

| Name                                        | Type   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p>  "type": "tokenDelegate",</p><p>  "hyperliquidChain": "Mainnet" (on testnet use "Testnet" instead),<br>  "signatureChainId": the id of the chain used when signing in hexadecimal format; e.g. "0xa4b1" for Arbitrum,</p><p>  "validator": address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000,<br>"isUndelegate": boolean,</p><p>"wei": number,</p><p>"nonce": current timestamp in milliseconds as a Number, must match nonce in outer request body</p><p>}</p> |
| nonce<mark style="color:red;">\*</mark>     | number | Recommended to use the current timestamp in milliseconds                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

#### Response

{% tabs %}
{% tab title="200: OK" %}

```json
{'status': 'ok', 'response': {'type': 'default'}}
```

{% endtab %}
{% endtabs %}

## Deposit or withdraw from a vault

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

Add or remove funds from a vault.

**Headers**

| Name                                           | Value              |
| ---------------------------------------------- | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | `application/json` |

**Body**

| Name                                        | Type   | Description                                                                                                                                                                                                         |
| ------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p>  "type": "vaultTransfer",</p><p>  "vaultAddress": address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000,<br>"isDeposit": boolean,</p><p>"usd": number</p><p>}</p> |
| nonce<mark style="color:red;">\*</mark>     | number | Recommended to use the current timestamp in milliseconds                                                                                                                                                            |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                                                                                     |
| expiresAfter                                | Number | Timestamp in milliseconds                                                                                                                                                                                           |

**Response**

{% tabs %}
{% tab title="200" %}

```json
{'status': 'ok', 'response': {'type': 'default'}}
```

{% endtab %}
{% endtabs %}

## Approve an API wallet

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

Approves an API Wallet (also sometimes referred to as an Agent Wallet). See [here](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets#api-wallets) for more details.

**Headers**

| Name                                           | Value              |
| ---------------------------------------------- | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | `application/json` |

**Body**

| Name                                        | Type   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{<br>  "type": "approveAgent",</p><p>  "hyperliquidChain": "Mainnet" (on testnet use "Testnet" instead),<br>  "signatureChainId": the id of the chain used when signing in hexadecimal format; e.g. "0xa4b1" for Arbitrum,</p><p>  "agentAddress": address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000,</p><p>"agentName": Optional name for the API wallet. An account can have 1 unnamed approved wallet and up to 3 named ones. And additional 2 named agents are allowed per subaccount,</p><p>  "nonce": current timestamp in milliseconds as a Number, must match nonce in outer request body</p><p>}</p> |
| nonce<mark style="color:red;">\*</mark>     | number | Recommended to use the current timestamp in milliseconds                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

**Response**

{% tabs %}
{% tab title="200" %}

```json
{'status': 'ok', 'response': {'type': 'default'}}
```

{% endtab %}
{% endtabs %}

## Approve a builder fee

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

Approve a maximum fee rate for a builder.

**Headers**

| Name                                           | Value              |
| ---------------------------------------------- | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | `application/json` |

**Body**

| Name                                        | Type   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{<br>  "type": "approveBuilderFee",</p><p>  "hyperliquidChain": "Mainnet" (on testnet use "Testnet" instead),<br>  "signatureChainId": the id of the chain used when signing in hexadecimal format; e.g. "0xa4b1" for Arbitrum,</p><p>  "maxFeeRate": the maximum allowed builder fee rate as a percent string; e.g. "0.001%",</p><p>  "builder": address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000,</p><p>  "nonce": current timestamp in milliseconds as a Number, must match nonce in outer request body</p><p>}</p> |
| nonce<mark style="color:red;">\*</mark>     | number | Recommended to use the current timestamp in milliseconds                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

**Response**

{% tabs %}
{% tab title="200" %}

```json
{'status': 'ok', 'response': {'type': 'default'}}
```

{% endtab %}
{% endtabs %}

## Place a TWAP order

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p>  "type": "twapOrder",<br>  "twap": {</p><p>    "a": Number,</p><p>    "b": Boolean,</p><p>    "s": String,</p><p>    "r": Boolean,</p><p>    "m": Number,</p><p>    "t": Boolean</p><p>  }</p><p>  }<br><br>Meaning of keys:<br>a is asset<br>b is isBuy<br>s is size<br>r is reduceOnly</p><p>m is minutes<br>t is randomize</p> |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds                                                                                                                                                                                                                                                                                      |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                                                                                                                                                                                                               |
| vaultAddress                                | String | If trading on behalf of a vault or subaccount, its Onchain address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000                                                                                                                                                                                        |
| expiresAfter                                | Number | Timestamp in milliseconds                                                                                                                                                                                                                                                                                                                     |

{% tabs %}
{% tab title="200: OK Successful Response" %}

```
{
   "status":"ok",
   "response":{
      "type":"twapOrder",
      "data":{
         "status": {
            "running":{
               "twapId":77738308
            }
         }
      }
   }
}
```

{% endtab %}

{% tab title="200: OK Error Response" %}

```
{
   "status":"ok",
   "response":{
      "type":"twapOrder",
      "data":{
         "status": {
            "error":"Invalid TWAP duration: 1 min(s)"
         }
      }
   }
}
```

{% endtab %}
{% endtabs %}

## Cancel a TWAP order

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                                                                                                      |
| ------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p>  "type": "twapCancel",</p><p>   "a": Number,</p><p>   "t": Number</p><p>}<br><br>Meaning of keys:<br>a is asset<br>t is twap\_id</p> |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds                                                                                         |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                  |
| vaultAddress                                | String | If trading on behalf of a vault or subaccount, its address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000   |
| expiresAfter                                | Number | Timestamp in milliseconds                                                                                                                        |

{% tabs %}
{% tab title="200: OK Successful Response" %}

```
{
   "status":"ok",
   "response":{
      "type":"twapCancel",
      "data":{
         "status": "success"
      }
   }
}
```

{% endtab %}

{% tab title="200: OK Error Response" %}

```
{
   "status":"ok",
   "response":{
      "type":"twapCancel",
      "data":{
         "status": {
            "error": "TWAP was never placed, already canceled, or filled."
         }
      }
   }
}
```

{% endtab %}
{% endtabs %}

## Reserve Additional Actions

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`&#x20;

Instead of trading to increase the address based rate limits, this action allows reserving additional actions for 0.0005 USDC per request. The cost is paid from the Perps balance.&#x20;

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                                        |
| ------------------------------------------- | ------ | ---------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p>  "type": "reserveRequestWeight",</p><p>   "weight": Number</p><p>}</p> |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds                           |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                    |
| expiresAfter                                | Number | Timestamp in milliseconds                                                          |

{% tabs %}
{% tab title="200: OK Successful Response" %}

```
{'status': 'ok', 'response': {'type': 'default'}}
```

{% endtab %}
{% endtabs %}

## Invalidate Pending Nonce (noop)

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`&#x20;

This action does not do anything (no operation), but causes the nonce to be marked as used. This can be a more effective way to cancel in-flight orders than the cancel action.

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                              |
| ------------------------------------------- | ------ | -------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p>  "type": "noop"</p><p>}</p>                  |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds |
| signature<mark style="color:red;">\*</mark> | Object |                                                          |
| expiresAfter                                | Number | Timestamp in milliseconds                                |

{% tabs %}
{% tab title="200: OK Successful Response" %}

```
{'status': 'ok', 'response': {'type': 'default'}}
```

{% endtab %}
{% endtabs %}

## Enable HIP-3 DEX abstraction

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`&#x20;

If set, actions on HIP-3 perps will automatically transfer collateral from validator-operated USDC perps balance for HIP-3 DEXs where USDC is the collateral token, and spot otherwise. When HIP-3 DEX abstraction is active, collateral is returned to the same source (validator-operated USDC perps or spot balance) when released from positions or open orders.

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

<table><thead><tr><th width="106.30859375">Name</th><th width="159.5078125">Type</th><th>Description</th></tr></thead><tbody><tr><td>action<mark style="color:red;">*</mark></td><td>Object</td><td><p>{</p><p>  "type": "userDexAbstraction",</p><p>  "hyperliquidChain": "Mainnet" (on testnet use "Testnet" instead),</p><p>  "signatureChainId": the id of the chain used when signing in hexadecimal format; e.g. "0xa4b1" for Arbitrum,</p><p>  "user": address in 42-character hexadecimal format. Can be a sub-account of the user,</p><p>  "enabled": boolean,</p><p>  "nonce": current timestamp in milliseconds as a Number, should match nonce</p><p>}</p></td></tr><tr><td>nonce<mark style="color:red;">*</mark></td><td>Number</td><td>Recommended to use the current timestamp in milliseconds</td></tr><tr><td>signature<mark style="color:red;">*</mark></td><td>Object</td><td></td></tr></tbody></table>

{% tabs %}
{% tab title="200: OK Successful Response" %}

```
{'status': 'ok', 'response': {'type': 'default'}}
```

{% endtab %}
{% endtabs %}

## Enable HIP-3 DEX abstraction (agent)

Same effect as UserDexAbstraction above, but only works if setting the value from `null` to `true`.

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                  |
| ------------------------------------------- | ------ | ------------------------------------------------------------ |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p>  "type": "agentEnableDexAbstraction"</p><p>}</p> |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds     |
| signature<mark style="color:red;">\*</mark> | Object |                                                              |

{% tabs %}
{% tab title="200: OK Successful Response" %}

```
{'status': 'ok', 'response': {'type': 'default'}}
```

{% endtab %}
{% endtabs %}

## Validator vote on risk-free rate for aligned quote asset

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                                                                 |
| ------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p>  "type": "validatorL1Stream",</p><p>  "riskFreeRate": String // e.g. "0.04" for 4% </p><p>}</p> |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds                                                    |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                             |

{% tabs %}
{% tab title="200: OK Successful Response" %}

```
{'status': 'ok', 'response': {'type': 'default'}}
```

{% endtab %}
{% endtabs %}


# Websocket

WebSocket endpoints are available for real-time data streaming and as an alternative to HTTP request sending on the Hyperliquid exchange. The WebSocket URLs by network are:

* Mainnet: `wss://api.hyperliquid.xyz/ws`&#x20;
* Testnet: `wss://api.hyperliquid-testnet.xyz/ws`.

### Connecting

To connect to the WebSocket API, establish a WebSocket connection to the respective URL based on the desired network. Once connected, you can start sending subscription messages to receive real-time data updates.

Example from command line:

```
$ wscat -c  wss://api.hyperliquid.xyz/ws
Connected (press CTRL+C to quit)
>  { "method": "subscribe", "subscription": { "type": "trades", "coin": "SOL" } }
< {"channel":"subscriptionResponse","data":{"method":"subscribe","subscription":{"type":"trades","coin":"SOL"}}}
```

Important: all automated users should handle disconnects from the server side and gracefully reconnect. Disconnection from API servers may happen periodically and without announcement. Missed data during the reconnect will be present in the snapshot ack on reconnect. Users can also manually query any missed data using the corresponding info request.

Note: this doc uses Typescript for defining many of the message types. The python SDK also has examples [here](https://github.com/hyperliquid-dex/hyperliquid-python-sdk/blob/master/hyperliquid/utils/types.py) and example connection code [here](https://github.com/hyperliquid-dex/hyperliquid-python-sdk/blob/master/hyperliquid/websocket_manager.py).


# Subscriptions

This page describes subscribing to data streams using the WebSocket API.

### Subscription messages

To subscribe to specific data feeds, you need to send a subscription message. The subscription message format is as follows:

```json
{
  "method": "subscribe",
  "subscription": { ... }
}
```

The subscription ack provides a snapshot of previous data for time series data (e.g. user fills). These snapshot messages are tagged with `isSnapshot: true` and can be ignored if the previous messages were already processed.

The subscription object contains the details of the specific feed you want to subscribe to. Choose from the following subscription types and provide the corresponding properties:

1. `allMids`:
   * Subscription message: `{ "type": "allMids", "dex": "<dex>" }`
   * Data format: `AllMids`&#x20;
   * The `dex` field represents the perp dex to source mids from.
   * Note that the `dex` field is optional. If not provided, then the first perp dex is used. Spot mids are only included with the first perp dex.
2. `notification`:
   * Subscription message: `{ "type": "notification", "user": "<address>" }`
   * Data format: `Notification`
3. `webData3` :
   * Subscription message: `{ "type": "webData3", "user": "<address>" }`
   * Data format: `WebData3`&#x20;
4. `twapStates` :
   * Subscription message: `{ "type": "twapStates", "user": "<address>" }`
   * Data format: `TwapStates`&#x20;
5. `clearinghouseState:`
   * Subscription message: `{ "type": "clearinghouseState", "user": "<address>" }`
   * Data format: `ClearinghouseState`&#x20;
6. `openOrders`:
   * Subscription message: `{ "type": "openOrders", "user": "<address>" }`
   * Data format: `OpenOrders`&#x20;
7. `candle`:
   * Subscription message: `{ "type": "candle", "coin": "<coin_symbol>", "interval": "<candle_interval>" }`
   * &#x20;Supported intervals: "1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "8h", "12h", "1d", "3d", "1w", "1M"
   * Data format: `Candle[]`
8. `l2Book`:
   * Subscription message: `{ "type": "l2Book", "coin": "<coin_symbol>" }`
   * Optional parameters: nSigFigs: int, mantissa: int
   * Data format: `WsBook`
9. `trades`:
   * Subscription message: `{ "type": "trades", "coin": "<coin_symbol>" }`
   * Data format: `WsTrade[]`
10. `orderUpdates`:
    * Subscription message: `{ "type": "orderUpdates", "user": "<address>" }`
    * Data format: `WsOrder[]`
11. `userEvents`:&#x20;
    * Subscription message: `{ "type": "userEvents", "user": "<address>" }`
    * Data format: `WsUserEvent`
12. `userFills`:&#x20;
    * Subscription message: `{ "type": "userFills", "user": "<address>" }`
    * Optional parameter:  `aggregateByTime: bool`&#x20;
    * Data format: `WsUserFills`
13. `userFundings`:&#x20;
    * Subscription message: `{ "type": "userFundings", "user": "<address>" }`
    * Data format: `WsUserFundings`
14. `userNonFundingLedgerUpdates`:&#x20;
    * Subscription message: `{ "type": "userNonFundingLedgerUpdates", "user": "<address>" }`
    * Data format: `WsUserNonFundingLedgerUpdates`
15. `activeAssetCtx`:&#x20;
    * Subscription message: `{ "type": "activeAssetCtx", "coin": "<coin_symbol>" }`
    * Data format: `WsActiveAssetCtx` or `WsActiveSpotAssetCtx`&#x20;
16. `activeAssetData`: (only supports Perps)
    * Subscription message: `{ "type": "activeAssetData", "user": "<address>", "coin": "<coin_symbol>" }`
    * Data format: `WsActiveAssetData`
17. `userTwapSliceFills`:&#x20;
    * Subscription message: `{ "type": "userTwapSliceFills", "user": "<address>" }`
    * Data format: `WsUserTwapSliceFills`
18. `userTwapHistory`:&#x20;
    * Subscription message: `{ "type": "userTwapHistory", "user": "<address>" }`
    * Data format: `WsUserTwapHistory`
19. `bbo` :
    * Subscription message: `{ "type": "bbo", "coin": "<coin>" }`
    * Data format: `WsBbo`

### Data formats

The server will respond to successful subscriptions with a message containing the `channel` property set to `"subscriptionResponse"`, along with the `data` field providing the original subscription. The server will then start sending messages with the `channel` property set to the corresponding subscription type e.g. `"allMids"` and the `data` field providing the subscribed data.

The `data` field format depends on the subscription type:

* `AllMids`: All mid prices.
  * Format: `AllMids { mids: Record<string, string> }`
* `Notification`: A notification message.
  * Format: `Notification { notification: string }`
* `WebData2`: Aggregate information about a user, used primarily for the frontend.
  * Format: `WebData2`
* `WsTrade[]`: An array of trade updates.
  * Format: `WsTrade[]`
* `WsBook`: Order book snapshot updates.
  * Format: `WsBook { coin: string; levels: [Array<WsLevel>, Array<WsLevel>]; time: number; }`
* `WsOrder`: User order updates.
  * Format: `WsOrder[]`
* `WsUserEvent`: User events that are not order updates
  * Format: `WsUserEvent { "fills": [WsFill] | "funding": WsUserFunding | "liquidation": WsLiquidation | "nonUserCancel": [WsNonUserCancel] }`
* `WsUserFills` : Fills snapshot followed by streaming fills
* `WsUserFundings` : Funding payments snapshot followed by funding payments on the hour
* `WsUserNonFundingLedgerUpdates`: Ledger updates not including funding payments: withdrawals, deposits, transfers, and liquidations
* `WsBbo` : Bbo updates that are sent only if the bbo changes on a block

For the streaming user endpoints such as `WsUserFills`,`WsUserFundings` the first message has `isSnapshot: true` and the following streaming updates have `isSnapshot: false`.&#x20;

### Data type definitions

Here are the definitions of the data types used in the WebSocket API:

```typescript
interface WsTrade {
  coin: string;
  side: string;
  px: string;
  sz: string;
  hash: string;
  time: number;
  // tid is 50-bit hash of (buyer_oid, seller_oid). 
  // For a globally unique trade id, use (block_time, coin, tid)
  tid: number;  
  users: [string, string] // [buyer, seller]
}

// Snapshot feed, pushed on each block that is at least 0.5 since last push
interface WsBook {
  coin: string;
  levels: [Array<WsLevel>, Array<WsLevel>];
  time: number;
}

interface WsBbo {
  coin: string;
  time: number;
  bbo: [WsLevel | null, WsLevel | null];
}

interface WsLevel {
  px: string; // price
  sz: string; // size
  n: number; // number of orders
}

interface Notification {
  notification: string;
}

interface AllMids {
  mids: Record<string, string>;
}

interface Candle {
  t: number; // open millis
  T: number; // close millis
  s: string; // coin
  i: string; // interval
  o: number; // open price
  c: number; // close price
  h: number; // high price
  l: number; // low price
  v: number; // volume (base unit)
  n: number; // number of trades
}

type WsUserEvent = {"fills": WsFill[]} | {"funding": WsUserFunding} | {"liquidation": WsLiquidation} | {"nonUserCancel" :WsNonUserCancel[]};

interface WsUserFills {
  isSnapshot?: boolean;
  user: string;
  fills: Array<WsFill>;
}

interface WsFill {
  coin: string;
  px: string; // price
  sz: string; // size
  side: string;
  time: number;
  startPosition: string;
  dir: string; // used for frontend display
  closedPnl: string;
  hash: string; // L1 transaction hash
  oid: number; // order id
  crossed: boolean; // whether order crossed the spread (was taker)
  fee: string; // negative means rebate
  tid: number; // unique trade id
  liquidation?: FillLiquidation;
  feeToken: string; // the token the fee was paid in
  builderFee?: string; // amount paid to builder, also included in fee
}

interface FillLiquidation {
  liquidatedUser?: string;
  markPx: number;
  method: "market" | "backstop";
}

interface WsUserFunding {
  time: number;
  coin: string;
  usdc: string;
  szi: string;
  fundingRate: string;
}

interface WsLiquidation {
  lid: number;
  liquidator: string;
  liquidated_user: string;
  liquidated_ntl_pos: string;
  liquidated_account_value: string;
}

interface WsNonUserCancel {
  coin: String;
  oid: number;
}

interface WsOrder {
  order: WsBasicOrder;
  status: string; // See https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint#query-order-status-by-oid-or-cloid for a list of possible values
  statusTimestamp: number;
}

interface WsBasicOrder {
  coin: string;
  side: string;
  limitPx: string;
  sz: string;
  oid: number;
  timestamp: number;
  origSz: string;
  cloid: string | undefined;
}

interface WsActiveAssetCtx {
  coin: string;
  ctx: PerpsAssetCtx;
}

interface WsActiveSpotAssetCtx {
  coin: string;
  ctx: SpotAssetCtx;
}

type SharedAssetCtx = {
  dayNtlVlm: number;
  prevDayPx: number;
  markPx: number;
  midPx?: number;
};

type PerpsAssetCtx = SharedAssetCtx & {
  funding: number;
  openInterest: number;
  oraclePx: number;
};

type SpotAssetCtx = SharedAssetCtx & {
  circulatingSupply: number;
};

interface WsActiveAssetData {
  user: string;
  coin: string;
  leverage: Leverage;
  maxTradeSzs: [number, number];
  availableToTrade: [number, number];
}

interface WsTwapSliceFill {
  fill: WsFill;
  twapId: number;
}

interface WsUserTwapSliceFills {
  isSnapshot?: boolean;
  user: string;
  twapSliceFills: Array<WsTwapSliceFill>;
}

interface TwapState {
  coin: string;
  user: string;
  side: string;
  sz: number;
  executedSz: number;
  executedNtl: number;
  minutes: number;
  reduceOnly: boolean;
  randomize: boolean;
  timestamp: number;
}

type TwapStatus = "activated" | "terminated" | "finished" | "error";
interface WsTwapHistory {
  state: TwapState;
  status: {
    status: TwapStatus;
    description: string;
  };
  time: number;
}

interface WsUserTwapHistory {
  isSnapshot?: boolean;
  user: string;
  history: Array<WsTwapHistory>;
}

// Additional undocumented fields in WebData3 will be removed on a future update
interface WebData3 {
  userState: {
    agentAddress: string | null;
    agentValidUntil: number | null;
    serverTime: number;
    cumLedger: number;
    isVault: boolean;
    user: string;
    optOutOfSpotDusting?: boolean;
    dexAbstractionEnabled?: boolean;
  };
  perpDexStates: Array<PerpDexState>;
}

interface PerpDexState {
  totalVaultEquity: number;
  perpsAtOpenInterestCap?: Array<string>;
  leadingVaults?: Array<LeadingVault>;
}

interface LeadingVault {
  address: string;
  name: string;
}

interface ClearinghouseState {
  assetPositions: Array<AssetPosition>;
  marginSummary: MarginSummary;
  crossMarginSummary: MarginSummary;
  crossMaintenanceMarginUsed: number;
  withdrawable: number;
}

interface MarginSummary {
  accountValue: number;
  totalNtlPos: number;
  totalRawUsd: number;
  totalMarginUsed: number;
}

interface AssetPosition { type: "oneWay"; position: Position }

interface OpenOrders {
  dex: string;
  user: string;
  orders: Array<Order>;
}

interface TwapStates {
  dex: string;
  user: string;
  states: Array<[number, TwapState]>;
}
```

<details>

<summary>WsUserNonFundingLedgerUpdates</summary>

```typescript
interface WsUserNonFundingLedgerUpdate {
  time: number;
  hash: string;
  delta: WsLedgerUpdate;
}

type WsLedgerUpdate = 
  | WsDeposit
  | WsWithdraw 
  | WsInternalTransfer 
  | WsSubAccountTransfer 
  | WsLedgerLiquidation 
  | WsVaultDelta 
  | WsVaultWithdrawal
  | WsVaultLeaderCommission
  | WsSpotTransfer
  | WsAccountClassTransfer
  | WsSpotGenesis
  | WsRewardsClaim;
  
interface WsDeposit {
  type: "deposit";
  usdc: number;
}

interface WsWithdraw {
  type: "withdraw";
  usdc: number;
  nonce: number;
  fee: number;
}

interface WsInternalTransfer {
  type: "internalTransfer";
  usdc: number;
  user: string;
  destination: string;
  fee: number;
}

interface WsSubAccountTransfer {
  type: "subAccountTransfer";
  usdc: number;
  user: string;
  destination: string;
}

interface WsLedgerLiquidation {
  type: "liquidation";
  // NOTE: for isolated positions this is the isolated account value
  accountValue: number;
  leverageType: "Cross" | "Isolated";
  liquidatedPositions: Array<LiquidatedPosition>;
}

interface LiquidatedPosition {
  coin: string;
  szi: number;
}

interface WsVaultDelta {
  type: "vaultCreate" | "vaultDeposit" | "vaultDistribution";
  vault: string;
  usdc: number;
}

interface WsVaultWithdrawal {
  type: "vaultWithdraw";
  vault: string;
  user: string;
  requestedUsd: number;
  commission: number;
  closingCost: number;
  basis: number;
  netWithdrawnUsd: number;
}

interface WsVaultLeaderCommission {
  type: "vaultLeaderCommission";
  user: string;
  usdc: number;
}

interface WsSpotTransfer = {
  type: "spotTransfer";
  token: string;
  amount: number;
  usdcValue: number;
  user: string;
  destination: string;
  fee: number;
}

interface WsAccountClassTransfer = {
  type: "accountClassTransfer";
  usdc: number;
  toPerp: boolean;
}

interface WsSpotGenesis = {
  type: "spotGenesis";
  token: string;
  amount: number;
}

interface WsRewardsClaim = {
  type: "rewardsClaim";
  amount: number;
}
```

</details>

Please note that the above data types are in TypeScript format, and their usage corresponds to the respective subscription types.

### Examples

Here are a few examples of subscribing to different feeds using the subscription messages:

1. Subscribe to all mid prices:

   ```json
   { "method": "subscribe", "subscription": { "type": "allMids" } }
   ```
2. Subscribe to notifications for a specific user:

   ```json
   { "method": "subscribe", "subscription": { "type": "notification", "user": "<address>" } }
   ```
3. Subscribe to web data for a specific user:

   ```json
   { "method": "subscribe", "subscription": { "type": "webData", "user": "<address>" } }
   ```
4. Subscribe to candle updates for a specific coin and interval:

   ```json
   { "method": "subscribe", "subscription": { "type": "candle", "coin": "<coin_symbol>", "interval": "<candle_interval>" } }
   ```
5. Subscribe to order book updates for a specific coin:

   ```json
   { "method": "subscribe", "subscription": { "type": "l2Book", "coin": "<coin_symbol>" } }
   ```
6. Subscribe to trades for a specific coin:

   ```json
   { "method": "subscribe", "subscription": { "type": "trades", "coin": "<coin_symbol>" } }
   ```

### Unsubscribing from WebSocket feeds

To unsubscribe from a specific data feed on the Hyperliquid WebSocket API, you need to send an unsubscribe message with the following format:

```json
{
  "method": "unsubscribe",
  "subscription": { ... }
}
```

The `subscription` object should match the original subscription message that was sent when subscribing to the feed. This allows the server to identify the specific feed you want to unsubscribe from. By sending this unsubscribe message, you inform the server to stop sending further updates for the specified feed.

Please note that unsubscribing from a specific feed does not affect other subscriptions you may have active at that time. To unsubscribe from multiple feeds, you can send multiple unsubscribe messages, each with the appropriate subscription details.


# Post requests

This page describes posting requests using the WebSocket API.

### Request format

The WebSocket API supports posting requests that you can normally post through the HTTP API. These requests are either info requests or signed actions. For examples of info request payloads, please refer to the Info endpoint section. For examples of signed action payloads, please refer to the Exchange endpoint section.

To send such a payload for either type via the WebSocket API, you must wrap it as such:

```json
{
  "method": "post",
  "id": <number>,
  "request": {
    "type": "info" | "action",
    "payload": { ... }
  }
}
```

Note: The `method` and `id` fields are mandatory. It is recommended that you use a unique `id` for every post request you send in order to track outstanding requests through the channel.

Note: `explorer` requests are not supported via WebSocket.

### Response format

The server will respond to post requests with either a success or an error. For errors, a `String` is returned mirroring the HTTP status code and description that would have been returned if the request were sent through HTTP.

```json
{
  "channel": "post",
  "data": {
    "id": <number>,
    "response": {
      "type": "info" | "action" | "error",
      "payload": { ... }
    }
  }
}
```

### Examples

Here are a few examples of subscribing to different feeds using the subscription messages:

Sending an L2Book info request:

```json
{
  "method": "post",
  "id": 123,
  "request": {
    "type": "info",
    "payload": {
      "type": "l2Book",
      "coin": "ETH",
      "nSigFigs": 5,
      "mantissa": null
    }
  }
}
```

Sample response:

```json
{
  "channel": "post",
  "data": {
    "id": <number>,
    "response": {
      "type": "info",
      "payload": {
        "type": "l2Book",
        "data": {
          "coin": "ETH",
          "time": <number>,
          "levels": [
            [{"px":"3007.1","sz":"2.7954","n":1}],
            [{"px":"3040.1","sz":"3.9499","n":1}]
          ]
        }
      }
    }
  }
}
```

Sending an order signed action request:

```json
{
  "method": "post",
  "id": 256,
  "request": {
    "type": "action",
    "payload": {
      "action": {
        "type": "order",
        "orders": [{"a": 4, "b": true, "p": "1100", "s": "0.2", "r": false, "t": {"limit": {"tif": "Gtc"}}}],
        "grouping": "na"
      },
      "nonce": 1713825891591,
      "signature": {
        "r": "...",
        "s": "...",
        "v": "..."
      },
      "vaultAddress": "0x12...3"
    }
  }
}
```

Sample response:

```json
{
  "channel": "post",
  "data": {
    "id": 256,
    "response": {
      "type":"action",
      "payload": {
        "status": "ok",
        "response": {
          "type": "order",
          "data": {
            "statuses": [
              {
                "resting": {
                  "oid": 88383,
                }
              }
            ]
          }
        }
      }
    }
  }
}
```


# Timeouts and heartbeats

This page describes the measures to keep WebSocket connections alive.

The server will close any connection if it hasn't sent a message to it in the last 60 seconds. If you are subscribing to a channel that doesn't receive messages every 60 seconds, you can send heartbeat messages to keep your connection alive. The format for these messages are:

```json
{ "method": "ping" }
```

The server will respond with:

```json
{ "channel": "pong" }
```


# Error responses

Order and cancel errors are usually returned as a vector with same length as the batched request.

Below is a list of possible batched error responses:

| Error source | Error type                        | Error string                                                                       |
| ------------ | --------------------------------- | ---------------------------------------------------------------------------------- |
| Order        | Tick                              | Price must be divisible by tick size.                                              |
| Order        | MinTradeNtl                       | Order must have minimum value of $10.                                              |
| Order        | MinTradeSpotNtl                   | Order must have minimum value of 10 {quote\_token}.                                |
| Order        | PerpMargin                        | Insufficient margin to place order.                                                |
| Order        | ReduceOnly                        | Reduce only order would increase position.                                         |
| Order        | BadAloPx                          | Post only order would have immediately matched, bbo was {bbo}.                     |
| Order        | IocCancel                         | Order could not immediately match against any resting orders.                      |
| Order        | BadTriggerPx                      | Invalid TP/SL price.                                                               |
| Order        | MarketOrderNoLiquidity            | No liquidity available for market order.                                           |
| Order        | PositionIncreaseAtOpenInterestCap | Order would increase open interest while open interest is capped                   |
| Order        | PositionFlipAtOpenInterestCap     | Order would increase open interest while open interest is capped                   |
| Order        | TooAggressiveAtOpenInterestCap    | Order rejected due to price more aggressive than oracle while at open interest cap |
| Order        | OpenInterestIncrease              | Order would increase open interest too quickly                                     |
| Order        | InsufficientSpotBalance           | (Spot-only) Order has insufficient spot balance to trade                           |
| Order        | Oracle                            | Order price too far from oracle                                                    |
| Order        | PerpMaxPosition                   | Order would cause position to exceed margin tier limit at current leverage         |
| Cancel       | MissingOrder                      | Order was never placed, already canceled, or filled.                               |

Important: Some errors are a deterministic function of the payload itself, and these are instead returned earlier as part of pre-validation. In this case only one error is returned for the entire payload, as some of these errors do not apply to a specific order or cancel.

Examples include: empty batch of orders, non-reduce-only TP/SL orders, and some forms of tick size validation.&#x20;

For API users that use batching, it's recommended to handle the case where a single error is returned for a batch of multiple orders. In this case, the response could be duplicated `n`times before being sent to the callback function, as the whole batch was rejected for this same reason.

For API users that use historical orders, a list of all the cancel / reject historical order statuses can be found [here](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint#query-order-status-by-oid-or-cloid).


# Signing

It is recommended to use an existing SDK instead of manually generating signatures. There are many potential ways in which signatures can be wrong. An incorrect signature results in recovering a different signer based on the signature and payload and results in one of the following errors:\
`"L1 error: User or API Wallet 0x0123... does not exist."`\
`Must deposit before performing actions. User: 0x123...`\
where the returned address does not match the public address of the wallet you are signing with. The returned address also changes for different inputs.\
An incorrect signature does not indicate why it is incorrect which makes debugging more challenging. To debug this it is recommended to read through the Python SDK carefully and make sure the implementation matches exactly. If that doesn't work, add logging to find where the output diverges.

Some common errors:\
1\. Not realizing that there are two signing schemes (the Python SDK methods are `sign_l1_action` vs `sign_user_signed_action`).\
2\. Not realizing that the order of fields matter for msgpack.\
3\. Issues with trailing zeroes on numbers.\
4\. Issues with upper case characters in address fields. It is recommended to lowercase any address before signing and sending. Sometimes the field is parsed as bytes, causing it to be lowercased automatically across the network.\
5\. Believing that the signature must be correct because calling recover signer locally results in the correct address. The payload for recover signer is constructed based on the action and does not necessarily match.


# Rate limits and user limits

The following rate limits apply per IP address:

* REST requests share an aggregated weight limit of 1200 per minute.&#x20;
  * All documented `exchange` API requests have a weight of `1 + floor(batch_length / 40)`. For example, unbatched actions have weight `1` and a batched order request of length 79 has weight `2`. Here, `batch_length`is the length of the array in the action, e.g. the number of orders in a batched order action.
  * The following `info` requests have weight 2: `l2Book, allMids, clearinghouseState, orderStatus, spotClearinghouseState, exchangeStatus.`
  * The following `info` requests have weight 60: `userRole` .
  * All other documented `info` requests have weight 20.&#x20;
  * The following `info` endpoints have an additional rate limit weight per 20 items returned in the response: `recentTrades`, `historicalOrders`, `userFills`, `userFillsByTime`, `fundingHistory`, `userFunding`, `nonUserFundingUpdates`, `twapHistory`, `userTwapSliceFills`, `userTwapSliceFillsByTime`, `delegatorHistory`, `delegatorRewards`, `validatorStats` .
  * The `candleSnapshot` info endpoint has an additional rate limit weight per 60 items returned in the response.
  * All `explorer` API requests have a weight of 40. `blockList` has an additional rate limit of 1 per block. Note that older blocks which have not been recently queried may be weighted more heavily. For large batch requests, use the S3 bucket instead.
* Maximum of 100 websocket connections
* Maximum of 1000 websocket subscriptions
* Maximum of 10 unique users across user-specific websocket subscriptions
* Maximum of 2000 messages sent to Hyperliquid per minute across all websocket connections
* Maximum of 100 simultaneous inflight post messages across all websocket connections
* Maximum of 100 EVM JSON-RPC requests per minute for `rpc.hyperliquid.xyz/evm`. Note that other JSON-RPC providers have more sophisticated rate limiting logic and archive node functionality.&#x20;

Use websockets for lowest latency realtime data. See the python SDK for a full-featured example.

### Address-based limits

Address-based limits apply per user, with sub-accounts treated as separate users.

The rate limiting logic allows 1 request per 1 USDC traded cumulatively since address inception. For example, with an order value of 100 USDC, this requires a fill rate of 1%. Each address starts with an initial buffer of 10000 requests. When rate limited, an address is allowed one request every 10 seconds. Cancels have cumulative limit `min(limit + 100000, limit * 2)` where `limit` is the default limit for other actions. This way, hitting the address-based rate limit still allows open orders to be canceled. Note that this rate limit only applies to actions, not info requests.&#x20;

Each user has a default open order limit of 1000 plus one additional order for every 5M USDC of volume, capped at a total of 5000 open orders. When an order is placed with at least 1000 other open orders by the same user, it will be rejected if it is reduce-only or a trigger order.&#x20;

During high congestion, addresses are limited to use 2x their maker share percentage of the block space. During high traffic, it can therefore be helpful to not resend cancels whose results have already been returned via the API.&#x20;

### Batched Requests

A batched request with `n` orders (or cancels) is treated as one request for IP based rate limiting, but as `n` requests for address-based rate limiting. &#x20;


# Activation gas fee

New HyperCore accounts require 1 quote token (e.g., 1 USDC, 1 USDT, or 1 USDH) of fees for the first transaction which has the new account as destination address. This applies regardless of the asset being transfered to the new account.&#x20;

Unactivated accounts cannot send CoreWriter actions. Contract deployers who do not want this one-time behavior could manually send an activation transaction to the EVM contract address on HyperCore.&#x20;


# Optimizing latency

The following optimizations may help latency-sensitive traders:

1. Run a non-validating node against a reliable peer, such as Hyper Foundation non-validator.&#x20;
2. Run node with `--disable-output-file-buffering` to get outputs as soon as blocks are executed
3. Run node with sufficient machines specs, at least 32 logical cores and 500 MB/s disk throughput. Increasing cores can reduce latency because blocks will be faster to execute.
4. Construct book and other exchange state locally using outputs from node, which has faster and more granular data than the API. See <https://github.com/hyperliquid-dex/order_book_server> for an example on how to build an order book on the same machine that is running a node.
5. `--batch-by-block` on the node will wait until the end of the block to write the data. The example order book server above uses this to simplify logic, but a further optimization could include turning the flag off and inferring block boundaries otherwise.
6. Consider canceling pending orders by invalidating the nonce instead of spamming the cancelation action. This will save on user rate limits and have a guaranteed success rate if the nonce invalidation transaction lands first. A cheap transaction to use for nonce invalidation is `noop` with no additional fields.


# Bridge2

### General Information

The bridge between Hyperliquid and Arbitrum: <https://arbiscan.io/address/0x2df1c51e09aecf9cacb7bc98cb1742757f163df7>

The bridge code: <https://github.com/hyperliquid-dex/contracts/blob/master/Bridge2.sol>

### Deposit

The deposit flow for the bridge is simple. The user sends native USDC to the bridge, and it is credited to the account that sent it in less than 1 minute. The minimum deposit amount is 5 USDC. If you send an amount less than this, it will not be credited and be lost forever.&#x20;

### Withdraw

The withdrawal flow requires a user wallet signature on Hyperliquid only, and no Arbitrum transaction. The withdrawal from Arbitrum is handled entirely by validators, and the funds arrive in the user wallet in 3-4 minutes. This payload for signTypedData is

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[serde(deny_unknown_fields)]
pub(crate) struct WithdrawAction3 {
    pub(crate) signature_chain_id: U256,
    pub(crate) hyperliquid_chain: Chain,
    pub(crate) destination: String,
    pub(crate) amount: String,
    pub(crate) time: u64,
}

impl Eip712 for WithdrawAction3 {
    type Error = Eip712Error;

    fn domain(&self) -> StdResult<EIP712Domain, Self::Error> {
        Ok(eip_712_domain(self.signature_chain_id))
    }

    fn type_hash() -> StdResult<[u8; 32], Self::Error> {
        Ok(eip712::make_type_hash(
            format!("{HYPERLIQUID_EIP_PREFIX}Withdraw"),
            &[
                ("hyperliquidChain".to_string(), ParamType::String),
                ("destination".to_string(), ParamType::String),
                ("amount".to_string(), ParamType::String),
                ("time".to_string(), ParamType::Uint(64)),
            ],
        ))
    }

    fn struct_hash(&self) -> StdResult<[u8; 32], Self::Error> {
        let Self { signature_chain_id: _, hyperliquid_chain, destination, amount, time } = self;
        let items = vec![
            ethers::abi::Token::Uint(Self::type_hash()?.into()),
            encode_eip712_type(hyperliquid_chain.to_string().into_token()),
            encode_eip712_type(destination.clone().into_token()),
            encode_eip712_type(amount.clone().into_token()),
            encode_eip712_type(time.into_token()),
        ];
        Ok(keccak256(encode(&items)))
    }
}
```

Example signed Hyperliquid action:

```json
{
    "action": {
        "type": "withdraw3",
        "signatureChainId": "0xa4b1",
        "hyperliquidChain": "Mainnet" or "Testnet" 
        "destination": "0x000....0",
        "amount": "12.3",
        "time": 1698693262
    },
    "nonce": 1698693262 // IMPORTANT: this must match "time",
    "signature": {"r": ..., "s": ..., "v": ... } // signedTypedData output based on Eip712 implementation above. See python sdk for equivalent python code
}
```

### Deposit with permit

The bridge supports depositing on behalf of another user via the `batchedDepositWithPermit`function. Example code for how the user can sign the PermitPayload

```typescript
const payload: PermitPayload = {
  owner, // The address of the user with funds they want to deposit
  spender, // The address of the bridge 0x2df1c51e09aecf9cacb7bc98cb1742757f163df7 on mainnet and 0x08cfc1B6b2dCF36A1480b99353A354AA8AC56f89 on testnet
  value,
  nonce,
  deadline,
};

const isMainnet = true;

const domain = {
  name: isMainnet ? "USD Coin" : "USDC2",
  version: isMainnet ? "2" : "1",
  chainId: isMainnet ? 42161 : 421614,
  verifyingContract: isMainnet ? "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" : "0x1baAbB04529D43a73232B713C0FE471f7c7334d5",
};

const permitTypes = {
  Permit: [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
};

const dataToSign = {
  domain,
  types: permitTypes,
  primaryType: "Permit",
  message: payload,
} as const;

const data = await walletClient.signTypedData(dataToSign);
const signature = splitSig(data);
```


# Deploying HIP-1 and HIP-2 assets

The API for deploying HIP-1 and HIP-2 assets is a five-step process which involves sending the first 5 variants (the last two are optional) of the enum in the order below.

```typescript
type SpotDeployAction = 
  | {
      type: "spotDeploy";
      registerToken2: RegisterToken2;
    }
  | {
      type: "spotDeploy";
      userGenesis: UserGenesis;
    }
  | {
      type: "spotDeploy";
      genesis: Genesis;
    }
  | {
      type: "spotDeploy";
      registerSpot: RegisterSpot;
    }
  | {
      type: "spotDeploy";
      registerHyperliquidity: RegisterHyperliquidity;
    }
  | {
      type: "spotDeploy";
      setDeployerTradingFeeShare: SetDeployerTradingFeeShare;
    }
  | {
      type: "spotDeploy";
      enableQuoteToken: { token: number };
    }
  | {
      type: "spotDeploy";
      enableAlignedQuoteToken: { token: number };
    };

type RegisterToken2 = {
  spec: TokenSpec;
  maxGas: number;
  fullName?: string;
}

type TokenSpec = {
  name: string,
  szDecimals: number,
  weiDecimals: number,
}

/**
 * UserGenesis can be called multiple times
 * @param token - The token involved in the genesis.
 * @param userAndWei - A list of tuples of user address and genesis amount (wei).
 * @param existingTokenAndWei - A list of tuples of existing token and total genesis amount for holders of that token (wei).
 * @param blacklistUsers - A list of tuples of users and blacklist status (True if blacklist, False to remove existing blacklisted user).
 */
type UserGenesis = {
  token: number;
  userAndWei: Array<[string, string]>;
  existingTokenAndWei: Array<[number, string]>;
  blacklistUsers?: Array<[string, boolean]>;
}

/**
 * Genesis denotes the initial creation of a token with a maximum supply.
 * @param maxSupply - Checksum ensureing all calls to UserGenesis succeeded
 * @param noHyperliquidity - Set hyperliquidity balance to 0.
 */
type Genesis = {
  token: number;
  maxSupply: string;
  noHyperliquidity?: boolean;
}

/**
 * @param tokens - [base index, quote index]
 * This is also the action used to deploy pairs between an existing base and existing quote asset.
 * Deployments between pairs of existing assets follow an independent Dutch auction. 
 * This auction's status is available from the `spotPairDeployAuctionStatus` info request.
 */
type RegisterSpot = {
  tokens: [number, number];
}

/**
 * @param spot - The spot index (different from base token index)
 * @param startPx - The starting price.
 * @param orderSz - The size of each order (float, not wei)
 * @param nOrders - The number of orders. If "noHyperliquidity" was set to True, then this must be 0.
 * @param nSeededLevels - The number of levels the deployer wishes to seed with usdc instead of tokens.
 */
type RegisterHyperliquidity = {
  spot: number;
  startPx: string;
  orderSz: string;
  nOrders: number;
  nSeededLevels?: number;
}

/**
 * This is an optional action that can be performed at any time after 
 * RegisterToken2. While the fee share defaults to 100%, this action
 * can be resent multiple times as long as the fee share is not increasing.
 * @param token - The token
 * @param share - The deployer trading fee share. Range: ["0%", "100%"]. Examples: "0.012%", "99.4%"
 */
type SetDeployerTradingFeeShare {
  token: number;
  share: string;
}

```


# HIP-3 deployer actions

The API for deploying and operating builder-deployed perpetual dexs involves the following L1 action:

```typescript
// IMPORTANT: All lists of tuples should be lexographically sorted before signing
type PerpDeployAction =
  | {
      type: "perpDeploy",
      registerAsset2: RegisterAsset2,
    }
  | {
      type: "perpDeploy",
      registerAsset: RegisterAsset,
    }
  | {
      type: "perpDeploy",
      setOracle: SetOracle,
    }
  | {
      type: "perpDeploy",
      setFundingMultipliers: SetFundingMultipliers,
    }
  | {
      type: "perpDeploy",
      haltTrading: { coin: string, isHalted: boolean },
    }
  | {
      type: "perpDeploy",
      setMarginTableIds: SetMarginTableIds,
    }
  | {
      type: "perpDeploy",
      setFeeRecipient: { dex: string, feeRecipient: address },
    }  
  | {
      type: "perpDeploy",
      setOpenInterestCaps: SetOpenInterestCaps
    }
  | {
      type: "perpDeploy",
      setSubDeployers: { dex: string, subDeployers: Array<SubDeployerInput> }
    }
  | {
      type: "perpDeploy",
      setMarginModes: SetMarginModes
    }
  | {
      type: "perpDeploy",
      setFeeScale: SetFeeScale
    }
  | {
      type: "perpDeploy",
      setGrowthModes: SetGrowthModes
    };
```

```typescript
/**
 * RegisterAsset2 can be called to initialize a new dex and register an asset at the same time.
 * If schema is not provided, then RegisterAsset can be called multiple times to register additional assets
 * for the provided dex.
 * @param maxGas - Max gas in native token wei. If not provided, then uses current deploy auction price.
 * @param assetRequest - Contains new asset listing parameters. See RegisterAssetRequest2 below for details.
 * @param dex - Name of the perp dex (2-4 characters)
 * @param schema - Contains new perp dex parameters. See PerpDexSchemaInput below for details.
 */
type RegisterAsset2 = {
  maxGas?: number;
  assetRequest: RegisterAssetRequest2;
  dex: string;
  schema?: PerpDexSchemaInput;
}

// Same as RegisterAsset2 but uses RegisterAssetRequest
type RegisterAsset = {
  maxGas?: number;
  assetRequest: RegisterAssetRequest;
  dex: string;
  schema?: PerpDexSchemaInput;
}

type RegisterAssetRequest2 {
  coin: string;
  szDecimals: number;
  oraclePx: string;
  marginTableId: number;
  marginMode: "strictIsolated" | "noCross"; // strictIsolated does not allow withdrawing of isolated margin from open positions
}

type RegisterAssetRequest {
  coin: string;
  szDecimals: number;
  oraclePx: string;
  marginTableId: number;
  onlyIsolated: boolean;
}

```

```typescript
/**
 * The markPxs outer list can be length 0, 1, or 2. The median of these inputs
 * along with the local mark price (median(best bid, best ask, last trade price))
 * is used as the new mark price update.
 *
 * SetOracle can be called multiple times but there must be at least 2.5 seconds between calls.
 *
 * Stale mark prices will be updated to the local mark price after 10 seconds of no updates.
 * This fallback counts as an update for purposes of the maximal update frequency.
 * This fallback behavior should not be relied upon. Deployers are expected to call setOracle every 3 seconds even with no changes.
 *
 * All prices are clamped to 10x the start of day value.
 * markPx moves are clamped to 1% from previous markPx.
 * markPx cannot be updated such that open interest would be 10x the open interest cap.
 * @param dex - Name of the perp dex (<= 6 characters)
 * @param oraclePxs - A list (sorted by key) of asset and oracle prices.
 * @param markPxs - An outer list of inner lists (inner list sorted by key) of asset and mark prices.
 * @param externalPerpPxs - A list (sorted by key) of asset and external prices which prevent sudden mark price deviations. 
                            Ideally externally determined by deployer, but could fall back to an EMA of recent mark prices. 
                            Must include all assets.
 */
type SetOracle {
  dex: string;
  oraclePxs: Array<[string, string]>;
  markPxs: Array<Array<[string, string]>>;
  externalPerpPxs: Array<[string, string]>;
}
```

```typescript
/**
 * @param fullName - Full name of the perp dex
 * @param collateralToken - Collateral token index
 * @param oracleUpdater - User to update oracles. If not provided, then deployer is assumed to be oracle updater.
 */
type PerpDexSchemaInput {
  fullName: string;
  collateralToken: int;
  oracleUpdater?: string;
}

/**
 * A sorted list of asset and funding multiplier.
 * Multipliers must be between 0 and 10 and are used to scale the funding rate.
 */
type SetFundingMultipliers = Array<[string, string]>;

/**
 * A sorted of asset and margin table ids.
 * Margin table ids must be non-zero.
 */
type SetMarginTableIds = Array<[string, number]>;

/**
 * Inserts margin table to dex
 */
type InsertMarginTable {
  dex: string;
  marginTable: RawMarginTable;
}

/**
 * marginTiers must be sorted in order of increasing lower bound and decreasing maxLeverage
 * marginTiers has a maximum length of 3.
 */
type RawMarginTable {
  description: string;
  marginTiers: Array<RawMarginTier>;
}

/**
 * lowerBound is a position notional value above which the leverage is constrained by maxLeverage
 */
type RawMarginTier {
  lowerBound: int;
  maxLeverage: MaxLeverage;
}

/**
 * Max leverage is in the range [1, 50]
 */
type MaxLeverage = number;

/**
 * A sorted list of asset and open interest cap notionals.
 * Open interest caps must be at least the maximum of 1_000_000 (1 size unit of collateral asset) or half of the current open interest.
 */
type SetOpenInterestCaps = Array<[string, number]>;

/**
 * A modification to sub-deployer permissions 
 */
type SubDeployerInput {
  variant: string; // corresponds to a variant of PerpDeployAction. For example, "haltTrading" or "setOracle"
  user: String;
  allowed: boolean; // add or remove the subDeployer from the authorized set for the action variant
}

// A sorted list of (coin, marginMode). See RegisterAssetRequest2 for margin mode definitions.
type SetMarginModes = Array<[string, "strictIsolated" | "noCross"]>;

// Let the user normal rate be `x`. Let the user rate be `y` after accounting for aligned quote collateral.
// In other words, `x = y` for non-aligned collateral.
// User pays or receives rebate `P + D` where `P` goes to protocol and `D` goes to deployer.  
// If `x > 0` and `scale < 1`, `P = y` and `D = scale * x`
// If `x > 0` and `scale > 1`, `P = y * scale` and `D = x * scale`
// If `x < 0` and `scale < 1`, `P = y / (1 + scale)` and `D = y * scale / (1 + scale)`
// If `x < 0` and `scale > 1`, `P = y / 2` and `D = y / 2` 
// On Mainnet, rate limited to one change per 30 days.
type SetFeeScale {
  dex: string;
  scale: string; // Decimal string between "0.0" and "3.0"
}

// A list of (coin, growth_mode). The growth mode status of each coin can only be changed once every 30 days.
type SetGrowthModes = Array<[string, bool]>;
```

See <https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint/perpetuals#retrieve-information-about-the-perp-deploy-auction> for how to query for the perp deploy auction status.

### Open interest caps <a href="#open-interest-caps" id="open-interest-caps"></a>

Builder-deployed perp markets are subject to two types of open interest caps: notional (sum of absolute position size times mark price) and size (sum of absolute position sizes).

Notional open interest caps are enforced on the total open interest summed over all assets within the DEX, as well as per-asset. Perp deployers can set a custom open interest cap per asset, which is documented in <https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/hip-3-deployer-actions>.

Size-denominated open interest caps are only enforced per-asset. Size-denominated open interest caps are currently a constant 1B per asset, so a reasonable default would be to set `szDecimals` such that the minimal size increment is $1-10 at the initial mark price.


# HyperEVM

The HyperEVM consists of EVM blocks built as part of Hyperliquid's execution, inheriting all security from HyperBFT consensus. HYPE is the native gas token on the HyperEVM. To move HYPE from HyperCore to HyperEVM, send HYPE to `0x2222222222222222222222222222222222222222`. See the instructions in [Native Transfers](https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-docs/for-developers/hyperevm/hypercore-less-than-greater-than-hyperevm-transfers) for more details on how this works.

Note that there are currently no official frontend components of the EVM. Users can build their own frontends or port over existing EVM applications. All interaction with the EVM happens through the JSON-RPC. For example, users can add the chain to their wallets by entering the RPC URL and chain ID. There is currently no websocket JSON-RPC support for the RPC at `rpc.hyperliquid.xyz/evm`but other RPC implementations may support it.

The HyperEVM uses the Cancun hardfork without blobs. In particular, EIP-1559 is enabled on the HyperEVM. Base fees are burned as usual, implemented in the standard way where the burned fees are removed from the total EVM supply. Unlike most other EVM chains, priority fees are also burned because the HyperEVM uses HyperBFT consensus. The burned priority fees are sent to the zero address's EVM balance.&#x20;

On both mainnet and testnet, HYPE on the HyperEVM has 18 decimals. A few differences between testnet and mainnet HyperEVM are highlighted below:

### Mainnet

Chain ID: 999

JSON-RPC endpoint: `https://rpc.hyperliquid.xyz/evm` for mainnet&#x20;

### Testnet

Chain ID: 998&#x20;

JSON-RPC endpoint: `https://rpc.hyperliquid-testnet.xyz/evm`


# Dual-block architecture

The total HyperEVM throughput is split between small blocks produced at a fast rate and large blocks produced at a slower rate.&#x20;

The primary motivation behind the dual-block architecture is to decouple block speed and block size when allocating throughput improvements. Users want faster blocks for lower time to confirmation. Builders want larger blocks to include larger transactions such as more complex contract deployments. Instead of a forced tradeoff, the dual-block system will allow simultaneous improvement along both axes.&#x20;

The HyperEVM "mempool" is still onchain state with respect to the umbrella L1 execution, but is split into two independent mempools that source transactions for the two block types. The two block types are interleaved with a unique increasing sequence of EVM block numbers. The onchain mempool implementation accepts only the next 8 nonces for each address. Transactions older than 1 day old in the mempool are pruned.&#x20;

The initial configuration is set conservatively, and throughput is expected to increase over successive technical upgrades. Fast block duration is set to 1 seconds with a 2M gas limit. Slow block duration is set to 1 minute with a 30M gas limit.&#x20;

More precisely, in the definitions above, *block duration* of `x` means that the first L1 block for each value   of `l1_block_time % x` produces an EVM block.&#x20;

Developers can deploy larger contracts as follows:

1. Submit action `{"type": "evmUserModify", "usingBigBlocks": true}` to direct HyperEVM transactions to big blocks instead of small blocks. Note that this user state flag is set on the HyperCore user level, and must be unset again to target small blocks. Like any action, this requires an existing Core user to send. Like any EOA, the deployer address can be converted to a Core user by receiving a Core asset such as USDC.
2. Optionally use the JSON-RPC method `bigBlockGasPrice` in place of `gasPrice` to estimate base gas fee on the next big block.


# Raw HyperEVM block data

Builders running a non-validating node can index the HyperEVM using data written to `~/hl/data/evm_block_and_receipts` . This data is written after committed blocks are verified by the node, and therefore has no additional trust assumptions compared to running the EVM RPC directly from the node itself.

Builders that wish to index the HyperEVM without running a node can use the S3 bucket: `aws s3 ls s3://hl-mainnet-evm-blocks/ --request-payer requester`.&#x20;

There is a similar bucket `s3://hl-testnet-evm-blocks/` for testnet.

Builders interested in robustness can merge the two data sources, relying primarily on local data and falling back to S3 data.

Some potential applications include a JSON-RPC server with custom rate limits, a HyperEVM block explorer, or other indexed services and tooling for builders.

While the data is public for anyone to use, the requester must pay for data transfer costs. The filenames are predictably indexed by EVM block number, e.g. `s3://hl-mainnet-evm-blocks/0/6000/6123.rmp.lz4.` An indexer can copy block data from S3 on new HyperEVM blocks. The files are stored in MessagePack format and then compressed using LZ4.

Note that testnet starts with directory `s3://hl-testnet-evm-blocks/18000000`and the earlier testnet RPC blocks were not backfilled.

An example can be found in the Python SDK: <https://github.com/hyperliquid-dex/hyperliquid-python-sdk/blob/master/examples/evm_block_indexer.py>


# Interacting with HyperCore

### Read precompiles

The testnet EVM provides read precompiles that allows querying HyperCore information. The precompile addresses start at  0x0000000000000000000000000000000000000800 and have methods for querying information such as perps positions, spot balances, vault equity, staking delegations, oracle prices, and the L1 block number.

The values are guaranteed to match the latest HyperCore state at the time the EVM block is constructed.

Attached is a Solidity file `L1Read.sol` describing the read precompiles. As an example, this call queries the third perp oracle price on testnet:

```
cast call 0x0000000000000000000000000000000000000807 0x0000000000000000000000000000000000000000000000000000000000000003 --rpc-url https://rpc.hyperliquid-testnet.xyz/evm
```

To convert to floating point numbers, divide the returned price by `10^(6 - szDecimals)`for perps and `10^(8 - base asset szDecimals)` for spot.

Precompiles called on invalid inputs such as invalid assets or vault address will return an error and consume all gas passed into the precompile call frame. Precompiles have a gas cost of `2000 + 65 * (input_len + output_len)`.

### CoreWriter contract

A system contract is available at 0x3333333333333333333333333333333333333333 for sending transactions from the HyperEVM to HyperCore. It burns \~25,000 gas before emitting a log to be processed by HyperCore as an action. In practice the gas usage for a basic call will be \~47000. A solidity file `CoreWriter.sol` for the write system contract is attached.

#### Action encoding details

* Byte 1: Encoding version
  * Currently, only version `1` is supported, but enables future upgrades while maintaining backward compatibility.
* Bytes 2-4: Action ID
  * These three bytes, when decoded as a big-endian unsigned integer, represent the unique identifier for the action.
* Remaining bytes: Action encoding
  * The rest of the bytes constitue the action-specific data. It is always the raw ABI encoding of a sequence of Solidity types

To prevent any potential latency advantages for using HyperEVM to bypass the L1 mempool, order actions and vault transfers sent from CoreWriter are delayed onchain for a few seconds. This has no noticeable effect on UX because the end user has to wait for at least one small block confirmation. These onchain-delayed actions appear twice in the L1 explorer: first as an enqueuing and second as a HyperCore execution.

| Action ID | Action                                            | Fields                                                               | Solidity Type                                        | Notes                                                                                                                                                                                                     |
| --------- | ------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1         | Limit order                                       | (asset, isBuy, limitPx, sz, reduceOnly, encodedTif, cloid)           | (uint32, bool, uint64, uint64, bool, uint8, uint128) | Tif encoding: `1` for `Alo` , `2` for `Gtc` , `3` for `Ioc` . Cloid encoding: 0 means no cloid, otherwise uses the number as the cloid. limitPx and sz should be sent as 10^8 \* the human readable value |
| 2         | Vault transfer                                    | (vault, isDeposit, usd)                                              | (address, bool, uint64)                              |                                                                                                                                                                                                           |
| 3         | Token delegate                                    | (validator, wei, isUndelegate)                                       | (address, uint64, bool)                              |                                                                                                                                                                                                           |
| 4         | Staking deposit                                   | wei                                                                  | uint64                                               |                                                                                                                                                                                                           |
| 5         | Staking withdraw                                  | wei                                                                  | uint64                                               |                                                                                                                                                                                                           |
| 6         | Spot send                                         | (destination, token, wei)                                            | (address, uint64, uint64)                            |                                                                                                                                                                                                           |
| 7         | USD class transfer                                | (ntl, toPerp)                                                        | (uint64, bool)                                       |                                                                                                                                                                                                           |
| 8         | Finalize EVM Contract                             | (token, encodedFinalizeEvmContractVariant, createNonce)              | (uint64, uint8, uint64)                              | encodedFinalizeEvmContractVariant `1` for `Create`, `2` for `FirstStorageSlot` , `3` for `CustomStorageSlot` . If `Create` variant, then `createNonce` input argument is used.                            |
| 9         | Add API wallet                                    | (API wallet address, API wallet name)                                | (address, string)                                    | If the API wallet name is empty then this becomes the main API wallet / agent                                                                                                                             |
| 10        | Cancel order by oid                               | (asset, oid)                                                         | (uint32, uint64)                                     |                                                                                                                                                                                                           |
| 11        | Cancel order by cloid                             | (asset, cloid)                                                       | (uint32, uint128)                                    |                                                                                                                                                                                                           |
| 12        | Approve builder fee                               | (maxFeeRate, builder address)                                        | (uint64, address)                                    | maxFeeRate is in decibps. To approve a builder fee of 0.01% maxFreeRate should be 10.                                                                                                                     |
| 13        | Send asset                                        | (destination, subAccount, source\_dex, destination\_dex, token, wei) | (address, address, uint32, uint32, uint64, uint64)   | If subAccount is not the zero address, then transfer from subAccount. Specify uint32::MAX for the source\_dex or destination\_dex for spot.                                                               |
| 14        | Reflect EVM supply change for aligned quote token | (token, wei, is\_mint)                                               | (uint64, uint64, bool)                               | Only applicable for aligned quote token contracts.                                                                                                                                                        |

Below is an example contract that would send an action on behalf of its own contract address on HyperCore, which also demonstrates one way to construct the encoded action in Solidity.

```
contract CoreWriterCaller {
    function sendUsdClassTransfer(uint64 ntl, bool toPerp) external {
        bytes memory encodedAction = abi.encode(ntl, toPerp);
        bytes memory data = new bytes(4 + encodedAction.length);
        data[0] = 0x01;
        data[1] = 0x00;
        data[2] = 0x00;
        data[3] = 0x07;
        for (uint256 i = 0; i < encodedAction.length; i++) {
            data[4 + i] = encodedAction[i];
        }
        CoreWriter(0x3333333333333333333333333333333333333333).sendRawAction(data);
    }
}
```

\
Happy building. Any feedback is appreciated.

{% file src="<https://2356094849-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FyUdp569E6w18GdfqlGvJ%2Fuploads%2ForU71dMvRxIjHbocu4Xg%2FL1Read.sol?alt=media&token=546569cc-a2e8-429d-8f1a-1776f1e8c859>" %}

{% file src="<https://2356094849-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FyUdp569E6w18GdfqlGvJ%2Fuploads%2F0DoQSkfSDinTzGSYRoQL%2FCoreWriter.sol?alt=media&token=9454dc50-8251-49f6-891e-f5ea78afda79>" %}


# HyperCore <> HyperEVM transfers

## Introduction

Spot assets can be sent between HyperCore and the HyperEVM. In the context of these transfers, spot assets on HyperCore are called `Core spot` while ones on the EVM are called `EVM spot`. The spot deployer can link their Core spot asset to any ERC20 contract deployed to the EVM. The Core spot asset and ERC20 token can be deployed in either order.

As the native token on HyperCore, HYPE also links to the native HyperEVM balance rather than an ERC20 contract.

## System Addresses

Every token has a system address on the Core, which is the address with first byte `0x20` and the remaining bytes all zeros, except for the token index encoded in big-endian format. For example, for token index 200, the system address would be `0x20000000000000000000000000000000000000c8` .

The exception is HYPE, which has a system address of `0x2222222222222222222222222222222222222222` .

## Transferring HYPE

HYPE is a special case as the native gas token on the HyperEVM. HYPE is received on the EVM side of a transfer as the native gas token instead of an ERC20 token. To transfer back to HyperCore, HYPE can be sent as a transaction value. The EVM transfer address `0x222..2` is a system contract that emits `event Received(address indexed user, uint256 amount)` as its payable `receive()` function. Here `user` is `msg.sender`, so this implementation enables both smart contracts and EOAs to transfer HYPE back to HyperCore. Note that there is a small gas cost to emitting this log on the EVM side.

## Transferring between Core and EVM

Only once a token is linked, it can be converted between HyperCore and HyperEVM spot using a spotSend action (or via the frontend) and on the EVM by using an ERC20 transfer.

Transferring tokens from HyperCore to HyperEVM can be done using a spotSend action (or via the frontend) with the corresponding system address as the destination. The tokens are credited by a system transaction that calls `transfer(recipient, amount)` on the linked contract as the system address, where recipient is the sender of the spotSend action.&#x20;

Transferring tokens from HyperEVM to HyperCore can be done using an ERC20 transfer with the corresponding system address as the destination. The tokens are credited to the Core based on the emitted `Transfer(address from, address to, uint256 value)` from the linked contract.

Do not blindly assume accurate fungibility between Core and EVM spot. See [#caveats](#caveats "mention") for more details.

## Gas costs

A transfer from HyperEVM to HyperCore costs similar gas to the equivalent transfer of the ERC20 token or HYPE to any other address on the HyperEVM that has an existing balance.

A transfer from HyperCore to HyperEVM costs 200k gas at the base gas price of the next HyperEVM block.

## Linking Core and EVM Spot Assets

In order for transfers between Core spot and EVM spot to work the token's system address must have the total non-system balance on the other side. For example, to deploy an ERC20 contract for an existing Core spot asset, the system contract should have the entirety of the EVM spot supply equal to the max Core spot supply.\
\
Once this is done the spot deployer needs to send a spot deploy action to link the token to the EVM:

```javascript
/**
 * @param token - The token index to link
 * @param address - The address of the ERC20 contract on the evm.
 * @param evmExtraWeiDecimals - The difference in Wei decimals between Core and EVM spot. E.g. Core PURR has 5 weiDecimals but EVM PURR has 18, so this would be 13. evmExtraWeiDecimals should be in the range [-2, 18] inclusive
 */
interface RequestEvmContract {
  type: “requestEvmContract”;
  token: number;
  Address: address;
  evmExtraWeiDecimals: number;
}
```

After sending this action, HyperCore will store the pending EVM address to be linked. The deployer of the EVM contract must then verify their intention to link to the HyperCore token in one of two ways:

1. If the EVM contract was deployed from an EOA, the EVM user can send an action using the nonce that was used to deploy the EVM contract.
2. If the EVM contract was deployed by another contract (e.g. create2 via a multisig), the contract's first storage slot or slot at keccak256("HyperCore deployer") must store the address of a finalizer user.

To finalize the link, the finalizer user sends the following action (note that this not nested in a spot deploy action). In the "create" case, the EVM deployer sends the action. In the "firstStorageSlot" or "customStorageSlot" case, the finalizer must match the value in the corresponding slot.

```javascript
/**
 * @param input - One of the EVM deployer options above
 */
interface FinalizeEvmContract {
  type: “finalizeEvmContract”;
  token: number;
  input: {"create": {"nonce": number}} | "firstStorageSlot" | "customStorageSlot"};
}
```

## Caveats

There are currently no checks that the system address has sufficient supply or that the contract is a valid ERC20, so be careful when sending funds.

In particular, the linked contract may have arbitrary bytecode, so it's prudent to verify that its implementation is correct. There are no guarantees about what the `transfer` call does on the EVM, so make sure to verify the source code and total balance of the linked EVM contract.&#x20;

If the EVM contract has extra Wei decimals, then if the relevant log emitted has a value that is not round (does not end in `extraEvmWeiDecimals` zeros), the non-round amount is burned (guaranteed to be <1 Wei). This is true for both HYPE and any other spot tokens.

## Mainnet PURR

Mainnet PURR is deployed as an ERC20 contract at `0x9b498C3c8A0b8CD8BA1D9851d40D186F1872b44E` with the following code. It will be linked to PURR on HyperCore once linking is enabled on mainnet.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract Purr is ERC20Permit {
    constructor() ERC20("Purr", "PURR") ERC20Permit("Purr") {
        address initialHolder = 0x2000000000000000000000000000000000000001;
        uint256 initialBalance = 600000000;

        _mint(initialHolder, initialBalance * 10 ** decimals());
    }
}
```

## Final Notes

Attached is a sample script for deploying an ERC20 token to the EVM and linking it to a Core spot token.

{% file src="<https://2356094849-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FyUdp569E6w18GdfqlGvJ%2Fuploads%2FA9xdcKwuCBMvRV6Cabw6%2Fevm_erc20.py?alt=media&token=ba802e31-1ed7-43e7-9e83-db77a1c6185d>" %}


# Interaction timings

## Transfer Timing

Transfers from HyperCore to HyperEVM are queued on the L1 until the next HyperEVM block. Transfers from HyperEVM to HyperCore happen in the same L1 block as the HyperEVM block, immediately after the HyperEVM block is built.

## Timing within a HyperEVM block

On an L1 block that produces a HyperEVM block:

1. L1 block is built
2. EVM block is built
3. EVM -> Core transfers are processed&#x20;
4. CoreWriter actions are processed&#x20;

Note that the account performing the CoreWriter action must exist on HyperCore before the EVM block is built. An EVM -> Core transfer to initialize the account in the same block will still result in the CoreWriter action being rejected.


# Wrapped HYPE

A canonical system contract for wrapped HYPE is deployed at `0x555...5`. The contract is immutable, with the same source code as wrapped ETH on Ethereum, apart from the token name and symbol.&#x20;

The source code for WHYPE is provided below. Note that this is based on the WETH contract on Ethereum mainnet and other EVM chains.

```solidity
pragma solidity >=0.4.22 <0.6;

contract WHYPE9 {
  string public name = "Wrapped HYPE";
  string public symbol = "WHYPE";
  uint8 public decimals = 18;

  event Approval(address indexed src, address indexed guy, uint wad);
  event Transfer(address indexed src, address indexed dst, uint wad);
  event Deposit(address indexed dst, uint wad);
  event Withdrawal(address indexed src, uint wad);

  mapping(address => uint) public balanceOf;
  mapping(address => mapping(address => uint)) public allowance;

  function() external payable {
    deposit();
  }

  function deposit() public payable {
    balanceOf[msg.sender] += msg.value;
    emit Deposit(msg.sender, msg.value);
  }

  function withdraw(uint wad) public {
    require(balanceOf[msg.sender] >= wad);
    balanceOf[msg.sender] -= wad;
    msg.sender.transfer(wad);
    emit Withdrawal(msg.sender, wad);
  }

  function totalSupply() public view returns (uint) {
    return address(this).balance;
  }

  function approve(address guy, uint wad) public returns (bool) {
    allowance[msg.sender][guy] = wad;
    emit Approval(msg.sender, guy, wad);
    return true;
  }

  function transfer(address dst, uint wad) public returns (bool) {
    return transferFrom(msg.sender, dst, wad);
  }

  function transferFrom(address src, address dst, uint wad) public returns (bool) {
    require(balanceOf[src] >= wad);

    if (src != msg.sender && allowance[src][msg.sender] != uint(-1)) {
      require(allowance[src][msg.sender] >= wad);
      allowance[src][msg.sender] -= wad;
    }

    balanceOf[src] -= wad;
    balanceOf[dst] += wad;

    emit Transfer(src, dst, wad);

    return true;
  }
}
```


# JSON-RPC

The following RPC endpoints are available

* `net_version`
* `web3_clientVersion`
* `eth_blockNumber`
* `eth_call`
  * only the latest block is supported
* `eth_chainId`
* `eth_estimateGas`
  * only the latest block is supported
* `eth_feeHistory`
* `eth_gasPrice`
  * returns the base fee for the next small block
* `eth_getBalance`
  * only the latest block is supported
* `eth_getBlockByHash`
* `eth_getBlockByNumber`
* `eth_getBlockReceipts`
* `eth_getBlockTransactionCountByHash`
* `eth_getBlockTransactionCountByNumber`
* `eth_getCode`
  * only the latest block is supported
* `eth_getLogs`
  * up to 4 topics
  * up to 50 blocks in query range
* `eth_getStorageAt`
  * only the latest block is supported
* `eth_getTransactionByBlockHashAndIndex`
* `eth_getTransactionByBlockNumberAndIndex`
* `eth_getTransactionByHash`
* `eth_getTransactionCount`
  * only the latest block is supported
* `eth_getTransactionReceipt`
* `eth_maxPriorityFeePerGas`
  * always returns zero currently
* `eth_syncing`
  * always returns false

The following custom endpoints are available

* `eth_bigBlockGasPrice`
  * returns the base fee for the next big block
* `eth_usingBigBlocks`
  * returns whether the address is using big blocks
* `eth_getSystemTxsByBlockHash`  and `eth_getSystemTxsByBlockNumber`

  * similar to the "getTransaction" analogs but returns the system transactions that originate from HyperCore

Unsupported requests

* Requests that require historical state are not supported at this time on the default RPC implementation. However, independent archive node implementations are available for use, and the GitHub repository has examples on how to get started indexing historical data locally. Note that read precompiles are only recorded for the calls actually made on each block. Hypothetical read precompile results could be obtained from a full L1 replay.

Rate limits: IP based rate limits are the same as the API server.&#x20;


# Nodes

Documentation for running nodes

You can run a node by following the non-validator and validator nodes by following the steps in <https://github.com/hyperliquid-dex/node>.


# L1 data schemas

The node writes data to `~/hl/data`. With default settings, the network will generate around 100 GB of logs per day, so it is recommended to archive or delete old files.

The command line flags to generate the auxiliary data below can be found at <https://github.com/hyperliquid-dex/node>&#x20;

#### Transaction blocks

Blocks parsed as transactions are streamed to

```
~/hl/data/replica_cmds/{start_time}/{date}/{height}
```

**State snapshots**

State snapshots are saved every 10,000 blocks to

```
~/hl/data/periodic_abci_states/{date}/{height}.rmp
```

#### Trades

Trades data is saved to&#x20;

```
~/hl/data/node_trades/hourly/{date}/{hour}
```

```json
// Example trade
{
  "coin": "COMP",
  "side": "B",
  "time": "2024-07-26T08:26:25.899",
  "px": "51.367",
  "sz": "0.31",
  "hash": "0xad8e0566e813bdf98176040e6d51bd011100efa789e89430cdf17964235f55d8",
  "trade_dir_override":"Na",
  // side_info always has length 2
  // side_info[0] is the buyer
  // side_info[1] is the seller
  "side_info": [
    {
      "user": "0xc64cc00b46101bd40aa1c3121195e85c0b0918d8",
      "start_pos": "996.67",
      "oid": 12212201265,
      "twap_id": null,
      "cloid": null
    },
    {
      "user": "0x768484f7e2ebb675c57838366c02ae99ba2a9b08",
      "start_pos": "-996.7",
      "oid": 12212198275,
      "twap_id": null,
      "cloid": null
    }
  ]
}
```

#### Order statuses

Order status data is saved to

```
~/hl/data/node_order_statuses/hourly/{date}/{hour}
```

```json
// Example order status
{
  "time": "2024-07-26T08:31:48.717",
  "user": "0xc64cc00b46101bd40aa1c3121195e85c0b0918d8",
  "status": "canceled",
  "order": {
    "coin": "INJ",
    "side": "A",
    "limitPx": "25.381",
    // filled size
    "sz": "257.0",
    "oid": 12212359592,
    "timestamp": 1721982700270,
    "triggerCondition": "N/A",
    "isTrigger": false,
    "triggerPx": "0.0",
    "children": [],
    "isPositionTpsl": false,
    "reduceOnly": false,
    "orderType": "Limit",
    // original order size
    "origSz": "257.0",
    "tif": "Alo",
    "cloid": null
  }
}
```

#### Raw book diffs

Raw book diffs data is saved to

```
~/hl/data/node_raw_book_diffs/hourly/{date}/{hour}
```

```json
// Example raw book diffs
// new resting order
{
  "user":"0x768484f7e2ebb675c57838366c02ae99ba2a9b08",
  "oid":35061046831,
  "coin":"CHILLGUY",
  "side": "Bid",
  "px": "1.36",
  "raw_book_diff": {
    "new":{"sz":"186910.0"}
  }
}
// resting order update
{
  "user":"0x768484f7e2ebb675c57838366c02ae99ba2a9b08",
  "oid":35061055064,
  "coin":"BTC",
  "side": "Bid",
  "px": "115323.2",
  "raw_book_diff": {
    "update":{"origSz":"0.2086","newSz":"0.2076"}
  }
}
// order removal
{
  "user":"0xc64cc00b46101bd40aa1c3121195e85c0b0918d8",
  "oid":35061057543,
  "side": "Ask",
  "px": "115200.2"
  "coin":"HYPE",
  "raw_book_diff":"remove"
}
```

#### Miscellaneous events

Miscellaneous event data is saved to

```
~/hl/data/misc_events/hourly/{date}/{hour}
```

Miscellaneous events currently include the following

* Staking deposits
* Staking delegations
* Staking withdrawals
* Validator rewards
* Ledger updates (funding distributions, spot transfers, etc)

<pre class="language-typescript"><code class="lang-typescript"><strong>type MiscEvent = {
</strong><strong>  time: string;
</strong><strong>  hash: string;
</strong><strong>  inner: MiscEventInner;
</strong><strong>}
</strong><strong>
</strong><strong>type MiscEventInner = CDeposit | Delegation | CWithdrawal | ValidatorRewards | Funding | LedgerUpdate;
</strong>
type CDeposit = {
  user: string;
  amount: number;
}

type Delegation = {
  user: string;
  validator: string;
  amount: number;
  is_undelegate: boolean;
}

type CWithdrawal = {
  user: string;
  amount: number;
  is_finalized: boolean;
}

type ValidatorRewards = {
  validator_to_reward: Array&#x3C;[string, number]>;
}

type Funding {
  coin: string;
  usdc: number;
  szi: number;
  fundingRate: number;
  nSamples: number;
}

type LedgerUpdate = {
  users: Array&#x3C;string>;
  delta: LedgerDelta;
}

// InternalTransfer means Perp USDC transfer
// RewardsClaim is for builder and referrer fees
// Deposit/Withdraw refer to Arbitrum USDC bridge
type LedgerDelta = Withdraw 
  | Deposit
  | VaultCreate
  | VaultDeposit
  | VaultWithdraw
  | VaultDistribution
  | VaultLeaderCommission
  | Liquidation
  | InternalTransfer
  | SubAccountTransfer
  | SpotTransfer
  | SpotGenesis
  | RewardsClaim
  | AccountActivationGas
  | PerpDexClassTransfer
  | DeployGasAuction;
  
type Withdraw = {
  usdc: number;
  nonce: number;
  fee: number;
}

type Deposit = {
  usdc: number;
}

type VaultCreate {
  vault: string;
  usdc: number;
  fee: number;
}

type VaultWithdraw {
  vault: string;
  user: string;
  requestedUsd: number;
  commission: number;
  closingCost: number;
  basis: number;
}

type VaultDistribution {
  vault: string;
  usdc: number;
}

type Liquidation {
  liquidatedNtlPos: number;
  accountValue: number;
  leverageType: string;
  liquidatedPositions: Array&#x3C;LiquidatedPosition>;
}

type LiquidatedPosition {
  coin: string;
  szi: number;
}
 
type InternalTransfer {
  usdc: number;
  user: string;
  destination: string;
  fee: number;
}

type AccountClassTransfer {
  usdc: number;
  toPerp: boolean;
}

type SubAccountTransfer {
  usdc: number;
  user: string;
  destination: string;
}

type SpotTransfer {
  token: string;
  amount: number;
  usdcValue: number;
  user: string;
  destination: string;
  fee: number;
  nativeTokenFee: number;
}

type SpotGenesis {
  token: string;
  amount: number;
}

type RewardsClaim {
  amount: number;
}

type AccountActivationGas {
  amount: number;
  token: string;
}

type PerpDexClassTransfer {
  amount: number;
  token: string;
  dex: string;
  toPerp: boolean;
}

type DeployGasAuction {
  token: string;
  amount: number;
}
</code></pre>

#### L4 snapshots

Given an abci state, the node can compute an L4 book snapshot, which is the entire order book with full information about the orders for each level. This can be used as a checkpoint upon which the order statuses stream may be applied, allowing users to stream an L4 book in realtime.&#x20;

Orders in the snapshot are sorted in time-order at the same price level. Trigger orders come at the end and be differentiated with `isTrigger` .

```json
[
  [
    "BTC", // coin
    [
      [ // bids
        {
          "coin": "BTC",
          "side": "B",
          "limitPx": "103988.0",
          "sz": "0.2782",
          "oid": 30112287571,
          "timestamp": 1747157301016,
          "triggerCondition": "N/A",
          "isTrigger": false,
          "triggerPx": "0.0",
          "children": [],
          "isPositionTpsl": false,
          "reduceOnly": false,
          "orderType": "Limit",
          "origSz": "0.2782",
          "tif": "Alo",
          "cloid": null
        },
        ..
      ],
      [ // asks
        {
          "coin": "BTC",
          "side": "A",
          "limitPx": "93708.0",
          "sz": "0.00047",
          "oid": 30073539988,
          "timestamp": 1747128626867,
          "triggerCondition": "Price below 101856",
          "isTrigger": true,
          "triggerPx": "101856.0",
          "children": [],
          "isPositionTpsl": false,
          "reduceOnly": true,
          "orderType": "Stop Market",
          "origSz": "0.00047",
          "tif": null,
          "cloid": null
        },
        ..
      ]
    ]
  ],
  [
    "ETH",
    ..
  ],
  [
    "SOL",
    ..
  ]
]
```


# Foundation non-validating node

### Overview

The Hyper Foundation runs a non-validating node to provide reliable, low latency data access. As a reminder, running a non-validating node is permissionless. This non-validating node is available for those who would benefit from a reliable peer with fewer hops to validating nodes.

The Foundation non-validating node is made available on a best-efforts basis to support access to publicly available data on the Hyperliquid blockchain. No guarantees are made regarding availability, latency, performance, or data completeness, and the node should not be relied upon as a sole or authoritative source of data for any trading or time-sensitive activity. Users connecting to the Foundation non-validating node are solely responsible for verifying any data received and for operating their own infrastructure if needed. Access may be modified, rate-limited, or discontinued at any time without notice.

The Foundation non-validating node runs in apne1-az1 on AWS.

### Potential use cases

Automated traders can run a non-validating node pointing to the Foundation non-validating node. The local non-validating node can record fills and orders with output file buffering disabled for real-time streaming data. A local API server can also be pointed at this local non-validating node to provide real-time API data. For more details see: <https://github.com/hyperliquid-dex/node> and [l1-data-schemas](https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-docs/for-developers/nodes/l1-data-schemas "mention")

### Eligibility&#x20;

* You must have staked 10,000 HYPE.&#x20;
* You must be Tier 1 or above in Maker Rebate Tiers, i.e., >0.5% of 14 day weighted maker volume.&#x20;
* Your connecting peer must be a reliable peer in the public p2p network. This will happen automatically as long as the non-validator ports are open to the public. You should have monitoring and alerting on the node. The requirement is 98% time-weighted uptime.
* You must comply with applicable laws and regulations.&#x20;
* You must not be from a jurisdiction subject to applicable sanctions, which includes, but is not limited to, Cuba, Iran, Myanmar, North Korea, Syria, and certain Russian-occupied regions of Ukraine.
* You must not be from a jurisdiction subject to applicable restrictions, including certain activities involving the U.S. or Ontario.
* The Foundation reserves the right to adjust the above eligibility criteria at any time.
* If you do not meet these criteria at any time, you will no longer be eligible. &#x20;

Access may also be granted, at the Foundation’s discretion, to those whose work contributes meaningfully to the Hyperliquid ecosystem and whose use cases require low-latency data access - provided that all other eligibility criteria are met.

### Apply&#x20;

If you are eligible, you may fill out the [form](https://docs.google.com/forms/d/e/1FAIpQLSeZrUJuJ5_osJuy-YnHCycvb3yTmulhIo6_jPgGPzZVWIxP8g/viewform). You may use linked trading and staking accounts to meet the requirements.&#x20;


# Read Me - Builder Tools

This section lists tools that could be useful for building on Hyperliquid.

If you have developed any tools that are helpful for builders, please share by opening a ticket in [Discord](https://discord.gg/hyperliquid).

*Disclaimer: Listing of tools on this site is not an endorsement of the project. Tooling or resources listed may be developed by independent teams. It is important to DYOR before using any of them. This list is not exhaustive.*


# HyperEVM Tools

### Account abstraction

* Alchemy: <https://www.alchemy.com/hyperevm>
* Biconomy: <https://docs.biconomy.io/>
* ZeroDev: <https://docs.zerodev.app/>

### Analytics

* Dune: <https://dune.com/blockchains/hyperevm>

### Archival RPC

* Alchemy: <https://www.alchemy.com/hyperevm>
* Altitude: <https://rpc.reachaltitude.xyz/>
* Chainstack: <https://chainstack.com/build-better-with-hyperliquid/>
* Dwellir: <https://www.dwellir.com/networks/hyperliquid>
* HypeRPC: <https://hyperpc.app/>
* Nanoreth (how to build an archive node): <https://github.com/hl-archive-node/nanoreth/blob/51c43d6dbdf71e277da67bf618a71fe304aae372/README.md>
* OnFinality: <https://onfinality.io/en/networks/hyperliquid>
* Quicknode: <https://www.quicknode.com/>

### Big blocks, small blocks

* Dual block architecture: <https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/hyperevm/dual-block-architecture>
* Python SDK example: [\
  https://github.com/hyperliquid-dex/hyperliquid-python-sdk/blob/master/examples/basic\_evm\_use\_big\_blocks.py](https://github.com/hyperliquid-dex/hyperliquid-python-sdk/blob/master/examples/basic_evm_use_big_blocks.py)
* Vercel: <https://hyperevm-block-toggle.vercel.app>

### Cross-chain messaging

* Axelar: <https://www.fullport.finance/>
* DeBridge: <https://docs.debridge.finance/the-debridge-messaging-protocol/deployed-contracts#evm-chains>
* Hyperlane: <https://docs.hyperlane.xyz/docs/reference/default-ism-validators>
* Layerswap: <https://layerswap.io/>
* LayerZero: <https://docs.layerzero.network/v2/deployments/deployed-contracts?chains=hyperliquid>
* Omni X DVN: <https://docs.omni-x.io/omni-x/omnichain-infrastructure/omni-x-dvn>
* Reactive: <https://dev.reactive.network/origins-and-destinations>

### DEX aggregator

* GlueX: <https://gluex.xyz/chain/hyperevm>
* Hyperbloom: [https://www.hyperbloom.xyz/ ](https://www.hyperbloom.xyz/)
* Hyperflow: <https://hyperflow.fun/bridge>
* LiquidSwap: <https://liqd.ag/>
* Matcha Meta: <https://meta.matcha.xyz/>

### Explorers

* Blockscout: <https://www.hyperscan.com/>
* Etherscan: <https://hyperevmscan.io/>
* Purrsec: <https://purrsec.com/>
* Purrsec testnet: <https://testnet.purrsec.com/>

### Faucet

* Chainstack (1 HYPE every 24 hours): <https://faucet.chainstack.com/hyperliquid-testnet-faucet>

### Gas (HYPE)

* Cortex: <https://cortexprotocol.com/agent?q=buy%20hype>
* DeBridge: <https://app.debridge.finance/>
* Gas.zip: <https://www.gas.zip/>
* Hyperliquid.xyz (buy HYPE on HyperCore and then transfer it to the HyperEVM): <https://app.hyperliquid.xyz/trade/HYPE/USDC>

### Indexing / subgraphs

* Allium: <https://docs.allium.so/historical-chains/supported-blockchains/hyperliquid>
* Covalent: <https://goldrush.dev/docs/chains/hyperevm>
* Envio: <https://docs.envio.dev/docs/HyperIndex/hyperliquid>
* Goldsky: <https://docs.goldsky.com/chains/hyperevm>
* HyperSignals: <https://biconomy.gitbook.io/hypersignals/>
* Indexing Co: <https://www.indexing.co/>
* Ormilabs: <https://ormilabs.com/chain-list/hyperevm>
* SQD: <https://docs.sqd.ai/hyperliquid-support/>
* SubQuery: <https://subquery.network/indexer/hyperliquid-evm>

### Multisig, MPC, and qualified custodians

* Anchorage Digital (custodian): <https://www.anchorage.com/insights/anchorage-digital-bank-custody-hyperliquids-native-token-hype-institutional-grade-security-hyperevm>
* Bitgo (custodian): <https://www.bitgo.com/resources/blog/bitgo-launches-hyperevm-support/>
* Fireblocks (MPC/custodian): <https://www.fireblocks.com/integrations/protocols/>
* Fordefi (MPC): <https://fordefi.com/>
* Tholos (MPC): <https://www.tholos.app/>

### Oracles

* Blocksense: <https://coda.io/@georgi-zlatarev/blocksense-hyperevm-price-feeds>
* Chainlink: <https://data.chain.link/feeds>
* Pyth: <https://docs.pyth.network/price-feeds/contract-addresses/evm>
* Redstone: [https://app.redstone.finance/app/feeds/?](https://app.redstone.finance/app/feeds/?page=1\&sortBy=popularity\&sortDesc=false\&perPage=32\&networks=999,998)
* Seda: <https://docs.seda.xyz/home/for-developers/deployments>
* Stork: <https://docs.stork.network/resources/contract-addresses/evm#hyperevm>

### RPC

* Mainnet: <https://rpc.hyperliquid.xyz/evm>
* Testnet: <https://rpc.hyperliquid-testnet.xyz/evm>
* Chainlink (Testnet): <https://docs.chain.link/ccip/tools-resources/network-specific/hyperevm-testnet-rpc>
* dRPC: <https://drpc.org/chainlist/hyperliquid-mainnet-rpc>
* HypurrScan: [http://rpc.hypurrscan.io](http://rpc.hypurrscan.io/)
* Quicknode: <https://www.quicknode.com/chains/hyperliquid>
* Stakely: [https://hyperliquid-json-rpc.stakely.io](https://hyperliquid-json-rpc.stakely.io/)

### SAFE multi-sig instances

* Den: <https://safe.onchainden.com/welcome>
* Palmera: <https://hyperliquid.palmeradao.xyz/welcome>

### Smart contract tooling

* Gelato: <https://app.gelato.network/functions>
* Proof of Play RNG: <https://docs.proofofplay.com/services/vrng/about>


# HyperCore Tools

### Analytics - perps and order book data

* ASXN (staking, auction data, eco, token holder trends, etc.): <https://hyperscreener.asxn.xyz/home>
* Artemis: <https://app.artemis.xyz/project/hyperliquid>
* Coinalyze: <https://coinalyze.net/markets/?exchange=H>
* DefiLlama (note that TVL is tracked differently on order books and AMMs): <https://defillama.com/perps/chains/hyperliquid>, <https://defillama.com/perps>
* Dune dashboards by community members: [Uwusanauwu](https://dune.com/uwusanauwu/perps)
* HL Metrics (24 hour rolling volume): [https://hl-metrics.xyz](https://hl-metrics.xyz/)
* HyperDash: [https://hyperdash.info](https://hyperdash.info/)
* Hyperscan: [https://hyperscan.fun](https://hyperscan.fun/)&#x20;
* Hypervisor: [https://hypervisor.gg](https://hypervisor.gg/)
* Laevitas: <https://app.laevitas.ch/exchanges/perpswaps/HYPERLIQUID/screener>
* Velo: <https://velo.xyz/futures/>

### Analytics - USDC Arbitrum bridge

* Dune dashboards by community members: [Mogie](https://dune.com/mogie/hyperliquid-flows), [KamBenbrik](https://dune.com/kambenbrik/hyperliquid), [Hashed](https://dune.com/hashed_official/usdc-on-hyperliquid), and [X3Research](https://dune.com/x3research/hyperliquid)
* Flipside: <https://flipsidecrypto.xyz/pine/hyperliquid-bridge-metrics-lxNyGO>&#x20;
* Parsec: <https://parsec.fi/arb/address/0x2df1c51e09aecf9cacb7bc98cb1742757f163df7>

### APIs

* API Docs: <https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api>
* SDKs:&#x20;
  * Python SDK: <https://github.com/hyperliquid-dex/hyperliquid-python-sdk>
  * Rust SDK (less maintained): <https://github.com/hyperliquid-dex/hyperliquid-rust-sdk>
  * Typescript SDKs by community members: <https://github.com/nktkas/hyperliquid>, <https://github.com/nomeida/hyperliquid>
* CCXT integrations in multiple languages that conform with the standard CCXT API: <https://docs.ccxt.com/#/exchanges/hyperliquid>
* Dwellir (gRPC): <https://www.dwellir.com/docs/hyperliquid/grpc/>
* Dwellir (websocket): <https://www.dwellir.com/docs/hyperliquid/websocket-api>
* Hydromancer (non-rate-limited APIs and indexing): <https://docs.hydromancer.xyz/>

### Explorers

* Hyperliquid.xyz: <https://app.hyperliquid.xyz/explorer>
* Flowscan: [flowscan.xyz](https://flowscan.xyz)
* HypurrScan: [https://hypurrscan.io](https://hypurrscan.io/)

### Indexing

* Allium: <https://docs.allium.so/historical-chains/supported-blockchains/hyperliquid>
* HypeDexer by Enigma: <https://www.hypedexer.com/>

### Multisig, MPC, and qualified custodians

* FalconX (custodian): <https://www.falconx.io/>
* HyperSig (multisig): <https://www.hypersig.xyz/>


# Read Me - Support Guide

This Support Guide is meant to help you resolve common issues that users face on Hyperliquid.

Read this page before you open a ticket. Tickets may take up to 48 hours for a response, with longer wait time on the weekend.

### Recommendations

1. Search this Support Guide for your issue and try the suggested solutions&#x20;
2. Search the Docs to better understand concepts you have questions about
3. If you can’t find the answer to your question, open a ticket in the [Discord server](https://discord.com/invite/hyperliquid) by going to the "open-ticket" channel and clicking the "Create ticket" button. Support will only take place in this ticket channel in the Hyperliquid Discord server. Do not respond to any DMs, which are from impersonator accounts.&#x20;
   1. If your ticket is specific to app.hyperliquid.xyz, use [this form](https://hyperliquid.zendesk.com/hc/en-us/requests/new), where you'll get an email response. Note that this form cannot receive or view files or images for security purposes
4. Note that applications on the HyperEVM are from independent teams building on the Hyperliquid blockchain. Any questions related to a specific application should be directed toward the respective team’s support channels

### Important reminders

1. Never share your wallet, seed phrase, password, or private key with anyone or any website. If someone directly reaches out to you, assume they are a scammer.
2. There is no Hyperliquid app on any app store. Any app pretending to be the official Hyperliquid app is a scam. Do not download or interact with it.
3. Always check the full URL of any website you interact with. Scammers often use similar looking domains, e.g., “hyperliguid.xyz,” to prompt users to sign a malicious transaction.
   1. The official Hyper Foundation website is <https://hyperfoundation.org/>
   2. You can trade on <https://app.hyperliquid.xyz/trade>, in addition to other frontend websites&#x20;
   3. The official X (Twitter) accounts are <https://x.com/HyperliquidX> and <https://x.com/HyperFND>
   4. The official Telegram announcements channel is <https://t.me/hyperliquid_announcements>&#x20;


# Connectivity issues

{% content-ref url="connectivity-issues/connected-via-wallet" %}
[connected-via-wallet](https://hyperliquid.gitbook.io/hyperliquid-docs/support/faq/connectivity-issues/connected-via-wallet)
{% endcontent-ref %}

{% content-ref url="connectivity-issues/connected-via-email" %}
[connected-via-email](https://hyperliquid.gitbook.io/hyperliquid-docs/support/faq/connectivity-issues/connected-via-email)
{% endcontent-ref %}


# Connected via wallet

Description: I can’t connect my wallet to Hyperliquid / I'm stuck in a loop when trying to sign / My wallet isn’t responding. What should I do?

If you’re experiencing issues connecting your wallet to Hyperliquid, such as a recursive "Establish Connection" loop, failed transaction signing, or your wallet extension not loading, try the following troubleshooting steps.&#x20;

### Quick fixes

* Update your wallet extension to the latest version and make sure it’s enabled
* Hard refresh your browser (on most browsers: Ctrl+Shift+R or Cmd+Shift+R) and clear cache
* Disconnect and reconnect your wallet
* Switch networks (e.g., to Ethereum) and then switch back to Arbitrum if you’re trying to deposit USDC on Arbitrum or the HyperEVM if you’re trying to use the HyperEVM

### Wallet specific compatibility issues with Hyperliquid <a href="#wallet-specific-issues" id="wallet-specific-issues"></a>

* Coinbase: Users on mobile may face connection problems. Try using the Coinbase Chrome extension instead
* Metamask: Some users face issues with MetaMask on the HyperEVM. If this persists, consider migrating to a more compatible wallet like Rabby
* Trezor forbidden keypath error: This is related to privacy settings within Trezor. In Trezor Suite's Security / Safety Checks change from "Strict" to "Prompt"&#x20;
* Ledger "Transfer Failed" error on the HyperEVM: Update to the latest Ledger software/firmware
* Reinstall your wallet extension: Make sure you have your seed phrase or private key backed up before doing this

Lastly, you can try switching to Rabby Wallet, which often works more smoothly with Hyperliquid. Your trades, history, and address remain the same even if you use a new wallet extension. <https://support.rabby.io/hc/en-us/articles/11477459275279-How-to-migrate-from-other-wallets-to-Rabby-Wallet>


# Connected via email

Description: I no longer receive verification codes to login with email

### What to do

* If you flagged Privy messages as spam in the past, that would lead to your address being removed from their whitelist. You can reach out directly to Privy’s support team to ask them to check why your email isn’t receiving verification codes at <support@privy.io> and re-enable them.
* In the future, once you’re able to login to your email wallet, you have the option to export your email wallet and import it into the wallet extension of your choice, so you no longer need to use email login: <https://hyperliquid.gitbook.io/hyperliquid-docs/onboarding/export-your-email-wallet>&#x20;


# Deposit or transfer issues (Missing / Lost)

Here are the guides in this section:

{% content-ref url="deposit-or-transfer-issues-missing-lost/deposited-via-arbitrum-network-usdc" %}
[deposited-via-arbitrum-network-usdc](https://hyperliquid.gitbook.io/hyperliquid-docs/support/faq/deposit-or-transfer-issues-missing-lost/deposited-via-arbitrum-network-usdc)
{% endcontent-ref %}

{% content-ref url="deposit-or-transfer-issues-missing-lost/deposited-via-bitcoin-network" %}
[deposited-via-bitcoin-network](https://hyperliquid.gitbook.io/hyperliquid-docs/support/faq/deposit-or-transfer-issues-missing-lost/deposited-via-bitcoin-network)
{% endcontent-ref %}

{% content-ref url="deposit-or-transfer-issues-missing-lost/deposited-via-ethereum-network" %}
[deposited-via-ethereum-network](https://hyperliquid.gitbook.io/hyperliquid-docs/support/faq/deposit-or-transfer-issues-missing-lost/deposited-via-ethereum-network)
{% endcontent-ref %}

{% content-ref url="deposit-or-transfer-issues-missing-lost/deposited-via-solana-network" %}
[deposited-via-solana-network](https://hyperliquid.gitbook.io/hyperliquid-docs/support/faq/deposit-or-transfer-issues-missing-lost/deposited-via-solana-network)
{% endcontent-ref %}

{% content-ref url="deposit-or-transfer-issues-missing-lost/deposited-via-plasma-network" %}
[deposited-via-plasma-network](https://hyperliquid.gitbook.io/hyperliquid-docs/support/faq/deposit-or-transfer-issues-missing-lost/deposited-via-plasma-network)
{% endcontent-ref %}

{% content-ref url="deposit-or-transfer-issues-missing-lost/deposited-via-monad-network" %}
[deposited-via-monad-network](https://hyperliquid.gitbook.io/hyperliquid-docs/support/faq/deposit-or-transfer-issues-missing-lost/deposited-via-monad-network)
{% endcontent-ref %}

{% content-ref url="deposit-or-transfer-issues-missing-lost/transfer-or-deposit-to-usdc-perps-missing" %}
[transfer-or-deposit-to-usdc-perps-missing](https://hyperliquid.gitbook.io/hyperliquid-docs/support/faq/deposit-or-transfer-issues-missing-lost/transfer-or-deposit-to-usdc-perps-missing)
{% endcontent-ref %}


# Deposited via Arbitrum network (USDC)

Description: You deposited via the Arbitrum network

### Important note&#x20;

* Only USDC deposits from the Arbitrum network are supported. If you transferred USDT, ETH, ARB or any other token, your funds will not have been deposited.

### What to do (for email accounts only)

* Wrong deposit: If you deposited anything other than USDC on the Arbitrum network, you can retrieve the funds yourself by following the steps here: <https://hyperliquid.gitbook.io/hyperliquid-docs/onboarding/export-your-email-wallet>
* Deposited <5 USDC, which is the minimum: If your deposit was less than 5 USDC, then it will not be credited. If you logged in with an email, you can send more USDC and the whole amount will be credited. If you are not an email wallet user, your funds are lost.


# Deposited via Bitcoin network

Description: You deposited via the Bitcoin network, which is managed by Unit Protocol.

### Important notes  <a href="#important-notes" id="important-notes"></a>

* The Bitcoin address can only receive BTC on the Bitcoin network. Deposits other than BTC or on other networks will fail and not be credited.
  * If you have accidentally sent BTC on another network, there isn't a way to retrieve these funds currently.
  * If you sent the right token on the right chain and deposited more than the minimum amount, but your BTC still shows up as “Failed”, reach out to the Unit team, which manages Bitcoin network deposits & withdrawals: <https://t.me/hyperunit>
* There is a minimum deposit of 0.0003 BTC. Deposits below 0.0003 BTC will result in a loss of funds.
* Note that Bitcoin deposits take \~30 minutes to arrive in your wallet. You can check the time estimate in the same deposit pop-up where you copied the deposit address.

<br>


# Deposited via Ethereum network

Description: You deposited via the Ethereum network, which is managed by Unit Protocol.

### Important notes  <a href="#important-notes" id="important-notes"></a>

* The Ethereum address can only receive ETH/ENA on the Ethereum network. Deposits other than ETH/ENA or on other networks will fail and not be credited, e.g., Depositing USDC on Ethereum or ETH on Base will fail and not be credited.
  * If you accidentally sent an asset that is not supported on Ethereum or sent ETH/ENA on a chain other than Ethereum, there isn't a way to retrieve these assets currently, unless Unit adds support for them.
  * If you sent the right token on the right chain and deposited more than the minimum amount, but your ETH/ENA still shows up as “Failed", reach out to the Unit team, which manages Ethereum network deposits & withdrawals: <https://t.me/hyperunit>
* There are minimum deposits of 0.007 ETH and 120 ENA. Deposits below these amounts will result in a loss of funds.
* Note that Ethereum deposits take \~5 minutes to arrive in your wallet. You can check the time estimate in the same deposit pop-up where you copied the deposit address.


# Deposited via Solana network

Description: You deposited via the Solana network, which is managed by Unit Protocol.

### Important notes  <a href="#important-notes" id="important-notes"></a>

* The Solana address can only receive SOL/2Z/BONK/FARTCOIN/PUMP/SPX on the Solana network. Deposits other than the assets listed above or on other networks will fail and not be credited, e.g., Depositing USDC on Solana will fail and not be credited.
  * If you accidentally sent an asset that is not supported on Solana or sent SOL/2Z/BONK/FARTCOIN/PUMP/SPX on a chain other than Solana, there isn't a way to retrieve these assets currently, unless Unit adds support for them.
  * If you sent the right token on the right chain and deposited more than the minimum amount, but your SOL/2Z/BONK/FARTCOIN/PUMP/SPX still shows up as “Failed”, reach out to the Unit team, which manages Solana network deposits & withdrawals: <https://t.me/hyperunit>
* There are minimum deposits of 0.12 SOL, 150 2Z, 1,800,000 BONK, 55 FARTCOIN, 5500 PUMP, and 32 SPX. Deposits below these amounts will result in a loss of funds.
* Note that Solana deposits take \~1 minute to arrive in your wallet. You can check the time estimate in the same deposit pop-up where you copied the deposit address.


# Deposited via Plasma network

Description: You deposited via the Plasma network, which is managed by Unit Protocol.

#### Important notes

* The Plasma address can only receive XPL on the Plasma network. Deposits other than XPL or on other networks will fail and not be credited, e.g., Depositing USDC on Plasma will fail and not be credited.
  * If you accidentally sent an asset that is not supported on Plasma or sent XPL on a chain other than Plasma, there isn't a way to retrieve these assets currently, unless Unit adds support for them.
  * If you sent the right token on the right chain and deposited more than the minimum amount, but your XPL still shows up as “Failed", reach out to the Unit team, which manages Plasma network deposits & withdrawals: <https://t.me/hyperunit>​
* There is a minimum deposit of 60 XPL. Deposits below 60 XPL will result in a loss of funds.
* Note that Plasma deposits take \~1 minute to arrive in your wallet. You can check the time estimate in the same deposit pop-up where you copied the deposit address.


# Deposited via Monad network

Description: You deposited via the Monad network, which is managed by Unit Protocol.

#### Important notes

* The Monad address can only receive MON on the Monad network. Deposits other than MON or on other networks will fail and not be credited, e.g., Depositing USDC on Monad will fail and not be credited.
  * If you accidentally sent an asset that is not supported on Monad or sent MON on a chain other than Monad, there isn't a way to retrieve these assets currently, unless Unit adds support for them.
  * If you sent the right token on the right chain and deposited more than the minimum amount, but your MON still shows up as “Failed", reach out to the Unit team, which manages Monad network deposits & withdrawals: <https://t.me/hyperunit>​
* There is a minimum deposit of 450 MON. Deposits below 450 MON will result in a loss of funds.
* Note that Monad deposits take \~1 minute to arrive in your wallet. You can check the time estimate in the same deposit pop-up where you copied the deposit address.


# Transfer or deposit to USDC (Perps) missing

Description: You transferred USDC from your Spot to Perps balance or deposited USDC via Arbitrum and can’t figure out where it went or why you are not able to use the USDC in your Perps balance.

Situation 1: Transferred 1,000 from USDC (Spot) to USDC (Perps). When I checked, I see <1,000 USDC in my Available Balance. Where did it go?

Situation 2: Deposited 1,000 USDC from Arbitrum, and the deposit was successful. When I checked, I see <1,000 USDC in my Available Balance. Where did it go?

### Reasoning

* If you have open positions on cross margin with negative unrealized P\&L, your deposits and Spot to Perp transfers will go toward collateral for those open positions. Please refer to the Docs to understand how margining works: <https://hyperliquid.gitbook.io/hyperliquid-docs/trading/margining#unrealized-pnl-and-transfer-margin-requirements>


# Withdrawal issues

Here are the guides in this section:

{% content-ref url="withdrawal-issues/withdrawal-has-not-arrived-in-my-wallet" %}
[withdrawal-has-not-arrived-in-my-wallet](https://hyperliquid.gitbook.io/hyperliquid-docs/support/faq/withdrawal-issues/withdrawal-has-not-arrived-in-my-wallet)
{% endcontent-ref %}

{% content-ref url="withdrawal-issues/my-withdrawal-keeps-getting-re-deposited" %}
[my-withdrawal-keeps-getting-re-deposited](https://hyperliquid.gitbook.io/hyperliquid-docs/support/faq/withdrawal-issues/my-withdrawal-keeps-getting-re-deposited)
{% endcontent-ref %}

{% content-ref url="withdrawal-issues/withdrawing-to-phantom-wallet" %}
[withdrawing-to-phantom-wallet](https://hyperliquid.gitbook.io/hyperliquid-docs/support/faq/withdrawal-issues/withdrawing-to-phantom-wallet)
{% endcontent-ref %}


# Withdrawal has not arrived in my wallet

Description: You made a withdrawal, but your funds have not arrived in your wallet or intended destination.

### How to check where your withdrawal went <a href="#withdrawal-check" id="withdrawal-check"></a>

{% stepper %}
{% step %}

### Check the withdrawal action you conducted

Go to the Portfolio page and check the Deposits & Withdrawals table
{% endstep %}

{% step %}

### Check if you used 'Send' or 'Withdraw'

For the withdrawal you are referring to, check if the Action column says “Send Spot,” “Send USDC (Perps Wallet),” or “Withdrawal”&#x20;
{% endstep %}
{% endstepper %}

### **Outcome 1: If you see “Send XXX” instead of “Withdrawal”** <a href="#send-instead-of-withdraw" id="send-instead-of-withdraw"></a>

* You used Send instead of Withdrawal. Send is only to send funds to another account on the Hyperliquid blockchain.
* If you sent funds to an address you control, you can connect the wallet to Hyperliquid and access your funds.
* If you sent it to a CEX, this means that only the CEX address can access the funds you sent. You'll have to wait for the CEX to integrate the Hyperliquid blockchain to coordinate retrieving the funds with them. There is an explicit warning message reminding users not to use Send to withdraw to a CEX.

### **Outcome 2: If you see “Withdrawal”** <a href="#withdrawal-status" id="withdrawal-status"></a>

* If the Status says “Pending,” please wait for the duration estimate stated in the Withdrawal modal. If it takes longer, there is likely congestion on the networks, and the withdrawal will be processed, but take longer than usual.
* If the Status says “Completed,” click the explorer link next to the timestamp to check the destination address that received your withdrawal.
* If the Status says “Failed,” you can try to contact the Unit team which manages BTC, ETH, and SOL deposits and withdrawals via their TG group: <https://t.me/hyperunit>. Note that Unit is an independent team.

### How do I use the Send feature on Hyperliquid and what is it for? <a href="#send-feature" id="send-feature"></a>

* Send is used to send tokens to another account on the Hyperliquid blockchain. It is not to withdraw to another blockchain.


# My withdrawal keeps getting re-deposited

Description: You made a withdrawal, but your funds have been re-deposited.

### Why is this happening

* If you’re trying to withdraw using a wallet that’s connected to a Telegram bot, note that most of the Telegram bots are configured to automatically deposit any balance.

### What to do

* You should be able to Send USDC to another address of yours on the Hyperliquid blockchain and then withdraw from that address.&#x20;
* Alternatively, you can reach out to the Telegram bot’s support to ask for assistance.


# Withdrawing to Phantom Wallet

Description: You are connected using Phantom Wallet and face issues with withdrawal

### Situation 1: You need 1 USDC for withdrawals and cannot deposit USDC via Phantom wallet, since Phantom does not support Arbitrum <a href="#need-usdc" id="need-usdc"></a>

* **Option 1**&#x20;
  * You sell some SOL/2Z/BONK/FARTCOIN/PUMP/SPX on Spot for USDC (Spot). Note that minimum transaction amount is $10.
* **Option 2**&#x20;
  * Export your Phantom wallet’s Ethereum private key and import it to another wallet like Rabby that supports the Arbitrum network.
    * Export: <https://help.phantom.com/hc/en-us/articles/25334064171795-How-to-view-your-recovery-phrase-or-private-key-in-Phantom>
    * Migrate to Rabby (optional): <https://support.rabby.io/hc/en-us/articles/11477459275279-How-to-migrate-from-other-wallets-to-Rabby-Wallet>
  * Deposit USDC via Arbitrum Network on Rabby (or other Arbitrum compatible wallets). Note that minimum deposit is $5.

### Situation 2: You withdrew USDC over Arbitrum to your Phantom wallet but cannot find it <a href="#missing-usdc" id="missing-usdc"></a>

* Your funds are not lost, they are on the Arbitrum network.
* Export your Phantom wallet’s Ethereum private key and import it to another wallet like Rabby that supports the Arbitrum network.
  * Export: <https://help.phantom.com/hc/en-us/articles/28355165637011-Exporting-Your-Private-Key>
  * Migrate to Rabby (Optional): <https://support.rabby.io/hc/en-us/articles/11477459275279-How-to-migrate-from-other-wallets-to-Rabby-Wallet>


# Trade outcome looks incorrect

Here are the guides in this section:

{% content-ref url="trade-outcome-looks-incorrect/why-was-i-liquidated" %}
[why-was-i-liquidated](https://hyperliquid.gitbook.io/hyperliquid-docs/support/faq/trade-outcome-looks-incorrect/why-was-i-liquidated)
{% endcontent-ref %}

{% content-ref url="trade-outcome-looks-incorrect/how-does-margining-work" %}
[how-does-margining-work](https://hyperliquid.gitbook.io/hyperliquid-docs/support/faq/trade-outcome-looks-incorrect/how-does-margining-work)
{% endcontent-ref %}

{% content-ref url="trade-outcome-looks-incorrect/my-tp-sl-did-not-execute-correctly" %}
[my-tp-sl-did-not-execute-correctly](https://hyperliquid.gitbook.io/hyperliquid-docs/support/faq/trade-outcome-looks-incorrect/my-tp-sl-did-not-execute-correctly)
{% endcontent-ref %}

{% content-ref url="trade-outcome-looks-incorrect/i-cant-sell-leftover-spot-assets" %}
[i-cant-sell-leftover-spot-assets](https://hyperliquid.gitbook.io/hyperliquid-docs/support/faq/trade-outcome-looks-incorrect/i-cant-sell-leftover-spot-assets)
{% endcontent-ref %}

{% content-ref url="trade-outcome-looks-incorrect/what-does-action-already-expired-mean" %}
[what-does-action-already-expired-mean](https://hyperliquid.gitbook.io/hyperliquid-docs/support/faq/trade-outcome-looks-incorrect/what-does-action-already-expired-mean)
{% endcontent-ref %}


# Why was I liquidated?

Description: Your perps position was liquidated and you see "Market Liquidation" in your Trade History

### Reasoning

* A liquidation event occurs when a trader's positions move against them to the point where the account equity falls below the maintenance margin. You can read about how liquidations work here: <https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations>


# How does margining work?

Description: You have open cross margin positions and don’t understand how margin is attributed to positions

Situation: Why didn’t my margin become available after I closed a Perps position? I closed a Perps position that showed 1,000 USDC in margin, but after closing, my Available Balance increased by <1,000 USDC. Where did the rest go?

### Reasoning

* This typically happens if you're using cross margin and have other open positions with negative unrealized pnl.
* In cross margin mode, all your positions share a common pool of margin. When you close one position, the funds (\~1,000 USDC in this example) are not released directly into your Available Balance if other open positions with negative unrealized pnl still require margin because they didn’t meet the initial margin requirements. New margin, be it through closing a position or depositing USDC, goes toward these existing positions.&#x20;
* So while the 1,000 USDC is still part of your Total Balance, only a portion becomes available to trade, depending on your overall margin requirements.
* Please refer to the Docs to understand how Margining works: <https://hyperliquid.gitbook.io/hyperliquid-docs/trading/margining#unrealized-pnl-and-transfer-margin-requirements>


# My TP/SL did not execute correctly

Description: You set a TP/SL and believe it was not executed correctly

### Situation 1: My TP executed and made a loss although it was triggered at a profitable price. <a href="#tp-made-a-loss" id="tp-made-a-loss"></a>

* Take Profit (TP) and Stop Loss (SL) orders can be set as market or limit orders. TP/SL are triggered by mark price, and then executed. Trade price and mark price are different&#x20;
* By default, market TP/SL orders have a 10% slippage tolerance, which means the execution price can deviate, especially for larger positions or illiquid tokens
* So even if your TP was triggered at a profitable price, the actual fill might have occurred at a worse price due to market conditions, such as low liquidity and/or sudden volatility, resulting in a loss
* To avoid this, you can:
  * Use limit TP/SL orders to specify the exact price you want
  * Break up large positions into smaller chunks to reduce slippage
  * Check the order book before placing orders to understand available liquidity

### Situation 2: My TP/SL orders did not behave correctly, how do TP/SL for long and short positions work on Hyperliquid? <a href="#tp-sl-101" id="tp-sl-101"></a>

* You can read about TP/SL in the Docs here: <https://hyperliquid.gitbook.io/hyperliquid-docs/trading/take-profit-and-stop-loss-orders-tp-sl>
* Long positions
  * Stop-Loss (SL):
    * A SL order to close a long position with a trigger price of $10 and limit price of $10 will place a limit sell order at $10 once the mark price falls below $10
    * If the price drops sharply from $11 to $9, this order may rest at $10 without filling
    * If the limit price is set lower, say $8, the order has a better chance of filling somewhere between $9 and $8
  * Take-Profit (TP):
    * A TP order with a trigger price of $12 and limit price of $11.80 will place a limit sell order at $11.80 once the mark price rises above $12
    * This prevents the order from filling below $11.80 if the price pulls back after triggering
* Short positions
  * Stop-Loss (SL):
    * A SL order to close a short position with a trigger price of $11 and limit price of $11 will place a limit buy order at $11 when the mark price rises above $11
    * If the price spikes quickly from $10 to $12, this order may not fill
    * If the limit price is set higher, like $13, the order has a better chance of filling between $12 and $13
  * Take-Profit (TP):
    * A TP order with a trigger price of $9 and limit price of $9.20 will place a limit buy order at $9.20 once the mark price drops below $9
    * This ensures it won't fill at a worse price (above $9.20) if the price bounces back up after triggering

### Situation 3: How do Stop Market orders work on Hyperliquid? <a href="#stop-market-101" id="stop-market-101"></a>

* A Stop Market order is triggered when the price reaches the selected stop price.
* Entering a Long Position
  * Stop Price: The price at which you want to trigger your buy order (above current market price)
  * Used when: You want to place a long only if the price is higher than the current price&#x20;
* Entering a Short Position
  * Stop Price: The price at which you want to trigger your sell order (below current market price)
  * Used when: You want to place a short only if the price is lower than the current price

### Situation 4: How do Stop Limit orders work on Hyperliquid? <a href="#stop-limit-101" id="stop-limit-101"></a>

* A Stop-Limit Order is a conditional order that combines a stop (trigger) price and a limit price. When the stop price is hit, a limit order is placed on the order book. That limit order only executes if it can be filled at or better than your limit price
* Entering a Long Position (Buy Stop Limit):&#x20;
  * Stop Price: The price at which you want to trigger your buy order (above current market price)
  * Limit Price: The max price you're willing to pay (typically lower than the stop price, otherwise orders will likely fill immediately upon triggering)
  * Used when: You want to place a long only if the price is higher than the current price, but want to set a limit price (not willing to buy higher than $x)
* Entering a Short position (Sell Stop Limit)
  * Stop Price: The price at which you want to trigger your sell order (below current market price)
  * Limit Price: The lowest price you're willing to sell at (typically higher than the stop price, otherwise orders will likely fill immediately upon triggering)
  * Used when: You want to place a short only if the price is lower than the current price, but want to set a limit price (not willing to sell lower than $x)

Explore different order types here: <https://hyperliquid.gitbook.io/hyperliquid-docs/trading/order-types>


# I can't sell leftover spot assets

Description:  I have a small amount of a spot asset that I can’t sell

### Reasoning&#x20;

* Each spot deployer sets the minimum lot size for trading.&#x20;
* For JEFF, the minimum lot size is 1, so you cannot sell less than that on the order book. If you have <1 JEFF that you would like to sell, you can use a community member’s site that swaps JEFF for USDC: <https://www.heyjeff.fun/>
* For RUB, you can only sell in units of 0.00001
* For XAUT, the minimum lot size is 0.01, so you cannot sell less than that on the order book. You can try transferring to the HyperEVM and swapping it on protocols there or bridge out using <https://gold.usdt0.to/transfer>


# What does "Action already expired" mean?

Description: You received an error message saying '"Action already expired"' when placing an order

This error message appears if you perform an action (e.g., placing an order) and it's not accepted by the L1 within 15 seconds. This is meant to prevent against situations where your connection is unstable or the chain is congested and you would not want the action to be delayed by more than 15 seconds.&#x20;

If you still want the action to go through (e.g., in a situation where your internet connection is bad, but you still want to trade), go to the settings dropdown and check the box next to "Disable Transaction Delay Protection".&#x20;

Important: Be aware that disabling this protection may cause delayed orders to be placed after reconnection or when congestion eases. This may result in multiple order placements (if you made multiple attempts to execute an order during the delay) when you only intended for a single action to take place. As an example, placing a short order to close a long position may result in closing the long and opening a short position if multiple short orders were attempted during the delay.

<figure><img src="https://223971011-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fjea34cXPWRf1o1Lan56O%2Fuploads%2FLpQfg3glMaGqE9m03vhN%2FScreenshot%202025-12-18%20at%204.44.11%E2%80%AFPM.png?alt=media&#x26;token=fa5b08a4-450f-448d-a72e-2062122c3f36" alt="" width="270"><figcaption></figcaption></figure>


# HyperEVM issues

Here are the guides in this section:

{% content-ref url="hyperevm-issues/accidentally-transferred-to-hyperevm" %}
[accidentally-transferred-to-hyperevm](https://hyperliquid.gitbook.io/hyperliquid-docs/support/faq/hyperevm-issues/accidentally-transferred-to-hyperevm)
{% endcontent-ref %}

{% content-ref url="hyperevm-issues/cant-see-my-hyperevm-assets-in-wallet-extension" %}
[cant-see-my-hyperevm-assets-in-wallet-extension](https://hyperliquid.gitbook.io/hyperliquid-docs/support/faq/hyperevm-issues/cant-see-my-hyperevm-assets-in-wallet-extension)
{% endcontent-ref %}

{% content-ref url="hyperevm-issues/gas-problem-on-evm" %}
[gas-problem-on-evm](https://hyperliquid.gitbook.io/hyperliquid-docs/support/faq/hyperevm-issues/gas-problem-on-evm)
{% endcontent-ref %}


# Accidentally transferred to HyperEVM

Description: You clicked the “Transfer to/from EVM” button and can’t figure out what happened

### How do I transfer it back to Spot? <a href="#transfer-back-to-spot" id="transfer-back-to-spot"></a>

* Your funds are not lost. They went from HyperCore to the HyperEVM. HyperCore and the HyperEVM are two parts of the Hyperliquid blockchain. You can visualize what that means here: <https://hyperliquid.gitbook.io/hyperliquid-docs>
* If you want to move your tokens back to Spot, you can follow this guide here: <https://hyperliquid.gitbook.io/hyperliquid-docs/onboarding/how-to-use-the-hyperevm#how-do-i-move-assets-to-and-from-the-hyperevm>. You will need HYPE on the EVM for gas. If you transferred something other than HYPE to the EVM, you can buy HYPE on Spot and use the same “Transfer to/from EVM” feature to move HYPE to the EVM for gas.
* You can find out more about what you can do on the EVM here: <https://hyperliquid.gitbook.io/hyperliquid-docs/onboarding/how-to-use-the-hyperevm#what-can-i-do-on-the-hyperevm>


# Can’t see my HyperEVM assets in wallet extension

Description: You are using the EVM and don’t see your assets on the EVM in your wallet extension

Here is a guide with common questions regarding how to use the HyperEVM: <https://hyperliquid.gitbook.io/hyperliquid-docs/onboarding/how-to-use-the-hyperevm>

### Add HyperEVM to your wallet extension

Follow the steps below or using Chainlist: <https://chainlist.org/chain/999>

* Add the chain to your wallet using "Add custom network":&#x20;
* Chain ID: 999&#x20;
* Network Name: Hyperliquid&#x20;
* RPC URL: <https://rpc.hyperliquid.xyz/evm&#x20>;
* Currency Symbol: HYPE

### For specific HyperEVM asset - add custom network token <a href="#custom-network-token" id="custom-network-token"></a>

* Click the wallet icon (see below) to the right of the Contract in the info bar for a given spot asset on the Trade page

<figure><img src="https://223971011-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fjea34cXPWRf1o1Lan56O%2Fuploads%2F6RExo1eow4vdPp8FMyVY%2Fimage.png?alt=media&#x26;token=8ee43dbf-cb58-4c3c-83bf-324253051c75" alt=""><figcaption></figcaption></figure>

* To do this manually, you can add the contract address for a token directly to your wallet extension. You can find the contract address for a given token using a HyperEVM explorer, such as <https://www.hyperscan.com/token/0x9b498C3c8A0b8CD8BA1D9851d40D186F1872b44E> or <https://purrsec.com/address/0x9b498c3c8a0b8cd8ba1d9851d40d186f1872b44e> for PURR &#x20;

If you have tried the above, but your wallet extension does not support the HyperEVM as a custom network, consider using Rabby, which supports the HyperEVM as an integrated network: <https://support.rabby.io/hc/en-us/articles/11477459275279-How-to-migrate-from-other-wallets-to-Rabby-Wallet>


# Gas problem on EVM

Description: You are having issues paying for gas or getting transactions through on the HyperEVM

### **What is used for gas for HyperEVM?** <a href="#gas-on-hyperevm" id="gas-on-hyperevm"></a>

* The gas for EVM transfers and transactions on the HyperEVM is HYPE
* To transfer tokens from HyperCore to EVM, you will need HYPE on HyperCore (Spot)
* To transfer tokens from EVM to HyperCore and other transactions on the HyperEVM, you will need HYPE on the HyperEVM

### **Situation 1: I see this error “Invalid transaction envelope type: specified type “0x2” but included a gasPrice instead of maxFeePerGas and maxPriorityFeePerGas”** <a href="#gas-issue-metamask" id="gas-issue-metamask"></a>

* This is a known issue with MetaMask; you can try a different wallet like Rabby <https://support.rabby.io/hc/en-us/articles/11477459275279-How-to-migrate-from-other-wallets-to-Rabby-Wallet>

### **Situation 2: Why does my wallet indicate that I have insufficient ETH balance for transactions when I do in my wallet?** <a href="#eth-gas-issues" id="eth-gas-issues"></a>

* You don't need ETH for gas on the HyperEVM. You need HYPE for gas on the HyperEVM
* Usually this means you didn't add the HyperEVM network properly to your wallet extension. Please follow the instructions here: <https://hyperliquid.gitbook.io/hyperliquid-docs/onboarding/how-to-use-the-hyperevm#how-do-i-add-the-hyperevm-to-my-wallet-extension>
* Your wallet extension may not support the HyperEVM as a custom network. Consider switching to Rabby, which supports the HyperEVM as an integrated network: <https://support.rabby.io/hc/en-us/articles/11477459275279-How-to-migrate-from-other-wallets-to-Rabby-Wallet>


# Unstaking & link staking issues

Here are the guides in this section:

{% content-ref url="unstaking-and-link-staking-issues/unstaking-transfer-taking-more-than-7-days" %}
[unstaking-transfer-taking-more-than-7-days](https://hyperliquid.gitbook.io/hyperliquid-docs/support/faq/unstaking-and-link-staking-issues/unstaking-transfer-taking-more-than-7-days)
{% endcontent-ref %}

{% content-ref url="unstaking-and-link-staking-issues/staking-and-trading-account-linking-issues" %}
[staking-and-trading-account-linking-issues](https://hyperliquid.gitbook.io/hyperliquid-docs/support/faq/unstaking-and-link-staking-issues/staking-and-trading-account-linking-issues)
{% endcontent-ref %}


# Unstaking transfer taking more than 7 days

Description: You believe that you unstaked HYPE and the transfer has taken >7 days. Your unstaked HYPE has not reached your Spot balance

### Troubleshoot

1. Check that you have initiated the transfer from your Staking balance to your Spot balance, not just unstaked. The 7 day unstaking queue begins after you initiate the transfer. Unstaking and transferring to Spot balance are two separate actions
2. The unstaking queue (transfer to Spot) takes exactly 7 days. As an example, if you initiate a staking to spot transfer of 100 HYPE at 08:00:00 UTC on March 11 and a transfer of 50 HYPE at 09:00:00 UTC on March 12, the 100 HYPE transfer will be finalized at 08:00:01 UTC on March 18 and the 50 HYPE transfer will be finalized at 09:00:01 UTC on March 19

It’s not possible to speed up a transfer from the staking balance to spot balance to take less than 7 days.&#x20;

\
Please refer to this Staking section in the Docs for more information: <https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/staking>


# Staking and trading account linking issues

Description: You have questions after linking a staking and trading account

### Do I need to link a trading and staking account if I trade and stake on the same account?&#x20;

* No, this linking feature is only for users who want to trade and stake on separate accounts&#x20;

### Can I change the trading account that is linked?

* No, linking is permanent. Unlinking is not supported

### Will my staking account continue to receive [staking discounts](https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees#staking-tiers)?

* No, the staking user will not receive any staking-related fee discount after being linked to a trading account

### Why can’t I set up my staking and trading account link?

* Linking requires the trading account to send an action first. The staking account then finalizes the link

Please refer to the Docs section for more information: <https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees#staking-linking>


# Building on Hyperliquid

Here are the guides in this section:

{% content-ref url="building-on-hyperliquid/i-have-api-related-questions" %}
[i-have-api-related-questions](https://hyperliquid.gitbook.io/hyperliquid-docs/support/faq/building-on-hyperliquid/i-have-api-related-questions)
{% endcontent-ref %}

{% content-ref url="building-on-hyperliquid/i-want-to-deploy-a-spot-token-or-list-a-perp" %}
[i-want-to-deploy-a-spot-token-or-list-a-perp](https://hyperliquid.gitbook.io/hyperliquid-docs/support/faq/building-on-hyperliquid/i-want-to-deploy-a-spot-token-or-list-a-perp)
{% endcontent-ref %}


# I have API related questions

Description: You are building on HyperCore or HyperEVM

Here are the API docs: <https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api>

Please do not open any tickets about API related questions. If you have questions about the API, you can ask in the #api-traders channel in the Discord server: <https://discord.gg/hyperliquid>. You can also search the message history since many people have similar questions.&#x20;

API announcements: <https://t.me/hyperliquid_api>


# I want to deploy a spot token or list a perp

### Spot deployment

Spot deployments are permissionless <https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-1-native-token-standard>

### Perpetuals listings

Perps listings are based on community request and organic demand: <https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-3-builder-deployed-perpetuals>


# I got scammed/hacked

Description: Your account was compromised / you see transactions you did not authorize / your funds are missing.

If you notice unauthorized transactions, missing funds, or an unknown multi-sig on your Hyperliquid account, your wallet was likely compromised.&#x20;

Hyperliquid is non-custodial. Only someone with access to your private key or seed phrase can sign transactions on your address’ behalf. If you see activity you didn’t initiate, it’s highly likely that your key was compromised, meaning someone else has control of your address.

### What to do

* Stop using the compromised address. Treat it as permanently unsafe ("burned")
* Create a new wallet address using a trusted wallet provider&#x20;
* Transfer any remaining funds from your old wallet to your new one—this applies across all apps, not just Hyperliquid
* Send any assets you may have on the HyperEVM to your new address (This is also applicable if your HyperCore address has been converted into a multi-sig you do not control)
* Revoke smart contract permissions via <https://revoke.cash> to limit further access to your wallet
* Clear your browser's cache and cookies, especially if you suspect there may be malware or phishing
* Identify how you were compromised and determine if your device has malware. This helps ensure you do not repeat the same mistakes again

### Best practices moving forward

Being in DeFi means being responsible about self-custody and keeping your own assets safe. Remember to always be vigilant

* Never share your seed phrase and private key (Never input it into a website and never share it with a 'support' person)
* Consider using a hardware wallet for a more secure setup (e.g., Ledger, Trezor, Keystone). Hardware wallets can be paired with browser wallets like Rabby to keep your private key off the browser
* Never rush to perform actions. Always read and double-check any transaction you sign (Review warnings or alerts from your wallet, if there is insufficient information, do not sign)
* Never click on unknown links, and beware of sponsored links on your search engine, always verify (Cross reference links against official Twitter accounts, DefiLlama, CoinGecko etc.). Bookmark frequently visited sites to avoid phishing attempts
* Never download unknown or unverified applications
* Never download PDFs from unknown users or sources
* Assume most DMs are scams. Be suspicious if someone asks you to install software or sends a link out of context
* Keep your browsers and extensions up to date; delete any extensions that are no longer maintained

