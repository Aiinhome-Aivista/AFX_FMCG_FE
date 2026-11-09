/**
 * Business Impact & Plain Language ("Pati Bangla") Engine for Frontend
 * Converts technical diffs and validation gaps into plain language explanations,
 * business impact assessments, and clear action items for decision makers.
 */

export const BUSINESS_TERM_KNOWLEDGE = {
  tradespend: {
    title_bn: 'ট্রেড প্রমোশন ও রিটেইলার ডিসকাউন্ট স্কিম',
    title_en: 'Trade Promotion & Retailer Scheme Spend',
    explanation_bn: 'ডিস্ট্রিবিউটর, ডিলার বা রিটেইলারদের দেওয়া বিশেষ ডিসকাউন্ট, ক্যাশ ব্যাক বা ফ্রি স্যাম্পল অফার।',
    impact_bn: 'ইনভয়েসের পর কত টাকা ডিসকাউন্টে খরচ হলো তা ট্র্যাক করা যাবে না। বাজেট ছাড়া অতিরিক্ত ছাড় চলে গেলে কোম্পানির মোট মার্জিন বা মুনাফা কমে যাবে।',
    action_bn: 'আপনার ব্যবসায় ডিলার স্কিম বা ক্যাশ ডিসকাউন্ট থাকলে এটি মডেলে বহাল রাখুন। ফিক্সড প্রাইসে সেল হলে বাদ দিতে পারেন।',
    severity: 'high',
  },
  promoplan: {
    title_bn: 'প্রমোশনাল ক্যাম্পেইন ও অফার প্ল্যানিং',
    title_en: 'Trade Promotional Campaign Planning',
    explanation_bn: 'উৎসব বা সিজনভিত্তিক প্রমোশনাল অফার ও স্কিম পূর্বপরিকল্পনা করার কাঠামো।',
    impact_bn: 'কোন স্কিমে কত বিক্রি বাড়ল এবং স্কিমের খরচ পুষিয়ে লাভ হলো কিনা (Promo ROI) তা যাচাই করা অসম্ভব হবে।',
    action_bn: 'ভবিষ্যতে প্রমোশনের লাভ-ক্ষতি হিসাব করতে চাইলে এটি অন্তর্ভুক্ত রাখা অত্যন্ত জরুরি।',
    severity: 'high',
  },
  grosstonetwaterfall: {
    title_bn: 'গ্রস থেকে আসল নেট আয় হিসাব (Gross-to-Net)',
    title_en: 'Gross-to-Net Revenue Reconciliation',
    explanation_bn: 'ইনভয়েসের মোট মূল্য (Gross) থেকে ডিসকাউন্ট, ড্যামেজ রিটার্ন ও ট্যাক্স বাদ দিয়ে ব্যাংকে জমা হওয়া আসল রেভিনিউ গণনা।',
    impact_bn: 'এই নিয়ম পরিবর্তিত হলে ব্যালেন্স শিটে মোট বিক্রির সাথে ব্যাংকে ঢোকা আসল টাকার অমিল হবে।',
    action_bn: 'ক্যাশ ফ্লো এবং ফাইন্যান্সিয়াল অডিটের সুরক্ষার জন্য এই ক্যালকুলেশন রুল সতর্কতার সাথে যাচাই করুন।',
    severity: 'high',
  },
  onoffinvoice: {
    title_bn: 'অন-ইনভয়েস বনাম অফ-ইনভয়েস ছাড় পলিসি',
    title_en: 'On-Invoice vs Off-Invoice Deduction Policy',
    explanation_bn: 'বিলের ভেতরে দেওয়া তাৎক্ষণিক ছাড় এবং বিলের বাইরে মাস শেষে দেওয়া বিশেষ রিবেট বা ইনসেন্টিভ।',
    impact_bn: 'বিল বা রসিদের বাইরে পরে দেওয়া কমিশন ও রিবেট ট্র্যাক না হলে অ্যাকাউন্টিংয়ে অসঙ্গতি ও রাজস্ব ফাঁক তৈরি হবে।',
    action_bn: 'যদি ডিলারদের বছর বা মাস শেষে টার্নওভার রিবেট দেওয়ার নিয়ম থাকে তবে এটি রাখুন।',
    severity: 'medium',
  },
  accrualbasis: {
    title_bn: 'বকেয়া ও অগ্রিম সমন্বয়ের নিয়ম (Accrual Accounting)',
    title_en: 'Accrual Accounting Principle',
    explanation_bn: 'মাল ডেলিভারির সাথে সাথেই খাতায় খরচ বা আয় তোলা, টাকা হাতে পাওয়ার জন্য অপেক্ষা না করা।',
    impact_bn: 'এটি বাদ দিলে যেদিন ক্যাশ টাকা লেনদেন হবে শুধু সেদিন হিসাব হবে, ফলে চলতি মাসের লাভ-ক্ষতির চিত্র ভুল দেখাবে।',
    action_bn: 'স্ট্যান্ডার্ড অ্যাকাউন্টিং এবং কর অডিটের জন্য অ্যাক্রুয়াল পলিসি সচল রাখা শ্রেয়।',
    severity: 'medium',
  },
  deductionmethod: {
    title_bn: 'ডিসকাউন্ট কর্তনের পদ্ধতি (Deduction Method)',
    title_en: 'Deduction Method Rules',
    explanation_bn: 'পার্সেন্টেজ হারে নাকি ফিক্সড টাকায় ডিসকাউন্ট কাটা হবে তার ফর্মুলা।',
    impact_bn: 'নির্দিষ্ট ফর্মুলা না থাকলে বিলিং সিস্টেম স্বয়ংক্রিয়ভাবে ডিসকাউন্ট কাটতে পারবে না, ম্যানুয়াল ভুলের সুযোগ তৈরি হবে।',
    action_bn: 'বিলিং সফটওয়্যার ও ইআরপির সাথে মেলানোর জন্য নির্দিষ্ট ফর্মুলা বহাল রাখুন।',
    severity: 'medium',
  },
  secondarysales: {
    title_bn: 'ডিস্ট্রিবিউটর সেকেন্ডারি সেলস (দোকানে আসল বিক্রি)',
    title_en: 'Secondary Sales (Distributor to Retail Outlet)',
    explanation_bn: 'কোম্পানি থেকে ডিস্ট্রিবিউটরের গুদামে মাল যাওয়ার পর সেখান থেকে রিটেইল দোকানে প্রতিদিন কত বিক্রি হচ্ছে।',
    impact_bn: 'দোকানে কী বিক্রি হচ্ছে না জানলে বাজারে কোন মালের ঘাটতি বা ওভারস্টক আছে বোঝা যাবে না। এতে ফ্যাক্টরিতে ভুল পরিমাণের উৎপাদন হতে পারে।',
    action_bn: 'মার্কেটের রিয়েল ডিমান্ড বুঝতে সেকেন্ডারি সেলস ডেটা পয়েন্ট আবশ্যক।',
    severity: 'high',
  },
  primarysales: {
    title_bn: 'কোম্পানির প্রাইমারি সেলস ও ডিলার ইনভয়েসিং',
    title_en: 'Primary Sales (Company Billing to Distributors)',
    explanation_bn: 'ফ্যাক্টরি বা সিপিসি ডিপো থেকে ডিস্ট্রিবিউটর বা ডিলারের কাছে সরাসরি পণ্যের চালান পাঠানো।',
    impact_bn: 'এটি কোম্পানির প্রাথমিক রাজস্ব প্রবাহ নির্দেশ করে। এটি ব্যাহত হলে কোম্পানির টপ-লাইন রেভিনিউ রিপোর্টিং বন্ধ হয়ে যাবে।',
    action_bn: 'কোম্পানির নিজস্ব বিলিং ও অ্যাকাউন্টস মেলানোর জন্য এটি মডেলে অপরিবর্তিত রাখুন।',
    severity: 'high',
  },
  outlet: {
    title_bn: 'রিটেইল আউটলেট ও স্টোর মাস্টার ডেটা',
    title_en: 'Retail Outlet Master & Coverage',
    explanation_bn: 'মুদি দোকান, ফার্মেসি বা সুপারশপের নাম, অবস্থান ও ক্যাটাগরি।',
    impact_bn: 'দোকানের মাস্টার ডেটা না থাকলে সেলস রিপ্রেজেন্টেটিভদের (SR) রুট প্ল্যান ও অর্ডার কালেকশনের কার্যকারিতা মনিটর করা যাবে না।',
    action_bn: 'ফিল্ড ফোর্সের দক্ষতা এবং আউটলেট পেনিট্রেশন ট্র্যাক করতে এটি অবশ্যই বজায় রাখুন।',
    severity: 'high',
  },
  customeroutlet: {
    title_bn: 'গ্রাহক আউটলেট ও রিটেইলার প্রোফাইল',
    title_en: 'Customer Outlet & Retailer Profile',
    explanation_bn: 'রিটেইলারদের ক্রেডিট লিমিট, পেমেন্ট হিস্ট্রি ও শপের সাইজ।',
    impact_bn: 'কোন দোকান থেকে টাকা আদায় বাকি বা কার ক্রেডিট রিক্স বেশি তা চিহ্নিত করা যাবে না।',
    action_bn: 'বকেয়া আদায়ের ঝুঁকি কমাতে আউটলেট প্রোফাইল সংযুক্ত রাখা উচিত।',
    severity: 'medium',
  },
  distributor: {
    title_bn: 'ডিস্ট্রিবিউটর ও ডিলারশিপ নেটওয়ার্ক',
    title_en: 'Distributor & Channel Partner Network',
    explanation_bn: 'পণ্য সরবরাহকারী ডিলারদের ভৌগোলিক সীমানা, গুদাম ও চুক্তি।',
    impact_bn: 'ডিস্ট্রিবিউটর চ্যানেল ছাড়া সামগ্রিক ডিস্ট্রিবিউশন পাইপলাইন ও পণ্যের প্রাপ্যতা ট্র্যাক করা অসম্ভব।',
    action_bn: 'ডিস্ট্রিবিউটর কমিশন ও পারফরম্যান্স পরিমাপে এটি সেন্ট্রাল নোড হিসেবে রাখুন।',
    severity: 'high',
  },
  inventory: {
    title_bn: 'ইনভেন্টরি ও পণ্য স্টক ব্যালেন্স',
    title_en: 'Warehouse & In-Transit Inventory',
    explanation_bn: 'গুদামে, ফ্যাক্টরিতে ও রাস্তায় ট্রাকে কত টাকার ফিনিশড গুডস ও কাঁচামাল মজুত রয়েছে।',
    impact_bn: 'স্টকের হিসাব না থাকলে অতিরিক্ত স্টক জমে ক্যাশ আটকে যেতে পারে (Working Capital Blocked) অথবা পণ্য মেয়াদোত্তীর্ণ হয়ে ক্ষতি হতে পারে।',
    action_bn: 'কার্যকর সাপ্লাই চেইনের জন্য স্টক ট্র্যাকারের সাথে ইনভেন্টরি নোড বজায় রাখুন।',
    severity: 'high',
  },
}

export const WARNING_TRANSLATIONS = {
  reference_entities_removed: {
    title_bn: 'রেফারেন্স স্ট্যান্ডার্ড থেকে কিছু উপাদান বাদ পড়েছে',
    title_en: 'Industry Reference Elements Removed',
    explanation_bn: 'গ্লোবাল স্ট্যান্ডার্ডের কিছু উপাদান বর্তমান মডেলে রাখা হয়নি।',
    impact_bn: 'ভবিষ্যতে কোম্পানি যখন নতুন সিস্টেম বা উন্নত অটোমেশন চালু করতে যাবে, তখন এই বাদ পড়া বিষয়গুলোর অভাব দেখা দিতে পারে।',
    action_bn: 'বাদ পড়া উপাদানগুলো দেখে নিন; আপনার বর্তমান অপারেশনাল স্কোপে প্রয়োজন না হলে আপনি নিশ্চিন্তে ফাইনাল করতে পারেন।',
    severity: 'medium',
  },
  no_attributes: {
    title_bn: 'একাধিক উপাদানে ডেটা ফিল্ডের অভাব (No Attributes)',
    title_en: 'Entities Lack Detailed Data Fields',
    explanation_bn: 'এন্টিটির নাম আছে কিন্তু ভেতরে কী কী ফিল্ড (যেমন: তারিখ, টাকা, পরিমাণ) থাকবে তা ফাঁকা রয়েছে।',
    impact_bn: 'ভবিষ্যতে এক্সেল, সিএসভি বা ইআরপি ডাটা আপলোড করলে সিস্টেম স্বয়ংক্রিয়ভাবে হিসাব মেলাতে পারবে না।',
    action_bn: 'ডেটা আপলোড করার আগে প্রয়োজনে চ্যাটবটের মাধ্যমে এই এন্টিটিগুলোতে প্রয়োজনীয় অ্যাট্রিবিউট যোগ করে নিন।',
    severity: 'high',
  },
  isolated_entity: {
    title_bn: 'সম্পর্কহীন বা বিচ্ছিন্ন উপাদান (Isolated Entities)',
    title_en: 'Disconnected Data Elements',
    explanation_bn: 'মডেলে কিছু নতুন উপাদান যুক্ত করা হয়েছে কিন্তু অন্যান্য ডিপার্টমেন্টের সাথে এদের কোনো সংযোগ নেই।',
    impact_bn: 'রিপোর্টিংয়ের সময় সামগ্রিক ডেটার সাথে এটি যুক্ত হবে না, ফলে সাইলো (Data Silo) তৈরি হবে।',
    action_bn: 'অন্যান্য বিজনেস প্রসেসের সাথে লিঙ্ক তৈরি করুন অথবা অপ্রয়োজনীয় হলে বাদ দিন।',
    severity: 'medium',
  },
  disconnected: {
    title_bn: 'মডেলের বিভিন্ন অংশের মধ্যে সংযোগের অভাব',
    title_en: 'Disconnected Process Sub-Graphs',
    explanation_bn: 'নলেজ গ্রাফের একটি বড় অংশ সম্পূর্ণ আলাদা হয়ে রয়েছে, মূল প্রক্রিয়ার সাথে যোগসূত্র নেই।',
    impact_bn: 'এন্ড-টু-এন্ড অটোমেশন বা ডেটা ফ্লো মাঝপথে আটকে যাবে।',
    action_bn: 'প্রসেসগুলোর মধ্যে মিসিং রিলেশনশিপ তৈরি করুন।',
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
        title_bn: `‘${matched.title_bn}’ মডেল থেকে বাদ দেওয়া হয়েছে`,
        title_en: `‘${matched.title_en}’ removed from ontology`,
        explanation_bn: matched.explanation_bn,
        impact_bn: matched.impact_bn,
        action_bn: matched.action_bn,
      })
    } else {
      items.push({
        id: itemId,
        type: 'entity_removed',
        severity: 'medium',
        technical_ref: `Node removed: ${name}`,
        title_bn: `‘${name}’ সংক্রান্ত তথ্য মডেল থেকে সরানো হয়েছে`,
        title_en: `‘${name}’ entity removed from ontology`,
        explanation_bn: `স্ট্যান্ডার্ড আর্কিটেকচারের ‘${name}’ কম্পোনেন্টটি বর্তমান মডেলে রাখা হয়নি।`,
        impact_bn: `কোম্পানির অপারেশনে ‘${name}’ সংক্রান্ত কোনো ডেটা ডিজিটাল টুইনে ট্র্যাক হবে না।`,
        action_bn: `যদি কোম্পানিতে এটি দরকার না হয় তবে বাদ রাখা নিরাপদ। অন্যথায় ব্যাক করে চ্যাটে এটি যুক্ত করতে পারেন।`,
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
          title_bn: `${name}-এর ভেতরে ‘${matched.title_bn}’ ফিল্ডটি বাদ দেওয়া হয়েছে`,
          title_en: `Field '${attr}' removed from ${name}`,
          explanation_bn: matched.explanation_bn,
          impact_bn: matched.impact_bn,
          action_bn: matched.action_bn,
        })
      } else {
        items.push({
          id: itemId,
          type: 'attribute_removed',
          severity: 'low',
          technical_ref: `${name} attribute removed: ${attr}`,
          title_bn: `${name}-এর ডেটা ফিল্ড ‘${attr}’ সরানো হয়েছে`,
          title_en: `Attribute '${attr}' removed from ${name}`,
          explanation_bn: `এই এন্টিটি থেকে ‘${attr}’ তথ্যের কলামটি বাদ দেওয়া হয়েছে।`,
          impact_bn: `ভবিষ্যতে আপলোড করা ডকুমেন্টে এই ফিল্ডটি থাকলে তা এই মডেলে অটোম্যাপ হবে না।`,
          action_bn: 'যদি এই ফিল্ডের তথ্য আপনার ব্যবসায় অপ্রয়োজনীয় হয়, তবে ইগনোর করতে পারেন।',
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
          title_bn: `নাম পরিবর্তন: ‘${oldName}’ থেকে ‘${newName}’ করা হয়েছে`,
          title_en: `Terminology adapted: '${oldName}' to '${newName}'`,
          explanation_bn: `কোম্পানির ব্যবহৃত নিজস্ব অভ্যন্তরীণ পরিভাষার সাথে মিল রাখতে এটি রিনেম করা হয়েছে।`,
          impact_bn: `এটি একটি পজিটিভ পরিবর্তন। আপনার টিম নিজেদের চেনা নামে ডেটা দেখতে পারবে।`,
          action_bn: 'নামকরণ সঠিক থাকলে এটি অনুমোদন করে এগিয়ে যান।',
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
        title_bn: rule.title_bn,
        title_en: rule.title_en,
        explanation_bn: `${rule.explanation_bn} (${msg})`,
        impact_bn: rule.impact_bn,
        action_bn: rule.action_bn,
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
      title_bn: 'গুরুত্বপূর্ণ ত্রুটি যা সংশোধন করা বাধ্যতামূলক',
      title_en: 'Critical schema error required to fix',
      explanation_bn: `মডেলে একটি টেকনিক্যাল ত্রুটি রয়েছে: ${msg}।`,
      impact_bn: 'এই ত্রুটি ঠিক না করা পর্যন্ত ডিজিটাল টুইন ফাইনাল করা যাবে না এবং কোনো ফাইল প্রসেস হবে না।',
      action_bn: 'চ্যাটবটে ফিরে গিয়ে ত্রুটিটি সমাধান করুন।',
    })
  }

  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  items.sort((a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4))

  const critCount = items.filter((i) => i.severity === 'critical').length
  const highCount = items.filter((i) => i.severity === 'high').length
  const medCount = items.filter((i) => i.severity === 'medium').length
  const lowCount = items.filter((i) => i.severity === 'low').length

  let readinessStatus = 'ready'
  let verdictBn = 'অভিনন্দন! আপনার মডেলটি সম্পূর্ণ নিখুঁত এবং ব্যবসার জন্য শতভাগ প্রস্তুত।'
  let verdictEn = 'All business requirements verified. Fully ready for enterprise finalization.'

  if (critCount > 0) {
    readinessStatus = 'blocked'
    verdictBn = `${critCount}টি গুরুতর ত্রুটি রয়েছে যা ঠিক না করলে ডিজিটাল টুইন চূড়ান্ত করা যাবে না।`
    verdictEn = `${critCount} critical error(s) must be resolved before finalization.`
  } else if (highCount > 0) {
    readinessStatus = 'review_needed'
    verdictBn = `${highCount}টি গুরুত্বপূর্ণ পয়েন্টে বিজনেস সিদ্ধান্ত প্রয়োজন। এগুলো ব্যবসার জন্য প্রযোজ্য না হলে ইগনোর করে ফাইনাল করতে পারেন।`
    verdictEn = `${highCount} high-impact business decisions require review.`
  } else if (medCount > 0) {
    readinessStatus = 'acceptable'
    verdictBn = `মডেলটি গ্রহণযোগ্য পর্যায়ে রয়েছে (${medCount}টি মাঝারি পর্যবেক্ষণ রয়েছে)। আপনি চাইলে ফাইনাল করতে পারেন।`
    verdictEn = `Model is largely ready with ${medCount} minor operational notes.`
  }

  return {
    status: readinessStatus,
    verdict_bn: verdictBn,
    verdict_en: verdictEn,
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

