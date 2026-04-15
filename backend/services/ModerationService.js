const axios = require('axios');

const MODERATION_API_URL = process.env.ML_MODERATION_API_URL || 'http://127.0.0.1:8001';
const MODERATION_TIMEOUT_MS = parseInt(process.env.ML_MODERATION_TIMEOUT_MS || '3000', 10);
const MODERATION_FAIL_OPEN = (process.env.ML_MODERATION_FAIL_OPEN || 'true').toLowerCase() === 'true';

// ─────────────────────────────────────────────────────────────────
// Keyword pre-filter — blocked if ANY of these appear as a word
// (whole-word match, case-insensitive, works inside longer sentences)
// ─────────────────────────────────────────────────────────────────
const BLOCKED_KEYWORDS = [
    // English
    'fuck', 'fucking', 'fucker', 'fck', 'f u c k',
    'shit', 'bullshit',
    'bitch', 'bastard', 'asshole', 'ass',
    'dick', 'cock', 'pussy',
    'cunt', 'slut', 'whore',
    'idiot', 'moron', 'retard',
    'nigger', 'nigga',
    // Urdu / Desi slang
    'mc', 'bc',
    'madarchod', 'behenchod',
    'chutiya', 'chutiay', 'chutiye',
    'bhosdike', 'bhosdika',
    'harami', 'haramzada', 'haramzadi',
    'gaandu', 'gandu',
    'randi', 'randwa',
    'dalla', 'dallah',
    'kutta', 'kutti',
    'saala', 'saali',
    'ullu', 'ulloo',
];

// Build a single regex: \b(word1|word2|...)\b — whole-word, case-insensitive
const KEYWORD_REGEX = new RegExp(
    `\\b(${BLOCKED_KEYWORDS.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
    'i'
);

// Root words to catch even when merged/concatenated (no word boundaries)
// e.g. "fuckyou", "bullshitpost", "mcbc" etc.
const BLOCKED_ROOTS = [
    'fuck', 'shit', 'bitch', 'cunt', 'cock', 'dick', 'pussy', 'nigger', 'nigga',
    'madarchod', 'behenchod', 'chutiya', 'bhosdike', 'haramzada', 'gaandu',
];
const ROOTS_REGEX = new RegExp(
    `(${BLOCKED_ROOTS.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'i'
);

class ModerationService {
    static async moderateText(text) {
        if (!text || !text.trim()) {
            return {
                toxic: false,
                confidence: 0,
                skipped: true
            };
        }

        // ── Step 1a: Whole-word keyword check ────────────────────────
        // ── Step 1b: Substring root check (catches merged words) ─────
        if (KEYWORD_REGEX.test(text) || ROOTS_REGEX.test(text)) {
            return {
                toxic: true,
                confidence: 1.0,
                skipped: false,
                blockedByKeyword: true
            };
        }

        // ── Step 2: ML model check ────────────────────────────────────
        try {
            const response = await axios.post(
                `${MODERATION_API_URL}/moderate`,
                { text },
                { timeout: MODERATION_TIMEOUT_MS }
            );

            return {
                toxic: Boolean(response.data.toxic),
                confidence: Number(response.data.confidence || 0),
                skipped: false
            };
        } catch (error) {
            if (MODERATION_FAIL_OPEN) {
                console.warn('Moderation API unavailable, fail-open enabled:', error.message);
                return {
                    toxic: false,
                    confidence: 0,
                    skipped: true,
                    error: error.message
                };
            }

            throw error;
        }
    }
}

module.exports = ModerationService;
