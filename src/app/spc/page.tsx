"use client";

export const dynamic = "force-static";

import { useEffect, useState } from "react";
import { SPCDashboard } from "@/components/spc/SPCDashboard";
import { FlaskConical, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { SPCResult, DesignConfig } from "@/types";

interface SPCData {
    matrix: Record<string, unknown>[];
    settings: DesignConfig;
    spcResult: SPCResult;
}

export default function SPCPage() {
    const [data, setData] = useState<SPCData | null>(null);

    useEffect(() => {
        // Load data from session storage
        const stored = sessionStorage.getItem('spc_analysis_data');
        if (stored) {
            try {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setData(JSON.parse(stored) as SPCData);
            } catch (e) {
                console.error("Failed to parse SPC data", e);
            }
        }
    }, []);

    if (!data) {
        return (
            <div className="min-h-screen bg-lab-dark text-white flex items-center justify-center">
                <div className="text-center text-slate-500">
                    <p>데이터를 불러오는 중이거나 데이터가 없습니다.</p>
                    <p className="text-xs mt-2">실험 생성 페이지에서 &apos;분포 상세 분석&apos;을 클릭해주세요.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-lab-dark text-white font-sans">
            <nav className="border-b border-white/5 backdrop-blur-md sticky top-0 z-50 bg-lab-dark/80">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors"
                            title="메인으로 이동"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-400" />
                        </Link>
                        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                            <FlaskConical className="w-6 h-6 text-lab-lime" />
                            <span>Synthetic <span className="text-lab-lime">DOE</span> SPC Analysis</span>
                        </div>
                    </div>
                    <div className="text-sm font-mono text-slate-400">
                        {data.settings?.name}
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-10">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold mb-2">상세 공정 능력 분석</h1>
                    <p className="text-slate-400 text-sm">
                        생성된 가상 데이터에 대한 심층 통계 분석을 수행합니다.
                        관리도 타입을 변경하거나 계층별 분석을 시도해보세요.
                    </p>
                </div>

                <SPCDashboard
                    data={data.matrix}
                    spcResult={data.spcResult}
                    variables={data.settings?.variables}
                />
            </main>
        </div>
    );
}
