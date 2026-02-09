"use client";

export const dynamic = "force-static";

import { useState } from "react";
import nextDynamic from "next/dynamic";
import Link from "next/link";
import { FlaskConical, Calculator, Scale, BrainCircuit, ArrowLeft } from "lucide-react";

// Dynamic imports to avoid SSR issues with Plotly
const EstimationSection = nextDynamic(() => import("@/components/statistics/EstimationSection"), { ssr: false });
const EffectSizeSection = nextDynamic(() => import("@/components/statistics/EffectSizeSection"), { ssr: false });
const AdvancedEstimationSection = nextDynamic(() => import("@/components/statistics/AdvancedEstimationSection"), { ssr: false });
const HelpSection = nextDynamic(() => import("@/components/common/HelpSection").then(mod => mod.HelpSection), { ssr: false });

type Tab = 'estimation' | 'effect-size' | 'advanced' | 'help';

export default function StatisticsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('estimation');

    const helpItems = [
        {
            title: "Bayesian Estimation (베이지안 추정)",
            description: "사전 지식(Prior)과 관측 데이터(Likelihood)를 결합하여 모수를 추정하는 방법입니다.",
            details: [
                "MLE (최대우도추정): 오직 관측 데이터만을 기반으로 가장 가능성 높은 모수를 찾습니다.",
                "MAP (최대사후확률): 사전 믿음과 데이터를 결합하여 사후 확률을 극대화하는 모수를 찾습니다.",
                "데이터가 많아질수록 MAP 추정치는 MLE로 수렴합니다."
            ],
            color: "bg-blue-500/10"
        },
        {
            title: "ARIMA (AutoRegressive Integrated Moving Average)",
            description: "전형적인 시계열 예측 모델로, 데이터의 자기상관성과 추세를 분석합니다.",
            details: [
                "p (AR): 과거 값이 현재에 미치는 영향",
                "d (I): 시계열의 비정상성을 제거하기 위한 차분 횟수",
                "q (MA): 과거 오차가 현재에 미치는 영향"
            ],
            color: "bg-lime-500/10"
        },
        {
            title: "Prophet (FB Prophet)",
            description: "페이스북에서 개발한 시계열 예측 오픈소스로, 계절성과 휴일 효과를 잘 반영합니다.",
            details: [
                "Trend: 시간에 따른 전체적인 방향성",
                "Seasonality: 일별, 주별, 연별 반복되는 패턴",
                "비즈니스 시계열 데이터(매출, 방문자수 등) 분석에 탁월합니다."
            ],
            color: "bg-purple-500/10"
        }
    ];

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
                    <button
                        onClick={() => setActiveTab('help')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold transition-all relative ${activeTab === 'help'
                            ? "text-slate-200 bg-white/5 border-b-2 border-slate-200"
                            : "text-slate-500 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        <span className="text-sm">❓ 도움말</span>
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
                    {activeTab === 'help' && (
                        <HelpSection
                            title="통계 분석 도움말"
                            subtitle="Dashboard에서 활용되는 주요 통계 기법에 대한 이해를 돕습니다."
                            items={helpItems}
                            onClose={() => setActiveTab('estimation')}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}
