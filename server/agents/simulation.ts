import { AgentRunState } from '../types';

export function simulateAction(action: AgentRunState['actions'][number]) {
  const impact = action.action_type === 'cancel_subscription' ? 'Service access may be lost.' : action.action_type === 'downgrade_plan' ? 'Some plan benefits may be reduced.' : 'The charge or budget behavior will be reviewed.';
  const risk: 'low' | 'medium' = action.action_type === 'dispute_charge' || action.action_type === 'cancel_subscription' ? 'medium' : 'low';
  return { monthly_saving: action.estimated_saving, annual_saving: action.estimated_saving * 12, service_impact: impact, reversible: true, risk };
}

export function buildCandidatePlans(actions: AgentRunState['actions'], target: number) {
  const plans = [
    { id: 'conservative', name: 'Conservative', description: 'Prefer lower-risk, reversible changes.', actions: actions.filter(action => action.risk === 'low') },
    { id: 'balanced', name: 'Balanced', description: 'Mix meaningful savings with moderate service impact.', actions: actions.filter(action => action.risk !== 'high') },
    { id: 'maximum', name: 'Maximum Savings', description: 'Include every approval-required opportunity.', actions },
  ];
  return plans.map(plan => {
    const savings = plan.actions.reduce((sum, action) => sum + action.estimated_saving, 0);
    const hasHighRisk = plan.actions.some(action => action.risk === 'high');
    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      action_ids: plan.actions.map(action => action.id),
      projected_monthly_savings: Math.round(savings * 100) / 100,
      projected_annual_savings: Math.round(savings * 1200) / 100,
      risk: hasHighRisk ? 'high' as const : plan.id === 'balanced' ? 'medium' as const : 'low' as const,
      recommended: Math.abs(savings - target) < Math.abs((actions.reduce((sum, action) => sum + action.estimated_saving, 0)) - target),
    };
  });
}
