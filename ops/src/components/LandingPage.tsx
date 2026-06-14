/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Sparkles, ArrowRight, Cpu, Layers, Terminal, Shield, Lock, Unlock, RefreshCw, Fingerprint, Check } from "lucide-react";
import { ModelInfo } from "../types";
import CelestialCanvas from "./CelestialCanvas";

interface LandingPageProps {
  onLaunch: () => void;
  models: ModelInfo[];
  isCodeModeActive: boolean;
  setIsCodeModeActive: (val: boolean) => void;
  userPasscode: string;
  setUserPasscode: (val: string) => void;
}

export default function LandingPage({ 
  onLaunch, 
  models, 
  isCodeModeActive, 
  setIsCodeModeActive,
  userPasscode,
  setUserPasscode
}: LandingPageProps) {
  const [localCode, setLocalCode] = useState(userPasscode);
  const [errorText, setErrorText] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);

  // Sync with prop in case of dynamic initialization or resetting
  useEffect(() => {
    setLocalCode(userPasscode);
  }, [userPasscode]);

  const handlePasscodeChange = (value: string) => {
    // Strip non-alphanumeric (A-Z, a-z, 0-9)
    const cleanAlphanumeric = value.replace(/[^A-Za-z0-9]/g, "");
    // Cap at 11 characters
    const limited = cleanAlphanumeric.slice(0, 11);
    setLocalCode(limited);
    setErrorText("");
  };

  const handleLaunchClick = () => {
    if (localCode.length !== 11) {
      setErrorText("Passcode must be exactly 11 alphanumeric characters");
      return;
    }
    // Save to localStorage
    localStorage.setItem("mas_user_passcode", localCode);
    setUserPasscode(localCode);
    onLaunch();
  };

  const handleGenerateCode = () => {
    let result = "";
    // Generate high-entropy Base62 alphanumeric key (11 characters)
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234556789";
    for (let i = 0; i < 11; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setLocalCode(result);
    localStorage.setItem("mas_user_passcode", result);
    setUserPasscode(result);
    setErrorText("");
  };

  const formatPasscode = (code: string) => {
    if (!code) return "";
    const p1 = code.slice(0, 4);
    const p2 = code.slice(4, 8);
    const p3 = code.slice(8, 11);
    const parts = [];
    if (p1) parts.push(p1);
    if (p2) parts.push(p2);
    if (p3) parts.push(p3);
    return parts.join("-");
  };

  const handleCopyKey = () => {
    if (!localCode) return;
    navigator.clipboard.writeText(localCode);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className={`min-h-screen w-full transition-colors duration-700 ${
      isCodeModeActive ? "bg-[#04010a]" : "bg-[#07090e]"
    } text-white ${
      isCodeModeActive 
        ? "selection:bg-purple-500/35 selection:text-purple-200" 
        : "selection:bg-emerald-500/30 selection:text-emerald-300"
    } font-sans relative overflow-x-hidden flex flex-col justify-between items-center py-8 md:py-12 px-4 md:px-6`}>
      
      {/* Interactive Celestial Particle Orbit Canvas Layer */}
      <CelestialCanvas isProMode={isCodeModeActive} />

      {/* Dynamic Ambient Background Mesh Gradients */}
      <div className={`absolute top-1/4 left-1/4 w-[500px] h-[500px] blur-[120px] rounded-full pointer-events-none transition-colors duration-700 ${
        isCodeModeActive ? "bg-purple-600/10 animate-pulse duration-[8000ms]" : "bg-emerald-500/5"
      }`} />
      <div className={`absolute bottom-1/4 right-1/4 w-[600px] h-[600px] blur-[140px] rounded-full pointer-events-none transition-colors duration-700 ${
        isCodeModeActive ? "bg-fuchsia-600/10 animate-pulse duration-[10000ms]" : "bg-[#06b6d4]/5"
      }`} />

      {/* Floating Top Right Programmer Mode Switch */}
      <div className="absolute top-6 right-6 z-40 flex items-center gap-2.5 bg-slate-950/60 border border-gray-800/40 p-2 rounded-xl backdrop-blur-md shadow-inner">
        <span className={`font-mono text-[9px] uppercase tracking-wider transition-colors duration-300 ${isCodeModeActive ? 'text-purple-400' : 'text-zinc-500'}`}>
          PRO Mode
        </span>
        <button
          onClick={() => setIsCodeModeActive(!isCodeModeActive)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-300 ${
            isCodeModeActive ? "bg-purple-600 shadow-[0_0_12px_rgba(168,85,247,0.4)]" : "bg-neutral-800"
          }`}
          title="Toggle Claude Code Mode"
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out ${
              isCodeModeActive ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Decorative Matrix Grid Overlay */}
      <div 
         className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40"
         style={{ maskImage: "radial-gradient(ellipse at center, black, transparent 80%)" }}
      />

      {/* Top Identity Block */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="flex items-center space-x-2.5">
          <div className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs transition-colors duration-700 ${
            isCodeModeActive 
              ? "bg-gradient-to-tr from-purple-500 to-fuchsia-400 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]" 
              : "bg-gradient-to-tr from-emerald-500 to-cyan-400 text-black"
          }`}>
            {isCodeModeActive ? "CL" : "AI"}
          </div>
          <span className="font-mono text-xs text-zinc-500 tracking-[0.2em] uppercase font-semibold">
            {isCodeModeActive ? "Claude Programmer Suite" : "AI Ecosystem"}
          </span>
        </div>
      </div>

      {/* Main Centered Launch Card */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center justify-center my-auto">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className={`w-full border p-6 sm:p-8 md:p-10 rounded-3xl backdrop-blur-xl transition-all duration-700 ${
            isCodeModeActive 
              ? "bg-[#0b061c]/80 border-purple-500/25 shadow-[0_30px_100px_rgba(168,85,247,0.12),inset_0_1px_1px_rgba(255,255,255,0.08)]" 
              : "bg-[#090d16]/75 border-white/[0.04] shadow-[0_30px_100px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05)]"
          } relative overflow-hidden`}
        >
          {/* Top subtle light streak */}
          <div className={`absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent to-transparent transition-all duration-700 ${
            isCodeModeActive ? "via-purple-500/40" : "via-emerald-500/35"
          }`} />

          {/* Glowing launcher icon */}
          <div className="flex justify-center mb-6">
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                boxShadow: isCodeModeActive 
                  ? ["0 0 20px rgba(168,85,247,0.15)", "0 0 40px rgba(168,85,247,0.35)", "0 0 20px rgba(168,85,247,0.15)"]
                  : ["0 0 20px rgba(16,185,129,0.1)", "0 0 40px rgba(16,185,129,0.25)", "0 0 20px rgba(16,185,129,0.1)"]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className={`w-16 h-16 rounded-2xl border transition-colors duration-700 flex items-center justify-center relative ${
                isCodeModeActive 
                  ? "border-purple-500/35 bg-purple-500/[0.05]" 
                  : "border-emerald-500/30 bg-emerald-500/[0.04]"
              }`}
            >
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-tr to-transparent blur-sm transition-colors duration-700 ${
                isCodeModeActive ? "from-purple-500/15 via-fuchsia-500/5" : "from-emerald-500/10 via-cyan-500/5"
              }`} />
              {isCodeModeActive ? (
                <Terminal className="w-7 h-7 text-purple-400 stroke-[1.5]" />
              ) : (
                <Sparkles className="w-7 h-7 text-emerald-400 stroke-[1.25]" />
              )}
            </motion.div>
          </div>

          {/* Typography */}
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-b from-neutral-50 via-neutral-100 to-neutral-400 font-sans uppercase">
              {isCodeModeActive ? "CLAUDE CODESPACE" : "AI WORKSPACE"}
            </h2>
            <p className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase mt-2">
              {isCodeModeActive ? "Lead Programmer Console" : "Frontier Model Orchestrator"}
            </p>
          </div>

          {/* Secure Passcode Connection Gate Card */}
          <div className="mb-7 p-4 bg-black/60 rounded-2xl border border-gray-900 shadow-inner flex flex-col space-y-3 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-mono font-bold tracking-wider text-neutral-400 uppercase flex items-center gap-1.5 leading-none">
                <Shield className={`w-3.5 h-3.5 ${isCodeModeActive ? 'text-purple-400' : 'text-emerald-400'}`} />
                Secure Identity Node
              </span>
              {localCode.length === 11 ? (
                <span className="text-[8.5px] font-mono text-emerald-400 font-extrabold flex items-center gap-1 uppercase bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                  <Unlock className="w-2.5 h-2.5" /> Checked
                </span>
              ) : (
                <span className="text-[8.5px] font-mono text-rose-450 font-extrabold flex items-center gap-1 uppercase bg-rose-500/5 border border-rose-950 px-1.5 py-0.5 rounded">
                  <Lock className="w-2.5 h-2.5" /> Locked
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                value={localCode}
                onChange={(e) => handlePasscodeChange(e.target.value)}
                placeholder="Enter 11-character Base62 key..."
                className="w-full bg-slate-950 border border-gray-850 rounded-xl px-4 py-3 text-center text-md font-mono text-neutral-150 placeholder-gray-650 tracking-[0.1em] focus:outline-none focus:border-cyan-400/40 transition-colors"
                maxLength={11}
              />
              <Fingerprint className="absolute left-3 top-3.5 w-4 h-4 text-gray-650 pointer-events-none" />
              {localCode && (
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="absolute right-3 top-3 text-[9px] font-mono bg-gray-900 border border-gray-800 text-zinc-400 px-1.5 py-0.5 rounded-md hover:text-white transition-colors"
                >
                  {copiedKey ? "COPIED" : "COPY"}
                </button>
              )}
            </div>

            {/* Display formatted passcode preview as custom credentials */}
            {localCode.length > 0 && (
              <div className="flex justify-between items-center text-[10px] font-mono px-0.5">
                <span className="text-zinc-550 uppercase">Formatted ID:</span>
                <span className="text-zinc-300 font-bold bg-slate-900/60 border border-gray-900/40 px-2 py-0.5 rounded shrink-0">
                  {formatPasscode(localCode) || "N/A"}
                </span>
              </div>
            )}

            {/* Error Indicator */}
            {errorText && (
              <p className="text-[9.5px] text-rose-400 font-mono text-center">{errorText}</p>
            )}

            {/* Quick Node Generation trigger */}
            <button
              type="button"
              onClick={handleGenerateCode}
              className="w-full py-1.5 px-3 rounded-lg border border-dashed border-zinc-800 hover:border-zinc-700 bg-[#090b11]/30 hover:bg-[#0c0f16]/45 text-[9.5px] font-mono text-zinc-400 hover:text-zinc-200 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 text-zinc-500 animate-spin-slow" />
              <span>Generate New 11-character High-Entropy ID</span>
            </button>
          </div>

          {/* Centered Launch Button */}
          <div className="flex flex-col items-center w-full relative">
            {isCodeModeActive && (
              <div className="absolute -inset-6 pointer-events-none z-0">
                {/* Outermost subtle dust ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border border-purple-500/5 flex items-center justify-between"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/50" />
                  <div className="w-1 h-1 rounded-full bg-purple-400/30" />
                </motion.div>

                {/* Cyber asteroidal dashed orbit line */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-2 rounded-full border border-dashed border-purple-500/20"
                />

                {/* Inner planetary orbit with glowing fuchsia celestial sphere */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-4 rounded-full border border-fuchsia-500/10 flex items-start justify-center"
                >
                  <motion.div 
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-fuchsia-500 to-rose-400 shadow-[0_0_12px_rgba(217,70,239,0.7)] -mt-1.5"
                  />
                </motion.div>

                {/* Pulsing cosmic core aura background */}
                <motion.div
                  animate={{ opacity: [0.25, 0.55, 0.25], scale: [0.95, 1.05, 0.95] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-2 bg-gradient-to-tr from-purple-500/5 via-fuchsia-500/5 to-transparent blur-xl rounded-full"
                />
              </div>
            )}

            <button
              id="center_launch_workspace_btn"
              onClick={handleLaunchClick}
              disabled={localCode.length !== 11}
              className={`w-full relative z-10 group inline-flex items-center justify-center px-6 py-4 rounded-2xl font-bold text-xs uppercase tracking-[0.15em] transition-all duration-300 transform active:scale-[0.97] hover:scale-[1.01] ${
                localCode.length !== 11
                  ? "bg-neutral-900 border border-neutral-800 text-zinc-650 cursor-not-allowed"
                  : isCodeModeActive
                    ? "bg-gradient-to-r from-purple-600 via-fuchsia-500 to-indigo-500 text-white shadow-[0_0_35px_rgba(168,85,247,0.4)] hover:shadow-[0_0_45px_rgba(168,85,247,0.65)] border border-purple-400/30 font-black cursor-pointer"
                    : "bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-400 text-black shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] cursor-pointer"
              }`}
            >
              {localCode.length === 11 && isCodeModeActive && (
                <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 via-transparent to-fuchsia-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              )}
              <span>{isCodeModeActive ? "Launch Codespace Console" : "Initialize Workspace"}</span>
              <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1.5" />
            </button>
          </div>

          {/* Tiny subtext badge */}
          <div className="mt-8 flex justify-center items-center gap-4 text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Cpu className={`w-3.5 h-3.5 transition-colors duration-700 ${isCodeModeActive ? 'text-purple-400' : 'text-emerald-400/75'}`} />
              12 Engines Ready
            </span>
            <span className="h-3 w-[1px] bg-white/[0.08]" />
            <span className="flex items-center gap-1">
              <Layers className={`w-3.5 h-3.5 transition-colors duration-700 ${isCodeModeActive ? 'text-fuchsia-400' : 'text-cyan-400/75'}`} />
              Parallel Streaming
            </span>
          </div>
        </motion.div>
      </div>

      {/* Footer System Credits */}
      <div className="relative z-10 text-center">
        <p className="text-[9px] font-mono text-zinc-600 tracking-[0.18em] uppercase">
          Solaris Inductions • Secure Quantum Core • V2.5
        </p>
      </div>

    </div>
  );
}
