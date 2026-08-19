export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

/** A model present on disk (from `GET /api/tags`). */
export type InstalledModel = {
  name: string;
  digest: string;
  size: number;
  modifiedAt: string;
  family: string;
  parameterSize: string;
  quantization: string;
};

/** A model currently resident in memory (from `GET /api/ps`). */
export type RunningModel = {
  name: string;
  digest: string;
  family: string;
  parameterSize: string;
  quantization: string;
  /** Total bytes resident across VRAM + RAM. */
  sizeTotal: number;
  /** Bytes resident on the GPU. */
  sizeVram: number;
  /** Bytes resident in system RAM (sizeTotal - sizeVram). */
  sizeCpu: number;
  /** Share of the model on the GPU, 0-100. */
  vramPercent: number;
  expiresAt: string;
  /** Seconds until Ollama auto-evicts the model. */
  expiresInSec: number;
};

export type ChatStats = {
  totalDurationMs: number;
  loadDurationMs: number;
  promptTokens: number;
  evalTokens: number;
  tokensPerSecond: number;
};

export type UiMessage = ChatMessage & {
  id: string;
  model?: string;
  stats?: ChatStats;
  error?: string;
};

/** One line of a `/api/ollama/pull` stream. */
export type PullProgress = {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
  error?: string;
};

export type DaemonStatus =
  | { state: "checking" }
  | { state: "online"; version: string }
  | { state: "offline"; error: string };

export type CatalogEntry = {
  /** Full Ollama reference, e.g. "llama3.2:3b". */
  name: string;
  label: string;
  publisher: string;
  /** Approximate download size, human readable. */
  size: string;
  description: string;
  tags: string[];
};
