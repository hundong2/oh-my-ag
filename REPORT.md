# Repository Configuration & .agent Ecosystem Analysis Report

This report provides a detailed analysis of the repository's configuration files, specifically focusing on the `.agent` directory structure, the role of the `skills` folder, and other configuration files.

## 1. Overview of the `.agent` Directory

The `.agent` directory serves as the **"Brain"** and **"Operating Manual"** for this project. It defines how AI agents should behave within the project, what rules they must follow, and what tools they can utilize.

### Key Components

| Path | Description |
|---|---|
| `.agent/config/` | Contains user environment preferences (e.g., `user-preferences.yaml`). |
| `.agent/skills/` | Houses definitions and guidelines for specialized Agents (Skills). |
| `.agent/workflows/` | Defines standardized operating procedures (Workflows). |
| `.agent/mcp.json` | The MCP (Model Context Protocol) server configuration, connecting the AI to tools and memory. |

---

## 2. Detailed Structure Analysis

### 2.1. Skills (Specialized Domains)
**Path:** `.agent/skills/`

This folder defines the specific **Roles** the AI can assume. Each subfolder (e.g., `backend-agent`, `frontend-agent`) represents a specialized domain.

*   **`SKILL.md`**: The core file for each skill.
    *   **Role Definition**: Specifies `When to use` and `When NOT to use` the agent.
    *   **Architecture Rules**: Enforces domain-specific code structures (e.g., Router -> Service -> Repository).
    *   **Coding Standards**: Defines naming conventions, library usage principles, and quality standards.
    *   **Execution Guide**: References specific processes to follow during execution.
*   **`_shared/`**: Contains protocols shared across all agents (memory management, context loading, etc.).

### 2.2. Workflows (Standard Operating Procedures)
**Path:** `.agent/workflows/`

A collection of step-by-step **procedures** for consistent execution of repetitive and complex tasks.

*   Examples: `setup.md` (Initial Setup), `plan.md` (Planning), `debug.md` (Debugging).
*   Each file provides clear instructions like "Check this in Step 1, Run that in Step 2". This reduces AI hallucinations and standardizes work quality.

### 2.3. Config (Configuration)
**Path:** `.agent/config/`

*   **`user-preferences.yaml`**: Stores user preferences.
    *   `language`: AI response language (e.g., `ko`, `en`).
    *   `timezone`: Timezone settings.
    *   `agent_cli_mapping`: Maps specific tasks to specific AI models/CLIs (e.g., Frontend to Gemini, Backend to Claude).

### 2.4. MCP (Model Context Protocol)
**File:** `.agent/mcp.json`

Configures the connection between AI models and external systems (local development environment).
*   **`serena`**: Appears to be the name of the MCP server used in this project.
*   **Tools**: Enables capabilities like file browsing, code analysis, and reading/writing memory that the AI can actually execute.

---

## 3. Role of `.gitkeep` and Other Files

### 3.1. `.gitkeep`
> **Current Status**: Analysis shows that no `.gitkeep` files were found in the `.agent` folder or parent directories of this repository. However, here is their general purpose:

*   **Role**: Git effectively ignores **empty directories**. To keep a folder structure in the repository even when it contains no files, a dummy file named `.gitkeep` is conventionally created to force Git to track the directory.
*   **Naming**: This is not an official Git command/feature but a widely accepted convention.

### 3.2. Other Key Files
*   **`REPORT.ko.md` / `REPORT.md`**: These are the analysis reports currently being generated as per your request.

---

## Summary

This repository is designed to robustly support an **"Agentic Workflow"**.
1.  **`.agent/skills`** provides the AI with **"Expert Knowledge and Attitude"**.
2.  **`.agent/workflows`** teaches the AI the **"Order of Operations"**.
3.  **`.agent/mcp.json`** equips the AI with **"Hands and Tools"**.
4.  **`.agent/config`** tailors these to the user's **"Preferences"**.

Through this structure, the AI goes beyond simple code assistance to perform roles like Planner, Developer, and QA within clear rules and processes.
