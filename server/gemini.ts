import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'node:fs';

let cachedKey: string | undefined;
let cachedModel: string | undefined;
let cachedClient: GoogleGenAI | null = null;

export function refreshGeminiConfig(requestKey?: string) {
  if (fs.existsSync('.env')) {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_AI_KEY;
    delete process.env.GEMINI_MODEL;
  }
  dotenv.config({ path: '.env', override: true });
  const key = requestKey || process.env.GEMINI_API_KEY || process.env.GEMINI_AI_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

  // Never cache a user-provided key across requests or users.
  if (requestKey) {
    return { client: new GoogleGenAI({ apiKey: requestKey }), model };
  }

  if (key !== cachedKey || model !== cachedModel) {
    cachedKey = key;
    cachedModel = model;
    cachedClient = key ? new GoogleGenAI({ apiKey: key }) : null;
  }

  return { client: cachedClient, model };
}

export function getGeminiClient(requestKey?: string): GoogleGenAI | null {
  return refreshGeminiConfig(requestKey).client;
}

export function getGeminiModel(requestKey?: string): string {
  return refreshGeminiConfig(requestKey).model;
}