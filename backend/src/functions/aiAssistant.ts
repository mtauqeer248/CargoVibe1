import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { findAll } from '../services/ParkingRequestRepository';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function aiChat(
  req: HttpRequest,
  _ctx: InvocationContext
): Promise<HttpResponseInit> {
  const body = await req.json() as { message?: string; conversationHistory?: ChatMessage[] };
  const { message, conversationHistory = [] } = body;

  if (!message?.trim()) {
    return { status: 400, jsonBody: { error: 'message is required' } };
  }

  const allRequests = findAll();
  const contextSummary = JSON.stringify(allRequests, null, 2);

  const systemPrompt = `You are an intelligent assistant for CargoVibe, a truck parking management platform.
You have real-time access to the current parking request data and help operators manage them efficiently.

CURRENT PARKING REQUESTS (live data):
${contextSummary}

Always respond in this exact JSON format:
{
  "reply": "<your natural language reply>",
  "suggestedAction": {
    "type": "updateStatus",
    "requestId": "<id>",
    "newStatus": "<status>",
    "parkingSpotId": "<optional>"
  } | null
}`;

  try {
    const messages = [
      ...conversationHistory,
      { role: 'user' as const, content: message },
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return { status: 502, jsonBody: { error: 'AI service unavailable', details: errText } };
    }

    const data = await response.json() as { content: Array<{ type: string; text?: string }> };
    const rawText = data.content.filter(b => b.type === 'text').map(b => b.text ?? '').join('');

    let parsed: { reply: string; suggestedAction: unknown };
    try {
      parsed = JSON.parse(rawText.replace(/```json|```/g, '').trim());
    } catch {
      parsed = { reply: rawText, suggestedAction: null };
    }

    return {
      status: 200,
      jsonBody: {
        reply: parsed.reply,
        suggestedAction: parsed.suggestedAction ?? null,
        updatedHistory: [...messages, { role: 'assistant', content: rawText }],
      },
    };
  } catch (err) {
    console.error('AI function error:', err);
    return { status: 500, jsonBody: { error: 'Internal Server Error' } };
  }
}

app.http('aiChat', {
  methods: ['POST'],
  route: 'ai/chat',
  authLevel: 'anonymous',
  handler: aiChat,
});
