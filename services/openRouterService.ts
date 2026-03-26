
/**
 * OCR Service
 * Handles vision-based OCR by proxying requests through a secure Supabase Edge Function.
 */
import { supabase } from '../lib/supabaseClient';

export async function extractNameFromImage(imageBase64: string): Promise<string> {
    try {
        const { data, error } = await supabase.functions.invoke('ocr-proxy', {
            body: { image: imageBase64 }
        });

        if (error) {
            console.error("OCR Proxy Error:", error);
            throw new Error(error.message || "Failed to communicate with OCR proxy.");
        }

        return data.text || "Unknown";
    } catch (error) {
        console.error("OCR Service Error:", error);
        throw error;
    }
}
