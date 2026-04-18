import dotenv from "dotenv";
dotenv.config();
import Groq from "groq-sdk";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const run = async () => {
  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: "Give me a 3-day beginner running plan",
      },
    ],
  });

  console.log(response.choices[0].message.content);
};

run();