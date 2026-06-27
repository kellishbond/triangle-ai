require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors()); // Put this right under app.use(express.json());
// Middleware to parse JSON bodies
app.use(express.json());

app.post('/api/analyze', async (req, res) => {
    try {
        // 1. Grab the text from the frontend
        const { logText } = req.body;

        if (!logText) {
            return res.status(400).json({ error: "No log text provided" });
        }

        // --- GROQ API INTEGRATION ---
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
           body: JSON.stringify({
                // Back to the model we know works perfectly!
                model: "llama-3.1-8b-instant", 
                response_format: { type: "json_object" }, 
                messages: [
                    { 
                        role: "system", 
                        // The upgraded prompt that explains the 1-10 scale clearly
                        content: "You are an IT support triage bot. Analyze the log and return a JSON object with exactly three keys: 'category' (must be Network, Billing, Hardware, Software, or Other), 'priority' (a number from 1 to 10, where 10 is a critical company-wide outage like a fire, and 1 is a minor glitch), and 'summary' (max 10 words)." 
                    },
                    { 
                        role: "user", 
                        content: logText 
                    }
                ]
            })
        });

        const data = await response.json();
        
        // Groq gives us the clean JSON directly inside the message content
        const triageResult = JSON.parse(data.choices[0].message.content);
        // ----------------------------

        // --- PHASE 2: COMPUTATIONAL THINKING LOGIC ---
        if (triageResult.priority >= 8) {
            triageResult.status = "CRITICAL - Escalate Immediately";
        } else if (triageResult.priority >= 5) {
            triageResult.status = "NORMAL - Add to queue";
        } else {
            triageResult.status = "LOW - Resolve when free";
        }
        // ----------------------------------------------

        // Send the AI-enhanced, logically sorted data back
        return res.json(triageResult);

    } catch (error) {
        console.error("Error analyzing log:", error);
        res.status(500).json({ error: "Failed to analyze log" });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 TriangleAi Backend running on http://localhost:${PORT}`);
});

// require('dotenv').config();
// const express = require('express');
// const app = express();

// // Middleware to parse JSON bodies
// app.use(express.json());

// app.post('/api/analyze', async (req, res) => {
//     try {
//         // 1. Grab the text from the frontend
//         const { logText } = req.body;

//         if (!logText) {
//             return res.status(400).json({ error: "No log text provided" });
//         }

//         // --- PLAN B: MOCK AI RESPONSE ---
//         // We are bypassing Google so we can build the app logic.
//         // This simulates exactly what the real AI would send back.
//         const triageResult = {
//             category: "Hardware",
//             priority: 9,
//             summary: "Critical hardware failure detected in network rack."
//         };
        
//         // Send this data back to the frontend
//         return res.json(triageResult);
//         // -------------------------------

//     } catch (error) {
//         console.error("Error analyzing log:", error);
//         res.status(500).json({ error: "Failed to analyze log" });
//     }
// });

// const PORT = 3000;
// app.listen(PORT, () => {
//     console.log(`🚀 TriangleAi Backend is running on http://localhost:${PORT}`);
// });