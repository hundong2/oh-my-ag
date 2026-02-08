import * as p from "@clack/prompts";
import pc from "picocolors";
import {
  fetchQuota,
  fetchRawResponse,
  type ModelQuota,
  type QuotaSnapshot,
} from "../lib/antigravity-bridge.js";

const BAR_WIDTH = 30;

function renderBar(percent: number): string {
  const filled = Math.round((percent / 100) * BAR_WIDTH);
  const empty = BAR_WIDTH - filled;

  let color: (s: string) => string;
  if (percent > 60) color = pc.green;
  else if (percent > 30) color = pc.yellow;
  else color = pc.red;

  const filledBar = color("█".repeat(filled));
  const emptyBar = pc.dim("░".repeat(empty));
  return `${filledBar}${emptyBar}`;
}

function formatModelRow(model: ModelQuota): string {
  const pct = model.remainingPercent.toFixed(0).padStart(4);
  const bar = renderBar(model.remainingPercent);
  const img = model.supportsImages ? pc.dim(" img") : "";
  const label = model.label.padEnd(26);
  const reset = model.isExhausted
    ? pc.red(`resets ${model.timeUntilReset}`)
    : model.timeUntilReset !== "Ready"
      ? pc.dim(`resets ${model.timeUntilReset}`)
      : "";
  return `  ${label} ${bar} ${pct}%${img} ${reset}`;
}

function renderCreditBar(
  _label: string,
  credits: { available: number; monthly: number; remainingPercent: number },
): string {
  const bar = renderBar(credits.remainingPercent);
  const pct = credits.remainingPercent.toFixed(0).padStart(4);
  const detail = `${credits.available.toLocaleString()} / ${credits.monthly.toLocaleString()}`;
  return [`  ${bar} ${pct}%`, `  ${pc.dim(detail)}`].join("\n");
}

function renderChart(snapshot: QuotaSnapshot): void {
  console.clear();
  p.intro(pc.bgCyan(pc.black(" oh-my-ag usage ")));

  const headerLines = [
    `${pc.bold("User")}  ${snapshot.userName}${snapshot.email ? ` (${pc.dim(snapshot.email)})` : ""}`,
    `${pc.bold("Plan")}  ${snapshot.planName}${snapshot.tierName ? ` ${pc.dim(`(${snapshot.tierName})`)}` : ""}`,
  ];
  if (snapshot.defaultModel) {
    const defaultLabel = snapshot.models.find(
      (m) => m.modelId === snapshot.defaultModel,
    )?.label;
    if (defaultLabel) {
      headerLines.push(`${pc.bold("Default")}  ${defaultLabel}`);
    }
  }
  p.note(headerLines.join("\n"), "Account");

  if (snapshot.promptCredits || snapshot.flowCredits) {
    const creditLines: string[] = [];
    if (snapshot.promptCredits) {
      creditLines.push(
        pc.bold("  Prompt"),
        renderCreditBar("Prompt", snapshot.promptCredits),
      );
    }
    if (snapshot.flowCredits) {
      if (creditLines.length > 0) creditLines.push("");
      creditLines.push(
        pc.bold("  Flow"),
        renderCreditBar("Flow", snapshot.flowCredits),
      );
    }
    p.note(creditLines.join("\n"), "Credits");
  }

  if (snapshot.models.length === 0) {
    p.note(pc.dim("  No model quota data available"), "Models");
  } else {
    const sorted = [...snapshot.models].sort((a, b) =>
      a.label.localeCompare(b.label),
    );
    const exhausted = sorted.filter((m) => m.isExhausted);
    const available = sorted.filter((m) => !m.isExhausted);

    const lines: string[] = [];

    if (available.length > 0) {
      for (const model of available) {
        lines.push(formatModelRow(model));
      }
    }

    if (exhausted.length > 0) {
      if (lines.length > 0) lines.push("");
      lines.push(pc.red("  ── Exhausted ──"));
      for (const model of exhausted) {
        lines.push(formatModelRow(model));
      }
    }

    p.note(lines.join("\n"), `Models (${snapshot.models.length})`);
  }

  p.outro(pc.dim(`Updated ${snapshot.timestamp.toLocaleTimeString()}`));
}

export async function usage(jsonMode = false, rawMode = false): Promise<void> {
  if (rawMode) {
    const data = await fetchRawResponse();
    if (!data) {
      console.error("Failed to connect to Antigravity");
      process.exit(1);
    }
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (!jsonMode) {
    const spinner = p.spinner();
    spinner.start("Connecting to Antigravity...");

    const snapshot = await fetchQuota();
    spinner.stop(
      snapshot ? "Connected" : pc.red("Failed to connect to Antigravity"),
    );

    if (!snapshot) {
      p.note(
        [
          `${pc.yellow("Antigravity IDE must be running locally.")}`,
          "",
          pc.dim("Make sure the language_server process is active."),
          pc.dim("Try opening a project in Antigravity first."),
        ].join("\n"),
        "Connection Failed",
      );
      process.exit(1);
    }

    renderChart(snapshot);
    return;
  }

  const snapshot = await fetchQuota();
  if (!snapshot) {
    console.log(JSON.stringify({ error: "Failed to connect" }));
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        userName: snapshot.userName,
        email: snapshot.email,
        planName: snapshot.planName,
        tierName: snapshot.tierName || null,
        promptCredits: snapshot.promptCredits ?? null,
        flowCredits: snapshot.flowCredits ?? null,
        defaultModel: snapshot.defaultModel,
        models: [...snapshot.models]
          .sort((a, b) => a.label.localeCompare(b.label))
          .map((m) => ({
            label: m.label,
            modelId: m.modelId,
            remainingPercent: m.remainingPercent,
            isExhausted: m.isExhausted,
            supportsImages: m.supportsImages,
            resetTime: m.resetTime?.toISOString() ?? null,
            timeUntilReset: m.timeUntilReset,
          })),
        timestamp: snapshot.timestamp.toISOString(),
      },
      null,
      2,
    ),
  );
}
