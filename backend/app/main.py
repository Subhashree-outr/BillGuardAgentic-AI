"""
FastAPI Backend Application Entry Point for BillGuard
"""

import os
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
from dotenv import load_dotenv

load_dotenv()

from .database.connection import engine, Base, get_db
from .models.models import User, Bill, BillItem, Transaction, Subscription, AgentGoal, AgentRun, AgentEvent, AgentAction
from .schemas.schemas import (
    UserRegisterRequest,
    UserLoginRequest,
    GoalCreateRequest,
    GoalRunRequest,
    ActionApprovalRequest,
    ScenarioRunRequest,
)

# Initialize Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="BillGuard - Agentic Financial Audit API",
    description="Full-stack autonomous bill and subscription auditor powered by specialized agents and Google Gemini.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "hasGeminiKey": bool(os.getenv("GEMINI_API_KEY")),
        "framework": "FastAPI + SQLAlchemy",
        "model": "gemini-3.8-flash"
    }

@app.post("/api/auth/register")
def register_user(req: UserRegisterRequest, db=Depends(get_db)):
    user = User(
        email=req.email,
        name=req.name,
        currency_preference=req.currency or "INR"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"success": True, "user": {"id": user.id, "email": user.email, "name": user.name}}

@app.post("/api/auth/login")
def login_user(req: UserLoginRequest, db=Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        user = User(email=req.email, name="Demo User", currency_preference="INR")
        db.add(user)
        db.commit()
        db.refresh(user)
    return {"success": True, "user": {"id": user.id, "email": user.email, "name": user.name}, "token": "tok_demo_python_session"}

@app.get("/api/bills")
def get_bills(db=Depends(get_db)):
    bills = db.query(Bill).all()
    return {"success": True, "count": len(bills), "bills": bills}

@app.get("/api/transactions")
def get_transactions(db=Depends(get_db)):
    txs = db.query(Transaction).all()
    return {"success": True, "count": len(txs), "transactions": txs}

@app.get("/api/subscriptions")
def get_subscriptions(db=Depends(get_db)):
    subs = db.query(Subscription).all()
    return {"success": True, "count": len(subs), "subscriptions": subs}

@app.post("/api/agent/goals")
def create_goal(req: GoalCreateRequest, db=Depends(get_db)):
    goal = AgentGoal(
        user_id="usr_demo",
        title=req.title,
        target_saving_amount=req.target_saving_amount,
        currency=req.currency or "INR",
        constraints_json="[]"
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return {"success": True, "goal": {"id": goal.id, "title": goal.title, "target": goal.target_saving_amount}}

@app.get("/api/analytics/summary")
def get_analytics(db=Depends(get_db)):
    return {
        "success": True,
        "summary": {
            "currency": "INR",
            "total_spent_analyzed": 15596.0,
            "total_transactions_analyzed": 14,
            "total_bills_uploaded": 2,
            "active_subscriptions_count": 9,
            "dormant_subscriptions_count": 5,
            "price_increases_detected_count": 3,
            "potential_monthly_savings": 7963.0,
            "potential_annual_savings": 95556.0,
            "monthly_recurring_spend": 9046.0
        }
    }
