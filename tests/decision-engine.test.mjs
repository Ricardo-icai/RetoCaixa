import { test } from 'node:test';
import assert from 'node:assert/strict';
import { InvestmentDecisionEngine as Engine } from '../packages/decision-engine/src/index.ts';
const profile = { monthlyIncome: 1500, essentialExpenses: 900, emergencyBufferMonths: 4, riskToleranceScore: 50, riskCapacityScore: 60, goalHorizonMonths: 120, availableInvestableCash: 30, hasHighCostDebt: false };
test('low buffer and debt each prevent investment', () => {
  for (const patch of [{ emergencyBufferMonths: 1 }, { hasHighCostDebt: true }]) assert.equal(Engine.evaluateUserSnapshot({ ...profile, ...patch }).recommendedAction, 'PROTECT');
});
test('short horizon and low capacity cannot be offset by tolerance', () => {
  for (const patch of [{ goalHorizonMonths: 8 }, { riskCapacityScore: 10, riskToleranceScore: 100 }]) assert.notEqual(Engine.evaluateUserSnapshot({ ...profile, ...patch }).recommendedAction, 'INVEST');
});
test('amount is capped by disposable cash', () => {
  const response = Engine.evaluateUserSnapshot({ ...profile, availableInvestableCash: 1000 });
  assert.equal(response.primaryCTA.payload.amount, 600);
});
test('missing and nonfinite data ask for clarification', () => {
  assert.equal(Engine.evaluateUserSnapshot({ ...profile, monthlyIncome: NaN }).recommendedAction, 'ASK_CLARIFICATION');
  const incomplete = { ...profile }; delete incomplete.essentialExpenses;
  assert.equal(Engine.evaluateUserSnapshot(incomplete).recommendedAction, 'ASK_CLARIFICATION');
});
test('demo eligible profile receives simulated proposal', () => {
  assert.equal(Engine.evaluateUserSnapshot(profile).recommendedAction, 'INVEST');
});
