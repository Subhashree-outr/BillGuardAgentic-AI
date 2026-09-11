/**
 * SQLite Database Engine for BillGuard using Node.js Native SQLite
 */

import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  User,
  Bill,
  BillItem,
  Transaction,
  Subscription,
  AgentGoal,
  AgentRunState,
  AgentEvent,
} from './types';

const DB_PATH = path.join(process.cwd(), 'billguard.db');
const db = new DatabaseSync(DB_PATH);

// Initialize Tables
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      hashed_password TEXT,
      currency_preference TEXT DEFAULT 'INR',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      file_type TEXT NOT NULL,
      merchant TEXT NOT NULL,
      bill_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      total_amount REAL NOT NULL,
      tax REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'INR',
      category TEXT NOT NULL,
      is_recurring INTEGER NOT NULL DEFAULT 0,
      raw_content TEXT,
      status TEXT NOT NULL DEFAULT 'processed',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bill_items (
      id TEXT PRIMARY KEY,
      bill_id TEXT NOT NULL,
      description TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      category TEXT NOT NULL,
      FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      bill_id TEXT,
      date TEXT NOT NULL,
      merchant TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      category TEXT NOT NULL,
      is_recurring INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'cleared',
      note TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      merchant TEXT NOT NULL,
      plan_name TEXT NOT NULL,
      billing_cycle TEXT NOT NULL DEFAULT 'monthly',
      current_price REAL NOT NULL,
      previous_price REAL,
      currency TEXT NOT NULL DEFAULT 'INR',
      renewal_date TEXT NOT NULL,
      last_active_date TEXT NOT NULL,
      is_dormant INTEGER NOT NULL DEFAULT 0,
      duplicate_group TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agent_goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      target_saving_amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      constraints_json TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agent_runs (
      id TEXT PRIMARY KEY,
      goal_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'running',
      current_phase TEXT NOT NULL,
      state_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agent_events (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      event_type TEXT NOT NULL,
      agent_name TEXT NOT NULL,
      tool_name TEXT,
      status TEXT NOT NULL,
      summary TEXT NOT NULL,
      details_json TEXT
    );

    CREATE TABLE IF NOT EXISTS agent_actions (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      goal_id TEXT NOT NULL,
      target_merchant TEXT NOT NULL,
      action_type TEXT NOT NULL,
      description TEXT NOT NULL,
      priority INTEGER NOT NULL,
      estimated_saving REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      requires_approval INTEGER NOT NULL DEFAULT 1,
      approval_status TEXT NOT NULL DEFAULT 'pending',
      execution_status TEXT NOT NULL DEFAULT 'pending',
      simulation_result TEXT,
      template_letter TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      action_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      decision TEXT NOT NULL,
      reason TEXT,
      approved_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS anomalies (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      run_id TEXT,
      anomaly_type TEXT NOT NULL,
      merchant TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      severity TEXT NOT NULL,
      confidence REAL NOT NULL,
      evidence TEXT NOT NULL,
      recommended_action TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS financial_insights (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      metric_key TEXT NOT NULL,
      metric_value REAL NOT NULL,
      category TEXT NOT NULL,
      impact TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // Check if default user exists; if not, seed synthetic dataset
  const existingUser = db.prepare('SELECT id FROM users LIMIT 1').get();
  if (!existingUser) {
    seedSyntheticData();
  }
}

export const DEFAULT_USER_ID = 'usr_billguard_demo_01';

/**
 * Seed realistic synthetic financial data for hackathon demos
 */
export function seedSyntheticData() {
  const now = new Date().toISOString();

  // Clean existing demo data
  db.exec(`
    DELETE FROM bill_items;
    DELETE FROM bills;
    DELETE FROM transactions;
    DELETE FROM subscriptions;
    DELETE FROM agent_goals;
    DELETE FROM agent_runs;
    DELETE FROM agent_events;
    DELETE FROM agent_actions;
    DELETE FROM approvals;
    DELETE FROM anomalies;
    DELETE FROM financial_insights;
    DELETE FROM users;
  `);

  // 1. Insert Default User
  const insertUser = db.prepare(`
    INSERT INTO users (id, email, name, currency_preference, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertUser.run(
    DEFAULT_USER_ID,
    'demo.user@billguard.ai',
    'Alex Mercer',
    'INR',
    now
  );

  // 2. Insert Realistic Synthetic Subscriptions
  const insertSub = db.prepare(`
    INSERT INTO subscriptions (
      id, user_id, merchant, plan_name, billing_cycle, current_price, previous_price,
      currency, renewal_date, last_active_date, is_dormant, duplicate_group, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const subscriptionsList = [
    {
      id: 'sub_01',
      merchant: 'Cult.Fit Gym Membership',
      plan_name: 'ELITE Annual / Monthly Split',
      billing_cycle: 'monthly',
      current_price: 1850.0,
      previous_price: 1850.0,
      currency: 'INR',
      renewal_date: '2026-09-15',
      last_active_date: '2026-05-12', // > 90 days dormant!
      is_dormant: 1,
      duplicate_group: null,
    },
    {
      id: 'sub_02',
      merchant: 'Netflix Premium 4K',
      plan_name: '4-Screen UHD',
      billing_cycle: 'monthly',
      current_price: 649.0,
      previous_price: 499.0, // 30% sudden hike
      currency: 'INR',
      renewal_date: '2026-09-20',
      last_active_date: '2026-09-05',
      is_dormant: 0,
      duplicate_group: 'streaming',
    },
    {
      id: 'sub_03',
      merchant: 'Disney+ Hotstar Super',
      plan_name: 'Annual Subscription',
      billing_cycle: 'monthly',
      current_price: 299.0,
      previous_price: 299.0,
      currency: 'INR',
      renewal_date: '2026-09-28',
      last_active_date: '2026-06-01',
      is_dormant: 1, // dormant streaming
      duplicate_group: 'streaming',
    },
    {
      id: 'sub_04',
      merchant: 'Spotify Individual',
      plan_name: 'Premium Music',
      billing_cycle: 'monthly',
      current_price: 119.0,
      previous_price: 119.0,
      currency: 'INR',
      renewal_date: '2026-09-12',
      last_active_date: '2026-09-06',
      is_dormant: 0,
      duplicate_group: 'music',
    },
    {
      id: 'sub_05',
      merchant: 'Apple Music Family',
      plan_name: 'Family Audio Tier',
      billing_cycle: 'monthly',
      current_price: 179.0,
      previous_price: 149.0,
      currency: 'INR',
      renewal_date: '2026-09-14',
      last_active_date: '2026-07-20',
      is_dormant: 1,
      duplicate_group: 'music', // Duplicate music subscription!
    },
    {
      id: 'sub_06',
      merchant: 'AWS Cloud Services',
      plan_name: 'EC2 & S3 Backup',
      billing_cycle: 'monthly',
      current_price: 3450.0,
      previous_price: 850.0, // Massive anomaly spike 4x!
      currency: 'INR',
      renewal_date: '2026-09-30',
      last_active_date: '2026-09-04',
      is_dormant: 0,
      duplicate_group: null,
    },
    {
      id: 'sub_07',
      merchant: 'Dropbox Plus',
      plan_name: '2TB Cloud Backup',
      billing_cycle: 'monthly',
      current_price: 820.0,
      previous_price: 820.0,
      currency: 'INR',
      renewal_date: '2026-09-18',
      last_active_date: '2026-04-10',
      is_dormant: 1,
      duplicate_group: 'cloud_storage',
    },
    {
      id: 'sub_08',
      merchant: 'Google One Storage',
      plan_name: '100GB Google Drive',
      billing_cycle: 'monthly',
      current_price: 130.0,
      previous_price: 130.0,
      currency: 'INR',
      renewal_date: '2026-09-22',
      last_active_date: '2026-09-06',
      is_dormant: 0,
      duplicate_group: 'cloud_storage', // Duplicate cloud storage with Dropbox!
    },
    {
      id: 'sub_09',
      merchant: 'LinkedIn Premium Career',
      plan_name: 'Career InMail Booster',
      billing_cycle: 'monthly',
      current_price: 1550.0,
      previous_price: 1550.0,
      currency: 'INR',
      renewal_date: '2026-09-19',
      last_active_date: '2026-06-25',
      is_dormant: 1, // Dormant career boost
      duplicate_group: null,
    },
  ];

  for (const s of subscriptionsList) {
    insertSub.run(
      s.id,
      DEFAULT_USER_ID,
      s.merchant,
      s.plan_name,
      s.billing_cycle,
      s.current_price,
      s.previous_price,
      s.currency,
      s.renewal_date,
      s.last_active_date,
      s.is_dormant,
      s.duplicate_group,
      'active',
      now
    );
  }

  // 3. Insert Realistic Transactions
  const insertTx = db.prepare(`
    INSERT INTO transactions (
      id, user_id, date, merchant, amount, currency, category, is_recurring, status, note, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transactionsList = [
    // Duplicate charge within 3 hours
    { id: 'tx_01', date: '2026-08-28 14:15', merchant: 'Uber India', amount: 485.0, category: 'Transportation', is_recurring: 0, status: 'flagged', note: 'Potential duplicate ride fare' },
    { id: 'tx_02', date: '2026-08-28 14:18', merchant: 'Uber India', amount: 485.0, category: 'Transportation', is_recurring: 0, status: 'flagged', note: 'Identical amount billed 3 minutes later' },
    // Essential utility
    { id: 'tx_03', date: '2026-08-27', merchant: 'Tata Power Electricity', amount: 2840.0, category: 'Utilities', is_recurring: 1, status: 'cleared', note: 'Monthly residential power' },
    { id: 'tx_04', date: '2026-08-25', merchant: 'Airtel Fiber Broadband', amount: 1179.0, category: 'Utilities', is_recurring: 1, status: 'cleared', note: '300 Mbps unlimited plan' },
    // Subscriptions
    { id: 'tx_05', date: '2026-08-20', merchant: 'Netflix Premium 4K', amount: 649.0, category: 'Entertainment', is_recurring: 1, status: 'flagged', note: 'Increased from previous 499' },
    { id: 'tx_06', date: '2026-08-19', merchant: 'LinkedIn Premium Career', amount: 1550.0, category: 'Career', is_recurring: 1, status: 'flagged', note: 'No recorded InMails sent since June' },
    { id: 'tx_07', date: '2026-08-18', merchant: 'Dropbox Plus', amount: 820.0, category: 'Productivity', is_recurring: 1, status: 'flagged', note: 'Overlaps with Google One subscription' },
    { id: 'tx_08', date: '2026-08-15', merchant: 'Cult.Fit Gym Membership', amount: 1850.0, category: 'Fitness', is_recurring: 1, status: 'flagged', note: 'Zero gym check-ins in 90 days' },
    { id: 'tx_09', date: '2026-08-14', merchant: 'Apple Music Family', amount: 179.0, category: 'Entertainment', is_recurring: 1, status: 'flagged', note: 'Duplicate audio service with Spotify' },
    { id: 'tx_10', date: '2026-08-12', merchant: 'Spotify Individual', amount: 119.0, category: 'Entertainment', is_recurring: 1, status: 'cleared', note: 'Daily active usage' },
    // Cloud anomaly spike
    { id: 'tx_11', date: '2026-08-31', merchant: 'AWS Cloud Services', amount: 3450.0, category: 'Hosting', is_recurring: 1, status: 'flagged', note: 'Unattached EBS snapshot cost runaway' },
    // Food & Groceries
    { id: 'tx_12', date: '2026-08-29', merchant: 'Swiggy Gourmet', amount: 620.0, category: 'Food & Dining', is_recurring: 0, status: 'cleared', note: 'Dinner order' },
    { id: 'tx_13', date: '2026-08-24', merchant: 'Zepto Groceries', amount: 1240.0, category: 'Groceries', is_recurring: 0, status: 'cleared', note: 'Weekly essentials' },
    { id: 'tx_14', date: '2026-08-22', merchant: 'Google One Storage', amount: 130.0, category: 'Cloud Storage', is_recurring: 1, status: 'cleared', note: 'Active Gmail & Photos backup' },
  ];

  for (const t of transactionsList) {
    insertTx.run(
      t.id,
      DEFAULT_USER_ID,
      t.date,
      t.merchant,
      t.amount,
      'INR',
      t.category,
      t.is_recurring,
      t.status,
      t.note,
      now
    );
  }

  // 4. Insert Structured Bills
  const insertBill = db.prepare(`
    INSERT INTO bills (
      id, user_id, filename, file_type, merchant, bill_date, due_date, total_amount, tax, currency,
      category, is_recurring, raw_content, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertBillItem = db.prepare(`
    INSERT INTO bill_items (
      id, bill_id, description, quantity, unit_price, total_price, category
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const bill1 = {
    id: 'bill_aws_01',
    filename: 'AWS_Invoice_INV-982341.pdf',
    file_type: 'application/pdf',
    merchant: 'AWS Cloud Services',
    bill_date: '2026-08-31',
    due_date: '2026-09-10',
    total_amount: 3450.0,
    tax: 526.27,
    currency: 'INR',
    category: 'Cloud Infrastructure',
    is_recurring: 1,
    status: 'flagged' as const,
    items: [
      { id: 'bi_01', description: 'Amazon Elastic Compute Cloud (EC2)', quantity: 1, unit_price: 850.0, total_price: 850.0, category: 'Compute' },
      { id: 'bi_02', description: 'Unattached EBS gp3 Volumes & Orphan Snapshots', quantity: 4, unit_price: 518.43, total_price: 2073.73, category: 'Storage' },
      { id: 'bi_03', description: 'IGST (18%)', quantity: 1, unit_price: 526.27, total_price: 526.27, category: 'Tax' },
    ]
  };

  insertBill.run(
    bill1.id,
    DEFAULT_USER_ID,
    bill1.filename,
    bill1.file_type,
    bill1.merchant,
    bill1.bill_date,
    bill1.due_date,
    bill1.total_amount,
    bill1.tax,
    bill1.currency,
    bill1.category,
    bill1.is_recurring,
    'INVOICE #INV-982341 Amazon Web Services India Pvt Ltd Total: ₹3450.00',
    bill1.status,
    now
  );

  for (const item of bill1.items) {
    insertBillItem.run(item.id, bill1.id, item.description, item.quantity, item.unit_price, item.total_price, item.category);
  }

  const bill2 = {
    id: 'bill_netflix_01',
    filename: 'Netflix_Subscription_Receipt_Aug2026.pdf',
    file_type: 'application/pdf',
    merchant: 'Netflix Premium 4K',
    bill_date: '2026-08-20',
    due_date: '2026-08-20',
    total_amount: 649.0,
    tax: 99.0,
    currency: 'INR',
    category: 'Entertainment',
    is_recurring: 1,
    status: 'flagged' as const,
    items: [
      { id: 'bi_04', description: 'Netflix Ultra HD Monthly Plan (Price Adjusted)', quantity: 1, unit_price: 550.0, total_price: 550.0, category: 'Entertainment' },
      { id: 'bi_05', description: 'GST 18%', quantity: 1, unit_price: 99.0, total_price: 99.0, category: 'Tax' },
    ]
  };

  insertBill.run(
    bill2.id,
    DEFAULT_USER_ID,
    bill2.filename,
    bill2.file_type,
    bill2.merchant,
    bill2.bill_date,
    bill2.due_date,
    bill2.total_amount,
    bill2.tax,
    bill2.currency,
    bill2.category,
    bill2.is_recurring,
    'Netflix Receipt Aug 2026 Plan: Premium 4K Amount: ₹649 (previous was ₹499)',
    bill2.status,
    now
  );

  for (const item of bill2.items) {
    insertBillItem.run(item.id, bill2.id, item.description, item.quantity, item.unit_price, item.total_price, item.category);
  }

  // 5. Insert Default Agent Goal matching the Hackathon scenario
  const insertGoal = db.prepare(`
    INSERT INTO agent_goals (
      id, user_id, title, target_saving_amount, currency, constraints_json, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertGoal.run(
    'goal_hackathon_demo',
    DEFAULT_USER_ID,
    'Reduce my unnecessary monthly expenses by ₹5,000 without affecting essential services',
    5000.0,
    'INR',
    JSON.stringify(['do_not_cut_essential_power', 'keep_primary_fiber_internet', 'retain_daily_music_spotify']),
    'active',
    now,
    now
  );
}

// Database helper functions
export const dbHelpers = {
  // Users
  getUser(id: string = DEFAULT_USER_ID): User | undefined {
    return (db.prepare('SELECT * FROM users WHERE id = ?').get(id) as unknown) as User | undefined;
  },

  // Transactions
  getTransactions(userId: string = DEFAULT_USER_ID): Transaction[] {
    return (db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC').all(userId) as unknown) as Transaction[];
  },

  // Subscriptions
  getSubscriptions(userId: string = DEFAULT_USER_ID): Subscription[] {
    return (db.prepare('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY current_price DESC').all(userId) as unknown) as Subscription[];
  },

  updateSubscriptionStatus(id: string, status: string): void {
    db.prepare('UPDATE subscriptions SET status = ? WHERE id = ?').run(status, id);
  },

  // Bills
  getBills(userId: string = DEFAULT_USER_ID): Bill[] {
    const bills = (db.prepare('SELECT * FROM bills WHERE user_id = ? ORDER BY bill_date DESC').all(userId) as unknown) as Bill[];
    for (const b of bills) {
      b.items = (db.prepare('SELECT * FROM bill_items WHERE bill_id = ?').all(b.id) as unknown) as BillItem[];
    }
    return bills;
  },

  getBillById(id: string): Bill | undefined {
    const bill = (db.prepare('SELECT * FROM bills WHERE id = ?').get(id) as unknown) as Bill | undefined;
    if (bill) {
      bill.items = (db.prepare('SELECT * FROM bill_items WHERE bill_id = ?').all(bill.id) as unknown) as BillItem[];
    }
    return bill;
  },

  insertBill(bill: Omit<Bill, 'items'>, items: BillItem[]): void {
    db.prepare(`
      INSERT INTO bills (
        id, user_id, filename, file_type, merchant, bill_date, due_date, total_amount, tax, currency,
        category, is_recurring, raw_content, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      bill.id,
      bill.user_id,
      bill.filename,
      bill.file_type,
      bill.merchant,
      bill.bill_date,
      bill.due_date,
      bill.total_amount,
      bill.tax,
      bill.currency,
      bill.category,
      bill.is_recurring ? 1 : 0,
      bill.raw_content || '',
      bill.status,
      bill.created_at
    );

    const insertItem = db.prepare(`
      INSERT INTO bill_items (id, bill_id, description, quantity, unit_price, total_price, category)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const it of items) {
      insertItem.run(it.id, bill.id, it.description, it.quantity, it.unit_price, it.total_price, it.category);
    }
  },

  // Goals
  getGoals(userId: string = DEFAULT_USER_ID): AgentGoal[] {
    const rows = db.prepare('SELECT * FROM agent_goals WHERE user_id = ? ORDER BY created_at DESC').all(userId) as any[];
    return rows.map(r => ({
      ...r,
      constraints: JSON.parse(r.constraints_json || '[]'),
    }));
  },

  getGoalById(id: string): AgentGoal | undefined {
    const r = db.prepare('SELECT * FROM agent_goals WHERE id = ?').get(id) as any;
    if (!r) return undefined;
    return {
      ...r,
      constraints: JSON.parse(r.constraints_json || '[]'),
    };
  },

  createGoal(goal: { id: string; user_id: string; title: string; target_saving_amount: number; currency: string; constraints: string[] }): AgentGoal {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO agent_goals (id, user_id, title, target_saving_amount, currency, constraints_json, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      goal.id,
      goal.user_id,
      goal.title,
      goal.target_saving_amount,
      goal.currency,
      JSON.stringify(goal.constraints),
      'active',
      now,
      now
    );
    return {
      ...goal,
      status: 'active',
      created_at: now,
      updated_at: now,
    };
  },

  updateGoalStatus(id: string, status: string): void {
    const now = new Date().toISOString();
    db.prepare('UPDATE agent_goals SET status = ?, updated_at = ? WHERE id = ?').run(status, now, id);
  },

  // Agent Runs
  saveAgentRun(run: AgentRunState): void {
    const now = new Date().toISOString();
    const existing = db.prepare('SELECT id FROM agent_runs WHERE id = ?').get(run.run_id);
    if (existing) {
      db.prepare(`
        UPDATE agent_runs
        SET status = ?, current_phase = ?, state_json = ?, updated_at = ?
        WHERE id = ?
      `).run(run.status, run.current_phase, JSON.stringify(run), now, run.run_id);
    } else {
      db.prepare(`
        INSERT INTO agent_runs (id, goal_id, user_id, status, current_phase, state_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(run.run_id, run.goal_id, run.user_id, run.status, run.current_phase, JSON.stringify(run), now, now);
    }
  },

  getAgentRun(runId: string): AgentRunState | undefined {
    const row = db.prepare('SELECT state_json FROM agent_runs WHERE id = ?').get(runId) as { state_json: string } | undefined;
    if (!row) return undefined;
    return JSON.parse(row.state_json) as AgentRunState;
  },

  getLatestAgentRun(goalId?: string): AgentRunState | undefined {
    const query = goalId
      ? 'SELECT state_json FROM agent_runs WHERE goal_id = ? ORDER BY created_at DESC LIMIT 1'
      : 'SELECT state_json FROM agent_runs ORDER BY created_at DESC LIMIT 1';
    const row = (goalId ? db.prepare(query).get(goalId) : db.prepare(query).get()) as { state_json: string } | undefined;
    if (!row) return undefined;
    return JSON.parse(row.state_json) as AgentRunState;
  },

  // Agent Events
  logAgentEvent(event: AgentEvent): void {
    db.prepare(`
      INSERT INTO agent_events (id, run_id, timestamp, event_type, agent_name, tool_name, status, summary, details_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      event.id,
      event.run_id,
      event.timestamp,
      event.event_type,
      event.agent_name,
      event.tool_name || null,
      event.status,
      event.summary,
      event.details_json ? JSON.stringify(event.details_json) : null
    );
  },

  getAgentEvents(runId: string): AgentEvent[] {
    const rows = db.prepare('SELECT * FROM agent_events WHERE run_id = ? ORDER BY timestamp ASC').all(runId) as any[];
    return rows.map(r => ({
      ...r,
      details_json: r.details_json ? JSON.parse(r.details_json) : undefined,
    }));
  },

  // Actions
  saveActions(actions: AgentRunState['actions'], runId: string, goalId: string): void {
    const insert = db.prepare(`
      INSERT OR REPLACE INTO agent_actions (
        id, run_id, goal_id, target_merchant, action_type, description, priority,
        estimated_saving, currency, requires_approval, approval_status, execution_status,
        simulation_result, template_letter, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    for (const a of actions) {
      insert.run(
        a.id,
        runId,
        goalId,
        a.target_merchant,
        a.action_type,
        a.description,
        a.priority,
        a.estimated_saving,
        a.currency,
        a.requires_approval ? 1 : 0,
        a.approval_status,
        a.execution_status,
        a.simulation_result || null,
        a.template_letter || null,
        now
      );
    }
  },

  getActionById(id: string): any {
    return db.prepare('SELECT * FROM agent_actions WHERE id = ?').get(id);
  },

  updateActionApproval(id: string, approvalStatus: 'approved' | 'rejected', reason?: string): void {
    db.prepare('UPDATE agent_actions SET approval_status = ? WHERE id = ?').run(approvalStatus, id);
    const now = new Date().toISOString();
    const action = db.prepare('SELECT * FROM agent_actions WHERE id = ?').get(id) as any;
    if (action) {
      db.prepare(`
        INSERT INTO approvals (id, action_id, user_id, decision, reason, approved_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(`appr_${crypto.randomUUID().slice(0, 8)}`, id, DEFAULT_USER_ID, approvalStatus, reason || null, now);
    }
  },

  // Analytics
  getAnalyticsSummary(userId: string = DEFAULT_USER_ID) {
    const subs = this.getSubscriptions(userId);
    const txs = this.getTransactions(userId);
    const bills = this.getBills(userId);

    const totalMonthlyRecurring = subs
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + s.current_price, 0);

    const dormantSubs = subs.filter(s => s.is_dormant === 1 && s.status === 'active');
    const dormantSavingsMonthly = dormantSubs.reduce((sum, s) => sum + s.current_price, 0);

    const priceHikeSavingsMonthly = subs
      .filter(s => s.status === 'active' && s.previous_price && s.current_price > s.previous_price)
      .reduce((sum, s) => sum + (s.current_price - (s.previous_price || s.current_price)), 0);

    const totalPotentialMonthly = dormantSavingsMonthly + priceHikeSavingsMonthly + 485.0; // including duplicate uber charge
    const totalPotentialAnnual = totalPotentialMonthly * 12;

    const totalSpentAnalyzed = txs.reduce((sum, t) => sum + t.amount, 0);

    return {
      currency: 'INR',
      total_spent_analyzed: Math.round(totalSpentAnalyzed * 100) / 100,
      total_transactions_analyzed: txs.length,
      total_bills_uploaded: bills.length,
      active_subscriptions_count: subs.filter(s => s.status === 'active').length,
      dormant_subscriptions_count: dormantSubs.length,
      price_increases_detected_count: subs.filter(s => s.previous_price && s.current_price > s.previous_price).length,
      potential_monthly_savings: Math.round(totalPotentialMonthly * 100) / 100,
      potential_annual_savings: Math.round(totalPotentialAnnual * 100) / 100,
      monthly_recurring_spend: Math.round(totalMonthlyRecurring * 100) / 100,
    };
  }
};
