import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { supabase } from "../supabase"

type Screen = "landing" | "q1" | "q2" | "final";
type HappinessLevel = "sad" | "low" | "medium" | "high" | "max";

interface AppState {
  screen: Screen;
  happiness: number; // 0–100
  bgTheme: "default" | "dark" | "warm" | "celebration";
  finalMessage: string;
  isCelebrationBig: boolean;
}

const HAPPINESS_COLORS = {
  sad: "#1a1a2e",
  low: "#16213e",
  medium: "#7c3aed",
  high: "#f59e0b",
  max: "#ec4899",
};

function getHappinessLabel(h: number) {
  if (h >= 90) return { emoji: "🥳", label: "OBSESSED", color: "#ec4899" };
  if (h >= 60) return { emoji: "😄", label: "Thriving", color: "#f59e0b" };
  if (h >= 40) return { emoji: "😐", label: "Pending…", color: "#a78bfa" };
  if (h >= 20) return { emoji: "😞", label: "Concerning", color: "#6366f1" };
  return { emoji: "💀", label: "CRITICAL", color: "#ef4444" };
}

function getBgStyle(theme: AppState["bgTheme"], happiness: number) {
  if (theme === "dark") {
    return "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0d0d0d 100%)";
  }
  if (theme === "warm") {
    return "linear-gradient(135deg, #fde68a 0%, #fca5a5 50%, #fbcfe8 100%)";
  }
  if (theme === "celebration") {
    return "linear-gradient(135deg, #fde68a 0%, #f0abfc 50%, #a5f3fc 100%)";
  }
  // Default: interpolate based on happiness
  if (happiness > 60) {
    return "linear-gradient(135deg, #a78bfa 0%, #ec4899 50%, #f59e0b 100%)";
  }
  return "linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #6d28d9 100%)";
}

function HappinessMeter({ happiness }: { happiness: number }) {
  const info = getHappinessLabel(happiness);
  return (
    <div className="w-full px-5 pt-5 pb-3">
      <div className="flex items-center justify-between mb-2">
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          Navya's Happiness Index
        </span>
        <motion.span
          key={info.label}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "11px",
            fontWeight: 800,
            color: info.color,
            letterSpacing: "0.05em",
          }}
        >
          {info.emoji} {info.label}
        </motion.span>
      </div>
      <div
        style={{
          background: "rgba(255,255,255,0.15)",
          borderRadius: "100px",
          height: "10px",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        <motion.div
          animate={{ width: `${happiness}%` }}
          transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            height: "100%",
            borderRadius: "100px",
            background:
              happiness < 20
                ? "linear-gradient(90deg, #ef4444, #dc2626)"
                : happiness < 50
                  ? "linear-gradient(90deg, #8b5cf6, #6d28d9)"
                  : happiness < 80
                    ? "linear-gradient(90deg, #f59e0b, #f97316)"
                    : "linear-gradient(90deg, #f59e0b, #ec4899, #a855f7)",
            boxShadow:
              happiness > 80
                ? "0 0 12px rgba(236,72,153,0.8)"
                : "0 0 6px rgba(139,92,246,0.4)",
          }}
        />
      </div>
    </div>
  );
}

const FloatingEmoji = ({ emoji, delay }: { emoji: string; delay: number }) => (
  <motion.div
    initial={{ y: 0, opacity: 0.6, x: 0 }}
    animate={{
      y: [-10, 10, -10],
      opacity: [0.6, 1, 0.6],
      rotate: [-5, 5, -5],
    }}
    transition={{
      duration: 3 + delay,
      repeat: Infinity,
      delay,
    }}
    style={{
      position: "absolute",
      fontSize: "24px",
      userSelect: "none",
      pointerEvents: "none",
    }}
  >
    {emoji}
  </motion.div>
);

export default function App() {
  const [state, setState] = useState<AppState>({
    screen: "landing",
    happiness: 50,
    bgTheme: "default",
    finalMessage: "COOL. SEE YOU SOON. 🥳",
    isCelebrationBig: false,
  });

  const [q1Response, setQ1Response] = useState<"yes" | "no" | null>(null);
  const [q2Response, setQ2Response] = useState<1 | 2 | 3 | null>(null);
  const [q1Text, setQ1Text] = useState("");
  const [showQ1Text, setShowQ1Text] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const saveResponseToDatabase = async () => {
  const { error } = await supabase
    .from("Responses")
    .insert([
      {
        question_1: q1Response,
        question_2: q2Response?.toString(),
        happiness_score: state.happiness,
        completed: true
      }
    ]);

  if (error) {
    console.error("Error saving response:", error);
  } else {
    console.log("Response saved successfully");
  }
};

  const fireConfetti = useCallback(
    (big = false) => {
      const count = big ? 300 : 150;
      const spread = big ? 100 : 70;
      confetti({
        particleCount: count,
        spread,
        origin: { y: 0.6 },
        colors: ["#ec4899", "#f59e0b", "#a855f7", "#06b6d4", "#10b981"],
        shapes: ["star", "circle"],
        scalar: big ? 1.4 : 1.1,
      });
      if (big) {
        setTimeout(() => {
          confetti({
            particleCount: 100,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ["#ec4899", "#fde68a", "#c4b5fd"],
          });
          confetti({
            particleCount: 100,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ["#06b6d4", "#34d399", "#f97316"],
          });
        }, 200);
      }
    },
    []
  );

  const handleStart = () => {
    setState((s) => ({ ...s, screen: "q1" }));
  };

  const handleQ1Yes = () => {
    setQ1Response("yes");
    setShowQ1Text(true);
    setQ1Text("Elite decision detected. My happiness just did a backflip.");
    setState((s) => ({ ...s, happiness: 100, bgTheme: "warm" }));
    fireConfetti();
    setTimeout(() => {
      saveResponseToDatabase();
      setState((s) => ({
        ...s,
        screen: "final",
        finalMessage: "COOL. SEE YOU SOON. 🥳",
        isCelebrationBig: false,
      }));
      fireConfetti();
    }, 2800);
  };

  const handleQ1No = () => {
    setQ1Response("no");
    setShowQ1Text(true);
    setQ1Text("Oh. That was… unexpected.");
    setState((s) => ({ ...s, happiness: 5, bgTheme: "dark" }));
    setTimeout(() => {
      setShowQ1Text(false);
      setTimeout(() => {
        setState((s) => ({ ...s, screen: "q2" }));
      }, 400);
    }, 2200);
  };

  const handleQ2Option = (option: 1 | 2 | 3) => {
    setQ2Response(option);
    if (option === 1) {
      setState((s) => ({
        ...s,
        happiness: 100,
        bgTheme: "warm",
        screen: "final",
        finalMessage: "COOL. SEE YOU SOON. 🥳",
        isCelebrationBig: false,
      }));
      fireConfetti();
      saveResponseToDatabase();
    } else if (option === 2) {
      setState((s) => ({
        ...s,
        happiness: 55,
        bgTheme: "default",
        screen: "final",
        finalMessage: "Fine. Monday it is. I'm setting a reminder. 📅",
        isCelebrationBig: false,
      }));
       saveResponseToDatabase();
    } else {
      setState((s) => ({
        ...s,
        happiness: 100,
        bgTheme: "celebration",
        screen: "final",
        finalMessage: "THIS IS THE CORRECT ANSWER. 🏆",
        isCelebrationBig: true,
      }));
      setTimeout(() => fireConfetti(true), 300);
       saveResponseToDatabase();
    }
  };

  const handleReplay = () => {
    setQ1Response(null);
    setShowQ1Text(false);
    setQ1Text("");
    setState({
      screen: "landing",
      happiness: 50,
      bgTheme: "default",
      finalMessage: "COOL. SEE YOU SOON. 🥳",
      isCelebrationBig: false,
    });
  };

  const bgStyle = getBgStyle(state.bgTheme, state.happiness);

  const textColor =
    state.bgTheme === "warm" || state.bgTheme === "celebration"
      ? "#1a1a2e"
      : "#ffffff";

  const mutedColor =
    state.bgTheme === "warm" || state.bgTheme === "celebration"
      ? "rgba(26,26,46,0.6)"
      : "rgba(255,255,255,0.6)";

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0d0d0d",
        fontFamily: "'Space Grotesk', sans-serif",
        padding: "16px",
      }}
    >
      <motion.div
        animate={{ background: bgStyle }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
        style={{
          width: "100%",
          maxWidth: "390px",
          minHeight: "700px",
          borderRadius: "36px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
        }}
      >
        {/* Happiness Meter */}
        <motion.div
          animate={{
            opacity: state.bgTheme === "warm" || state.bgTheme === "celebration" ? 0.9 : 1,
          }}
        >
          <HappinessMeter happiness={state.happiness} />
        </motion.div>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: "rgba(255,255,255,0.1)",
            margin: "0 20px",
          }}
        />

        {/* Screen Content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px 20px" }}>
          <AnimatePresence mode="wait">
            {/* SCREEN 1 – LANDING */}
            {state.screen === "landing" && (
              <motion.div
                key="landing"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: "28px", position: "relative" }}
              >
                {/* Floating decorative emojis */}
                <div style={{ position: "absolute", top: 0, left: "10%", zIndex: 0 }}>
                  <FloatingEmoji emoji="💌" delay={0} />
                </div>
                <div style={{ position: "absolute", top: "20%", right: "8%", zIndex: 0 }}>
                  <FloatingEmoji emoji="✨" delay={0.5} />
                </div>
                <div style={{ position: "absolute", bottom: "20%", left: "5%", zIndex: 0 }}>
                  <FloatingEmoji emoji="🌸" delay={1.2} />
                </div>
                <div style={{ position: "absolute", bottom: "30%", right: "6%", zIndex: 0 }}>
                  <FloatingEmoji emoji="🎀" delay={0.8} />
                </div>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
                  style={{ fontSize: "72px", lineHeight: 1 }}
                >
                  🕵️‍♀️
                </motion.div>

                <div style={{ zIndex: 1 }}>
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{
                      fontSize: "32px",
                      fontWeight: 900,
                      color: textColor,
                      lineHeight: 1.15,
                      marginBottom: "12px",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    Operation:<br />Chennai Check 💌
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    style={{
                      fontSize: "15px",
                      color: mutedColor,
                      lineHeight: 1.6,
                      maxWidth: "260px",
                    }}
                  >
                    Your answer may directly affect my happiness levels.
                  </motion.p>
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                  style={{ zIndex: 1 }}
                >
                  <motion.button
                    whileHover={{ scale: 1.06, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleStart}
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      border: "2px solid rgba(255,255,255,0.3)",
                      backdropFilter: "blur(10px)",
                      color: "#ffffff",
                      borderRadius: "100px",
                      padding: "16px 32px",
                      fontSize: "15px",
                      fontWeight: 800,
                      cursor: "pointer",
                      letterSpacing: "0.02em",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                    }}
                  >
                    Begin the mission 😌
                  </motion.button>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  style={{
                    fontSize: "11px",
                    color: mutedColor,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  Strictly confidential • Answer wisely
                </motion.p>
              </motion.div>
            )}

            {/* SCREEN 2 – QUESTION 1 */}
            {state.screen === "q1" && (
              <motion.div
                key="q1"
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -60 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "32px" }}
              >
                <div>
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: mutedColor,
                      marginBottom: "12px",
                    }}
                  >
                    Question 01 of 02
                  </motion.div>
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{
                      fontSize: "28px",
                      fontWeight: 900,
                      color: textColor,
                      lineHeight: 1.25,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    Are you coming to Chennai this Saturday?
                  </motion.h2>
                </div>

                <AnimatePresence mode="wait">
                  {!showQ1Text ? (
                    <motion.div
                      key="buttons"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: 0.35 }}
                      style={{ display: "flex", flexDirection: "column", gap: "12px" }}
                    >
                      <motion.button
                        whileHover={{ scale: 1.04, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleQ1Yes}
                        style={{
                          background: "linear-gradient(135deg, #fde68a, #fca5a5)",
                          border: "none",
                          borderRadius: "20px",
                          padding: "20px 24px",
                          fontSize: "18px",
                          fontWeight: 900,
                          color: "#1a1a2e",
                          cursor: "pointer",
                          textAlign: "left",
                          boxShadow: "0 8px 24px rgba(252,165,165,0.4)",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        YES — obviously 😌
                        <div style={{ fontSize: "11px", fontWeight: 600, opacity: 0.6, marginTop: "4px", letterSpacing: "0.05em" }}>
                          (the correct answer)
                        </div>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.04, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleQ1No}
                        style={{
                          background: "rgba(255,255,255,0.1)",
                          border: "2px solid rgba(255,255,255,0.2)",
                          borderRadius: "20px",
                          padding: "20px 24px",
                          fontSize: "18px",
                          fontWeight: 900,
                          color: textColor,
                          cursor: "pointer",
                          textAlign: "left",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        Not this Saturday 😐
                        <div style={{ fontSize: "11px", fontWeight: 600, opacity: 0.5, marginTop: "4px", letterSpacing: "0.05em" }}>
                          (choose wisely)
                        </div>
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="response"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ type: "spring", stiffness: 250, damping: 20 }}
                      style={{
                        background: q1Response === "yes"
                          ? "rgba(255,255,255,0.25)"
                          : "rgba(255,255,255,0.05)",
                        border: q1Response === "yes"
                          ? "2px solid rgba(255,255,255,0.4)"
                          : "2px solid rgba(255,255,255,0.1)",
                        borderRadius: "24px",
                        padding: "28px 24px",
                        textAlign: "center",
                      }}
                    >
                      <motion.div
                        animate={{ rotate: q1Response === "yes" ? [0, -10, 10, -10, 0] : [0, 5, -5, 5, 0] }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        style={{ fontSize: "48px", marginBottom: "12px" }}
                      >
                        {q1Response === "yes" ? "🤸‍♀️" : "😶‍🌫️"}
                      </motion.div>
                      <p style={{
                        fontSize: "18px",
                        fontWeight: 800,
                        color: textColor,
                        lineHeight: 1.4,
                        letterSpacing: "-0.01em",
                      }}>
                        {q1Text}
                      </p>
                      {q1Response === "no" && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.6 }}
                          style={{ fontSize: "12px", color: mutedColor, marginTop: "8px" }}
                        >
                          loading follow-up question…
                        </motion.p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* SCREEN 3 – QUESTION 2 */}
            {state.screen === "q2" && (
              <motion.div
                key="q2"
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -60 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "28px" }}
              >
                <div>
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: mutedColor,
                      marginBottom: "12px",
                    }}
                  >
                    Question 02 of 02
                  </motion.div>
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{
                      fontSize: "28px",
                      fontWeight: 900,
                      color: "#ffffff",
                      lineHeight: 1.25,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    Then when are you coming? 🤨
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginTop: "8px" }}
                  >
                    Choose carefully. My meter is watching.
                  </motion.p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  style={{ display: "flex", flexDirection: "column", gap: "10px" }}
                >
                  {[
                    {
                      id: 1 as const,
                      text: "This weekend. Obviously. I was joking.",
                      emoji: "😅",
                      sub: "Happiness: FULL",
                      bg: "linear-gradient(135deg, #fde68a, #fca5a5)",
                      color: "#1a1a2e",
                    },
                    {
                      id: 2 as const,
                      text: "Next Monday. Slight delay, still loyal.",
                      emoji: "📅",
                      sub: "Happiness: Medium",
                      bg: "rgba(255,255,255,0.1)",
                      color: "#ffffff",
                    },
                    {
                      id: 3 as const,
                      text: "There is no other option. I'm coming this weekend.",
                      emoji: "💪",
                      sub: "Happiness: MAXIMUM + big party",
                      bg: "linear-gradient(135deg, #a855f7, #ec4899)",
                      color: "#ffffff",
                    },
                  ].map((opt, i) => (
                    <motion.button
                      key={opt.id}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleQ2Option(opt.id)}
                      style={{
                        background: opt.bg,
                        border: opt.id === 2 ? "2px solid rgba(255,255,255,0.2)" : "none",
                        borderRadius: "18px",
                        padding: "16px 20px",
                        fontSize: "14px",
                        fontWeight: 800,
                        color: opt.color,
                        cursor: "pointer",
                        textAlign: "left",
                        letterSpacing: "-0.01em",
                        lineHeight: 1.4,
                        boxShadow: opt.id === 3 ? "0 8px 24px rgba(168,85,247,0.4)" : opt.id === 1 ? "0 8px 24px rgba(252,165,165,0.3)" : "none",
                      }}
                    >
                      <span style={{ fontSize: "20px", marginRight: "10px" }}>{opt.emoji}</span>
                      {opt.text}
                      <div style={{ fontSize: "10px", fontWeight: 600, opacity: 0.6, marginTop: "6px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        {opt.sub}
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {/* SCREEN 4 – FINAL */}
            {state.screen === "final" && (
              <motion.div
                key="final"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 20 }}
                style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: "32px", position: "relative" }}
              >
                {/* Floating decoration */}
                <div style={{ position: "absolute", top: "5%", left: "5%" }}>
                  <FloatingEmoji emoji="🎉" delay={0} />
                </div>
                <div style={{ position: "absolute", top: "15%", right: "8%" }}>
                  <FloatingEmoji emoji="🥳" delay={0.4} />
                </div>
                <div style={{ position: "absolute", bottom: "25%", left: "3%" }}>
                  <FloatingEmoji emoji="✨" delay={0.8} />
                </div>
                <div style={{ position: "absolute", bottom: "30%", right: "5%" }}>
                  <FloatingEmoji emoji="💃" delay={0.6} />
                </div>

                <motion.div
                  animate={{
                    scale: [1, 1.15, 1, 1.1, 1],
                    rotate: [0, -5, 5, -3, 0],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                  style={{ fontSize: "80px" }}
                >
                  {state.isCelebrationBig ? "🏆" : state.happiness >= 90 ? "🥳" : "📅"}
                </motion.div>

                <div>
                  <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    style={{
                      fontSize: state.isCelebrationBig ? "36px" : "30px",
                      fontWeight: 900,
                      color: textColor,
                      lineHeight: 1.2,
                      letterSpacing: "-0.03em",
                      marginBottom: "12px",
                    }}
                  >
                    {state.isCelebrationBig ? (
                      <>
                        THIS IS THE<br />CORRECT ANSWER. 🏆
                      </>
                    ) : state.happiness >= 90 ? (
                      <>COOL. SEE YOU<br />SOON. 🥳</>
                    ) : (
                      <>
                        Fine. Monday it is.<br />I'm setting a reminder. 📅
                      </>
                    )}
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    style={{
                      fontSize: "14px",
                      color: mutedColor,
                      lineHeight: 1.6,
                      maxWidth: "270px",
                    }}
                  >
                    {state.isCelebrationBig
                      ? "Maximum happiness achieved. You have passed the vibe check with flying colors."
                      : state.happiness >= 90
                        ? "Happiness index: fully restored. You did good. You did very good."
                        : "Happiness index: 55%. Acceptable. You're on thin ice though."}
                  </motion.p>
                </div>

                {/* Happiness badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderRadius: "100px",
                    padding: "10px 24px",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <span style={{
                    fontSize: "13px",
                    fontWeight: 800,
                    color: textColor,
                    letterSpacing: "0.05em",
                  }}>
                    {state.happiness >= 90 ? "✅ Vibe Check: PASSED" : "⚠️ Vibe Check: Pending"}
                  </span>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  whileHover={{ scale: 1.06, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleReplay}
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "2px solid rgba(255,255,255,0.25)",
                    borderRadius: "100px",
                    padding: "14px 28px",
                    fontSize: "14px",
                    fontWeight: 800,
                    color: textColor,
                    cursor: "pointer",
                    letterSpacing: "0.02em",
                  }}
                >
                  🔁 Take the quiz again
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom indicator dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: "6px", paddingBottom: "24px" }}>
          {(["landing", "q1", "q2", "final"] as Screen[]).map((s, i) => (
            <motion.div
              key={s}
              animate={{
                width: state.screen === s ? "20px" : "6px",
                background: state.screen === s ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
              }}
              style={{
                height: "6px",
                borderRadius: "100px",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
