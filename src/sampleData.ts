import { SampleDataset } from './types';

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: 'tech-worker-statement',
    name: 'Personal & SaaS Billing Statement (CSV)',
    description: 'Includes duplicate SaaS charge, Netflix price hike, forgotten Ancestry.com sub, runaway AWS spend, and upcoming annual domain renewal.',
    format: 'csv',
    content: `Date,Merchant,Amount,Category,Description
2026-08-01,Netflix,19.99,Entertainment,Monthly Standard Streaming
2026-07-01,Netflix,15.49,Entertainment,Monthly Standard Streaming
2026-06-01,Netflix,15.49,Entertainment,Monthly Standard Streaming
2026-08-03,Figma Inc,15.00,Software,Figma Professional User Seat
2026-08-03,Figma Inc,15.00,Software,Figma Professional User Seat (Duplicate Invoice #98234)
2026-08-05,Ancestry.com,29.99,Subscriptions,Monthly Family History - 0 Logins in 90 Days
2026-07-05,Ancestry.com,29.99,Subscriptions,Monthly Family History
2026-06-05,Ancestry.com,29.99,Subscriptions,Monthly Family History
2026-08-10,Amazon Web Services,542.80,Cloud Services,AWS Monthly Bill - High Data Transfer Spike
2026-07-10,Amazon Web Services,38.10,Cloud Services,AWS Monthly Bill EC2 / S3
2026-06-10,Amazon Web Services,34.50,Cloud Services,AWS Monthly Bill EC2 / S3
2026-08-12,Spotify USA,11.99,Music,Monthly Premium Individual
2026-07-12,Spotify USA,11.99,Music,Monthly Premium Individual
2026-08-15,Uber Technologies,26.40,Transportation,Ride to SFO Airport
2026-08-15,Uber Technologies,26.40,Transportation,Ride to SFO Airport (Duplicate Pending Transaction)
2026-08-18,Calm.com,69.99,Health & Wellness,Annual Premium Renewal due 2026-09-18
2026-08-20,Trader Joes,84.15,Groceries,Weekly Groceries
2026-08-27,Namecheap Domains,48.00,Web Services,Upcoming Multi-Domain Renewal Scheduled 2026-09-12
2026-08-29,Gym Equinox,280.00,Fitness,Monthly All-Access Membership`
  },
  {
    id: 'streaming-fitness-json',
    name: 'Subscriptions & Card Export (JSON)',
    description: 'JSON format showing price increases, forgotten gym add-ons, and recurring billing renewals.',
    format: 'json',
    content: JSON.stringify([
      { "date": "2026-08-02", "merchant": "Adobe Creative Cloud", "amount": 59.99, "status": "posted", "billing_cycle": "monthly", "notes": "Price increased from $54.99 in July" },
      { "date": "2026-07-02", "merchant": "Adobe Creative Cloud", "amount": 54.99, "status": "posted", "billing_cycle": "monthly" },
      { "date": "2026-08-04", "merchant": "Planet Fitness", "amount": 24.99, "status": "posted", "billing_cycle": "monthly", "notes": "Classic black card membership" },
      { "date": "2026-08-04", "merchant": "Planet Fitness", "amount": 24.99, "status": "posted", "billing_cycle": "monthly", "notes": "Double processed charge on same merchant terminal #449" },
      { "date": "2026-08-07", "merchant": "Babbel Language App", "amount": 14.95, "status": "posted", "billing_cycle": "monthly", "notes": "Dormant: No activity logged for 120 days" },
      { "date": "2026-07-07", "merchant": "Babbel Language App", "amount": 14.95, "status": "posted", "billing_cycle": "monthly" },
      { "date": "2026-06-07", "merchant": "Babbel Language App", "amount": 14.95, "status": "posted", "billing_cycle": "monthly" },
      { "date": "2026-08-11", "merchant": "DoorDash", "amount": 218.40, "status": "posted", "notes": "Unusual bulk catering order vs regular $35 avg" },
      { "date": "2026-08-14", "merchant": "The New York Times", "amount": 4.00, "status": "posted", "billing_cycle": "monthly", "notes": "Promo expiring soon - renewal goes to $25.00 on 2026-09-14" },
      { "date": "2026-08-25", "merchant": "GitHub Copilot", "amount": 10.00, "status": "posted", "billing_cycle": "monthly", "renewal_date": "2026-09-25" }
    ], null, 2)
  },
  {
    id: 'bank-statement-text',
    name: 'Raw Bank Statement (Text / Paste)',
    description: 'Plain text export from Chase/Bank of America online statement with duplicates and unexpected charges.',
    format: 'text',
    content: `ACCOUNT STATEMENT SUMMARY - CARD ENDING 8492
TRANSACTION HISTORY (RECENT 60 DAYS):

08/04/2026  CHEGG STUDY MONTHLY           -$19.95  (Recurring sub - zero sessions recorded)
07/04/2026  CHEGG STUDY MONTHLY           -$19.95
06/04/2026  CHEGG STUDY MONTHLY           -$19.95
08/08/2026  APPLE.COM/BILL                -$9.99   iCloud+ 2TB Storage
08/08/2026  APPLE.COM/BILL                -$9.99   iCloud+ 2TB Storage (Duplicate identical charge ref #849201)
08/14/2026  OPENAI CHATGPT PLUS           -$22.00  (Price increase: previously $20.00 in July)
07/14/2026  OPENAI CHATGPT PLUS           -$20.00
08/17/2026  VALVE STEAM STORE             -$289.45 UNUSUAL SPEND: 10x higher than typical monthly gaming ($25)
08/21/2026  NORDVPN 2-YEAR PLAN           -$99.00  Auto-renewal scheduled for 2026-09-21
08/25/2026  WHOLE FOODS MKT               -$64.20
08/28/2026  CON EDISON UTILITY            -$142.10
08/30/2026  DROPBOX PLUS ANNUAL           -$119.88 Renewal date upcoming: 2026-09-15`
  },
  {
    id: 'autopilot-inr-statement',
    name: 'INR Goal Autopilot Statement (₹5,000 Savings Demo)',
    description: 'Specialized ledger with suspicious ₹2,999 subscription, ₹999 duplicate charge, ₹2,999 telecom price increase, and ₹999 forgotten cloud storage.',
    format: 'csv',
    suggested_goal: 5000,
    currency: '₹',
    content: `Date,Merchant,Amount,Category,Description
2026-08-01,StreamPlus Pro Premium,2999,Subscriptions,Suspicious unverified recurring sub - zero recorded logins
2026-08-03,Chegg Study India,999,Education,Monthly Study Suite - Essential for work & research
2026-07-03,Chegg Study India,999,Education,Monthly Study Suite
2026-08-05,Swiggy Gourmet,999,Food & Dining,Bangalore Dinner Order
2026-08-05,Swiggy Gourmet,999,Food & Dining,Bangalore Dinner Order (Duplicate identical transaction ID #83921)
2026-08-08,Airtel Xstream Fiber,2999,Utilities,Fiber Gigabit Plan - Price increased from 1999 in July
2026-07-08,Airtel Xstream Fiber,1999,Utilities,Fiber Gigabit Plan
2026-08-11,CloudVault India,999,Cloud Services,Dormant backup tier - 0 logins in 120 days
2026-08-14,Cult.fit Elite Gym,1499,Fitness,Monthly Gym Access
2026-08-20,Hotstar Disney Premium,1499,Entertainment,Annual Renewal scheduled for 2026-09-20
2026-08-24,Amazon India Shopping,3450,Retail,Household Essentials`
  }
];
