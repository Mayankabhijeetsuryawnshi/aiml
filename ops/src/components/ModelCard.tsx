/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Copy, Check, RotateCcw, Clock, AlertTriangle, Terminal, Sparkles } from "lucide-react";
import { ModelInfo, ModelResponse, ChatMessage } from "../types";
import { motion } from "motion/react";

interface ModelCardProps {
  model: ModelInfo;
  response: ModelResponse;
  onRegenerate: (modelId: string) => void;
  history?: ChatMessage[];
  responseMode?: "latest" | "history";
}

export default function ModelCard({ model, response, onRegenerate, history, responseMode }: ModelCardProps) {
  const [copied, setCopied] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll scroll container to bottom as response streams in
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      if (response.status === "streaming" || response.status === "loading") {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [response.content, response.status, history?.length]);

  // Simple live timer while model is loading or streaming
  useEffect(() => {
    let timer: any;
    if (response.status === "loading" || response.status === "streaming") {
      const startTime = Date.now();
      setElapsedTime(0);
      timer = setInterval(() => {
        setElapsedTime(parseFloat(((Date.now() - startTime) / 1000).toFixed(1)));
      }, 100);
    } else if (response.responseTime) {
      setElapsedTime(response.responseTime);
    }
    return () => clearInterval(timer);
  }, [response.status, response.responseTime]);

  const handleCopy = async () => {
    try {
      const textToCopy = response.content || (history && history.length > 0 ? history[history.length - 1].content : "");
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Helper to parse markdown code segments and inline images inside standard responses
  const parseInlineStyling = (text: string) => {
    if (!text) return null;
    
    // Split by ` for inline code blocks first to ensure inline code doesn't get double styled
    const codeParts = text.split(/`([^`\n]+)`/g);
    
    return codeParts.map((part, cIdx) => {
      if (cIdx % 2 === 1) {
        return (
          <code key={cIdx} className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-400 text-[10.5px] font-mono mx-0.5 font-semibold">
            {part}
          </code>
        );
      }
      
      // Parse bold **text**
      const boldParts = part.split(/\*\*([\s\S]*?)\*\*/g);
      return boldParts.map((bPart, bIdx) => {
        if (bIdx % 2 === 1) {
          return <strong key={bIdx} className="font-extrabold text-white">{bPart}</strong>;
        }
        
        // Parse italics *text*
        const italicParts = bPart.split(/\*([\s\S]*?)\*/g);
        return italicParts.map((iPart, iIdx) => {
          if (iIdx % 2 === 1) {
            return <em key={iIdx} className="italic text-gray-200">{iPart}</em>;
          }
          return iPart;
        });
      });
    });
  };

  const renderFormattedContent = (text: string) => {
    if (!text) return null;

    // Split text by code blocks (```)
    const segments = text.split(/(```[\s\S]*?```)/g);

    return segments.map((segment, index) => {
      if (segment.startsWith("```")) {
        const lines = segment.split("\n");
        // Extract language if specified, like "```typescript"
        const firstLine = lines[0];
        const match = firstLine.match(/```(\w*)/);
        const language = match ? match[1] : "code";
        const codeContent = lines.slice(1, lines.length - 1).join("\n");

        return (
          <div key={index} className="my-3 rounded-lg border border-gray-850 bg-slate-950 overflow-hidden font-mono text-[11px] leading-relaxed">
            <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900 border-b border-gray-800 text-[10px] text-gray-500 uppercase tracking-widest font-mono">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-emerald-400" />
                {language || "code"}
              </span>
              <button 
                onClick={() => navigator.clipboard.writeText(codeContent)}
                className="hover:text-white transition-colors"
                type="button"
              >
                Copy Code
              </button>
            </div>
            <pre className="p-3 overflow-x-auto text-emerald-300">
              <code>{codeContent}</code>
            </pre>
          </div>
        );
      }

      // First check for and extract markdown images: ![description](url)
      const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
      const itemParts: React.ReactNode[] = [];
      let lastIndex = 0;
      let match;

      while ((match = imageRegex.exec(segment)) !== null) {
        const matchIndex = match.index;
        if (matchIndex > lastIndex) {
          itemParts.push(segment.substring(lastIndex, matchIndex));
        }
        const alt = match[1];
        const url = match[2];
        itemParts.push(
          <div key={`img-${matchIndex}`} className="my-3 flex flex-col items-center">
            <img 
              src={url} 
              alt={alt || "Generated Visual"} 
              className="max-w-full rounded-xl border border-gray-800 shadow-xl object-contain bg-slate-950/50 hover:scale-[1.02] transition-transform duration-300 max-h-[300px]"
              referrerPolicy="no-referrer"
            />
            {alt && <span className="text-[10px] text-gray-500 font-mono tracking-wider mt-1.5 uppercase font-medium">{alt}</span>}
          </div>
        );
        lastIndex = imageRegex.lastIndex;
      }

      if (lastIndex < segment.length) {
        itemParts.push(segment.substring(lastIndex));
      }

      // Now map over and parse lines (headers, list items, bold/italic markup)
      return (
        <span key={index}>
          {itemParts.map((item, ipIdx) => {
            if (typeof item === "string") {
              const lines = item.split("\n");
              return lines.map((line, lIdx) => {
                if (!line.trim()) {
                  return <div key={lIdx} className="h-2" />;
                }

                // 1. Headers detection (# Level)
                const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
                if (headerMatch) {
                  const level = headerMatch[1].length;
                  const content = headerMatch[2];
                  const formattedText = parseInlineStyling(content);
                  
                  switch (level) {
                    case 1:
                      return <h1 key={lIdx} className="text-[14.5px] font-extrabold text-neutral-105 tracking-tight mt-3 mb-1.5 font-display border-b border-gray-800 pb-1">{formattedText}</h1>;
                    case 2:
                      return <h2 key={lIdx} className="text-[13px] font-bold text-neutral-200 tracking-tight mt-3 mb-1 font-display">{formattedText}</h2>;
                    case 3:
                      return <h3 key={lIdx} className="text-xs font-semibold text-neutral-300 mt-2.5 mb-1 font-display">{formattedText}</h3>;
                    default:
                      return <h4 key={lIdx} className="text-[11px] font-bold text-gray-400 mt-2 mb-1">{formattedText}</h4>;
                  }
                }

                // 2. Unordered lists detection (startsWith * or -)
                const isBulletList = line.trim().startsWith("* ") || line.trim().startsWith("- ");
                if (isBulletList) {
                  const cleanedContent = line.trim().substring(2);
                  const formattedText = parseInlineStyling(cleanedContent);
                  return (
                    <div key={lIdx} className="flex items-start space-x-1.5 ml-3 my-1 font-sans leading-relaxed text-zinc-350">
                      <span className="text-emerald-400 mt-1.5 shrink-0 select-none text-[8px]">●</span>
                      <span className="flex-grow">{formattedText}</span>
                    </div>
                  );
                }

                // Standard paragraph text lines parsed for bold, italics, inline code
                const formattedLine = parseInlineStyling(line);
                return <div key={lIdx} className="leading-relaxed my-1 text-zinc-300">{formattedLine}</div>;
              });
            }
            return item;
          })}
        </span>
      );
    });
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -4, borderColor: "rgba(100, 116, 139, 0.45)", boxShadow: "0 12px 30px rgba(0, 0, 0, 0.5)" }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={`relative flex flex-col justify-between rounded-xl border bg-slate-900/40 backdrop-blur-md p-5 min-h-[280px] shadow-[0_4px_30px_rgba(0,0,0,0.4)] ${
        response.status === "streaming" 
          ? "border-emerald-500/40 ring-1 ring-emerald-500/20" 
          : response.status === "error"
          ? "border-rose-500/40 ring-1 ring-rose-500/20"
          : "border-gray-800/80 hover:border-gray-700/80"
      }`}
    >
      {/* Decorative colored left edge trace */}
      <div className={`absolute top-0 left-0 bottom-0 w-[3px] rounded-l-xl bg-gradient-to-b ${model.accentColor}`} />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-800/40 ml-1">
        <div className="flex items-center space-x-2.5">
          <div className="relative">
            <span className={`flex h-2.5 w-2.5 rounded-full ${model.bgColor} ${response.status === "streaming" ? "animate-ping absolute inset-0 opacity-75" : ""}`} />
            <span className={`relative flex h-2.5 w-2.5 rounded-full ${model.bgColor}`} />
          </div>
          <div>
            <h4 className="font-display font-extrabold text-sm text-neutral-200 tracking-tight">{model.name}</h4>
            <span className="text-[9px] text-gray-500 uppercase tracking-widest font-mono">Expertise Engine</span>
          </div>
        </div>

        {/* Action badges */}
        <div className="flex items-center space-x-2">
          {response.status === "streaming" && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-mono text-emerald-400 capitalize animate-pulse font-semibold">
              streaming
            </span>
          )}
          <span className="px-2 py-0.5 rounded bg-gray-950/60 border border-gray-800 text-[9px] text-neutral-500 font-mono uppercase tracking-widest">
            {model.provider}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col justify-start ml-1 overflow-hidden">
        {responseMode === "history" ? (
          <div 
            ref={scrollContainerRef}
            className="flex-grow text-xs leading-relaxed text-neutral-300 overflow-y-auto max-h-[260px] pr-1.5 scrollbar-thin whitespace-pre-wrap font-sans"
          >
            {/* If history is empty and response is idle */}
            {(!history || history.length === 0) && response.status === "idle" && (
              <div className="flex flex-col items-center justify-center text-center text-gray-600 py-12">
                <Sparkles className="w-6 h-6 mb-2 opacity-30" />
                <p className="text-[10px] font-mono tracking-wider uppercase">No transmission log yet</p>
              </div>
            )}

            {/* Display message logs */}
            {history && history.map((msg: ChatMessage) => {
              if (msg.role === "user") {
                return (
                  <div key={msg.id} className="mb-4 bg-slate-950/50 border border-slate-850 p-2.5 rounded-lg text-emerald-400 font-mono text-[9.5px]">
                    <div className="flex justify-between items-center mb-1 text-slate-500 text-[8px] font-bold tracking-wider uppercase">
                      <span>👤 USER QUERY</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <div>{msg.content}</div>
                  </div>
                );
              } else {
                return (
                  <div key={msg.id} className="mb-5 pl-2 border-l-2 border-indigo-500/20 py-1">
                    <div className="flex justify-between items-center mb-1 text-slate-500 text-[8px] font-mono font-bold tracking-wider uppercase">
                      <span className={model.textColor}>🤖 RESPONSE</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <div className="text-xs text-neutral-300 leading-relaxed font-sans mt-1">
                      {renderFormattedContent(msg.content)}
                    </div>
                  </div>
                );
              }
            })}

            {/* Real-time Loading / Streaming response at the bottom if active */}
            {response.status === "loading" && (
              <div className="space-y-3 py-2 border-l-2 border-emerald-500/20 pl-2">
                <div className="h-2.5 bg-slate-800/60 rounded-md animate-pulse w-[95%]" />
                <div className="h-2.5 bg-slate-800/60 rounded-md animate-pulse w-[80%]" />
                <div className="h-2.5 bg-slate-800/60 rounded-md animate-pulse w-[40%]" />
              </div>
            )}

            {response.status === "streaming" && (
              <div className="mb-5 pl-2 border-l-2 border-emerald-500/30 py-1">
                <div className="flex justify-between items-center mb-1 text-[8px] font-mono font-bold tracking-wider text-emerald-400 uppercase">
                  <span>⚡ STREAMING RESPONSE</span>
                </div>
                <div className="text-xs text-neutral-200 leading-relaxed font-sans mt-1">
                  {renderFormattedContent(response.content)}
                  <span className="inline-block w-1.5 h-3.5 ml-1 bg-emerald-400 animate-pulse align-middle" />
                </div>
              </div>
            )}

            {response.status === "error" && (
              <div className="p-4 rounded-lg bg-rose-950/10 border border-rose-900/30 text-rose-300 text-center font-mono my-4">
                <AlertTriangle className="w-5 h-5 mb-1 text-rose-500 mx-auto" />
                <p className="text-[10px] uppercase text-rose-400 font-bold">Transmission Halted</p>
                <p className="text-[9.5px]/1.4 text-rose-300/80 mt-1">
                  {response.error || "Execution terminated due to API limits."}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* STANDARD OVERWRITE SOURCE (LATEST RESPONSE ONLY) BASED ON THE CURRENT LAYOUT */
          <div ref={scrollContainerRef} className="flex-grow flex flex-col justify-start overflow-hidden">
            {response.status === "idle" && (
              <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-600 py-12">
                <Sparkles className="w-6 h-6 mb-2 opacity-30" />
                <p className="text-[11px] font-mono tracking-wider uppercase pb-1">Awaiting global transmission</p>
                <p className="text-[9px] text-zinc-550 max-w-[200px] leading-relaxed mx-auto font-mono">Select targets, specify workflow parameters, and execute.</p>
              </div>
            )}

            {response.status === "loading" && (
              <div className="flex-grow space-y-3 py-2">
                <div className="h-3 bg-slate-800/60 rounded-md animate-pulse w-[95%]" />
                <div className="h-3 bg-slate-800/60 rounded-md animate-pulse w-[80%]" />
                <div className="h-3 bg-slate-800/60 rounded-md animate-pulse w-[88%]" />
                <div className="h-3 bg-slate-800/60 rounded-md animate-pulse w-[70%]" />
              </div>
            )}

            {(response.status === "streaming" || response.status === "completed") && (
              <div className="flex-grow text-xs leading-relaxed text-neutral-300 overflow-y-auto max-h-[220px] pr-1.5 scrollbar-thin whitespace-pre-wrap font-sans">
                {renderFormattedContent(response.content)}
                {response.status === "streaming" && <span className="inline-block w-1.5 h-3.5 ml-1 bg-emerald-400 animate-pulse align-middle" />}
              </div>
            )}

            {response.status === "error" && (
              <div className="flex-grow flex flex-col items-center justify-center p-4 rounded-lg bg-rose-950/10 border border-rose-900/30 text-rose-300 text-center">
                <AlertTriangle className="w-6 h-6 mb-2 text-rose-500 shrink-0" />
                <p className="font-display font-bold text-xs mb-1 text-rose-400">Response Error</p>
                <p className="text-[10px] text-rose-300/80 leading-relaxed font-mono overflow-y-auto max-h-[80px]">
                  {response.error || "A connection timeout or model quota occurred."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Area with Stats & Controls */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-800/40 ml-1 text-gray-500 text-[10px] font-mono">
        <div className="flex items-center space-x-1.5">
          <Clock className="w-3.5 h-3.5 text-gray-500" />
          <span>
            {response.status === "idle" 
              ? "--" 
              : `${elapsedTime}s`}
          </span>
        </div>

        {/* Card Specific Controls */}
        <div className="flex items-center space-x-1">
          {response.content && (
            <button
              onClick={handleCopy}
              className="p-1 px-1.5 rounded bg-gray-950/40 hover:bg-gray-900 hover:text-white border border-gray-900 transition-colors flex items-center space-x-1 cursor-pointer"
              title="Copy answer"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-[8px] text-emerald-400 font-bold">COPIED</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span className="text-[8px] text-gray-500">COPY</span>
                </>
              )}
            </button>
          )}

          {response.status !== "idle" && response.status !== "streaming" && response.status !== "loading" && (
            <button
              onClick={() => onRegenerate(model.id)}
              className="p-1 px-1.5 rounded bg-gray-950/40 hover:bg-[#10b981]/15 hover:text-emerald-400 border border-gray-900 transition-colors flex items-center space-x-1 cursor-pointer"
              title="Regenerate answer"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="text-[8px]">RELOAD</span>
            </button>
          )}
        </div>
      </div>

    </motion.div>
  );
}
