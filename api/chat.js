
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const message = req.body?.message;

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Please enter a question." });
    }

    if (message.length > 4000) {
      return res.status(400).json({ error: "Question is too long." });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          model: "gemini-3.8-flash",
          input:
            "You are EDU SMART, a helpful study assistant for Ethiopian students in Grades 9–12. Explain school subjects clearly, show maths steps, create practice questions when asked, and adapt explanations to the student's level. Do not invent textbook content. Question: " +
            message
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        error: "The AI service could not answer. Please try again."
      });
    }

    const answer =
      data.output_text ||
      data.steps
        ?.filter(step => step.type === "model_output")
        .flatMap(step => step.content || [])
        .filter(item => item.type === "text")
        .map(item => item.text)
        .join("");

    return res.status(200).json({
      answer: answer || "I couldn't generate an answer. Please try again."
    });

  } catch (error) {
    return res.status(500).json({
      error: "Something went wrong. Please try again."
    });
  }
  }
