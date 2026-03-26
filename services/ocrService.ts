
import { createWorker } from 'tesseract.js';
import { extractNameFromImage as extractWithOpenRouter } from './openRouterService';

export interface OcrResult {
    name: string;
    method: 'openrouter' | 'tesseract' | 'none';
    confidence?: number;
}

export interface ValidUser {
    username: string;
    fullName: string;
}

/**
 * Unified OCR Service
 * Attempts OpenRouter first, falls back to local Tesseract.js if needed.
 * Validates result against known usernames if provided.
 */
export async function performOcr(imageBase64: string, validUsers: ValidUser[] = []): Promise<OcrResult> {
    let extractedName = "Unknown";
    let method: 'openrouter' | 'tesseract' | 'none' = 'none';

    try {
        extractedName = await extractWithOpenRouter(imageBase64);
        method = 'openrouter';
        
        if (extractedName && extractedName !== "Unknown") {
            const matched = findBestMatch(extractedName, validUsers);
            if (matched) return { name: matched, method: 'openrouter' };
            return { name: extractedName, method: 'openrouter' };
        }
    } catch (error: any) {
        if (error.message === 'OPENROUTER_NOT_CONFIGURED') {
            console.warn("OCR: OpenRouter not configured. Falling back to Tesseract.");
        } else {
            console.error("OCR: OpenRouter failed:", error);
            console.warn("OCR: Falling back to local Tesseract.");
        }
    }

    // Fallback to Tesseract.js
    try {
        const localResult = await performLocalOcr(imageBase64);
        if (localResult.name !== "Unknown") {
            const matched = findBestMatch(localResult.name, validUsers);
            if (matched) return { name: matched, method: 'tesseract' };
            return { name: localResult.name, method: 'tesseract' };
        }
        return localResult;
    } catch (error) {
        console.error("OCR: Tesseract fallback failed:", error);
        return { name: "Unknown", method: 'none' };
    }
}

/**
 * Fuzzy match the extracted name against known users.
 * Returns the matched username if a strong match is found.
 */
function findBestMatch(extracted: string, users: ValidUser[]): string | null {
    if (!users.length) return null;

    const normalizedExtracted = extracted.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // 1. Exact or contains match on normalized strings
    for (const user of users) {
        const normUser = user.username.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normFull = user.fullName.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        if (normalizedExtracted === normUser || normalizedExtracted === normFull) {
            return user.username;
        }
        
        if (normalizedExtracted.includes(normUser) && normUser.length > 3) {
            return user.username;
        }
    }

    return null;
}

async function performLocalOcr(imageBase64: string): Promise<OcrResult> {
    const worker = await createWorker('eng');
    const { data: { text, confidence } } = await worker.recognize(imageBase64);
    await worker.terminate();

    const name = extractNameHeuristic(text);
    
    return { 
        name, 
        method: 'tesseract',
        confidence 
    };
}

function extractNameHeuristic(text: string): string {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
    for (const line of lines) {
        if (/^[A-Z][a-z]+(\s[A-Z][a-z]+){1,3}$/.test(line)) {
            return line;
        }
    }
    return lines[0] || "Unknown";
}
