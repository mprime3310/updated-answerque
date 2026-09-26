export const STANDARD_CLOUD_MODELS: Record<string, {
    hasKeyCheck: (creds: any) => boolean;
    ids: string[];
    names: string[];
    descs: string[];
    pmKey: 'geminiPreferredModel' | 'openaiPreferredModel' | 'claudePreferredModel' | 'groqPreferredModel' | 'deepseekPreferredModel' | 'coherePreferredModel' | 'nvidiaPreferredModel';
}> = {
    gemini: {
        hasKeyCheck: (creds) => !!creds?.hasGeminiKey,
        ids: ['gemini-3.5-flash', 'gemini-3.1-flash-lite-preview', 'gemini-3.1-pro-preview'],
        names: ['Gemini 3.5 Flash', 'Gemini 3.1 Flash', 'Gemini 3.1 Pro'],
        descs: ['Fast • Multimodal', 'Fastest • Multimodal', 'Reasoning • High Quality'],
        pmKey: 'geminiPreferredModel'
    },
    openai: {
        hasKeyCheck: (creds) => !!creds?.hasOpenaiKey,
        ids: ['chat-latest', 'gpt-5.5', 'gpt-5.5-thinking-low', 'gpt-5.4'],
        names: ['GPT 5.5 Instant', 'GPT 5.5', 'GPT 5.5 Thinking', 'GPT 5.4'],
        descs: ['OpenAI chat-latest', 'OpenAI', 'Low reasoning', 'OpenAI'],
        pmKey: 'openaiPreferredModel'
    },
    claude: {
        hasKeyCheck: (creds) => !!creds?.hasClaudeKey,
        ids: ['claude-opus-4-8', 'claude-opus-4-7', 'claude-opus-4-6', 'claude-sonnet-4-6'],
        names: ['Opus 4.8', 'Opus 4.7', 'Opus 4.6', 'Sonnet 4.6'],
        descs: ['Anthropic • Highest reasoning', 'Anthropic • Opus', 'Anthropic • Opus', 'Anthropic • Sonnet'],
        pmKey: 'claudePreferredModel'
    },
    groq: {
        hasKeyCheck: (creds) => !!creds?.hasGroqKey,
        // Groq production text models on the standard developer plan.
        // `llama-3.3-70b-versatile` was removed: it is Enterprise-only now
        // (price "Contact Sales") and returns 404 model_not_found for
        // standard keys, which broke every Groq request.
        ids: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'llama-3.1-8b-instant'],
        names: ['Groq GPT-OSS 120B', 'Groq GPT-OSS 20B', 'Groq Llama 3.1 8B'],
        descs: ['Groq • Highest quality', 'Groq • Fastest', 'Groq • Lightweight'],
        pmKey: 'groqPreferredModel'
    },
    deepseek: {
        hasKeyCheck: (creds) => !!creds?.hasDeepseekKey,
        ids: ['deepseek-v4-flash', 'deepseek-v4-pro'],
        names: ['DeepSeek V4 Flash', 'DeepSeek V4 Pro'],
        descs: ['Fast • Text-only', 'Reasoning • Text-only'],
        pmKey: 'deepseekPreferredModel'
    },
    cohere: {
        hasKeyCheck: (creds) => !!creds?.hasCohereKey,
        // Cohere's live Command chat catalog. Kept in sync with the
        // non-chat filter in electron/utils/modelFetcher.ts so a preset here can
        // never be a model the "Fetch Models" button would hide.
        ids: [
            'command-a-plus-05-2026',
            'command-a-03-2025',
            'command-a-reasoning-08-2025',
            'command-r-plus-08-2024',
            'command-r-08-2024',
            'command-r7b-12-2024',
        ],
        names: [
            'Cohere Command A+',
            'Cohere Command A',
            'Cohere Command A Reasoning',
            'Cohere Command R+',
            'Cohere Command R',
            'Cohere Command R7B',
        ],
        descs: [
            'Cohere • Best overall',
            'Cohere • Fast',
            'Cohere • Reasoning',
            'Cohere • RAG tuned',
            'Cohere • Balanced',
            'Cohere • Lightweight',
        ],
        pmKey: 'coherePreferredModel'
    },
    nvidia: {
        hasKeyCheck: (creds) => !!creds?.hasNvidiaKey,
        // NVIDIA NIM free-trial models. Ids carry the internal `nvidia:` prefix
        // because NVIDIA reuses Groq's `owner/model` namespaces; the prefix is
        // stripped in the main process before the API call.
        //
        // Every id below was checked against the LIVE catalog at
        // https://integrate.api.nvidia.com/v1/models. NVIDIA retires models
        // often and a retired id returns HTTP 410 "Gone" rather than 404, so
        // these drift — re-verify before assuming they are still valid.
        // (Dropped as retired: meta/llama-3.3-70b-instruct — EOL 2026-08-26.)
        ids: [
            'nvidia:nvidia/nemotron-3-super-120b-a12b',
            'nvidia:mistralai/mistral-large-2-instruct',
            'nvidia:nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
            'nvidia:nvidia/nemotron-3.5-lightning-30b-a3b',
        ],
        names: [
            'NVIDIA Nemotron 3 Super 120B',
            'NVIDIA Mistral Large 2',
            'NVIDIA Nemotron 3 Nano Reasoning',
            'NVIDIA Nemotron 3.5 Lightning 30B',
        ],
        descs: [
            'Free tier • Highest quality',
            'Free tier • Strong general',
            'Free tier • Reasoning',
            'Free tier • Fastest',
        ],
        pmKey: 'nvidiaPreferredModel'
    },
};

export const isAllowedStandardCloudModel = (provider: string, modelId: string): boolean => {
    const config = STANDARD_CLOUD_MODELS[provider];
    if (!config) return true;
    return config.ids.includes(modelId);
};

export const CODEX_CLI_MODEL = {
    id: 'codex-cli',
    name: 'Codex CLI',
    desc: 'Local CLI transport',
};

export const CODEX_CLI_MODEL_PRESETS = [
    { id: 'gpt-5.5', name: 'ChatGPT 5.5' },
    { id: 'gpt-5.3-codex', name: 'Codex 5.3' },
    { id: 'gpt-5.3-codex-spark', name: 'Codex Spark 5.3' },
    { id: 'gpt-5.4', name: 'ChatGPT 5.4' },
];

export const codexCliSelectorId = (modelId: string): string => `codex-cli:${modelId}`;

export const getCodexCliModelDisplayName = (id: string): string | null => {
    if (id === CODEX_CLI_MODEL.id) return CODEX_CLI_MODEL.name;
    if (!id.startsWith('codex-cli:')) return null;

    const modelId = id.slice('codex-cli:'.length);
    const preset = CODEX_CLI_MODEL_PRESETS.find(model => model.id === modelId);
    return preset?.name || prettifyModelId(modelId);
};

export const prettifyModelId = (id: string): string => {
    if (!id) return '';
    return id.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};
