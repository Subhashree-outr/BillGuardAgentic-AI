import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { dbHelpers } from "./db";

export function setupChatRoute(ai: GoogleGenAI | null) {
  const router = Router();
  const sessionMemory: Record<string, any[]> = {};

  router.post("/", async (req, res) => {
    try {
      const { message, sessionId = 'default' } = req.body;
      if (!ai) {
        return res.json({ reply: "I'm sorry, conversational chat requires a Gemini API key." });
      }

      // Get latest agent run state for context
      const runs = dbHelpers.getAgentRuns() || [];
      const latestRun = runs[runs.length - 1];
      const stateContext = latestRun ? JSON.stringify({
        goal: latestRun.user_goal,
        issues: latestRun.detected_issues,
        actions: latestRun.actions,
        evaluation: latestRun.evaluation,
        final_outcome: latestRun.final_outcome,
      }) : "No active agent run.";

      if (!sessionMemory[sessionId]) {
        sessionMemory[sessionId] = [];
      }

      const systemInstruction = `You are BillGuard, an autonomous financial agent. You audit the user's bills and subscriptions to find anomalies and save them money.
Current state context of the user's finances and your last audit: ${stateContext}

Use this context to answer user questions about why you made certain decisions, what anomalies you found, or what actions are pending. Keep your answers concise, friendly, and helpful. Format your response in markdown.`;

      const contents = [
        ...sessionMemory[sessionId],
        { role: 'user', parts: [{ text: message }] }
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: { systemInstruction },
      });

      const reply = response.text || "I didn't understand that.";
      
      sessionMemory[sessionId].push(
        { role: 'user', parts: [{ text: message }] },
        { role: 'model', parts: [{ text: reply }] }
      );

      res.json({ reply });
    } catch (e: any) {
      console.error('Chat error:', e);
      res.status(500).json({ error: e.message || "Failed to generate chat response" });
    }
  });

  return router;
}
