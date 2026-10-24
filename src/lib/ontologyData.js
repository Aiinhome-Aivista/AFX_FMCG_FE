/* ============ DATA (from FMCG ONTOLOGY.md v1.0 + FMCG Ontology Graph.html) ============ */

export const DOMMETA = {
  spine: { n: 'Master-data spine', short: 'Master-Data Spine', c: '#5A8AC3', code: 'SPINE' },
  rtm: { n: '01 Sales & Distribution (RtM)', short: 'Sales & Distribution', c: '#2E6FCA', code: 'RTM' },
  trade: { n: '02 Trade, Promotions & RGM', short: 'Trade & Promotions', c: '#8A4FD0', code: 'TRADE' },
  marketing: { n: '03 Marketing & Consumer', short: 'Marketing & Consumer', c: '#C05A9E', code: 'MKT' },
  supply: { n: '04 Supply Chain & Procurement', short: 'Supply Chain & Sourcing', c: '#2FA096', code: 'SCM' },
  mfg: { n: '05 Manufacturing & Quality', short: 'Manufacturing & Quality', c: '#A0784A', code: 'MFG' },
  npd: { n: '06 Innovation & NPD', short: 'Innovation & NPD', c: '#4EA36A', code: 'NPD' },
  finance: { n: '07 Finance & EPM', short: 'Finance & EPM', c: '#6E7FBF', code: 'FIN' },
  ecom: { n: '08 E-commerce, D2C & Strategy', short: 'E-commerce & Strategy', c: '#D08A3E', code: 'ECOM' },
  data: { n: '09 Data & Analytics Foundation', short: 'Data & Analytics', c: '#64748B', code: 'DATA' },
}

// Order around celestial canvas (faithfully mirrors FMCG Ontology Graph.html)
export const ORDER = ['rtm', 'trade', 'finance', 'data', 'supply', 'mfg', 'npd', 'marketing', 'ecom']

// Logical sequential order for lists, badges, and tabs
export const DISPLAY_ORDER = ['rtm', 'trade', 'marketing', 'supply', 'mfg', 'npd', 'finance', 'ecom', 'data']

export const DOMAIN_SLUGS = {
  rtm: 'sales-distribution-rtm',
  trade: 'trade-promotions-rgm',
  marketing: 'marketing-consumer',
  supply: 'supply-chain-procurement',
  mfg: 'manufacturing-quality',
  npd: 'innovation-npd',
  finance: 'finance-epm',
  ecom: 'ecommerce-d2c-strategy',
  data: 'data-analytics-foundation',
}

export const SLUG_TO_DOM = {
  // Slugs
  'sales-distribution-rtm': 'rtm',
  'trade-promotions-rgm': 'trade',
  'marketing-consumer': 'marketing',
  'supply-chain-procurement': 'supply',
  'manufacturing-quality': 'mfg',
  'innovation-npd': 'npd',
  'finance-epm': 'finance',
  'ecommerce-d2c-strategy': 'ecom',
  'data-analytics-foundation': 'data',
  // Short keys
  rtm: 'rtm',
  trade: 'trade',
  marketing: 'marketing',
  supply: 'supply',
  mfg: 'mfg',
  npd: 'npd',
  finance: 'finance',
  ecom: 'ecom',
  data: 'data',
  // Legacy aliases
  'planning-budgeting-forecasting': 'finance',
  'management-reporting-gross-to-net': 'finance',
  'cost-profitability-management': 'finance',
  'working-capital-treasury': 'finance',
  'consolidation-close-statutory': 'finance',
  'statement-analysis-valuation': 'finance',
  'risk-governance-controls': 'finance',
  'epm-platforms-operating-model': 'finance',
}

export const NODES = [
  /* ============ SPINE ============ */
  {
    id: 'product',
    n: 'Product / SKU',
    d: 'spine',
    def: 'The sellable item and its roll-ups. Two evidenced hierarchy patterns: tobacco (Category→Brand Family→Variant→Product→Trade SKU→Factory SKU) and household (Brand→Price Band→Sub-brand→Form→Size→Flavor; TPM roll-up Division→Category→Brand→MPG→GTIN/UPC).',
    a: ['skuId', 'ean/upc/gtin', 'packType', 'packSize', 'uomConversions', 'priceSegment', 'isVolumeDriveProduct', 'isSellable/isReturnable', 'skuStatus', 'newProductFlag', 'statCaseFactor', 'abcCode', 'materialClass (ZFIN/ZSEM/ZRAW/ZPAC)', 'bomId', 'mpg', 'brandFamily/brandVariant'],
    ev: 'tobacco major Data Dictionary V4.0 · trade-transformation master-data spec v1.0 · HPC major group data warehouse Master Data List · TPM-program requirements',
  },
  {
    id: 'outlet',
    n: 'CustomerOutlet',
    d: 'spine',
    def: 'The demand-side counterparty at every level. Layer model: Outlet → Delivery Point → Legal Customer → Retail Account → Supplier (multi-layer). Finance ladder: Class of Trade → Parent → Planning Account → Sold-to → Ship-to.',
    a: ['customerCode', 'tradeChannelCode (~40 codes)', 'outletType/subType', 'ownershipType (COCO/DODO/INDEP)', 'volumeClass (1–9)', 'shopperChannel', 'creditPeriod/creditLimit', 'geoCoordinates', 'weightOfOutlet', 'oosRate', 'facingShare', 'suggestedAssortment', 'creditScore', 'churnPropensity', 'footfall', 'planningAccount', 'soldTo/shipTo'],
    ev: 'beverage bottler Outlet Data Solution · tobacco major Data Dictionary · HPC major Customer Profitability reference · the TPM program account model',
  },
  {
    id: 'geo',
    n: 'GeographyNode / Territory',
    d: 'spine',
    def: 'Commercial geography — each field-force type may carry its own territory hierarchy over the same outlets. Chain: Outlet → Route/Beat → Territory → Area → Region → End Market → Cluster → Global Region; supply variant Sales Area ↔ Depot with lead-time maps.',
    a: ['nodeId', 'level', 'parentId', 'ffType', 'urbanRuralFlag', 'salesArea', 'depot', 'leadTimeMap'],
    ev: "TMD KPIs dimension sheets · trade-transformation master-data spec · tobacco major's driver-management forecasting model workshop",
  },
  {
    id: 'time',
    n: 'TimePeriod',
    d: 'spine',
    def: 'Dual calendar/fiscal date spine plus the FMCG-specific cycle/campaign grain. Conventions: MTD/QTD/YTD/CTD + prior-period comparatives; performance period vs posting period; as-is vs as-was reporting.',
    a: ['calendarDate', 'fiscalPeriod', 'adjustmentPeriod (P13)', 'cycle/campaign', 'performancePeriod', 'postingPeriod', 'asWasFlag'],
    ev: 'Indian FMCG major MT date dimension · tobacco major CC DATE_DIM · HPC major customer-profitability reference · CPG Template principles',
  },
  {
    id: 'org',
    n: 'OrganizationNode',
    d: 'spine',
    def: 'Company → division/BU → function → cost/profit center → role → employee. Roles are first-class: KPI dictionaries assign each metric an owning role dashboard with RAG thresholds (line of sight).',
    a: ['nodeId', 'nodeType', 'parentId', 'roleName', 'kpiOwnership[]', 'ragThresholds', 'costCenter', 'profitCenter'],
    ev: 'tobacco major Outlet Dashboard specs · HPC major dashboard landscapes · bakery group SCM org charts',
  },

  /* ============ RTM ============ */
  {
    id: 'distributor',
    n: 'Distributor / Wholesaler',
    d: 'rtm',
    def: 'The indirect-RtM intermediary carrying the three sales flows: primary (manufacturer→distributor, sell-in), secondary (distributor→outlet, sell-out), tertiary (outlet→consumer).',
    a: ['distributorId', 'type (WS/distributor, multi-layer)', 'marginStructure', 'warehouses[]', 'servedOutlets[]', 'dcRdcPlantMapping', 'creditLimit', 'receivables', 'pipelineStock', 'sellOutFeedStatus'],
    ev: 'food major TM&D analytics + a distributor-reporting platform RFP · bakery group / diversified manufacturer secondary-sales model · tobacco major DSS workstream',
  },
  {
    id: 'rep',
    n: 'FieldForceRep',
    d: 'rtm',
    def: 'The field seller/merchandiser. Call economics derived per rep: productive-call %, average vs break-even drop size, plan/route/time-standard adherence.',
    a: ['repId', 'ffType (promptSales/preSales/TMR/merchandiser/telesales)', 'supervisor', 'depot', 'skillGrade', 'handheldId', 'incentivePlanId', 'callRate', 'costPerCall', 'avgDropSize', 'breakEvenDropSize'],
    ev: 'field performance-management model · TMD KPIs · salesforce-incentive deck',
  },
  {
    id: 'coverage',
    n: 'CoveragePlan (TCP / TCR)',
    d: 'rtm',
    def: 'Decides who visits which outlet how often. TCP sets universe/FF-type/frequency; TCR is the periodic capacity-vs-demand review consolidating workload from coverage, assortment, media and incentive plans with scenario levers.',
    a: ['outletUniverse', 'coveredFlag', 'ffTypeAssignment', 'callFrequency', 'callType', 'workloadMinutes', 'capacityMinutes', 'scenarioLevers', 'approvalBody'],
    ev: 'SAO Toolkit · TCR Final process flow · trade-planning analysis deck',
  },
  {
    id: 'assortment',
    n: 'AssortmentPlan (SAO / SAT)',
    d: 'rtm',
    def: 'Check→Plan→Act assortment object: core range / must-stock lists by outlet cluster, target distribution by SKU, rationalization; SAT is the outlet-level target whose achievement is SAT compliance %.',
    a: ['outletCluster', 'skuCapacityByVolumeClass', 'coreRange[]', 'mustStockList[]', 'targetDistributionBySku', 'delistings[]', 'cycleInstructionId', 'satCompliancePct'],
    ev: 'SAO Toolkit (+ SKU Distribution Optimiser & Assortment Generator)',
  },
  {
    id: 'call',
    n: 'CallVisit',
    d: 'rtm',
    def: 'The atomic execution event: activities executing plans, surveys, stock count, audit, order capture — with GPS stamp and productive/partial/unproductive outcome.',
    a: ['callId', 'plannedFlag/adHoc', 'callType', 'activities[]', 'surveysTaken[]', 'stockCount[]', 'orderCaptured', 'callDuration', 'gpsStamp', 'outcome'],
    ev: 'trade-execution scope document · Execution@Outlet user journey · tobacco major Data Dictionary (Call, Survey suite)',
  },
  {
    id: 'audit',
    n: 'RetailAudit',
    d: 'rtm',
    def: 'Per product × outlet × date: isDistributed, isAvailable (→ OOS derived), facings, POSM inventory, planogram compliance, observed RSP (→ price-compliance index). External twin: Nielsen retail audit.',
    a: ['isDistributed', 'isAvailable', 'numFacings', 'posmInventory[]', 'planogramComplianceFlag', 'photoAuditRef', 'rspObserved', 'auditDate'],
    ev: 'tobacco major Data Dictionary Retail Audit entity · TMD KPI definitions · Indian FMCG major MT OOS/SOS audit facts',
  },
  {
    id: 'soq',
    n: 'SuggestedOrder (SOQ)',
    d: 'rtm',
    def: 'Recommendation object: baseline forecast + collaborative-filtering order enhancement → suggested quantity; tracked via acceptance, execution rate, serviceability (~85% baseline accuracy reported).',
    a: ['baselineForecast', 'orderEnhancement', 'suggestedQty', 'acceptanceFlag', 'executionRate', 'serviceability', 'forecastAccuracy'],
    ev: 'HPC major S&M analytics deck (AOP/ASOP) · field performance-management model',
  },
  {
    id: 'tci',
    n: 'TradeInvestment (TCI) / IncentiveScheme (CIS)',
    d: 'rtm',
    def: "The customer-facing money: front margin (customer's earn) + back-margin buckets; SONA and CROI derived. CIS: outlet-level incentive schemes with PfP/PfC buckets, enrolment, reward ledger, disputes.",
    a: ['frontMargin', 'backMarginBuckets[]', 'perMille', 'pctOfCptoNetOfTax', 'sona', 'croiIndex', 'schemeId', 'buckets (PfP/PfC-OOS/SAT/RSP)', 'enrolledOutlets[]', 'rewardLedger', 'payoutPct'],
    ev: 'legacy trade-platform customer scorecard · trade-terms policy manual · CIS PfP/PfC KPI sub-catalog · B2B Engagement Platform requirements',
  },

  /* ============ TRADE ============ */
  {
    id: 'accountplan',
    n: 'AccountPlan',
    d: 'trade',
    def: 'Keyed planning account × brand × year; parent of promotions. Carries volume method (demand-planning baseline / % historic shipments / manual), loaded targets, plan rates, shipment-drop profiles and the approval state model.',
    a: ['volumeMethod (B&I Gold/Silver/TVP)', 'tfaTargets (growth%, grossSales$, tradeRate%, slotting$)', 'planRates (sraRate, cashDiscountRate)', 'shipmentDropProfile', 'stateModel'],
    ev: 'HPC-major TPM program Account Plan/Checkbook/SVP design · consumer-products manufacturer TPM manual',
  },
  {
    id: 'promotion',
    n: 'Promotion',
    d: 'trade',
    def: 'The promo event: status lifecycle Draft→Submitted→Planned→Committed→Closed with re-approval on budget breach; tactics; uplift% sourced from lift tables/TPO/manual; grain header→MPG→UPC-week; dead-net-price guardrail.',
    a: ['promotionId', 'status', 'performanceDates', 'shipmentDates', 'promotionType', 'tactics[] (TPR/display/feature/slotting/overlay)', 'pctAcv', 'upliftPct', 'scenarioFlag', 'grain', 'deadNetGuardrail'],
    ev: 'consumer-products manufacturer + the TPM program promotion-planning requirements · beauty major EMEA RFP',
  },
  {
    id: 'deal',
    n: 'Deal',
    d: 'trade',
    def: 'Settlement-facing child of a promotion: variable (off-invoice, bill-back, scan) or fixed (feature, display, slotting, overlay); cost = volume × rate × redemption% or lump sum; identifies the fund/GL it spends against.',
    a: ['dealType (variable/fixed)', 'subType', 'level (header/MPG/SKU)', 'estimatedCost', 'actualCost', 'redemptionPct', 'fundId', 'glMapping'],
    ev: 'the TPM program Deals & Settlements design · consumer-products manufacturer deductions requirements',
  },
  {
    id: 'fund',
    n: 'TradeFund / Checkbook',
    d: 'trade',
    def: 'Budget container mapped to GL codes with the lifecycle Budget → Planned → Committed → Expended → Free Balance (= budget − committed − expended); live accruals convert liability to expense on shipment; kept open ~1yr post plan-year.',
    a: ['fundId', 'fundType (fixed/accrual)', 'parentChildWithReserve', 'spendCategories[]→glAccounts', 'freeBalance', 'liveAccrualForecast', 'closingWindow'],
    ev: 'consumer-products manufacturer Fund Management requirements · the TPM program checkbook design',
  },
  {
    id: 'deduction',
    n: 'Deduction',
    d: 'trade',
    def: 'AR event — customer short-pays an invoice; matched to deals via resolutions (deal/no-deal), performance date must fall inside the deal window, reason code ties to GL; small deductions auto write-off; repay link for invalid ones.',
    a: ['deductionCode', 'amount', 'status', 'reasonCode→glAccount', 'resolutions[]', 'performanceDate', 'autoWriteOffThreshold', 'repayLink', 'erpRoundTrip'],
    ev: 'consumer-products manufacturer Deductions/Claims/Settlement requirements · TPM-program as-built',
  },
  {
    id: 'claim',
    n: 'Claim / CheckRequest',
    d: 'trade',
    def: 'Customer- or broker-submitted settlement with deal and no-deal payments; remaining amount = request − deal − no-deal; SAP check/credit-memo round-trip; post-audit and pre-pay variants.',
    a: ['claimId', 'claimType', 'payments[] (deal/noDeal)', 'remainingAmount', 'sapCheckNo', 'creditMemoNo', 'postAuditFlag', 'prePayFlag'],
    ev: 'consumer-products manufacturer + the TPM program settlement requirements',
  },
  {
    id: 'pricelist',
    n: 'PriceList / ADL',
    d: 'trade',
    def: 'Single list price + COGS + dead-net floors per country/division; ADL = account × product intersection carrying retail price, distribution flags with effective dates and store counts per GTIN (drives %ACV).',
    a: ['listPrice', 'cogs', 'deadNetPriceEdla', 'deadNetPriceScan', 'adl: retailPrice', 'inOutDistributionFlags', 'storeCountPerGtin', 'caseConversionFactors'],
    ev: 'TPM-program requirements · beauty major price-group spec',
  },
  {
    id: 'lift',
    n: 'LiftModel / TPO',
    d: 'trade',
    def: 'The econometric object: log-log mixed-effects demand model decomposing sales into base / trade promo / consumer promo / competition / halo / cannibalization; true lift & true ROI; what-if simulators and scheme recommendation engines.',
    a: ['modelForm (log-log mixed effects)', 'decomposition[]', 'trueLift', 'trueRoi', 'whatIfSimulator', 'schemeRecommender (genetic algo, Lagrange slabs)', 'dataRequirements (2yr invoice-level sales)'],
    ev: 'global brewer TPO approach · beverage bottler Trade Analytics · smokeless-tobacco company workshop',
  },
  {
    id: 'g2n',
    n: 'GrossToNetWaterfall',
    d: 'trade',
    def: 'The revenue-side P&L contract between the commercial domains and finance. Three verbatim instances: beer (GT → duty → conditional/unconditional discounts → NT), HPC (GS → SRA → trade → realized → net → GP → marketing profit), tobacco (CPTO net of tax → TCI → supplier share).',
    a: ['waterfallInstance (beer/HPC/tobacco)', 'lineItems[]', 'conditionalVsUnconditional', 'sraSubtotal', 'totalTrade', 'realizedSales', 'marketingProfit', 'cptoNetOfTax', 'tciBlock'],
    ev: 'High Level PnL Structure xlsx · HPC major Customer Profitability reference · tobacco major trade-terms policy manual',
  },

  /* ============ MARKETING ============ */
  {
    id: 'consumer',
    n: 'Consumer / LoyaltyMember',
    d: 'marketing',
    def: 'The end consumer with identity, demographics, contactability, tier and points; scored with engagement, share of wallet, churn propensity, NPS, LTV; ~68-column physical schema evidenced.',
    a: ['customerId', 'loyaltyId', 'demographics', 'contactabilityFlags', 'tier', 'pointsBalance', 'registrationChannel', 'engagementScore', 'shareOfWallet', 'churnPropensity', 'nps', 'ltv', 'rfmProfile'],
    ev: 'Shopperinsight customer attributes · CVM Data Dictionary · persona decks',
  },
  {
    id: 'segment',
    n: 'Segment / Persona',
    d: 'marketing',
    def: 'Segment: typed (value/behaviour/attitude) with parameters, centroids and archived assignments. Persona: narrative instance on micro-segments with propensity-score matching, evolution stages and functional/emotional needs; white-space method exposes underserved segments.',
    a: ['segmentId', 'segmentType', 'parameters', 'centroid', 'archivedAssignments[]', 'referencePersona', 'propensityScoreMatch', 'evolutionStage', 'functionalNeed', 'emotionalNeed'],
    ev: 'CVM data model · Persona Development Approach · a vaping product line lifecycle · brewer beer personas',
  },
  {
    id: 'campaign',
    n: 'Campaign',
    d: 'marketing',
    def: 'Hierarchy Marketing Plan → Program → Stage → Campaign → Wave → Offer → Communication → Response; measured TG-vs-CG with incremental response/spend, cost and ROI; contact-fatigue rules.',
    a: ['objective', 'targetGroup/controlGroup/referenceGroup', 'channel', 'sourceCode', 'wave', 'offer', 'incrementalResponse', 'incrementalSpend', 'campaignCost', 'campaignRoi', 'contactFatigueRules'],
    ev: 'Shopper Insights user guide · CVM metrics workbook',
  },
  {
    id: 'media',
    n: 'Touchpoint / MediaSpend',
    d: 'marketing',
    def: 'Channel taxonomy (paid/owned/earned × ATL/BTL/TTL × digital × physical) and the Nielsen-style spend record: market → advertiser → category → product → media → network → outlet × period, with companion TRP data.',
    a: ['channelClass (paid/owned/earned)', 'atlBtlTtl', 'mediaType', 'network', 'outlet (title/station)', 'spend', 'trp'],
    ev: 'oral-care major media-spend & TRP samples · Traditional ATL/BTL deck · MPM KPI catalogue',
  },
  {
    id: 'cdp',
    n: 'CDPProfile / IdentityKey',
    d: 'marketing',
    def: 'Identity resolution: hard keys (phone, email), private keys (cookie, device), soft keys (name, address, IP), unmatched pool re-matched later; pipeline sources → match → unified store → segmentation → activation/syndication. CDP ≠ DMP ≠ CRM distinctions evidenced.',
    a: ['hardKeys', 'privateKeys', 'softKeys', 'unmatchedPool', 'unifiedProfileStore', 'activationSyndication (DMP/DSP/CRM)'],
    ev: 'Indian FMCG major CDP Technical Solution Design (AWS) · CDP assessment framework · a web-personalization CDP data model',
  },
  {
    id: 'research',
    n: 'MarketResearch / SocialSignal',
    d: 'marketing',
    def: 'MR study objects (U&A, concept test, conjoint/MaxDiff/TURF, NPS, brand equity) across the product lifecycle; social listening signals (mentions, sentiment, influencers, crisis alerts) as command-center consumables.',
    a: ['studyType', 'mode (online/phone/F2F)', 'lifecycleStage', 'panelSource (Nielsen/IRI/Kantar)', 'mentions', 'sentiment', 'influencers[]', 'crisisAlerts'],
    ev: 'Market Research Overview · a social-listening platform · Rapid Insight hypothesis library',
  },

  /* ============ SUPPLY ============ */
  {
    id: 'forecast',
    n: 'DemandForecast',
    d: 'supply',
    def: 'The demand signal: FCSTRPT schema (demand unit/group/location, base vs non-base history & forecast), decomposition into base + influenced demand, driver models (WAS × seasonality × elasticity × calendar), 27-method library + ML, abnormal-demand log.',
    a: ['demandUnit (SKU)', 'demandGroup', 'location', 'baseHist/nonBaseHist', 'baseFcst/nonBaseFcst', 'fcstDate', 'modelType', 'decomposition', 'methodLibrary (27 + ML)', 'abnormalDemandLog', 'consensusVariance'],
    ev: 'HPC major FCSTRPT export · tobacco major Demand Forecast Workshop (driver-management model) · Anaplan connected planning',
  },
  {
    id: 'sandop',
    n: 'S&OP Plan',
    d: 'supply',
    def: 'The 18-month rolling integrated plan run as a monthly 5-meeting cycle with named owners: Product Review → Demand Review → Supply & Material Review → Pre-S&OP → Executive S&OP; extends financially to gross profit and EBITDA with scenarios.',
    a: ['cycleMonth', 'meetings[] (owner, participants)', 'gapClosingActions[]', 'unconstrainedDemand', 'constrainedDemand', 'scenarioSet', 'financialExtension'],
    ev: 'bakery group S&OP IT Roadmap (5 meetings, owners, weekly calendar) · consultancy/Anaplan variant',
  },
  {
    id: 'supplyplan',
    n: 'SupplyPlan / RCCP',
    d: 'supply',
    def: 'Production & material response: requirement analyses, make-vs-subcontract, allocation & sourcing plans, constrained flags; RCCP maps SKU families to factory lines with speeds and scenario levers (speed/OEE, shift pattern, add line).',
    a: ['productionRequirement', 'rmRequirement', 'makeVsSubcontract', 'allocationPlan', 'sourcingPlan', 'constrainedFlag', 'skuFamily→factoryLine', 'lineSpeed', 'utilizationPct', 'scenarioLevers'],
    ev: 'Anaplan SC planning deck · bakery group planning org',
  },
  {
    id: 'inventory',
    n: 'InventoryPosition / Policy',
    d: 'supply',
    def: 'Position per SKU × location (net stock, open orders, inbound STOs, days of supply) and MEIO-optimized policy: segmentation → service targets → optimization minimizing carrying + lost-sales + replenishment cost; slow-moving (>18d) and remnant (>90d) flags.',
    a: ['totalStock', 'netStockAvailable', 'openSalesOrders', 'pendingInboundStos', 'businessDaysOfSupply', 'segmentation', 'serviceLevelTarget', 'safetyStock', 'strategy (MTS/MTO/VMI)', 'slowMovingFlag', 'remnantFlag'],
    ev: 'MEIO framework (Anaplan deck) · HPC major SMR reports & stock classes',
  },
  {
    id: 'network',
    n: 'NetworkNode / Lane',
    d: 'supply',
    def: 'Physical network: supplier → factory → hub → RDC/DC/wholesale point → customer; nodes carry capacity, costs and days-of-supply norms; lanes carry mode, freight cost, lead time, FTL constraints. Redesign is a regular exercise.',
    a: ['nodeType', 'capacity', 'fixedOpeningClosingCost', 'handlingCost', 'dosNorm', 'lane: mode', 'freightCost', 'leadTime', 'ftlConstraints', 'moq'],
    ev: 'Network Design & Optimization RACI (Llamasoft/JDA) · industry benchmark (2016/18) benchmark',
  },
  {
    id: 'orders',
    n: 'SupplyOrders (SO/STO/PO/Shipment)',
    d: 'supply',
    def: 'The transactional movement objects: sales orders, stock transfer orders, purchase orders (PO vs non-PO), shipments with carriers and late-reason categories, trailer loads, pallets, invoices (3-way match).',
    a: ['salesOrder', 'stockTransferOrder', 'transferOrder', 'purchaseOrder', 'shipment (carrier, lateReason)', 'trailerLoad', 'pallet', 'invoice (3-way match)'],
    ev: 'HPC major SC metric model & information model',
  },
  {
    id: 'supplier',
    n: 'Supplier / ProcurementCategory',
    d: 'supply',
    def: 'Vendor master with OTIF, lead time, reject/waiver rates and scorecards; category taxonomy direct (raw materials, packaging, logistics) vs indirect & traded; savings initiatives with the pipeline identified → approved → budgeted → booked and the finance-to-procurement bridge.',
    a: ['vendorId', 'categoryAssignment', 'otif', 'leadTime', 'rejectRate', 'waiverRate', 'concentrationShare', 'scorecard', 'savingsPipelineStage', 'commodityPriceVsBudget', 'contractCoverage'],
    ev: 'bakery group procurement org + dashboard vision · strategy consultancy digital-procurement booklet (12 use cases)',
  },

  /* ============ MFG ============ */
  {
    id: 'plant',
    n: 'Plant / Line / Machine',
    d: 'mfg',
    def: 'Region → site → production line → machine → shift → operator; carries line speeds, changeover matrices, raw OEE (observed ~40–50% on real lines) and capacity utilization.',
    a: ['lineSpeed', 'plannedRunTime', 'changeoverMatrix', 'rawOee', 'capacityUtilization', 'shift', 'operator'],
    ev: 'HPC major plant financial report + manufacturing metric model · tobacco major global MES program',
  },
  {
    id: 'prodorder',
    n: 'ProductionOrder / BOM',
    d: 'mfg',
    def: 'The make event: planned vs actual quantity, TECO timestamp (→ production lead time), yield, verbatim variance formulas (labour efficiency, material usage/price); BOM with costing and the 42-day on-time release rule.',
    a: ['orderId', 'plannedQty/actualQty', 'tecoTimestamp', 'productionLeadTime', 'yield', 'varianceSet', 'bom: costedFlag', 'releaseWindow (42-day)', 'bomAccuracy'],
    ev: 'HPC major manufacturing metric model · quality scorecard',
  },
  {
    id: 'quality',
    n: 'Maintenance / Quality / LossEvent',
    d: 'mfg',
    def: 'Maintenance (notification→order, MTTR/MTBF, preventive vs breakdown), quality records (NCR, complaints PPM, RFT, rework/recall, vendor rejects) and the OEE loss tree (availability / performance / quality losses) with waste causality.',
    a: ['mttr', 'mtbf', 'pmCompletionPct', 'preventiveVsBreakdownRatio', 'ncr', 'complaintsPpm', 'rft', 'reworkCost', 'lossClass (availability/performance/quality)', 'wasteCategory', 'dartRate'],
    ev: 'HPC major metric model — manufacturing (verbatim formulas) · tobacco major digital-manufacturing booklet',
  },

  /* ============ NPD ============ */
  {
    id: 'npd',
    n: 'NPDProject',
    d: 'npd',
    def: 'The innovation pipeline object: gate status, project class, launch window × country, pipeline value (k€) with deltas vs prior snapshot, FY1/Y2 sales & GP%, health RAGs, private-label and on-hold flags.',
    a: ['projectId', 'market(s)', 'brand', 'skuCount', 'gateStatus', 'projectClass', 'launchWindow', 'pipelineValueKeur', 'fy1Sales/y2Sales/gpPct', 'healthRags', 'onHoldFlag'],
    ev: 'bakery group NPD pipeline + 1-pager · HPC major NPI review',
  },
  {
    id: 'gate',
    n: 'Gate',
    d: 'npd',
    def: 'Stage-gate governance: Discovery → Charter → Feasibility → Development → Qualification → SKU/Launch approval → Implementation (or G1/G2 embedded in the S&OP cycle); investment decisions precede approval.',
    a: ['gateMeetingDate', 'approvalType', 'sandOPCycleLink', 'ragStatuses'],
    ev: 'HPC major NPD Apr-16 NPI review · bakery group gate labels',
  },
  {
    id: 'launch',
    n: 'LaunchRecord',
    d: 'npd',
    def: 'Per SKU × retailer: presentation date, listing decision, in-store date target vs actual, marketing & production dates, distribution build (store counts, WTD%), price point, exclusivity — reviewed post-launch vs the launchgate case.',
    a: ['presentationDate', 'listingDecision', 'inStoreDateTargetActual', 'distributionBuild (stores, wtdPct)', 'pricePoint', 'exclusivityFlag', 'vsLaunchgateReview'],
    ev: 'HPC major NPD Tracker 2016 · UK NPD 2015 summary',
  },

  /* ============ FINANCE ============ */
  {
    id: 'pnl',
    n: 'PnL ReportingLineItem',
    d: 'finance',
    def: 'The account roll-up (BPC RLI pattern) instantiating a gross-to-net waterfall down to net income; fourth instance: global brewer IBP with MACO (= gross turnover − variable industrial − variable logistics cost) → ZBB → EBITDA → operational free cash flow.',
    a: ['rliCode', 'parent', 'sign', 'formulaRefs (ISP%, retention, MPC/statCase)', 'granularityMatrix (SKU vs brand vs company)', 'maco', 'zbbBlock'],
    ev: 'PNL Report by RU and PC1 (beverage major BPC) · HPC major consolidated P&L · Anaplan COE overview',
  },
  {
    id: 'version',
    n: 'PlanningVersion / Scenario',
    d: 'finance',
    def: 'Version set: actual · plan/budget (annual plan, 1YP) · reforecasts (PPR-n = n months actual + remainder forecast) · latest estimate · prior year · constant-FX variants · scenarios; performance vs posting period; organic flags; ZBB workflow.',
    a: ['versionType', 'pprN', 'latestEstimate', 'constantFxVariants', 'organicFlag', 'driverBasedInputs', 'zbbWorkflow'],
    ev: 'HPC major BPC dimension set + Finance MoM (PPR cycle) · beverage group FP&A proposal · global-brewer ZBB',
  },
  {
    id: 'profitability',
    n: 'ProfitabilityRecord',
    d: 'finance',
    def: 'Performance-date-based customer × SKU P&L, COPA-extended: full G2N to marketing profit with allocation logic, TPM-liability reconciliation, cost-to-serve extension and the CPP margin ladder (material → contribution → plant margin); whale-curve analysis.',
    a: ['grain (customer × brand/MPG × size × month)', 'allocationLogic', 'tpmLiabilityReconciliation', 'costToServe', 'marginLadder (MM→CM→PM)', 'whaleCurve'],
    ev: 'HPC major Customer Profitability reference + solution options · nutrition group CPP · dairy cooperative EPM',
  },
  {
    id: 'debtor',
    n: 'DebtorPosition / CreditPolicy',
    d: 'finance',
    def: 'Receivables analytics: ARDSO, ageing buckets with migration % (leading bad-debt indicator), follow-up efficiency, dispute taxonomy, Altman Z-score banding, payer-behaviour segments, insured exposure, provisioning models.',
    a: ['arDso', 'ageingBuckets[]', 'bucketMigrationPct', 'overduePct', 'doubtfulRule (>120d)', 'followUpEfficiency', 'disputes[]', 'zScore', 'payerBehaviourSegment', 'insuredExposure', 'creditOverrides'],
    ev: 'nutrition group metric lists + debtor dashboards (verbatim formulas) · HPC major working-capital report',
  },
  {
    id: 'coe',
    n: 'PlanningCoE / EPM Model',
    d: 'finance',
    def: 'The governance object: 4 operating-model structure options, hub-spoke-crew roles, 90-day scorecards and SLA tiers; v1.1 adds the CFO-agenda pillars, the 4-phase finance-transformation lifecycle, the Lagging→Pioneering maturity model, shared-services scope and finance-cost benchmarks (median 1.24% of sales, best-in-class 0.61%; world-class close ≈2 days).',
    a: ['structureOptions[]', 'hubSpokeCrewRoles', 'ninetyDayScorecard', 'slaTiers', 'epmMaturity', 'cfoAgendaPillars[]', 'transformationLifecycle', 'maturityModel (Lagging→Pioneering)', 'sharedServicesScope', 'financeCostPctSales'],
    ev: 'global-brewer planning-CoE decks · tobacco major Approach for Planning COE · consultancy CFO-agenda deck · FPM practice decks · benchmark studies',
  },
  {
    id: 'costing',
    n: 'CostingAllocationModel',
    d: 'finance',
    def: 'The formal costing machinery: standard costing (4-element system, management by exception) with the full variance taxonomy (material price/usage incl. mix & yield, labour, overhead expenditure/efficiency/volume, planning vs operational), marginal vs absorption reconciliation, two-stage ABC and time-driven ABC, the cost build-up ladder and shared-services chargeback (actual-cost vs standard-price; waterfall/recursive/reciprocal).',
    a: ['costingTechnique', 'standardCostingSystem', 'varianceTaxonomy', 'costBuildUpLadder (Prime→Works→COGM→COGS→COS)', 'abcCalculationPath', 'tdAbcTimeEquations', 'absorptionMechanics', 'sharedServicesChargeback', 'idleCapacityCost', 'responsibilityCenterTaxonomy'],
    ev: 'professional-accounting-body costing guides (verbatim) · FPM costing framework & battle cards · worked ABC examples · shared-services costing white papers',
  },
  {
    id: 'treasury',
    n: 'TreasuryFunction / WC Program',
    d: 'finance',
    def: 'The instrument-and-program layer above DebtorPosition: treasury lead roles (survey-evidenced), the CCC managed through the P2P / Forecast-to-Fulfill / O2C process triad, working-capital governance splits, financing instruments (reverse factoring, factoring, forfaiting, cash pooling), bad-debt value management, and sector WCR/CCC benchmarks.',
    a: ['treasuryLeadRoles[]', 'strategicShift', 'cccProcessTriad (P2P/F2F/O2C)', 'wcGovernance', 'instruments[]', 'badDebtValueMgmt', 'benchmarks (WCR 15–25% consumer goods)'],
    ev: 'treasury-association & pan-European treasurer surveys · Big-4/strategy-consultancy WC papers · FPM working-capital offering · treasury case studies',
  },
  {
    id: 'riskctrl',
    n: 'RiskControlFramework',
    d: 'finance',
    def: 'Governance, risk & internal control: control components (environment → risk assessment → response → control activities → monitoring), risk/control universes with fraud flags, DOA & SOD matrices, KRIs, 100%-population risk analytics, the full P2P policy anatomy (verbatim thresholds, 3-way match, 11 KPIs), and accounting-standard events (IAS 36 impairment, dual-GST mechanics).',
    a: ['controlComponents[]', 'riskUniverse/controlUniverse', 'doaMatrix', 'sodMatrix', 'kriRepository', 'riskAnalyticsMode (100% population)', 'policyAnatomy (P2P)', 'accountingStandardEvents (IAS 36, GST)', 'emergingRiskErm'],
    ev: 'FPM GRC capability decks · risk-analytics offering · GCC services company P2P policy (worked artifact) · Big-4 IAS 36 guide · GST readiness decks',
  },
  {
    id: 'valuation',
    n: 'ValuationModel / StatementAnalysis',
    d: 'finance',
    def: 'Financial statement analysis and enterprise valuation: the four-category ratio taxonomy (verbatim formulas incl. DuPont), analytical-restatement plays (LIFO↔FIFO, OBS add-backs, consolidation recasts), enterprise DCF ↔ economic-profit equivalence (EVA/CFROI/MVA), residual-income models, target-multiple formulas from ROIC/WACC/g, and M&A synergy-premium logic.',
    a: ['ratioTaxonomy (activity/liquidity/solvency/profitability)', 'analyticalRestatements[]', 'dcfModel (NOPLAT, FCF, continuing value)', 'economicProfitEquivalence', 'residualIncomeModel', 'targetMultiples (EV/EBITDA, P/E, PEG…)', 'maSynergyLogic', 'riskPredictionModels (Z-score lineage)'],
    ev: 'statement-analysis courseware (incl. a beverage major\'s bottler-consolidation recast) · strategy-consultancy valuation handbook & model · investment-bank multiples primer · academic EVA/CFROI references',
  },
  {
    id: 'epmplat',
    n: 'EPMPlatformModel',
    d: 'finance',
    def: 'The technology object finance runs on: the canonical five-component CPM suite (BP&F, profitability modeling, strategy management, consolidation & close, reporting & disclosure), a 17-dimension reference planning model, the ABC allocation engine\'s calculation path, implementation methodology (phased releases, parallel run, hypercare; failure statistics), and the platform landscape with cloud-vs-on-premise economics.',
    a: ['cpmSuiteComponents[] (5)', 'referenceDimensionModel (17 dims)', 'allocationEngine (LineItem→Driver→Activity→CostObject)', 'implementationMethodology', 'platformLandscape', 'integrationPatterns (drill-back, audit trail)'],
    ev: 'analyst-research suite definitions (verbatim) · wind-turbine manufacturer 17-dimension blueprint · bank shared-services costing re-engineering · glass-manufacturer phased implementation · platform white papers',
  },

  /* ============ ECOM ============ */
  {
    id: 'web',
    n: 'WebSession / eB2BOrder',
    d: 'ecom',
    def: 'Digital ordering & behaviour: web sessions with UTM/funnel attributes; eB2B orders with order-method (platform vs call centre — the adoption metric), deal incrementality, cart abandonment. Adoption datum: B2B ~40% of sales → 70% ambition.',
    a: ['utmParams', 'funnelSteps', 'device/geo', 'orderMethod (platform vs callCentre)', 'customerTier', 'dealIncrementality', 'cartAbandonmentEvent', 'channelSwitchFlag'],
    ev: 'global brewer B2B Overall Brief · B2B Engagement Platform requirements',
  },
  {
    id: 'd2c',
    n: 'D2CLead / FunnelStage',
    d: 'ecom',
    def: 'Direct-to-consumer funnel: leads by source (popup, email capture, referral, SEO), stages acquire → convert → retain → advocacy, HyperCare trial check-ins, party-of-sale (1st/2nd/3rd); common consumer key as the data-maturity gate.',
    a: ['lead (email, sourceChannel)', 'funnelStage (ACR)', 'hyperCareCheckIns', 'partyOfSale', 'commonConsumerKey'],
    ev: 'tobacco major D2C Activation framework · next-gen products ACR journey · vaping-brand e-commerce performance',
  },
  {
    id: 'benchmark',
    n: 'BenchmarkPeerSet / CategorySegment',
    d: 'ecom',
    def: 'Strategy objects: peer benchmarking (financial levers, operations KPIs, project-level process benchmarking) and category segmentation with per-segment CAGR, share and decline drivers.',
    a: ['peerSet', 'financialLevers[]', 'method (financial/operations/process)', 'market→category→segment', 'segmentCagr', 'volumeShare', 'declineDrivers'],
    ev: 'global brewer Benchmarking 2013 + workbook · Market Overview for GAC',
  },

  /* ============ DATA ============ */
  {
    id: 'metric',
    n: 'MetricDefinition',
    d: 'data',
    def: 'The atom of the measurement system — the metric-model row: name, base data, source system, verbatim formula, UOM, time grains, dimension flags, priority, complexity, owning role, RAG thresholds, non-aggregation rules. 600+ catalogued; the join between business ontology and BI.',
    a: ['area/function', 'metricName', 'baseData', 'dataSource (t-codes)', 'formula', 'uom', 'timeGrains[]', 'dimensionFlags[]', 'priority', 'technicalComplexity', 'leadLagClass', 'owningRole', 'ragThresholds', 'nonAggregationRule'],
    ev: 'Metric List Appendix A · HPC major metric models · tobacco major PI Metrics · MT Insights · nutrition group metric lists',
  },
  {
    id: 'fact',
    n: 'FactSubject',
    d: 'data',
    def: 'The transactional grains a CPG warehouse conforms (13-fact star pattern): sell-in · sell-out · syndicated sell-out · category sell-out · sales plan · estimates · fill rate (8 drop reasons) · OOS audit · SOS audit · asset visibility · promo implementation · competitor promo · P&L actuals.',
    a: ['factName', 'grain (dims subset)', 'dropReasonDecomposition', 'etlAuditColumns', 'syndicatedTwin (Nielsen/IRI)'],
    ev: 'tobacco major MT Sales Data Mart dictionary (27 dims / 13 facts)',
  },
  {
    id: 'hier',
    n: 'HierarchyNode (governance)',
    d: 'data',
    def: 'Three governed classes: source hierarchies (maintained in ERP, replicated), attribute fields (governed master-data groupings) and attribute hierarchies (hierarchy-like reporting from governed attributes); MDM obligations to keep mapping/text tables in sync.',
    a: ['hierClass (source/attributeField/attributeHierarchy)', 'maintainedIn', 'mappingTables', 'textTables', 'syncObligations'],
    ev: 'HPC major Business Hierarchies position paper · BW InfoObject design',
  },
  {
    id: 'source',
    n: 'SourceSystem',
    d: 'data',
    def: "The canonical CPG landscape (pattern): SAP ECC/BW/APO/DSD/BPC · CRM/SFA · planning engines · TPM · EPOS/retailer POS · EDI · distributor feeds · syndicated data · loyalty/web/social · MES/SCADA/LIMS · 3rd-party feeds; with MDM ownership per object and the lakehouse principle 'no tool connects directly to sources'.",
    a: ['systemId', 'dataDomains[]', 'extractMechanism', 'latency', 'mdmOwnership', 'lakehouseLayer (raw→enrich→serve→consume)'],
    ev: 'Data Assessment Report · tobacco major Data Platform Architecture v18 · HPC major & beverage group architectures',
  },
  {
    id: 'dq',
    n: 'DataQualityDefect / MDM',
    d: 'data',
    def: 'Logged defect classes (negative sell-in, share >100%, achievement >500%, plan = 0, drifting branch counts, missing history) and the MDM process: maturity ladder, six solution components, field-level CRUD ownership.',
    a: ['defectClass', 'affectedSource', 'mdmMaturityLevel', 'sixComponents', 'fieldOwnership (CRUD per SAP field)', 'numberingStandards (GDS/GDSN/RFID)'],
    ev: 'MT Insights DQ log · HPC major MDM discussion · group data warehouse master-data lists',
  },
  {
    id: 'usecase',
    n: 'AnalyticsUseCase',
    d: 'data',
    def: "The AI/ML portfolio object: algorithm class, maturity stage (descriptive→optimization), success probability, change-management risk ('planners might think their decision rights are taken away'), measured outcomes (TPO ROI 8→20; suggested order +3.2% revenue; MAPE 9–11%).",
    a: ['useCase', 'domain', 'algorithmClass', 'maturityStage', 'successProbability', 'changeManagementRisk', 'measuredOutcome', 'deliveryVehicle (command center)'],
    ev: 'CPG Advanced Analytics decks · tobacco major planning use-case matrix · HPC major Enterprise Analytics Roadmap',
  },
]

export const EDGES = [
  ['product', 'fact', 'conforms'],
  ['outlet', 'fact', 'conforms'],
  ['geo', 'fact', 'conforms'],
  ['time', 'fact', 'conforms'],
  ['org', 'fact', 'conforms'],
  ['fact', 'metric', 'computes'],
  ['metric', 'org', 'owned by role (line of sight)'],
  ['coverage', 'call', 'schedules calls'],
  ['assortment', 'call', 'deploys via cycle instructions'],
  ['assortment', 'outlet', 'sets SAT per outlet'],
  ['tci', 'coverage', 'adds incentive workload'],
  ['rep', 'call', 'executes'],
  ['rep', 'geo', 'covers territory'],
  ['call', 'audit', 'captures'],
  ['call', 'soq', 'generates'],
  ['soq', 'orders', 'becomes sales order'],
  ['distributor', 'outlet', 'supplies (multi-layer)'],
  ['distributor', 'fact', 'reports sell-out (DSR)'],
  ['audit', 'metric', 'derives OOS · WD · facing share'],
  ['audit', 'tci', 'measures PfP/PfC compliance'],
  ['tci', 'g2n', 'funds front & back margin'],
  ['tci', 'outlet', 'enrols in CIS'],
  ['assortment', 'forecast', 'feeds S&OP demand review'],
  ['distributor', 'debtor', 'carries receivables'],
  ['accountplan', 'promotion', 'parents'],
  ['accountplan', 'outlet', 'keyed on planning account'],
  ['promotion', 'deal', 'auto-creates'],
  ['deal', 'fund', 'spends against'],
  ['lift', 'promotion', 'sets uplift %'],
  ['pricelist', 'promotion', 'constrains range & dead-net floor'],
  ['deduction', 'deal', 'resolves against (accrual↔actual)'],
  ['claim', 'deal', 'settles (credit memo)'],
  ['fund', 'pnl', 'accrues into'],
  ['promotion', 'g2n', 'populates trade lines'],
  ['promotion', 'lift', 'post-event analysis (learning loop)'],
  ['promotion', 'forecast', 'promo uplift input'],
  ['deduction', 'profitability', 'restates to performance period'],
  ['source', 'cdp', 'identity resolution'],
  ['cdp', 'consumer', 'unifies profile'],
  ['consumer', 'segment', 'clustered into'],
  ['segment', 'campaign', 'targets'],
  ['campaign', 'media', 'delivers via'],
  ['campaign', 'metric', 'TG-vs-CG ROI'],
  ['media', 'pnl', 'marketing spend line'],
  ['segment', 'npd', 'white space feeds'],
  ['research', 'segment', 'hypothesis input'],
  ['research', 'campaign', 'evaluates'],
  ['campaign', 'consumer', 'responses enrich'],
  ['forecast', 'sandop', 'consensus input'],
  ['sandop', 'supplyplan', 'constrains (RCCP)'],
  ['supplyplan', 'prodorder', 'schedules production'],
  ['supplyplan', 'inventory', 'plans stock (MEIO)'],
  ['inventory', 'network', 'positioned across echelons'],
  ['network', 'orders', 'ships via lanes'],
  ['orders', 'outlet', 'delivers (OTIF)'],
  ['supplier', 'orders', 'fulfils POs'],
  ['supplier', 'pnl', 'PPV & savings bridge'],
  ['inventory', 'pnl', 'DIO → working capital'],
  ['orders', 'fact', 'fill-rate / OTIF facts'],
  ['orders', 'debtor', 'invoices age into'],
  ['prodorder', 'plant', 'runs on line'],
  ['plant', 'quality', 'losses & maintenance'],
  ['prodorder', 'pnl', 'DMC + variances'],
  ['quality', 'metric', 'OEE · PPM · RFT · DART'],
  ['product', 'prodorder', 'BOM / materials'],
  ['npd', 'gate', 'passes gates'],
  ['gate', 'sandop', 'rides S&OP cycle'],
  ['npd', 'launch', 'sell-in & launch'],
  ['launch', 'assortment', 'distribution build (missile)'],
  ['npd', 'product', 'creates SKUs'],
  ['npd', 'forecast', 'NPI curves'],
  ['g2n', 'pnl', 'instantiated as RLI tree'],
  ['pnl', 'version', 'versioned (actual/plan/PPR/LE)'],
  ['profitability', 'outlet', 'customer × SKU P&L'],
  ['profitability', 'g2n', 'reallocates waterfall'],
  ['debtor', 'pnl', 'DSO → C2C'],
  ['coe', 'version', 'governs planning'],
  ['web', 'outlet', 'eB2B ordering'],
  ['web', 'soq', 'platform order twin'],
  ['d2c', 'consumer', 'converts to consumer'],
  ['d2c', 'campaign', 'nurtured by'],
  ['benchmark', 'pnl', 'targets & peers'],
  ['costing', 'profitability', 'allocates (ABC / std costing)'],
  ['costing', 'pnl', 'variance & idle-capacity lines'],
  ['plant', 'costing', 'capacity supply & demand'],
  ['treasury', 'debtor', 'owns DSO program'],
  ['treasury', 'inventory', 'DIO lever'],
  ['treasury', 'supplier', 'DPO · supply-chain finance'],
  ['treasury', 'pnl', 'C2C & capital charge'],
  ['riskctrl', 'orders', '3-way match · SOD · DOA'],
  ['riskctrl', 'supplier', 'vendor-master controls'],
  ['riskctrl', 'pnl', 'impairment & provisions'],
  ['riskctrl', 'metric', 'KRIs & P2P KPIs'],
  ['version', 'valuation', 'forecasts feed DCF'],
  ['valuation', 'benchmark', 'target multiples'],
  ['valuation', 'pnl', 'values the statements'],
  ['epmplat', 'version', 'implements planning'],
  ['epmplat', 'pnl', 'consolidation & close'],
  ['epmplat', 'profitability', 'profitability engines'],
  ['epmplat', 'source', 'member of landscape'],
  ['source', 'fact', 'feeds'],
  ['hier', 'product', 'governs roll-ups'],
  ['hier', 'outlet', 'governs roll-ups'],
  ['hier', 'geo', 'governs roll-ups'],
  ['dq', 'source', 'profiles & masters'],
  ['dq', 'hier', 'maintains mappings'],
  ['usecase', 'metric', 'targets KPIs'],
  ['usecase', 'fact', 'consumes facts'],
]

export const FLOWS = [
  {
    t: 'Master spine',
    ids: ['product', 'outlet', 'geo', 'time', 'org', 'fact', 'metric'],
    x: '5 dimensions ──conform──▶ FactSubject ──computes──▶ MetricDefinition ──owned-by──▶ role dashboards',
  },
  {
    t: 'RtM execution loop',
    ids: ['coverage', 'assortment', 'tci', 'rep', 'call', 'audit', 'soq', 'orders', 'distributor', 'fact', 'forecast'],
    x: 'TCP/SAO/CIP ──▶ CallVisit ──▶ RetailAudit + SuggestedOrder ──▶ SalesOrder ──▶ Outlet; Distributor ──▶ sell-out; SAO ──▶ S&OP demand',
  },
  {
    t: 'Trade closed loop',
    ids: ['accountplan', 'promotion', 'deal', 'fund', 'deduction', 'claim', 'pricelist', 'lift', 'g2n'],
    x: 'AccountPlan ──▶ Promotion ──▶ Deal ──▶ Fund; short-pay ──▶ Deduction/Claim ──settle──▶ Deal; post-event ──learn──▶ LiftModel ──▶ next plan',
  },
  {
    t: 'Consumer engagement loop',
    ids: ['source', 'cdp', 'consumer', 'segment', 'campaign', 'media', 'research', 'npd'],
    x: 'Sources ──identity-resolve──▶ CDP ──▶ Consumer ──▶ Segment/Persona ──▶ Campaign ──▶ Touchpoints; white space ──▶ NPD',
  },
  {
    t: 'Plan-make-move loop',
    ids: ['forecast', 'sandop', 'supplyplan', 'prodorder', 'plant', 'quality', 'inventory', 'network', 'orders', 'supplier'],
    x: 'Forecast ──▶ S&OP ──▶ SupplyPlan/RCCP ──▶ ProductionOrder on Plant; MEIO stock across Network ──▶ Shipments (OTIF)',
  },
  {
    t: 'NPD lifecycle',
    ids: ['segment', 'npd', 'gate', 'sandop', 'launch', 'assortment', 'product', 'forecast'],
    x: 'White space ──▶ NPDProject ──gates ride──▶ S&OP ──▶ LaunchRecord ──▶ distribution build ──▶ new SKU demand',
  },
  {
    t: 'Money loop (finance hub)',
    ids: ['g2n', 'pnl', 'version', 'profitability', 'debtor', 'coe', 'tci', 'fund', 'media', 'prodorder', 'inventory'],
    x: 'Trade + marketing + COGS ──populate──▶ G2N ──▶ RLI tree ──versioned──▶ PPR/LE; customer×SKU P&L; C2C = DSO + DIO − DPO',
  },
  {
    t: 'Finance deep loop (v1.1)',
    ids: ['costing', 'profitability', 'pnl', 'plant', 'treasury', 'debtor', 'inventory', 'supplier', 'riskctrl', 'orders', 'version', 'valuation', 'benchmark', 'epmplat', 'coe'],
    x: 'Costing ──allocates──▶ Profitability ──▶ P&L; Treasury manages DSO/DIO/DPO ──▶ C2C; Controls gate P2P; Forecasts ──▶ DCF/EP ──▶ target multiples; EPM platform implements it all',
  },
]

/**
 * Computes canonical radial positions and box sizes for the FMCG ontology canvas,
 * adhering faithfully to the geometry of FMCG Ontology Graph.html.
 */
export function computeLayout() {
  const W = 1900
  const H = 1650
  const CX = 950
  const CY = 800

  const byId = {}
  const nodes = NODES.map((n) => ({ ...n, a: [...(n.a || [])] }))
  nodes.forEach((n) => {
    byId[n.id] = n
  })

  const domNodes = {}
  nodes.forEach((n) => {
    ;(domNodes[n.d] = domNodes[n.d] || []).push(n)
  })

  // spine ring in center
  const spineMeta = { ...DOMMETA.spine, cx: CX, cy: CY, r: 250 }
  if (domNodes.spine) {
    domNodes.spine.forEach((n, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / domNodes.spine.length
      n.x = CX + 170 * Math.cos(a)
      n.y = CY + 150 * Math.sin(a)
    })
  }

  // domain clusters
  const domMetas = {}
  ORDER.forEach((d, di) => {
    const a = -Math.PI / 2 + (di * 2 * Math.PI) / ORDER.length
    const cx = CX + 560 * Math.cos(a)
    const cy = CY + 520 * Math.sin(a)
    const dNodes = domNodes[d] || []
    const r = dNodes.length <= 3 ? 85 : dNodes.length <= 6 ? 150 : 185
    domMetas[d] = { ...(DOMMETA[d] || { n: d, c: '#4A5878' }), cx, cy, r }
    dNodes.forEach((n, i) => {
      const na = a + (i * 2 * Math.PI) / dNodes.length
      n.x = cx + r * Math.cos(na)
      n.y = cy + r * Math.sin(na)
    })
  })

  // box sizing and label wrapping
  nodes.forEach((n) => {
    const t = n.n
    if (t.length > 21) {
      const mid = Math.floor(t.length / 2)
      let best = -1
      for (let i = 0; i < t.length; i++) {
        if (t[i] === ' ' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i
      }
      if (best > 0) {
        n.l1 = t.slice(0, best)
        n.l2 = t.slice(best + 1)
      } else {
        n.l1 = t
      }
    } else {
      n.l1 = t
    }
    const wtext = Math.max((n.l1 || '').length, (n.l2 || '').length)
    n.w = Math.min(215, Math.max(105, wtext * 7.3 + 22))
    n.h = n.l2 ? 46 : 32
  })

  // precalculate edge coordinates (curved quadratic bezier arrows)
  const edges = EDGES.map(([srcId, tgtId, label], idx) => {
    const a = byId[srcId]
    const b = byId[tgtId]
    if (!a || !b) return null
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.sqrt(dx * dx + dy * dy) || 1
    const ux = dx / len
    const uy = dy / len
    const sx = a.x + ux * Math.min(len / 2, a.w / 2 + 6)
    const sy = a.y + uy * Math.min(len / 2, a.h / 2 + 8)
    const tx = b.x - ux * Math.min(len / 2, b.w / 2 + 10)
    const ty = b.y - uy * Math.min(len / 2, b.h / 2 + 12)
    const mx = (sx + tx) / 2 - uy * len * 0.09
    const my = (sy + ty) / 2 + ux * len * 0.09
    const d = `M${sx},${sy} Q${mx},${my} ${tx},${ty}`
    return {
      id: `e-${idx}`,
      srcId,
      tgtId,
      label,
      sx,
      sy,
      tx,
      ty,
      mx,
      my,
      d,
    }
  }).filter(Boolean)

  // adjacency map
  const adj = {}
  nodes.forEach((n) => {
    adj[n.id] = new Set()
  })
  edges.forEach((e) => {
    adj[e.srcId]?.add(e.tgtId)
    adj[e.tgtId]?.add(e.srcId)
  })

  return {
    W,
    H,
    CX,
    CY,
    nodes,
    byId,
    edges,
    domMetas,
    spineMeta,
    adj,
  }
}

const DYNAMIC_PALETTE = ['#2E6FCA', '#8A4FD0', '#C05A9E', '#2FA096', '#A0784A', '#4EA36A', '#6E7FBF', '#D08A3E', '#64748B']

/**
 * Computes radial positions, cluster halos, box sizing, and curved arrows
 * dynamically from any backend / LLM-generated nodes and edges while preserving
 * the exact same visual design language.
 */
export function computeDynamicLayout(rawNodes, rawEdges, activeDomain = 'all', domainMeta = null) {
  const W = 1900
  const H = 1650
  const CX = 950
  const CY = 800

  if (!rawNodes || rawNodes.length === 0) {
    return computeLayout()
  }

  const byId = {}
  const nodes = rawNodes.map((rn, idx) => {
    const id = String(rn.key || rn.id || `node-${idx}`)
    const n = String(rn.name || rn.n || id)
    const rawGroup = rn.group_key || rn.group_name || rn.d || 'general'
    const d = rawGroup.toLowerCase().replace(/[^a-z0-9]/g, '-')
    const groupName = rn.group_name || DOMMETA[d]?.n || rawGroup
    const color = rn.color || DOMMETA[d]?.c || DYNAMIC_PALETTE[idx % DYNAMIC_PALETTE.length]
    const def = rn.definition || rn.def || ''
    const a = Array.isArray(rn.attributes || rn.a)
      ? (rn.attributes || rn.a).map((attr) => (typeof attr === 'string' ? attr : attr.name || attr.key || ''))
      : []
    const f = Array.isArray(rn.formulas || rn.f)
      ? (rn.formulas || rn.f).map((frm) => (typeof frm === 'string' ? frm : frm.name || frm.expression || ''))
      : []
    const ev = rn.evidence || rn.ev || ''

    const nodeObj = {
      ...rn,
      id,
      key: id,
      n,
      name: n,
      d,
      group_key: d,
      group_name: groupName,
      color,
      def,
      definition: def,
      a,
      attributes: a,
      f,
      formulas: f,
      ev,
      evidence: ev,
    }
    byId[id] = nodeObj
    return nodeObj
  })

  // Group nodes by domain / cluster
  const domNodes = {}
  nodes.forEach((node) => {
    ;(domNodes[node.d] = domNodes[node.d] || []).push(node)
  })
  const groupKeys = Object.keys(domNodes)

  // Identify spine / central cluster
  const spineKey = groupKeys.find((k) => k === 'spine' || k.toLowerCase().includes('spine'))
  const spineMeta = {
    ...DOMMETA.spine,
    hasNodes: Boolean(spineKey && domNodes[spineKey]?.length > 0),
    n: spineKey ? (domNodes[spineKey][0]?.group_name || 'Master-data spine') : 'Master-data spine',
    c: DOMMETA.spine?.c || '#5A8AC3',
    cx: CX,
    cy: CY,
    r: 250,
  }

  const domMetas = {}

  if (spineKey && domNodes[spineKey]) {
    // Spine nodes on center ring
    domNodes[spineKey].forEach((n, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / domNodes[spineKey].length
      n.x = CX + 170 * Math.cos(a)
      n.y = CY + 150 * Math.sin(a)
    })

    // Other groups on surrounding orbital circles (aligned to canonical ORDER or sort order)
    const otherGroups = groupKeys
      .filter((k) => k !== spineKey)
      .sort((a, b) => {
        const ia = ORDER.indexOf(a)
        const ib = ORDER.indexOf(b)
        if (ia !== -1 && ib !== -1) return ia - ib
        if (ia !== -1) return -1
        if (ib !== -1) return 1
        return a.localeCompare(b)
      })
    otherGroups.forEach((d, di) => {
      const a = -Math.PI / 2 + (di * 2 * Math.PI) / otherGroups.length
      const cx = CX + 560 * Math.cos(a)
      const cy = CY + 520 * Math.sin(a)
      const dNodes = domNodes[d] || []
      const r = dNodes.length <= 3 ? 85 : dNodes.length <= 6 ? 150 : 185
      const groupColor = dNodes[0]?.color || DOMMETA[d]?.c || DYNAMIC_PALETTE[di % DYNAMIC_PALETTE.length]
      domMetas[d] = {
        n: dNodes[0]?.group_name || d,
        c: groupColor,
        cx,
        cy,
        r,
      }
      dNodes.forEach((n, i) => {
        const na = a + (i * 2 * Math.PI) / dNodes.length
        n.x = cx + r * Math.cos(na)
        n.y = cy + r * Math.sin(na)
      })
    })
  } else if (groupKeys.length === 1) {
    // Single domain: place nodes gracefully in celestial concentric orbital pattern
    const singleKey = groupKeys[0]
    const all = domNodes[singleKey] || []
    const groupColor = all[0]?.color || domainMeta?.color || '#2E6FCA'
    const groupTitle = all[0]?.group_name || domainMeta?.name || 'FMCG Knowledge Graph'

    domMetas[singleKey] = {
      n: groupTitle,
      c: groupColor,
      cx: CX,
      cy: CY,
      r: 320,
    }

    if (all.length <= 7) {
      all.forEach((n, i) => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / all.length
        n.x = CX + 280 * Math.cos(a)
        n.y = CY + 220 * Math.sin(a)
      })
    } else {
      const innerCount = Math.min(4, Math.floor(all.length / 2))
      const outerCount = all.length - innerCount

      for (let i = 0; i < innerCount; i++) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / innerCount
        all[i].x = CX + 190 * Math.cos(a)
        all[i].y = CY + 155 * Math.sin(a)
      }
      for (let i = 0; i < outerCount; i++) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / outerCount + Math.PI / outerCount
        all[innerCount + i].x = CX + 440 * Math.cos(a)
        all[innerCount + i].y = CY + 350 * Math.sin(a)
      }
    }
  } else {
    // Multiple groups without explicit spine: distribute groups evenly in celestial orbit
    groupKeys.forEach((d, di) => {
      const a = -Math.PI / 2 + (di * 2 * Math.PI) / groupKeys.length
      const dist = groupKeys.length <= 4 ? 420 : 540
      const cx = CX + dist * Math.cos(a)
      const cy = CY + (dist - 40) * Math.sin(a)
      const dNodes = domNodes[d] || []
      const r = dNodes.length <= 3 ? 90 : dNodes.length <= 6 ? 145 : 180
      const groupColor = dNodes[0]?.color || DYNAMIC_PALETTE[di % DYNAMIC_PALETTE.length]

      domMetas[d] = {
        n: dNodes[0]?.group_name || d,
        c: groupColor,
        cx,
        cy,
        r,
      }
      dNodes.forEach((n, i) => {
        const na = a + (i * 2 * Math.PI) / dNodes.length
        n.x = cx + r * Math.cos(na)
        n.y = cy + r * Math.sin(na)
      })
    })
  }

  // Box sizing and label wrapping
  nodes.forEach((n) => {
    const t = n.n
    if (t.length > 21) {
      const mid = Math.floor(t.length / 2)
      let best = -1
      for (let i = 0; i < t.length; i++) {
        if (t[i] === ' ' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i
      }
      if (best > 0) {
        n.l1 = t.slice(0, best)
        n.l2 = t.slice(best + 1)
      } else {
        n.l1 = t
      }
    } else {
      n.l1 = t
    }
    const wtext = Math.max((n.l1 || '').length, (n.l2 || '').length)
    n.w = Math.min(220, Math.max(105, wtext * 7.4 + 22))
    n.h = n.l2 ? 46 : 32
  })

  // Precalculate edge coordinates (curved quadratic bezier arrows)
  const edges = (rawEdges || []).map((re, idx) => {
    const srcId = String(Array.isArray(re) ? re[0] : (re.source || re.srcId || re.from || ''))
    const tgtId = String(Array.isArray(re) ? re[1] : (re.target || re.tgtId || re.to || ''))
    const label = Array.isArray(re) ? (re[2] || '') : (re.label || '')
    const a = byId[srcId]
    const b = byId[tgtId]
    if (!a || !b || srcId === tgtId) return null
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.sqrt(dx * dx + dy * dy) || 1
    const ux = dx / len
    const uy = dy / len
    const sx = a.x + ux * Math.min(len / 2, a.w / 2 + 6)
    const sy = a.y + uy * Math.min(len / 2, a.h / 2 + 8)
    const tx = b.x - ux * Math.min(len / 2, b.w / 2 + 10)
    const ty = b.y - uy * Math.min(len / 2, b.h / 2 + 12)
    const mx = (sx + tx) / 2 - uy * len * 0.09
    const my = (sy + ty) / 2 + ux * len * 0.09
    const d = `M${sx},${sy} Q${mx},${my} ${tx},${ty}`
    return {
      id: `e-${idx}`,
      srcId,
      tgtId,
      label,
      sx,
      sy,
      tx,
      ty,
      mx,
      my,
      d,
    }
  }).filter(Boolean)

  // Adjacency map
  const adj = {}
  nodes.forEach((n) => {
    adj[n.id] = new Set()
  })
  edges.forEach((e) => {
    adj[e.srcId]?.add(e.tgtId)
    adj[e.tgtId]?.add(e.srcId)
  })

  return {
    W,
    H,
    CX,
    CY,
    nodes,
    byId,
    edges,
    domMetas,
    spineMeta,
    adj,
  }
}
