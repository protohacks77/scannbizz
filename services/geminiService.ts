
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Sale, Product } from '../types';

// IMPORTANT: In a real app, the API key would be securely managed and not hardcoded.
// We are using process.env.API_KEY as per the instructions.
const API_KEY = process.env.API_KEY;

// This is a mock implementation since we cannot make live API calls.
export const generateAnalyticsSummary = async (sales: Sale[], products: Product[]): Promise<string> => {
  console.log("Generating analytics summary with mock Gemini service...");

  if (!API_KEY) {
      console.error("Gemini API key not found in environment variables.");
      return "Error: Gemini API key is not configured. Please set the API_KEY environment variable.";
  }

  // In a real scenario, you would initialize and use the Gemini client here.
  // const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.grandTotal, 0);
  const totalItemsSold = sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
  
  const productSales = new Map<string, number>();
  sales.forEach(sale => {
      sale.items.forEach(item => {
          productSales.set(item.name, (productSales.get(item.name) || 0) + item.quantity);
      });
  });

  const topProduct = [...productSales.entries()].sort((a, b) => b[1] - a[1])[0];

  const lowStockProducts = products.filter(p => p.quantity < p.lowStockThreshold).length;

  // Mocking a Gemini-like text response.
  const mockSummary = `
### Executive Sales Summary

**Overall Performance:**
The business generated a total revenue of **$${totalRevenue.toFixed(2)}** from **${sales.length}** transactions, with a total of **${totalItemsSold}** items sold. The average transaction value was **$${(totalRevenue / sales.length || 0).toFixed(2)}**.

**Top Performers:**
The best-selling product was **${topProduct ? topProduct[0] : 'N/A'}**, with **${topProduct ? topProduct[1] : 0}** units sold. This highlights its strong demand among customers.

**Inventory Insights:**
There are currently **${lowStockProducts}** products running low on stock. It is recommended to reorder these items soon to prevent stockouts and potential loss of sales.

**Proactive Suggestion:**
Consider running a promotion on products that are not selling as well to increase their turnover. A "buy one, get one 50% off" campaign on slower-moving items could be effective.
  `;

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockSummary.trim());
    }, 1500);
  });
};

export const generateUpsellSuggestion = async (receiptItems: {name: string}[]): Promise<string> => {
    if (receiptItems.length === 0) return "";
    
    const lastItem = receiptItems[receiptItems.length - 1].name.toLowerCase();
    let suggestion = "";

    if (lastItem.includes("coffee")) {
        suggestion = "How about a fresh Croissant to go with that?";
    } else if (lastItem.includes("chips")) {
        suggestion = "A cold Soda would be perfect with that!";
    } else if (lastItem.includes("bread")) {
        suggestion = "Don't forget the Butter!";
    }

    return new Promise(resolve => {
        setTimeout(() => resolve(suggestion), 800);
    });
}