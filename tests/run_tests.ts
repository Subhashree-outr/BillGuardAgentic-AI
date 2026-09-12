/**
 * Automated Test Suite for BillGuard Multi-Agent System & Workflows
 */

import { initDatabase, dbHelpers, seedSyntheticData, DEFAULT_USER_ID } from '../server/db';
import {
  bill_parser_tool,
  transaction_analysis_tool,
  subscription_detection_tool,
  historical_comparison_tool,
  merchant_verification_tool,
  savings_calculator_tool,
  setMerchantVerificationForceFail,
} from '../server/tools';
import { runAgenticWorkflow } from '../server/agents';

async function runTests() {
  console.log('====================================================');
  console.log('  BillGuard Autonomous Agent Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
    }
  }

  // Init DB
  initDatabase();
  seedSyntheticData();

  // 1. Bill Parsing Tool Test
  console.log('--- Test 1: Bill Parsing Tool ---');
  const sampleBillText = `
    INVOICE #INV-982341
    Amazon Web Services India Pvt Ltd
    Date: 2026-08-31
    EC2 Compute Instances: ₹850.00
    Unattached EBS Volumes: ₹2073.73
    Total Amount: ₹3450.00
  `;
  const parsed = await bill_parser_tool({ text: sampleBillText, filename: 'aws.txt' });
  assert(parsed.total_amount > 0, 'Parsed total amount successfully');
  assert(parsed.merchant.includes('AWS') || parsed.merchant.length > 0, 'Extracted merchant name');
  assert(parsed.line_items.length > 0, 'Extracted structured line items');

  // 2. Transaction Analysis & Duplicate Detection Test
  console.log('\n--- Test 2: Anomaly Detection & Duplicate Detection ---');
  const txAnalysis = transaction_analysis_tool(DEFAULT_USER_ID);
  assert(txAnalysis.total_transactions > 0, 'Ingested transactions from database');
  assert(txAnalysis.duplicates_detected.length > 0, 'Detected duplicate charges (e.g. Uber ₹485 within minutes)');
  assert(txAnalysis.duplicates_detected[0].merchant === 'Uber India', 'Correctly identified duplicate merchant');

  // 3. Subscription Detection & Dormancy Test
  console.log('\n--- Test 3: Subscription Detection & Dormancy Audit ---');
  const subAnalysis = subscription_detection_tool(DEFAULT_USER_ID);
  assert(subAnalysis.total_subscriptions > 0, 'Retrieved active subscriptions');
  assert(subAnalysis.dormant_subscriptions.length > 0, 'Identified dormant subscriptions (>90 days inactive)');
  const gym = subAnalysis.dormant_subscriptions.find(s => s.merchant.includes('Cult.Fit'));
  assert(!!gym, 'Flagged Cult.Fit gym membership as dormant');

  // 4. Historical Comparison Tool (Price Hikes)
  console.log('\n--- Test 4: Historical Comparison & Price Hikes ---');
  const hist = historical_comparison_tool('Netflix', 649.0, DEFAULT_USER_ID);
  assert(hist.has_history, 'Found historical baseline for Netflix');
  assert(hist.is_price_hike, 'Flagged price hike from ₹499 to ₹649');
  assert(hist.percentage_change >= 29, 'Accurately calculated +30% price hike');

  // 5. Tool Failure Handling & Fallback Test
  console.log('\n--- Test 5: Tool Failure Handling & Fallback Investigation ---');
  try {
    merchant_verification_tool('Cult.Fit', { forceFail: true });
    assert(false, 'Should have thrown simulated 503 error');
  } catch (err: any) {
    assert(err.code === 'SERVICE_UNAVAILABLE', 'Primary merchant tool threw simulated 503 gateway error');
  }

  // 6. Savings Calculator Tool Test
  console.log('\n--- Test 6: Savings Calculator Tool ---');
  const sampleActions = [
    { estimated_saving: 1850 },
    { estimated_saving: 820 },
    { estimated_saving: 485 },
  ];
  const savings = savings_calculator_tool(sampleActions);
  assert(savings.total_monthly_savings === 3155, 'Calculated correct monthly savings sum');
  assert(savings.total_annual_savings === 3155 * 12, 'Calculated correct annual savings projection');

  // 7. Human-in-the-loop Consequential Action Approval
  console.log('\n--- Test 7: Human-in-the-Loop Action Approval Workflow ---');
  const testActionId = 'act_test_approval_01';
  dbHelpers.saveActions([{
    id: testActionId,
    target_merchant: 'Cult.Fit Gym Membership',
    action_type: 'cancel_subscription',
    description: 'Cancel dormant gym membership',
    priority: 1,
    estimated_saving: 1850,
    currency: 'INR',
    requires_approval: true,
    approval_status: 'pending',
    execution_status: 'pending',
  }], 'run_test_01', 'goal_hackathon_demo');

  let action = dbHelpers.getActionById(testActionId);
  assert(action.approval_status === 'pending', 'Action created with pending approval');
  dbHelpers.updateActionApproval(testActionId, 'approved');
  action = dbHelpers.getActionById(testActionId);
  assert(action.approval_status === 'approved', 'Action successfully approved by human reviewer');

  // 8. End-to-End Autonomous Agentic Workflow & Replanning
  console.log('\n--- Test 8: End-to-End Goal -> Replanning -> Final Outcome ---');
  const workflowState = await runAgenticWorkflow(
    'goal_hackathon_demo',
    'Reduce my unnecessary monthly expenses by ₹5,000 without affecting essential services',
    { userId: DEFAULT_USER_ID, forceToolFailure: false }
  );

  assert(workflowState.current_phase === 'OUTCOME', 'Workflow traversed through all phases to OUTCOME');
  assert(workflowState.observations.length > 0, 'Agent recorded initial observations');
  assert(workflowState.detected_issues.length > 0, 'Agent detected billing issues & anomalies');
  assert(workflowState.actions.length > 0, 'Agent generated prioritized actions');
  assert(workflowState.reasoning_trace.length > 0, 'Supervisor recorded explicit tool-selection reasoning');
  assert(workflowState.tool_history.length > 0, 'Supervisor executed tools through the registry');
  assert(workflowState.selected_tools.some(tool => tool.status === 'succeeded'), 'Registry tool call completed successfully');
  assert(workflowState.replanning_status.is_replanning === true, 'Replanning Agent was autonomously triggered when initial plan < ₹5,000');
  assert(workflowState.evaluation.projected_savings >= 5000, `Achieved target savings (₹${workflowState.evaluation.projected_savings} >= ₹5,000)`);
  assert(workflowState.status === 'waiting_for_approval', 'Consequential actions safely paused in waiting_for_approval state');

  console.log('\n====================================================');
  console.log(`  Test Results: ${passed} / ${total} Passed`);
  console.log('====================================================\n');

  if (passed === total) {
    console.log('🎉 ALL AUTOMATED TESTS PASSED SUCCESSFULLY!');
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
