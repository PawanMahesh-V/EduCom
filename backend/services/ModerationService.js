const axios = require('axios');

const MODERATION_API_URL = process.env.ML_MODERATION_API_URL || 'http://127.0.0.1:8001';
const MODERATION_TIMEOUT_MS = parseInt(process.env.ML_MODERATION_TIMEOUT_MS || '3000', 10);
const MODERATION_FAIL_OPEN = (process.env.ML_MODERATION_FAIL_OPEN || 'true').toLowerCase() === 'true';

class ModerationService {
    static async moderateText(text) {
        if (!text || !text.trim()) {
            return {
                toxic: false,
                confidence: 0,
                skipped: true
            };
        }

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
