"""
SQLAlchemy ORM Models for BillGuard
Defines all 12 core tables specified for Agentic Financial Auditing.
"""

import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    Text
)
from sqlalchemy.orm import relationship
from ..database.connection import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=True)
    currency_preference = Column(String, default="INR")
    created_at = Column(DateTime, default=datetime.utcnow)

    bills = relationship("Bill", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")
    subscriptions = relationship("Subscription", back_populates="user")
    goals = relationship("AgentGoal", back_populates="user")

class Bill(Base):
    __tablename__ = "bills"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    merchant = Column(String, nullable=False, index=True)
    bill_date = Column(String, nullable=False)
    due_date = Column(String, nullable=False)
    total_amount = Column(Float, nullable=False)
    tax = Column(Float, default=0.0)
    currency = Column(String, default="INR")
    category = Column(String, nullable=False)
    is_recurring = Column(Boolean, default=False)
    raw_content = Column(Text, nullable=True)
    status = Column(String, default="processed")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="bills")
    items = relationship("BillItem", back_populates="bill", cascade="all, delete-orphan")

class BillItem(Base):
    __tablename__ = "bill_items"

    id = Column(String, primary_key=True, default=generate_uuid)
    bill_id = Column(String, ForeignKey("bills.id"), nullable=False, index=True)
    description = Column(String, nullable=False)
    quantity = Column(Float, default=1.0)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    category = Column(String, nullable=False)

    bill = relationship("Bill", back_populates="items")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    bill_id = Column(String, nullable=True)
    date = Column(String, nullable=False, index=True)
    merchant = Column(String, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="INR")
    category = Column(String, nullable=False)
    is_recurring = Column(Boolean, default=False)
    status = Column(String, default="cleared")
    note = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="transactions")

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    merchant = Column(String, nullable=False, index=True)
    plan_name = Column(String, nullable=False)
    billing_cycle = Column(String, default="monthly")
    current_price = Column(Float, nullable=False)
    previous_price = Column(Float, nullable=True)
    currency = Column(String, default="INR")
    renewal_date = Column(String, nullable=False)
    last_active_date = Column(String, nullable=False)
    is_dormant = Column(Boolean, default=False)
    duplicate_group = Column(String, nullable=True)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="subscriptions")

class AgentGoal(Base):
    __tablename__ = "agent_goals"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    target_saving_amount = Column(Float, nullable=False)
    currency = Column(String, default="INR")
    constraints_json = Column(Text, default="[]")
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="goals")
    runs = relationship("AgentRun", back_populates="goal")

class AgentRun(Base):
    __tablename__ = "agent_runs"

    id = Column(String, primary_key=True, default=generate_uuid)
    goal_id = Column(String, ForeignKey("agent_goals.id"), nullable=False, index=True)
    user_id = Column(String, nullable=False)
    status = Column(String, default="running")
    current_phase = Column(String, nullable=False)
    state_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    goal = relationship("AgentGoal", back_populates="runs")
    events = relationship("AgentEvent", back_populates="run")

class AgentEvent(Base):
    __tablename__ = "agent_events"

    id = Column(String, primary_key=True, default=generate_uuid)
    run_id = Column(String, ForeignKey("agent_runs.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    event_type = Column(String, nullable=False)
    agent_name = Column(String, nullable=False)
    tool_name = Column(String, nullable=True)
    status = Column(String, nullable=False)
    summary = Column(Text, nullable=False)
    details_json = Column(Text, nullable=True)

    run = relationship("AgentRun", back_populates="events")

class AgentAction(Base):
    __tablename__ = "agent_actions"

    id = Column(String, primary_key=True, default=generate_uuid)
    run_id = Column(String, nullable=False, index=True)
    goal_id = Column(String, nullable=False, index=True)
    target_merchant = Column(String, nullable=False)
    action_type = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(Integer, nullable=False)
    estimated_saving = Column(Float, nullable=False)
    currency = Column(String, default="INR")
    requires_approval = Column(Boolean, default=True)
    approval_status = Column(String, default="pending")
    execution_status = Column(String, default="pending")
    simulation_result = Column(Text, nullable=True)
    template_letter = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Approval(Base):
    __tablename__ = "approvals"

    id = Column(String, primary_key=True, default=generate_uuid)
    action_id = Column(String, ForeignKey("agent_actions.id"), nullable=False, index=True)
    user_id = Column(String, nullable=False)
    decision = Column(String, nullable=False)
    reason = Column(String, nullable=True)
    approved_at = Column(DateTime, default=datetime.utcnow)

class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, nullable=False, index=True)
    run_id = Column(String, nullable=True)
    anomaly_type = Column(String, nullable=False)
    merchant = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="INR")
    severity = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    evidence = Column(Text, nullable=False)
    recommended_action = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class FinancialInsight(Base):
    __tablename__ = "financial_insights"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    metric_key = Column(String, nullable=False)
    metric_value = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    impact = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
