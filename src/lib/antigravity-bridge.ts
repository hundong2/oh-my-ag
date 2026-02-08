import { execSync } from "node:child_process";
import https from "node:https";

export interface ModelQuota {
  label: string;
  modelId: string;
  remainingPercent: number;
  isExhausted: boolean;
  resetTime: Date | null;
  timeUntilReset: string;
  supportsImages: boolean;
}

interface CreditInfo {
  available: number;
  monthly: number;
  usedPercent: number;
  remainingPercent: number;
}

export interface QuotaSnapshot {
  userName: string;
  email: string;
  planName: string;
  tierName: string;
  promptCredits?: CreditInfo;
  flowCredits?: CreditInfo;
  models: ModelQuota[];
  defaultModel: string | null;
  timestamp: Date;
}

interface ConnectionInfo {
  pid: number;
  csrfToken: string;
  port: number;
}

function findProcess(): number | null {
  try {
    const stdout = execSync("pgrep -fl language_server", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    for (const line of stdout.split("\n")) {
      if (line.includes("antigravity") || line.includes("language_server")) {
        const pid = Number.parseInt(line.trim().split(" ")[0], 10);
        if (!Number.isNaN(pid)) return pid;
      }
    }
  } catch {}
  return null;
}

function extractCsrfToken(pid: number): string | null {
  try {
    const stdout = execSync(`ps -p ${pid} -ww -o args`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    const match = stdout.match(/--csrf_token\s+([a-zA-Z0-9-]+)/);
    return match?.[1] ?? null;
  } catch {}
  return null;
}

function findPorts(pid: number): number[] {
  try {
    const stdout = execSync(`lsof -nP -a -iTCP -sTCP:LISTEN -p ${pid}`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    const ports: number[] = [];
    for (const line of stdout.split("\n").slice(1)) {
      const match = line.match(/:(\d+)\s+\(LISTEN\)/);
      if (match?.[1]) {
        ports.push(Number.parseInt(match[1], 10));
      }
    }
    return ports;
  } catch {}
  return [];
}

function makeRequest<T = Record<string, unknown>>(
  port: number,
  path: string,
  csrfToken: string,
  body: unknown,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
          "Connect-Protocol-Version": "1",
          "X-Codeium-Csrf-Token": csrfToken,
        },
        rejectUnauthorized: false,
        timeout: 5000,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(body));
            } catch {
              reject(new Error("Invalid JSON response"));
            }
          } else {
            reject(new Error(`Request failed: ${res.statusCode}`));
          }
        });
      },
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
    req.write(data);
    req.end();
  });
}

function probePort(port: number, csrfToken: string): Promise<boolean> {
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: "127.0.0.1",
        port,
        path: "/exa.language_server_pb.LanguageServerService/GetUnleashData",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Codeium-Csrf-Token": csrfToken,
          "Connect-Protocol-Version": "1",
        },
        rejectUnauthorized: false,
        timeout: 5000,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          if (res.statusCode === 200) {
            try {
              JSON.parse(body);
              resolve(true);
            } catch {
              resolve(false);
            }
          } else {
            resolve(false);
          }
        });
      },
    );
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.write(JSON.stringify({ wrapper_data: {} }));
    req.end();
  });
}

export function formatTimeUntilReset(ms: number): string {
  if (ms <= 0) return "Ready";
  const mins = Math.ceil(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m`;
}

export interface RpcQuotaInfo {
  remainingFraction?: number | null;
  resetTime?: string;
  allowed?: boolean;
}

export interface RpcModelConfig {
  label?: string;
  modelOrAlias?: { model?: string };
  quotaInfo?: RpcQuotaInfo;
  supportsImages?: boolean;
}

interface RpcUserStatus {
  name?: string;
  email?: string;
  planStatus?: {
    planInfo?: {
      planName?: string;
      monthlyPromptCredits?: number;
      monthlyFlowCredits?: number;
    };
    availablePromptCredits?: number;
    availableFlowCredits?: number;
  };
  cascadeModelConfigData?: {
    clientModelConfigs?: RpcModelConfig[];
    defaultOverrideModelConfig?: {
      modelOrAlias?: { model?: string };
    };
  };
  userTier?: {
    name?: string;
  };
}

export interface RpcResponse {
  userStatus?: RpcUserStatus;
}

function calcCredits(
  monthly: number | undefined,
  available: number | undefined,
): CreditInfo | undefined {
  if (!monthly || available === undefined) return undefined;
  const m = Number(monthly);
  const a = Number(available);
  if (m <= 0) return undefined;
  return {
    available: a,
    monthly: m,
    usedPercent: ((m - a) / m) * 100,
    remainingPercent: (a / m) * 100,
  };
}

export function parseQuota(data: RpcResponse): QuotaSnapshot {
  const userStatus = data.userStatus ?? {};
  const planInfo = userStatus.planStatus?.planInfo ?? {};

  const promptCredits = calcCredits(
    planInfo.monthlyPromptCredits,
    userStatus.planStatus?.availablePromptCredits,
  );
  const flowCredits = calcCredits(
    planInfo.monthlyFlowCredits,
    userStatus.planStatus?.availableFlowCredits,
  );

  const rawModels = userStatus.cascadeModelConfigData?.clientModelConfigs ?? [];
  const models: ModelQuota[] = rawModels
    .filter(
      (m): m is RpcModelConfig & { quotaInfo: RpcQuotaInfo } =>
        m.quotaInfo !== undefined,
    )
    .map((m) => {
      const resetTime = m.quotaInfo.resetTime
        ? new Date(m.quotaInfo.resetTime)
        : null;
      const diff = resetTime ? resetTime.getTime() - Date.now() : 0;

      const remainingFraction = m.quotaInfo.remainingFraction;
      let remainingPercent = 0;
      if (remainingFraction !== undefined && remainingFraction !== null) {
        remainingPercent = remainingFraction * 100;
      } else if (m.quotaInfo.allowed) {
        remainingPercent = 100;
      }

      return {
        label: m.label || "Unknown",
        modelId: m.modelOrAlias?.model || "unknown",
        remainingPercent,
        isExhausted: m.quotaInfo.remainingFraction === 0,
        resetTime,
        timeUntilReset: formatTimeUntilReset(diff),
        supportsImages: m.supportsImages ?? false,
      };
    });

  const defaultModel =
    userStatus.cascadeModelConfigData?.defaultOverrideModelConfig?.modelOrAlias
      ?.model ?? null;

  return {
    userName: userStatus.name || "Unknown",
    email: userStatus.email || "",
    planName: planInfo.planName || "Free",
    tierName: userStatus.userTier?.name || "",
    promptCredits,
    flowCredits,
    models,
    defaultModel,
    timestamp: new Date(),
  };
}

export async function connect(): Promise<ConnectionInfo | null> {
  const pid = findProcess();
  if (!pid) return null;

  const csrfToken = extractCsrfToken(pid);
  if (!csrfToken) return null;

  const ports = findPorts(pid);
  for (const port of ports) {
    const alive = await probePort(port, csrfToken);
    if (alive) {
      return { pid, csrfToken, port };
    }
  }
  return null;
}

export async function getQuota(
  conn: ConnectionInfo,
): Promise<QuotaSnapshot | null> {
  try {
    const data = await makeRequest<RpcResponse>(
      conn.port,
      "/exa.language_server_pb.LanguageServerService/GetUserStatus",
      conn.csrfToken,
      {
        metadata: {
          ideName: "antigravity",
          extensionName: "antigravity",
          locale: "en",
        },
      },
    );
    return parseQuota(data);
  } catch {
    return null;
  }
}

export async function fetchRawResponse(): Promise<Record<
  string,
  unknown
> | null> {
  const conn = await connect();
  if (!conn) return null;
  try {
    return await makeRequest(
      conn.port,
      "/exa.language_server_pb.LanguageServerService/GetUserStatus",
      conn.csrfToken,
      {
        metadata: {
          ideName: "antigravity",
          extensionName: "antigravity",
          locale: "en",
        },
      },
    );
  } catch {
    return null;
  }
}

export async function fetchQuota(): Promise<QuotaSnapshot | null> {
  const conn = await connect();
  if (!conn) return null;
  return getQuota(conn);
}
