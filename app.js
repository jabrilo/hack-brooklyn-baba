import dotenv from "dotenv";
dotenv.config();

const run = async () => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=YOUR_KEY`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "Give me a 3-day beginner running plan"
              }
            ]
          }
        ]
      })
    }
  );

  const data = await response.json();

 console.log(process.env.GEMINI_API_KEY);
};

run();