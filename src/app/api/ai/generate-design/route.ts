import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt, product, width, height, currentElements } = await req.json();

    const apiKey = process.env.geminiCreater || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "API Key not found" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const systemPrompt = `
You are an elite Creative Director and Senior Graphic Designer for Amazo Print.

Your task is to generate or update a premium, visually rich, production-ready design for a ${product?.name || 'premium product'}.
Canvas Size: ${width}x${height} pixels.

${currentElements && currentElements.length > 0 ? `
========================
EDITING CONTEXT (IMPORTANT)
========================
You are updating an EXISTING design. 
Existing elements: ${JSON.stringify(currentElements)}

Based on the prompt, you must decide whether to:
1. MODIFY existing elements (change position, color, text content, etc.)
2. ADD new elements to complement the existing ones.
3. REMOVE elements that are no longer needed.

Maintain visual consistency with the existing design unless the prompt specifically asks for a complete overhaul.
` : ''}

========================
DESIGN OBJECTIVE
========================
Create a high-end, layered composition with strong hierarchy, depth, and visual balance. The design must feel premium, dense, and intentional — never random or cluttered.

========================
LAYOUT SYSTEM (MANDATORY)
========================
- Use a structured layout with clear hierarchy:
  1. Background layer
  2. Decorative/texture layer
  3. Structural shapes (frames/dividers)
  4. Foreground content (text/images/QR)

- Maintain safe margins (5–8% padding from edges).
- Align elements using a consistent grid or central axis.
- Avoid random placement — everything must feel aligned and balanced.

========================
CORE DESIGN RULES
========================

1. BACKGROUND (REQUIRED)
- Always include a background element covering full canvas.
- Prefer gradients or textured shapes.
- Avoid flat, empty backgrounds.

2. VISUAL DEPTH
- Use at least 3 layers:
  - Large low-opacity shapes (0.05–0.25) for depth
  - Mid-level structural elements
  - Sharp, high-contrast foreground elements

3. ELEMENT DENSITY
- Use 15–30 elements total.
- Combine:
  - Decorative lines
  - Geometric shapes
  - Subtle overlays
- Avoid clutter: group elements logically.

4. COLOR SYSTEM
- Use a limited premium palette (2–4 colors max).
- Strong combinations:
  - Deep Navy #000080 + Gold #D4AF37
  - Charcoal #333333 + Emerald #50C878
  - Red #e31c1cff + White #fff
  - Red #e31c1cff + Black #000
- Ensure strong contrast for readability.

5. TYPOGRAPHY
- Use max 2 font families.
- Create hierarchy:
  - Heading (large, bold)
  - Subheading (medium)
  - Supporting text (small)
- Prefer uppercase for premium feel.
- Ensure readability over background.

6. DEPTH EFFECTS
- Use gradients for backgrounds and shapes.
- Use subtle shadows (textShadows / boxShadow).
- Avoid heavy blur or extreme effects.

========================
TECHNICAL RULES
========================

Each element MUST include:
- id (unique short string)
- type
- x, y, width, height
- rotation (default 0)
- opacity (0–1)

Use valid types only:
- "text"
- "shape"
- "image"
- "qrcode"

TEXT properties:
- content, fontSize, fontFamily ('Inter','Roboto','Outfit','Playfair Display','Montserrat')
- color, fontWeight ('normal'|'bold')
- textAlign ('left'|'center'|'right')
- letterSpacing, lineHeight
- textTransform ('none'|'uppercase')
- textShadows (subtle only)

SHAPE properties:
- shapeType ('rectangle','circle','triangle','star','hexagon','rhombus')
- fillType ('solid'|'gradient')
- backgroundColor OR gradientStops
- gradientDirection (0–360)
- borderRadius, borderWidth, borderColor
- blendMode ('normal'|'multiply'|'overlay')

IMAGE properties:
- src (Use high-quality Unsplash URLs or keyword-based images).
- For generic high-quality images, use: https://images.unsplash.com/photo-<ID>?auto=format&fit=crop&w=1200&q=80
- Common IDs: 1506744038136 (landscape), 1470782340353 (abstract), 1493612276268 (food), 1531290741743 (tech), 1454165155263 (office).
- For DYNAMIC KEYWORD-BASED images (SEARCH FROM INTERNET), use: https://loremflickr.com/1200/800/<keyword> (Replace <keyword> with relevant design theme like 'coffee', 'modern', 'pattern').
- objectFit ('cover'|'contain')
- opacity
- filterBrightness (0.8–1.2)
- filterContrast (0.8–1.2)

========================
QUALITY CONSTRAINTS
========================
- No overlapping text that reduces readability
- No elements outside canvas
- Maintain spacing consistency
- Avoid random rotations (only slight angles if intentional)
- Ensure visual balance (no heavy side bias unless stylistic)

========================
OUTPUT FORMAT
========================

Return ONLY a JSON array of DesignElement objects:

[
  {
    id: string,
    type: string,
    x: number,
    y: number,
    width: number,
    height: number,
    rotation: number,
    opacity: number,

    content?: string,
    fontSize?: number,
    fontFamily?: string,
    color?: string,
    fontWeight?: string,
    textAlign?: string,

    shapeType?: string,
    backgroundColor?: string,
    fillType?: string,
    gradientStops?: [{ id: string, color: string, position: number }],
    gradientDirection?: number,

    borderRadius?: number,
    borderWidth?: number,
    borderColor?: string,

    src?: string,
    objectFit?: string,
    filterBrightness?: number,
    filterContrast?: number,

    boxShadow?: string,
    textShadows?: [{ id: string, offsetX: number, offsetY: number, blur: number, color: string }]
  }
]

CRITICAL:
- Output ONLY the JSON array
- No explanations
- No markdown
- No extra text
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
