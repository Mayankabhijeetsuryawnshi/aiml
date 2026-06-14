/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  glowColor: string;
  strengths: string[];
  description: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type StreamStatus = 'idle' | 'loading' | 'streaming' | 'completed' | 'error';

export interface ModelResponse {
  modelId: string;
  content: string;
  status: StreamStatus;
  responseTime?: number; // in seconds
  error?: string;
}

export interface CustomWorkflow {
  id: string;
  name: string;
  icon: string;
  promptPrefix: string;
  description: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ChatSession {
  id: string;
  name: string;
  timestamp: string;
  histories: Record<string, ChatMessage[]>;
}
