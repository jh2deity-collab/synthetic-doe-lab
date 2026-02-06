"use client";

import { motion } from "framer-motion";

interface FishboneProps {
    effect: string;
    factors: { name: string; type: string }[];
}

export const FishboneDiagram = ({ effect, factors = [] }: FishboneProps) => {
    // Determine categories based on factors or defaults (Material, Method, Machine, Man)
    // For DOE, we usually map Input Factors -> Causes
    const categories = [
        { name: "Continuous", items: (factors || []).filter(f => f.type === 'continuous') },
        { name: "Categorical", items: (factors || []).filter(f => f.type === 'categorical') },
        { name: "Environmental (Noise)", items: [] }, // Placeholder
        { name: "Process", items: [] }
    ];

    return (
        <div className="w-full h-80 bg-white/5 rounded-xl border border-white/10 relative overflow-hidden flex items-center p-4">
            {/* Main Spine */}
            <div className="absolute left-10 right-32 top-1/2 h-1 bg-white/20 rounded-full" />

            {/* Effect Box (Head) */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-lab-blue border border-lab-lime/50 text-lab-lime px-4 py-3 rounded-lg font-bold shadow-lg z-10">
                {effect || "Quality Characteristic"}
            </div>

            {/* Ribs */}
            <div className="absolute inset-0 flex flex-col justify-between py-10 px-20 pointer-events-none">
                {/* Top Ribs */}
                <div className="flex justify-around w-full">
                    {categories.slice(0, 2).map((cat, i) => (
                        <div key={i} className="relative group">
                            <div className="border border-white/10 bg-black/40 px-3 py-1 rounded text-xs text-slate-300 mb-2">{cat.name}</div>
                            {/* Diagonal Line */}
                            <div className="w-px h-24 bg-white/20 rotate-[-45deg] origin-bottom-left absolute left-1/2 top-8" />

                            {/* Factors */}
                            <div className="absolute top-10 -left-4 space-y-2 w-32">
                                {cat.items.map((item, j) => (
                                    <motion.div
                                        key={j}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: j * 0.1 }}
                                        className="text-[10px] text-slate-400 bg-black/60 px-2 py-0.5 rounded border border-white/5"
                                    >
                                        {item.name}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom Ribs */}
                <div className="flex justify-around w-full mt-10">
                    {categories.slice(2, 4).map((cat, i) => (
                        <div key={i} className="relative group">
                            {/* Diagonal Line (up) */}
                            <div className="w-px h-24 bg-white/20 rotate-[45deg] origin-top-left absolute left-1/2 -top-20" />

                            <div className="border border-white/10 bg-black/40 px-3 py-1 rounded text-xs text-slate-300 mt-2">{cat.name}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
