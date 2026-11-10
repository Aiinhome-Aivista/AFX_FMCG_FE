/**
 * Business Impact & Plain Language Engine for Frontend
 * Converts technical diffs and validation gaps into plain language explanations,
 * business impact assessments, and clear action items for decision makers.
 */

export const BUSINESS_TERM_KNOWLEDGE = {
  tradespend: {
    title: 'Trade Promotion & Retailer Scheme Spend',
    title_en: 'Trade Promotion & Retailer Scheme Spend',
    explanation: 'Special discounts, cashbacks, or free sampling schemes offered to distributors and retailers.',
    impact: 'Post-invoice scheme costs cannot be tracked, risking budget overruns and margin erosion.',
    action: 'Retain this if your business utilizes dealer schemes or cash discounts.',
    severity: 'high',
  },
  promoplan: {
    title: 'Trade Promotional Campaign Planning',
    title_en: 'Trade Promotional Campaign Planning',
    explanation: 'Framework for planning seasonal and festive promotional campaigns and retailer schemes.',
    impact: 'Measuring scheme uplift, promo spend, and promo ROI becomes impossible without this entity.',
    action: 'Keep this entity to evaluate promotional profitability and sales uplift.',
    severity: 'high',
  },
  grosstonetwaterfall: {
    title: 'Gross-to-Net Revenue Reconciliation',
    title_en: 'Gross-to-Net Revenue Reconciliation',
    explanation: 'Reconciles gross invoice revenue down to net banked revenue after deducting discounts, damage returns, and taxes.',
    impact: 'Alterations will cause discrepancies between balance sheet gross billings and actual collected cash.',
    action: 'Carefully review and maintain this rule to protect audit compliance and cash flow visibility.',
    severity: 'high',
  },
  onoffinvoice: {
    title: 'On-Invoice vs Off-Invoice Deduction Policy',
    title_en: 'On-Invoice vs Off-Invoice Deduction Policy',
    explanation: 'Distinguishes upfront line-item discounts from retrospective turnover rebates and incentives.',
    impact: 'Untracked retrospective rebates cause revenue leakages and accounting mismatches.',
    action: 'Keep this if your commercial policy provides periodic turnover or volume rebates.',
    severity: 'medium',
  },
  accrualbasis: {
    title: 'Accrual Accounting Principle',
    title_en: 'Accrual Accounting Principle',
    explanation: 'Recognizes expenses and revenues upon fulfillment rather than waiting for cash settlement.',
    impact: 'Without accruals, monthly profit & loss reports will distort true commercial performance.',
    action: 'Maintain accruals for standard accounting and statutory financial audit compliance.',
    severity: 'medium',
  },
  deductionmethod: {
    title: 'Deduction Method Rules',
    title_en: 'Deduction Method Rules',
    explanation: 'Standardizes formula logic for percentage-based vs fixed deduction computations.',
    impact: 'Without defined logic, automated ERP/billing reconciliation fails and causes billing errors.',
    action: 'Retain deduction rules to align with ERP billing systems.',
    severity: 'medium',
  },
  secondarysales: {
    title: 'Secondary Sales (Distributor to Retail Outlet)',
    title_en: 'Secondary Sales (Distributor to Retail Outlet)',
    explanation: 'Tracks daily sales execution and off-take from distributor warehouses to retail stores.',
    impact: 'Lack of secondary sales visibility leads to bullwhip effects, stockouts, or overproduction.',
    action: 'Essential for demand sensing and factory replenishment scheduling.',
    severity: 'high',
  },
  primarysales: {
    title: 'Primary Sales (Company Billing to Distributors)',
    title_en: 'Primary Sales (Company Billing to Distributors)',
    explanation: 'Direct shipments and billing invoices from factory/depots to authorized distribution partners.',
    impact: 'Primary sales reflect the core top-line revenue engine of the business.',
    action: 'Keep intact to maintain financial synchronization with enterprise ledger.',
    severity: 'high',
  },
  outlet: {
    title: 'Retail Outlet Master & Coverage',
    title_en: 'Retail Outlet Master & Coverage',
    explanation: 'Master registry of grocery stores, pharmacies, supermarkets, locations, and trade channels.',
    impact: 'Missing outlet master data impairs beat planning, sales rep tracking, and store penetration metrics.',
    action: 'Maintain outlet hierarchy for field sales execution and route-to-market visibility.',
    severity: 'high',
  },
  customeroutlet: {
    title: 'Customer Outlet & Retailer Profile',
    title_en: 'Customer Outlet & Retailer Profile',
    explanation: 'Retailer credit limits, payment history, store tiering, and commercial profile.',
    impact: 'Inability to assess retailer credit risks and overdue payment exposures.',
    action: 'Keep linked to mitigate retailer credit defaults and manage receivables.',
    severity: 'medium',
  },
  distributor: {
    title: 'Distributor & Channel Partner Network',
    title_en: 'Distributor & Channel Partner Network',
    explanation: 'Geographic territories, warehousing agreements, and commercial contracts for distributors.',
    impact: 'Disrupts distribution pipeline monitoring and territory exclusivity management.',
    action: 'Keep as a primary spine node for commission calculations and channel performance.',
    severity: 'high',
  },
  inventory: {
    title: 'Warehouse & In-Transit Inventory',
    title_en: 'Warehouse & In-Transit Inventory',
    explanation: 'Stock balances across depots, transit hubs, and distributor facilities.',
    impact: 'Risk of working capital blockage, expired inventory write-offs, or stockouts.',
    action: 'Maintain inventory nodes for supply chain resilience and working capital optimization.',
    severity: 'high',
  },
}

export const WARNING_TRANSLATIONS = {
  reference_entities_removed: {
    title: 'Industry Reference Elements Removed',
    title_en: 'Industry Reference Elements Removed',
    explanation: 'Several elements from the industry benchmark reference have been omitted.',
    impact: 'Future integration with standard industry applications or automation may require these elements.',
    action: 'Review removed items. If they are outside your operational scope, you can proceed safely.',
    severity: 'medium',
  },
  no_attributes: {
    title: 'Entities Lack Detailed Data Fields',
    title_en: 'Entities Lack Detailed Data Fields',
    explanation: 'Entities are defined without property schemas or attributes.',
    impact: 'File upload and automated mapping cannot bind spreadsheet columns without attributes.',
    action: 'Add attributes in the refinement step before uploading telemetry datasets.',
    severity: 'high',
  },
  isolated_entity: {
    title: 'Disconnected Data Elements',
    title_en: 'Disconnected Data Elements',
    explanation: 'Entities are present without links to other business processes or departments.',
    impact: 'Creates data silos that are disconnected from enterprise analytics.',
    action: 'Connect with relationships or remove if redundant.',
    severity: 'medium',
  },
  disconnected: {
    title: 'Disconnected Process Sub-Graphs',
    title_en: 'Disconnected Process Sub-Graphs',
    explanation: 'Substantial parts of the model lack integration with core process flows.',
    impact: 'End-to-end telemetry and digital twin simulations will stall.',
    action: 'Add missing relationship links between process stages.',
    severity: 'high',
  },
}

function normalizeKey(str) {
  return String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function findTermMatch(term) {
  const k = normalizeKey(term)
  if (BUSINESS_TERM_KNOWLEDGE[k]) return BUSINESS_TERM_KNOWLEDGE[k]
  for (const [dictKey, meta] of Object.entries(BUSINESS_TERM_KNOWLEDGE)) {
    if (dictKey.includes(k) || k.includes(dictKey)) return meta
  }
  return null
}

/**
 * Builds or enhances Business Impact Insights from backend data or raw diffs.
 */
export function buildBusinessImpactSummary(backendImpact, comparison, validation) {
  if (backendImpact && Array.isArray(backendImpact.items) && backendImpact.items.length > 0) {
    return backendImpact
  }

  const items = []
  const seenIds = new Set()

  const nodesRemoved = Array.isArray(comparison?.nodes_removed) ? comparison.nodes_removed : []
  const nodesModified = Array.isArray(comparison?.nodes_modified) ? comparison.nodes_modified : []

  // 1. Process Removed Reference Entities
  for (const node of nodesRemoved) {
    if (!node) continue
    const name = typeof node === 'string' ? node : node.name || 'Unknown'
    const key = typeof node === 'string' ? node : node.key || name
    const itemId = `rem_${normalizeKey(key)}`
    if (seenIds.has(itemId)) continue
    seenIds.add(itemId)

    const matched = findTermMatch(name) || findTermMatch(key)
    if (matched) {
      items.push({
        id: itemId,
        type: 'entity_removed',
        severity: matched.severity,
        technical_ref: `Node removed: ${name}`,
        title: `‘${matched.title_en}’ removed from ontology`,
        title_en: `‘${matched.title_en}’ removed from ontology`,
        title_bn: `‘${matched.title_en}’ removed from ontology`,
        explanation: matched.explanation,
        explanation_bn: matched.explanation,
        impact: matched.impact,
        impact_bn: matched.impact,
        action: matched.action,
        action_bn: matched.action,
      })
    } else {
      items.push({
        id: itemId,
        type: 'entity_removed',
        severity: 'medium',
        technical_ref: `Node removed: ${name}`,
        title: `‘${name}’ entity removed from ontology`,
        title_en: `‘${name}’ entity removed from ontology`,
        title_bn: `‘${name}’ entity removed from ontology`,
        explanation: `Standard architecture component ‘${name}’ was excluded from the current model.`,
        explanation_bn: `Standard architecture component ‘${name}’ was excluded from the current model.`,
        impact: `No data associated with ‘${name}’ will be tracked in the digital twin.`,
        impact_bn: `No data associated with ‘${name}’ will be tracked in the digital twin.`,
        action: `If not relevant to your business scope, this can be safely ignored. Otherwise, restore it in the chatbot.`,
        action_bn: `If not relevant to your business scope, this can be safely ignored. Otherwise, restore it in the chatbot.`,
      })
    }
  }

  // 2. Process Modified Entities
  for (const node of nodesModified) {
    if (!node) continue
    const name = typeof node === 'string' ? node : node.name || 'Unknown'
    const key = typeof node === 'string' ? node : node.key || name
    const changes = node.changes || {}
    const attrRem = Array.isArray(node.attributes_removed) ? node.attributes_removed : []

    for (const attr of attrRem) {
      const itemId = `attr_rem_${normalizeKey(attr)}`
      if (seenIds.has(itemId)) continue
      seenIds.add(itemId)
      const matched = findTermMatch(attr)
      if (matched) {
        items.push({
          id: itemId,
          type: 'attribute_removed',
          severity: matched.severity,
          technical_ref: `${name} attribute removed: ${attr}`,
          title: `Field '${attr}' removed from ${name}`,
          title_en: `Field '${attr}' removed from ${name}`,
          title_bn: `Field '${attr}' removed from ${name}`,
          explanation: matched.explanation,
          explanation_bn: matched.explanation,
          impact: matched.impact,
          impact_bn: matched.impact,
          action: matched.action,
          action_bn: matched.action,
        })
      } else {
        items.push({
          id: itemId,
          type: 'attribute_removed',
          severity: 'low',
          technical_ref: `${name} attribute removed: ${attr}`,
          title: `Attribute '${attr}' removed from ${name}`,
          title_en: `Attribute '${attr}' removed from ${name}`,
          title_bn: `Attribute '${attr}' removed from ${name}`,
          explanation: `Field column ‘${attr}’ was excluded from entity ${name}.`,
          explanation_bn: `Field column ‘${attr}’ was excluded from entity ${name}.`,
          impact: `Future document uploads containing this attribute will not be auto-mapped.`,
          impact_bn: `Future document uploads containing this attribute will not be auto-mapped.`,
          action: 'If this attribute is unnecessary for your commercial operations, you can safely ignore.',
          action_bn: 'If this attribute is unnecessary for your commercial operations, you can safely ignore.',
        })
      }
    }

    if (changes.name) {
      const oldName = changes.name.from
      const newName = changes.name.to
      const itemId = `rename_${normalizeKey(key)}`
      if (!seenIds.has(itemId)) {
        seenIds.add(itemId)
        items.push({
          id: itemId,
          type: 'renamed',
          severity: 'low',
          technical_ref: `Renamed: '${oldName}' -> '${newName}'`,
          title: `Terminology adapted: '${oldName}' to '${newName}'`,
          title_en: `Terminology adapted: '${oldName}' to '${newName}'`,
          title_bn: `Terminology adapted: '${oldName}' to '${newName}'`,
          explanation: `Renamed to match your internal organizational terminology.`,
          explanation_bn: `Renamed to match your internal organizational terminology.`,
          impact: `Fosters organizational familiarity and user adoption across business teams.`,
          impact_bn: `Fosters organizational familiarity and user adoption across business teams.`,
          action: 'Verify naming aligns with your team standards and approve.',
          action_bn: 'Verify naming aligns with your team standards and approve.',
        })
      }
    }
  }

  // 3. Process Validation Warnings
  const warnings = Array.isArray(validation?.warnings) ? validation.warnings : []
  for (const w of warnings) {
    if (!w) continue
    const code = typeof w === 'string' ? w : w.code
    const msg = typeof w === 'string' ? w : String(w?.message || '')
    const itemId = `warn_${code}_${normalizeKey(msg.slice(0, 20))}`
    if (seenIds.has(itemId)) continue
    seenIds.add(itemId)

    const rule = WARNING_TRANSLATIONS[code]
    if (rule) {
      items.push({
        id: itemId,
        type: 'validation_warning',
        severity: rule.severity,
        technical_ref: `Warning [${code}]: ${msg}`,
        title: rule.title_en,
        title_en: rule.title_en,
        title_bn: rule.title_en,
        explanation: `${rule.explanation} (${msg})`,
        explanation_bn: `${rule.explanation} (${msg})`,
        impact: rule.impact,
        impact_bn: rule.impact,
        action: rule.action,
        action_bn: rule.action,
      })
    }
  }

  // 4. Process Validation Errors
  const errors = Array.isArray(validation?.errors) ? validation.errors : []
  for (const e of errors) {
    if (!e) continue
    const code = typeof e === 'string' ? e : e.code
    const msg = typeof e === 'string' ? e : String(e?.message || '')
    const itemId = `err_${code}_${normalizeKey(msg.slice(0, 20))}`
    if (seenIds.has(itemId)) continue
    seenIds.add(itemId)
    items.push({
      id: itemId,
      type: 'validation_error',
      severity: 'critical',
      technical_ref: `Error [${code}]: ${msg}`,
      title: 'Critical schema error required to fix',
      title_en: 'Critical schema error required to fix',
      title_bn: 'Critical schema error required to fix',
      explanation: `Technical schema error: ${msg}.`,
      explanation_bn: `Technical schema error: ${msg}.`,
      impact: 'The digital twin cannot be finalized until all critical errors are resolved.',
      impact_bn: 'The digital twin cannot be finalized until all critical errors are resolved.',
      action: 'Return to chatbot to resolve this schema error.',
      action_bn: 'Return to chatbot to resolve this schema error.',
    })
  }

  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  items.sort((a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4))

  const critCount = items.filter((i) => i.severity === 'critical').length
  const highCount = items.filter((i) => i.severity === 'high').length
  const medCount = items.filter((i) => i.severity === 'medium').length
  const lowCount = items.filter((i) => i.severity === 'low').length

  let readinessStatus = 'ready'
  let verdict = 'All business requirements verified. Fully ready for enterprise finalization.'

  if (critCount > 0) {
    readinessStatus = 'blocked'
    verdict = `${critCount} critical error(s) must be resolved before finalization.`
  } else if (highCount > 0) {
    readinessStatus = 'review_needed'
    verdict = `${highCount} high-impact business decisions require review.`
  } else if (medCount > 0) {
    readinessStatus = 'acceptable'
    verdict = `Model is largely ready with ${medCount} minor operational notes.`
  }

  return {
    status: readinessStatus,
    verdict,
    verdict_en: verdict,
    verdict_bn: verdict,
    counts: {
      critical: critCount,
      high: highCount,
      medium: medCount,
      low: lowCount,
      total: items.length,
    },
    items,
  }
}
