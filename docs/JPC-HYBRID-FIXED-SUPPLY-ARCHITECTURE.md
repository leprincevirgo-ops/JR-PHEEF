# JPC — Hybrid Fixed-Supply Architecture

**Status:** Design specification only. JPC is not represented here as issued, exchange-listed, purchasable, or live.

## 1. Product boundary

JPC is intended to be a digital asset within the JR PHEEF ecosystem. Its market and treasury experience belongs inside the existing JR PHEEF Economy environment, not in a separate competing application. The proposed visual identity is blue and gold.

The agreed design direction is **hybrid** with a **fixed maximum supply**. The final supply number, allocation percentages, chain, contract, launch date, custody model and legal structure remain undecided and must not be invented by implementation code.

## 2. Fixed-supply mathematics

Let:

- (S_{max}) be the immutable maximum supply, selected through an approved governance decision.
- (w_i) be the allocation weight for tranche (i), where (w_i\geq0) and (sum_i w_i=1).
- (g_i(t)) be the published release function for tranche (i), bounded between zero and one and non-decreasing over time.

A schedule-based issuance model is:

[
M(t)=S_{max}\sum_{i=1}^{n}w_i g_i(t)
]

with:

[
0\leq M(t)\leq S_{max},\qquad \lim_{t\to\infty}M(t)=S_{max}
]

If the final design mints the entire supply at genesis, then (M(t)=S_{max}) from genesis and allocations are controlled through vesting and lock contracts. In either model, no administrator, AI agent or upgrade path may mint above (S_{max}).

A simple circulating-supply reconciliation is:

[
C(t)=M(t)-L(t)-B(t)
]

where (L(t)) is the amount still locked or otherwise unavailable and (B(t)) is the amount irreversibly burned. Burns never authorize reminting. The final implementation must publish a precise definition of circulating, locked, treasury and burned balances.

The allocation weights and release functions are parameters, not assumptions. They must be approved, published and audited before any token issuance.

## 3. Hybrid ledger model

- The on-chain JPC contract is the canonical record for JPC issuance, ownership and transfers.
- JR PHEEF may separately maintain ordinary app credits, rewards or internal accounting records for service use.
- JR credits are not JPC, do not represent JPC ownership and must not be shown as convertible at a guaranteed rate.
- Any bridge between on-chain JPC and an off-chain service ledger requires explicit design, reconciliation, authorization, limits, audit logs and independent security review.
- No private key or custody secret is stored in ordinary application tables.

## 4. Market graph and price integrity

The JPC market graph belongs inside JR PHEEF Economy / JPC Market. It may display price, volume, liquidity, spread, market depth and trade history only when connected to a verified exchange or market-data provider.

Every chart must show its source, currency, timestamp, market pair and whether the value is a last trade, bid, ask, index or indicative quote. Missing or stale feeds must be labelled clearly. A simulation or illustrative model must never be presented as a live market.

Until a verified market exists, the interface should show a truthful “Market not live” state rather than a fabricated graph or price.

## 5. Purchase inside JR PHEEF

A future in-app purchase flow may be offered through authorized, legally appropriate exchange, broker, payment and custody partners. The JR PHEEF interface can coordinate the experience, but it must not imply that JR PHEEF itself is a licensed exchange, bank or custodian unless that is separately established.

Required gates include:

1. Jurisdiction-specific legal and regulatory review.
2. Approved issuer and token documentation.
3. Independently audited smart contract and supply controls.
4. Verified market/liquidity and execution partner.
5. Identity, eligibility, sanctions and transaction checks required by the relevant jurisdiction.
6. Clear quote expiry, fees, spread, order status, settlement and refund/dispute information.
7. Wallet ownership, custody, recovery and key-management disclosures.
8. Security testing, monitoring, incident response and an independently tested pause/recovery plan.

No buy button should execute a transaction until these gates are complete and the connected partner returns a verifiable order result.

## 6. Collateral and lending

JPC may be considered as collateral in a future arrangement with a licensed lender. This is not a promise that JPC will be accepted or that a loan will be available.

A lawful collateral product would require independent valuation, custody/escrow rules, loan-to-value limits, interest and fee disclosure, margin-call rules, liquidation mechanics, default handling, consumer protection and clear disclosure that collateral value can fall sharply. JR PHEEF must not promise credit or guarantee a collateral value.

## 7. Governance and release controls

- Publish the fixed-supply policy and allocation schedule before issuance.
- Separate issuer, treasury, contract administrator, auditor and platform operator permissions.
- Use multi-party controls and timelocks for any permitted administrative action.
- Prohibit unilateral AI changes to supply, allocations, treasury or user balances.
- Maintain public audit evidence and a transparent change history.
- Keep JPC design, JR credits and other ecosystem revenue streams distinct in accounting and user disclosures.

**Release rule:** Until the legal, contract, partner, data-feed and security gates are independently verified, JPC remains a design/research project and no live market, direct purchase or lending capability may be claimed.
