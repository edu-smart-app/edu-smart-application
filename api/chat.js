
module.exports = async (req, res) => {
  const allowedOrigin = "https://edu-smart-app.github.io";

  // Allow requests from the EDU SMART website
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle browser CORS check
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const message = req.body?.message;

    // Check the question
    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Enter a question."
      });
    }

    if (message.length > 4000) {
      return res.status(400).json({
        error: "Question is too long."
      });
    }

    // Check API key
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "AI key is not configured."
      });
    }

    // Send question to Gemini
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: "You are EDU SMART, a helpful study assistant for Ethiopian students in Grades 9-12. Explain school subjects clearly and simply. Show mathematics solutions step by step. Generate practice questions when asked. Explain incorrect answers and give useful revision tips. Adapt explanations to the student's grade and stream when provided. Do not invent textbook content or pretend to know a specific textbook unless its content is supplied. Never ask students for passwords, API keys, or private personal information."
            }]
          },
          contents: [{
            role: "user",
            parts: [{
              text: message
            }]
          }]
        })
      }
    );

    const data = await response.json();

    // Handle Gemini errors
    if (!response.ok) {
      console.error("Gemini error:", data);

      return res.status(502).json({
        error: "The AI service could not answer. Please try again."
      });
    }

    // Get AI answer
    const answer =
      data.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("") || "No answer received.";

    return res.status(200).json({
      answer: answer
    });

  } catch (error) {
    console.error("AI error:", error);

    return res.status(500).json({
      error: "Something went wrong. Please try again."
    });
  }
};
                                
