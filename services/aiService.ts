import { GoogleGenAI } from "@google/genai";
import { db } from './db';
import { Product, Transaction, Insight } from '../types';

const SYSTEM_INSTRUCTION = `You are Nexile AI, an expert pharmaceutical business analyst. 
Analyze the provided JSON data containing inventory and sales. 
Provide 3 concise, actionable insights for the business owner. 
Focus on profit optimization, restocking alerts, and identifying dead stock.
Format the output as a JSON object with a key 'insights' which is an array of strings.`;

export const generateGeminiInsights = async (): Promise<string[]> => {
  const apiKey = process.env.API_KEY;
  
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
      model: "gemini-2.5-flash",
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