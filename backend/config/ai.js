const MODEL_CHAIN = ["gemini-3.1-flash-lite-preview", "gemini-2.5-flash"];

async function generateWithFallback(prompt) {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) throw new Error("GEMINI_API_KEY is missing in .env");

    for (const modelName of MODEL_CHAIN) {
        try {
            console.log(`🔄 AI Requesting Model: ${modelName}...`);
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            const data = await response.json();

            if (!response.ok) {
                console.warn(` ${modelName} failed: ${data.error?.message || response.status}`);
                continue;
            }

            if (!data.candidates || data.candidates.length === 0) {
                console.warn(` ${modelName} returned no content (Safety Block).`);
                continue;
            }

            return data.candidates[0].content.parts[0].text;
        } catch (err) {
            console.error(`❌ System Error with ${modelName}:`, err.message);
        }
    }
    throw new Error("AI failed to respond. All models in chain exhausted.");
}

module.exports = { generateWithFallback };
