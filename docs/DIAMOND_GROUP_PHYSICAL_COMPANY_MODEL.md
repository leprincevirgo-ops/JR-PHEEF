# Diamond Group: physical-company and shared-digital operating model

**Status:** target architecture; planning only  
**Applies to:** Diamond Global Business Operators (DGBO), JR PHEEF and FAMILY  
**Current legal position:** do not represent any entity as incorporated or licensed until independently verified.

## 1. Group principle

The long-term target is one connected group with three distinct physical companies:

- **Diamond Global Business Operators (DGBO)** — the parent and group-governance company.
- **JR PHEEF** — the technology and digital-platform company, with its own staff, leadership, operations and physical presence.
- **FAMILY** — the financial-access, education and investment-opportunity connection company, with its own staff, leadership, operations and physical presence.

DGBO owns and governs the group. JR PHEEF and FAMILY retain distinct operating identities and responsibilities. Each company may eventually maintain its own offices, employees, operating plans, records, budgets and customer relationships.

The shared JR PHEEF digital ecosystem connects the group. It does not erase the legal, financial, operational or data boundaries between companies.

## 2. Company responsibilities

### DGBO — parent and group operator

- Group ownership, governance, strategy and long-term stewardship.
- Group-level planning, management reporting, internal approvals and risk oversight.
- Evaluation of business opportunities referred by JR PHEEF, with a traceable review and decision process.
- Shared group services where appropriate: finance administration, HR coordination, procurement, legal/compliance coordination, records and internal audit.
- Future creation, acquisition or stewardship of additional ventures and subsidiaries.

DGBO's internal Command Center is private. Members, customers and ordinary employees must not receive founder-only access merely because they use JR PHEEF.

### JR PHEEF — technology and digital-platform company

- Owns and operates the JR PHEEF technology product and its platform services.
- Provides the shared digital gateway for members, business workspaces, communications, discovery, opportunities and approved integrations.
- Routes selected, consented business-idea submissions to DGBO for evaluation.
- Provides software and operational tools to group companies under explicit service, data and access agreements.
- Maintains platform security, identity, availability, data portability and integration governance.

JR PHEEF must not silently become the custodian of money simply because a member sees a balance, plan, goal or transaction record in its interface.

### FAMILY — financial-access and participation company

**Name meaning:** Financial Access to Money for Investments & Loving Yourself.

- Financial education, budgeting support, savings planning and family financial-wellbeing programmes.
- Member community, opportunity discovery and preparation for participation in suitable ventures.
- Explains risks, fees, eligibility, provider identity and the difference between an enquiry and an approved financial product.
- May introduce members to appropriately licensed banks, payment providers, investment firms, funds or other regulated partners.
- May develop its own regulated services only after the required legal structure, licences, governance, capital, systems and controls are established.

FAMILY is not to be presented as a licensed bank or as currently accepting deposits. Until the relevant approvals and integrations exist, it must not accept, pool, hold, lend, transfer, invest or promise returns on members' money. A savings goal or displayed planning figure is not money held by FAMILY or JR PHEEF.

## 3. Shared digital infrastructure, separate company boundaries

The ecosystem should provide a common sign-in and coherent experience while preserving:

- Separate company profiles, branding, public information and service terms.
- Explicit membership and role grants for each company.
- Least-privilege access to member and company information.
- Separate company workspaces, budgets, operational records and audit trails.
- Clear attribution of which company provides each service and is responsible for each action.
- Consent-controlled sharing between companies; membership in one company does not automatically grant another company access to all personal data.
- Separate legal, accounting and payment records when separate entities are incorporated.
- Integration contracts and audit logs for shared services.

A group dashboard may consolidate authorised management information, but it must not merge company books, customer funds, regulated records or permissions.

## 4. Legal-entity lifecycle

The product must distinguish a **venture/brand**, an **operating division**, and an **incorporated legal entity**.

1. **Planned:** concept and operating design only.
2. **Operating as a division/brand:** activity is carried out by an existing registered entity, with clear disclosure of the contracting legal entity.
3. **Incorporation in progress:** application submitted but not yet approved; do not imply registration.
4. **Incorporated:** company identity and registration details verified against official records.
5. **Licensed (where required):** the relevant licence and permitted activity independently verified.
6. **Active:** only the activities supported by the verified legal and regulatory status may be enabled.

The user has indicated that the eventual target is three physical companies. That target does not mean that three companies are already registered. The initial group may operate through DGBO with clearly disclosed divisions until separate incorporation is practical and legally appropriate. FAMILY's regulated pathway must be assessed before any financial activity is activated.

## 5. Financial-flow boundary

For every money-related feature, the system must identify:

- Who legally receives and holds the funds.
- Which licensed provider executes the payment or financial service.
- Which company is the customer-facing service provider and what it is authorised to do.
- Whether the feature is merely a personal planning record, a payment instruction, a stored-value account, a deposit, a loan, an investment or a pooled scheme.
- The member's explicit consent, the transaction status returned by the provider, fees, reversals and dispute route.

JR PHEEF may display a provider-confirmed status and maintain an auditable reference. A local database balance, ledger entry or successful button click must never be treated as proof that external money moved. No member funds may circulate through an internal JR PHEEF balance by assumption.

## 6. Technical implementation rules

- Keep the current venture registry as the catalogue of group identities; do not create duplicate company records in unrelated modules.
- Extend the registry only through versioned migrations and preserve existing slugs and membership history.
- Represent parent-child ownership separately from user membership and company staff roles.
- Store legal registration and licence evidence as verified metadata with source, verifier and timestamp; never invent registration numbers or licence references.
- Model physical presence separately from legal status: planned office, leased/owned premises, branch, country and operational readiness are distinct facts.
- Enforce all company and founder permissions server-side and with database row-level security. A hidden navigation item is not an access-control mechanism.
- Keep production payment execution disabled until a specific licensed provider, approved account, signed integration and end-to-end test are in place.
- Require human approval for consequential company actions, financial operations, legal filings, public claims and production releases.

## 7. Delivery sequence

1. Audit and stabilise the active JR PHEEF foundation and staging database.
2. Make the group registry, parent-child relationship, company roles and legal/physical lifecycle explicit.
3. Complete DGBO's private governance and opportunity-review workspace.
4. Complete JR PHEEF's member-facing technology and shared-service experience.
5. Build FAMILY's education, goals, member support and licensed-provider referral journey without custody or transaction execution.
6. Add company-specific employee portals, operating records and reporting with isolated permissions.
7. Incorporate each company when its operational, ownership and regulatory case is ready; verify official details before publishing.
8. Add regulated financial integrations only after professional review, approvals and provider testing.

## 8. Acceptance criteria

- A member can understand whether they are interacting with DGBO, JR PHEEF or FAMILY.
- Each company can have its own physical operations without fragmenting the shared member experience.
- DGBO group ownership is represented without falsely implying that a planned venture is already incorporated.
- Staff access is scoped to their company, role and assigned duties.
- Founder-only controls remain inaccessible to ordinary members and staff.
- FAMILY planning tools cannot be mistaken for a bank account, deposit, wallet or investment product.
- No internal balance or status can falsely claim that an external payment or investment occurred.
- Company-to-company data sharing is explicit, logged and limited to the necessary purpose.
