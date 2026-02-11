
/**
 * OpenRouter Service
 * Handles vision-based OCR using OpenAI-compatible models via OpenRouter.
 */

export async function extractNameFromImage(imageBase64: string): Promise<string> {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY ||
        import.meta.env.OPENROUTER_API_KEY ||
        process.env.VITE_OPENROUTER_API_KEY ||
        process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        console.error("VITE_OPENROUTER_API_KEY is not set.");
        throw new Error("OCR Service not configured. Please add VITE_OPENROUTER_API_KEY to your .env file.");
    }

    const prompt = `
    Analyze this image of an ID card or badge. 
    1. Extract the full name of the person shown.
    2. Usually, it's the most prominent name on the card.
    3. Return ONLY the name. No other text or explanation.
    4. If no name can be found, return "Unknown".
  `;

    // Remove data:image/...;base64, prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://taskflow.local", // Optional, for OpenRouter tracking
                "X-Title": "TaskFlow ID Scanner" // Optional, for OpenRouter tracking
            },
            body: JSON.stringify({
                model: "openai/gpt-4o-mini", // Cost-effective and highly capable vision model
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Data}`
                                }
                            }
                        ]
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("OpenRouter API Error:", errorData);
            throw new Error(errorData.error?.message || "Failed to communicate with OpenRouter.");
        }

        const data = await response.json();
        const extractedText = data.choices[0]?.message?.content?.trim() || "Unknown";

        return extractedText;
    } catch (error) {
        console.error("OCR Service Error:", error);
        throw error;
    }
}
