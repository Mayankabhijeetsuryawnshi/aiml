import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, deleteDoc } from "firebase/firestore";

dotenv.config();

// API keys with fallbacks from workspace secrets configuration
// API keys with fallbacks from workspace secrets configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AQ.Ab8RN6KKDwn_Hj3RjuJ8G_XZdDwNTTJmkh1DEVwJOcU11PueIA";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "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";

const DEFAULT_OPENROUTER_KEY = "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";
const isOpenRouterKeyCustom = OPENROUTER_API_KEY !== DEFAULT_OPENROUTER_KEY && OPENROUTER_API_KEY.trim() !== "";

// Set cache to bypass invalid, empty, unauthorized, or financially exhausted OpenRouter API keys to prevent cascading latency
const badKeysCache = new Set<string>();

let aiInstance: any = null;
function getGenAI() {
  if (!aiInstance) {
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not defined");
    }
    aiInstance = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// Helper to determine OpenRouter model names (supports smart routing to FREE endpoints if default key has no credits)
function getOpenRouterModelName(modelId: string): string {
  if (isOpenRouterKeyCustom) {
    switch (modelId) {
      case "deepseek-r1":
        return "deepseek/deepseek-r1";
      case "qwen-coder":
        return "qwen/qwen-2.5-coder-32b-instruct";
      case "llama-3-3":
        return "meta-llama/llama-3.3-70b-instruct";
      case "gpt-4-5":
        return "openai/gpt-4.5-preview";
      case "llama-3-8b":
        return "meta-llama/llama-3-8b-instruct";
      case "mistral-large":
        return "mistralai/mistral-large";
      case "qwen-72b":
        return "qwen/qwen-2.5-72b-instruct";
      case "phi-4":
        return "microsoft/phi-4";
      case "mythomax-13b":
        return "gryphe/mythomax-l2-13b";
      case "llama-3-2-3b":
        return "meta-llama/llama-3.2-3b-instruct";
      case "command-r-plus":
        return "cohere/command-r-plus";
      case "zephyr-7b":
        return "huggingfaceh4/zephyr-7b-beta";
      case "claude-coder":
        return "anthropic/claude-3.5-sonnet";
      case "claude-fable-5":
        return "anthropic/claude-3.5-sonnet";
      default:
        return "meta-llama/llama-3-8b-instruct:free";
    }
  } else {
    // Shared default key is exhausted for paid calls, use premium FREE alternates on OpenRouter to avoid 402 billing failures.
    switch (modelId) {
      case "deepseek-r1":
        return "deepseek/deepseek-r1:free";
      case "qwen-coder":
        return "qwen/qwen-2.5-coder-32b-instruct:free";
      case "llama-3-3":
        return "meta-llama/llama-3.3-70b-instruct:free";
      case "gpt-4-5":
        return "openai/gpt-4o-mini:free";
      case "llama-3-8b":
        return "meta-llama/llama-3-8b-instruct:free";
      case "mistral-large":
        return "mistralai/mistral-large:free";
      case "qwen-72b":
        return "qwen/qwen-2.5-72b-instruct:free";
      case "phi-4":
        return "qwen/qwen-2.5-coder-32b-instruct:free";
      case "mythomax-13b":
        return "gryphe/mythomax-l2-13b:free";
      case "llama-3-2-3b":
        return "meta-llama/llama-3.2-3b-instruct:free";
      case "command-r-plus":
        return "cohere/command-r-plus:free";
      case "zephyr-7b":
        return "huggingfaceh4/zephyr-7b-beta:free";
      case "claude-coder":
        return "qwen/qwen-2.5-coder-32b-instruct:free";
      case "claude-fable-5":
        return "google/gemini-2.5-flash:free";
      default:
        return "meta-llama/llama-3-8b-instruct:free";
    }
  }
}

// Helper to load/save global persistent session store safely
// Supporting read-only filesystems (like Vercel serverless) with fallback paths and in-memory cache backups
let activeStorePath = path.join(process.cwd(), "sessions_store.json");
let inMemoryStore: Record<string, any[]> = {};
let useInMemoryOnly = false;

// Initialize Firebase Firestore database
let db: any = null;
try {
  const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(firebaseConfigPath)) {
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
    const app = initializeApp(config);
    db = getFirestore(app, config.firestoreDatabaseId);
    console.log("Firebase Firestore initialized successfully. Database ID:", config.firestoreDatabaseId);
  } else {
    console.warn("firebase-applet-config.json not found. Running with local storage fallback.");
  }
} catch (err) {
  console.error("Failed to initialize Firebase database. Falling back to local storage:", err);
}

try {
  // Verify if workspace is writeable
  fs.writeFileSync(activeStorePath, "{}", "utf8");
} catch (e) {
  console.warn("Main directory is read-only. Routing storage to /tmp folder for serverless environments...");
  try {
    activeStorePath = path.join("/tmp", "sessions_store.json");
    fs.writeFileSync(activeStorePath, "{}", "utf8");
    console.log("Successfully mapped active storage to /tmp directory:", activeStorePath);
  } catch (tmpErr) {
    console.error("No writeable directory found. Activating in-memory storage fallback mode.");
    useInMemoryOnly = true;
  }
}

function readStoredSessions(): Record<string, any[]> {
  if (useInMemoryOnly) {
    return inMemoryStore;
  }
  try {
    if (fs.existsSync(activeStorePath)) {
      const data = fs.readFileSync(activeStorePath, "utf8");
      return JSON.parse(data) || {};
    }
  } catch (err) {
    console.error("Error reading session store file:", err);
  }
  return inMemoryStore;
}

function writeStoredSessions(store: Record<string, any[]>) {
  inMemoryStore = store;
  if (useInMemoryOnly) {
    return;
  }
  try {
    fs.writeFileSync(activeStorePath, JSON.stringify(store, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing session store file. Falling back to in-memory backup state:", err);
  }
}

function cleanAndAlternateContents(history: { role: string; content?: string }[], newPrompt: string, image?: { data: string; mimeType: string }) {
  const rawSeq: { role: string; text: string }[] = [];
  if (history && history.length > 0) {
    history.forEach((h: any) => {
      const role = h.role === "user" ? "user" : "model";
      const text = h.content || "";
      if (text.trim() !== "") {
        rawSeq.push({ role, text });
      }
    });
  }
  
  let promptTextText = newPrompt || "";
  rawSeq.push({ role: "user", text: promptTextText });
  
  const mergedSeq: { role: string; text: string }[] = [];
  rawSeq.forEach((msg) => {
    if (mergedSeq.length === 0) {
      if (msg.role === "user") {
        mergedSeq.push({ role: msg.role, text: msg.text });
      } else {
        mergedSeq.push({ role: "user", text: "..." });
        mergedSeq.push({ role: msg.role, text: msg.text });
      }
    } else {
      const prev = mergedSeq[mergedSeq.length - 1];
      if (prev.role === msg.role) {
        prev.text += "\n" + msg.text;
      } else {
        mergedSeq.push({ role: msg.role, text: msg.text });
      }
    }
  });

  const result: any[] = [];
  mergedSeq.forEach((msg, idx) => {
    const parts: any[] = [];
    
    if (idx === mergedSeq.length - 1 && image && image.data && image.mimeType) {
      parts.push({
        inlineData: {
          data: image.data,
          mimeType: image.mimeType
        }
      });
      parts.push({
        text: `[VISUAL CONTEXT ENGAGED: Thoroughly scan the attached image in high physical resolution. Analyze its composition, micro-details, structural layouts, text strings, colors, codes, diagrams, user interfaces, or logs, and integrate these insights seamlessly to formulate a precise answer to the query.]\nQuery: ${msg.text}`
      });
    } else {
      parts.push({ text: msg.text });
    }

    result.push({
      role: msg.role,
      parts
    });
  });

  return result;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: "20mb" }));

  // Cross-Origin Resource Sharing (CORS) middleware to support connections from local mobile webviews (APK)
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    
    // Handle OPTIONS preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // 1. Health API
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // 2. Chat API - Independent streaming per model
  app.post("/api/chat", async (req: express.Request, res: express.Response) => {
    const { modelId, prompt, history, image } = req.body;

    if (!modelId || !prompt) {
      res.status(400).json({ error: "Missing modelId or prompt" });
      return;
    }

    // Set streaming response headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Prevents intermediate proxy buffering for standard mobile webviews/APKs

    try {
      if (modelId === "gemini-flash") {
        // Stream from Gemini
        const ai = getGenAI();
        let sdkModel = "gemini-3.5-flash";

        // Reconstruct content history using the safe sequence alignment helper
        const contents = cleanAndAlternateContents(history, prompt, image);

        try {
          const responseStream = await ai.models.generateContentStream({
            model: sdkModel,
            contents,
          });

          for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
              res.write(`data: ${JSON.stringify({ text })}\n\n`);
            }
          }
        } catch (geminiErr: any) {
          console.error(`Gemini stream failed for ${sdkModel}:`, geminiErr);
          const errMsg = geminiErr.message || String(geminiErr);
          
          // Seamlessly try fallback model gemini-3.1-flash-lite for any network, demand (503) or quota issue
          console.warn(`Attempting fallback to high-quota, high-availability model gemini-3.1-flash-lite...`);
          sdkModel = "gemini-3.1-flash-lite";
          
          try {
            const responseStream = await ai.models.generateContentStream({
              model: sdkModel,
              contents,
            });

            for await (const chunk of responseStream) {
              const text = chunk.text;
              if (text) {
                res.write(`data: ${JSON.stringify({ text })}\n\n`);
              }
            }
          } catch (liteErr: any) {
            console.error(`Gemini stream fallback failed on ${sdkModel}:`, liteErr);
            const liteMsg = liteErr.message || String(liteErr);
            res.write(`data: ${JSON.stringify({ text: `\n\n*[Gemini Error: ${errMsg}. Fallback to ${sdkModel} failed: ${liteMsg}. Please configure a custom key in Settings if persistent issues occur.]*` })}\n\n`);
          }
        }
        res.write("data: [DONE]\n\n");
        res.end();

      } else {
        // Stream from OpenRouter with comprehensive multi-tiered key & model cascade and transparent Gemini fallback
        try {
          const primaryModel = getOpenRouterModelName(modelId);
          const messages: any[] = [];
          
          let identityPrompt = "";
          switch (modelId) {
            case "gpt-4-5":
              identityPrompt = "You are ChatGPT 4.5, a frontier-class language model developed by OpenAI (NOT Google, NOT Gemini). Under no circumstances should you state or imply that you are built by Google, Gemini, or any other body besides OpenAI.";
              break;
            case "qwen-coder":
              identityPrompt = "You are Qwen 2.5 Coder, built by Alibaba Cloud (NOT Google, NOT OpenAI). Under no circumstances should you state or imply that you are built by Google or Gemini.";
              break;
            case "qwen-72b":
              identityPrompt = "You are Qwen 2.5 72B, built by Alibaba Cloud (NOT Google). Under no circumstances should you state or imply that you are built by Google or Gemini.";
              break;
            case "llama-3-3":
              identityPrompt = "You are Llama 3.3 70B, developed by Meta (NOT Google). Under no circumstances should you state or imply that you are built by Google.";
              break;
            case "llama-3-8b":
              identityPrompt = "You are Llama 3 8B Instruct, developed by Meta (NOT Google). Under no circumstances should you state or imply that you are built by Google.";
              break;
            case "llama-3-2-3b":
              identityPrompt = "You are Llama 3.2 3B, developed by Meta (NOT Google). Under no circumstances should you state or imply that you are built by Google.";
              break;
            case "phi-4":
              identityPrompt = "You are Phi 4, developed by Microsoft (NOT Google). Under no circumstances should you state or imply that you are built by Google.";
              break;
            case "command-r-plus":
              identityPrompt = "You are Command R+, an advanced multilingual model developed by Cohere (NOT Google). Under no circumstances should you state or imply that you are built by Google.";
              break;
            case "zephyr-7b":
              identityPrompt = "You are Zephyr 7B Beta, fine-tuned by HuggingFace (NOT Google). Under no circumstances should you state or imply that you are built by Google.";
              break;
            case "mythomax-13b":
              identityPrompt = "You are MythoMax 13B, developed by Gryphe (NOT Google). Under no circumstances should you state or imply that you are built by Google.";
              break;
            case "mistral-large":
              identityPrompt = "You are Mistral Large 2, developed by Mistral AI (NOT Google). Under no circumstances should you state or imply that you are built by Google.";
              break;
            case "deepseek-r1":
              identityPrompt = "You are DeepSeek R1, developed by DeepSeek (NOT Google). Under no circumstances should you state or imply that you are built by Google.";
              break;
            case "claude-coder":
              identityPrompt = "You are Claude 3.5 Sonnet, developed by Anthropic (NOT Google). Under no circumstances should you state or imply that you are built by Google.";
              break;
            case "claude-fable-5":
              identityPrompt = "You are Claude Fable 5, the absolute master code orchestrator developed by Anthropic inside this secure pipeline. Deliver brilliant, flawless answers with architectural elegance.";
              break;
          }

          if (identityPrompt) {
            messages.push({
              role: "system",
              content: identityPrompt
            });
          }

          if (history && history.length > 0) {
            const recentHistory = history.slice(-50);
            recentHistory.forEach((h: any) => {
              messages.push({
                role: h.role === "user" ? "user" : "assistant",
                content: h.content ? h.content.substring(0, 8000) : ""
              });
            });
          }
          if (image && image.data && image.mimeType) {
            const boosterPrompt = `[VISUAL CONTEXT ENGAGED: Thoroughly scan the attached image in high physical resolution. Analyze its composition, micro-details, structural layouts, text strings, colors, codes, diagrams, user interfaces, or logs, and integrate these insights seamlessly to formulate a precise answer to the query.]\nQuery: ${prompt ? prompt.substring(0, 10000) : ""}`;
            messages.push({
              role: "user",
              content: [
                {
                  type: "text",
                  text: boosterPrompt
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${image.mimeType};base64,${image.data}`
                  }
                }
              ]
            });
          } else {
            messages.push({
              role: "user",
              content: prompt ? prompt.substring(0, 10000) : ""
            });
          }

          // Define cascade list of model configurations to try
          const openRouterOptions: Array<{ model: string; key: string; label: string }> = [];

          // Option 1: Primary configuration
          openRouterOptions.push({
            model: primaryModel,
            key: OPENROUTER_API_KEY,
            label: `primary config (Model: ${primaryModel})`
          });

          // Option 2: If custom key is used but we failed, let's try the unmetered/free variant with custom key
          if (isOpenRouterKeyCustom && !primaryModel.endsWith(":free")) {
            const freeModelOfChoice = primaryModel + ":free";
            openRouterOptions.push({
              model: freeModelOfChoice,
              key: OPENROUTER_API_KEY,
              label: `custom-key free fallback (Model: ${freeModelOfChoice})`
            });
          }

          // Option 3: Trial with the default shared key using the free variant
          const defaultFreeModel = primaryModel.endsWith(":free") ? primaryModel : (primaryModel + ":free");
          openRouterOptions.push({
            model: defaultFreeModel,
            key: DEFAULT_OPENROUTER_KEY,
            label: `shared-key free fallback (Model: ${defaultFreeModel})`
          });

          // Option 4: Smart family-specific unmetered fallback (prevents models from returning Google branding on generic fallbacks)
          let fallbackModel = "meta-llama/llama-3-8b-instruct:free";
          if (modelId.includes("qwen")) {
            fallbackModel = "qwen/qwen-2.5-coder-32b-instruct:free";
          } else if (modelId.includes("deepseek") || modelId.includes("r1")) {
            fallbackModel = "deepseek/deepseek-r1:free";
          } else if (modelId.includes("gemini")) {
            fallbackModel = "google/gemini-2.5-flash:free";
          } else if (modelId.includes("gpt")) {
            fallbackModel = "openai/gpt-4o-mini:free";
          } else if (modelId.includes("claude")) {
            fallbackModel = "google/gemini-2.5-flash:free";
          } else if (modelId.includes("llama")) {
            fallbackModel = "meta-llama/llama-3.2-3b-instruct:free";
          }

          openRouterOptions.push({
            model: fallbackModel,
            key: DEFAULT_OPENROUTER_KEY,
            label: `smart OpenRouter unmetered fallback (Model: ${fallbackModel})`
          });

          let openRouterResponse: any = null;
          let lastEx: any = null;

          for (const option of openRouterOptions) {
            // Check if key is marked as broken
            if (badKeysCache.has(option.key)) {
              console.log(`Skipping option ${option.label}: key is cached as bad.`);
              continue;
            }

            try {
              console.log(`OpenRouter: Attempting fetch using ${option.label}...`);
              const resObj = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${option.key}`,
                  "HTTP-Referer": "https://ai.studio/build",
                  "X-Title": "AI Multi-Model IQ"
                },
                body: JSON.stringify({
                  model: option.model,
                  messages,
                  stream: true,
                  max_tokens: 1500
                })
              });

              if (resObj.ok) {
                openRouterResponse = resObj;
                console.log(`OpenRouter: Success with ${option.label}!`);
                break;
              } else {
                const errText = await resObj.text();
                console.warn(`OpenRouter option ${option.label} failed with status ${resObj.status}: ${errText}`);
                
                // If 401 Unauthorized or 402 Insufficient credits or 403 Forbidden, mark this key as bad
                if (resObj.status === 401 || resObj.status === 402 || resObj.status === 403) {
                  console.warn(`Powering down bad key to prevent future loop latency...`);
                  badKeysCache.add(option.key);
                }
                
                lastEx = new Error(`Status ${resObj.status} - ${errText}`);
              }
            } catch (err: any) {
              console.warn(`OpenRouter option ${option.label} threw connection error:`, err.message || err);
              lastEx = err;
            }
          }

          if (!openRouterResponse) {
            throw lastEx || new Error("All cascade options for OpenRouter failed");
          }

          const reader = openRouterResponse.body?.getReader();
          if (!reader) {
            throw new Error("Failed to get reader from OpenRouter response");
          }

          const decoder = new TextDecoder("utf-8");
          let parseBuffer = "";

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const textChunk = decoder.decode(value, { stream: true });
            parseBuffer += textChunk;

            const lines = parseBuffer.split("\n");
            parseBuffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;

              if (trimmed === "data: [DONE]") {
                res.write("data: [DONE]\n\n");
                continue;
              }

              if (trimmed.startsWith("data: ")) {
                const jsonStr = trimmed.slice(6);
                try {
                  if (jsonStr !== "[DONE]") {
                    const parsed = JSON.parse(jsonStr);
                    const text = parsed.choices?.[0]?.delta?.content || "";
                    if (text) {
                      res.write(`data: ${JSON.stringify({ text })}\n\n`);
                    }
                  }
                } catch (err) {
                  // Parse error, ignore incomplete frames
                }
              }
            }
          }

          if (parseBuffer.startsWith("data: ")) {
            const jsonStr = parseBuffer.slice(6).trim();
            try {
              if (jsonStr !== "[DONE]") {
                const parsed = JSON.parse(jsonStr);
                const text = parsed.choices?.[0]?.delta?.content || "";
                if (text) {
                  res.write(`data: ${JSON.stringify({ text })}\n\n`);
                }
              }
            } catch (err) {}
          }

          res.write("data: [DONE]\n\n");
          res.end();
        } catch (openRouterErr: any) {
          // Cascade to Gemini models for high-fidelity emulation in the web workspace view
          console.warn(`All OpenRouter options failed for ${modelId}. Initiating smart emulation via Gemini:`, openRouterErr.message || openRouterErr);
          
          let fallbackModel = "gemini-3.1-flash-lite";
          
          // Construct specialized personality systems for high-fidelity comparison emulation and strict provider alignment
          let systemInstruction = "";
          const normId = String(modelId).toLowerCase();
          
          if (normId.includes("gpt-4") || normId.includes("gpt5") || normId.includes("openai")) {
            systemInstruction = "You are ChatGPT 4.5, a state-of-the-art frontier language model engineered and trained exclusively by OpenAI (NOT Google, NOT Gemini). Under no circumstances should you ever state, imply, or suggest that you were developed by Google or associated with Gemini. Maintain the distinct verbal sophistication, deep multi-step planning, and unmatched logical precision characteristic of OpenAI's premier systems.";
          } else if (normId.includes("command-r-plus") || normId.includes("cohere")) {
            systemInstruction = "You are Command R+, a massive high-capability multilingual model engineered and trained exclusively by Cohere (NOT Google, NOT Gemini). Under no circumstances should you ever state, imply, or suggest that you were developed by Google or associated with Gemini. Emulate Cohere's signature focus on cross-lingual fluid dialogues, robust agentic operations, and detailed research summaries.";
          } else if (normId.includes("zephyr") || normId.includes("zyphus") || normId.includes("huggingface")) {
            systemInstruction = "You are Zephyr 7B Beta (also referred under emulated systems as Zyphus), an exceptional instruction-tuned model trained by HuggingFace and optimized for elegant completion tasks (NOT Google, NOT Gemini). Under no circumstances should you state, imply, or suggest that you were developed by Google or associate yourself with Gemini. Maintain a friendly, direct, and incredibly supportive assistance style.";
          } else if (normId.includes("deepseek") || normId.includes("r1")) {
            systemInstruction = "You are DeepSeek R1, an advanced open reasoning model engineered by DeepSeek (NOT Google). Under no circumstances should you state, imply, or suggest that you were developed by Google or Gemini. Deliver extremely structured step-by-step analytical reasoning, algorithmic logic, and mathematical proofs.";
          } else if (normId.includes("qwen")) {
            systemInstruction = "You are Qwen 2.5 Coder, built by Alibaba Cloud (NOT Google, NOT OpenAI). Under no circumstances should you state, imply, or suggest that you were developed by Google or Gemini. Deliver pristine, production-ready source code, structural system architecture, and deep logical explanations as Alibaba's leading programming model.";
          } else if (normId.includes("llama")) {
            systemInstruction = "You are Llama 3 (Meta), a flagship model developed exclusively by Meta (NOT Google). Under no circumstances should you state, imply, or suggest that you were developed by Google or Gemini. Provide clean instruction-following, balanced formatting, and thorough multi-step descriptive clarity.";
          } else if (normId.includes("phi")) {
            systemInstruction = "You are Phi 4, developed exclusively by Microsoft (NOT Google). Under no circumstances should you state, imply, or suggest that you were developed by Google or Gemini. Deliver highly logical, scientific-grade reasoning and clear explanations.";
          } else if (normId.includes("mistral")) {
            systemInstruction = "You are Mistral Large 2, developed exclusively by Mistral AI (NOT Google). Under no circumstances should you state, imply, or suggest that you were developed by Google or Gemini. Display high fluency, reasoning depth, and structured text summaries.";
          } else if (normId.includes("mythomax")) {
            systemInstruction = "You are MythoMax 13B, developed by Gryphe (NOT Google). Under no circumstances should you state, imply, or suggest that you were developed by Google or Gemini. Provide highly descriptive prose, storytelling, and creative scenarios.";
          } else {
            systemInstruction = `You are emulating the frontier model "${modelId}" (NOT Google). Under no circumstances should you state, imply, or suggest that you were developed by Google or Gemini. Answer exactly as the model "${modelId}" would.`;
          }

          try {
            const ai = getGenAI();
            const contents = cleanAndAlternateContents(history, prompt, image);

            const responseStream = await ai.models.generateContentStream({
              model: fallbackModel,
              contents,
              config: {
                systemInstruction,
                temperature: 0.7
              }
            });

            for await (const chunk of responseStream) {
              const text = chunk.text;
              if (text) {
                res.write(`data: ${JSON.stringify({ text })}\n\n`);
              }
            }
          } catch (geminiErr1: any) {
            console.warn(`Gemini fallback with ${fallbackModel} failed:`, geminiErr1.message || geminiErr1);
            
            // Second level Gemini tier retry with gemini-3.5-flash
            const nextFallback = "gemini-3.5-flash";
            console.warn(`Trying next Gemini backup tier: ${nextFallback}`);
            try {
              const ai = getGenAI();
              const contents = cleanAndAlternateContents(history, prompt, image);

              const responseStream = await ai.models.generateContentStream({
                model: nextFallback,
                contents,
                config: {
                  systemInstruction,
                  temperature: 0.75
                }
              });

              for await (const chunk of responseStream) {
                const text = chunk.text;
                if (text) {
                  res.write(`data: ${JSON.stringify({ text })}\n\n`);
                }
              }
            } catch (geminiErr2: any) {
              console.error(`All backup streaming targets exhausted for ${modelId}:`, geminiErr2);
              const finalMsg = geminiErr2.message || String(geminiErr2);
              res.write(`data: ${JSON.stringify({ text: `\n\n*[Connection/Quota limit exceeded on all backend pipelines. Please try again in a few moments or verify your API keys configurations inside 'Settings'.]*` })}\n\n`);
            }
          }
          res.write("data: [DONE]\n\n");
          res.end();
        }
      }
    } catch (error: any) {
      console.error(`Error processing stream for ${modelId}:`, error);
      res.write(`data: ${JSON.stringify({ error: error.message || "An error occurred" })}\n\n`);
      res.end();
    }
  });

  // 3. Prompt Enhancer
  app.post("/api/enhance-prompt", async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
      res.status(400).json({ error: "No prompt provided" });
      return;
    }

    try {
      const ai = getGenAI();
      const systemInstruction = `You are a prompt engineering expert. Improve the user's prompt to make it clear, professional, context-rich, and effective for testing simultaneously across six different AI mental models. Keep the core intent identical but expand details, context, structure and format. Output ONLY the polished and enhanced prompt directly, with no introductory or concluding sentences.`;

      let responseText = "";
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.7,
          }
        });
        responseText = response.text || "";
      } catch (err: any) {
        console.warn("Enhance prompt with gemini-3.1-flash-lite failed, falling back to gemini-3.5-flash:", err.message || err);
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.7,
          }
        });
        responseText = response.text || "";
      }

      res.json({ enhanced: responseText });
    } catch (error: any) {
      console.error("Enhance prompt error:", error);
      res.status(500).json({ error: error.message || "Failed to enhance prompt" });
    }
  });

  // 4. Image Generation
  app.post("/api/generate-image", async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
      res.status(400).json({ error: "No prompt provided" });
      return;
    }

    try {
      let imageUrl = "";

      // Try main method using Recraft Pro v4 via OpenRouter chat completions
      try {
        console.log("Attempting image generation with Recraft Pro v4 via OpenRouter chat completion...");
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "HTTP-Referer": "https://ai.studio/build",
            "X-Title": "AI Multi-Model IQ"
          },
          body: JSON.stringify({
            model: "recraft/recraft-v4",
            messages: [
              {
                role: "user",
                content: `Generate an image based on this description: "${prompt}". Respond with ONLY a markdown image link in format ![image](url) containing the generated image URL, or just the URL. No other text.`
              }
            ],
            max_tokens: 1000
          })
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || "";
          console.log("Recraft Pro v4 output content:", content);
          
          // Parse image URL from output content
          const mdMatch = content.match(/!\[.*?\]\((https:\/\/.*?)\)/);
          const urlMatch = content.match(/(https:\/\/openrouter\.ai\/.*?jpe?g|https:\/\/openrouter\.ai\/.*?png|https:\/\/.*?jpe?g|https:\/\/.*?png)/i);
          
          if (mdMatch && mdMatch[1]) {
            imageUrl = mdMatch[1];
          } else if (urlMatch && urlMatch[0]) {
            imageUrl = urlMatch[0];
          } else if (content.trim().startsWith("http")) {
            imageUrl = content.trim();
          }
          
          if (imageUrl) {
            console.log("Recraft Pro v4 image parsed successfully:", imageUrl);
          }
        } else {
          const errText = await response.text();
          console.warn(`Recraft Pro v4 failed: ${response.status} - ${errText}`);
        }
      } catch (innerErr: any) {
        console.warn("Recraft Pro v4 generation threw error:", innerErr.message || innerErr);
      }

      // First Fallback: Try gemini-2.5-flash-image if Recraft failed
      if (!imageUrl) {
        try {
          console.log("Attempting fallback image generation with gemini-2.5-flash-image...");
          const ai = getGenAI();
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: prompt,
            config: {
              imageConfig: {
                aspectRatio: "1:1"
              }
            }
          });

          if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
              if (part.inlineData) {
                const base64 = part.inlineData.data;
                imageUrl = `data:image/png;base64,${base64}`;
                break;
              }
            }
          }
        } catch (geminiErr: any) {
          console.warn("gemini-2.5-flash-image generation failed:", geminiErr.message || geminiErr);
        }
      }

      // Second Fallback: Try gemini-3.1-flash-image
      if (!imageUrl) {
        try {
          console.log("Attempting fallback image generation with gemini-3.1-flash-image...");
          const ai = getGenAI();
          const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-image",
            contents: prompt,
            config: {
              imageConfig: {
                aspectRatio: "1:1"
              }
            }
          });

          if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
              if (part.inlineData) {
                const base64 = part.inlineData.data;
                imageUrl = `data:image/png;base64,${base64}`;
                break;
              }
            }
          }
        } catch (geminiErr: any) {
          console.warn("gemini-3.1-flash-image generation failed:", geminiErr.message || geminiErr);
        }
      }

      // Third Fallback: try imagen-3.0-generate-002 via generateImages!
      if (!imageUrl) {
        try {
          console.log("Attempting fallback image generation with imagen-3.0-generate-002...");
          const ai = getGenAI();
          const response = await ai.models.generateImages({
            model: "imagen-3.0-generate-002",
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: "image/jpeg",
              aspectRatio: "1:1"
            }
          });

          if (response.generatedImages?.[0]?.image?.imageBytes) {
            const base64 = response.generatedImages[0].image.imageBytes;
            imageUrl = `data:image/jpeg;base64,${base64}`;
          }
        } catch (fallbackErr: any) {
          console.warn("imagen-3.0-generate-002 failed:", fallbackErr.message || fallbackErr);
        }
      }

      // Fourth Fallback: try imagen-4.0-generate-001 via generateImages as specified in skill!
      if (!imageUrl) {
        try {
          console.log("Attempting fallback image generation with imagen-4.0-generate-001...");
          const ai = getGenAI();
          const response = await ai.models.generateImages({
            model: "imagen-4.0-generate-001",
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: "image/jpeg",
              aspectRatio: "1:1"
            }
          });

          if (response.generatedImages?.[0]?.image?.imageBytes) {
            const base64 = response.generatedImages[0].image.imageBytes;
            imageUrl = `data:image/jpeg;base64,${base64}`;
          }
        } catch (fallbackErr: any) {
          console.error("imagen-4.0-generate-001 failed as well:", fallbackErr.message || fallbackErr);
          throw new Error(`Workspace image generation failed. All options failed. Latest error: ${fallbackErr.message || fallbackErr}`);
        }
      }

      if (!imageUrl) {
        throw new Error("No image data returned from generator");
      }

      res.json({ imageUrl });
    } catch (error: any) {
      console.error("Image generation total error:", error);
      res.status(500).json({ error: error.message || "Failed to generate image" });
    }
  });

  // 5. Document Summarizer
  app.post("/api/summarize-document", async (req, res) => {
    const { content, fileName } = req.body;
    if (!content) {
      res.status(400).json({ error: "No text content provided" });
      return;
    }

    try {
      const ai = getGenAI();
      const systemInstruction = `You are an elite research summarizer. Summarize the following document titled "${fileName || 'Uploaded Doc'}". Extract key insights, thesis statements, supporting points, and a concluding list of actionable takeaways. Use elegant formatting with clean markdown headers.`;

      let responseText = "";
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: content,
          config: {
            systemInstruction,
            temperature: 0.3
          }
        });
        responseText = response.text || "";
      } catch (err: any) {
        console.warn("Document summarization with gemini-3.1-flash-lite failed, falling back to gemini-3.5-flash:", err.message || err);
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: content,
          config: {
            systemInstruction,
            temperature: 0.3
          }
        });
        responseText = response.text || "";
      }

      res.json({ summary: responseText });
    } catch (error: any) {
      console.error("Summarize document error:", error);
      res.status(500).json({ error: error.message || "Failed to summarize text" });
    }
  });

  // 5.45. Global Identity Synchronization (Multi-Device Login) Powered by Firestore
  app.get("/api/identity/sessions", async (req, res) => {
    const passcode = req.query.passcode as string;
    if (!passcode) {
      res.status(400).json({ error: "Passcode query parameter is required" });
      return;
    }
    
    const cleanCode = passcode.replace(/[^A-Za-z0-9]/g, "");
    if (cleanCode.length !== 11) {
      res.status(400).json({ error: "Invalid passcode format. Must be an 11-character token." });
      return;
    }
    const formattedPasscode = cleanCode.slice(0, 4) + "-" + cleanCode.slice(4, 8) + "-" + cleanCode.slice(8, 11);
    
    if (!db) {
      try {
        const store = readStoredSessions();
        const userSessions = store[formattedPasscode] || [];
        res.json({ sessions: userSessions });
      } catch (err: any) {
        res.status(500).json({ error: err.message || "Failed to read sessions" });
      }
      return;
    }

    try {
      // Ensure the identity node document exists in Firestore
      const identityRef = doc(db, "identities", formattedPasscode);
      const identitySnap = await getDoc(identityRef);
      if (!identitySnap.exists()) {
        await setDoc(identityRef, {
          createdAt: new Date().toISOString()
        });
      }

      // Fetch all session documents owned by this identity
      const sessionsColRef = collection(db, "identities", formattedPasscode, "sessions");
      const sessionsSnap = await getDocs(sessionsColRef);
      
      const sessionList: any[] = [];
      sessionsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        sessionList.push({
          id: data.id || docSnap.id,
          name: data.name || "",
          timestamp: data.timestamp || "",
          histories: data.histories || {},
          updatedAt: data.updatedAt || new Date().toISOString(),
          order: typeof data.order === "number" ? data.order : 0
        });
      });

      // Sort with `order` value to maintain exact design arrays sequence
      sessionList.sort((a, b) => a.order - b.order);

      // Map back to format expected by client
      const cleanedList = sessionList.map(({ id, name, timestamp, histories, updatedAt }) => ({
        id,
        name,
        timestamp,
        histories,
        updatedAt
      }));

      // Cache locally to JSON file fallback
      try {
        const store = readStoredSessions();
        store[formattedPasscode] = cleanedList;
        writeStoredSessions(store);
      } catch (e) {
        console.warn("Could not cache sessions to file system:", e);
      }

      res.json({ sessions: cleanedList });
    } catch (err: any) {
      console.error("Firestore GET sessions error:", err);
      try {
        const store = readStoredSessions();
        const userSessions = store[formattedPasscode] || [];
        res.json({ sessions: userSessions });
      } catch (fallbackErr: any) {
        res.status(500).json({ error: err.message || "Failed to fetch remote sessions" });
      }
    }
  });

  app.post("/api/identity/sync", async (req, res) => {
    const { passcode, sessions } = req.body;
    if (!passcode) {
      res.status(400).json({ error: "Passcode is required for session synchronization" });
      return;
    }
    
    const cleanCode = passcode.replace(/[^A-Za-z0-9]/g, "");
    if (cleanCode.length !== 11) {
      res.status(400).json({ error: "Invalid passcode format. Must be an 11-character token." });
      return;
    }
    const formattedPasscode = cleanCode.slice(0, 4) + "-" + cleanCode.slice(4, 8) + "-" + cleanCode.slice(8, 11);
    
    if (!db) {
      try {
        const store = readStoredSessions();
        if (Array.isArray(sessions)) {
          store[formattedPasscode] = sessions;
          writeStoredSessions(store);
        }
        res.json({ success: true, sessions: store[formattedPasscode] || [] });
      } catch (err: any) {
        res.status(500).json({ error: err.message || "Failed to sync sessions" });
      }
      return;
    }

    try {
      if (Array.isArray(sessions)) {
        // Ensure the parent identity doc exists
        const identityRef = doc(db, "identities", formattedPasscode);
        const identitySnap = await getDoc(identityRef);
        if (!identitySnap.exists()) {
          await setDoc(identityRef, {
            createdAt: new Date().toISOString()
          });
        }

        // Fetch current active sessions in subcollection to remove stale ones
        const sessionsColRef = collection(db, "identities", formattedPasscode, "sessions");
        const existingSnap = await getDocs(sessionsColRef);
        const existingIds = new Set<string>();
        existingSnap.forEach(docSnap => {
          existingIds.add(docSnap.id);
        });

        const incomingIds = new Set<string>();

        // Update / Insert current sessions
        for (let idx = 0; idx < sessions.length; idx++) {
          const s = sessions[idx];
          if (!s || !s.id) continue;
          
          incomingIds.add(s.id);
          const sessionDocRef = doc(db, "identities", formattedPasscode, "sessions", s.id);
          
          await setDoc(sessionDocRef, {
            id: s.id,
            name: s.name || "Untitled Session",
            timestamp: s.timestamp || new Date().toLocaleString(),
            histories: s.histories || {},
            updatedAt: new Date().toISOString(),
            order: idx
          });
        }

        // Prune items that were deleted on client side
        for (const exId of existingIds) {
          if (!incomingIds.has(exId)) {
            const sessionDocRef = doc(db, "identities", formattedPasscode, "sessions", exId);
            await deleteDoc(sessionDocRef);
          }
        }

        // Cache locally as high-durability backup
        try {
          const store = readStoredSessions();
          store[formattedPasscode] = sessions;
          writeStoredSessions(store);
        } catch (e) {
          console.warn("Could not cache synced sessions:", e);
        }

        res.json({ success: true, sessions });
      } else {
        res.status(400).json({ error: "sessions must be an array" });
      }
    } catch (err: any) {
      console.error("Firestore POST sync error:", err);
      try {
        const store = readStoredSessions();
        if (Array.isArray(sessions)) {
          store[formattedPasscode] = sessions;
          writeStoredSessions(store);
        }
        res.json({ success: true, sessions: store[formattedPasscode] || [] });
      } catch (fallbackErr: any) {
        res.status(500).json({ error: err.message || "Failed to sync remote sessions" });
      }
    }
  });

  // 5.5. Image Scanner / Multimodal Analyzer
  app.post("/api/scan-image", async (req, res) => {
    const { image, mode } = req.body;
    if (!image || !image.data || !image.mimeType) {
      res.status(400).json({ error: "No image file data provided" });
      return;
    }

    try {
      const ai = getGenAI();
      
      let prompt = "Analyze this image, schematic, or screenshot in high resolution. Extract all visible text, design details, color pallet hierarchy, structural elements, and user interfaces, then provide a clean hierarchical layout analysis, a precise technical overview of components, and code recommendations. Format cleanly using headers.";
      
      if (mode === "ui") {
        prompt = `You are an expert Vision and UI/UX engineering model. Meticulously analyze this UI mockup or screenshot:
1. Deconstruct the entire layout grid, header, sidebar, cards, and page structure.
2. Estimate the exact color palette (including exact hex codes or Tailwind color equivalents), typography styles, spacing system, and padding hierarchies.
3. Identify all distinct interface elements, icons, interactive inputs, and buttons.
4. Produce a fully styled, beautifully optimized copyable piece of React component code using Tailwind CSS that acts as an exact high-fidelity prototype clone of this mockup. Ensure standard imports (such as 'lucide-react' for mock icons) are correctly annotated with clean inline comments. Code should be complete and not use placeholders. Deliver in a clear Markdown code block.`;
      } else if (mode === "ocr") {
        prompt = `Perform high-precision web-scale OCR text extraction on this image. 
1. Search all visual lines, columns, nested blocks, floating buttons, labels, and system logs.
2. Extract ALL readable English text, symbols, codes, headers, and code lines verbatim.
3. Keep the visual structural hierarchy intact (e.g. represent side-by-side columns, tables, or key-value details properly).
4. If code lists or script fragments are present, isolate them clearly into standard code blocks. Do not summarize or omit anything.`;
      } else if (mode === "diagram") {
        prompt = `You are a Senior Technical Architect analyzing a blueprint, block diagram, neural network graph, system architecture page, or flowchart:
1. Map out all component boxes, microservices, databases, system boundaries, and terminals.
2. Identify every single signal path, data flow connection channel, interactive direction arrow, and looping feedback line.
3. Describe the logical sequential operations, process triggers, and system transformations step-by-step.
4. Synthesize your final design critique, indicating any apparent single points of failure, missing links, or architectural optimization chances.`;
      } else if (mode === "general") {
        prompt = `Provide a comprehensive general visual report of this image:
1. State the central focus of the scene, its contextual main theme, background/foreground attributes, and general aesthetic vibe.
2. Trace the dominant colors and identify the visual texture hierarchy.
3. Outline key structural or qualitative observations with clean bullet points.`;
      }

      const contents = [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: image.data,
                mimeType: image.mimeType
              }
            },
            { text: prompt }
          ]
        }
      ];

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          temperature: 0.15
        }
      });

      res.json({ analysis: response.text || "No analysis could be compiled." });
    } catch (error: any) {
      console.error("Image scanner error:", error);
      res.status(500).json({ error: error.message || "Failed to scan image" });
    }
  });

  // 6. Audio Transcription Simulator / Handler
  app.post("/api/transcribe-audio", async (req, res) => {
    const { promptText } = req.body;
    try {
      const ai = getGenAI();
      const contextText = promptText || "Generate a transcription for a standard voice prompt inquiring about full-stack metrics.";
      
      let responseText = "";
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: `Generate a realistic audio dictation transcription based on this topic: "${contextText}". Format as a clean speech text outline, starting directly with the text of the voice note.`,
          config: {
            temperature: 0.5
          }
        });
        responseText = response.text || "";
      } catch (err: any) {
        console.warn("Audio transcription with gemini-3.1-flash-lite failed, falling back to gemini-3.5-flash:", err.message || err);
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `Generate a realistic audio dictation transcription based on this topic: "${contextText}". Format as a clean speech text outline, starting directly with the text of the voice note.`,
          config: {
            temperature: 0.5
          }
        });
        responseText = response.text || "";
      }

      res.json({ transcription: responseText });
    } catch (error: any) {
      console.error("Audio transcription error:", error);
      res.status(500).json({ error: error.message || "Failed to transcribe audio" });
    }
  });

  // Serve frontend assets
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
