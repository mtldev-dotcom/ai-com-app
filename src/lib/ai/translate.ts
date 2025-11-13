/**
 * AI Translation Functions
 * Translate product content between languages
 */
import { generateWithOpenAI } from "./openai-client";
import { generateWithGemini } from "./gemini-client";
import type { TranslateInput, TranslateOutput } from "@/types/schemas";

/**
 * Translate text using AI
 */
export async function translateText(
  input: TranslateInput
): Promise<TranslateOutput> {
  const provider = input.provider || "openai";
  const targetLang = input.targetLanguage === "fr" ? "French" : "English";
  const sourceLang =
    input.sourceLanguage === "auto"
      ? "the detected source language"
      : input.sourceLanguage === "fr"
        ? "French"
        : "English";

  const translatePrompt = `Translate the following text from ${sourceLang} to ${targetLang}. 
Provide only the translation, no explanations.

Text to translate:
${input.text}

Translation:`;

  try {
    let translatedText: string;
    if (provider === "gemini") {
      translatedText = await generateWithGemini(translatePrompt, {
        temperature: 0.3, // Lower temperature for more accurate translation
      });
    } else {
      translatedText = await generateWithOpenAI(translatePrompt, {
        temperature: 0.3,
      });
    }

    // Clean up the response (remove quotes if present)
    translatedText = translatedText.trim().replace(/^["']|["']$/g, "");

    return {
      translatedText,
      sourceLanguage:
        input.sourceLanguage === "auto" ? "auto" : input.sourceLanguage,
      targetLanguage: input.targetLanguage,
    };
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
}
