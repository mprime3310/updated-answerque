/**
 * modelFetcher.ts - Dynamic Model Discovery
 * Fetches available models from AI provider APIs
 */

import axios from 'axios';
import { CloudProviderId, NVIDIA_MODEL_PREFIX } from '../config/constants';

export interface ProviderModel {
    id: string;
    label: string;
}

type Provider = CloudProviderId;

const ALLOWED_CLAUDE_MODELS = new Set([
    'claude-opus-4-8',
    'claude-opus-4-7',
    'claude-opus-4-6',
    'claude-sonnet-4-6',
]);

/**
 * Fetch available models from a provider's API.
 * Returns a filtered, sorted array of { id, label } objects.
 */
export async function fetchProviderModels(
    provider: Provider,
    apiKey: string
): Promise<ProviderModel[]> {
    switch (provider) {
        case 'openai':
            return fetchOpenAIModels(apiKey);
        case 'groq':
            return fetchGroqModels(apiKey);
        case 'claude':
            return fetchAnthropicModels(apiKey);
        case 'gemini':
            return fetchGeminiModels(apiKey);
        case 'deepseek':
            return fetchDeepSeekModels(apiKey);
        case 'cohere':
            return fetchCohereModels(apiKey);
        case 'nvidia':
            return fetchNvidiaModels(apiKey);
        default:
            throw new Error(`Unknown provider: ${provider}`);
    }
}

// ─── OpenAI ──────────────────────────────────────────────────────────────────

async function fetchOpenAIModels(apiKey: string): Promise<ProviderModel[]> {
    const response = await axios.get('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 15000,
    });

    const models: any[] = response.data?.data || [];

    // Only include: ChatGPT latest alias, gpt-4o series, gpt-5.x+, o1, o3, o4 series
    const filtered = models.filter((m: any) => {
        const id = (m.id || '').toLowerCase();
        // Include the API alias for GPT 5.5 Instant
        if (id === 'chat-latest') return true;
        // Include gpt-4o variants
        if (id.includes('gpt-4o')) return true;
        // Include gpt-5 and above
        if (/gpt-[5-9]/.test(id)) return true;
        // Include o1/o3/o4 reasoning models (but not audio/realtime variants)
        if (/^o[134]/.test(id) && !id.includes('audio') && !id.includes('realtime')) return true;
        return false;
    });

    return filtered
        .map((m: any) => ({ id: m.id, label: m.id }))
        .sort((a, b) => a.label.localeCompare(b.label));
}

// ─── Groq ────────────────────────────────────────────────────────────────────

async function fetchGroqModels(apiKey: string): Promise<ProviderModel[]> {
    const response = await axios.get('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 15000,
    });

    const models: any[] = response.data?.data || [];

    // Only include text/chat models — exclude everything non-chat
    const excludePatterns = [
        'whisper', 'distil', 'guard', 'tool-use',
        'vision-preview', 'tts', 'playai', 'speech',
    ];

    const filtered = models.filter((m: any) => {
        const id = (m.id || '').toLowerCase();
        return !excludePatterns.some(p => id.includes(p));
    });

    return filtered
        .map((m: any) => ({ id: m.id, label: m.id }))
        .sort((a, b) => a.label.localeCompare(b.label));
}

// ─── Anthropic ───────────────────────────────────────────────────────────────

async function fetchAnthropicModels(apiKey: string): Promise<ProviderModel[]> {
    const response = await axios.get('https://api.anthropic.com/v1/models', {
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        timeout: 15000,
    });

    const models: any[] = response.data?.data || [];

    // Keep the user-facing Claude list intentionally tight.
    const filtered = models.filter((m: any) => {
        const id = (m.id || '').toLowerCase();
        return ALLOWED_CLAUDE_MODELS.has(id);
    });

    return filtered
        .map((m: any) => ({ id: m.id, label: m.display_name || m.id }))
        .sort((a, b) => a.label.localeCompare(b.label));
}

// ─── DeepSeek ────────────────────────────────────────────────────────────────

// Documented current DeepSeek text models; used as fallback if /models call fails
// or returns an unexpected shape. deepseek-chat / deepseek-reasoner are deprecated
// (2026-07-24) and intentionally excluded.
const DEEPSEEK_DEFAULT_MODELS: ProviderModel[] = [
    { id: 'deepseek-v4-flash', label: 'deepseek-v4-flash' },
    { id: 'deepseek-v4-pro', label: 'deepseek-v4-pro' },
];

async function fetchDeepSeekModels(apiKey: string): Promise<ProviderModel[]> {
    try {
        const response = await axios.get('https://api.deepseek.com/models', {
            headers: { Authorization: `Bearer ${apiKey}` },
            timeout: 15000,
        });

        const models: any[] = response.data?.data || [];
        if (!Array.isArray(models) || models.length === 0) {
            return DEEPSEEK_DEFAULT_MODELS;
        }

        const excludePatterns = [
            'embedding', 'embed', 'vision', 'image', 'audio',
            'tts', 'speech', 'whisper', 'stt',
        ];

        const filtered = models.filter((m: any) => {
            const id = (m.id || '').toLowerCase();
            if (!/^deepseek-v\d/.test(id)) return false;
            if (excludePatterns.some(p => id.includes(p))) return false;
            return true;
        });

        if (filtered.length === 0) return DEEPSEEK_DEFAULT_MODELS;

        return filtered
            .map((m: any) => ({ id: m.id, label: m.id }))
            .sort((a, b) => a.label.localeCompare(b.label));
    } catch (error: any) {
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
            throw new Error('Invalid or unauthorized DeepSeek API key');
        }
        return DEEPSEEK_DEFAULT_MODELS;
    }
}

// ─── Gemini ──────────────────────────────────────────────────────────────────

async function fetchGeminiModels(apiKey: string): Promise<ProviderModel[]> {
    const response = await axios.get(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
        {
            timeout: 15000,
        }
    );

    const models: any[] = response.data?.models || [];

    // Only include Gemini 2.5+ models (gemini-2.5-*, gemini-3-*, etc.)
    // Must support generateContent
    const excludePatterns = ['nano', 'custom', 'computer-use', 'banana', 'tts', 'embedding', 'aqa', 'vision'];

    const filtered = models.filter((m: any) => {
        const name = (m.name || '').toLowerCase();
        const displayName = (m.displayName || '').toLowerCase();
        const combined = name + ' ' + displayName;

        // Must support generateContent
        const supportsChat = m.supportedGenerationMethods?.includes('generateContent');
        if (!supportsChat) return false;

        // Must NOT match any exclude patterns
        if (excludePatterns.some(p => combined.includes(p))) return false;

        // Match gemini-2.5, gemini-3, gemini-4, etc. (version 2.5 and above)
        return /gemini-([3-9]|2\.5)/.test(combined);
    });

    return filtered
        .map((m: any) => {
            const id = (m.name || '').replace(/^models\//, '');
            return { id, label: m.displayName || id };
        })
        .sort((a, b) => a.label.localeCompare(b.label));
}

// ─── Cohere ──────────────────────────────────────────────────────────────────

/**
 * Cohere serves a wide catalog (chat, embed, rerank, classify, image, ASR) from
 * one `/v1/models` endpoint. We ask the API to pre-filter with `endpoint=chat`,
 * then defensively drop the non-chat families by id pattern so a key that can
 * see the full catalog still yields a chat-only dropdown.
 */
const COHERE_NON_CHAT_PATTERNS = [
    'embed', 'rerank', 'classify', 'transcribe', 'translate',
    'vision', 'aya-vision', 'c4ai-rerank', 'aya-expanse-caption',
];

/**
 * Cohere also serves a bare unpinned `command` alias. It is excluded on purpose:
 * `LLMHelper.isCohereModel()` matches the `command-` / `c4ai-` namespaces, so an
 * unpinned alias would not route to Cohere even if it appeared in the dropdown.
 */
const COHERE_EXCLUDED_IDS = new Set(['command']);

async function fetchCohereModels(apiKey: string): Promise<ProviderModel[]> {
    const response = await axios.get('https://api.cohere.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
        params: { endpoint: 'chat', page_size: 100 },
        timeout: 15000,
    });

    const models: any[] = response.data?.models || [];

    const filtered = models.filter((m: any) => {
        const id = (m.name || '').toLowerCase();
        if (!id) return false;
        if (COHERE_EXCLUDED_IDS.has(id)) return false;
        // `endpoint=chat` already restricts these, but honour the response body
        // too in case the filter is ignored on some plans.
        if (Array.isArray(m.endpoints) && m.endpoints.length > 0 && !m.endpoints.includes('chat')) {
            return false;
        }
        return !COHERE_NON_CHAT_PATTERNS.some(p => id.includes(p));
    });

    return filtered
        .map((m: any) => ({ id: m.name, label: prettifyCohereModel(m.name) }))
        .sort((a, b) => a.label.localeCompare(b.label));
}

/** `command-a-plus-05-2026` → `Command A Plus 05 2026` (readable, keeps version). */
function prettifyCohereModel(id: string): string {
    return id
        .split(/[-_]/)
        .map(part => (/^\d/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)))
        .join(' ');
}

// ─── NVIDIA (NIM) ────────────────────────────────────────────────────────────

// Model ids returned by this fetcher are prefixed with NVIDIA_MODEL_PREFIX (see
// electron/config/constants.ts) because NVIDIA reuses Groq's `owner/model`
// namespaces. See the comment on the constant for the full rationale.

const NVIDIA_EXCLUDE_PATTERNS = [
    // Non chat-completions NIMs.
    'embed', 'rerank', 'retrieval', 'nvidia/parakeet', 'nvidia/canary',
    'whisper', 'speech', 'tts', 'audio', 'vision', '-vl', 'vl-',
    'nemotron-nano-vl', 'guard', 'safety', 'ocr', 'table-structure',
    // Embedding families whose ids do NOT contain the word "embed" — e.g.
    // `baai/bge-m3`, `nvidia/gte-...`. Without these they show up in the chat
    // dropdown and then fail at request time with an unsupported-endpoint 400.
    '/bge', 'gte-', '/e5-', 'llava-', 'phi-3-vision', 'nemoretriever',
    // The rest of these were found by diffing the real /v1/models catalog
    // against the chat models. Each one is a non-chat NIM that still carries an
    // `owner/model` namespace, so the namespace rule alone does not catch it.
    'nvclip',            // CLIP image-text encoder
    'vila', 'neva',      // VLM wrappers
    'kosmos', 'fuyu',    // image-language models
    'deplot',            // chart -> table
    'synthetic-video', 'diffusiongemma', 'recurrentgemma',
    '-reward',           // reward / preference models
    'calibration', 'ising',
    'nemotron-parse',    // document parsing, not chat
    'riva-translate',    // translation-only
    'starcoder', 'codellama',  // base code completion, no chat template
];

/**
 * `nvidia/nemotron-3-super-120b-a12b` → `Nvidia Nemotron 3 Super 120B A12B`.
 *
 * Parameter-size tokens (`70b`, `8b`) are uppercased so the dropdown reads
 * like the vendor's own model names instead of `70b`.
 */
function prettifyNvidiaModel(id: string): string {
    return id
        .split(/[-_/]/)
        .map(part => {
            const sized = part.match(/^(\d+(?:\.\d+)?)([a-z])$/);
            if (sized) return sized[1] + sized[2].toUpperCase();
            return /^\d/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1);
        })
        .join(' ');
}

async function fetchNvidiaModels(apiKey: string): Promise<ProviderModel[]> {
    const response = await axios.get('https://integrate.api.nvidia.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 15000,
    });

    const models: any[] = response.data?.data || [];

    const filtered = models.filter((m: any) => {
        const id = (m.id || '').toLowerCase();
        if (!id) return false;
        if (NVIDIA_EXCLUDE_PATTERNS.some(p => id.includes(p))) return false;
        // Require a namespace (`owner/model`); the flat ids in this catalog are
        // non-chat or preview entries we do not want to surface.
        return id.includes('/');
    });

    return filtered
        .map((m: any) => ({
            id: NVIDIA_MODEL_PREFIX + m.id,
            label: prettifyNvidiaModel(m.id),
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
}
