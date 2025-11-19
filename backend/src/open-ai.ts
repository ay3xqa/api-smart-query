import OpenAI from "openai";

const OpenAIClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // store your key in .env
});

export { OpenAIClient };