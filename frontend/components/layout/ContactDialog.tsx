"use client";

import { useState } from "react";
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

export function ContactDialog({ open, onOpenChange, userEmail }: ContactDialogProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [subject, setSubject] = useState("Billing Inquiry — ReddiChat");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

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
            Send us a message and we'll get back to you.
          </DialogDescription>
        </DialogHeader>

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
                "w-full text-sm px-3 py-2 rounded-md border focus:outline-none focus:ring-1 focus:ring-purple-500",
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
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
              rows={5}
              placeholder="How can we help?"
              className={cn(
                "w-full text-sm px-3 py-2 rounded-md border resize-none focus:outline-none focus:ring-1 focus:ring-purple-500",
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
              "bg-purple-600 hover:bg-purple-700 text-white",
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
