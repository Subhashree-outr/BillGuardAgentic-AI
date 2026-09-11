"""
Pydantic Request and Response Schemas for BillGuard REST API
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime

class UserRegisterRequest(BaseModel):
    email: str
    name: str
    password: Optional[str] = None
    currency: Optional[str] = "INR"

class UserLoginRequest(BaseModel):
    email: str
    password: Optional[str] = None

class BillItemSchema(BaseModel):
    id: Optional[str] = None
    description: str
    quantity: float = 1.0
    unit_price: float
    total_price: float
    category: str

class BillResponseSchema(BaseModel):
    id: str
    merchant: str
    bill_date: str
    due_date: str
    total_amount: float
    tax: float
    currency: str
    category: str
    is_recurring: bool
    status: str
    items: Optional[List[BillItemSchema]] = []

class TransactionResponseSchema(BaseModel):
    id: str
    date: str
    merchant: str
    amount: float
    currency: str
    category: str
    is_recurring: bool
    status: str
    note: Optional[str] = None

class SubscriptionResponseSchema(BaseModel):
    id: str
    merchant: str
    plan_name: str
    billing_cycle: str
    current_price: float
    previous_price: Optional[float] = None
    currency: str
    renewal_date: str
    last_active_date: str
    is_dormant: bool
    duplicate_group: Optional[str] = None
    status: str

class GoalCreateRequest(BaseModel):
    title: str
    target_saving_amount: float
    currency: Optional[str] = "INR"
    constraints: Optional[List[str]] = []

class GoalRunRequest(BaseModel):
    forceToolFailure: Optional[bool] = False
    userConstraintOverride: Optional[str] = None

class ActionApprovalRequest(BaseModel):
    reason: Optional[str] = None

class ScenarioRunRequest(BaseModel):
    scenarioId: int = Field(..., ge=1, le=5)

class AnalyticsSummaryResponse(BaseModel):
    currency: str
    total_spent_analyzed: float
    total_transactions_analyzed: int
    total_bills_uploaded: int
    active_subscriptions_count: int
    dormant_subscriptions_count: int
    price_increases_detected_count: int
    potential_monthly_savings: float
    potential_annual_savings: float
    monthly_recurring_spend: float
