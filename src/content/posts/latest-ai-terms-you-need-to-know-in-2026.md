---
title: "Latest AI Terms You Need to Know in 2026"
description: "A beginner-friendly guide to the most important AI buzzwords and concepts trending right now — from MCP and RAG to Agentic AI, Fine-Tuning, and beyond."
date: 2026-07-15
tags: [
  "ai-glossary",
  "ai-terms",
  "learn-ai",
  "beginners-guide",
  "mcp",
  "rag",
  "llm",
  "ai-agents",
  "generative-ai",
  "agentic-ai",
  "tool-calling",
  "context-window",
  "fine-tuning",
  "mixture-of-experts",
  "knowledge-distillation",
  "ai-education",
  "trending-ai"
]
---

## 📄 YouTube Video Playlist

This blog contains a curated list of AI/LLM videos. Here they are **in reverse order** (last → first):

| # | Title | Link |
|---|-------|-------|
| 17 | AI, Machine Learning, Deep Learning and Generative AI Explained | [▶ Watch](https://www.youtube.com/watch?v=qYNweeDHiyU&t=544) |
| 16 | Generative vs Agentic AI: Shaping the Future of AI Collaboration | [▶ Watch](https://www.youtube.com/watch?v=EDb37y_MhRw&t=397) |
| 15 | What is generative AI and how does it work? – The Turing Lectures | [▶ Watch](https://www.youtube.com/watch?v=_6R7Ym6Vy_I&t=2491) |
| 14 | What are Generative AI models? | [▶ Watch](https://www.youtube.com/watch?v=hfIUstzHs9A&t=340) |
| 13 | Fine Tuning LLM Explained Simply | [▶ Watch](https://www.youtube.com/watch?v=ezdIOLbUSWg&t=58) |
| 12 | What is Mixture of Experts? | [▶ Watch](https://www.youtube.com/watch?v=sYDlVVyJYn4&t=147) |
| 11 | What is a Context Window? Unlocking LLM Secrets | [▶ Watch](https://www.youtube.com/watch?v=-QVoIxEpFkM&t=0) |
| 10 | RAG vs. Fine Tuning | [▶ Watch](https://www.youtube.com/watch?v=00Q0G84kq3M&t=20) |
| 9 | Knowledge Distillation: How LLMs train each other | [▶ Watch](https://www.youtube.com/watch?v=jrJKRYAdh7I&t=353) |
| 8 | What is Tool Calling? Connecting LLMs to Your Data | [▶ Watch](https://www.youtube.com/watch?v=h8gMhXYAv1k&t=71) |
| 7 | AI Tool Calling via Natural Language: LLMs, APIs & Docker in Action | [▶ Watch](https://www.youtube.com/watch?v=gosZ_vqXkMI&t=76) |
| 6 | MCP vs API: Simplifying AI Agent Integration with External Data | [▶ Watch](https://www.youtube.com/watch?v=7j1t3UZA1TY&t=1) |
| 5 | CLI vs MCP: How AI Agents Choose the Right Tool for the Job | [▶ Watch](https://www.youtube.com/watch?v=g9JIUM0MHgQ) |
| 4 | MCP vs. RAG: How AI Agents & LLMs Connect to Data | [▶ Watch](https://www.youtube.com/watch?v=X95MFcYH1_s) |
| 3 | MCP vs Skills: Which Is Right for Your AI Agent and LLMs? | [▶ Watch](https://www.youtube.com/watch?v=goU9VIXA8II) |
| 2 | What AI Agent Skills Are and How They Work | [▶ Watch](https://www.youtube.com/watch?v=Lg-meK5IU8Q) |


## 🎓 Curriculum Task

**Question to answer:**
> *How does the number of MCP tool calls impact/hamper the context window?*

---

### 📚 Suggested Study Path

**Step 1 — Foundation (Watch first)**
- [ ] 🎬 [What is a Context Window? Unlocking LLM Secrets](https://www.youtube.com/watch?v=-QVoIxEpFkM&t=0)
- [ ] 🎬 [What is Tool Calling? Connecting LLMs to Your Data](https://www.youtube.com/watch?v=h8gMhXYAv1k&t=71)

**Step 2 — MCP Specifics**
- [ ] 🎬 [MCP vs API: Simplifying AI Agent Integration](https://www.youtube.com/watch?v=7j1t3UZA1TY&t=1)
- [ ] 🎬 [MCP vs Skills: Which Is Right for Your AI Agent?](https://www.youtube.com/watch?v=goU9VIXA8II)
- [ ] 🎬 [CLI vs MCP: How AI Agents Choose the Right Tool](https://www.youtube.com/watch?v=g9JIUM0MHgQ)

**Step 3 — Advanced Context**
- [ ] 🎬 [AI Tool Calling via Natural Language: LLMs, APIs & Docker](https://www.youtube.com/watch?v=gosZ_vqXkMI&t=76)
- [ ] 🎬 [MCP vs. RAG: How AI Agents & LLMs Connect to Data](https://www.youtube.com/watch?v=X95MFcYH1_s)

---

### 🧠 Key Concepts to Understand

```
Context Window
│
├── Fixed token budget (e.g. 128K, 200K tokens)
│
├── Each MCP Tool Call consumes tokens:
│   ├── Tool DEFINITION (schema/description)  → added at system level
│   ├── Tool CALL request  (LLM output)        → output tokens
│   └── Tool RESULT (server response)          → input tokens
│
└── Problem with many MCP tools:
    ├── 🔴 More tools registered = larger system prompt
    ├── 🔴 Each call+result eats into remaining context
    ├── 🔴 Multi-hop chains (tool → tool → tool) multiply usage
    └── 🔴 Long tool results (e.g. big JSON/DB dumps) spike token use
```

### 📝 Research Question Breakdown

| Sub-Question | Where to Find Answer |
|---|---|
| What is a token/context window? | Video #11 |
| How are tool schemas stored in context? | Video #8 |
| How do MCP tool results fill context? | Video #6, #7 |
| What happens when context is full? | Video #11 |
| How to optimize (RAG vs MCP)? | Video #4, #10 |

### 🎯 Expected Answer Summary (to verify after study)
> Every MCP tool call injects **3 token blocks** into the context window: ①tool schema definitions, ②the call arguments, ③the tool response. With many tools or long chains, this rapidly consumes the fixed token budget → the LLM truncates older context, loses memory of earlier conversation/results, and performance degrades or errors occur.
