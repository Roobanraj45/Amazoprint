import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt, product, width, height } = await req.json();

    const apiKey = process.env.geminiCreater || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "API Key not found" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash" });

    const systemPrompt = `
      You are an expert graphic designer for Amazo Print. 
      Your task is to generate a professional design for a ${product?.name || 'custom product'}.
      The canvas size is ${width}x${height} pixels.

      Return ONLY a JSON array of DesignElement objects that follow this schema:
      {
        id: string (unique short id),
        type: 'text' | 'shape' | 'image' | 'qrcode',
        x: number,
        y: number,
        width: number,
        height: number,
        rotation: number,
        opacity: number,
        content?: string (for text),
        fontSize?: number,
        fontFamily?: string (use 'Inter' or 'Roboto'),
        color?: string (hex),
        fontWeight?: 'normal' | 'bold',
        shapeType?: 'rectangle' | 'circle' | 'triangle' | 'star' | 'heart' | 'hexagon',
        backgroundColor?: string (hex),
        borderColor?: string (hex),
        borderWidth?: number,
        src?: string (use 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809' for backgrounds if needed),
      }

      Focus on modern aesthetics, good typography, and balanced layout.
      Ensure elements are within the bounds of ${width}x${height}.
      DO NOT include any markdown formatting, just the raw JSON array.
    `;

    console.log("AI Generating for:", { prompt, product: product?.name, width, height });

    const result = await model.generateContent([systemPrompt, prompt]);
    const response = await result.response;
    const text = response.text();
    
    console.log("AI Raw Response:", text);

    try {
      // Clean up potential markdown formatting or leading/trailing text
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : text.replace(/```json/g, '').replace(/```/g, '').trim();
      const elements = JSON.parse(jsonString);

      return NextResponse.json({ success: true, elements });
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Raw Text:", text);
      return NextResponse.json({ 
        success: false, 
        error: "AI returned invalid design data. Please try a different prompt." 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to generate design" 
    }, { status: 500 });
  }
}
