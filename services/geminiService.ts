
import { GoogleGenAI } from "@google/genai";
import { DailyRoutine } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  analyzeRoutine: async (routine: DailyRoutine) => {
    const taskSummary = routine.tasks.map(t => `${t.startTime}:00 - ${t.endTime}:00: ${t.title}`).join('\n');
    const prompt = `
      Perform a deep productivity audit on this daily schedule:
      Date: ${routine.date}
      Tasks:
      ${taskSummary || 'No tasks scheduled.'}

      Provide a detailed analysis including:
      1. Time Sinks: Identify areas where time might be poorly used.
      2. Deep Work Potential: Suggest best 2-3 hour window.
      3. Energy Management: Sequence alignment evaluation.
      4. 3 Actionable Improvements.

      Keep it punchy.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.error("AI Analysis failed", error);
      return "Unable to generate deep insights. Try adding more specific task names!";
    }
  },

  getWeatherAndComment: async (lat: number, lon: number) => {
    const prompt = `
      What is the current 5-day weather forecast for latitude ${lat}, longitude ${lon}? 
      
      Please format the response strictly as a list of Bengali sentences for each day following this pattern:
      "DATE: উক্ত দিনে [Weather Condition], তাপমাত্রা [Temperature] ডিগ্রি সেলসিয়াস।"
      
      Example of expected output style:
      12-12-12: উক্ত দিনে বৃষ্টি হওয়ার সম্ভাবনা নেই, রোদ থাকবে, বাতাস থাকবে, তাপমাত্রা ২৫ডিগ্রি সেলসিয়াস।
      
      Ensure every single day in the forecast is explained in this exact Bengali sentence format.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
      return response.text;
    } catch (error) {
      console.error("Weather AI failed", error);
      return "আবহাওয়ার তথ্য পাওয়া যাচ্ছে না। (Weather data currently unavailable)";
    }
  }
};
