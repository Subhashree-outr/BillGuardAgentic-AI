import { Router } from "express";
import { dbHelpers } from "./db";
import { getGeminiClient, getGeminiModel } from "./gemini";

export function setupChatRoute() {
  const router = Router();
  const sessionMemory: Record<string, any[]> = {};

  router.post("/", async (req, res) => {
    try {
      const { message, sessionId = 'default' } = req.body;
      const requestKey = req.header('x-gemini-api-key');
      const ai = getGeminiClient(requestKey);
      if (!ai) {
        return res.status(200).json({ reply: "Gemini chat is disabled. Add GEMINI_API_KEY or GEMINI_AI_KEY to .env and refresh the request." });
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
        model: getGeminiModel(requestKey),
        contents,
        config: { systemInstruction, maxOutputTokens: 512 },
      });

      const reply = response.text || "I didn't understand that.";
      
      sessionMemory[sessionId].push(
        { role: 'user', parts: [{ text: message }] },
        { role: 'model', parts: [{ text: reply }] }
      );

      res.json({ reply });
    } catch (error: any) {
      const status = error?.status || error?.statusCode || error?.error?.code;
      const message = String(error?.message || 'Unknown Gemini error');
      console.error('[BillGuard] Chat provider error:', status, message);
      const providerMessage = status === 400 || message.includes('API_KEY_INVALID')
        ? 'Gemini rejected the API key. Check that it is a valid Google AI Studio key and that the Generative Language API is enabled.'
        : status === 429
          ? 'Gemini quota or rate limit reached. Try again later or use the deterministic audit features.'
          : 'Gemini chat is temporarily unavailable. The rest of the local audit remains available.';
      res.status(200).json({ reply: providerMessage, provider_error: true });
    }
  });

  return router;
}
