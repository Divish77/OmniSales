import { motion, useSpring, useScroll } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 40 });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] z-[9998] origin-left bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
      style={{ scaleX }}
    />
  );
}
