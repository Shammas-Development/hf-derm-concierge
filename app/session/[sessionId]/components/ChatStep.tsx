"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Send,
  Loader2,
  X,
  CheckCheck,
  Sparkles,
  ImagePlus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { compressImageToBase64 } from "@/lib/image";
import { extractUrgency, stripUrgencyTag } from "@/lib/ai/urgencyDetector";
import type { ChatMessage, ChatMessageContent, IntakeData } from "@/lib/session/types";
import type { SummaryResult } from "../SessionExperience";

interface Props {
  sessionId: string;
  intake: IntakeData;
  onEnd: (summary: SummaryResult) => void;
}

interface PendingImage {
  base64: string;
  mediaType: "image/jpeg";
  previewUrl: string;
}

const STARTER_PROMPTS = [
  "Tell me more about it",
  "Has it changed recently?",
  "What have you tried?",
];

export function ChatStep({ sessionId, intake, onEnd }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [imagePrivacyAcked, setImagePrivacyAcked] = useState(false);
  const [imagePrivacyOpen, setImagePrivacyOpen] = useState(false);
  const [endingDialogOpen, setEndingDialogOpen] = useState(false);
  const [composingImage, setComposingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [input]);

  // Scroll to bottom on new content
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, streamingText]);

  const sendToServer = useCallback(
    async (
      newMessages: ChatMessage[],
      opts: { isOpener?: boolean; endRequested?: boolean } = {},
    ) => {
      setStreaming(true);
      setStreamingText("");

      const allMessagesForApi = [...messages, ...newMessages];

      // For opener: send a synthetic first user message that prompts the AI to greet.
      const apiMessages = opts.isOpener
        ? [
            {
              role: "user" as const,
              content: [
                {
                  type: "text" as const,
                  text:
                    "Hi — I just finished the intake form. Please greet me warmly using my name (if provided) and the concerns I shared, then ask one focused follow-up question to start the conversation.",
                },
              ],
            },
          ]
        : allMessagesForApi.map((m) => ({
            role: m.role,
            content: m.content.map((b) =>
              b.type === "image"
                ? { type: "image" as const, data: b.data, mediaType: b.mediaType }
                : { type: "text" as const, text: b.text },
            ),
          }));

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            intake: {
              firstName: intake.firstName,
              ageRange: intake.ageRange,
              fitzpatrick: intake.fitzpatrick,
              concerns: intake.concerns,
              duration: intake.duration,
            },
            endRequested: opts.endRequested,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const errBody = await res
            .json()
            .catch(() => ({ error: "Chat failed." }));
          throw new Error(errBody.error || `HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let assembled = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events split by \n\n
          let idx: number;
          while ((idx = buffer.indexOf("\n\n")) !== -1) {
            const chunk = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            if (!chunk.startsWith("data:")) continue;
            const json = chunk.slice(5).trim();
            try {
              const evt = JSON.parse(json) as
                | { type: "delta"; text: string }
                | { type: "done"; stopReason: string | null }
                | { type: "error"; message: string };
              if (evt.type === "delta") {
                assembled += evt.text;
                setStreamingText(stripUrgencyTag(assembled));
              } else if (evt.type === "error") {
                throw new Error(evt.message);
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }

        const finalText = assembled;
        const urgency = extractUrgency(finalText);
        const displayText = stripUrgencyTag(finalText);

        const newAssistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: [{ type: "text", text: displayText }],
          createdAt: Date.now(),
        };

        setMessages((prev) => [...prev, ...newMessages, newAssistantMsg]);
        setStreamingText("");
        setStreaming(false);
        abortRef.current = null;

        if (opts.endRequested) {
          onEnd({ urgency: urgency ?? "GREEN", text: displayText });
        }
      } catch (err) {
        setStreaming(false);
        setStreamingText("");
        abortRef.current = null;
        if ((err as Error).name === "AbortError") return;
        toast.error(
          (err as Error).message ||
            "Something went wrong with the chat. Please try again.",
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages, intake],
  );

  // Auto-send opening AI greeting on mount
  const openerSentRef = useRef(false);
  useEffect(() => {
    if (openerSentRef.current) return;
    openerSentRef.current = true;
    sendToServer([], { isOpener: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = () => {
    const text = input.trim();
    if ((!text && !pendingImage) || streaming) return;

    const content: ChatMessageContent[] = [];
    if (pendingImage) {
      content.push({
        type: "image",
        data: pendingImage.base64,
        mediaType: pendingImage.mediaType,
      });
    }
    if (text) {
      content.push({ type: "text", text });
    } else if (pendingImage) {
      content.push({
        type: "text",
        text: "I'm sharing this image of my skin concern.",
      });
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: Date.now(),
    };

    if (pendingImage) {
      URL.revokeObjectURL(pendingImage.previewUrl);
    }

    setInput("");
    setPendingImage(null);
    sendToServer([userMsg]);
  };

  const handleFilePicked = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    setComposingImage(true);
    try {
      const { base64, mediaType } = await compressImageToBase64(file);
      const blob = await (await fetch(`data:${mediaType};base64,${base64}`)).blob();
      const previewUrl = URL.createObjectURL(blob);
      setPendingImage({ base64, mediaType, previewUrl });
    } catch {
      toast.error("Could not process that image. Try a different one.");
    } finally {
      setComposingImage(false);
    }
  };

  const triggerFilePicker = () => {
    if (!imagePrivacyAcked) {
      setImagePrivacyOpen(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const confirmImagePrivacy = () => {
    setImagePrivacyAcked(true);
    setImagePrivacyOpen(false);
    requestAnimationFrame(() => fileInputRef.current?.click());
  };

  const requestEnd = () => setEndingDialogOpen(true);
  const confirmEnd = () => {
    setEndingDialogOpen(false);
    sendToServer([], { endRequested: true });
  };

  const showStarters = messages.length === 1 && !streaming && !input;

  return (
    <div className="flex flex-1 flex-col bg-white">
      {/* Chat header */}
      <div className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-[#003DA5] flex items-center justify-center text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-medium text-foreground">
                HF Concierge
              </div>
              <div className="text-[11px] text-muted-foreground">
                Session #{sessionId.slice(0, 6).toUpperCase()} · Live
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={requestEnd}
            disabled={streaming || messages.length < 2}
            className="text-foreground/70 hover:text-foreground"
          >
            <CheckCheck className="mr-1.5 h-4 w-4" />
            End consultation
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="chat-scroll flex-1 overflow-y-auto"
      >
        <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {streaming && streamingText && (
            <MessageBubble
              message={{
                id: "streaming",
                role: "assistant",
                content: [{ type: "text", text: streamingText }],
                createdAt: 0,
              }}
              streaming
            />
          )}
          {streaming && !streamingText && <Typing />}
          {showStarters && (
            <div className="flex flex-wrap gap-2 pt-1">
              {STARTER_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => setInput(p)}
                  className="rounded-full border border-border bg-white px-3 py-1.5 text-xs text-foreground/70 hover:border-[#003DA5]/40 hover:text-foreground transition"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-white">
        <div className="mx-auto max-w-2xl px-3 sm:px-4 py-3">
          <AnimatePresence>
            {(pendingImage || composingImage) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mb-2 flex items-center gap-3 rounded-xl border border-border bg-[#F5F7FA] p-2">
                  {composingImage ? (
                    <Skeleton className="h-14 w-14 rounded-lg" />
                  ) : pendingImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pendingImage.previewUrl}
                      alt="Preview"
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                  ) : null}
                  <div className="flex-1 text-xs text-foreground/70">
                    {composingImage
                      ? "Preparing your image…"
                      : "Image attached — it will be analyzed in real time and never saved."}
                  </div>
                  {pendingImage && (
                    <button
                      onClick={() => {
                        URL.revokeObjectURL(pendingImage.previewUrl);
                        setPendingImage(null);
                      }}
                      className="h-7 w-7 rounded-full bg-white hover:bg-foreground/5 flex items-center justify-center text-foreground/60"
                      aria-label="Remove image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-2 rounded-2xl border border-border bg-white px-2 py-1.5 focus-within:border-[#003DA5]/50 focus-within:ring-2 focus-within:ring-[#003DA5]/15 transition">
            <button
              type="button"
              onClick={triggerFilePicker}
              disabled={streaming}
              className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-foreground/60 hover:text-[#003DA5] hover:bg-[#EEF2FB] transition disabled:opacity-50"
              aria-label="Attach photo"
            >
              {pendingImage ? <ImagePlus className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                handleFilePicked(f);
                e.target.value = "";
              }}
            />
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Describe what you're seeing or feeling…"
              rows={1}
              autoFocus
              className="flex-1 resize-none bg-transparent py-2 text-[16px] leading-snug text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <Button
              type="button"
              size="icon"
              onClick={handleSend}
              disabled={
                streaming || (!input.trim() && !pendingImage) || composingImage
              }
              className="h-9 w-9 shrink-0 rounded-full bg-[#003DA5] hover:bg-[#002C75]"
              aria-label="Send"
            >
              {streaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Educational tool · AI-generated · Not medical advice
          </p>
        </div>
      </div>

      <Dialog open={imagePrivacyOpen} onOpenChange={setImagePrivacyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sharing a photo</DialogTitle>
            <DialogDescription className="pt-2 leading-relaxed">
              Images you share are analyzed in real time and used only to help
              this conversation. <strong>They are never saved</strong> after
              your session ends.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="ghost"
              onClick={() => setImagePrivacyOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmImagePrivacy}
              className="bg-[#003DA5] hover:bg-[#002C75]"
            >
              I understand — pick a photo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={endingDialogOpen} onOpenChange={setEndingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End consultation?</DialogTitle>
            <DialogDescription className="pt-2 leading-relaxed">
              I'll generate a short summary of what we discussed and recommend
              your next step. You can book a dermatology appointment from the
              next screen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="ghost"
              onClick={() => setEndingDialogOpen(false)}
            >
              Keep talking
            </Button>
            <Button
              onClick={confirmEnd}
              className="bg-[#003DA5] hover:bg-[#002C75]"
            >
              End and see summary
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MessageBubble({
  message,
  streaming,
}: {
  message: ChatMessage;
  streaming?: boolean;
}) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap break-words",
          isUser
            ? "bg-[#003DA5] text-white rounded-br-md"
            : "bg-[#F5F7FA] text-foreground rounded-bl-md",
        )}
      >
        {message.content.map((b, i) =>
          b.type === "text" ? (
            <span key={i}>
              {b.text}
              {streaming && i === message.content.length - 1 && (
                <span className="ml-0.5 inline-block h-3 w-1 align-middle bg-current animate-pulse" />
              )}
            </span>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={`data:${b.mediaType};base64,${b.data}`}
              alt="Patient-shared"
              className="mb-2 max-h-64 rounded-lg"
            />
          ),
        )}
      </div>
    </div>
  );
}

function Typing() {
  return (
    <div className="flex justify-start">
      <div className="bg-[#F5F7FA] rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-[#003DA5]/70"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}
