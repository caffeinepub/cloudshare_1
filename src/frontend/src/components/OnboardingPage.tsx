import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Cloud, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useSetAssistantName } from "../hooks/useQueries";

interface OnboardingPageProps {
  onComplete: () => void;
}

const nameSuggestions = ["Serenity", "Aria", "Nova", "Cali", "Zephyr", "Luna"];

export default function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const setAssistantName = useSetAssistantName();

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Please give your assistant a name to continue.");
      return;
    }
    if (trimmed.length < 2) {
      setNameError("Name should be at least 2 characters.");
      return;
    }
    if (trimmed.length > 30) {
      setNameError("Name should be 30 characters or less.");
      return;
    }
    setNameError("");
    try {
      await setAssistantName.mutateAsync(trimmed);
      toast.success(`${trimmed} is ready to meet you! ✨`);
      onComplete();
    } catch {
      toast.error("Couldn't save the name. Please try again.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") void handleSubmit();
  };

  return (
    <div className="min-h-screen cloud-bg relative flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px]" />

      {/* Floating clouds */}
      {[
        {
          size: "w-24 h-24",
          pos: "top-6 left-6",
          delay: 0,
          opacity: "opacity-25",
        },
        {
          size: "w-16 h-16",
          pos: "top-16 right-10",
          delay: 1.5,
          opacity: "opacity-20",
        },
        {
          size: "w-20 h-20",
          pos: "bottom-10 left-16",
          delay: 0.8,
          opacity: "opacity-20",
        },
        {
          size: "w-12 h-12",
          pos: "bottom-6 right-8",
          delay: 2,
          opacity: "opacity-30",
        },
      ].map(({ size, pos, delay, opacity }) => (
        <motion.div
          key={pos}
          className={`absolute ${pos} ${opacity} hidden md:block`}
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: 5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay,
          }}
        >
          <Cloud className={`${size} text-primary fill-cloud-soft`} />
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="bg-card/90 backdrop-blur-md rounded-3xl shadow-cloud-lg border border-border/60 overflow-hidden">
          {/* Top accent */}
          <div className="h-1.5 bg-gradient-to-r from-primary/40 via-primary/70 to-primary/40" />

          <div className="px-8 py-10">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: 0.2,
                type: "spring",
                stiffness: 260,
                damping: 20,
              }}
              className="flex justify-center mb-6"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center shadow-cloud">
                  <img
                    src="/assets/generated/cloudshare-logo-transparent.dim_80x80.png"
                    alt="CloudShare"
                    className="w-12 h-12 object-contain float-anim"
                  />
                </div>
                <motion.div
                  className="absolute -top-1 -right-1 w-7 h-7 bg-yellow-100 rounded-full flex items-center justify-center shadow-sm"
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatDelay: 3,
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                </motion.div>
              </div>
            </motion.div>

            {/* Heading */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="text-center mb-2"
            >
              <h1 className="font-display text-2xl font-bold text-foreground">
                Welcome to CloudShare!
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="text-center text-muted-foreground text-sm leading-relaxed mb-8"
            >
              Your personal assistant is here to listen and support you. <br />
              What would you like to call them?
            </motion.p>

            {/* Name input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="space-y-2 mb-4"
            >
              <Label
                htmlFor="assistant-name"
                className="text-sm font-medium text-foreground"
              >
                Assistant name
              </Label>
              <Input
                id="assistant-name"
                placeholder="e.g. Serenity, Aria, Nova…"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError("");
                }}
                onKeyDown={handleKeyDown}
                className="h-12 rounded-2xl border-border/70 bg-muted/30 text-base focus-visible:ring-primary/40 placeholder:text-muted-foreground/60"
                maxLength={30}
                autoFocus
              />
              {nameError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive"
                >
                  {nameError}
                </motion.p>
              )}
            </motion.div>

            {/* Suggestions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mb-8"
            >
              <p className="text-xs text-muted-foreground mb-2">
                Need inspiration?
              </p>
              <div className="flex flex-wrap gap-2">
                {nameSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setName(suggestion);
                      setNameError("");
                    }}
                    className="px-3 py-1.5 text-xs font-medium rounded-full bg-secondary text-secondary-foreground hover:bg-primary/15 hover:text-primary transition-colors duration-200 border border-border/50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.5 }}
            >
              <Button
                onClick={() => void handleSubmit()}
                disabled={setAssistantName.isPending}
                className="w-full h-12 rounded-2xl font-display font-semibold text-base shadow-cloud hover:shadow-cloud-lg transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] group"
              >
                {setAssistantName.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="flex gap-1">
                      <span className="typing-dot w-1.5 h-1.5 bg-primary-foreground rounded-full inline-block" />
                      <span className="typing-dot w-1.5 h-1.5 bg-primary-foreground rounded-full inline-block" />
                      <span className="typing-dot w-1.5 h-1.5 bg-primary-foreground rounded-full inline-block" />
                    </span>
                    Setting up…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Meet {name.trim() || "my assistant"}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
