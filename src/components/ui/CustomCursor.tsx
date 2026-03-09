import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function CustomCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Dot follows instantly
  const dotX = useSpring(cursorX, { stiffness: 900, damping: 40, mass: 0.2 });
  const dotY = useSpring(cursorY, { stiffness: 900, damping: 40, mass: 0.2 });

  // Ring follows smoothly behind
  const ringX = useSpring(cursorX, { stiffness: 200, damping: 30, mass: 0.5 });
  const ringY = useSpring(cursorY, { stiffness: 200, damping: 30, mass: 0.5 });

  const isHoveringRef = useRef(false);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const onEnter = () => { isHoveringRef.current = true; };
    const onLeave = () => { isHoveringRef.current = false; };

    window.addEventListener("mousemove", move);

    // Attach hover listeners to interactive elements
    const addListeners = () => {
      document.querySelectorAll("a, button, [role='button'], input, select, textarea, label").forEach(el => {
        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);
      });
    };
    addListeners();

    // Re-check when DOM changes
    const observer = new MutationObserver(addListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("mousemove", move);
      observer.disconnect();
    };
  }, [cursorX, cursorY]);

  // Only show on non-touch devices
  if (typeof window !== "undefined" && window.matchMedia("(hover: none)").matches) return null;

  return (
    <>
      {/* Outer ring — slow, larger */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full border-2 border-indigo-500/60 mix-blend-difference"
        style={{
          width: 36, height: 36,
          x: ringX, y: ringY,
          translateX: "-50%", translateY: "-50%",
        }}
      />
      {/* Inner dot — fast, small */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full bg-indigo-500"
        style={{
          width: 8, height: 8,
          x: dotX, y: dotY,
          translateX: "-50%", translateY: "-50%",
        }}
      />
    </>
  );
}
