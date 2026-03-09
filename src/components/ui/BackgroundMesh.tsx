import { motion } from "framer-motion";

export function BackgroundMesh() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-white dark:bg-[#030014]">
      {/* Subtle fine noise overlay pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] mix-blend-overlay"
        style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.8\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\"/%3E%3C/svg%3E')" }}
      />
    </div>
  );
}
