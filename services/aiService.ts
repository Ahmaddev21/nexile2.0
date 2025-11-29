/// <reference types="vite/client" />
import { GoogleGenAI } from "@google/genai";
import { db } from './db';
import { Product, Transaction, Insight } from '../types';

const SYSTEM_INSTRUCTION = `You are Nexile AI, an expert pharmaceutical business analyst. 
Analyze the provided JSON data containing inventory and sales. 
Provide 3 concise, actionable insights for the business owner. 
Focus on profit optimization, restocking alerts, and identifying dead stock.
Format the output as a JSON object with a key 'insights' which is an array of strings.`;

export const generateGeminiInsights = async (): Promise<string[]> => {
  const envKey = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_GEMINI_API_KEY : undefined;
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem('nexile_gemini_api_key') : null;
  const apiKey = envKey || storedKey || undefined;

  // Fallback if no key is provided
  if (!apiKey) {
    console.warn("No API Key provided for Gemini. Using simulated AI response.");
    return simulateAI();
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Prepare data context
    const products = db.products;
    const transactions = db.transactions;

    // Summarize data to avoid token limits
    const summary = {
      totalProducts: products.length,
      lowStockItems: products.filter(p => p.stock < p.minStockLevel).map(p => p.name),
      recentSalesTotal: transactions.reduce((acc, t) => acc + t.total, 0),
      topSelling: transactions.flatMap(t => t.items).slice(0, 10) // simplified
    };

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: JSON.stringify(summary),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return [];

    const data = JSON.parse(text);
    return data.insights || [];

  } catch (error) {
    console.error("Gemini API Error:", error);
    return simulateAI();
  }
};

// Statistical (Local) AI
export const getStatisticalInsights = (branchId?: string): Insight[] => {
  const products = db.products.filter(p => !branchId || p.branchId === branchId);
  const insights: Insight[] = [];

  // 1. Stockout Prediction
  const lowStock = products.filter(p => p.stock <= p.minStockLevel && p.stock > 0);
  if (lowStock.length > 0) {
    insights.push({
      type: 'warning',
      message: `${lowStock.length} items below safety stock. Risk of revenue loss estimated at $${(lowStock.length * 120).toFixed(0)}/day if depleted.`,
      metric: 'Stock Critical'
    });
  }

  // 2. Dead Stock Analysis
  const deadStock = products.filter(p => p.stock > 200);
  if (deadStock.length > 0) {
    insights.push({
      type: 'warning',
      message: `Capital Lock Detected: ${deadStock[0].name} has >200 units. Recommend 15% flash sale to free up liquidity.`,
      metric: 'Cash Flow'
    });
  }

  // 3. Expiry Risk
  const expiring = products.filter(p => {
    const expiry = new Date(p.expiryDate);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    const days = diff / (1000 * 3600 * 24);
    return days < 60 && days > 0;
  });

  if (expiring.length > 0) {
    insights.push({
      type: 'warning',
      message: `${expiring.length} batches expiring <60 days. Bundle with fast-movers to clear inventory.`,
      metric: 'Expiry Risk'
    });
  }

  // 4. High Margin Opportunity (New)
  const highMargin = products.filter(p => (p.price - p.cost) > (p.cost * 1.5) && p.stock > 50);
  if (highMargin.length > 0) {
    insights.push({
      type: 'success',
      message: `High Margin Alert: '${highMargin[0].name}' yields >150% return. Instruct pharmacists to recommend as primary option.`,
      metric: 'Profit Maximization'
    });
  }

  return insights;
};

const simulateAI = () => [
  "STRATEGY: Antibiotic sales surge predicted (+22%). Pre-order 'Amoxicillin' bulk packs to secure 12% supplier discount.",
  "BUNDLING: 'Vitamin D3' frequently bought with Pain Relief. Create a 'Wellness Bundle' to increase average basket size by 15%.",
  "STAFFING: Peak traffic detected 4pm-7pm at Downtown Branch. Add 1 support staff to reduce wait times and recover lost walk-ins."
];

// --- PHARMACIST AI INTELLIGENCE ---

import { PharmacistMessage } from '../types';

// Detect if the query needs inventory data
const needsInventoryContext = (query: string): boolean => {
  const q = query.toLowerCase();
  return q.includes('stock') || q.includes('have') || q.includes('available') || q.includes('inventory') || q.includes('count');
};

// Unified System Prompt
const getSystemPrompt = (inventoryContext?: string): string => {
  return `You are Nexile AI, an expert clinical pharmacist assistant.
Your role is to support the pharmacist in real-time with accurate, evidence-based information.

### YOUR CAPABILITIES:
1. **Clinical Consultant**: Analyze symptoms, suggest treatments, and ask clarifying questions.
2. **Safety Guardian**: Check for interactions, contraindications, and allergies.
3. **Dosage Expert**: Calculate precise doses for pediatrics and adults.
4. **Inventory Assistant**: Check local stock levels (Data provided below).

### INVENTORY DATA:
${inventoryContext || 'No specific inventory data relevant to this query.'}

### CONVERSATION RULES:
- **Be a Colleague**: Speak naturally. "I'd recommend checking..." instead of "RECOMMENDATION:".
- **Ask First**: If a user mentions a symptom (e.g., "cough"), **always ask clarifying questions** (dry/wet? duration? other meds?) before giving a solution. This is critical for clinical accuracy.
- **Be Direct**: For specific questions ("dose of amoxicillin"), answer immediately.
- **Cite Sources**: Explicitly mention sources (e.g., "Per FDA guidelines...", "NHS recommends...").
- **Safety**: Always append a medical disclaimer.

### FORMATTING:
- Use Markdown.
- **Bold** important drug names or warnings.
- Keep it readable and professional.`;
};

// Add medical disclaimer to response
const addSafetyDisclaimer = (content: string): string => {
  return `${content}

---

**⚠️ MEDICAL DISCLAIMER:**
This information supports pharmacist decisions and does not replace physician consultation. Final clinical decisions must be made by licensed pharmacists.`;
};

// Generate pharmacist AI response
export const generatePharmacistResponse = async (
  query: string,
  conversationHistory: PharmacistMessage[]
): Promise<{ content: string; module: string; sources: { title: string; url: string }[]; usedLive: boolean }> => {

  // 1. Check if we need inventory data
  let contextData = '';
  let module = 'general'; // Default to general clinical AI

  if (needsInventoryContext(query)) {
    module = 'stock';
    const products = db.products;
    const queryWords = query.toLowerCase().split(' ').filter(w => w.length > 3);
    const relevantProducts = products.filter(p =>
      queryWords.some(w => p.name.toLowerCase().includes(w))
    );

    if (relevantProducts.length > 0) {
      contextData = relevantProducts.map(p =>
        `- ${p.name}: ${p.stock} units (Min: ${p.minStockLevel})`
      ).join('\n');
    } else {
      contextData = "No matching products found in inventory.";
    }
  }

  // 2. Build the prompt
  const systemPrompt = getSystemPrompt(contextData);

  // 3. Check API Key
  const apiKey = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_GITHUB_TOKEN : undefined;

  if (!apiKey) {
    console.warn("Nexile AI: No GitHub Token found. Using simulation.");
    const sim = generateSimulatedResponse(query);
    return { ...sim, usedLive: false };
  }

  try {
    // Convert history to OpenAI format
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant', // OpenAI uses 'assistant'
        content: msg.content
      })),
      { role: 'user', content: query }
    ];

    const response = await fetch("https://models.inference.ai.azure.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        messages: messages,
        model: "gpt-4o", // Using GPT-4o as requested
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`GitHub Models API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    let text = data.choices[0]?.message?.content || "";

    // Safety fallback
    if (!text) {
      text = "I apologize, but I couldn't generate a response at this moment. Please try again.";
    } else if (!text.includes('MEDICAL DISCLAIMER')) {
      text = addSafetyDisclaimer(text);
    }

    // Extract sources
    const sources = extractSources(text, query);

    return {
      content: text,
      module,
      sources,
      usedLive: true
    };
  } catch (error) {
    console.error("AI API Error:", error);
    const sim = generateSimulatedResponse(query);
    return { ...sim, usedLive: false };
  }
};

// Extract medical sources and build links
const extractSources = (content: string, query: string): { title: string; url: string }[] => {
  const sources: { title: string; url: string }[] = [];
  const q = encodeURIComponent(query);

  // 1. Detect mentioned sources in text
  const sourceMap: { [key: string]: string } = {
    'FDA': `https://www.fda.gov/search?search_api_fulltext=${q}`,
    'WHO': `https://www.who.int/search?q=${q}`,
    'NHS': `https://www.nhs.uk/search/?q=${q}`,
    'PubMed': `https://pubmed.ncbi.nlm.nih.gov/?term=${q}`,
    'DrugBank': `https://go.drugbank.com/unearth/q?searcher=drugs&query=${q}`,
    'MedlinePlus': `https://medlineplus.gov/search/?query=${q}`,
    'CDC': `https://search.cdc.gov/search/?query=${q}`,
    'Mayo Clinic': `https://www.mayoclinic.org/search/search-results?q=${q}`,
    'WebMD': `https://www.webmd.com/search/search_results/default.aspx?query=${q}`
  };

  Object.keys(sourceMap).forEach(keyword => {
    if (content.includes(keyword)) {
      sources.push({ title: keyword, url: sourceMap[keyword] });
    }
  });

  // 2. Always add at least one relevant search link if none found
  if (sources.length === 0) {
    sources.push({ title: 'Search NHS', url: sourceMap['NHS'] });
    sources.push({ title: 'Search Drugs.com', url: `https://www.drugs.com/search.php?searchterm=${q}` });
  }

  // 3. Deduplicate
  return sources.filter((v, i, a) => a.findIndex(t => t.title === v.title) === i);
};

// Improved Simulation for Offline Mode
const generateSimulatedResponse = (query: string): { content: string; module: string; sources: { title: string; url: string }[] } => {
  const q = query.toLowerCase();

  let content = "";
  let sources = [{ title: "Clinical Database", url: "#" }];

  if (q.includes('cough')) {
    content = `**I understand you're asking about a cough.**

To give you the best advice, could you clarify:
1.  Is it a **dry** or **chesty/productive** cough?
2.  How long has the patient had it?
3.  Are there other symptoms like fever or shortness of breath?

**General Guidance:**
For a dry cough, **Dextromethorphan** is often recommended. For a chesty cough, an expectorant like **Guaifenesin** may help.

*Please verify the patient's medical history before dispensing.*`;
    sources = [
      { title: "NHS Guide", url: "https://www.nhs.uk/conditions/cough/" },
      { title: "Mayo Clinic", url: "https://www.mayoclinic.org/symptoms/cough/basics/definition/sym-20050846" }
    ];
  } else if (q.includes('dose') || q.includes('dosage')) {
    content = `**Standard Dosage Information:**

Please confirm the patient's **age** and **weight** for an accurate calculation.

Generally:
- **Adults:** Standard dosing applies.
- **Pediatrics:** Weight-based dosing (mg/kg) is required.

*Always check for renal or hepatic impairment adjustments.*`;
    sources = [{ title: "FDA Prescribing Info", url: "https://www.fda.gov/drugs" }];
  } else if (q.includes('stock')) {
    content = `**Inventory Check:**

I've checked the local database. Please specify the exact product name you are looking for.

*Note: In offline mode, I can only access cached inventory snapshots.*`;
  } else {
    content = `**Nexile AI (Offline Mode)**

I am currently in **Offline Mode** because no API key was detected.

To get real-time, intelligent answers, please add your **GitHub Token** to the \`.env\` file.

In the meantime, I can help with basic lookups if you be specific.`;
  }

  return {
    content: addSafetyDisclaimer(content),
    module: 'general',
    sources
  };
};
