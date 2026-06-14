/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Cpu, Layers, Shield, Play } from "lucide-react";
import { ModelInfo } from "./types";
import LandingPage from "./components/LandingPage";
import Workspace from "./components/Workspace";

const models: ModelInfo[] = [
  {
    id: "claude-fable-5",
    name: "Claude Fable 5",
    provider: "Anthropic",
    bgColor: "bg-amber-600",
    textColor: "text-amber-400",
    accentColor: "from-amber-600 to-orange-500",
    glowColor: "rgba(245,158,11,0.25)",
    strengths: ["Master Synthesis", "Advanced Cognitive Logic", "Multi-Agent Orchestration"],
    description: "Anthropic's ultimate synthesis model, engineered to govern advanced software grids and resolve master-class directives.",
  },
  {
    id: "deepseek-r1",
    name: "DeepSeek R1",
    provider: "DeepSeek",
    bgColor: "bg-emerald-500",
    textColor: "text-emerald-400",
    accentColor: "from-emerald-500 to-teal-500",
    glowColor: "rgba(16,185,129,0.25)",
    strengths: ["Advanced Reasoning", "Algorithmic Logic", "Math/Coding"],
    description: "DeepSeek's outstanding open reasoning model, utilizing chain-of-thought pathways to solve complex STEM and software challenges."
  },
  {
    id: "qwen-coder",
    name: "Qwen 2.5 Coder",
    provider: "Alibaba",
    bgColor: "bg-cyan-500",
    textColor: "text-cyan-400",
    accentColor: "from-cyan-500 to-blue-500",
    glowColor: "rgba(6,182,212,0.25)",
    strengths: ["Software Architecture", "Code Synthesis", "JSON Parsing"],
    description: "Alibaba's top coding model, delivering performance that rivals and sometimes exceeds closed frontier endpoints."
  },
  {
    id: "llama-3-3",
    name: "Llama 3.3 70B",
    provider: "Meta",
    bgColor: "bg-indigo-500",
    textColor: "text-indigo-400",
    accentColor: "from-indigo-500 to-purple-500",
    glowColor: "rgba(99,102,241,0.25)",
    strengths: ["Instruction Following", "Multilingual", "Nuanced Dialogue"],
    description: "Meta's flagship open-weights model, highly tuned for descriptive accuracy, reasoning, and standard agent workflows."
  },
  {
    id: "gpt-4-5",
    name: "ChatGPT 4.5",
    provider: "OpenAI",
    bgColor: "bg-emerald-600",
    textColor: "text-emerald-300",
    accentColor: "from-emerald-600 to-cyan-600",
    glowColor: "rgba(16,185,129,0.25)",
    strengths: ["Frontier Intelligence", "Multimodal Reasoning", "Complex Coding"],
    description: "OpenAI's latest state-of-the-art model, providing unparalleled verbal flair, logical depth, and multi-step agent actions."
  },
  {
    id: "phi-4",
    name: "Phi 4",
    provider: "Microsoft",
    bgColor: "bg-violet-500",
    textColor: "text-violet-400",
    accentColor: "from-violet-500 to-fuchsia-500",
    glowColor: "rgba(139,92,246,0.25)",
    strengths: ["Advanced Reasoning", "Scientific Analysis", "Logical Inference"],
    description: "Microsoft's top-tier reasoning model, utilizing advanced cognitive chains to solve scientific queries and technical paradigms."
  },
  {
    id: "command-r-plus",
    name: "Command R+",
    provider: "Cohere",
    bgColor: "bg-pink-500",
    textColor: "text-pink-400",
    accentColor: "from-pink-500 to-rose-500",
    glowColor: "rgba(236,72,153,0.25)",
    strengths: ["Agentic Workflows", "Multilingual", "RAG Optimization"],
    description: "Cohere's massive state-of-the-art multilingual agent model, tuned exceptionally for advanced multi-step tool interactions."
  },
  {
    id: "qwen-72b",
    name: "Qwen 2.5 72B",
    provider: "Alibaba",
    bgColor: "bg-purple-500",
    textColor: "text-purple-400",
    accentColor: "from-purple-500 to-violet-500",
    glowColor: "rgba(168,85,247,0.25)",
    strengths: ["General Knowledge", "Math Precision", "System Control"],
    description: "Alibaba's largest open-weights masterpiece model, boasting incredible performance across mathematical and systemic standards."
  },
  {
    id: "llama-3-8b",
    name: "Llama 3 8B Instruct",
    provider: "Meta",
    bgColor: "bg-orange-500",
    textColor: "text-orange-400",
    accentColor: "from-orange-500 to-yellow-500",
    glowColor: "rgba(249,115,22,0.25)",
    strengths: ["Roleplay", "Logical Flow", "Helpful Support"],
    description: "Meta's highly popular 8B parameter model, optimized for clean dialogue flow and versatile task completion."
  },
  {
    id: "mythomax-13b",
    name: "MythoMax 13B",
    provider: "Gryphe",
    bgColor: "bg-amber-600",
    textColor: "text-amber-500",
    accentColor: "from-amber-600 to-yellow-600",
    glowColor: "rgba(217,119,6,0.25)",
    strengths: ["Prose & Narratives", "Storytelling", "Immersive Chat"],
    description: "A highly popular blend of top Llama models optimized for rich prose, descriptive storytelling, and immersive dialogue."
  },
  {
    id: "llama-3-2-3b",
    name: "Llama 3.2 3B",
    provider: "Meta",
    bgColor: "bg-teal-500",
    textColor: "text-teal-400",
    accentColor: "from-teal-500 to-emerald-500",
    glowColor: "rgba(20,184,166,0.25)",
    strengths: ["Edge Speed", "Short Answers", "Dynamic Tasks"],
    description: "Meta's ultra-compact, featherweight model designed specifically for high-speed edge intelligence and mobile dialogue."
  },
  {
    id: "mistral-large",
    name: "Mistral Large 2",
    provider: "Mistral AI",
    bgColor: "bg-lime-500",
    textColor: "text-lime-400",
    accentColor: "from-lime-500 to-emerald-400",
    glowColor: "rgba(132,204,22,0.25)",
    strengths: ["Reasoning Depth", "Multilingual Fluency", "Code Synthesis"],
    description: "Mistral AI's crown jewel model, engineered for high-end systemic reasoning, multi-language dialogues, and code synthesis."
  },
  {
    id: "zephyr-7b",
    name: "Zephyr 7B Beta",
    provider: "HuggingFace",
    bgColor: "bg-rose-400",
    textColor: "text-rose-300",
    accentColor: "from-rose-400 to-pink-400",
    glowColor: "rgba(251,113,133,0.25)",
    strengths: ["Direct Support", "Exemplary Instructions", "Tone Tuning"],
    description: "HuggingFace's stellar fine-tune of Mistral, optimized to be an exceptionally helpful companion that excels at standard instructions."
  }
];

export default function App() {
  const [view, setView] = useState<"landing" | "workspace">("landing");
  const [showSplash, setShowSplash] = useState(true);
  const [progress, setProgress] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [isCodeModeActive, setIsCodeModeActive] = useState<boolean>(() => {
    return localStorage.getItem("mai_code_mode_active") === "true";
  });
  const [userPasscode, setUserPasscode] = useState<string>(() => {
    let existing = localStorage.getItem("mas_user_passcode");
    if (!existing) {
      // Auto-generate fresh 11-char passcode for portable, instant-launch zero friction run!
      let result = "";
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234556789";
      for (let i = 0; i < 11; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      localStorage.setItem("mas_user_passcode", result);
      existing = result;
    }
    return existing;
  });

  const [triggerTransition, setTriggerTransition] = useState(false);
  const [transitioningToPro, setTransitioningToPro] = useState(false);

  useEffect(() => {
    if (showSplash) return;
    setTriggerTransition(true);
    setTransitioningToPro(isCodeModeActive);
    const timer = setTimeout(() => {
      setTriggerTransition(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [isCodeModeActive]);

  useEffect(() => {
    localStorage.setItem("mai_code_mode_active", String(isCodeModeActive));
  }, [isCodeModeActive]);

  const stages = [
    { title: "INITIALIZING UTILITIES", desc: "Synchronizing system nodes...", icon: Cpu },
    { title: "KINETIC COUPLING", desc: "Aligning cosmic model parameters...", icon: Layers },
    { title: "NEURAL CRYPTOGRAPHY", desc: "Decrypting high-dimensional link registers...", icon: Sparkles },
    { title: "PHOTONIC HARVESTING", desc: "Engaging Solaris silicon units...", icon: Play },
    { title: "SYSTEM SECURED", desc: "Frontier core successfully assembled.", icon: Shield },
  ];

  // Drive progress smoothly
  useEffect(() => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 8) + 4;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setShowSplash(false);
        }, 600);
      }
      setProgress(currentProgress);

      // Advance stages proportionally
      const targetStage = Math.min(
        Math.floor((currentProgress / 100) * stages.length),
        stages.length - 1
      );
      setStageIndex(targetStage);
    }, 120);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#07090e] min-h-screen text-white select-none overflow-x-hidden">
      <AnimatePresence mode="wait">
        {showSplash ? (
          <motion.div
            key="splash-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
            transition={{ duration: 0.65, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#04060a] text-white"
          >
            {/* Atmospheric Background Glow */}
            <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

            <div className="relative text-center max-w-sm px-6 z-10 flex flex-col items-center">
              {/* Outer Pulsing Glow */}
              <motion.div
                animate={{ 
                  scale: [1, 1.08, 1],
                  rotate: 360
                }}
                transition={{ 
                  scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                  rotate: { duration: 25, repeat: Infinity, ease: "linear" }
                }}
                className="w-20 h-20 rounded-2xl border border-emerald-500/30 bg-emerald-505/5 flex items-center justify-center mb-8 relative shadow-[0_0_50px_rgba(16,185,129,0.15)]"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-emerald-500/10 via-cyan-500/5 to-transparent blur-md" />
                <Sparkles className="w-9 h-9 text-emerald-400 stroke-[1.25]" />
              </motion.div>

              {/* Branding Typography */}
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold tracking-[0.35em] text-transparent bg-clip-text bg-gradient-to-r from-neutral-50 via-neutral-100 to-neutral-400 font-sans uppercase"
              >
                AI Workspace
              </motion.h1>
              <p className="text-[10px] font-mono tracking-[0.25em] text-gray-500 uppercase mt-2 mb-10">
                Frontier Model Orchestrator
              </p>

              {/* Dynamic Stage Banner */}
              <div className="w-full bg-[#0d121f] border border-gray-900 rounded-xl p-4 mb-6 shadow-inner relative overflow-hidden flex items-start gap-4">
                <div className="p-2 rounded bg-emerald-500/10 text-emerald-400 mt-0.5">
                  {(() => {
                    const IconComponent = stages[stageIndex].icon;
                    return <IconComponent className="w-4 h-4" />;
                  })()}
                </div>
                <div className="text-left">
                  <div className="text-[9px] font-mono tracking-widest text-emerald-400 font-bold uppercase">
                    STAGE {stageIndex + 1} // {stages[stageIndex].title}
                  </div>
                  <div className="text-xs text-neutral-300 mt-1 line-clamp-1 transition-all duration-300">
                    {stages[stageIndex].desc}
                  </div>
                </div>
              </div>

              {/* Progress Slider Track */}
              <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden mb-3 relative p-[1px]">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
                />
              </div>

              {/* Value Indicator */}
              <div className="flex justify-between w-full text-[10px] font-mono text-gray-500 uppercase tracking-widest px-1">
                <span>Synchronizing Assets</span>
                <span className="text-emerald-400 font-bold">{progress}%</span>
              </div>
            </div>

            {/* Micro Copyright Footnote */}
            <div className="absolute bottom-6 text-[9px] font-mono text-gray-600 tracking-[0.15em] uppercase">
              Solaris Inductions • Secure Quantum Core
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="main-app"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1,
              scale: triggerTransition ? [1, 0.99, 1.005, 1] : 1,
              transition: {
                duration: 0.5,
                ease: "easeInOut"
              }
            }}
            className="will-change-transform"
          >
            <AnimatePresence mode="wait">
              {view === "landing" ? (
                <motion.div
                  key="landing-view"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.45, ease: "easeInOut" }}
                >
                  <LandingPage 
                    models={models} 
                    onLaunch={() => setView("workspace")} 
                    isCodeModeActive={isCodeModeActive}
                    setIsCodeModeActive={setIsCodeModeActive}
                    userPasscode={userPasscode}
                    setUserPasscode={setUserPasscode}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="workspace-view"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.45, ease: "easeInOut" }}
                >
                  <Workspace 
                    models={models} 
                    onBack={() => setView("landing")} 
                    isCodeModeActive={isCodeModeActive}
                    setIsCodeModeActive={setIsCodeModeActive}
                    userPasscode={userPasscode}
                    setUserPasscode={setUserPasscode}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Immersive Stargate Stardust Hyper-drive Transition Scene */}
            <AnimatePresence>
              {triggerTransition && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 pointer-events-none overflow-hidden"
                >
                  {/* CRT Screen Scanline Filter Overlay */}
                  <div className="absolute inset-0 opacity-25 pointer-events-none bg-[linear-gradient(rgba(18,16,24,0)_50%,_rgba(0,0,0,0.4)_50%)] bg-[size:100%_4px] z-40" />
                  <div className={`absolute inset-0 opacity-10 pointer-events-none z-40 ${
                    transitioningToPro 
                      ? "bg-gradient-to-br from-purple-500/20 via-transparent to-fuchsia-500/20" 
                      : "bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/10"
                  }`} />

                  {/* Falling System Hex streams simulating overclocking process */}
                  <div className="absolute inset-0 grid grid-cols-4 gap-4 px-10 py-5 opacity-15 select-none font-mono text-[8px] tracking-wider z-10 text-neutral-400 pointer-events-none will-change-transform">
                    {[...Array(8)].map((_, idx) => {
                      const vals = ["0xFF6C2D", "CPU_LOAD:98%", "INIT_SWARM_12", "REALLOC_HEAP", "THREAD_SAFE", "SYNTH_CLAUDE", "QUANTUM_GRID", "LOCK_SEM_A"];
                      const randomWord = vals[(idx + Math.floor(Math.random() * 4)) % vals.length];
                      return (
                        <motion.div
                          key={idx}
                          initial={{ y: -50, opacity: 0 }}
                          animate={{ y: 800, opacity: [0, 1, 1, 0] }}
                          transition={{ duration: 1.0, delay: idx * 0.04, ease: "linear" }}
                          className={`will-change-transform ${transitioningToPro ? "text-purple-400" : "text-emerald-400"}`}
                        >
                          {randomWord}
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Tapering warp energy rings expanding */}
                  <motion.div
                    initial={{ scale: 0.1, opacity: 1, borderWidth: "16px" }}
                    animate={{ scale: 2.8, opacity: 0, borderWidth: "1px" }}
                    transition={{ duration: 1.1, ease: "easeOut" }}
                    className={`absolute rounded-full w-80 h-80 border-double z-20 will-change-transform ${
                      transitioningToPro 
                        ? "border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.5)]" 
                        : "border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                    }`}
                  />
                  <motion.div
                    initial={{ scale: 0.05, opacity: 0.8, borderWidth: "8px" }}
                    animate={{ scale: 2.0, opacity: 0, borderWidth: "1px" }}
                    transition={{ duration: 0.95, delay: 0.08, ease: "easeOut" }}
                    className={`absolute rounded-full w-80 h-80 border-dotted z-20 will-change-transform ${
                      transitioningToPro 
                        ? "border-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.4)]" 
                        : "border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                    }`}
                  />
                  
                  {/* Dynamic exploding speed lines representing cosmic space travel warp */}
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none will-change-transform">
                    {[...Array(20)].map((_, i) => {
                      const angle = (i * 360) / 20;
                      return (
                        <motion.div
                          key={i}
                          initial={{ rotate: angle, width: "3.5px", height: "10px", y: 0, opacity: 1 }}
                          animate={{ height: "180px", y: -450, opacity: 0 }}
                          transition={{ duration: 0.8, delay: (i % 2) * 0.06, ease: "easeOut" }}
                          className={`absolute bottom-1/2 origin-bottom rounded-full will-change-transform ${
                            transitioningToPro 
                              ? "bg-gradient-to-t from-purple-500 via-fuchsia-400 to-transparent" 
                              : "bg-gradient-to-t from-emerald-500 via-cyan-400 to-transparent"
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* Absolute Center Micro Status HUD */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: [0, 1, 1, 0], scale: [0.92, 1.02, 1.02, 0.96] }}
                    transition={{ duration: 1.1, times: [0, 0.2, 0.8, 1], ease: "easeInOut" }}
                    className="absolute z-30 text-center font-mono select-none px-6 drop-shadow-[0_0_12px_rgba(0,0,0,0.9)] will-change-transform"
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                        className={`p-1 rounded-full border will-change-transform ${
                          transitioningToPro ? "border-purple-500 bg-purple-500/10" : "border-emerald-500 bg-emerald-500/10"
                        }`}
                      >
                        <Cpu className={`w-4 h-4 ${transitioningToPro ? "text-purple-400" : "text-emerald-400"}`} />
                      </motion.div>
                      <span className={`text-[10px] tracking-[0.4em] uppercase font-bold ${
                        transitioningToPro ? "text-purple-400" : "text-emerald-400"
                      }`}>
                        {transitioningToPro ? "Cores Overclocking" : "Stabilizing Swarm Nodes"}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-[0.25em] mb-3">
                      {transitioningToPro ? "Developer Pro Mode" : "Scholarly Seminar"}
                    </h2>

                    <div className={`text-[8.5px] font-semibold tracking-[0.15em] py-1 px-3 rounded border flex items-center justify-center gap-1.5 ${
                      transitioningToPro 
                        ? "text-purple-300 bg-purple-950/40 border-purple-800/50" 
                        : "text-emerald-300 bg-emerald-950/40 border-emerald-800/50"
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                      {transitioningToPro 
                        ? "12 MODEL COLLABORATIVE FLEET • FULL COMPILE TARGET" 
                        : "ACADEMIC CROSS-CRITIQUE SEMINARS ACTIVE"}
                    </div>
                  </motion.div>

                  {/* Centered glowing hyperspace stargate core */}
                  <motion.div
                    initial={{ scale: 0.4, opacity: 1 }}
                    animate={{ scale: [1, 2.0, 0.15], opacity: [1, 0.85, 0] }}
                    transition={{ duration: 1.1, ease: "easeInOut" }}
                    className={`w-40 h-40 rounded-full border z-20 will-change-transform ${
                      transitioningToPro 
                        ? "bg-gradient-to-tr from-purple-500 via-fuchsia-500 to-white border-purple-300 shadow-[0_0_40px_rgba(168,85,247,0.7)]" 
                        : "bg-gradient-to-tr from-emerald-500 via-cyan-400 to-white border-emerald-300 shadow-[0_0_40px_rgba(16,185,129,0.7)]"
                    }`}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
