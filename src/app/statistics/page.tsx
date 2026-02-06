"use client";

import { useState } from "react";
import Link from "next/link";
import { FlaskConical, Calculator, Scale, BrainCircuit, ArrowLeft } from "lucide-react";
import EstimationSection from "@/components/statistics/EstimationSection";
import EffectSizeSection from "@/components/statistics/EffectSizeSection";
import AdvancedEstimationSection from "@/components/statistics/AdvancedEstimationSection";

type Tab = 'estimation' | 'effect-size' | 'advanced';

export default function StatisticsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('estimation');

    return (
        <div className="min-h-screen bg-lab-dark text-white font-sans selection:bg-lab-lime selection:text-lab-dark">
            {/* Navbar */}
            <nav className="border-b border-white/5 backdrop-blur-md sticky top-0 z-50 bg-black/50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-2xl tracking-tight">
                        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <FlaskConical className="w-6 h-6 text-lab-lime" />
                            <span>Synthetic <span className="text-lab-lime">DOE</span> Lab</span>
                        </Link>
                        <span className="text-slate-600 mx-2">/</span>
                        <span className="text-white">Statistical Dashboard</span>
                    </div>

                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="mb-12">
                    <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                        통계 분석 및 추정
                    </h1>
                    <p className="text-slate-400 text-lg">
                        데이터의 불확실성을 정량화하고, 고급 추정 기법(MLE/MAP)을 통해 인사이트를 도출합니다.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-4 mb-8 border-b border-white/10 pb-1">
                    <button
                        onClick={() => setActiveTab('estimation')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold transition-all relative ${activeTab === 'estimation'
                            ? "text-lab-lime bg-white/5 border-b-2 border-lab-lime"
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        <Calculator className="w-4 h-4" />
                        점/구간 추정
                    </button>
                    <button
                        onClick={() => setActiveTab('effect-size')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold transition-all relative ${activeTab === 'effect-size'
                            ? "text-purple-400 bg-white/5 border-b-2 border-purple-400"
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        <Scale className="w-4 h-4" />
                        효과 크기 분석
                    </button>
                    <button
                        onClick={() => setActiveTab('advanced')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold transition-all relative ${activeTab === 'advanced'
                            ? "text-blue-400 bg-white/5 border-b-2 border-blue-400"
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        <BrainCircuit className="w-4 h-4" />
                        고급 파라미터 추정
                    </button>
                </div>

                {/* Content Area */}
                <div className="min-h-[500px]">
                    {activeTab === 'estimation' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <EstimationSection />
                        </div>
                    )}
                    {activeTab === 'effect-size' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <EffectSizeSection />
                        </div>
                    )}
                    {activeTab === 'advanced' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <AdvancedEstimationSection />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
