import OpenAI from "openai";
import { z } from "zod";

import type { AnalysisEvent } from "@sec-intel-app/shared";

import { env } from "../config/env.js";

const ExtractedEventSchema = z.object({
  title: z.string(),
  summary: z.string(),
  amount: z.string(),
  securities: z.string(),
  status: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
  sourceSnippet: z.string()
});

export class OpenAiExtractor {
  private readonly client: OpenAI | null;
  readonly enabled: boolean;

  constructor() {
    this.enabled = Boolean(env.OPENAI_API_KEY);
    this.client = this.enabled ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;
  }

  async refineEvent(event: AnalysisEvent): Promise<AnalysisEvent> {
    if (!this.client) {
      return event;
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: env.OPENAI_MODEL,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are an SEC filing analyst. Extract only facts explicitly present in the provided filing text. Do not infer, speculate, or invent. If a field is missing, write 'not found'. Return strict JSON only."
          },
          {
            role: "user",
            content: JSON.stringify({
              allowedEventType: event.eventType,
              filingDate: event.filingDate,
              form: event.form,
              sourceUrl: event.sourceUrl,
              filingText: event.sourceSnippet,
              outputShape: {
                title: "string",
                summary: "string",
                amount: "string",
                securities: "string",
                status: "string",
                confidence: "high | medium | low",
                sourceSnippet: "exact text copied from filing snippet"
              }
            })
          }
        ]
      });

      const content = completion.choices[0]?.message.content;
      if (!content) {
        return event;
      }

      const parsed = ExtractedEventSchema.parse(JSON.parse(content));
      return {
        ...event,
        title: parsed.title || event.title,
        summary: parsed.summary || event.summary,
        amount: parsed.amount || event.amount,
        securities: parsed.securities || event.securities,
        status: parsed.status || event.status,
        confidence: parsed.confidence || event.confidence,
        sourceSnippet: parsed.sourceSnippet || event.sourceSnippet
      };
    } catch {
      return event;
    }
  }
}
