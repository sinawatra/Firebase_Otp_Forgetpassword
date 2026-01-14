const { onRequest } = require("firebase-functions/v2/https");
const { Translate } = require("@google-cloud/translate").v2;
const translateClient = new Translate();

// Allow cross-origin requests
function setCors(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
}

// Find all text strings in nested objects/arrays
function findAllText(obj, currentPath = [], results = []) {
  if (typeof obj === "string" && obj.trim()) {
    results.push({ path: currentPath, text: obj });
  } else if (Array.isArray(obj)) {
    obj.forEach((item, i) => findAllText(item, [...currentPath, i], results));
  } else if (obj && typeof obj === "object") {
    Object.entries(obj).forEach(([key, val]) => 
      findAllText(val, [...currentPath, key], results)
    );
  }
  return results;
}

// Update a value deep in an object using a path like ["user", "name"]
function updateValue(obj, path, newValue) {
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    current = current[path[i]];
  }
  current[path[path.length - 1]] = newValue;
}

exports.translateHttp = onRequest(
  { region: "us-central1", memory: "512MiB", timeoutSeconds: 60 },
  async (req, res) => {
    setCors(res);
    
    // Handle 
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

    try {
      const { product, languages } = req.body || {};

      // Validate input
      if (!product?.input) {
        return res.status(400).json({ error: "Missing product.input" });
      }
      if (!Array.isArray(languages) || !languages.length) {
        return res.status(400).json({ error: "Missing languages array" });
      }
      if (languages.length > 20) {
        return res.status(400).json({ error: "Max 20 languages" });
      }

      // Find all text to translate
      const textItems = findAllText(product.input);
      if (!textItems.length) return res.status(200).json({ translations: {} });
      if (textItems.length > 200) {
        return res.status(400).json({ error: "Max 200 text fields" });
      }

      const textsToTranslate = textItems.map(item => item.text);
      const translations = {};

      // Translate for each language
      for (const lang of languages) {
        if (!lang?.trim()) continue;

        // Batch translate all texts
        const [translated] = await translateClient.translate(textsToTranslate, lang);
        const translatedTexts = Array.isArray(translated) ? translated : [translated];

        // Rebuild structure with translated text
        const translatedObj = JSON.parse(JSON.stringify(product.input));
        textItems.forEach((item, i) => {
          updateValue(translatedObj, item.path, translatedTexts[i] || "");
        });

        translations[lang] = translatedObj;
      }

      return res.status(200).json({ translations });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Translation failed" });
    }
  }
);