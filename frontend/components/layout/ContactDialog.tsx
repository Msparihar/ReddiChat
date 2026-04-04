"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/providers/theme-provider";
import toast from "react-hot-toast";

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
}

type TopicTemplate = {
  label: string;
  subject: string;
  message: string;
};

const TOPIC_TEMPLATES: Record<string, TopicTemplate> = {
  upgrade: {
    label: "Upgrade to Pro",
    subject: "Upgrade to Pro Plan",
    message:
      "Hi, I'd like to upgrade my ReddiChat account to the Pro plan.\n\nCurrent email: {userEmail}\n\nPlease let me know the next steps.",
  },
  billing: {
    label: "Billing Question",
    subject: "Billing Question",
    message: "Hi, I have a question about billing:\n\n",
  },
  issue: {
    label: "Report Issue",
    subject: "Bug Report",
    message:
      "Hi, I'd like to report an issue:\n\n**What happened:**\n\n**What I expected:**\n\n**Steps to reproduce:**\n",
  },
  feature: {
    label: "Feature Request",
    subject: "Feature Request",
    message:
      "Hi, I'd like to suggest a feature:\n\n**Feature:**\n\n**Why it would be useful:**\n",
  },
  other: {
    label: "Other",
    subject: "General Inquiry",
    message: "",
  },
};

export function ContactDialog({ open, onOpenChange, userEmail }: ContactDialogProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [subject, setSubject] = useState("Billing Inquiry — ReddiChat");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChipSelect = (key: string) => {
    const t = TOPIC_TEMPLATES[key];
    setSelectedChip(key);
    setSubject(t.subject);
    setMessage(
      key === "upgrade"
        ? t.message.replace("{userEmail}", userEmail)
        : t.message
    );
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const len = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(len, len);
      }
    }, 0);
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      });

      if (res.status === 401) {
        toast.error("Session expired. Please sign in again.");
        return;
      }
      if (res.status === 429) {
        toast.error("You've reached the daily contact limit. Try again tomorrow.");
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to send message");
        return;
      }

      toast.success("Message sent! We'll get back to you soon.");
      setSubject("Billing Inquiry — ReddiChat");
      setMessage("");
      setSelectedChip(null);
      onOpenChange(false);
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setSubject("Billing Inquiry — ReddiChat");
      setMessage("");
      setSelectedChip(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          "sm:max-w-md",
          isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
        )}
      >
        <DialogHeader>
          <DialogTitle className={isDark ? "text-gray-100" : "text-gray-900"}>
            Contact Us
          </DialogTitle>
          <DialogDescription className={isDark ? "text-gray-400" : "text-gray-500"}>
            Select a topic or write a custom message.
          </DialogDescription>
        </DialogHeader>

        {/* Topic Chips */}
        <div className="flex flex-wrap gap-2 pt-1 pb-2">
          {Object.entries(TOPIC_TEMPLATES).map(([key, t]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleChipSelect(key)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-150",
                selectedChip === key
                  ? "bg-brand text-white border border-brand"
                  : isDark
                    ? "bg-gray-800 text-gray-400 hover:bg-gray-700 border border-transparent"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-4 pt-2">
          {/* Email (read-only) */}
          <div>
            <label className={cn("text-xs font-medium mb-1 block", isDark ? "text-gray-400" : "text-gray-500")}>
              Your Email
            </label>
            <input
              type="email"
              value={userEmail}
              readOnly
              className={cn(
                "w-full text-sm px-3 py-2 rounded-md border",
                isDark
                  ? "bg-gray-800 border-gray-700 text-gray-400"
                  : "bg-gray-50 border-gray-200 text-gray-500",
                "cursor-not-allowed"
              )}
            />
          </div>

          {/* Subject */}
          <div>
            <label className={cn("text-xs font-medium mb-1 block", isDark ? "text-gray-400" : "text-gray-500")}>
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              className={cn(
                "w-full text-sm px-3 py-2 rounded-md border focus:outline-none focus:ring-1 focus:ring-brand",
                isDark
                  ? "bg-gray-800 border-gray-600 text-gray-100"
                  : "bg-white border-gray-300 text-gray-900"
              )}
            />
            <div className={cn("text-[10px] text-right mt-0.5", isDark ? "text-gray-500" : "text-gray-400")}>
              {subject.length} / 200
            </div>
          </div>

          {/* Message */}
          <div>
            <label className={cn("text-xs font-medium mb-1 block", isDark ? "text-gray-400" : "text-gray-500")}>
              Message
            </label>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
              rows={5}
              placeholder="How can we help?"
              className={cn(
                "w-full text-sm px-3 py-2 rounded-md border resize-none focus:outline-none focus:ring-1 focus:ring-brand",
                isDark
                  ? "bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
              )}
            />
            <div className={cn("text-[10px] text-right mt-0.5", isDark ? "text-gray-500" : "text-gray-400")}>
              {message.length} / 2000
            </div>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={isSending || !subject.trim() || !message.trim()}
            className={cn(
              "w-full py-2 px-4 rounded-md text-sm font-medium transition-colors",
              "bg-brand hover:bg-brand-hover text-white",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isSending ? "Sending..." : "Send Message"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
