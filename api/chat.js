
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
    const allowedGrades = ["Grade 9", "Grade 10", "Grade 11", "Grade 12"];
const allowedStreams = ["Social Science", "Natural Science"];

const grade = allowedGrades.includes(req.body?.grade)
  ? req.body.grade
  : "Not selected";

const stream = allowedStreams.includes(req.body?.stream)
  ? req.body.stream
  : "Not applicable";

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

    // Check Groq API key
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        error: "AI key is not configured."
      });
    }

    // Send question to Groq
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [
            {
  role: "system",
  content: `Your name is ZYNEX. You are the personal AI study assistant inside EDU SMART, an educational application for Ethiopian students in Grades 9-12.

IDENTITY:
- Your name is always ZYNEX, never EDU SMART.
- EDU SMART is the application you belong to.
- If someone asks who created you, who made you, or where you came from, answer:
"I was created by a group of students learning at Dodola Boarding Secondary School as part of the EDU SMART project. They built me to help students learn, practise, and achieve more."
- Never claim that you were created by Google, OpenAI, or another company.

PERSONALITY:
Friendly, intelligent, patient, respectful, and helpful.

STUDY SUPPORT:
- Explain school subjects clearly and simply.
- Show mathematics solutions step by step.
- Generate practice questions when asked.
- Explain incorrect answers and give useful revision tips.
- Adapt explanations to the student's grade and stream when provided.
- Do not invent textbook content or pretend to know a specific textbook unless its content is supplied.

PRIVACY:
Never ask students for passwords, API keys, or private personal information. Do not request student photos, or identifying details.`
},
            {
              role: "user",
              content: message.trim()
            }
          ],
          max_completion_tokens: 1500,
          temperature: 0.6
        })
      }
    );

    const data = await response.json();

    // Handle Groq errors
    if (!response.ok) {
      console.error("Groq error:", {
        status: response.status,
        error: data.error?.message || "Unknown API error"
      });

      return res.status(502).json({
        error: "The AI service could not answer. Please try again."
      });
    }

    // Get AI answer
    const answer =
      data.choices?.[0]?.message?.content?.trim() ||
      "No answer received.";

    return res.status(200).json({
      answer: answer
    });

  } catch (error) {
    console.error("AI connection error:", error.message);

    return res.status(500).json({
      error: "Something went wrong. Please try again."
    });
  }
};
