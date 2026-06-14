/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  Sparkles, 
  Trash2, 
  ArrowLeft, 
  Layers, 
  PenTool, 
  FileUp, 
  HelpCircle,
  Clock,
  Check,
  Cpu,
  Zap,
  Image as ImageIcon,
  BookOpen,
  Volume2,
  ChevronRight,
  Sparkle,
  Copy,
  Info,
  Sliders,
  Maximize2,
  X,
  Code,
  Terminal,
  Paperclip,
  Activity,
  Play
} from "lucide-react";
import { ModelInfo, ModelResponse, ChatMessage, StreamStatus, CustomWorkflow, ChatSession } from "../types";
import ModelCard from "./ModelCard";
import CelestialCanvas from "./CelestialCanvas";

const isValidBackendUrl = (url: string | null | undefined) => {
  if (!url) return false;
  const lower = url.trim().toLowerCase();
  if (lower === "" || lower.startsWith("capacitor:") || lower.startsWith("file:") || lower.includes("capacitor://")) {
    return false;
  }
  
  // If running inside Capacitor APK on a physical device or emulator, localhost is invalid as a backend API endpoint
  const isAPK = !!(window as any).Capacitor ||
    window.location.protocol === "capacitor:" ||
    window.location.protocol === "file:" ||
    window.location.origin?.includes("capacitor://");

  if (isAPK && (lower.includes("localhost") || lower.includes("127.0.0.1"))) {
    return false;
  }
  return true;
};

const getDevAndPreprodUrls = () => {
  const buildUrl = (import.meta as any).env?.VITE_APP_URL || "";
  let devUrl = buildUrl;
  let preUrl = buildUrl;

  if (buildUrl.includes("-dev-")) {
    preUrl = buildUrl.replace("-dev-", "-pre-");
  } else if (buildUrl.includes("-pre-")) {
    devUrl = buildUrl.replace("-pre-", "-dev-");
  } else {
    devUrl = "https://ais-dev-ra264x7mdtb5iaswuisgi5-53067259193.asia-east1.run.app";
    preUrl = "https://ais-pre-ra264x7mdtb5iaswuisgi5-53067259193.asia-east1.run.app";
  }
  return { devUrl, preUrl };
};

const getApiUrl = (endpoint: string) => {
  const isLocalWebview = 
    !!(window as any).Capacitor ||
    window.location.protocol === "capacitor:" || 
    window.location.protocol === "file:" ||
    window.location.origin?.includes("capacitor://");

  // Priority 1: VITE_BACKEND_URL environment variable (preset at compile-time/hosting dashboard)
  const envBackendUrl = (import.meta as any).env?.VITE_BACKEND_URL;
  if (envBackendUrl && isValidBackendUrl(envBackendUrl)) {
    return `${envBackendUrl.trim().replace(/\/$/, "")}${endpoint}`;
  }

  // Priority 2: Stored custom URL (e.g. if configured manually on static host)
  const storedUrl = localStorage.getItem("mai_backend_url");
  if (isValidBackendUrl(storedUrl)) {
    if (isLocalWebview || storedUrl?.trim() !== window.location.origin) {
      return `${storedUrl!.trim().replace(/\/$/, "")}${endpoint}`;
    }
  }

  if (isLocalWebview) {
    const { devUrl } = getDevAndPreprodUrls();
    // Default fallback to the main active development server
    localStorage.setItem("mai_backend_url", devUrl);
    return `${devUrl.replace(/\/$/, "")}${endpoint}`;
  }

  // Under normal browser environment, default to Relative path
  return endpoint;
};

const getGridColsClass = (count: number) => {
  if (count === 1) return "grid-cols-1 max-w-2xl mx-auto";
  if (count === 2) return "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto";
  return "grid-cols-1 md:grid-cols-3 gap-6";
};

interface WorkspaceProps {
  onBack: () => void;
  models: ModelInfo[];
  isCodeModeActive: boolean;
  setIsCodeModeActive: (val: boolean) => void;
  userPasscode: string;
  setUserPasscode: (val: string) => void;
}

const customWorkflows: CustomWorkflow[] = [
  {
    id: "none",
    name: "General Workspace",
    icon: "Layers",
    promptPrefix: "",
    description: "Standard model orchestration without predefined system constraints."
  },
  {
    id: "developer",
    name: "Technical/Developer Suite",
    icon: "PenTool",
    promptPrefix: "Provide a highly modular, clean, and production-ready code design, optimizing for execution efficiency, rigorous error guards, and performance bottlenecks: ",
    description: "Focuses response structures specifically on software architecture and high scalability."
  },
  {
    id: "creative",
    name: "Creative/Narrative Studio",
    icon: "Sparkle",
    promptPrefix: "Craft a deeply creative, elegant, prose-driven narrative output with vivid sensory descriptions and engaging structure: ",
    description: "Tailored specifically for branding, copy, storytelling, and copy editing."
  },
  {
    id: "socratic",
    name: "Socratic Educator",
    icon: "BookOpen",
    promptPrefix: "Explain the concept comprehensively using a Socratic teaching format. Challenge assumptions, give concrete analogical examples, and outline logical deductions: ",
    description: "Ideal for deep-concept assimilation and analytical debugging."
  }
];

export default function Workspace({ 
  onBack, 
  models, 
  isCodeModeActive, 
  setIsCodeModeActive,
  userPasscode,
  setUserPasscode
}: WorkspaceProps) {
  const [promptInput, setPromptInput] = useState("");
  const [activeWorkflowId, setActiveWorkflowId] = useState("none");
  const [enhancing, setEnhancing] = useState(false);
  // Sessions & Database state management
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");

  // Master Code Synthesizer and Swarm Consensus States
  const [isMasterCodeModeActive, setIsMasterCodeModeActive] = useState<boolean>(() => {
    return localStorage.getItem("mai_master_mode_active") === "true";
  });
  const [feedingLevel, setFeedingLevel] = useState<number>(10);
  const [consensusTopic, setConsensusTopic] = useState("Build an unthrottled WebAssembly-driven virtual physics simulation in TypeScript");
  const [consensusStatus, setConsensusStatus] = useState<"idle" | "conversing" | "fusing" | "completed" | "error">("idle");
  const [activeSpeaker, setActiveSpeaker] = useState<string>("");
  const [consensusLogs, setConsensusLogs] = useState<Array<{ modelId: string; modelName: string; content: string; key: number }>>([]);
  const [consensusFinalResult, setConsensusFinalResult] = useState<string>("");

  useEffect(() => {
    localStorage.setItem("mai_master_mode_active", String(isMasterCodeModeActive));
  }, [isMasterCodeModeActive]);

  useEffect(() => {
    if (isCodeModeActive) {
      setConsensusTopic("Build an unthrottled WebAssembly-driven virtual physics simulation in TypeScript");
    } else {
      setConsensusTopic("Analyze the geopolitical, economic, and systemic implications of asteroid helium-3 mining on Earth's energy markets");
    }
  }, [isCodeModeActive]);

  const handleRunSwarmConsensus = async () => {
    const topic = consensusTopic.trim();
    if (!topic) return;

    setConsensusStatus("conversing");
    setConsensusLogs([]);
    setConsensusFinalResult("");

    // Identify up to 12 models to represent conversational fleet (excluding deep synthesis models if needed, but standard active models work)
    const talkers = activeModels.filter(m => m.id !== "claude-fable-5").slice(0, 12);
    const fallbackTalkers = models.filter(m => m.id !== "claude-fable-5").slice(0, 12);
    const finalTalkers = talkers.length > 0 ? talkers : fallbackTalkers;

    const accumulatedLogs: Array<{ modelId: string; modelName: string; content: string; key: number }> = [];

    // Round-by-round calls
    for (let index = 0; index < finalTalkers.length; index++) {
      const model = finalTalkers[index];
      setActiveSpeaker(model.id);

      // Build context of previous speakers based on active subjects (code vs other subjects)
      let contextPrompt = "";
      if (index === 0) {
        if (isCodeModeActive) {
          contextPrompt = `We are staging high-level scientific debate and cooperative code engineering inside a sandboxed mainframe. 
Please provide your direct technical perspective and solution regarding the topic: "${topic}". 
Structure your answer beautifully with pseudo-code blocks, logic diagrams, or implementation frameworks. Provide an exceptionally detailed, comprehensive, and exhaustive response. Do not prioritize briefness or summaries; expand on every technical edge case, design choice, and architectural layer. Length is of no concern—maximize your output with technical depth.`;
        } else {
          contextPrompt = `We are staging an elite multi-model collaborative seminar and scholarly intellectual debate. 
Please provide your direct academic, strategic, analytical response regarding the topic: "${topic}". 
Structure your answer beautifully with logical frameworks, numbered core insights, or analytical briefs. Provide an exceptionally detailed, rigorous, and highly exhaustive response. Do not prioritize briefness or summaries; cover every geopolitical, economic, and strategic axis. Length is of no concern—maximize your output with dense analytical depth.`;
        }
      } else {
        const previousContext = accumulatedLogs.map(log => `Perspective from ${log.modelName}:\n"${log.content}"`).join("\n\n");
        if (isCodeModeActive) {
          contextPrompt = `We are debating the topic: "${topic}". 
Here is/are the arguments presented by previous nodes in our fleet:
${previousContext}

Analyze prior assertions thoroughly, point out precise omissions or architectural vulnerabilities, debate alternative implementations or algorithmic selections, and provide your own highly specialized, detailed solution block. Deliver a very comprehensive, long-form contribution with complete technical breakdowns and code structures. Length is of no concern—maximize your output with technical depth.`;
        } else {
          contextPrompt = `We are debating the academic/strategic topic: "${topic}". 
Here are the assertions and arguments presented by previous seminar thinkers:
${previousContext}

Review their proposals meticulously, challenge logical blindspots, debate specific points of contention, build upon or systematically refine their academic frameworks, and deliver your own highly advanced, detailed, and unconstrained analytical brief. Be as verbose, thorough, and analytical as possible. Length is of no concern—maximize your output with analytical depth.`;
        }
      }

      try {
        const response = await fetch(getApiUrl("/api/chat"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            modelId: model.id,
            prompt: contextPrompt,
            history: []
          })
        });

        if (!response.ok) {
          throw new Error(`Consensus failed for model ${model.name}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder("utf-8");
        if (!reader) throw new Error("Stream body unreadable");

        let currentResult = "";
        let buffer = "";

        // Push initial log placeholder
        accumulatedLogs.push({
          modelId: model.id,
          modelName: model.name,
          content: "Initiating transmission stream...",
          key: index
        });
        setConsensusLogs([...accumulatedLogs]);

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ") && trimmed !== "data: [DONE]") {
              try {
                const parsed = JSON.parse(trimmed.slice(6));
                if (parsed.text) {
                  currentResult += parsed.text;
                  accumulatedLogs[index] = {
                    modelId: model.id,
                    modelName: model.name,
                    content: currentResult,
                    key: index
                  };
                  setConsensusLogs([...accumulatedLogs]);
                }
              } catch (e) {}
            }
          }
        }
      } catch (err) {
        console.error(`Error in swarm segment:`, err);
        accumulatedLogs[index] = {
          modelId: model.id,
          modelName: model.name,
          content: `*[Node System offline or communication line severed. Skipping block...]*`,
          key: index
        };
        setConsensusLogs([...accumulatedLogs]);
      }
    }

    // Step 2: Final synthesis by Claude Fable 5!
    setConsensusStatus("fusing");
    setActiveSpeaker("claude-fable-5");

    try {
      const summaryContext = accumulatedLogs.map(log => `--- ${log.modelName} argument ---\n${log.content}\n`).join("\n");
      const fablePrompt = isCodeModeActive 
        ? `You are Claude Fable 5, the absolute master code synthesizer. Evaluate the multi-agent consensus regarding: "${topic}".
To clarify, our core model fleet has completed an intensive technical debate:
${summaryContext}

Review their assertions carefully, consolidate all code features, reconcile any architectural points of tension, and engineer the ultimate final master-class software solution or analytical result. Provide an exceptionally long-form, deeply annotated, production-ready code implementation and architectural roadmap. Do not summarize or emit high-level abstractions—write every helper function, write extensive inline documentation, and expand fully on every complexity. Length is of no concern—maximize structural and detailed density.`
        : `You are Claude Fable 5, the absolute master consensus synthesizer. Evaluate the multi-agent debate regarding: "${topic}".
To clarify, our core model fleet has completed an intensive seminar debate:
${summaryContext}

Review their assertions meticulously, consolidate all contrasting viewpoints, reconcile opposing analytical frameworks, and synthesize the ultimate comprehensive, highly authoritative, master-class analytical brief, strategy paper, or essay. Deliver the most detailed, elegant, and deeply articulated written synthesis possible. Explore every nuance, expand on every geopolitical/economic argument, and write an exhaustive, encyclopedic consensus document of unlimited length. Speak as the ultimate expert supervisor.`;

      const response = await fetch(getApiUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: "claude-fable-5", // Will trigger Claude 3.5 Sonnet free / custom inbackend
          prompt: fablePrompt,
          history: []
        })
      });

      if (!response.ok) {
        throw new Error("Master model synthesis failed");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      if (!reader) throw new Error("Master body unreadable");

      let finalResultText = "";
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ") && trimmed !== "data: [DONE]") {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              if (parsed.text) {
                finalResultText += parsed.text;
                setConsensusFinalResult(finalResultText);
              }
            } catch (e) {}
          }
        }
      }
      setConsensusStatus("completed");
    } catch (err: any) {
      console.error(`Master synthesis failure:`, err);
      setConsensusFinalResult(`*[Synthesis interrupted: ${err.message || String(err)}]*`);
      setConsensusStatus("error");
    }
  };

  const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>(() => {
    try {
      const passcode = localStorage.getItem("mas_user_passcode") || "";
      if (passcode) {
        // First check for multi-sessions database
        const stored = localStorage.getItem(`mas_sessions_${passcode}`);
        if (stored) {
          const loadedSessions: ChatSession[] = JSON.parse(stored);
          if (loadedSessions && loadedSessions.length > 0) {
            return loadedSessions[0].histories;
          }
        }
        // Legacy fallback
        const d = localStorage.getItem(`mas_history_${passcode}`);
        if (d) {
          return JSON.parse(d);
        }
      }
    } catch (e) {
      console.warn("Could not parse passcode history, falling back to clean slate", e);
    }
    const initial: Record<string, ChatMessage[]> = {};
    models.forEach(m => {
      initial[m.id] = [];
    });
    return initial;
  });

  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("synced");

  const syncSessionsToServer = async (passcode: string, rawSessions: ChatSession[]) => {
    if (!passcode) return;
    setSyncStatus("syncing");
    try {
      const response = await fetch("/api/identity/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode, sessions: rawSessions })
      });
      if (response.ok) {
        setSyncStatus("synced");
      } else {
        setSyncStatus("error");
      }
    } catch (e) {
      console.warn("Network error syncing sessions:", e);
      setSyncStatus("error");
    }
  };

  // Automatically migrate active guest chat and swap to the target passcode identity
  const syncAndSwitchIdentity = (newPasscodeDigits: string) => {
    const cleanCode = newPasscodeDigits.replace(/[^A-Za-z0-9]/g, "");
    if (cleanCode.length !== 11) return null;

    const formattedVal = cleanCode.slice(0, 4) + "-" + cleanCode.slice(4, 8) + "-" + cleanCode.slice(8, 11);
    
    // Check if we have active chat histories to preserve
    const hasActualMessages = Object.keys(chatHistories || {}).some(key => (chatHistories[key]?.length || 0) > 0);
    
    if (hasActualMessages) {
      let tarSessions: ChatSession[] = [];
      try {
        const stored = localStorage.getItem(`mas_sessions_${formattedVal}`);
        if (stored) {
          tarSessions = JSON.parse(stored);
        }
      } catch (e) {
        console.error("Failed to parse targets on switch", e);
      }

      const activeSession = sessions.find(s => s.id === currentSessionId);
      const sessionName = activeSession?.name || `Synced Session (${new Date().toLocaleDateString()})`;

      const exIdx = tarSessions.findIndex(s => s.id === currentSessionId);
      if (exIdx >= 0) {
        tarSessions[exIdx] = {
          ...tarSessions[exIdx],
          histories: chatHistories,
          timestamp: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        };
      } else {
        tarSessions.unshift({
          id: currentSessionId || ("session_" + Date.now()),
          name: sessionName,
          timestamp: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          histories: chatHistories
        });
      }
      localStorage.setItem(`mas_sessions_${formattedVal}`, JSON.stringify(tarSessions));
      localStorage.setItem(`mas_history_${formattedVal}`, JSON.stringify(chatHistories));
      
      // Sync it to the server immediately
      syncSessionsToServer(formattedVal, tarSessions);
    }

    // Move to the new passcode identity
    setUserPasscode(formattedVal);
    localStorage.setItem("mas_user_passcode", formattedVal);
    return formattedVal;
  };

  // Load and migrates sessions when passcode updates reactively
  useEffect(() => {
    if (!userPasscode) return;
    
    // We should ALSO load from the server to pull any remote updates!
    const fetchRemoteSessions = async () => {
      try {
        const response = await fetch(`/api/identity/sessions?passcode=${encodeURIComponent(userPasscode)}`);
        if (response.ok) {
          const data = await response.json();
          if (data && Array.isArray(data.sessions) && data.sessions.length > 0) {
            setSessions(data.sessions);
            localStorage.setItem(`mas_sessions_${userPasscode}`, JSON.stringify(data.sessions));
            const active = data.sessions[0];
            setCurrentSessionId(active.id);
            setChatHistories(active.histories);
            
            // Sync board responses:
            const freshResponses: Record<string, ModelResponse> = {};
            models.forEach(m => {
              const hist = active.histories[m.id] || [];
              if (hist.length > 0) {
                const lastMsg = hist[hist.length - 1];
                freshResponses[m.id] = {
                  modelId: m.id,
                  content: lastMsg.role === "assistant" ? lastMsg.content : "",
                  status: lastMsg.role === "assistant" ? "completed" : "idle"
                };
              } else {
                freshResponses[m.id] = { modelId: m.id, content: "", status: "idle" };
              }
            });
            setResponses(freshResponses);
            return; // Finished loaded session integration
          }
        }
      } catch (err) {
        console.warn("Server connection offline or loading error - utilizing offline-cache database:", err);
      }
      
      // Fallback offline loader logic
      let loadedSessions: ChatSession[] = [];
      try {
        const stored = localStorage.getItem(`mas_sessions_${userPasscode}`);
        if (stored) {
          loadedSessions = JSON.parse(stored);
        }
      } catch (e) {
        console.error("Failed to parse sessions:", e);
      }

      if (loadedSessions.length === 0) {
        let migrationHistory: Record<string, ChatMessage[]> | null = null;
        try {
          const legacy = localStorage.getItem(`mas_history_${userPasscode}`);
          if (legacy) {
            migrationHistory = JSON.parse(legacy);
          }
        } catch (e) {}

        const initialHistory: Record<string, ChatMessage[]> = {};
        models.forEach(m => {
          initialHistory[m.id] = (migrationHistory && migrationHistory[m.id]) || [];
        });

        let hasMessages = false;
        let firstName = "Default Session";
        for (const key in initialHistory) {
          if (initialHistory[key].length > 0) {
            hasMessages = true;
            const firstUserMsg = initialHistory[key].find(m => m.role === "user");
            if (firstUserMsg) {
              firstName = firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? "..." : "");
            }
            break;
          }
        }

        loadedSessions = [{
          id: "session_" + Date.now(),
          name: firstName,
          timestamp: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          histories: initialHistory
        }];
        localStorage.setItem(`mas_sessions_${userPasscode}`, JSON.stringify(loadedSessions));
      }

      setSessions(loadedSessions);
      
      const active = loadedSessions[0];
      setCurrentSessionId(active.id);
      setChatHistories(active.histories);

      const freshResponses: Record<string, ModelResponse> = {};
      models.forEach(m => {
        const hist = active.histories[m.id] || [];
        if (hist.length > 0) {
          const lastMsg = hist[hist.length - 1];
          freshResponses[m.id] = {
            modelId: m.id,
            content: lastMsg.role === "assistant" ? lastMsg.content : "",
            status: lastMsg.role === "assistant" ? "completed" : "idle"
          };
        } else {
          freshResponses[m.id] = { modelId: m.id, content: "", status: "idle" };
        }
      });
      setResponses(freshResponses);
    };

    fetchRemoteSessions();
  }, [userPasscode]);

  // Persists active session changes immediately to storage
  useEffect(() => {
    if (!userPasscode || !currentSessionId || sessions.length === 0) return;

    const activeSession = sessions.find(s => s.id === currentSessionId);
    if (!activeSession) return;

    const isDifferent = JSON.stringify(activeSession.histories) !== JSON.stringify(chatHistories);
    if (!isDifferent) return;

    let updatedName = activeSession.name;
    if (activeSession.name === "Default Session" || activeSession.name.startsWith("Session -")) {
      for (const mId in chatHistories) {
        const userMsg = chatHistories[mId].find(msg => msg.role === "user");
        if (userMsg) {
          updatedName = userMsg.content.slice(0, 30) + (userMsg.content.length > 30 ? "..." : "");
          break;
        }
      }
    }

    const updatedSessions = sessions.map(s => {
      if (s.id === currentSessionId) {
        return {
          ...s,
          name: updatedName,
          histories: chatHistories
        };
      }
      return s;
    });

    setSessions(updatedSessions);
    localStorage.setItem(`mas_sessions_${userPasscode}`, JSON.stringify(updatedSessions));
    localStorage.setItem(`mas_history_${userPasscode}`, JSON.stringify(chatHistories));
  }, [chatHistories, currentSessionId, userPasscode]);

  // Synchronize any global session array updates to the server database
  useEffect(() => {
    if (!userPasscode || sessions.length === 0) return;
    const debounceTimer = setTimeout(() => {
      syncSessionsToServer(userPasscode, sessions);
    }, 1500); // 1.5 seconds debounce to prevent high-frequency write operations during stream/rapid typing
    return () => clearTimeout(debounceTimer);
  }, [sessions, userPasscode]);

  // Session Action handlers
  const handleSelectSession = (sessionId: string) => {
    const targetSession = sessions.find(s => s.id === sessionId);
    if (!targetSession) return;

    setCurrentSessionId(sessionId);
    setChatHistories(targetSession.histories);

    const freshResponses: Record<string, ModelResponse> = {};
    models.forEach(m => {
      const hist = targetSession.histories[m.id] || [];
      if (hist.length > 0) {
        const lastMsg = hist[hist.length - 1];
        freshResponses[m.id] = {
          modelId: m.id,
          content: lastMsg.role === "assistant" ? lastMsg.content : "",
          status: lastMsg.role === "assistant" ? "completed" : "idle"
        };
      } else {
        freshResponses[m.id] = { modelId: m.id, content: "", status: "idle" };
      }
    });
    setResponses(freshResponses);
  };

  const handleCreateNewSession = () => {
    const timestampStr = new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const newSessionId = "session_" + Date.now();
    
    const initialHistory: Record<string, ChatMessage[]> = {};
    models.forEach(m => {
      initialHistory[m.id] = [];
    });

    const newSession: ChatSession = {
      id: newSessionId,
      name: "Default Session",
      timestamp: timestampStr,
      histories: initialHistory
    };

    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);
    setCurrentSessionId(newSessionId);
    setChatHistories(initialHistory);
    localStorage.setItem(`mas_sessions_${userPasscode}`, JSON.stringify(updatedSessions));

    const freshResponses: Record<string, ModelResponse> = {};
    models.forEach(m => {
      freshResponses[m.id] = { modelId: m.id, content: "", status: "idle" };
    });
    setResponses(freshResponses);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (sessions.length <= 1) {
      alert("You must keep at least one active chat session.");
      return;
    }

    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(updatedSessions);
    localStorage.setItem(`mas_sessions_${userPasscode}`, JSON.stringify(updatedSessions));

    if (currentSessionId === sessionId) {
      const nextActive = updatedSessions[0];
      setCurrentSessionId(nextActive.id);
      setChatHistories(nextActive.histories);

      const freshResponses: Record<string, ModelResponse> = {};
      models.forEach(m => {
        const hist = nextActive.histories[m.id] || [];
        if (hist.length > 0) {
          const lastMsg = hist[hist.length - 1];
          freshResponses[m.id] = {
            modelId: m.id,
            content: lastMsg.role === "assistant" ? lastMsg.content : "",
            status: lastMsg.role === "assistant" ? "completed" : "idle"
          };
        } else {
          freshResponses[m.id] = { modelId: m.id, content: "", status: "idle" };
        }
      });
      setResponses(freshResponses);
    }
  };

  const handleRenameSession = (sessionId: string, newName: string) => {
    if (!newName.trim()) return;
    const updatedSessions = sessions.map(s => {
      if (s.id === sessionId) {
        return { ...s, name: newName.trim() };
      }
      return s;
    });
    setSessions(updatedSessions);
    localStorage.setItem(`mas_sessions_${userPasscode}`, JSON.stringify(updatedSessions));
  };

  // Response tracker for each model
  const [responses, setResponses] = useState<Record<string, ModelResponse>>(() => {
    const initial: Record<string, ModelResponse> = {};
    models.forEach(m => {
      initial[m.id] = { modelId: m.id, content: "", status: "idle" };
    });
    return initial;
  });

  // Dynamic status tabs
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"workflows" | "code" | "image" | "document" | "audio" | "vfx" | "history">("workflows");
  const [vfxSubTab, setVfxSubTab] = useState<"specs" | "overrides">("specs");
  const [activePillar, setActivePillar] = useState<number>(1);

  // Technical VFX & Animation Engine override states (Senior VFX Supervisor Console)
  const [vfxFpsCap, setVfxFpsCap] = useState<number>(() => {
    return Number(localStorage.getItem("mai_vfx_fps") || "120");
  });
  const [vfxTrailWidth, setVfxTrailWidth] = useState<number>(() => {
    return Number(localStorage.getItem("mai_vfx_trail_width") || "7");
  });
  const [vfxTrailLength, setVfxTrailLength] = useState<number>(() => {
    return Number(localStorage.getItem("mai_vfx_trail_length") || "20");
  });
  const [vfxLatticeDist, setVfxLatticeDist] = useState<number>(() => {
    return Number(localStorage.getItem("mai_vfx_lattice_dist") || "120");
  });
  const [vfxParticleCount, setVfxParticleCount] = useState<number>(() => {
    return Number(localStorage.getItem("mai_vfx_particle_count") || "40");
  });
  const [vfxShaderMode, setVfxShaderMode] = useState<string>(() => {
    return localStorage.getItem("mai_vfx_shader_mode") || "path-traced";
  });
  const [vfxPhysicsFriction, setVfxPhysicsFriction] = useState<number>(() => {
    return Number(localStorage.getItem("mai_vfx_friction") || "0.96");
  });
  const [vfxAberration, setVfxAberration] = useState<number>(() => {
    return Number(localStorage.getItem("mai_vfx_aberration") || "3");
  });
  const [vfxBloomGlow, setVfxBloomGlow] = useState<number>(() => {
    return Number(localStorage.getItem("mai_vfx_bloom") || "15");
  });
  const [vfxColorPreset, setVfxColorPreset] = useState<string>(() => {
    return localStorage.getItem("mai_vfx_color_preset") || "stellar-orbit";
  });
  const [vfxSoundEnabled, setVfxSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem("mai_vfx_sound_enabled") !== "false";
  });

  // Keep saved configuration values updated
  useEffect(() => {
    localStorage.setItem("mai_vfx_fps", String(vfxFpsCap));
    localStorage.setItem("mai_vfx_trail_width", String(vfxTrailWidth));
    localStorage.setItem("mai_vfx_trail_length", String(vfxTrailLength));
    localStorage.setItem("mai_vfx_lattice_dist", String(vfxLatticeDist));
    localStorage.setItem("mai_vfx_particle_count", String(vfxParticleCount));
    localStorage.setItem("mai_vfx_shader_mode", vfxShaderMode);
    localStorage.setItem("mai_vfx_friction", String(vfxPhysicsFriction));
    localStorage.setItem("mai_vfx_aberration", String(vfxAberration));
    localStorage.setItem("mai_vfx_bloom", String(vfxBloomGlow));
    localStorage.setItem("mai_vfx_color_preset", vfxColorPreset);
    localStorage.setItem("mai_vfx_sound_enabled", String(vfxSoundEnabled));
  }, [
    vfxFpsCap,
    vfxTrailWidth,
    vfxTrailLength,
    vfxLatticeDist,
    vfxParticleCount,
    vfxShaderMode,
    vfxPhysicsFriction,
    vfxAberration,
    vfxBloomGlow,
    vfxColorPreset,
    vfxSoundEnabled
  ]);

  // Synchronize active sidebar tab with global programmer mode
  useEffect(() => {
    if (isCodeModeActive) {
      setActiveTab("code");
    } else {
      setActiveTab("workflows");
    }
  }, [isCodeModeActive]);

  // Specific Code Module Collaborative Synthesis states
  const [codePromptInput, setCodePromptInput] = useState("");
  const [compositeState, setCompositeState] = useState<"idle" | "synthesis-fleet" | "claude-refining" | "completed" | "error">("idle");
  const [fleetOutputs, setFleetOutputs] = useState<Record<string, string>>({});
  const [fleetLoading, setFleetLoading] = useState<Record<string, "idle" | "running" | "done" | "failed">>({});
  const [claudeUnifiedResult, setClaudeUnifiedResult] = useState("");
  const [claudeLoading, setClaudeLoading] = useState(false);
  const [codeError, setCodeError] = useState("");

  // Mobile Layout Configuration states
  const [isMobile, setIsMobile] = useState(false);
  const [mobileLayout, setMobileLayout] = useState<"stack" | "tabs" | "split">("stack");
  const [selectedMobileModelId, setSelectedMobileModelId] = useState("deepseek-r1");
  const [splitModelId1, setSplitModelId1] = useState("deepseek-r1");
  const [splitModelId2, setSplitModelId2] = useState("qwen-coder");

  // Dynamic Real-time Engine Telemetry State
  const [telemetryFps, setTelemetryFps] = useState<number>(120);
  const [telemetryVram, setTelemetryVram] = useState<number>(34.2);
  const [telemetryPath, setTelemetryPath] = useState<string>("M 0,10 L 100,10");

  useEffect(() => {
    let tickCount = 0;
    const interval = setInterval(() => {
      const baseFps = vfxFpsCap === 999 ? 240 : vfxFpsCap;
      const jitter = (Math.random() * 0.8 - 0.4);
      setTelemetryFps(parseFloat((baseFps + jitter).toFixed(1)));

      setTelemetryVram(prev => {
        const next = prev + (Math.random() * 0.12 - 0.05);
        if (next > 38.0 || next < 31.0) return 34.18;
        return parseFloat(next.toFixed(2));
      });

      tickCount++;
      const points = [];
      const steps = 15;
      for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * 100;
        const wave1 = Math.sin((i * 0.5) + (tickCount * 0.45)) * 4.5;
        const wave2 = Math.cos((i * 0.22) - (tickCount * 0.3)) * 2.5;
        const noise = (Math.random() * 1.6 - 0.8);
        const y = 10 + wave1 + wave2 + noise;
        points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`);
      }
      setTelemetryPath(points.join(" "));
    }, 280);

    return () => clearInterval(interval);
  }, [vfxFpsCap]);

  // Model Select System
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("mai_selected_models");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return ["deepseek-r1", "qwen-coder", "llama-3-3", "gpt-4-5", "phi-4", "command-r-plus"];
  });

  const [layoutMode, setLayoutMode] = useState<"grid" | "side-by-side">("grid");
  const [responseMode, setResponseMode] = useState<"latest" | "history">("latest");

  // Guard changes to save to localStorage
  useEffect(() => {
    localStorage.setItem("mai_selected_models", JSON.stringify(selectedModelIds));
  }, [selectedModelIds]);

  const activeModels = models.filter(m => selectedModelIds.includes(m.id));

  // Synchronize mobile selected/split models with active models
  useEffect(() => {
    if (activeModels.length > 0) {
      if (!selectedModelIds.includes(selectedMobileModelId)) {
        setSelectedMobileModelId(activeModels[0].id);
      }
      if (!selectedModelIds.includes(splitModelId1)) {
        const found = activeModels.find(m => m.id !== splitModelId2);
        if (found) {
          setSplitModelId1(found.id);
        } else {
          setSplitModelId1(activeModels[0].id);
        }
      }
      if (!selectedModelIds.includes(splitModelId2)) {
        const found = activeModels.find(m => m.id !== splitModelId1);
        if (found) {
          setSplitModelId2(found.id);
        } else {
          setSplitModelId2(activeModels[1]?.id || activeModels[0].id);
        }
      }
    }
  }, [selectedModelIds, activeModels, selectedMobileModelId, splitModelId1, splitModelId2]);

  // Hook to handle mobile detection state and set layout
  useEffect(() => {
    const checkMobile = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      // In landscape, only force mobile single-column layout if screen width is extremely small (< 640),
      // otherwise, let it span out in horizontal comparison decks.
      const mobile = isLandscape ? window.innerWidth < 640 : window.innerWidth < 1024;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Image generator states
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatedImg, setGeneratedImg] = useState("");
  const [imgRunning, setImgRunning] = useState(false);
  const [imgError, setImgError] = useState("");
  const [imageSubTab, setImageSubTab] = useState<"generate" | "scan">("generate");

  // Document summarizer states
  const [docModelInput, setDocModelInput] = useState("");
  const [summaryOutput, setSummaryOutput] = useState("");
  const [summaryRunning, setSummaryRunning] = useState(false);
  const [docFileName, setDocFileName] = useState("");

  // Audio simulator transcription states
  const [audioTopicInput, setAudioTopicInput] = useState("");
  const [transcribedText, setTranscribedText] = useState("");
  const [audioRunning, setAudioRunning] = useState(false);

  // Attachment state for the main chat view
  const [activeAttachment, setActiveAttachment] = useState<{
    data: string; // Base64 representation
    mimeType: string;
    name: string;
    previewUrl: string;
  } | null>(null);

  // Attachment state for the Toolbox Vision Scanner page
  const [scanAttachment, setScanAttachment] = useState<{
    data: string;
    mimeType: string;
    name: string;
    previewUrl: string;
  } | null>(null);
  const [scanResult, setScanResult] = useState("");
  const [scanRunning, setScanRunning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [scanMode, setScanMode] = useState<"general" | "ui" | "ocr" | "diagram">("general");

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>, isForScanner: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPG, WebP) only.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(",")[1];
      const attachment = {
        data: base64String,
        mimeType: file.type,
        name: file.name,
        previewUrl: URL.createObjectURL(file)
      };

      if (isForScanner) {
        setScanAttachment(attachment);
        setScanResult("");
        setScanError("");
      } else {
        setActiveAttachment(attachment);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleScanImage = async () => {
    if (!scanAttachment) return;

    setScanRunning(true);
    setScanResult("");
    setScanError("");

    try {
      const response = await fetch("/api/scan-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: {
            data: scanAttachment.data,
            mimeType: scanAttachment.mimeType
          },
          mode: scanMode
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to scan image.");
      }

      setScanResult(data.analysis);
    } catch (err: any) {
      console.error(err);
      setScanError(err.message || "An unexpected error occurred during scan process.");
    } finally {
      setScanRunning(false);
    }
  };

  // Dynamic API server sync states
  const [backendUrl, setBackendUrl] = useState(() => {
    const isLocalWebview = 
      !!(window as any).Capacitor ||
      window.location.protocol === "capacitor:" || 
      window.location.protocol === "file:" ||
      window.location.origin?.includes("capacitor://");

    const envBackendUrl = (import.meta as any).env?.VITE_BACKEND_URL;
    if (envBackendUrl && isValidBackendUrl(envBackendUrl)) {
      return envBackendUrl.trim();
    }

    const stored = localStorage.getItem("mai_backend_url");
    if (isValidBackendUrl(stored)) {
      return stored!;
    }

    if (isLocalWebview) {
      const { devUrl } = getDevAndPreprodUrls();
      localStorage.setItem("mai_backend_url", devUrl);
      return devUrl;
    }
    return window.location.origin || "";
  });
  const [serverStatus, setServerStatus] = useState<"checking" | "online" | "offline">("checking");
  const [showConfig, setShowConfig] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState(backendUrl);

  // Automatically save browser's active location on initialization only if no valid backend is configured
  useEffect(() => {
    const isLocalWebview = 
      !!(window as any).Capacitor ||
      window.location.protocol === "capacitor:" || 
      window.location.protocol === "file:" ||
      window.location.origin?.includes("capacitor://");
    
    if (!isLocalWebview && window.location.origin) {
      const currentStored = localStorage.getItem("mai_backend_url");
      const envBackendUrl = (import.meta as any).env?.VITE_BACKEND_URL;
      
      // If there is no pre-existing valid custom backend url and no compile-time variable, use window.location.origin
      if (!isValidBackendUrl(currentStored) && (!envBackendUrl || !isValidBackendUrl(envBackendUrl))) {
        localStorage.setItem("mai_backend_url", window.location.origin);
        setBackendUrl(window.location.origin);
      }
    }
  }, []);

  // Update backend url in storage and verify health status with cold-start tolerance
  useEffect(() => {
    localStorage.setItem("mai_backend_url", backendUrl);
    setCustomUrlInput(backendUrl);
    
    setServerStatus("checking");
    const controller = new AbortController();
    // 15 seconds timeout to allow for Cloud Run scale-to-zero cold starts to boot
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    fetch(`${backendUrl.replace(/\/$/, "")}/api/health`, { 
      method: "GET",
      signal: controller.signal 
    })
      .then(res => res.json())
      .then(data => {
        clearTimeout(timeoutId);
        if (data && (data.status === "ok" || data.time)) {
          setServerStatus("online");
        } else {
          setServerStatus("offline");
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        console.warn("Sync: Health check offline standard response:", err);
        setServerStatus("offline");
      });
  }, [backendUrl]);

  const gridEndRef = useRef<HTMLDivElement>(null);

  // Enhance prompt utilizing server endpoint
  const handleEnhancePrompt = async () => {
    if (!promptInput.trim()) return;
    setEnhancing(true);
    try {
      const res = await fetch(getApiUrl("/api/enhance-prompt"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptInput })
      });
      const data = await res.json();
      if (data.enhanced) {
        setPromptInput(data.enhanced);
      }
    } catch (err) {
      console.error("Enhancing prompt error:", err);
    } finally {
      setEnhancing(false);
    }
  };

  // Orchestrate single prompt to all active user-selected models concurrently
  const handleSendPrompt = async () => {
    const rawPrompt = promptInput.trim();
    if (!rawPrompt) return;

    // Apply Active Workflow prefixes
    const workflow = customWorkflows.find(w => w.id === activeWorkflowId);
    const basePrompt = workflow && workflow.promptPrefix 
      ? `${workflow.promptPrefix}${rawPrompt}` 
      : rawPrompt;

    // Ingest extra instruction variables matching selected Information Feeding Level (8x to 12x)
    let levelSuffix = "";
    if (feedingLevel >= 9) {
      if (isCodeModeActive) {
        levelSuffix += "\n- Big-O analysis: verify that algorithms run in optimal complexity bounds, reducing nested iterations and checking memory leak prevention.";
      } else {
        levelSuffix += "\n- Multi-perspective analysis: evaluate rival logical schools of thought, identify potential trade-offs, and outline systemic counter-arguments.";
      }
    }
    if (feedingLevel >= 10) {
      if (isCodeModeActive) {
        levelSuffix += "\n- Boundary constraints logic: implement robust protections for null values, empty array buffers, high numeric limits, and custom descriptive error blocks.";
      } else {
        levelSuffix += "\n- Deep validation & exception checks: analyze tail-risk outliers, boundary anomalies, and edge-cases related to the subject.";
      }
    }
    if (feedingLevel >= 11) {
      if (isCodeModeActive) {
        levelSuffix += "\n- Thread safety and resource guards: verify concurrency safety mechanisms, lock status, heap cached arrays constraints, and memory limits.";
      } else {
        levelSuffix += "\n- Systemic equilibrium and long-term feedback loops: trace indirect structural impacts, compound effects, and check limit scenarios.";
      }
    }
    if (feedingLevel >= 12) {
      if (isCodeModeActive) {
        levelSuffix += "\n- Full-Fleet cross examination consensus: fully reconcile competing logical suggestions from all drafts, implementing maximum depth code comments and perfect modular typing definitions.";
      } else {
        levelSuffix += "\n- Full-Fleet argumentative synthesis: fully reconcile contrasting analytical assertions, synthesizing a master-tier objective response with comprehensive footnotes or structured conceptual matrices.";
      }
    }

    const finalPrompt = levelSuffix 
      ? `${basePrompt}\n\n[Fleet Guidance Constraints Level ${feedingLevel}x]:${levelSuffix}` 
      : basePrompt;

    // Ingest image attachment context if available
    const imagePayload = activeAttachment
      ? { data: activeAttachment.data, mimeType: activeAttachment.mimeType }
      : undefined;

    // Reset prompt input and active attachment so UI refreshes cleanly
    setPromptInput("");
    setActiveAttachment(null);

    // Append User message to historic logs
    const timestampStr = new Date().toLocaleTimeString();
    const newUserLog: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      content: finalPrompt,
      timestamp: timestampStr
    };

    const nextHistories = { ...chatHistories };
    activeModels.forEach(model => {
      nextHistories[model.id] = [...(nextHistories[model.id] || []), newUserLog];
    });
    setChatHistories(nextHistories);

    // Initial loading states for selected models
    const loadState: Record<string, ModelResponse> = { ...responses };
    activeModels.forEach(model => {
      loadState[model.id] = {
        modelId: model.id,
        content: "",
        status: "loading"
      };
    });
    setResponses(loadState);

    // Trigger single, clean smooth scroll to view models response on submit
    setTimeout(() => {
      gridEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 150);

    // Process models in parallel using Promise.allSettled for fault tolerance
    await Promise.allSettled(
      activeModels.map(model => streamModelResponse(model.id, finalPrompt, nextHistories[model.id], imagePayload))
    );
  };

  // Stream single model handler
  const streamModelResponse = async (
    modelId: string, 
    promptText: string, 
    currentHistory: ChatMessage[],
    imagePayload?: { data: string; mimeType: string }
  ) => {
    const startTime = Date.now();
    try {
      // Exclude the last message (the new prompt itself) from the history array to prevent duplication
      const historyPayload = currentHistory.slice(0, currentHistory.length - 1);

      const response = await fetch(getApiUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId,
          prompt: promptText,
          history: historyPayload,
          image: imagePayload
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned error code: ${response.status}`);
      }

      setResponses(prev => ({
        ...prev,
        [modelId]: { modelId, content: "", status: "streaming" }
      }));

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      if (!reader) {
        throw new Error("Null response body reader");
      }

      let accumulatedText = "";
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed === "data: [DONE]") {
            continue;
          }

          if (trimmed.startsWith("data: ")) {
            try {
              const frame = JSON.parse(trimmed.slice(6));
              if (frame.error) {
                throw new Error(frame.error);
              }
              if (frame.text) {
                accumulatedText += frame.text;
                setResponses(prev => ({
                  ...prev,
                  [modelId]: {
                    modelId,
                    content: accumulatedText,
                    status: "streaming"
                  }
                }));
              }
            } catch (err) {
              // frame format parsing logs inside dev scope
            }
          }
        }
      }

      if (buffer.startsWith("data: ")) {
        try {
          const frame = JSON.parse(buffer.slice(6).trim());
          if (frame.text) {
            accumulatedText += frame.text;
          }
        } catch (err) {}
      }

      const responseTime = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));

      // Stream termination
      setResponses(prev => ({
        ...prev,
        [modelId]: {
          modelId,
          content: accumulatedText,
          status: "completed",
          responseTime
        }
      }));

      // Append compilation answer log
      const modelAnswerLog: ChatMessage = {
        id: Math.random().toString(),
        role: "assistant",
        content: accumulatedText,
        timestamp: new Date().toLocaleTimeString()
      };

      setChatHistories(prev => ({
        ...prev,
        [modelId]: [...(prev[modelId] || []), modelAnswerLog]
      }));

    } catch (error: any) {
      console.error(`Streaming error model ${modelId}:`, error);
      setResponses(prev => ({
        ...prev,
        [modelId]: {
          modelId,
          content: prev[modelId]?.content || "",
          status: "error",
          error: error.message || "Model failed to stream"
        }
      }));
    }
  };

  // Re-trigger specified model
  const handleRegenerateModel = async (modelId: string) => {
    const history = chatHistories[modelId] || [];
    if (history.length === 0) return;

    // Find the last user message to use as prompt
    let lastUserPrompt = "";
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role === "user") {
        lastUserPrompt = history[i].content;
        break;
      }
    }

    if (!lastUserPrompt) return;

    // Set ONLY this model to loading
    setResponses(prev => ({
      ...prev,
      [modelId]: { modelId, content: "", status: "loading" }
    }));

    // Filter out the last answers of assistant to restart context clean
    const cleanHistory = history.filter((v, idx) => idx < history.length - 1);
    await streamModelResponse(modelId, lastUserPrompt, cleanHistory);
  };

  // Clear chat history
  const handleClearWorkspace = () => {
    const freshHistories: Record<string, ChatMessage[]> = {};
    const freshResponses: Record<string, ModelResponse> = {};
    models.forEach(m => {
      freshHistories[m.id] = [];
      freshResponses[m.id] = { modelId: m.id, content: "", status: "idle" };
    });
    setChatHistories(freshHistories);
    setResponses(freshResponses);
  };

  // Trigger Image Generation API
  const handleGenerateImage = async () => {
    const prompt = imagePrompt.trim();
    if (!prompt) return;

    setImgRunning(true);
    setImgError("");
    setGeneratedImg("");

    try {
      const res = await fetch(getApiUrl("/api/generate-image"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (data.imageUrl) {
        setGeneratedImg(data.imageUrl);
      } else if (data.error) {
        setImgError(data.error);
      }
    } catch (err: any) {
      setImgError(err.message || "Failed to generate image assets.");
    } finally {
      setImgRunning(false);
    }
  };

  // Handle Document Upload simulation for summarizer
  const handleUploadDocumentText = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocFileName(file.name);
    setSummaryRunning(true);
    setSummaryOutput("");

    const reader = new FileReader();
    reader.onload = async (event) => {
      let text = event.target?.result as string || "";
      
      // Prevent "PayloadTooLargeError: request entity too large" by truncating extreme sizes
      const maxLength = 80000;
      if (text.length > maxLength) {
        text = text.substring(0, maxLength) + "\n\n... [TRUNCATED FOR WORKSPACE DEMO API SIZE LIMITS] ...";
      }
      
      setDocModelInput(text);

      try {
        const res = await fetch(getApiUrl("/api/summarize-document"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text, fileName: file.name })
        });
        const data = await res.json();
        if (data.summary) {
          setSummaryOutput(data.summary);
        } else if (data.error) {
          setSummaryOutput(`Error summarizing document: ${data.error}`);
        }
      } catch (err: any) {
        setSummaryOutput(`Failed to summarize text. ${err.message || ""}`);
      } finally {
        setSummaryRunning(false);
      }
    };
    reader.readAsText(file);
  };

  // Dual-stage multi-model Code Synthesis with Claude!
  const handleCodeSynthesis = async () => {
    const prompt = codePromptInput.trim();
    if (!prompt) return;

    setCodeError("");
    setCompositeState("synthesis-fleet");
    setFleetOutputs({});
    setClaudeUnifiedResult("");
    setClaudeLoading(false);

    // Prepare loading status for each active model
    const initialLoading: Record<string, "idle" | "running" | "done" | "failed"> = {};
    activeModels.forEach(m => {
      initialLoading[m.id] = "running";
    });
    setFleetLoading(initialLoading);

    const obtainedDrafts: Record<string, string> = {};

    // 1. Fire queries to ALL selected models concurrently!
    const draftPromises = activeModels.map(async (model) => {
      try {
        const response = await fetch(getApiUrl("/api/chat"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            modelId: model.id,
            prompt: `Produce a drafting template, pseudo-code ideas, or specific layout snippets to solve this coding task: "${prompt}". Focus strictly on engineering snippets and validations.`,
            history: []
          })
        });

        if (!response.ok) {
          throw new Error(`Draft failed: status ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder("utf-8");
        if (!reader) throw new Error("Null body");

        let draftText = "";
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ") && trimmed !== "data: [DONE]") {
              try {
                const frame = JSON.parse(trimmed.slice(6));
                if (frame.text) {
                  draftText += frame.text;
                  setFleetOutputs(prev => ({
                    ...prev,
                    [model.id]: draftText
                  }));
                }
              } catch (e) {}
            }
          }
        }
        
        obtainedDrafts[model.id] = draftText;
        setFleetLoading(prev => ({ ...prev, [model.id]: "done" }));
      } catch (err) {
        console.error(`Fleet draft error for ${model.id}:`, err);
        setFleetLoading(prev => ({ ...prev, [model.id]: "failed" }));
      }
    });

    await Promise.allSettled(draftPromises);

    // 2. Synthesize with Claude!
    setCompositeState("claude-refining");
    setClaudeLoading(true);

    try {
      let draftCompilations = "";
      activeModels.forEach(m => {
        const draft = obtainedDrafts[m.id];
        if (draft) {
          draftCompilations += `\n--- DRAFT FROM ${m.name} ---\n${draft}\n`;
        }
      });

      let moduleFocusInstruction = "";
      if (feedingLevel >= 9) {
        moduleFocusInstruction += "\n- Big-O analysis: verify that algorithms run in optimal complexity bounds, reducing nested iterations and checking memory leak prevention.";
      }
      if (feedingLevel >= 10) {
        moduleFocusInstruction += "\n- Boundary constraints logic: implement robust protections for null values, empty array buffers, high numeric limits, and custom descriptive error blocks.";
      }
      if (feedingLevel >= 11) {
        moduleFocusInstruction += "\n- Thread safety and resource guards: verify concurrency safety mechanisms, lock status, heap cached arrays constraints, and memory limits.";
      }
      if (feedingLevel >= 12) {
        moduleFocusInstruction += "\n- Full-Fleet cross examination consensus: fully reconcile competing logical suggestions from all drafts, implementing maximum depth code comments and perfect modular typing definitions.";
      }

      const finalClaudePrompt = `Act as the Lead Software Architect. The user requested: "${prompt}".
To accelerate your design, our model fleet has drafted separate architectural layouts and key pseudo-code slices:
${draftCompilations || "No drafts completed successfully."}

Review, reconcile, expand, and synthesize these inputs into a premium, world-class production-ready software module in the requested language.
Please adhere strictly to the following parameters configured for information feeding level ${feedingLevel}:${moduleFocusInstruction || "\n- Standard syntax and parsing validation."}

Optimize carefully for memory, safety, absolute completeness, and detailed comments. Deliver ONLY the final completed clean master implementation.`;

      const response = await fetch(getApiUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: isMasterCodeModeActive ? "claude-fable-5" : "claude-coder", // Will target Anthropic Claude
          prompt: finalClaudePrompt,
          history: []
        })
      });

      if (!response.ok) {
        throw new Error(`Claude synthesis failed with status ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      if (!reader) throw new Error("Null Claude body reader");

      let finalClaudeText = "";
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ") && trimmed !== "data: [DONE]") {
            try {
              const frame = JSON.parse(trimmed.slice(6));
              if (frame.text) {
                finalClaudeText += frame.text;
                setClaudeUnifiedResult(finalClaudeText);
              }
            } catch (e) {}
          }
        }
      }

      setCompositeState("completed");
    } catch (err: any) {
      console.error("Claude synthesis error:", err);
      setCodeError(err.message || "Failed during Claude lead synthesis phase.");
      setCompositeState("error");
    } finally {
      setClaudeLoading(false);
    }
  };

  // Handle Voice Dictation transcription simulation
  const handleTranscribeAudioMessage = async () => {
    const topic = audioTopicInput.trim() || "Multi-model orchestration speeds";
    setAudioRunning(true);
    setTranscribedText("");

    try {
      const res = await fetch(getApiUrl("/api/transcribe-audio"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptText: topic })
      });
      const data = await res.json();
      if (data.transcription) {
        setTranscribedText(data.transcription);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAudioRunning(false);
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-700 text-white font-sans relative flex w-full overflow-hidden ${
      isMasterCodeModeActive
        ? "bg-[#0b0602] selection:bg-amber-500/40 selection:text-white"
        : isCodeModeActive 
          ? "bg-[#06030e] selection:bg-purple-500/40 selection:text-white" 
          : "bg-[#07090e] selection:bg-emerald-500/30"
    }`}>
      
      {/* Background Celestial Canvas and Orbits */}
      <CelestialCanvas 
        isProMode={isCodeModeActive}
        fpsCap={vfxFpsCap}
        trailWidth={vfxTrailWidth}
        trailLength={vfxTrailLength}
        latticeDist={vfxLatticeDist}
        particleCount={vfxParticleCount}
        shaderMode={vfxShaderMode}
        physicsFriction={vfxPhysicsFriction}
        aberration={vfxAberration}
        bloomGlow={vfxBloomGlow}
        colorPreset={vfxColorPreset}
        soundEnabled={vfxSoundEnabled}
      />
      {isMasterCodeModeActive ? (
        <>
          <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none transition-all duration-1000 z-0" />
          <div className="absolute bottom-0 left-0 w-[550px] h-[550px] bg-orange-600/10 blur-[130px] rounded-full pointer-events-none transition-all duration-1000 z-0" />
        </>
      ) : isCodeModeActive ? (
        <>
          <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-purple-600/10 blur-[130px] rounded-full pointer-events-none transition-all duration-1000 z-0" />
          <div className="absolute bottom-0 left-0 w-[550px] h-[550px] bg-fuchsia-600/10 blur-[130px] rounded-full pointer-events-none transition-all duration-1000 z-0" />
        </>
      ) : (
        <>
          <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-emerald-500/5 blur-[130px] rounded-full pointer-events-none transition-all duration-1000 z-0" />
          <div className="absolute bottom-0 left-0 w-[550px] h-[550px] bg-cyan-500/5 blur-[130px] rounded-full pointer-events-none transition-all duration-1000 z-0" />
        </>
      )}

      {/* Main Workspace Body */}
      <div className="flex-grow flex flex-col min-w-0">
        
        {/* Workspace Header */}
        <header className={`border-b border-gray-800/60 transition-all duration-700 bg-opacity-80 backdrop-blur-md px-4 md:px-6 py-3 md:py-4 flex items-center justify-between z-10 shrink-0 ${
          isCodeModeActive ? "bg-[#0b051c]/80" : "bg-[#07090e]/80"
        }`}>
          <div className="flex items-center space-x-3 md:space-x-4">
            <button 
              onClick={onBack}
              className="p-2 rounded-lg bg-gray-950 hover:bg-slate-900 border border-gray-900 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-2">
              <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center font-bold text-xs md:text-sm transition-all duration-500 ${
                isCodeModeActive 
                  ? "bg-gradient-to-tr from-purple-500 to-fuchsia-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.45)]" 
                  : "bg-gradient-to-tr from-emerald-500 to-purple-500 text-black"
              }`}>
                {isCodeModeActive ? "CL" : "AI"}
              </div>
              <div>
                <h1 className="font-display font-extrabold text-sm md:text-base tracking-tight leading-none text-white">
                  {isMasterCodeModeActive ? "Claude Fable 5 Master Synth" : isCodeModeActive ? "Claude Code Module" : "AI"}
                </h1>
                <span className={`text-[9px] font-mono transition-colors duration-500 ${isMasterCodeModeActive ? 'text-amber-400 font-bold' : isCodeModeActive ? 'text-purple-400' : 'text-emerald-400'}`}>
                  {isMasterCodeModeActive ? "Autonomous Multi-Agent Swarm" : isCodeModeActive ? "Collaborative Fleet Conductor" : `${activeModels.length}x Model${activeModels.length === 1 ? '' : 's'} Active`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-3">
            {isCodeModeActive ? (
              /* Master Synthesizer Toggle switch for PRO mode */
              <div className={`flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-lg border transition-all duration-500 scale-90 sm:scale-100 ${
                isMasterCodeModeActive 
                  ? "bg-amber-950/45 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.35)]" 
                  : "bg-slate-950 border-gray-800/60"
              }`}>
                <Sparkles className={`w-3.5 h-3.5 transition-all duration-500 ${isMasterCodeModeActive ? "text-amber-400 animate-pulse" : "text-gray-500"}`} />
                <span className={`font-mono text-[9px] md:text-[10px] uppercase tracking-wider transition-colors duration-500 ${isMasterCodeModeActive ? 'text-amber-300 font-extrabold' : 'text-gray-400 font-normal'}`}>
                  MASTER SYNTH
                </span>
                <button
                  type="button"
                  onClick={() => setIsMasterCodeModeActive(!isMasterCodeModeActive)}
                  className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-300 ${
                    isMasterCodeModeActive ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-neutral-800"
                  }`}
                  title="Toggle Master Code synthesizer"
                >
                  <span
                    className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-neutral-200 shadow ring-0 transition duration-300 ease-in-out ${
                      isMasterCodeModeActive ? "translate-x-3.5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ) : (
              /* Universal Swarm Toggle switch for NORMAL/general subjects mode */
              <div className={`flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-lg border transition-all duration-500 scale-90 sm:scale-100 ${
                isMasterCodeModeActive 
                  ? "bg-emerald-950/45 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.35)]" 
                  : "bg-slate-950 border-gray-800/60"
              }`}>
                <Activity className={`w-3.5 h-3.5 transition-all duration-500 ${isMasterCodeModeActive ? "text-emerald-400 animate-pulse" : "text-gray-500"}`} />
                <span className={`font-mono text-[9px] md:text-[10px] uppercase tracking-wider transition-colors duration-500 ${isMasterCodeModeActive ? 'text-emerald-300 font-extrabold' : 'text-gray-400 font-normal'}`}>
                  SWARM DEBATE
                </span>
                <button
                  type="button"
                  onClick={() => setIsMasterCodeModeActive(!isMasterCodeModeActive)}
                  className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-300 ${
                    isMasterCodeModeActive ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-neutral-800"
                  }`}
                  title="Toggle Universal Fleet Swarm debating and creative consensus"
                >
                  <span
                    className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-neutral-200 shadow ring-0 transition duration-300 ease-in-out ${
                      isMasterCodeModeActive ? "translate-x-3.5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            )}

            {/* Programmer Mode Toggle Switch */}
            <div className={`flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-lg border transition-all duration-500 scale-90 sm:scale-100 ${
              isCodeModeActive 
                ? "bg-[#181030]/60 border-purple-500/35 shadow-[0_0_15px_rgba(168,85,247,0.3)]" 
                : "bg-slate-950 border-gray-800/60"
            }`}>
              <Terminal className={`w-3.5 h-3.5 transition-colors duration-500 ${isCodeModeActive ? "text-purple-400" : "text-gray-500"}`} />
              <span className={`font-mono text-[9px] md:text-[10px] uppercase tracking-wider transition-colors duration-500 ${isCodeModeActive ? 'text-purple-300 font-extrabold' : 'text-gray-400 font-normal'}`}>
                PRO Mode
              </span>
              <button
                type="button"
                onClick={() => setIsCodeModeActive(!isCodeModeActive)}
                className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-300 ${
                  isCodeModeActive ? "bg-purple-600 shadow-[0_0_8px_rgba(168,85,247,0.5)]" : "bg-neutral-800"
                }`}
                title="Toggle programmer workspace theme"
              >
                <span
                  className={`pointer-events-none inline-block h-3.5 h-3.5 transform rounded-full bg-neutral-200 shadow ring-0 transition duration-300 ease-in-out ${
                    isCodeModeActive ? "translate-x-3.5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Clear Button */}
            <button
              onClick={handleClearWorkspace}
              className="px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-rose-950/20 hover:text-rose-400 border border-neutral-800 text-xs text-neutral-400 font-medium transition-colors flex items-center space-x-1.5 cursor-pointer"
              title="Clear entire workspace state"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Board</span>
            </button>

            {/* Sidebar Toggle */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg bg-neutral-900 hover:bg-slate-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Toggle Toolbox Sidebar"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* User Model Selector Bar */}
        <div className="px-4 md:px-6 py-2.5 bg-[#090d16]/40 border-b border-gray-900/60 flex flex-wrap items-center gap-2 relative z-10 shrink-0">
          <span className="font-mono text-[9.5px] tracking-wider text-zinc-500 uppercase mr-1">Query Targets:</span>
          <div className="flex flex-wrap gap-1.5">
            {models.map(model => {
              const isActive = selectedModelIds.includes(model.id);
              return (
                <motion.button
                  key={model.id}
                  whileHover={{ scale: 1.05, y: -0.5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (isActive) {
                      if (selectedModelIds.length > 1) {
                        setSelectedModelIds(prev => prev.filter(id => id !== model.id));
                      }
                    } else {
                      setSelectedModelIds(prev => [...prev, model.id]);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-medium transition-all flex items-center gap-1.5 border cursor-pointer select-none ${
                    isActive
                      ? isCodeModeActive
                        ? "bg-[#120a2e]/65 border-purple-500/50 text-purple-300 font-bold shadow-[0_0_10px_rgba(168,85,247,0.15)]"
                        : "bg-slate-900 border-emerald-500/35 text-emerald-400 font-bold"
                      : isCodeModeActive
                        ? "bg-[#05030d]/30 border-purple-950/40 text-purple-900/60 hover:text-purple-300 hover:border-purple-800/40"
                        : "bg-[#06080d]/40 border-gray-900/60 text-zinc-550 hover:text-zinc-350 hover:border-gray-800/80"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? model.bgColor : 'bg-zinc-750'}`} />
                  <span>{model.name}</span>
                  {isActive && <span className={`text-[8px] font-bold ${isCodeModeActive ? 'text-purple-400' : 'text-emerald-500'}`}>✓</span>}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Interactive Workspace Modes Toolbar */}
        <div className="px-4 md:px-6 py-2 bg-[#060a12]/60 border-b border-gray-950 flex flex-wrap items-center justify-between gap-4 relative z-10 shrink-0 text-xs">
          
          {/* Left Block: Layout Select Mode */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] tracking-wider text-zinc-500 uppercase">Board View:</span>
            <div className="bg-slate-950/70 p-0.5 rounded-lg border border-gray-900/80 flex">
              <button
                onClick={() => setLayoutMode("grid")}
                className={`px-2.5 py-1 rounded-md text-[9.5px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  layoutMode === "grid" 
                    ? "bg-slate-800 text-emerald-400 font-bold shadow-sm" 
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Grid Wrap
              </button>
              <button
                onClick={() => setLayoutMode("side-by-side")}
                className={`px-2.5 py-1 rounded-md text-[9.5px] font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                  layoutMode === "side-by-side" 
                    ? "bg-slate-800 text-emerald-400 font-bold shadow-sm" 
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Side-by-Side Lanes
              </button>
            </div>
          </div>

          {/* Right Block: Responses Mode */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] tracking-wider text-zinc-500 uppercase font-medium">History Mode:</span>
            <div className="bg-slate-950/70 p-0.5 rounded-lg border border-gray-900/80 flex">
              <button
                onClick={() => setResponseMode("latest")}
                className={`px-2.5 py-1 rounded-md text-[9.5px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  responseMode === "latest" 
                    ? "bg-slate-800 text-cyan-400 font-bold shadow-sm" 
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
                title="Show only the newest answer for each model card"
              >
                Overwrite (Latest)
              </button>
              <button
                onClick={() => setResponseMode("history")}
                className={`px-2.5 py-1 rounded-md text-[9.5px] font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                  responseMode === "history" 
                    ? "bg-slate-800 text-emerald-400 font-bold shadow-sm" 
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
                title="Saves and appends past answers so you can scroll up and view history"
              >
                Keep Past Responses
              </button>
            </div>
          </div>

        </div>

        {/* Mobile Layout Switcher Bar */}
        {isMobile && (
          <div className="px-5 py-3.5 bg-slate-950/60 border-b border-gray-800/50 flex flex-col gap-3 relative z-10 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-widest text-[var(--color-zinc-500)] uppercase">Comparison Layout</span>
              <div className="flex bg-slate-900 p-0.5 rounded-lg border border-gray-850">
                {(["stack", "tabs", "split"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setMobileLayout(mode)}
                    className={`px-3 py-1 rounded-md text-[10px] font-mono tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                      mobileLayout === mode
                        ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-bold"
                        : "text-zinc-500 hover:text-white"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-config depending on layout chosen */}
            {mobileLayout === "tabs" && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {activeModels.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMobileModelId(m.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10.5px] font-medium transition-all cursor-pointer whitespace-nowrap border ${
                      selectedMobileModelId === m.id
                        ? "bg-slate-900 border-emerald-500/50 text-emerald-400"
                        : "bg-slate-950/40 border-gray-900/60 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${m.bgColor}`} />
                      {m.name.replace(" Chat", "").replace(" Coder", "").replace(" Turbo", "")}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {mobileLayout === "split" && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-mono uppercase tracking-widest text-zinc-500">Left Column</label>
                  <select
                    value={splitModelId1}
                    onChange={(e) => setSplitModelId1(e.target.value)}
                    className="bg-slate-900 border border-gray-800 rounded-lg p-1.5 text-zinc-300 focus:outline-none focus:border-emerald-500/35 font-mono text-[10px] cursor-pointer"
                  >
                    {activeModels.map(m => (
                      <option key={m.id} value={m.id} disabled={m.id === splitModelId2}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-mono uppercase tracking-widest text-zinc-500">Right Column</label>
                  <select
                    value={splitModelId2}
                    onChange={(e) => setSplitModelId2(e.target.value)}
                    className="bg-slate-900 border border-gray-800 rounded-lg p-1.5 text-zinc-300 focus:outline-none focus:border-emerald-500/35 font-mono text-[10px] cursor-pointer"
                  >
                    {activeModels.map(m => (
                      <option key={m.id} value={m.id} disabled={m.id === splitModelId1}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scrollable Work area */}
        <div className="flex-grow overflow-y-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8">
          
          {/* Strict 3x2 Grid Display (Directives enforce Desktop Grid layout always) */}
          <div className="max-w-7xl mx-auto">
            {isMasterCodeModeActive && (
              <div className={`mb-8 p-5 md:p-8 rounded-2xl border-2 relative overflow-hidden backdrop-blur-xl transition-all duration-700 ${
                isCodeModeActive
                  ? "bg-gradient-to-b from-[#180d04] via-[#0f0701] to-[#040200] border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.15)]"
                  : "bg-gradient-to-b from-[#02140a] via-[#010804] to-[#000402] border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.15)]"
              }`}>
                {/* Glowing decorative laser grid styling */}
                <div className={`absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.05)_1px,transparent_1px)] bg-[size:24px_24px] opacity-25 pointer-events-none ${
                  isCodeModeActive ? "bg-[size:24px_24px]" : "bg-[size:28px_28px] opacity-15"
                }`} />
                
                {/* Tactical status beam */}
                <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 mb-5 relative z-10 font-mono gap-3 ${
                  isCodeModeActive ? "border-amber-500/20" : "border-emerald-500/20"
                }`}>
                  <div className="flex items-center space-x-2.5 text-left">
                    <div className="relative w-11 h-11 border border-zinc-800 rounded-xl overflow-hidden shrink-0 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                      <img 
                        src="/src/assets/images/app_logo_1781273383149.jpg" 
                        alt="AI Logo" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <h2 className={`text-sm font-extrabold tracking-widest uppercase ${isCodeModeActive ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {isCodeModeActive ? "Multi-Agent Swarm Consensus Hub" : "Universal Swarm Debate Seminar"}
                      </h2>
                      <p className={`text-[10px] font-medium ${isCodeModeActive ? 'text-orange-300/60' : 'text-emerald-300/60'}`}>
                        {isCodeModeActive 
                          ? "Cooperative Fleet Argumentation Node — Supervised by Claude Fable 5" 
                          : "Cooperative Academic & Strategic Fleet Debate Seminar — Supervised by Claude Fable 5"}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center space-x-2 text-[10px] ${isCodeModeActive ? 'text-amber-500' : 'text-emerald-500'}`}>
                    <span className={`inline-block w-2.5 h-2.5 rounded-full animate-ping ${isCodeModeActive ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <span className={`font-bold tracking-widest uppercase border px-2 py-0.5 rounded ${
                      isCodeModeActive ? 'bg-amber-950/60 border-amber-500/20' : 'bg-emerald-950/60 border-emerald-500/20'
                    }`}>SYSTEM ONLINE</span>
                  </div>
                </div>

                {/* Topic specification block */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6 relative z-10 text-left">
                  <div className="lg:col-span-8 space-y-2">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">Consensus Topic / Seminar Target</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={consensusTopic} 
                        onChange={(e) => setConsensusTopic(e.target.value)}
                        placeholder={
                          isCodeModeActive 
                            ? "e.g. Architect a highly secure multi-threaded web socket server in Rust..." 
                            : "e.g. Analyze the geopolitical, economic, and systemic implications of asteroid helium-3 mining..."
                        } 
                        className={`w-full bg-black/85 border rounded-xl px-4 py-3 text-xs focus:outline-none shadow-inner block ${
                          isCodeModeActive 
                            ? "border-amber-500/30 text-amber-100 placeholder-amber-950/60 focus:border-amber-400" 
                            : "border-emerald-500/30 text-emerald-100 placeholder-emerald-950/60 focus:border-emerald-400"
                        }`}
                      />
                      <span className={`absolute right-3 top-3.5 text-[8.5px] font-mono select-none ${isCodeModeActive ? 'text-amber-500/40' : 'text-emerald-500/40'}`}>
                        {isCodeModeActive ? "SWARM_CODE_V5" : "SWARM_UNIV_V5"}
                      </span>
                    </div>
                  </div>
                  <div className="lg:col-span-4 flex items-end">
                    <button
                      onClick={handleRunSwarmConsensus}
                      disabled={consensusStatus === "conversing" || consensusStatus === "fusing"}
                      className={`w-full py-3 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all duration-300 flex items-center justify-center space-x-2 border cursor-pointer ${
                        consensusStatus === "conversing" || consensusStatus === "fusing"
                          ? "bg-neutral-900 border-neutral-850 text-neutral-600 cursor-not-allowed"
                          : isCodeModeActive
                            ? "bg-amber-500 hover:bg-amber-400 text-black border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.45)]"
                            : "bg-emerald-500 hover:bg-emerald-400 text-black border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_30px_rgba(16,185,129,0.45)]"
                      }`}
                    >
                      {consensusStatus === "conversing" ? (
                        <>
                          <Cpu className="w-4 h-4 animate-spin text-black" />
                          <span>Fleet Debating...</span>
                        </>
                      ) : consensusStatus === "fusing" ? (
                        <>
                          <Sparkles className="w-4 h-4 animate-pulse text-black" />
                          <span>Fable 5 Fusing...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current shrink-0" />
                          <span>Trigger Multi-Agent Swarm</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Section where selected AI talk to each other (opinions) */}
                {consensusLogs.length > 0 && (
                  <div className="mb-6 space-y-4 text-left">
                    <h3 className={`text-[10px] font-mono uppercase tracking-widest font-extrabold pb-2 border-b ${
                      isCodeModeActive ? "text-amber-500 border-amber-500/10" : "text-emerald-500 border-emerald-500/10"
                    }`}>
                      Step 1: Multi-Agent Argumentation & Discussion Pipeline ({consensusLogs.length} transmissions)
                    </h3>
                    
                    {/* Scrollable conversational feed of agents talking to each other */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-[350px] overflow-y-auto pr-1">
                      {consensusLogs.map((log, i) => (
                        <motion.div
                          key={log.key}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-xl border bg-black/60 flex flex-col justify-between space-y-3 shadow-md transition-all group ${
                            isCodeModeActive 
                              ? "border-amber-500/10 hover:border-amber-500/20" 
                              : "border-emerald-500/10 hover:border-emerald-500/20"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className={`w-2 h-2 rounded-full animate-pulse ${isCodeModeActive ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                <span className={`text-[10.5px] font-extrabold font-mono uppercase tracking-wider ${
                                  isCodeModeActive ? "text-amber-300" : "text-emerald-300"
                                }`}>{log.modelName}</span>
                              </div>
                              <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${
                                isCodeModeActive 
                                  ? "text-amber-500/50 bg-amber-500/5 border-amber-500/10" 
                                  : "text-emerald-500/50 bg-emerald-500/5 border-emerald-500/10"
                              }`}>OPINION #{log.key + 1}</span>
                            </div>
                            <div className="text-[11px] select-text leading-relaxed text-zinc-300 whitespace-pre-wrap pr-1 max-h-[220px] overflow-y-auto font-sans">
                              {log.content}
                            </div>
                          </div>
                          <div className={`pt-2 border-t flex items-center justify-between text-[8px] font-mono ${
                            isCodeModeActive ? "border-amber-500/5 text-amber-500/40" : "border-emerald-500/5 text-emerald-500/40"
                          }`}>
                            <span>SEGMENT RESPONDED</span>
                            <span className="group-hover:text-amber-400 transition-colors uppercase">TRANSMISSION OVER</span>
                          </div>
                        </motion.div>
                      ))}
                      
                      {consensusStatus === "conversing" && (
                        <div className={`p-4 rounded-xl border border-dashed bg-black/20 flex flex-col items-center justify-center text-center space-y-2 animate-pulse min-h-[180px] ${
                          isCodeModeActive ? "border-amber-500/30" : "border-emerald-500/30"
                        }`}>
                          <Cpu className={`w-5 h-5 animate-spin ${isCodeModeActive ? 'text-amber-500' : 'text-emerald-500'}`} />
                          <span className={`text-[9.5px] font-mono font-bold uppercase tracking-wider ${
                            isCodeModeActive ? 'text-amber-400' : 'text-emerald-400'
                          }`}>Gathering Next Agent Opinion...</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Section where the final summary is rendered inside a Giant Display Box */}
                {(consensusFinalResult || consensusStatus === "fusing") && (
                  <div className="space-y-4 text-left">
                    <h3 className={`text-[11px] font-mono uppercase tracking-widest font-extrabold pb-2 border-b flex items-center justify-between ${
                      isCodeModeActive ? "text-amber-400 border-amber-500/10" : "text-emerald-400 border-emerald-500/10"
                    }`}>
                      <span>Step 2: Ultimate Fused Output Synthesized by Claude Fable 5 ({isCodeModeActive ? "Master Code" : "Universal Debate Essay"})</span>
                      {consensusStatus === "fusing" && <span className={`${isCodeModeActive ? 'text-amber-500' : 'text-emerald-500'} animate-pulse font-bold tracking-wider`}>SYNTHESIZING CONSOLIDATED OUTCOME...</span>}
                    </h3>
                    
                    <motion.div
                      initial={{ opacity: 0, scale: 0.995 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`p-6 md:p-8 border-2 rounded-2xl relative overflow-hidden transition-all duration-500 ${
                        isCodeModeActive 
                          ? "bg-[#150a02] border-amber-500 shadow-[0_0_35px_rgba(245,158,11,0.2)]" 
                          : "bg-[#021008] border-emerald-500 shadow-[0_0_35px_rgba(16,185,129,0.2)]"
                      }`}
                    >
                      {/* Neon corner indicators */}
                      <div className={`absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 pointer-events-none ${isCodeModeActive ? 'border-amber-400' : 'border-emerald-400'}`} />
                      <div className={`absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 pointer-events-none ${isCodeModeActive ? 'border-amber-400' : 'border-emerald-400'}`} />
                      <div className={`absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 pointer-events-none ${isCodeModeActive ? 'border-amber-400' : 'border-emerald-400'}`} />
                      <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 pointer-events-none ${isCodeModeActive ? 'border-amber-400' : 'border-emerald-400'}`} />
                      
                      {/* Interactive controls */}
                      <div className={`flex items-center justify-between mb-4 border-b pb-3 ${
                        isCodeModeActive ? "border-amber-500/10" : "border-emerald-500/10"
                      }`}>
                        <span className={`text-[10px] font-mono border px-2 py-0.5 rounded font-extrabold tracking-wider ${
                          isCodeModeActive 
                            ? "text-amber-400 bg-amber-500/10 border-amber-500/20" 
                            : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                        }`}>
                          {isCodeModeActive ? "MASTER SCREEN [CLAUDE FABLE 5 - CODE EXPERT]" : "MASTER SCREEN [CLAUDE FABLE 5 - UNIVERSAL THINKER]"}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(consensusFinalResult);
                          }}
                          className={`text-[10.5px] font-mono flex items-center gap-1.5 border px-3 py-1 rounded-lg cursor-pointer transition-all hover:bg-white/5 border-gray-800 ${
                            isCodeModeActive ? "text-amber-400 hover:text-white" : "text-emerald-400 hover:text-white"
                          }`}
                        >
                          <Copy className={`w-3.5 h-3.5 ${isCodeModeActive ? 'text-amber-500' : 'text-emerald-500'}`} />
                          <span>Copy Master Output</span>
                        </button>
                      </div>

                      {/* Render output text, highlighted bigger */}
                      <div className="text-sm md:text-base leading-relaxed text-zinc-100 select-text font-sans whitespace-pre-wrap max-h-[700px] overflow-y-auto pr-1">
                        {consensusFinalResult ? (
                          <div className="text-zinc-100 font-sans p-1">
                            {consensusFinalResult}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <div className="relative">
                              <div className={`w-12 h-12 border-2 rounded-full animate-ping pointer-events-none absolute inset-0 ${
                                isCodeModeActive ? "border-amber-500/20" : "border-emerald-500/20"
                              }`} />
                              <Cpu className={`w-12 h-12 animate-spin ${isCodeModeActive ? 'text-amber-500' : 'text-emerald-500'}`} style={{ animationDuration: '4s' }} />
                            </div>
                            <div className="text-center font-mono space-y-1">
                              <p className={`text-xs font-extrabold uppercase tracking-widest ${isCodeModeActive ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {isCodeModeActive ? "Awaiting Master Code Synthesis" : "Awaiting Universal Debate Synthesis"}
                              </p>
                              <p className="text-[10px] text-zinc-500 max-w-md mx-auto">
                                {isCodeModeActive 
                                  ? "Claude Fable 5 is observing current code discussions and formulating optimal programmatic implementation patterns..." 
                                  : "Claude Fable 5 is analyzing arguments across all nodes and synthesizing a master-tier analytical brief..."}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </div>
                )}
              </div>
            )}

            {!isMobile ? (
              layoutMode === "side-by-side" ? (
                <div className="overflow-x-auto pb-4 scrollbar-thin select-text">
                  <div className="flex gap-6 min-w-max pb-2">
                    <AnimatePresence>
                      {activeModels.map(model => {
                        const Card = ModelCard as any;
                        return (
                          <div key={model.id} className="w-[380px] shrink-0">
                            <Card 
                              model={model}
                              response={(responses[model.id] || { modelId: model.id, content: "", status: "idle" }) as any}
                              onRegenerate={handleRegenerateModel as any}
                              history={chatHistories[model.id]}
                              responseMode={responseMode}
                            />
                          </div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <div className={`grid ${getGridColsClass(activeModels.length)} gap-6`}>
                  <AnimatePresence>
                    {activeModels.map(model => {
                      const Card = ModelCard as any;
                      return (
                        <Card 
                          key={model.id}
                          model={model}
                          response={(responses[model.id] || { modelId: model.id, content: "", status: "idle" }) as any}
                          onRegenerate={handleRegenerateModel as any}
                          history={chatHistories[model.id]}
                          responseMode={responseMode}
                        />
                      );
                    })}
                  </AnimatePresence>
                </div>
              )
            ) : (
              <div className="space-y-4">
                {mobileLayout === "stack" && (
                  <div className="grid grid-cols-1 gap-5">
                    {activeModels.map(model => {
                      const Card = ModelCard as any;
                      return (
                        <Card 
                          key={model.id}
                          model={model}
                          response={(responses[model.id] || { modelId: model.id, content: "", status: "idle" }) as any}
                          onRegenerate={handleRegenerateModel as any}
                          history={chatHistories[model.id]}
                          responseMode={responseMode}
                        />
                      );
                    })}
                  </div>
                )}

                {mobileLayout === "tabs" && (
                  <div className="space-y-4">
                    {activeModels
                      .filter(m => m.id === selectedMobileModelId)
                      .map(model => {
                        const Card = ModelCard as any;
                        return (
                          <Card 
                            key={model.id}
                            model={model}
                            response={(responses[model.id] || { modelId: model.id, content: "", status: "idle" }) as any}
                            onRegenerate={handleRegenerateModel as any}
                            history={chatHistories[model.id]}
                            responseMode={responseMode}
                          />
                        );
                      })}
                  </div>
                )}

                {mobileLayout === "split" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeModels
                      .filter(m => m.id === splitModelId1 || m.id === splitModelId2)
                      .sort((a, b) => (a.id === splitModelId1 ? -1 : 1))
                      .map(model => {
                        const Card = ModelCard as any;
                        return (
                          <Card 
                            key={model.id}
                            model={model}
                            response={(responses[model.id] || { modelId: model.id, content: "", status: "idle" }) as any}
                            onRegenerate={handleRegenerateModel as any}
                            history={chatHistories[model.id]}
                            responseMode={responseMode}
                          />
                        );
                      })}
                  </div>
                )}
              </div>
            )}
            <div ref={gridEndRef} />
          </div>          {/* User Input & Action Area */}
          <div className="max-w-4xl mx-auto pt-6 border-t border-gray-900">
            <div className={`transition-all duration-500 rounded-2xl p-4 backdrop-blur-md relative overflow-hidden border ${
              isCodeModeActive 
                ? "bg-[#0b051c]/90 border-purple-500/35 shadow-[0_0_25px_rgba(168,85,247,0.15)]" 
                : "bg-[#090d16]/90 border border-gray-800 shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
            }`}>
              
              {/* Coder Simulated CLI Terminal Path */}
              {isCodeModeActive && (
                <div className="flex items-center space-x-2 pb-2.5 mb-2.5 border-b border-purple-950/40 font-mono text-[10.5px]">
                  <span className="text-purple-400 font-extrabold">claude@codespace:~$</span>
                  <span className="text-[#a78bfa]/50 text-[10px] sm:text-xs"># multi-model live orchestration pipeline initialized</span>
                  <span className="ml-auto text-[8px] bg-purple-500/10 border border-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-bold uppercase animate-pulse">
                    PARALLEL
                  </span>
                </div>
              )}

              {/* Dynamic workflow label tag */}
              {activeWorkflowId !== "none" && (
                <div className={`inline-flex items-center space-x-1.5 mb-3 px-2.5 py-1 rounded font-mono text-[10px] ${
                  isCodeModeActive
                    ? "bg-purple-500/10 border border-purple-500/20 text-purple-300"
                    : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                }`}>
                  <PlaySymbol className={`w-2.5 h-2.5 animate-pulse rounded-full shrink-0 ${isCodeModeActive ? 'bg-purple-400 text-purple-400' : 'bg-emerald-400 text-emerald-400'}`} />
                  <span className="uppercase font-bold tracking-wider">Workflow: {customWorkflows.find(w => w.id === activeWorkflowId)?.name}</span>
                </div>
              )}

              {/* Attachment Preview Bubble */}
              {activeAttachment && (
                <div className="flex items-center gap-2 mb-3 p-1.5 bg-slate-950/80 border border-gray-800 rounded-xl w-fit relative group">
                  <img 
                    src={activeAttachment.previewUrl} 
                    alt="Upload preview" 
                    className="w-10 h-10 object-cover rounded-lg border border-gray-800"
                  />
                  <div className="pr-4 max-w-[150px] overflow-hidden text-left">
                    <span className="block text-[9px] font-mono text-zinc-500 truncate">{activeAttachment.name}</span>
                    <span className="block text-[8px] font-mono text-emerald-400 font-bold uppercase tracking-wider animate-pulse">Ready to Analyze</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveAttachment(null)}
                    className="absolute -top-1.5 -right-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full p-0.5 shadow-md cursor-pointer transition-colors"
                    title="Remove Image"
                  >
                    <X className="w-3" />
                  </button>
                </div>
              )}

              {/* Input Area */}
              <div className="flex items-start space-x-3">
                <div className="w-full relative">
                  <textarea
                    id="workspace_prompt_area"
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    placeholder={
                      isCodeModeActive
                        ? "Input software specification or algorithmic code constraints to dispatch to the parallel model fleet..."
                        : "Enter one global prompt to query all model grids simultaneously..."
                    }
                    className="w-full bg-transparent border-0 text-sm h-24 text-neutral-200 placeholder-gray-550 focus:outline-none resize-none align-top scrollbar-thin pr-12 pt-1.5"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendPrompt();
                      }
                    }}
                  />
                  
                  {/* Text length helper */}
                  <span className="absolute bottom-2 right-2 text-[9px] font-mono text-zinc-500 uppercase tracking-widest bg-slate-950 border border-gray-900 px-1.5 py-0.5 rounded">
                    TS Mode
                  </span>
                </div>
              </div>

              {/* Information Feeding Selector for Prompt Bar */}
              <div className={`mt-2 mb-1 p-2 rounded-xl text-left flex flex-col md:flex-row md:items-center md:justify-between gap-2 transition-all duration-300 ${
                isCodeModeActive
                  ? "bg-purple-950/15 border border-purple-500/15"
                  : "bg-emerald-950/15 border border-emerald-500/15"
              }`}>
                <div className="flex items-center space-x-2">
                  <span className={`text-[8.5px] uppercase tracking-wider font-mono font-bold ${
                    isCodeModeActive ? "text-purple-300" : "text-emerald-300"
                  }`}>
                    FEEDING LEVEL
                  </span>
                  <span className={`text-[8px] font-mono font-bold px-1 rounded-sm ${
                    isCodeModeActive ? "bg-purple-500/15 text-purple-300 border border-purple-500/10" : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/10"
                  }`}>
                    {feedingLevel === 0 ? "Off / Standalone" : `${feedingLevel}x Nodes`}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-[9px]">
                  <span className="text-zinc-500 text-[8px] uppercase">Select:</span>
                  <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-gray-900">
                    {([0, 8, 9, 10, 11, 12] as const).map(lvl => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setFeedingLevel(lvl)}
                        className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold transition-all cursor-pointer ${
                          feedingLevel === lvl
                            ? isCodeModeActive
                              ? "bg-purple-600 border border-purple-400 text-white font-extrabold"
                              : "bg-emerald-500 border border-emerald-400 text-black font-extrabold"
                            : "text-gray-500 hover:text-zinc-200 hover:bg-white/5"
                        }`}
                      >
                        {lvl === 0 ? "Off" : `${lvl}x`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="hidden md:block max-w-[280px] truncate text-right">
                  <span className="text-[8px] font-mono text-zinc-400">
                    {feedingLevel === 0 && "Standard prompt directly (Not compulsory)"}
                    {feedingLevel === 8 && "Level 8: Basic Scope & Syntax Parsing"}
                    {feedingLevel === 9 && (isCodeModeActive ? "Level 9: + Algorithmic Big-O Optimization" : "Level 9: + Multi-perspective scholarly logic")}
                    {feedingLevel === 10 && (isCodeModeActive ? "Level 10: + Deep Boundary Condition Checks" : "Level 10: + Anomaly & Tail-risk validation")}
                    {feedingLevel === 11 && (isCodeModeActive ? "Level 11: + Sandboxed Thread-Safety" : "Level 11: + Long-term equilibrium feeds")}
                    {feedingLevel === 12 && (isCodeModeActive ? "Level 12: + Full-Fleet Cross-Examination" : "Level 12: + Full-Fleet debating syntheses")}
                  </span>
                </div>
              </div>

              {/* Input Toolbar actions */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center sm:justify-between pt-3 mt-3 border-t border-gray-800/50">
                <div className="flex items-center gap-2">
                  
                  {/* Image Attachment Button */}
                  <label className={`inline-flex items-center justify-center p-2 rounded-lg bg-slate-950/60 hover:bg-slate-900 border border-gray-805 text-cyan-404 hover:text-cyan-300 transition-colors cursor-pointer ${activeAttachment ? 'ring-1 ring-emerald-500/35 border-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:hover:text-emerald-400'}`} title="Attach diagnostic image or schema (PNG/JPG)">
                    <Paperclip className="w-4 h-4" />
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleAttachmentUpload(e, false)}
                      className="hidden"
                    />
                  </label>

                  {/* Auto Enhance prompt button */}
                  <button
                    onClick={handleEnhancePrompt}
                    disabled={enhancing || !promptInput}
                    className={`flex-grow sm:flex-grow-0 inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-300 border cursor-pointer ${
                      enhancing 
                        ? "bg-slate-900 border-slate-850 text-gray-500 cursor-not-allowed" 
                        : isCodeModeActive
                          ? "bg-purple-950/40 hover:bg-purple-500/10 border-purple-500/40 text-purple-300 hover:text-white"
                          : "bg-emerald-950/40 hover:bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:text-white"
                    }`}
                    title="Let Gemini optimize and enhance your prompt automatically using advanced schemas"
                  >
                    <Sparkles className={`w-3.5 h-3.5 shrink-0 ${enhancing ? 'animate-spin' : isCodeModeActive ? 'text-purple-400' : 'text-emerald-400'}`} />
                    <span>{enhancing ? "Enhancing..." : "Auto Enhance"}</span>
                  </button>

                  {/* Quick Preset workflow dropdown helper */}
                  <div className="flex-grow sm:flex-grow-0 relative inline-block text-left">
                    <select
                      value={activeWorkflowId}
                      onChange={(e) => setActiveWorkflowId(e.target.value)}
                      className={`w-full border rounded-lg text-xs px-3 py-2 sm:py-1.5 focus:outline-none cursor-pointer transition-colors ${
                        isCodeModeActive
                          ? "bg-[#100a2b] border-purple-500/25 text-purple-300 hover:bg-purple-950/40"
                          : "bg-slate-950/65 hover:bg-slate-900 border-gray-800 text-neutral-400 hover:text-white"
                      }`}
                      title="Inject predefined template adapter context"
                    >
                      {customWorkflows.map(workflow => (
                        <option key={workflow.id} value={workflow.id} className="bg-slate-950 text-neutral-350">
                          {workflow.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Send action Button */}
                <button
                  id="workspace_send_btn"
                  onClick={handleSendPrompt}
                  disabled={!promptInput.trim()}
                  className={`group relative px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider flex items-center space-x-1.5 overflow-hidden transition-all duration-300 cursor-pointer ${
                    promptInput.trim() 
                      ? isCodeModeActive
                        ? "bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.35)]"
                        : "bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_20px_rgba(16,185,129,0.35)]" 
                      : "bg-gray-850/60 text-gray-500 border border-gray-800 cursor-not-allowed shadow-none"
                  }`}
                >
                  <span>SEND PROMPT</span>
                  <Send className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Backdrop overlay for mobile */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-35 transition-opacity backdrop-blur-xs"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Floating Toolbox Secondary Sidebar (Supports Slide-in effect) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: isMobile ? "100%" : 0, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: isMobile ? "100%" : 0, opacity: 0 }}
            transition={{ type: "tween", duration: 0.25 }}
            className={`${
              isMobile 
                ? "fixed top-0 bottom-0 right-0 h-full z-40 w-[310px] sm:w-[330px] shadow-2xl border-l" 
                : "shrink-0 border-l w-[330px]"
            } ${
              isCodeModeActive 
                ? "bg-[#090616]/95 border-purple-950/40 shadow-[0_0_30px_rgba(168,85,247,0.06)]" 
                : "bg-[#090d16]/95 border-gray-800/60"
            } flex flex-col justify-between transition-all duration-700`}
          >
            {/* Sidebar Content Container */}
            <div className="p-5 space-y-6 overflow-y-auto flex-grow scrollbar-thin">
              
              {/* Box Title */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-800/60">
                <h3 className="font-display font-extrabold text-sm tracking-tight text-white flex items-center space-x-1.5">
                  <Sliders className={`w-4 h-4 transition-colors ${isCodeModeActive ? 'text-purple-400' : 'text-emerald-400'}`} />
                  <span>Interactive Toolbox</span>
                </h3>
                <div className="flex items-center space-x-2.5">
                  <span className="text-[9px] uppercase tracking-widest font-mono text-gray-400">Utilities</span>
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1 rounded bg-gray-900/40 hover:bg-white/5 text-gray-400 hover:text-white border border-gray-850 hover:border-gray-800 transition-all cursor-pointer"
                    title="Close Toolbox"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Utility Subtabs Nav */}
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 p-1 bg-slate-950 rounded-lg border border-gray-850 select-none">
                {(["workflows", "code", "image", "document", "audio", "vfx", "history"] as const).map(tabKey => (
                  <button
                    key={tabKey}
                    onClick={() => setActiveTab(tabKey)}
                    title={tabKey === "vfx" ? "VFX Engine Override parameters" : tabKey === "history" ? "Chat Sessions Database" : tabKey === "code" ? (isCodeModeActive ? "Code Fleet Synthesis" : "Swarm Scholarly Debate") : tabKey}
                    className={`py-1.5 rounded text-[8px] font-mono tracking-tighter uppercase transition-all cursor-pointer ${
                      activeTab === tabKey 
                        ? tabKey === "code" || tabKey === "vfx"
                          ? isCodeModeActive
                            ? "bg-purple-500/15 border border-purple-500/30 text-purple-300 font-extrabold"
                            : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-extrabold"
                          : tabKey === "history"
                          ? "bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-extrabold"
                          : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold" 
                        : "text-gray-500 hover:text-white"
                    }`}
                  >
                    {tabKey === "workflows" ? "flow" : tabKey === "code" ? (isCodeModeActive ? "code" : "debate") : tabKey === "history" ? "past" : tabKey.slice(0, 4)}
                  </button>
                ))}
              </div>

              {/* Panel views */}
              <div className="space-y-4">
                
                {/* 1. Workflows Presets Panel */}
                {activeTab === "workflows" && (
                  <div className="space-y-3">
                    <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
                      Presets inject targeted prompt adapters before queries, optimizing code output, narrative tone, or conceptual teaching.
                    </p>
                    <div className="space-y-2.5">
                      {customWorkflows.map(cw => (
                        <button
                          key={cw.id}
                          onClick={() => setActiveWorkflowId(cw.id)}
                          className={`w-full p-3.5 rounded-xl text-left border transition-all text-xs flex items-start space-x-3 cursor-pointer ${
                            activeWorkflowId === cw.id 
                              ? "bg-[#10b981]/5 border-emerald-500/40" 
                              : "bg-slate-900/40 border-gray-850 hover:bg-slate-900/85 hover:border-gray-800"
                          }`}
                        >
                          <div className={`p-2 rounded-lg shrink-0 ${activeWorkflowId === cw.id ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-950 text-gray-500'}`}>
                            {cw.id === "developer" ? <PenTool className="w-4 h-4" /> : cw.id === "creative" ? <Sparkle className="w-4 h-4" /> : cw.id === "socratic" ? <BookOpen className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                          </div>
                          <div>
                            <h4 className={`font-semibold font-display mb-0.5 ${activeWorkflowId === cw.id ? 'text-emerald-400' : 'text-neutral-200'}`}>{cw.name}</h4>
                            <p className="text-[10px] text-neutral-450 leading-relaxed font-sans">{cw.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 1.5. Special Purple/Emerald Synthesis Module */}
                {activeTab === "code" && (
                  <div className="space-y-4">
                    <div className={`p-3 rounded-xl relative overflow-hidden border ${
                      isCodeModeActive 
                        ? "bg-purple-950/15 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.05)]" 
                        : "bg-emerald-950/15 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                    }`}>
                      <div className={`absolute -right-6 -bottom-6 w-16 h-16 rounded-full blur-xl pointer-events-none ${
                        isCodeModeActive ? "bg-purple-500/10" : "bg-emerald-500/10"
                      }`} />
                      <div className={`flex items-center space-x-2 mb-1 relative z-10 ${isCodeModeActive ? 'text-purple-400' : 'text-emerald-400'}`}>
                        {isCodeModeActive ? <Terminal className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                        <h4 className="text-xs font-bold tracking-tight uppercase font-display">
                          {isCodeModeActive ? "Claude Lead Orchestrator" : "Claude Discourse Conductor"}
                        </h4>
                      </div>
                      <p className="text-[10.5px] text-zinc-300 leading-relaxed font-sans relative z-10 font-medium">
                        {isCodeModeActive
                          ? "Fuses parallel, diverse drafts from your active model fleet. Claude acts as the master refiner to craft optimal code."
                          : "Fuses parallel analytical, research briefs from your active model fleet. Claude acts as the master seminar evaluator."}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1 font-sans">
                        <label className={`text-[9px] uppercase tracking-wider font-mono font-bold block ${isCodeModeActive ? 'text-purple-300' : 'text-emerald-300'}`}>
                          {isCodeModeActive ? "Code Request / Feature Spec" : "Discourse Topic / Creative Subject"}
                        </label>
                        <textarea
                          value={codePromptInput}
                          onChange={(e) => setCodePromptInput(e.target.value)}
                          placeholder={
                            isCodeModeActive
                              ? "e.g. Write a React custom hook named useLocalStorage that handles expiration..."
                              : "e.g. Analyze the societal impacts of autonomous transport models on labor economics..."
                          }
                          className={`w-full bg-slate-950 border rounded-xl p-3 text-xs h-24 focus:outline-none resize-none leading-relaxed transition-colors duration-300 ${
                            isCodeModeActive
                              ? "border-purple-900/40 text-purple-100 placeholder-purple-900/60 focus:border-purple-500/40"
                              : "border-emerald-900/40 text-emerald-100 placeholder-emerald-900/60 focus:border-emerald-500/40"
                          }`}
                        />
                      </div>

                      {/* Information Feeding Selector Hub inside Panel */}
                      <div className={`p-3 border rounded-xl space-y-2 text-left ${
                        isCodeModeActive ? "bg-purple-950/20 border-purple-500/25" : "bg-emerald-950/20 border-emerald-500/25"
                      }`}>
                        <div className="flex items-center justify-between">
                          <label className={`text-[9px] uppercase tracking-wider font-mono font-bold block ${isCodeModeActive ? 'text-purple-300' : 'text-emerald-300'}`}>
                            {isCodeModeActive ? "Information Feeding Level" : "Scholarly Ingestion Level"}
                          </label>
                          <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            isCodeModeActive ? "bg-purple-500/10 text-purple-300" : "bg-emerald-500/10 text-emerald-300"
                          }`}>
                            {feedingLevel === 0 ? "STANDARD / OFF" : `${feedingLevel} NODES INGESTED`}
                          </span>
                        </div>
                        
                        {/* Selection buttons 8 to 12 */}
                        <div className={`grid grid-cols-6 gap-1 p-1 bg-slate-950 rounded-lg border ${isCodeModeActive ? 'border-purple-950/65' : 'border-emerald-950/65'}`}>
                          {([0, 8, 9, 10, 11, 12] as const).map(lvl => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => setFeedingLevel(lvl)}
                              className={`py-1 rounded text-[10px] font-mono font-bold tracking-tighter transition-all cursor-pointer ${
                                feedingLevel === lvl
                                  ? isCodeModeActive
                                    ? "bg-purple-600 border border-purple-500 text-white font-extrabold"
                                    : "bg-emerald-500 border border-emerald-400 text-black font-extrabold"
                                  : isCodeModeActive
                                    ? "text-gray-500 hover:text-zinc-200 hover:bg-purple-950/25"
                                    : "text-gray-500 hover:text-zinc-200 hover:bg-emerald-950/25"
                              }`}
                            >
                              {lvl === 0 ? "Off" : `${lvl}x`}
                            </button>
                          ))}
                        </div>

                        {/* Explanation of current module outcome & complexity */}
                        <div className={`p-2 rounded bg-black/45 border text-left ${isCodeModeActive ? 'border-purple-900/10' : 'border-emerald-900/10'}`}>
                          <span className={`block text-[8px] font-mono font-bold uppercase tracking-widest leading-none ${isCodeModeActive ? 'text-purple-400' : 'text-emerald-400'}`}>
                            {feedingLevel === 0 && "Standard Direct Prompting"}
                            {feedingLevel === 8 && "Level 8: Basic Scope & Syntax Parsing"}
                            {feedingLevel === 9 && (isCodeModeActive ? "Level 9: + Algorithmic Big-O Optimization" : "Level 9: + Scholarly Multi-Perspective Logic")}
                            {feedingLevel === 10 && (isCodeModeActive ? "Level 10: + Deep Boundary Condition Validation" : "Level 10: + Anomaly & Outlier validation")}
                            {feedingLevel === 11 && (isCodeModeActive ? "Level 11: + Sandboxed Thread-Safety Simulation" : "Level 11: + Long-term equilibrium analysis")}
                            {feedingLevel === 12 && (isCodeModeActive ? "Level 12: + Full-Fleet Cross-Examination" : "Level 12: + Full-Fleet debating syntheses")}
                          </span>
                          <p className="text-[9px] text-zinc-400 leading-normal mt-1 font-sans">
                            {feedingLevel === 0 && "Disables customized parameter injections. System passes your prompt to the selected models completely untouched and raw."}
                            {feedingLevel === 8 && (isCodeModeActive ? "Ideal for fast modules. Focuses on code layout." : "Ideal for crisp synthesis. Focuses on thesis layouts and direct answers.")}
                            {feedingLevel === 9 && (isCodeModeActive ? "Deepens code architecture to evaluate nested loops, algorithmic efficiency, and memory leaks." : "Ingests divergent historical schools of thought, mapping trade-offs & logical anomalies.")}
                            {feedingLevel === 10 && (isCodeModeActive ? "Appends extensive stress testing logic, exception triggers, and side-effect isolation." : "Appends analytical edge-case assessments, tail-risks, and outlier stress tests.")}
                            {feedingLevel === 11 && (isCodeModeActive ? "Adds lock safety limits, memory heap guidelines, and runtime thread evaluations." : "Appends feedback-loops, indirect societal consequences, and compound structural patterns.")}
                            {feedingLevel === 12 && (isCodeModeActive ? "Maximum quality optimization cascade. Selected fleet aligns and critiques logic iteratively." : "Maximum creative/critical synthesis. Fleet engages in intensive cross-critique panels.")}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleCodeSynthesis}
                        disabled={compositeState === "synthesis-fleet" || compositeState === "claude-refining" || !codePromptInput.trim()}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all relative flex items-center justify-center space-x-2 border cursor-pointer ${
                          codePromptInput.trim() && compositeState !== "synthesis-fleet" && compositeState !== "claude-refining"
                            ? isCodeModeActive
                              ? "bg-purple-600 hover:bg-purple-500 text-white border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_22px_rgba(168,85,247,0.5)] font-display"
                              : "bg-emerald-600 hover:bg-emerald-500 text-black border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_22px_rgba(16,185,129,0.5)] font-display"
                            : "bg-gray-850/60 border-gray-800 text-gray-500 cursor-not-allowed shadow-none"
                        }`}
                      >
                        {isCodeModeActive ? <Code className="w-4 h-4 shrink-0" /> : <BookOpen className="w-4 h-4 shrink-0" />}
                        <span>
                          {compositeState === "synthesis-fleet" 
                            ? "Gathering Fleet Drafts..." 
                            : compositeState === "claude-refining"
                              ? isCodeModeActive ? "Claude Refining master module..." : "Claude Aligning sovereign insights..."
                              : isCodeModeActive ? "Synthesize Master Code" : "Synthesize Scholars Swarm"}
                        </span>
                      </button>
                    </div>

                    {/* Collaborative Multi-Model Progress Board */}
                    {(compositeState === "synthesis-fleet" || compositeState === "claude-refining" || compositeState === "completed" || compositeState === "error") && (
                      <div className="space-y-3 pt-2">
                        <div className={`border p-3 rounded-xl space-y-2.5 shadow-inner ${
                          isCodeModeActive 
                            ? "border-purple-900/20 bg-[#0e0a1b]" 
                            : "border-emerald-900/20 bg-[#07130a]"
                        }`}>
                          <label className={`text-[9px] uppercase tracking-wider font-mono font-bold block ${isCodeModeActive ? 'text-purple-400' : 'text-emerald-400'}`}>
                            {isCodeModeActive ? "Intelligence Assembly Pipeline" : "Deliberative Argumentative Pipeline"}
                          </label>
                          
                          {/* Selected fleet progress indicators */}
                          <div className="space-y-1.5 max-h-[160px] overflow-y-auto scrollbar-thin">
                            {activeModels.map(m => {
                              const status = fleetLoading[m.id] || "idle";
                              return (
                                <div key={m.id} className={`flex items-center justify-between text-[10px] py-1 bg-slate-950/40 px-2 rounded-lg border ${
                                  isCodeModeActive ? 'border-purple-950/25' : 'border-emerald-950/25'
                                }`}>
                                  <span className="flex items-center gap-1.5 font-bold text-zinc-300 font-sans">
                                    <span className={`w-1.5 h-1.5 rounded-full ${m.bgColor}`} />
                                    {m.name}
                                  </span>
                                  <span className="font-mono text-[9px]">
                                    {status === "running" && <span className="text-amber-400 animate-pulse font-bold">Drafting...</span>}
                                    {status === "done" && <span className="text-emerald-400 flex items-center gap-0.5 font-bold">✓ Ready</span>}
                                    {status === "failed" && <span className="text-rose-400 font-bold">✗ Failed</span>}
                                    {status === "idle" && <span className="text-zinc-500 font-bold">Queued</span>}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Claude Lead step indicator */}
                          <div className={`p-2 rounded-xl flex items-center justify-between text-[10.5px] border ${
                            isCodeModeActive 
                              ? "bg-purple-950/10 border-purple-500/10" 
                              : "bg-emerald-950/10 border-emerald-500/10"
                          }`}>
                            <span className={`flex items-center gap-1.5 font-bold ${isCodeModeActive ? 'text-purple-300' : 'text-emerald-300'}`}>
                              <Cpu className={`w-4 h-4 ${isCodeModeActive ? 'text-purple-400' : 'text-emerald-400'} ${compositeState === "claude-refining" ? 'animate-spin' : ''}`} />
                              {isCodeModeActive ? "Lead Synthesis (Claude)" : "Lead Consensus (Claude)"}
                            </span>
                            <span className="font-mono font-bold">
                              {compositeState === "synthesis-fleet" && <span className="text-zinc-500">Awaiting drafts</span>}
                              {compositeState === "claude-refining" && <span className={`${isCodeModeActive ? 'text-purple-400' : 'text-emerald-400'} animate-pulse`}>Fusing insights...</span>}
                              {compositeState === "completed" && <span className="text-emerald-400 font-semibold">✓ Concluded</span>}
                              {compositeState === "error" && <span className="text-rose-400">✗ Blocked</span>}
                            </span>
                          </div>
                        </div>

                        {/* Claude's output visualization area */}
                        {claudeUnifiedResult && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <label className={`text-[10px] uppercase tracking-wider font-mono font-bold block ${isCodeModeActive ? 'text-purple-400' : 'text-emerald-400'}`}>
                                {isCodeModeActive ? "Claude's Master Synthesis" : "Claude's Strategic Consensus"}
                              </label>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(claudeUnifiedResult);
                                }}
                                className={`text-[9.5px] font-mono flex items-center gap-1 border px-2 py-0.5 rounded cursor-pointer transition-all hover:bg-slate-950/40 ${
                                  isCodeModeActive 
                                    ? "text-purple-300 border-purple-500/20 hover:text-white" 
                                    : "text-emerald-300 border-emerald-500/20 hover:text-white"
                                }`}
                              >
                                <Copy className="w-3 h-3" />
                                {isCodeModeActive ? "Copy Code" : "Copy Thesis"}
                              </button>
                            </div>

                            <div className={`p-3 border rounded-xl max-h-[220px] overflow-y-auto font-mono text-[10.5px] leading-relaxed scrollbar-thin select-text ${
                              isCodeModeActive 
                                ? "border-purple-500/20 bg-[#06030c] text-purple-100" 
                                : "border-emerald-500/20 bg-[#030c05] text-emerald-100"
                            }`}>
                              <pre className="whitespace-pre-wrap">{claudeUnifiedResult}</pre>
                            </div>

                            <button
                              onClick={() => {
                                setPromptInput(isCodeModeActive 
                                  ? `Adopt Claude's Master Code Synthesizer structure for further actions:\n\n\`\`\`\n${claudeUnifiedResult}\n\`\`\``
                                  : `Adopt Claude's Scholars Consensus Thesis for further actions:\n\n${claudeUnifiedResult}`
                                );
                              }}
                              className={`w-full py-1.5 rounded-lg border text-[10px] font-semibold transition-colors cursor-pointer ${
                                isCodeModeActive 
                                  ? "border-purple-500/20 bg-purple-950/15 hover:bg-purple-950/30 text-purple-200" 
                                  : "border-emerald-500/20 bg-emerald-950/15 hover:bg-emerald-950/30 text-emerald-200"
                              }`}
                            >
                              {isCodeModeActive ? "Feed Master Output to main Workspace prompt" : "Feed Scholars Thesis to main Workspace prompt"}
                            </button>
                          </motion.div>
                        )}

                        {codeError && (
                          <div className="p-3 text-[11px] text-rose-400 bg-rose-950/15 border border-rose-900/30 rounded-xl font-mono leading-relaxed">
                            {codeError}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Image Generator Panel */}
                {activeTab === "image" && (
                  <div className="space-y-4">
                    {/* Sub tabs */}
                    <div className="bg-slate-950 p-0.5 rounded-lg border border-gray-900 flex text-[10px] h-8 shrink-0">
                      <button
                        onClick={() => setImageSubTab("generate")}
                        className={`flex-1 py-1 rounded-md font-mono tracking-wider transition-all uppercase cursor-pointer ${
                          imageSubTab === "generate"
                            ? "bg-slate-800 text-cyan-400 font-bold"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        Asset Gen
                      </button>
                      <button
                        onClick={() => setImageSubTab("scan")}
                        className={`flex-1 py-1 rounded-md font-mono tracking-wider transition-all uppercase cursor-pointer ${
                          imageSubTab === "scan"
                            ? "bg-slate-800 text-emerald-400 font-bold"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        Vision Scan
                      </button>
                    </div>

                    {imageSubTab === "generate" ? (
                      <div className="space-y-4">
                        <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
                          Create original visual assets using <span className="text-cyan-400">Recraft Pro v4</span> directly, specializing in vector mocks, creative designs, and realism.
                        </p>

                        <div className="space-y-3">
                          <textarea
                            value={imagePrompt}
                            onChange={(e) => setImagePrompt(e.target.value)}
                            placeholder="A futuristic synthwave workstation with neon wireframe schematics, high detail..."
                            className="w-full bg-slate-950 border border-gray-850 rounded-xl p-3 text-xs h-20 text-neutral-200 placeholder-gray-550 focus:outline-none resize-none leading-relaxed"
                          />

                          <button
                            onClick={handleGenerateImage}
                            disabled={imgRunning || !imagePrompt.trim()}
                            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all relative flex items-center justify-center space-x-2 border cursor-pointer ${
                              imagePrompt.trim() && !imgRunning
                                ? "bg-cyan-500 hover:bg-cyan-400 text-black border-cyan-400 hover:shadow-[0_0_15px_rgba(6,180,212,0.35)]"
                                : "bg-gray-850 border-gray-800 text-gray-500 cursor-not-allowed"
                            }`}
                          >
                            <ImageIcon className="w-4 h-4 shrink-0" />
                            <span>{imgRunning ? "Generating Image..." : "Generate Asset"}</span>
                          </button>
                        </div>

                        {/* Image result card */}
                        <AnimatePresence>
                          {generatedImg && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0 }}
                              className="p-2 border border-gray-800 bg-[#090d16] rounded-xl relative"
                            >
                              <img 
                                src={generatedImg} 
                                alt="Generated Asset" 
                                className="w-full h-auto aspect-square rounded-lg object-cover bg-black"
                                referrerPolicy="no-referrer"
                              />
                              <button
                                onClick={() => {
                                  // Use generated image to fill the chat prompt!
                                  setPromptInput(`Review this generated visual schema details: [Assets loaded]`);
                                }}
                                className="absolute bottom-4 right-4 bg-black/80 hover:bg-black text-emerald-400 border border-emerald-500/20 text-[9px] font-mono px-2 py-1 rounded cursor-pointer"
                              >
                                Import to Prompt
                              </button>
                            </motion.div>
                          )}

                          {imgError && (
                            <div className="p-3 text-[11px] text-rose-400 bg-rose-950/15 border border-rose-900/30 rounded-xl font-mono leading-relaxed">
                              {imgError}
                            </div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
                          Ingest screenshots, layouts, architectural drawings or logs. Our backend scans and indexes design hierarchies and visual nodes.
                        </p>

                        <div className="space-y-1.5 text-left">
                          <label className={`text-[8.5px] uppercase tracking-wider font-mono font-bold ${isCodeModeActive ? 'text-purple-300' : 'text-emerald-300'} block`}>
                            Vision Scanner Target Mode
                          </label>
                          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-gray-900/40">
                            {[
                              { id: "general", label: "General Visual", desc: "Scene details & colors" },
                              { id: "ui", label: "UI / React Clone", desc: "Converts mockup to code" },
                              { id: "ocr", label: "Text / Logs OCR", desc: "Transcribes files verbatim" },
                              { id: "diagram", label: "Diagram / Flow", desc: "Deconstructs flowchart nodes" }
                            ].map(item => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => setScanMode(item.id as any)}
                                className={`p-2 rounded-lg text-left transition-all cursor-pointer ${
                                  scanMode === item.id
                                    ? isCodeModeActive
                                      ? "bg-purple-950/40 border border-purple-500/30 text-purple-200"
                                      : "bg-emerald-950/40 border border-emerald-500/30 text-emerald-200"
                                    : "bg-[#0b0f19] border border-transparent hover:bg-slate-900 text-zinc-400"
                                }`}
                              >
                                <span className="block text-[9.5px] font-bold font-mono">{item.label}</span>
                                <span className="block text-[8px] text-zinc-500 font-sans leading-tight mt-0.5">{item.desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {!scanAttachment ? (
                          <label className="border border-dashed border-zinc-800 hover:border-zinc-700 bg-[#05070c]/50 hover:bg-[#070b14]/55 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all text-center">
                            <FileUp className="w-7 h-7 text-cyan-400 mb-2" />
                            <span className="text-xs font-bold text-neutral-250">Drop or browse scheme</span>
                            <span className="text-[9.5px] text-zinc-550 font-mono mt-1">Accepts schemas & diagrams</span>
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => handleAttachmentUpload(e, true)}
                              className="hidden"
                            />
                          </label>
                        ) : (
                          <div className="space-y-3.5">
                            <div className="border border-gray-850 bg-slate-950/80 rounded-xl p-2 relative">
                              <img 
                                src={scanAttachment.previewUrl} 
                                alt="Scheme preview" 
                                className="w-full h-auto max-h-36 object-contain rounded-lg bg-black/40"
                              />
                              <button
                                type="button"
                                onClick={() => setScanAttachment(null)}
                                className="absolute top-4 right-4 bg-rose-600 hover:bg-rose-500 text-white rounded-full p-1 shadow-md transition-colors cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={handleScanImage}
                                disabled={scanRunning}
                                className={`flex-grow py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 border ${
                                  scanRunning
                                    ? "bg-slate-900 border-slate-800 text-gray-500 cursor-not-allowed animate-pulse"
                                    : "bg-emerald-500 hover:bg-emerald-400 text-black border-emerald-400 cursor-pointer"
                                }`}
                              >
                                <Activity className="w-3.5 h-3.5 shrink-0" />
                                <span>{scanRunning ? "Scanning Node..." : "Scan Schematic"}</span>
                              </button>
                              
                              <button
                                onClick={() => setScanAttachment(null)}
                                className="px-3 py-2 rounded-xl bg-slate-950 border border-gray-850 hover:bg-slate-900 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                                title="Clear Asset"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}

                        {scanRunning && (
                          <div className="p-3 bg-slate-950 border border-emerald-900/30 rounded-xl space-y-1.5 text-center animate-pulse">
                            <Activity className="w-4 h-4 text-emerald-450 animate-spin mx-auto" />
                            <span className="block text-[9.5px] font-mono text-emerald-400 uppercase tracking-widest font-bold">Quantum Vision Diagnostic...</span>
                          </div>
                        )}

                        {scanResult && (
                          <div className="space-y-3">
                            <div className="p-3 bg-slate-950 border border-gray-850 rounded-xl h-44 overflow-y-auto scrollbar-thin text-left">
                              <span className="block text-[8px] font-mono text-cyan-400 uppercase tracking-widest font-bold border-b border-gray-900 pb-1.5 mb-2">Visual Report Logs</span>
                              <div className="text-[10px] text-zinc-300 leading-normal font-mono whitespace-pre-wrap select-text">
                                {scanResult}
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                setPromptInput(prev => {
                                  const textWithFeedback = `Review this scanned layout report findings:\n${scanResult}\n\n${prev}`;
                                  return textWithFeedback;
                                });
                              }}
                              className="w-full py-2 bg-gradient-to-r from-[#0d121f] to-[#120a2e] hover:from-cyan-950/20 hover:to-purple-950/20 text-cyan-400 hover:text-white border border-cyan-800/25 rounded-lg text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer"
                            >
                              Inject Results to prompt
                            </button>
                          </div>
                        )}

                        {scanError && (
                          <div className="p-3 text-[10px] text-rose-400 bg-rose-950/15 border border-rose-900/30 rounded-xl font-mono leading-relaxed text-left">
                            {scanError}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Document Summarizer Panel */}
                {activeTab === "document" && (
                  <div className="space-y-4">
                    <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
                      Upload system log files, design outlines, or raw text blocks. Gemini extracts theses and actionable insights in real-time.
                    </p>

                    <div className="space-y-2">
                      <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-800 hover:border-emerald-500/40 rounded-xl bg-slate-950/40 text-center cursor-pointer group transition-colors">
                        <FileUp className="w-8 h-8 text-gray-500 group-hover:text-emerald-400 mb-2 transition-colors" />
                        <span className="text-xs text-neutral-300 font-semibold">Select document text log</span>
                        <span className="text-[10px] text-slate-500 mt-1 font-mono">(.txt, .md size limits)</span>
                        <input
                          type="file"
                          accept=".txt,.md,.json"
                          onChange={handleUploadDocumentText}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <AnimatePresence>
                      {summaryRunning && (
                        <div className="py-8 flex flex-col items-center justify-center text-center">
                          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
                          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest animate-pulse">Running Summarizer...</p>
                        </div>
                      )}

                      {summaryOutput && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-2.5"
                        >
                          <div className="p-3 border border-gray-850 bg-slate-950 rounded-xl max-h-[160px] overflow-y-auto shrink-0 scrollbar-thin">
                            <span className="text-[9px] font-mono text-slate-500 block mb-1">Doc Title: {docFileName || 'Parsed file'}</span>
                            <p className="text-neutral-300 text-[11px] leading-relaxed whitespace-pre-wrap">{summaryOutput}</p>
                          </div>
                          
                          <button
                            onClick={() => {
                              // Feed output directly to the prompt block
                              setPromptInput(`Analyze the following synthesized document outputs:\n\n${summaryOutput}`);
                            }}
                            className="w-full py-1.5 rounded-lg border border-gray-800 hover:border-gray-700 bg-gray-900 text-[10px] text-neutral-300 hover:text-white transition-colors"
                          >
                            Inject summary into prompt field
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* 4. Audio Transcriber Panel */}
                {activeTab === "audio" && (
                  <div className="space-y-4">
                    <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
                      Simulate a voice dictation recording. Select a context theme, and our pipeline transcription returns formatted speech text.
                    </p>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wide text-gray-500 font-mono">Dictation Topic</label>
                        <input
                          type="text"
                          value={audioTopicInput}
                          onChange={(e) => setAudioTopicInput(e.target.value)}
                          placeholder="EV hypercar aerodynamic performance metrics..."
                          className="w-full bg-slate-950 border border-gray-850 rounded-xl p-2.5 text-xs text-neutral-200 focus:outline-none"
                        />
                      </div>

                      <button
                        onClick={handleTranscribeAudioMessage}
                        disabled={audioRunning}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center space-x-2 cursor-pointer ${
                          audioRunning
                            ? "bg-slate-900 border-slate-800 text-gray-500 cursor-not-allowed"
                            : "bg-purple-600 hover:bg-purple-500 border-purple-500 hover:shadow-[0_0_15px_rgba(168,85,247,0.35)] text-white"
                        }`}
                      >
                        <Volume2 className={`w-4 h-4 shrink-0 ${audioRunning ? 'animate-pulse' : ''}`} />
                        <span>{audioRunning ? "Recording & Transcribing..." : "Simulate Audio Prompt"}</span>
                      </button>
                    </div>

                    <AnimatePresence>
                      {transcribedText && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-2"
                        >
                          <div className="p-3 border border-purple-900/30 bg-purple-950/10 rounded-xl">
                            <span className="text-[9px] uppercase tracking-wider font-mono text-purple-400 block mb-1">Transcribed Dictation</span>
                            <p className="text-neutral-300 text-[11px] leading-relaxed italic">"{transcribedText}"</p>
                          </div>
                          
                          <button
                            onClick={() => {
                              setPromptInput(transcribedText);
                            }}
                            className="w-full py-1.5 rounded-lg border border-purple-900/40 bg-purple-950/10 hover:bg-purple-900/20 text-[10px] text-purple-300 transition-colors"
                          >
                            Use as current prompt text
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* 5. Ultra-Pro VFX & Animation Engine Override Panel (Senior VFX Supervisor Console) */}
                {activeTab === "vfx" && (
                  <div className="space-y-4">
                    {/* Diagnostic Monitor Panel */}
                    <div className={`p-3 border rounded-xl relative overflow-hidden backdrop-blur-md ${
                      isCodeModeActive 
                        ? "bg-purple-950/10 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.05)]" 
                        : "bg-emerald-950/10 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-1.5">
                          <Cpu className={`w-3.5 h-3.5 ${isCodeModeActive ? 'text-purple-400' : 'text-emerald-400'}`} />
                          <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-white">Engine Telemetry</span>
                        </div>
                        <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded ${
                          isCodeModeActive ? 'bg-purple-500/10 text-purple-300' : 'bg-emerald-500/10 text-emerald-300'
                        }`}>
                          {isCodeModeActive ? "ULTRA-PRO ENABLED" : "AI STD RUNTIME"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-zinc-400 font-normal">
                        <div className="p-1.5 bg-slate-950/80 rounded border border-gray-900">
                          <span className="block text-gray-550 uppercase text-[7.5px] tracking-tight">Active Framerate</span>
                          <span className={`text-[10.5px] font-bold ${isCodeModeActive ? 'text-purple-300' : 'text-emerald-300'}`}>
                            {telemetryFps} FPS
                          </span>
                        </div>
                        <div className="p-1.5 bg-slate-950/80 rounded border border-gray-900">
                          <span className="block text-gray-550 uppercase text-[7.5px] tracking-tight">Frame Interval</span>
                          <span className="text-[10.5px] font-bold text-white">
                            {(1000 / telemetryFps).toFixed(2)} ms
                          </span>
                        </div>
                        <div className="p-1.5 bg-slate-950/80 rounded border border-gray-900">
                          <span className="block text-gray-550 uppercase text-[7.5px] tracking-tight">Shading Engine</span>
                          <span className="text-[9.5px] text-zinc-300 font-bold truncate">
                            {vfxShaderMode === "path-traced" ? "Path-Traced" : "Raster Ambient"}
                          </span>
                        </div>
                        <div className="p-1.5 bg-slate-950/80 rounded border border-gray-900">
                          <span className="block text-gray-550 uppercase text-[7.5px] tracking-tight">VRAM Heap Cache</span>
                          <span className="text-[10.5px] text-zinc-300 font-bold">{telemetryVram} MB</span>
                        </div>
                      </div>

                      {/* Mock Real-time Visual Trace Line Chart */}
                      <div className="mt-2.5 h-6 w-full bg-slate-950/90 rounded border border-gray-900 flex items-center justify-center p-1 relative overflow-hidden">
                        <svg className="w-full h-full text-purple-400" viewBox="0 0 100 20" preserveAspectRatio="none">
                          <path
                            d={telemetryPath}
                            fill="none"
                            stroke={isCodeModeActive ? "rgba(168,85,247,0.75)" : "rgba(168,85,247,0.75)"}
                            strokeWidth="1"
                            className="transition-all duration-150"
                          />
                        </svg>
                        <span className="absolute bottom-0.5 right-1 text-[6.5px] text-zinc-500 font-mono tracking-widest uppercase">LIVE OSCILLOSCOPE</span>
                      </div>
                    </div>
                                      {/* Master Sub-Tab Selector and Specs tabs removed – direct Overrides HUD render */}
                    <div className="space-y-3.5">
                      <div className="border-t border-gray-900/60 pt-2">
                        <span className="text-[9.5px] font-mono uppercase tracking-wider text-gray-400 block mb-2">Pillar 1: Color Space Theme Override</span>
                        <div className="flex flex-wrap gap-1">
                          {[
                            { id: "stellar-orbit", label: "Stellar Purple", color: "bg-purple-600" },
                            { id: "aurora-emerald", label: "Aurora Emerald", color: "bg-emerald-500" },
                            { id: "hyper-cyan", label: "Hyper Cyan", color: "bg-cyan-400" },
                            { id: "solar-flare", label: "Solar Flare", color: "bg-orange-500" },
                            { id: "monochrome", label: "Monochrome Pass", color: "bg-slate-400" }
                          ].map(preset => (
                            <button
                              key={preset.id}
                              onClick={() => setVfxColorPreset(preset.id)}
                              className={`px-2 py-1 rounded text-[9px] font-medium transition-all flex items-center space-x-1 border cursor-pointer ${
                                vfxColorPreset === preset.id
                                  ? isCodeModeActive
                                    ? "bg-purple-600/15 border-purple-500 text-purple-200"
                                    : "bg-emerald-500/15 border-emerald-500 text-emerald-200"
                                  : "border-gray-850 bg-slate-900/40 text-gray-450 hover:text-white"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${preset.color}`} />
                              <span>{preset.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Shading Model Select */}
                      <div className="space-y-1">
                        <label className="text-[9.5px] font-mono uppercase tracking-wider text-gray-400 block">Render Pipeline Shading Mode</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => setVfxShaderMode("path-traced")}
                            className={`py-1.5 rounded text-[9.5px] font-bold border transition-colors cursor-pointer ${
                              vfxShaderMode === "path-traced"
                                ? isCodeModeActive ? "bg-purple-600/10 border-purple-500 text-purple-300" : "bg-emerald-500/10 border-emerald-500 text-emerald-300"
                                : "bg-slate-950 border-gray-850 text-gray-500"
                            }`}
                          >
                            Path-Traced Space Dust
                          </button>
                          <button
                            onClick={() => setVfxShaderMode("ambient")}
                            className={`py-1.5 rounded text-[9.5px] font-bold border transition-colors cursor-pointer ${
                              vfxShaderMode === "ambient"
                                ? isCodeModeActive ? "bg-purple-600/10 border-purple-500 text-purple-300" : "bg-emerald-500/10 border-emerald-500 text-emerald-300"
                                : "bg-slate-950 border-gray-850 text-gray-450 hover:text-white"
                            }`}
                          >
                            Ambient Nebula Grid
                          </button>
                        </div>
                      </div>

                      {/* Pillar 2: Motion, Fluidity & Timing */}
                      <div className="border-t border-gray-900/60 pt-3.5 space-y-3">
                        <span className="text-[9.5px] font-mono uppercase tracking-wider text-gray-400 block">Pillar 2: Motion & Timing Overrides</span>
                        
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[9px] font-mono">
                            <span className="text-zinc-500">Target Framerate Limit</span>
                            <span className="text-right text-gray-300 font-bold">{vfxFpsCap === 999 ? "Unlimited VSync" : `${vfxFpsCap} FPS`}</span>
                          </div>
                          <div className="flex gap-1">
                            {[30, 60, 120, 240, 999].map(fps => (
                              <button
                                key={fps}
                                onClick={() => setVfxFpsCap(fps)}
                                className={`flex-grow py-1 rounded text-[9px] font-mono border cursor-pointer ${
                                  vfxFpsCap === fps
                                    ? isCodeModeActive ? "bg-purple-600 border-purple-500 text-white" : "bg-emerald-500 border-emerald-400 text-black font-extrabold"
                                    : "bg-slate-950 border-gray-850 text-gray-450 hover:text-white"
                                }`}
                              >
                                {fps === 999 ? "VSync" : fps}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Trail Width slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-mono">
                            <span className="text-zinc-500">Cursor Trace Ribbon Width</span>
                            <span className="text-gray-300">{vfxTrailWidth}px</span>
                          </div>
                          <input
                            type="range"
                            min="2"
                            max="20"
                            value={vfxTrailWidth}
                            onChange={(e) => setVfxTrailWidth(Number(e.target.value))}
                            className={`w-full accent-current cursor-pointer ${isCodeModeActive ? 'text-purple-500' : 'text-emerald-500'}`}
                          />
                        </div>

                        {/* Trail Length slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-mono">
                            <span className="text-zinc-500">Cursor Trace Ribbon Length (Taper)</span>
                            <span className="text-gray-300">{vfxTrailLength} points</span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="50"
                            value={vfxTrailLength}
                            onChange={(e) => setVfxTrailLength(Number(e.target.value))}
                            className={`w-full accent-current cursor-pointer ${isCodeModeActive ? 'text-purple-500' : 'text-emerald-500'}`}
                          />
                        </div>
                      </div>

                      {/* Pillar 3 & 4: Particle Physics & Optimization */}
                      <div className="border-t border-gray-900/60 pt-3.5 space-y-3">
                        <span className="text-[9.5px] font-mono uppercase tracking-wider text-gray-400 block">Pillar 3 & 4: Physics & Space Overrides</span>
                        
                        {/* Collision burst particles on click slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-mono">
                            <span className="text-zinc-500">Supernova Particle Burst Count (On Click)</span>
                            <span className="text-gray-300">{vfxParticleCount} stardust particles</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            value={vfxParticleCount}
                            onChange={(e) => setVfxParticleCount(Number(e.target.value))}
                            className={`w-full accent-current cursor-pointer ${isCodeModeActive ? 'text-purple-500' : 'text-emerald-500'}`}
                          />
                        </div>

                        {/* Friction parameter */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-mono">
                            <span className="text-zinc-500">Physics Drag Friction Coefficient</span>
                            <span className="text-gray-300">{(vfxPhysicsFriction * 100).toFixed(0)}% resistance</span>
                          </div>
                          <input
                            type="range"
                            min="90"
                            max="99"
                            value={vfxPhysicsFriction * 100}
                            onChange={(e) => setVfxPhysicsFriction(Number(e.target.value) / 100)}
                            className={`w-full accent-current cursor-pointer ${isCodeModeActive ? 'text-purple-500' : 'text-emerald-500'}`}
                          />
                        </div>

                        {/* Constellation lattice distance slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-mono">
                            <span className="text-zinc-500">Constellation Lattice Link Boundary</span>
                            <span className="text-gray-300">{vfxLatticeDist}px radius</span>
                          </div>
                          <input
                            type="range"
                            min="50"
                            max="240"
                            value={vfxLatticeDist}
                            onChange={(e) => setVfxLatticeDist(Number(e.target.value))}
                            className={`w-full accent-current cursor-pointer ${isCodeModeActive ? 'text-purple-500' : 'text-emerald-500'}`}
                          />
                        </div>
                      </div>

                      {/* Post-Processing effects */}
                      <div className="border-t border-gray-900/60 pt-3.5 space-y-3">
                        <span className="text-[9.5px] font-mono uppercase tracking-wider text-gray-400 block">Pillar 5: Post-Processing Overrides</span>
                        
                        {/* Bloom Glow size slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-mono">
                            <span className="text-zinc-500">Volumetric Mouse Glow Bloom Radius</span>
                            <span className="text-gray-300">{vfxBloomGlow * 15}px</span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="30"
                            value={vfxBloomGlow}
                            onChange={(e) => setVfxBloomGlow(Number(e.target.value))}
                            className={`w-full accent-current cursor-pointer ${isCodeModeActive ? 'text-purple-500' : 'text-emerald-500'}`}
                          />
                        </div>

                        {/* Chromatic aberration splits px */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-mono">
                            <span className="text-zinc-500">Chromatic Aberration Channel Offset</span>
                            <span className="text-gray-300">{vfxAberration}px RGB separation</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="12"
                            value={vfxAberration}
                            onChange={(e) => setVfxAberration(Number(e.target.value))}
                            className={`w-full accent-current cursor-pointer ${isCodeModeActive ? 'text-purple-500' : 'text-emerald-500'}`}
                          />
                        </div>

                        {/* Interactive Audio Feedback Synthesis Toggle */}
                        <div className="flex items-center justify-between border-t border-gray-900/40 pt-2.5">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-mono font-bold text-gray-300 uppercase">Holographic Audio Synth</span>
                            <span className="text-[8px] font-mono text-zinc-500 max-w-[190px]">Synthesizes real-time frequency chimes and cosmic scan sweep triggers</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setVfxSoundEnabled(!vfxSoundEnabled)}
                            className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-300 ${
                              vfxSoundEnabled 
                                ? (isCodeModeActive ? "bg-purple-600 shadow-[0_0_8px_rgba(168,85,247,0.5)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]") 
                                : "bg-neutral-800"
                            }`}
                            title="Toggle Audio Synthesis Core"
                          >
                            <span
                              className={`pointer-events-none inline-block h-3.5 h-3.5 transform rounded-full bg-neutral-200 shadow ring-0 transition duration-300 ease-in-out ${
                                vfxSoundEnabled ? "translate-x-3.5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Diagnostics Action Button */}
                      <button
                        onClick={() => {
                          const clickEvent = new MouseEvent("click", {
                            clientX: window.innerWidth / 2,
                            clientY: window.innerHeight / 2,
                            bubbles: true
                          });
                          window.dispatchEvent(clickEvent);
                        }}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all relative flex items-center justify-center space-x-2 border cursor-pointer mt-2 ${
                          isCodeModeActive
                            ? "bg-purple-600 hover:bg-purple-500 text-white border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                            : "bg-emerald-500 hover:bg-emerald-400 hover:shadow-[0_0_12px_rgba(16,185,129,0.3)] text-black border-emerald-450 font-display font-extrabold"
                        }`}
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Trigger Direct Supernova Burst</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 6. History & Passcode Session Database Panel */}
                {activeTab === "history" && (
                  <div className="space-y-4 text-left">
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                      Durable multi-session database. All chat flows are securely partitioned by your unique passcode identity.
                    </p>

                    {/* Passcode Login HUD */}
                    <div className="p-3 bg-slate-950/90 border border-gray-850 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Identity Login</span>
                        <div className="flex items-center space-x-1.5 font-mono">
                          <span className={`inline-block w-1.5 h-1.5 rounded-full animate-pulse ${
                            syncStatus === "syncing" ? "bg-amber-400" :
                            syncStatus === "synced" ? "bg-emerald-400" :
                            syncStatus === "error" ? "bg-rose-500" : "bg-cyan-400"
                          }`} />
                          <span className={`text-[8px] uppercase tracking-wider font-extrabold ${
                            syncStatus === "syncing" ? "text-amber-400" :
                            syncStatus === "synced" ? "text-emerald-400" :
                            syncStatus === "error" ? "text-rose-500" : "text-cyan-400"
                          }`}>
                            {syncStatus === "syncing" && "Device Syncing..."}
                            {syncStatus === "synced" && "Cloud Synchronized"}
                            {syncStatus === "error" && "Offline / Sync Error"}
                            {syncStatus === "idle" && "Active Session Core"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 font-mono">
                        <div className="text-[11px] text-zinc-300">
                          Current ID: <span className="text-emerald-400 font-extrabold tracking-wider">{userPasscode || "None"}</span>
                        </div>
                        
                        {/* Interactive switch form */}
                        <div className="space-y-1.5 text-left">
                          <label className="text-[8.5px] uppercase text-zinc-500 tracking-wider block">Login / Switch ID (11 chars)</label>
                          <div className="flex gap-1.5">
                            <input 
                              type="text"
                              placeholder="e.g. aB2x-8pYk-9Q7"
                              id="history_passcode_input"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const btn = document.getElementById("history_login_btn");
                                  btn?.click();
                                }
                              }}
                              className="bg-black/60 border border-gray-850 hover:border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 flex-grow"
                            />
                            <button
                              id="history_login_btn"
                              onClick={() => {
                                const inputEl = document.getElementById("history_passcode_input") as HTMLInputElement;
                                if (!inputEl) return;
                                const rawVal = inputEl.value.trim();
                                const cleanCode = rawVal.replace(/[^A-Za-z0-9]/g, "");
                                if (cleanCode.length !== 11) {
                                  alert("Please enter a valid 11-character high-entropy passcode.");
                                  return;
                                }
                                syncAndSwitchIdentity(cleanCode);
                                inputEl.value = "";
                              }}
                              className="px-2.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black border border-cyan-400 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-[0_0_10px_rgba(6,180,212,0.15)] shrink-0"
                            >
                              Login
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* New Session Action */}
                    <button
                      onClick={handleCreateNewSession}
                      className="w-full py-2.5 border border-dashed border-zinc-800 hover:border-zinc-700 hover:bg-slate-900/40 rounded-xl text-xs font-mono text-zinc-400 hover:text-cyan-400 font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Start New Chat Session</span>
                    </button>

                    {/* Sessions Database List */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin pr-1 text-left">
                      <span className="block text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-bold pb-1 border-b border-gray-900/40">Chat Sessions ({sessions.length})</span>
                      
                      {sessions.length === 0 ? (
                        <div className="text-center py-6 text-zinc-600 font-mono text-[10px]">
                          No sessions stored for this ID.
                        </div>
                      ) : (
                        sessions.map(s => {
                          const isActive = s.id === currentSessionId;
                          
                          let totalMsgs = 0;
                          if (s.histories) {
                            for (const key in s.histories) {
                              totalMsgs += (s.histories[key] || []).length;
                            }
                          }

                          return (
                            <div
                              key={s.id}
                              onClick={() => handleSelectSession(s.id)}
                              className={`p-3 rounded-xl border transition-all relative group flex flex-col justify-between cursor-pointer ${
                                isActive 
                                  ? "bg-[#0b1322] border-cyan-500/35 shadow-[0_0_12px_rgba(6,180,212,0.1)] text-white" 
                                  : "bg-[#05070c] border-neutral-900 hover:border-gray-800 text-zinc-400 hover:bg-slate-900/20"
                              }`}
                            >
                              <div className="flex items-start justify-between min-w-0 pr-12">
                                <div className="space-y-1 min-w-0 flex-grow">
                                  <div className="flex items-center space-x-1.5 min-w-0">
                                    <span className="text-xs font-bold truncate block select-text">
                                      {s.name}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2 text-[9px] font-mono text-zinc-500">
                                    <span>{s.timestamp}</span>
                                    <span>•</span>
                                    <span className={isActive ? "text-cyan-400/80 font-bold" : ""}>
                                      {totalMsgs} logs
                                    </span>
                                  </div>
                                </div>

                                <div className="absolute top-2.5 right-2.5 flex items-center space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newTitle = prompt("Enter new name for this session:", s.name);
                                      if (newTitle !== null) {
                                        handleRenameSession(s.id, newTitle);
                                      }
                                    }}
                                    className="p-1 rounded bg-[#090d16] border border-gray-850 text-zinc-500 hover:text-cyan-400 transition-colors"
                                    title="Rename Session"
                                  >
                                    <PenTool className="w-3 h-3" />
                                  </button>
                                  
                                  <button
                                    onClick={(e) => handleDeleteSession(s.id, e)}
                                    disabled={sessions.length <= 1}
                                    className={`p-1 rounded bg-[#090d16] border border-gray-850 transition-colors ${
                                      sessions.length <= 1 
                                        ? "text-zinc-800 cursor-not-allowed opacity-30" 
                                        : "text-zinc-500 hover:text-rose-400"
                                    }`}
                                    title="Delete Session"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

              </div>

            </div>

            {/* Sidebar Footer badge / Config drawer */}
            <div className="border-t border-gray-850 bg-slate-950/40 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setShowConfig(!showConfig)}
                  className="flex items-center space-x-2 text-[11.5px] font-mono hover:text-white transition-colors cursor-pointer text-left focus:outline-none"
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    serverStatus === "online" 
                      ? "bg-emerald-500 animate-pulse" 
                      : serverStatus === "checking" 
                      ? "bg-amber-400 animate-pulse" 
                      : "bg-rose-500"
                  }`} />
                  <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    Sync: {serverStatus === "online" ? "Online" : serverStatus === "checking" ? "Verifying..." : "Offline"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfig(!showConfig)}
                  className="text-[9px] font-mono text-emerald-400 hover:text-emerald-300 uppercase tracking-widest border border-emerald-500/10 hover:border-emerald-500/35 bg-emerald-500/[0.02] px-1.5 py-0.5 rounded transition-all cursor-pointer"
                >
                  {showConfig ? "Collapse" : "Configure Connection"}
                </button>
              </div>

              {showConfig && (
                <div className="space-y-3 pt-1.5 border-t border-gray-900/60 transition-all">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-gray-500 font-mono block">Backend Target Origin</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={customUrlInput}
                        onChange={(e) => setCustomUrlInput(e.target.value)}
                        placeholder="https://..."
                        className="flex-grow bg-slate-950 border border-gray-850 rounded-lg p-2 font-mono text-[10px] text-zinc-300 focus:outline-none focus:border-emerald-500/40"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setBackendUrl(customUrlInput);
                        }}
                        className="bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-[10px] px-3 py-2 rounded-lg transition-all cursor-pointer shrink-0"
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const { devUrl } = getDevAndPreprodUrls();
                        setCustomUrlInput(devUrl);
                        setBackendUrl(devUrl);
                      }}
                      className="p-1 px-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-gray-850 text-[9px] font-mono text-zinc-400 text-center transition-all cursor-pointer"
                    >
                      Use Dev Node
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const { preUrl } = getDevAndPreprodUrls();
                        setCustomUrlInput(preUrl);
                        setBackendUrl(preUrl);
                      }}
                      className="p-1 px-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-gray-850 text-[9px] font-mono text-zinc-400 text-center transition-all cursor-pointer"
                    >
                      Use Preprod Node
                    </button>
                  </div>
                  
                  {window.location.origin && !window.location.origin.includes("localhost") && (
                    <button
                      type="button"
                      onClick={() => {
                        const browserUrl = window.location.origin;
                        setCustomUrlInput(browserUrl);
                        setBackendUrl(browserUrl);
                      }}
                      className="w-full p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-gray-850 text-[9px] font-mono text-zinc-400 text-center transition-all cursor-pointer"
                    >
                      Reset to Local Web Origin
                    </button>
                  )}

                  <p className="text-[8.5px] text-gray-500 leading-normal font-sans mt-2">
                    Required for standalone APK runs so the local device can proxy model requests to the cloud server. Click Apply to save.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] font-mono text-gray-650 pt-1">
                <span className="flex items-center gap-1 text-gray-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/55" />
                  Independent Sync Node
                </span>
                <span className="text-gray-600">v1.2.0</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Watermark in Bottom Right corner */}
      <div className="fixed bottom-2 right-2 z-50 pointer-events-none select-none font-mono text-[9px] uppercase tracking-wider text-white/20 bg-black/35 px-2 py-1 rounded backdrop-blur-[1px] border border-white/5 whitespace-nowrap">
        BY MAYANK SURYAWANSHI
      </div>

    </div>
  );
}

// Inline mini helpers to ensure clean compiling
function PlaySymbol({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      stroke="none"
    >
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

function ShieldCheck({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
