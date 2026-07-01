const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function callGroqChat(messages, responseFormat = null, temperature = 0.2) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not defined in environment variables.');
  }

  const payload = {
    model: 'llama-3.1-8b-instant',
    messages,
    temperature
  };

  if (responseFormat) {
    payload.response_format = responseFormat;
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Generates a weekly headline summary for the MP
 */
async function getWeeklyHeadlineSummary(blocks, interventions) {
  const prompt = `
You are analyzing agricultural distress metrics for blocks in the Anantapur Lok Sabha constituency.
Here is the current state of blocks (including rainfall deficit, soil moisture, market price drop, and stress index):
${JSON.stringify(blocks, null, 2)}

Here are the active/scheduled agricultural interventions deployed in the last 7 days:
${JSON.stringify(interventions, null, 2)}

Based on this data, generate a single, highly impact-oriented and concise sentence summarizing the week's most critical distress trend and action for the Member of Parliament (MP).
- Keep it under 25 words.
- Be specific (mention the key blocks and issues, e.g. "Groundnut water stress rising in Kalyandurg; 2 water tankers deployed.").
- Do not use corporate jargon; use direct, clear English.
- Return ONLY the raw sentence, without quotes, introductory text, or markdown.
`;

  const messages = [
    { role: 'system', content: 'You are a professional, data-driven agricultural policy advisor.' },
    { role: 'user', content: prompt }
  ];

  try {
    const summary = await callGroqChat(messages, null, 0.5);
    return summary.trim().replace(/^"|"$/g, ''); // strip outer quotes if any
  } catch (error) {
    console.error('[Groq Service] Failed to generate weekly summary:', error);
    throw error; // Let caller handle fallback
  }
}

/**
 * Parses natural language query to filter block IDs
 */
async function parseNaturalLanguageQuery(query, blocks) {
  const blocksContext = blocks.map(b => ({
    id: b.id,
    name: b.name,
    stress_index: b.stress_index,
    alert_level: b.alert_level,
    soil_moisture_pct: b.soil_moisture_pct,
    rainfall_deficit_pct: b.rainfall_deficit_pct,
    mandi_price_drop_pct: b.mandi_price_drop_pct,
    total_farmers: b.total_farmers
  }));

  const prompt = `
You are an AI assistant for a Member of Parliament's decision dashboard. Your task is to filter a list of agricultural blocks based on a user's natural language query.
Here are the available blocks in the constituency:
${JSON.stringify(blocksContext, null, 2)}

Filter this list according to the user's request.
User query: "${query}"

Guidelines:
1. Identify which blocks match the query criteria (e.g. "soil moisture below 15%", "high alert blocks", "blocks with stress above 50", etc.).
2. You must return a structured JSON response containing:
   - "matchingBlockIds": An array of numbers (IDs of matching blocks). If no blocks match, return an empty array.
   - "explanation": A very short sentence explaining what was filtered.
3. Your output must be valid JSON matching the format:
   {
     "matchingBlockIds": [1, 2],
     "explanation": "Showing blocks with stress index above 70%"
   }
4. Return ONLY the JSON object. Do not include markdown code block formatting (like \`\`\`json) or any conversational text.
`;

  const messages = [
    { role: 'system', content: 'You are a strict data-parsing engine that outputs only JSON.' },
    { role: 'user', content: prompt }
  ];

  try {
    const resultText = await callGroqChat(messages, { type: 'json_object' }, 0.1);
    const parsed = JSON.parse(resultText);
    return parsed;
  } catch (error) {
    console.error('[Groq Service] Failed to parse query:', error);
    throw error;
  }
}

/**
 * Translates text into a target Indian language using Groq
 */
async function translateText(text, targetLanguage) {
  if (!text || !targetLanguage || targetLanguage === 'en') {
    return text;
  }

  const languageNames = {
    te: 'Telugu',
    hi: 'Hindi',
    mr: 'Marathi'
  };

  const langName = languageNames[targetLanguage] || 'English';

  const prompt = `
Translate the following agricultural alert headline text into ${langName}.
Text: "${text}"

Guidelines:
- Return ONLY the direct translation, without any quotes, preambles, or conversational explanations.
- Translate terms accurately. Transliterate proper names (like Kalyandurg, Kadiri, Nagpur, etc.) appropriately to target script.
- Ensure the translation is formal and natural.
`;

  const messages = [
    { role: 'system', content: 'You are a professional translator specializing in Indian languages and agriculture.' },
    { role: 'user', content: prompt }
  ];

  try {
    const translated = await callGroqChat(messages, null, 0.1);
    return translated.trim().replace(/^"|"$/g, '');
  } catch (error) {
    console.error(`[Groq Service] Translation failed to ${targetLanguage}:`, error);
    return text;
  }
}

/**
 * Translates a list of interventions into a target Indian language in a single batch
 */
async function translateInterventionsBatch(interventions, targetLanguage) {
  if (!interventions || interventions.length === 0 || !targetLanguage || targetLanguage === 'en') {
    return interventions;
  }

  const languageNames = {
    te: 'Telugu',
    hi: 'Hindi',
    mr: 'Marathi'
  };
  const langName = languageNames[targetLanguage] || 'English';

  // Prepare input structure for LLM
  const itemsToTranslate = interventions.map(item => ({
    id: item.id,
    type: item.type || '',
    detail: item.detail || '',
    resources_deployed: item.resources_deployed || '',
    notes: item.notes || ''
  }));

  const prompt = `
You are translating a list of agricultural interventions on a dashboard into ${langName}.
Here is the JSON list of interventions to translate:
${JSON.stringify(itemsToTranslate, null, 2)}

Guidelines:
1. Translate the fields "type", "detail", "resources_deployed", and "notes" into ${langName}.
2. Keep the proper block/region names or numbers accurate (transliterate proper nouns like Kalyandurg, Kadiri, Nagpur, Priya Sharma, etc. into the target script).
3. Return a JSON array matching the exact structure:
[
  {
    "id": 1,
    "type": "translated type",
    "detail": "translated detail",
    "resources_deployed": "translated resources",
    "notes": "translated notes"
  }
]
4. Do NOT include markdown tags (like \`\`\`json) or conversational text. Output ONLY the JSON array.
`;

  const messages = [
    { role: 'system', content: 'You are a translation engine that outputs only JSON arrays.' },
    { role: 'user', content: prompt }
  ];

  try {
    const resultText = await callGroqChat(messages, { type: 'json_object' }, 0.1);
    const translatedList = JSON.parse(resultText);
    
    // Map translated values back to the original objects
    const translatedMap = {};
    if (Array.isArray(translatedList)) {
      translatedList.forEach(item => {
        if (item && item.id) {
          translatedMap[item.id] = item;
        }
      });
    }

    return interventions.map(item => {
      const translated = translatedMap[item.id];
      if (translated) {
        return {
          ...item,
          type: translated.type || item.type,
          detail: translated.detail || item.detail,
          resources_deployed: translated.resources_deployed || item.resources_deployed,
          notes: translated.notes || item.notes
        };
      }
      return item;
    });
  } catch (error) {
    console.error(`[Groq Service] Batch interventions translation failed to ${targetLanguage}:`, error);
    return interventions;
  }
}

module.exports = {
  getWeeklyHeadlineSummary,
  parseNaturalLanguageQuery,
  translateText,
  translateInterventionsBatch
};
