import { Toaster } from "@/components/ui/sonner";
import { Cloud } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import AuthPage from "./components/AuthPage";
import ChatPage from "./components/ChatPage";
import OnboardingPage from "./components/OnboardingPage";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useHasAssistantName } from "./hooks/useQueries";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{
            duration: 2.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        >
          <Cloud className="w-16 h-16 text-primary/50 fill-cloud-soft" />
        </motion.div>
        <div className="flex gap-1.5">
          <span className="typing-dot w-2 h-2 bg-primary/50 rounded-full" />
          <span className="typing-dot w-2 h-2 bg-primary/50 rounded-full" />
          <span className="typing-dot w-2 h-2 bg-primary/50 rounded-full" />
        </div>
        <p className="text-sm text-muted-foreground font-medium">
          Loading CloudShare…
        </p>
      </motion.div>
    </div>
  );
}

function AppContent() {
  const { identity, isInitializing } = useInternetIdentity();
  const { isFetching: actorFetching } = useActor();
  const isAuthenticated = !!identity;
  const [timedOut, setTimedOut] = useState(false);

  const {
    data: hasName,
    isLoading: nameLoading,
    refetch: refetchHasName,
  } = useHasAssistantName();

  // Safety timeout — if loading takes more than 8 seconds, bail out and show auth page
  useEffect(() => {
    if (!isInitializing && !(isAuthenticated && actorFetching)) return;
    const t = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(t);
  }, [isInitializing, isAuthenticated, actorFetching]);

  // Show loading while initializing auth (unless timed out)
  if (!timedOut && (isInitializing || (isAuthenticated && actorFetching))) {
    return <LoadingScreen />;
  }

  // Not logged in — show auth
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Logged in but checking if name is set
  if (nameLoading) {
    return <LoadingScreen />;
  }

  // Has no assistant name — show onboarding
  if (!hasName) {
    return (
      <OnboardingPage
        onComplete={() => {
          void refetchHasName();
        }}
      />
    );
  }

  // Fully set up — show chat
  return <ChatPage />;
}

export default function App() {
  return (
    <>
      <AppContent />
      <Toaster
        richColors
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: "16px",
            fontFamily: "Figtree, sans-serif",
          },
        }}
      />
    </>
  );
}
