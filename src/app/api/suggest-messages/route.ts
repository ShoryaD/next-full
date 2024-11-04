import { OpenAI } from "openai";
import { NextResponse } from "next/server";

// USE CASE
// 1. User will click on suggest-message
// 2. we will go to open ai with some prompts
// 3. we will show the response on frontend

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "edge";

// Helper function to retry on 429 status
async function fetchWithRetry(prompt: string, retries = 3, delay = 1000) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        stream: true,
      });
    } catch (error) {
      const status = (error as any)?.status; // Type assertion to check status
      if (status === 429 && attempt < retries - 1) {
        console.log("Rate limit hit. Retrying...");
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error; // Throw the error if it's not a 429 or retries are exhausted
      }
    }
  }
}

export async function POST(req: Request) {
  try {
    const prompt =
      "Create a list of three open-ended and engaging questions formatted as a single string. Each question should be separated by '||'. These questions are for an anonymous social messaging platform, like Qooh.me, and should be suitable for a diverse audience. Avoid personal or sensitive topics, focusing instead on universal themes that encourage friendly interaction. For example, your output should be structured like this: 'What’s a hobby you’ve recently started?||If you could have dinner with any historical figure, who would it be?||What’s a simple thing that makes you happy?'. Ensure the questions are intriguing, foster curiosity, and contribute to a positive and welcoming conversational environment.";

    // Use fetchWithRetry to handle retries on 429
    const response = await fetchWithRetry(prompt);

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response || []) {  // Ensure response is not undefined
          const { choices } = chunk;
          if (choices && choices.length > 0) {
            const text = choices[0].delta?.content || "";
            controller.enqueue(text);
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    const status = (error as any)?.status || 500; // Set status to 500 if undefined
    const message = (error as any)?.message || "Unexpected error occurred.";

    console.error("An unexpected error occurred:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
