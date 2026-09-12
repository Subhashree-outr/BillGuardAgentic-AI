import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'node:fs';

let cachedKey: string | undefined;
let cachedModel: string | undefined;
let cachedClient: GoogleGenAI | null = null;

export function refreshGeminiConfig() {
  if (fs.existsSync('.env')) {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_AI_KEY;
    delete process.env.GEMINI_MODEL;
  }
  dotenv.config({ path: '.env', override: true });
  const key = process.env.GEMINI_API_KEY || process.env.GEMINI_AI_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

  if (key !== cachedKey || model !== cachedModel) {
    cachedKey = key;
    cachedModel = model;
    cachedClient = key ? new GoogleGenAI({ apiKey: key }) : null;
  }

  return { client: cachedClient, model };
}

export function getGeminiClient(): GoogleGenAI | null {
  return refreshGeminiConfig().client;
}

export function getGeminiModel(): string {
  return refreshGeminiConfig().model;
}