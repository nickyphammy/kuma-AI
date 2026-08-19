import type { CatalogEntry } from "./types";

/**
 * Curated open-source models that are pullable from the UI.
 *
 * This is a convenience list, not a whitelist — the pull dialog also accepts any
 * `name:tag` typed manually. Sizes are approximate download sizes for the default
 * quantization Ollama ships.
 */
export const MODEL_CATALOG: CatalogEntry[] = [
  {
    name: "llama3.2:1b",
    label: "Llama 3.2 1B",
    publisher: "Meta",
    size: "~1.3 GB",
    description: "Tiny and fast. Runs comfortably on CPU. Good for smoke-testing the app.",
    tags: ["tiny", "general"],
  },
  {
    name: "llama3.2:3b",
    label: "Llama 3.2 3B",
    publisher: "Meta",
    size: "~2.0 GB",
    description: "Strong small general-purpose model. The best default first pull.",
    tags: ["small", "general", "recommended"],
  },
  {
    name: "llama3.1:8b",
    label: "Llama 3.1 8B",
    publisher: "Meta",
    size: "~4.7 GB",
    description: "Well-rounded mid-size model with a large context window.",
    tags: ["medium", "general"],
  },
  {
    name: "qwen2.5:7b",
    label: "Qwen 2.5 7B",
    publisher: "Alibaba",
    size: "~4.7 GB",
    description: "Excellent multilingual and reasoning performance for its size.",
    tags: ["medium", "general", "multilingual"],
  },
  {
    name: "qwen2.5:14b",
    label: "Qwen 2.5 14B",
    publisher: "Alibaba",
    size: "~9.0 GB",
    description: "Noticeably stronger reasoning. Wants 12 GB+ of VRAM to stay off the CPU.",
    tags: ["large", "general"],
  },
  {
    name: "qwen2.5-coder:7b",
    label: "Qwen 2.5 Coder 7B",
    publisher: "Alibaba",
    size: "~4.7 GB",
    description: "Code-specialized. Strong at generation, refactoring, and fill-in-the-middle.",
    tags: ["medium", "code"],
  },
  {
    name: "gemma2:9b",
    label: "Gemma 2 9B",
    publisher: "Google",
    size: "~5.4 GB",
    description: "Efficient and articulate. Punches above its weight on writing tasks.",
    tags: ["medium", "general"],
  },
  {
    name: "gemma2:2b",
    label: "Gemma 2 2B",
    publisher: "Google",
    size: "~1.6 GB",
    description: "Very light. A good CPU-only option when VRAM is scarce.",
    tags: ["tiny", "general"],
  },
  {
    name: "mistral:7b",
    label: "Mistral 7B",
    publisher: "Mistral AI",
    size: "~4.1 GB",
    description: "Fast, permissively licensed workhorse. A solid baseline for comparisons.",
    tags: ["medium", "general"],
  },
  {
    name: "phi4:14b",
    label: "Phi-4 14B",
    publisher: "Microsoft",
    size: "~9.1 GB",
    description: "Trained heavily on reasoning data. Strong at math and structured problems.",
    tags: ["large", "reasoning"],
  },
  {
    name: "phi3.5:3.8b",
    label: "Phi 3.5 Mini",
    publisher: "Microsoft",
    size: "~2.2 GB",
    description: "Compact model with unusually good instruction-following.",
    tags: ["small", "general"],
  },
  {
    name: "deepseek-r1:7b",
    label: "DeepSeek-R1 7B",
    publisher: "DeepSeek",
    size: "~4.7 GB",
    description: "Reasoning model that emits an explicit <think> trace before answering.",
    tags: ["medium", "reasoning"],
  },
  {
    name: "deepseek-r1:14b",
    label: "DeepSeek-R1 14B",
    publisher: "DeepSeek",
    size: "~9.0 GB",
    description: "Larger reasoning variant. Slower, but markedly better on hard problems.",
    tags: ["large", "reasoning"],
  },
  {
    name: "codellama:7b",
    label: "Code Llama 7B",
    publisher: "Meta",
    size: "~3.8 GB",
    description: "Older code model. Useful as a comparison baseline against newer coders.",
    tags: ["medium", "code"],
  },
  {
    name: "nomic-embed-text",
    label: "Nomic Embed Text",
    publisher: "Nomic AI",
    size: "~274 MB",
    description: "Embedding model, not a chat model. Included for future retrieval work.",
    tags: ["tiny", "embedding"],
  },
];

export const CATALOG_TAGS = [
  "recommended",
  "tiny",
  "small",
  "medium",
  "large",
  "general",
  "code",
  "reasoning",
] as const;
