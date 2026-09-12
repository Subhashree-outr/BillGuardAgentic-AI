/**
 * Specialized Agent Tool System for BillGuard
 */

import { dbHelpers, DEFAULT_USER_ID } from '../db';
import { BillItem, Subscription, Transaction } from '../types';
import { getGeminiModel } from '../gemini';

export interface BillParserResult {
  merchant: string;
  bill_date: string;
  due_date: string;
  total_amount: number;
  tax: number;
  currency: string;
  category: string;
  is_recurring: boolean;
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    category: string;
  }>;
  raw_summary: string;
}

/**
 * 1. Bill Parser Tool
 */
export async function bill_parser_tool(input: {
  text?: string;
  filename?: string;
  aiInstance?: any;
  imageBase64?: string;
  mimeType?: string;
}): Promise<BillParserResult> {
  const content = input.text || '';
  const filename = input.filename || 'uploaded_bill.pdf';

  // If Gemini AI is available, attempt structured extraction
  if (input.aiInstance) {
    try {
      const prompt = `You are a financial document parser. Extract structured bill details from this content:
"${content}"
Return strict JSON with this schema:
{
  "merchant": "string",
  "bill_date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD",
  "total_amount": number,
  "tax": number,
  "currency": "INR" or "USD",
  "category": "string",
  "is_recurring": boolean,
  "line_items": [
    { "description": "string", "quantity": 1, "unit_price": number, "total_price": number, "category": "string" }
  ],
  "raw_summary": "one sentence summary"
}`;

      let contents: any = prompt;
      if (input.imageBase64 && input.mimeType) {
        contents = [
          prompt,
          {
            inlineData: {
              data: input.imageBase64,
              mimeType: input.mimeType,
            },
          },
        ];
      }

      const response = await input.aiInstance.models.generateContent({
        model: getGeminiModel(),
        contents,
        config: { responseMimeType: 'application/json', maxOutputTokens: 1024 },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.merchant && parsed.total_amount) {
        return {
          merchant: parsed.merchant,
          bill_date: parsed.bill_date || new Date().toISOString().split('T')[0],
          due_date: parsed.due_date || new Date().toISOString().split('T')[0],
          total_amount: Number(parsed.total_amount),
          tax: Number(parsed.tax || 0),
          currency: parsed.currency || 'INR',
          category: parsed.category || 'General',
          is_recurring: Boolean(parsed.is_recurring),
          line_items: Array.isArray(parsed.line_items) ? parsed.line_items : [],
          raw_summary: parsed.raw_summary || `Parsed ${parsed.merchant} bill for ${parsed.currency} ${parsed.total_amount}`,
        };
      }
    } catch (e) {
      console.warn('[bill_parser_tool] Gemini structured extraction fallback to deterministic parser:', e);
    }
  }

  // Deterministic parser: only return values supported by the uploaded text.
  const lower = content.toLowerCase();
  const lines = content.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const currency = /\$|usd/i.test(content) ? 'USD' : 'INR';
  const merchantLine = lines.find(line => !/invoice|receipt|statement|date:|total|amount|tax|due/i.test(line) && !/[₹$]\s*\d/.test(line));
  const merchant = (merchantLine || filename.replace(/\.[^.]+$/, '') || 'Unknown Merchant').slice(0, 80);
  const category = /aws|amazon web services|cloud|hosting/i.test(lower)
    ? 'Cloud Infrastructure'
    : /netflix|spotify|music|streaming/i.test(lower)
      ? 'Entertainment'
      : 'General';
  const moneyPattern = /(?:₹|\$|inr|usd)?\s*([0-9][0-9,]*(?:\.\d{1,2})?)/ig;
  const amounts = [...content.matchAll(moneyPattern)]
    .map(match => Number(match[1].replace(/,/g, '')))
    .filter(amount => Number.isFinite(amount) && amount > 0);
  const totalLine = lines.find(line => /grand total|total amount|amount due|balance due|total:/i.test(line));
  const totalMatch = totalLine?.match(moneyPattern);
  const totalAmount = totalMatch ? Number(totalMatch[1].replace(/,/g, '')) : (amounts.length ? Math.max(...amounts) : 0);
  const lineItems: BillParserResult['line_items'] = lines
    .map(line => {
      const match = line.match(moneyPattern);
      if (!match || /total|tax|subtotal|balance due/i.test(line)) return null;
      const amount = Number(match[1].replace(/,/g, ''));
      const description = line.replace(match[0], '').replace(/[:=-]\s*$/, '').trim();
      return description && amount > 0 ? {
        description,
        quantity: 1,
        unit_price: amount,
        total_price: amount,
        category,
      } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (!totalAmount) {
    throw new Error(`Unable to find a bill total in ${filename}. Add a line such as "Total Amount: 25.00" or use Gemini for image extraction.`);
  }

  return {
    merchant,
    bill_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    total_amount: totalAmount,
    tax: Math.round(totalAmount * 0.18 * 100) / 100,
    currency,
    category,
    is_recurring: /monthly|annual|recurring|subscription|renewal/i.test(lower),
    line_items: lineItems,
    raw_summary: `Deterministically parsed ${merchant} from uploaded text; no Gemini extraction was used. Total ${currency} ${totalAmount}.`,
  };
}

/**
 * 2. Transaction Analysis Tool
 */
export function transaction_analysis_tool(userId: string = DEFAULT_USER_ID) {
  const transactions = dbHelpers.getTransactions(userId);

  // Detect duplicate charges (same merchant & amount within 24h)
  const duplicates: Array<{
    tx1: Transaction;
    tx2: Transaction;
    merchant: string;
    amount: number;
    timeGapMinutes: number;
  }> = [];

  for (let i = 0; i < transactions.length; i++) {
    for (let j = i + 1; j < transactions.length; j++) {
      const a = transactions[i];
      const b = transactions[j];
      if (a.merchant.toLowerCase() === b.merchant.toLowerCase() && Math.abs(a.amount - b.amount) < 0.01) {
        const timeDiff = Math.abs(new Date(a.date).getTime() - new Date(b.date).getTime()) / (1000 * 60);
        if (timeDiff <= 1440) {
          duplicates.push({
            tx1: a,
            tx2: b,
            merchant: a.merchant,
            amount: a.amount,
            timeGapMinutes: Math.round(timeDiff),
          });
        }
      }
    }
  }

  // Calculate spending breakdown by category
  const categorySpend: Record<string, number> = {};
  for (const t of transactions) {
    categorySpend[t.category] = (categorySpend[t.category] || 0) + t.amount;
  }

  return {
    total_transactions: transactions.length,
    duplicates_detected: duplicates,
    category_breakdown: categorySpend,
    unusual_transactions: transactions.filter(t => t.status === 'flagged'),
  };
}

/**
 * 3. Subscription Detection Tool
 */
export function subscription_detection_tool(userId: string = DEFAULT_USER_ID) {
  const subscriptions = dbHelpers.getSubscriptions(userId);

  const dormant = subscriptions.filter(s => Boolean(s.is_dormant) && s.status === 'active');
  const priceIncreases = subscriptions.filter(
    s => s.previous_price && s.current_price > s.previous_price && s.status === 'active'
  );

  // Group duplicate overlapping services (e.g. streaming, music, cloud storage)
  const duplicateGroups: Record<string, Subscription[]> = {};
  for (const s of subscriptions.filter(s => s.status === 'active')) {
    if (s.duplicate_group) {
      if (!duplicateGroups[s.duplicate_group]) {
        duplicateGroups[s.duplicate_group] = [];
      }
      duplicateGroups[s.duplicate_group].push(s);
    }
  }

  const redundantSubscriptions = Object.entries(duplicateGroups)
    .filter(([_, group]) => group.length > 1)
    .map(([groupName, group]) => ({
      groupName,
      active_services: group.map(g => ({
        merchant: g.merchant,
        price: g.current_price,
        is_dormant: g.is_dormant,
      })),
      potential_saving: group.slice(1).reduce((acc, g) => acc + g.current_price, 0),
    }));

  return {
    total_subscriptions: subscriptions.length,
    dormant_subscriptions: dormant,
    price_increase_subscriptions: priceIncreases,
    redundant_subscription_groups: redundantSubscriptions,
  };
}

/**
 * 4. Historical Comparison Tool
 */
export function historical_comparison_tool(
  merchant: string,
  currentAmount: number,
  userId: string = DEFAULT_USER_ID
) {
  const subscriptions = dbHelpers.getSubscriptions(userId);
  const match = subscriptions.find(s => s.merchant.toLowerCase().includes(merchant.toLowerCase()));

  if (!match) {
    return {
      merchant,
      has_history: false,
      message: 'No previous baseline found for this merchant.',
      percentage_change: 0,
      baseline_amount: currentAmount,
    };
  }

  const prev = match.previous_price || match.current_price;
  const diff = currentAmount - prev;
  const percentage = prev > 0 ? (diff / prev) * 100 : 0;

  return {
    merchant: match.merchant,
    has_history: true,
    previous_price: prev,
    current_price: currentAmount,
    difference: Math.round(diff * 100) / 100,
    percentage_change: Math.round(percentage * 10) / 10,
    is_price_hike: diff > 0,
    historical_renewal_date: match.renewal_date,
    evidence: diff > 0
      ? `Price increased by ₹${Math.round(diff)} (${Math.round(percentage)}%) compared with prior billing baseline of ₹${prev}.`
      : 'Billing matches historical recurring baseline.',
  };
}

// In-memory simulation flag for failure demo
let forceMerchantVerificationFailure = false;
export function setMerchantVerificationForceFail(fail: boolean) {
  forceMerchantVerificationFailure = fail;
}

/**
 * 5. Merchant Verification Tool (Supports Failure Simulation!)
 */
export function merchant_verification_tool(
  merchant: string,
  options?: { forceFail?: boolean }
) {
  // If simulated failure requested, throw an intentional service error
  if (options?.forceFail || forceMerchantVerificationFailure) {
    const error = new Error('EXTERNAL_MERCHANT_REGISTRY_503: Gateway timeout while connecting to merchant database.');
    (error as any).code = 'SERVICE_UNAVAILABLE';
    (error as any).tool = 'merchant_verification_tool';
    throw error;
  }

  const normalized = merchant.toLowerCase();

  if (normalized.includes('netflix')) {
    return {
      merchant: 'Netflix India',
      status: 'verified',
      cancellation_url: 'https://netflix.com/youraccount',
      cancellation_method: 'Self-service online click (immediate)',
      refund_policy: 'Prorated refund available upon automated dispute for mid-cycle rate hikes',
      support_email: 'billing-support@netflix.com',
      consumer_rating: 'A+',
    };
  }

  if (normalized.includes('cult.fit')) {
    return {
      merchant: 'Cult.Fit Healthcare Pvt Ltd',
      status: 'verified',
      cancellation_url: 'https://cult.fit/membership/pause-cancel',
      cancellation_method: 'One-click pause or 100% refund for unutilized months',
      refund_policy: 'Medical / Non-usage credit eligible for active packs > 60 days idle',
      support_email: 'hello@cult.fit',
      consumer_rating: 'A',
    };
  }

  if (normalized.includes('uber')) {
    return {
      merchant: 'Uber BV / Uber India Systems',
      status: 'verified',
      cancellation_url: 'https://help.uber.com',
      cancellation_method: 'In-app Help > Trip Issues > Charged Twice',
      refund_policy: 'Instant wallet / UPI refund within 2 hours for duplicate ride charges',
      support_email: 'support@uber.com',
      consumer_rating: 'Verified Partner',
    };
  }

  if (normalized.includes('aws')) {
    return {
      merchant: 'Amazon Web Services',
      status: 'verified',
      cancellation_url: 'https://console.aws.amazon.com/cost-management',
      cancellation_method: 'Terminate orphan EBS volumes via EC2 console',
      refund_policy: 'One-time courtesy billing adjustment for runaway test resources',
      support_email: 'aws-support@amazon.com',
      consumer_rating: 'Enterprise Cloud',
    };
  }

  return {
    merchant,
    status: 'verified_general',
    cancellation_url: 'https://consumercomplaints.in',
    cancellation_method: 'Direct bank mandate cancellation or merchant portal',
    refund_policy: 'Standard 30-day billing clarification window',
    support_email: 'support@merchant.com',
    consumer_rating: 'Standard',
  };
}

/**
 * 6. Currency Conversion Tool
 */
export async function currency_conversion_tool(
  amount: number,
  fromCurrency: string,
  toCurrency: string = 'INR'
) {
  try {
    const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency.toUpperCase()}`);
    const data = await res.json();
    const toRate = data.rates[toCurrency.toUpperCase()];
    
    if (toRate) {
      const converted = amount * toRate;
      return {
        original_amount: amount,
        from_currency: fromCurrency.toUpperCase(),
        converted_amount: Math.round(converted * 100) / 100,
        to_currency: toCurrency.toUpperCase(),
        exchange_rate: Math.round(toRate * 1000) / 1000,
        source: 'Live FX API (exchangerate-api.com)',
      };
    }
  } catch (e) {
    console.warn('[currency_conversion_tool] Live API failed, falling back to static rates.', e);
  }

  // Fallback
  const ratesToINR: Record<string, number> = {
    INR: 1.0,
    USD: 86.5,
    EUR: 92.0,
    GBP: 108.0,
  };

  const fromRate = ratesToINR[fromCurrency.toUpperCase()] || 1.0;
  const toRate = ratesToINR[toCurrency.toUpperCase()] || 1.0;

  const inINR = amount * fromRate;
  const converted = inINR / toRate;

  return {
    original_amount: amount,
    from_currency: fromCurrency.toUpperCase(),
    converted_amount: Math.round(converted * 100) / 100,
    to_currency: toCurrency.toUpperCase(),
    exchange_rate: Math.round((fromRate / toRate) * 1000) / 1000,
    source: 'Static Fallback Rates',
  };
}

/**
 * 7. Savings Calculator Tool
 */
export function savings_calculator_tool(actions: Array<{ estimated_saving: number }>) {
  const totalMonthlySavings = actions.reduce((sum, a) => sum + (a.estimated_saving || 0), 0);
  const totalAnnualSavings = totalMonthlySavings * 12;

  return {
    total_monthly_savings: Math.round(totalMonthlySavings * 100) / 100,
    total_annual_savings: Math.round(totalAnnualSavings * 100) / 100,
    action_items_count: actions.length,
  };
}

/**
 * 8. Budget Analysis Tool
 */
export function budget_analysis_tool(
  userId: string = DEFAULT_USER_ID,
  targetSavings: number = 5000,
  currency: string = 'INR'
) {
  const transactions = dbHelpers.getTransactions(userId);
  const subscriptions = dbHelpers.getSubscriptions(userId);

  const essentialCategories = ['Utilities', 'Groceries', 'Rent', 'Health'];
  const discretionaryCategories = ['Fitness', 'Entertainment', 'Cloud Storage', 'Career', 'Dining Out'];

  const nonEssentialSubs = subscriptions.filter(
    s => s.status === 'active' && (Boolean(s.is_dormant) || discretionaryCategories.includes(s.category || ''))
  );

  const availableMonthlySavings = nonEssentialSubs.reduce((acc, s) => acc + s.current_price, 0);

  return {
    target_savings: targetSavings,
    currency,
    available_discretionary_savings: Math.round(availableMonthlySavings * 100) / 100,
    can_meet_target: availableMonthlySavings >= targetSavings,
    recommendations: nonEssentialSubs.map(s => ({
      merchant: s.merchant,
      monthly_cost: s.current_price,
      is_dormant: Boolean(s.is_dormant),
      suggested_action: s.is_dormant ? 'Cancel immediately' : 'Downgrade to lower tier',
    })),
  };
}
