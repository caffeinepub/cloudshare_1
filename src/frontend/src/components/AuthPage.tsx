import { Button } from "@/components/ui/button";
import { Cloud, Heart, Shield, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function AuthPage() {
  const { login, isLoggingIn, isLoginError, loginError, isInitializing } =
    useInternetIdentity();

  return (
    <div className="min-h-screen cloud-bg relative flex items-center justify-center p-4 overflow-hidden">
      {/* Soft overlay */}
      <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px]" />

      {/* Floating cloud decorations */}
      <motion.div
        className="absolute top-8 left-8 opacity-30 hidden md:block"
        animate={{ y: [0, -10, 0] }}
        transition={{
          duration: 5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      >
        <Cloud className="w-20 h-20 text-primary fill-cloud-soft" />
      </motion.div>
      <motion.div
        className="absolute top-20 right-16 opacity-20 hidden md:block"
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 6,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: 1,
        }}
      >
        <Cloud className="w-32 h-32 text-primary fill-cloud-soft" />
      </motion.div>
      <motion.div
        className="absolute bottom-12 left-20 opacity-20 hidden md:block"
        animate={{ y: [0, -6, 0] }}
        transition={{
          duration: 7,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: 2,
        }}
      >
        <Cloud className="w-24 h-24 text-primary fill-cloud-soft" />
      </motion.div>
      <motion.div
        className="absolute bottom-8 right-12 opacity-25 hidden md:block"
        animate={{ y: [0, -9, 0] }}
        transition={{
          duration: 5.5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: 0.5,
        }}
      >
        <Cloud className="w-16 h-16 text-primary fill-cloud-soft" />
      </motion.div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-card/90 backdrop-blur-md rounded-3xl shadow-cloud-lg border border-border/60 overflow-hidden">
          {/* Header band */}
          <div className="bg-gradient-to-r from-primary/10 via-accent/20 to-primary/5 px-8 pt-10 pb-8 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5, ease: "backOut" }}
              className="flex justify-center mb-4"
            >
              <div className="relative">
                <img
                  src="/assets/generated/cloudshare-logo-transparent.dim_80x80.png"
                  alt="CloudShare logo"
                  className="w-16 h-16 object-contain drop-shadow-sm float-anim"
                />
              </div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="font-display text-3xl font-bold text-foreground tracking-tight"
            >
              CloudShare
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-2 text-muted-foreground text-sm leading-relaxed"
            >
              Your safe space to reflect, share, and grow
            </motion.p>
          </div>

          {/* Body */}
          <div className="px-8 pb-8 pt-6">
            {/* Feature pillars */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="grid grid-cols-3 gap-3 mb-8"
            >
              {[
                {
                  icon: Shield,
                  label: "Private",
                  color: "text-primary",
                  bg: "bg-primary/8",
                },
                {
                  icon: Heart,
                  label: "Supportive",
                  color: "text-rose-400",
                  bg: "bg-rose-50",
                },
                {
                  icon: Sparkles,
                  label: "Mindful",
                  color: "text-sky-500",
                  bg: "bg-sky-50",
                },
              ].map(({ icon: Icon, label, color, bg }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl bg-muted/50"
                >
                  <div className={`p-2 rounded-xl ${bg}`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {label}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* Welcome text */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.5 }}
              className="text-center mb-6"
            >
              <h2 className="font-display text-lg font-semibold text-foreground mb-1.5">
                Welcome back
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sign in securely to connect with your personal assistant and
                continue your journey.
              </p>
            </motion.div>

            {/* Error message */}
            {isLoginError && loginError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive text-center"
              >
                {loginError.message.includes("already authenticated")
                  ? "You're already signed in. Refreshing…"
                  : "Something went wrong. Please try again."}
              </motion.div>
            )}

            {/* Sign in button */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <Button
                onClick={login}
                disabled={isLoggingIn || isInitializing}
                className="w-full h-12 rounded-2xl font-display font-semibold text-base shadow-cloud hover:shadow-cloud-lg transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
              >
                {isLoggingIn ? (
                  <span className="flex items-center gap-2">
                    <span className="flex gap-1">
                      <span className="typing-dot w-1.5 h-1.5 bg-primary-foreground rounded-full inline-block" />
                      <span className="typing-dot w-1.5 h-1.5 bg-primary-foreground rounded-full inline-block" />
                      <span className="typing-dot w-1.5 h-1.5 bg-primary-foreground rounded-full inline-block" />
                    </span>
                    Connecting…
                  </span>
                ) : isInitializing ? (
                  "Loading…"
                ) : (
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Sign In / Sign Up
                  </span>
                )}
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="mt-4 text-center text-xs text-muted-foreground"
            >
              Secured by Internet Identity — your privacy is our priority
            </motion.p>
          </div>
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-center text-xs text-muted-foreground mt-6"
        >
          © {new Date().getFullYear()}. Created with{" "}
          <Heart className="w-3 h-3 inline text-rose-400" /> by Triptika Dey
        </motion.p>
      </motion.div>
    </div>
  );
}
