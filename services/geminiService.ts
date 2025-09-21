
import { GoogleGenAI, Modality, GenerateContentResponse, Part } from "@google/genai";
import { ProductDetail }from '../types';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

const fileToGenerativePart = async (file: File): Promise<Part> => {
  const base64Data = await fileToBase64(file);
  return {
    inlineData: {
      mimeType: file.type,
      data: base64Data,
    },
  };
};

const buildPrompt = (
  pose: string,
  styleImage: File | null,
  additionalNotes: string,
  productDetails: ProductDetail[]
): string => {
  let detailInstructions = productDetails
    .filter(d => d.image && d.description)
    .map((d, index) => `- DETAIL SOURCE ${index + 1} ('${d.description}') must be replicated with perfect accuracy for its corresponding clothing part.`)
    .join('\n');

  return `**ABSOLUTE DIRECTIVE: HIGH-FIDELITY DIGITAL REPLICATION, 4K QUALITY**
You are a digital replication expert AI. Your task is to **COPY**, not to create. Generate a hyper-realistic, 4K, high-detail photograph.

**OBJECT ANALYSIS PROTOCOL:**
1.  **MODEL SOURCE:** Analyze the 'Model Source' image. Memorize the facial structure.
2.  **PRODUCT SOURCE:** Analyze the 'Product Source' images. Memorize the overall shape, color, and texture.
3.  **DETAIL SOURCE:** Analyze each 'DETAIL SOURCE' image. These are your highest priority references.
${detailInstructions}

**REPLICATION PROTOCOL (MANDATORY):**
1.  **FACE REPLICATION:** Reconstruct the face to be an **IDENTICAL MATCH** to the 'MODEL SOURCE'. No alterations.
2.  **PRODUCT REPLICATION:**
    a. Reconstruct the overall shape from the 'PRODUCT SOURCE'.
    b. For any area with a corresponding 'DETAIL SOURCE' (e.g., 'sleeve cuff'), you MUST **DIRECTLY REPLACE** the texture, color, and stitching with the information from that detail image. This is a direct copy-paste command, not a suggestion.
3.  **SCENE REPLICATION:** ${styleImage ? "Replicate the lighting, background, and mood from the 'Style Source' image." : "Create a clean, minimalist studio background with soft, even lighting."}
4.  **POSE:** Position the model in the following pose: ${pose}.
5.  **NOTES:** Apply the following notes: ${additionalNotes || 'None.'}

**FINAL WARNING:** The system will perform an automated pixel-similarity check between the detail source images (e.g., sleeve cuff) and the final output. Any discrepancy will result in failure. Absolute accuracy is the only goal.`;
};

export const generatePhotoshootImage = async (
  pose: string,
  modelImage: File,
  productFrontImage: File,
  productBackImage: File | null,
  styleImage: File | null,
  productDetails: ProductDetail[],
  additionalNotes: string
): Promise<string> => {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable is not set.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const promptText = buildPrompt(pose, styleImage, additionalNotes, productDetails);
    
    const imageParts: Part[] = [];
    imageParts.push(await fileToGenerativePart(modelImage));
    imageParts.push(await fileToGenerativePart(productFrontImage));
    if (productBackImage) imageParts.push(await fileToGenerativePart(productBackImage));
    if (styleImage) imageParts.push(await fileToGenerativePart(styleImage));

    for (const detail of productDetails) {
        if (detail.image) {
            imageParts.push(await fileToGenerativePart(detail.image));
        }
    }
    
    const contents = { parts: [{ text: promptText }, ...imageParts] };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: contents,
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    
    throw new Error("No image was generated. The model may have refused the request.");
};
