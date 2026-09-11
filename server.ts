import express from "express";
import path from "path";
import crypto from "node:crypto";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { initDatabase, dbHelpers, seedSyntheticData, DEFAULT_USER_ID } from "./server/db";
import { runAgenticWorkflow } from "./server/agents";
import { bill_parser_tool, setMerchantVerificationForceFail, currency_conversion_tool } from "./server/tools";
import { analyzeBillingDataDeterministic } from "./server/analyzer";
import { setupChatRoute } from "./server/chat";
import { watcher } from "./server/watcher";

dotenv.config();

// Initialize SQLite database & synthetic data
initDatabase();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // File upload configuration with 10MB limit and sanitized in-memory buffer
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // Initialize Gemini AI client if key exists
  let ai: GoogleGenAI | null = null;
  if (process.env.GEMINI_API_KEY) {
    try {
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build-billguard',
          },
        },
      });
    } catch (e) {
      console.error("[BillGuard] Failed to init GoogleGenAI:", e);
    }
  }

  // ==========================================
  // REST API ENDPOINTS (SECTION 7 SPECIFICATION)
  // ==========================================

  // 1. Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      model: "gemini-3.8-flash",
      database: "sqlite3",
      timestamp: new Date().toISOString(),
    });
  });

  // 2. Authentication (Mock-Safe / Local Dev)
  app.post("/api/auth/register", (req, res) => {
    const { email, name, password, currency } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: "Email and name are required." });
    }
    const user = {
      id: `usr_${crypto.randomUUID().slice(0, 8)}`,
      email,
      name,
      currency_preference: currency || "INR",
      created_at: new Date().toISOString(),
    };
    return res.status(201).json({ success: true, user, token: `tok_${crypto.randomUUID().slice(0, 16)}` });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email } = req.body;
    const user = dbHelpers.getUser() || {
      id: DEFAULT_USER_ID,
      email: email || "demo.user@billguard.ai",
      name: "Alex Mercer",
      currency_preference: "INR",
      created_at: new Date().toISOString(),
    };
    return res.json({ success: true, user, token: `tok_${crypto.randomUUID().slice(0, 16)}` });
  });

  // 3. Bills Upload & Extraction
  app.post("/api/bills/upload", upload.single("file"), async (req, res) => {
    try {
      let fileText = "";
      let filename = "uploaded_document.txt";
      let fileType = "text/plain";
      let imageBase64: string | undefined;

      if (req.file) {
        filename = req.file.originalname;
        fileType = req.file.mimetype;
        if (fileType.includes("image")) {
          imageBase64 = req.file.buffer.toString("base64");
          fileText = "IMAGE_UPLOAD";
        } else if (fileType === "application/pdf") {
          try {
            const pdfParse = require('pdf-parse');
            const data = await pdfParse(req.file.buffer);
            fileText = data.text;
          } catch (e) {
            console.error("PDF parse failed:", e);
            fileText = "Failed to parse PDF.";
          }
        } else {
          fileText = req.file.buffer.toString("utf-8");
        }
      } else if (req.body.text || req.body.rawContent) {
        fileText = req.body.text || req.body.rawContent;
        filename = req.body.filename || "pasted_statement.txt";
      } else {
        return res.status(400).json({ error: "Please upload a bill file or provide text content." });
      }

      // Execute Bill Parser Tool
      const extracted = await bill_parser_tool({
        text: fileText,
        filename,
        aiInstance: ai,
        imageBase64,
        mimeType: imageBase64 ? fileType : undefined,
      });

      const billId = `bill_${crypto.randomUUID().slice(0, 8)}`;
      const now = new Date().toISOString();

      const newBill = {
        id: billId,
        user_id: DEFAULT_USER_ID,
        filename,
        file_type: fileType,
        merchant: extracted.merchant,
        bill_date: extracted.bill_date,
        due_date: extracted.due_date,
        total_amount: extracted.total_amount,
        tax: extracted.tax,
        currency: extracted.currency,
        category: extracted.category,
        is_recurring: extracted.is_recurring,
        raw_content: fileText.slice(0, 2000),
        status: "processed" as const,
        created_at: now,
      };

      const billItems = extracted.line_items.map((li, idx) => ({
        id: `bi_${crypto.randomUUID().slice(0, 8)}_${idx}`,
        bill_id: billId,
        description: li.description,
        quantity: li.quantity || 1,
        unit_price: li.unit_price || li.total_price,
        total_price: li.total_price,
        category: li.category || extracted.category,
      }));

      dbHelpers.insertBill(newBill, billItems);

      return res.status(201).json({
        success: true,
        bill: { ...newBill, items: billItems },
        extracted_summary: extracted.raw_summary,
      });
    } catch (err: any) {
      console.error("Bill upload failed:", err);
      return res.status(500).json({ error: err.message || "Failed to process uploaded bill." });
    }
  });

  app.get("/api/bills", (req, res) => {
    const bills = dbHelpers.getBills();
    res.json({ success: true, count: bills.length, bills });
  });

  app.get("/api/bills/:id", (req, res) => {
    const bill = dbHelpers.getBillById(req.params.id);
    if (!bill) return res.status(404).json({ error: "Bill not found." });
    res.json({ success: true, bill });
  });

  // 4. Transactions Ledger
  app.get("/api/transactions", (req, res) => {
    const transactions = dbHelpers.getTransactions();
    res.json({ success: true, count: transactions.length, transactions });
  });

  // 5. Subscriptions Management
  app.get("/api/subscriptions", (req, res) => {
    const subscriptions = dbHelpers.getSubscriptions();
    res.json({ success: true, count: subscriptions.length, subscriptions });
  });

  // 6. Agent Goals & Runs (Autonomous State Machine)
  app.get("/api/agent/goals", (req, res) => {
    const goals = dbHelpers.getGoals();
    res.json({ success: true, goals });
  });

  app.post("/api/agent/goals", (req, res) => {
    const { title, target_saving_amount, currency, constraints } = req.body;
    if (!title || target_saving_amount === undefined) {
      return res.status(400).json({ error: "Goal title and target saving amount are required." });
    }
    const goal = dbHelpers.createGoal({
      id: `goal_${crypto.randomUUID().slice(0, 8)}`,
      user_id: DEFAULT_USER_ID,
      title,
      target_saving_amount: Number(target_saving_amount),
      currency: currency || "INR",
      constraints: Array.isArray(constraints) ? constraints : [],
    });
    res.status(201).json({ success: true, goal });
  });

  app.get("/api/agent/goals/:id", (req, res) => {
    const goal = dbHelpers.getGoalById(req.params.id);
    if (!goal) return res.status(404).json({ error: "Goal not found." });
    res.json({ success: true, goal });
  });

  // Trigger Autonomous Multi-Agent Loop
  app.post("/api/agent/goals/:id/run", async (req, res) => {
    try {
      const goalId = req.params.id;
      const { forceToolFailure, userConstraintOverride } = req.body || {};

      const runState = await runAgenticWorkflow(goalId, undefined, {
        userId: DEFAULT_USER_ID,
        forceToolFailure: Boolean(forceToolFailure),
        userConstraintOverride,
        aiInstance: ai,
      });

      return res.json({
        success: true,
        run_id: runState.run_id,
        state: runState,
      });
    } catch (err: any) {
      console.error("Agent run failed:", err);
      return res.status(500).json({ error: err.message || "Agent run execution failed." });
    }
  });

  app.get("/api/agent/:run_id/status", (req, res) => {
    const run = dbHelpers.getAgentRun(req.params.run_id);
    if (!run) return res.status(404).json({ error: "Agent run not found." });
    res.json({ success: true, state: run });
  });

  app.get("/api/agent/:run_id/events", (req, res) => {
    const events = dbHelpers.getAgentEvents(req.params.run_id);
    res.json({ success: true, count: events.length, events });
  });

  // Real-Time SSE Stream for Agent Workflow
  app.get("/api/agent/stream/:id", (req, res) => {
    const goalId = req.params.id;
    const forceToolFailure = req.query.forceToolFailure === "true";
    const userConstraintOverride = req.query.userConstraintOverride as string;

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    });

    const sendEvent = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    runAgenticWorkflow(goalId, undefined, {
      userId: DEFAULT_USER_ID,
      forceToolFailure,
      userConstraintOverride,
      aiInstance: ai,
      eventEmitter: (event) => sendEvent({ type: "agent_event", event }),
    })
      .then((runState) => {
        sendEvent({ type: "workflow_complete", state: runState });
        res.end();
      })
      .catch((err) => {
        sendEvent({ type: "workflow_error", error: err.message });
        res.end();
      });
  });

  // 7. Consequential Action Approvals (Human-in-the-Loop)
  app.post("/api/actions/:id/approve", (req, res) => {
    const actionId = req.params.id;
    const action = dbHelpers.getActionById(actionId);
    if (!action) return res.status(404).json({ error: "Action not found." });

    dbHelpers.updateActionApproval(actionId, "approved");

    // If cancelling a subscription, update subscription status
    if (action.action_type === "cancel_subscription") {
      const subs = dbHelpers.getSubscriptions();
      const match = subs.find(s => s.merchant.toLowerCase().includes(action.target_merchant.toLowerCase()));
      if (match) {
        dbHelpers.updateSubscriptionStatus(match.id, "cancelling");
      }
    }

    return res.json({
      success: true,
      action_id: actionId,
      status: "approved",
      message: `Action for ${action.target_merchant} approved and queued for safe execution.`,
    });
  });

  app.post("/api/actions/:id/reject", (req, res) => {
    const actionId = req.params.id;
    const { reason } = req.body || {};
    const action = dbHelpers.getActionById(actionId);
    if (!action) return res.status(404).json({ error: "Action not found." });

    dbHelpers.updateActionApproval(actionId, "rejected", reason);

    return res.json({
      success: true,
      action_id: actionId,
      status: "rejected",
      message: `Action rejected: ${reason || "User preferred to retain service"}.`,
    });
  });

  // 8. Analytics & Financial Summary
  app.get("/api/analytics/summary", (req, res) => {
    const summary = dbHelpers.getAnalyticsSummary();
    res.json({ success: true, summary });
  });

  app.get("/api/analytics/savings", (req, res) => {
    const summary = dbHelpers.getAnalyticsSummary();
    const subs = dbHelpers.getSubscriptions();

    const categorySavings: Record<string, number> = {};
    for (const s of subs) {
      if (s.is_dormant) {
        categorySavings[s.plan_name || "General"] = (categorySavings[s.plan_name || "General"] || 0) + s.current_price;
      }
    }

    res.json({
      success: true,
      monthly_savings: summary.potential_monthly_savings,
      annual_savings: summary.potential_annual_savings,
      breakdown: categorySavings,
    });
  });

  // 9. Hackathon Demo Scenarios Engine
  app.post("/api/demo/run-scenario", async (req, res) => {
    const { scenarioId } = req.body;

    try {
      if (scenarioId === 1) {
        // Scenario 1: Detect unnecessary subscriptions
        const runState = await runAgenticWorkflow("goal_hackathon_demo", "Detect and purge unnecessary subscriptions", {
          aiInstance: ai,
        });
        return res.json({
          success: true,
          scenario: "Scenario 1: Detect unnecessary subscriptions",
          state: runState,
        });
      }

      if (scenarioId === 2) {
        // Scenario 2: Detect suspicious price increase
        const runState = await runAgenticWorkflow("goal_hackathon_demo", "Audit recurring rate hikes and price adjustments", {
          aiInstance: ai,
        });
        return res.json({
          success: true,
          scenario: "Scenario 2: Detect suspicious price increase",
          state: runState,
        });
      }

      if (scenarioId === 3) {
        // Scenario 3: Tool failure -> Fallback strategy
        setMerchantVerificationForceFail(true);
        const runState = await runAgenticWorkflow("goal_hackathon_demo", "Investigate billing disputes with simulated gateway failure", {
          forceToolFailure: true,
          aiInstance: ai,
        });
        setMerchantVerificationForceFail(false);
        return res.json({
          success: true,
          scenario: "Scenario 3: Tool failure -> fallback strategy",
          state: runState,
        });
      }

      if (scenarioId === 4) {
        // Scenario 4: User changes constraint -> Agent replans
        const runState = await runAgenticWorkflow("goal_hackathon_demo", "Reduce monthly expenses (Constraint: Keep Apple Music)", {
          userConstraintOverride: "keep_apple_music",
          aiInstance: ai,
        });
        return res.json({
          success: true,
          scenario: "Scenario 4: User changes constraint -> agent replans",
          state: runState,
        });
      }

      if (scenarioId === 5) {
        // Scenario 5: Savings target not achieved -> Agent creates new plan
        const runState = await runAgenticWorkflow("goal_hackathon_demo", "Aggressive Target: Save ₹5,000 monthly", {
          aiInstance: ai,
        });
        return res.json({
          success: true,
          scenario: "Scenario 5: Savings target not achieved -> agent creates a new plan",
          state: runState,
        });
      }

      return res.status(400).json({ error: "Invalid scenarioId. Provide 1 to 5." });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/demo/reset-synthetic", (req, res) => {
    seedSyntheticData();
    res.json({ success: true, message: "Synthetic dataset successfully reset." });
  });

  // 10. Conversational Agent Memory Chat
  app.use("/api/chat", setupChatRoute(ai));

  // 11. Autonomous Watcher API
  app.get("/api/watcher/status", (req, res) => {
    res.json(watcher.getStatus());
  });
  
  app.post("/api/watcher/start", (req, res) => {
    watcher.start();
    res.json(watcher.getStatus());
  });

  app.post("/api/watcher/stop", (req, res) => {
    watcher.stop();
    res.json(watcher.getStatus());
  });

  // 12. FX Tool Endpoint
  app.post("/api/tools/fx", async (req, res) => {
    try {
      const { amount, fromCurrency, toCurrency } = req.body;
      const result = await currency_conversion_tool(amount, fromCurrency, toCurrency);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 13. Backward-Compatible /api/analyze Endpoint
  app.post("/api/analyze", async (req, res) => {
    try {
      const { data, rawText } = req.body;
      const billingData = data || rawText || "";

      if (!billingData || typeof billingData !== "string" || !billingData.trim()) {
        return res.status(400).json({
          error: "No billing data provided. Please upload a file or paste billing text."
        });
      }

      // Check if we can use Gemini
      if (ai) {
        const candidateModels = ["gemini-3.8-flash", "gemini-flash-latest"];
        for (const modelName of candidateModels) {
          try {
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`Model ${modelName} timeout`)), 4500)
            );

            const response = await Promise.race([
              ai.models.generateContent({
                model: modelName,
                contents: `You are BillGuard, an Autonomous Bill and Subscription Auditing Agent. Analyze this billing statement and return a comprehensive audit report in JSON:
"${billingData.slice(0, 10000)}"`,
                config: {
                  responseMimeType: "application/json",
                  temperature: 0.1,
                }
              }),
              timeoutPromise
            ]) as any;

            if (response && response.text) {
              const cleaned = response.text.trim();
              const parsed = JSON.parse(cleaned);
              return res.json({
                success: true,
                engine: modelName,
                data: parsed
              });
            }
          } catch (modelErr: any) {
            const statusMsg = modelErr?.status || modelErr?.code || (modelErr?.message ? String(modelErr.message).slice(0, 100) : 'Unavailable');
            console.log(`[BillGuard] Model ${modelName} status: ${statusMsg}. Falling back...`);
          }
        }
      }

      // Fallback deterministic analysis
      const deterministicReport = analyzeBillingDataDeterministic(billingData);
      return res.json({
        success: true,
        engine: "BillGuard Hybrid Engine (Autonomous Mode)",
        data: deterministicReport
      });
    } catch (err: any) {
      console.error("Analysis route error:", err);
      const fallbackReport = analyzeBillingDataDeterministic(req.body.data || "");
      return res.json({
        success: true,
        engine: "BillGuard Resilient Engine",
        data: fallbackReport
      });
    }
  });

  // ==========================================
  // VITE MIDDLEWARE SETUP
  // ==========================================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Start Watcher and Server
  watcher.start();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[BillGuard] Full-Stack Server running on port ${PORT}`);
  });
}

startServer();
