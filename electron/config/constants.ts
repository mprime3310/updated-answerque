/**
 * Sentinel value stored in `nativelyApiKey` while a free trial is active.
 *
 * The trial token (`natively_trial_…`) is *not* a valid API key, but the
 * downstream code (LLMHelper, AnswerCueProSTT, ipcHandlers) needs to treat
 * "trial mode" identically to "key mode" for routing/auto-promotion. We store
 * this sentinel in CredentialsManager so the existing `if (nativelyApiKey)`
 * branches all light up, then swap the auth header to `x-trial-token` at the
 * actual network boundary.
 *
 * Any place that reads `nativelyApiKey` and forwards it to the network MUST
 * compare against TRIAL_SENTINEL_KEY (not the literal '__trial__') so a single
 * rename here updates every call site.
 */
export const TRIAL_SENTINEL_KEY = '__trial__' as const;

/**
 * Cloud LLM providers that support the "dynamic model discovery" settings UI:
 * per-provider API key, fetched model list, and a saved preferred model.
 *
 * This is the single source of truth for that set. It is imported by
 * CredentialsManager (preferred-model storage), ipcHandlers (key + model IPC),
 * and modelFetcher (model discovery). The renderer keeps its own structurally
 * identical union because it cannot import from the main process.
 */
export type CloudProviderId =
    | 'gemini'
    | 'groq'
    | 'openai'
    | 'claude'
    | 'deepseek'
    | 'cohere'
    | 'nvidia';

/**
 * Internal prefix applied to every NVIDIA NIM model id.
 *
 * NVIDIA namespaces its catalog the same way Groq does — `openai/gpt-oss-120b`,
 * `qwen/qwen3-coder-…`, `meta/llama-3.3-70b-instruct`. The app's model id space
 * is flat (LLMHelper.setModel dispatches purely on id prefixes), so a bare
 * NVIDIA id would be claimed by the Groq/OpenAI predicates and sent to the wrong
 * host. Prefixing keeps routing unambiguous; LLMHelper.resolveNvidiaModel()
 * strips it again before the id reaches the API.
 */
export const NVIDIA_MODEL_PREFIX = 'nvidia:';

/** Inverse of `NVIDIA_MODEL_PREFIX` — turn a stored id into the raw NIM model id. */
export function stripNvidiaPrefix(modelId: string): string {
    return modelId && modelId.toLowerCase().startsWith(NVIDIA_MODEL_PREFIX)
        ? modelId.slice(NVIDIA_MODEL_PREFIX.length)
        : modelId;
}

/** OpenAI-compatible base URL for the Cohere Compatibility API. */
export const COHERE_BASE_URL = 'https://api.cohere.com/compatibility/v1';

/** OpenAI-compatible base URL for NVIDIA NIM (free trial tier). */
export const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
