export async function ImageClassify(imageBlob, userText = "") {
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  if (!API_KEY) {
    throw new Error("Gemini API key not set in VITE_GEMINI_API_KEY");
  }

const API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent";


  const base64Data = await new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result.split(",")[1]);
    };

    reader.onerror = reject;
    reader.readAsDataURL(imageBlob);
  });

  const prompt = `
Analyze the attached image and classify the issue into EXACTLY ONE of these categories:

water leakage
broken water pipe
street light not working
broken traffic signal
power outage
road damage
damaged footpath
garbage not collected
blocked drain
stray animals
animal attack

User report:
${userText || "No additional description provided."}

Return ONLY one category from the list.

If none match, return:
couldn't classify provide description
`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
          {
            inline_data: {
              mime_type: imageBlob.type || "image/jpeg",
              data: base64Data,
            },
          },
        ],
      },
    ],
  };
const response = await fetch(API_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-goog-api-key": API_KEY,
  },
  body: JSON.stringify(requestBody),
});

  const result = await response.json();

  if (!response.ok) {
    console.error("Gemini API Error:", result);
    throw new Error(result.error?.message || `API Error: ${response.status}`);
  }

  const category = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!category) {
    console.error("Gemini Response:", result);
    throw new Error("Unable to classify image.");
  }

  return category;
}

export const ClassifyImage = ImageClassify;
