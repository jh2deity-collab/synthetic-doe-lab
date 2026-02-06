// @ts-nocheck
"use client";

import dynamic from "next/dynamic";
import { useState, useMemo } from "react";
import { FishboneDiagram } from "./FishboneDiagram";
import { Activity, BarChart2, GitBranch, Settings, Grid } from "lucide-react";
import { SPCResult, Variable } from "@/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false }) as any;

interface SPCProps {
    data: Record<string, unknown>[];
    spcResult: SPCResult;
    variables: Variable[];
}

export const SPCDashboard = ({ data = [], spcResult, variables = [] }: SPCProps) => {
    const [activeTab, setActiveTab] = useState<'control' | 'histogram' | 'pareto' | 'fishbone' | 'scatter'>('control');
    const [chartType, setChartType] = useState<'xbar' | 'imr' | 'r'>('xbar');
    const [stratificationVar, setStratificationVar] = useState<string>("");

    // Scatter Plot State
    const [scatterX, setScatterX] = useState<string>("");
    const [scatterY, setScatterY] = useState<string>("");

    const controlData = (spcResult as any)?.control_chart;

    // Identify categorical variables for stratification
    // Robustly filter safe data and variables
    const safeData = useMemo(() =>
        (Array.isArray(data) ? data : []).filter(d => d && typeof d === 'object'),
        [data]);

    const safeVariables = useMemo(() =>
        (Array.isArray(variables) ? variables : []).filter(v => v && typeof v === 'object' && v.name),
        [variables]);

    // Compute Pareto Data
    const paretoData = useMemo(() => {
        if (!stratificationVar || safeData.length === 0) return null;

        const counts: Record<string, number> = {};
        safeData.forEach(row => {
            const val = row[stratificationVar] as string | number; // Type assertion
            const key = String(val);
            counts[key] = (counts[key] || 0) + 1;
        });

        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const labels = sorted.map(s => s[0]);
        const values = sorted.map(s => s[1]);
        const total = values.reduce((a, b) => a + b, 0);
        let cum = 0;
        const cumulative = values.map(v => {
            cum += v;
            return (cum / total) * 100;
        });

        return { labels, values, cumulative };
    }, [safeData, stratificationVar]);

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mt-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-lab-lime" />
                통계적 공정 관리 (SPC)
            </h3>

            {/* Tabs */}
            <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-2 overflow-x-auto">
                {(['control', 'histogram', 'pareto', 'fishbone', 'scatter'] as const).map(tabId => {
                    const labels: Record<string, string> = {
                        control: '관리도 (Control Chart)',
                        histogram: '히스토그램',
                        pareto: '파레토 차트',
                        fishbone: '특성요인도',
                        scatter: '산점도 (Scatter)'
                    };
                    const icons: Record<string, typeof Activity> = {
                        control: Activity,
                        histogram: BarChart2,
                        pareto: GitBranch,
                        fishbone: Settings,
                        scatter: Grid
                    };
                    const Icon = icons[tabId];

                    return (
                        <button
                            key={tabId}
                            onClick={() => setActiveTab(tabId)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${activeTab === tabId
                                ? 'bg-lab-lime text-lab-dark'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {labels[tabId]}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {/* 1. Control Chart */}
                {activeTab === 'control' && !!controlData && (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <select
                                value={chartType}
                                onChange={(e) => setChartType(e.target.value as 'xbar' | 'imr' | 'r')}
                                className="bg-black/30 border border-white/10 rounded px-3 py-1 text-sm text-slate-300 focus:outline-none focus:border-lab-lime"
                            >
                                <option value="xbar">X-bar Chart (평균 관리도)</option>
                                <option value="imr">I-MR Chart (개별값 및 이동 범위)</option>
                                <option value="r">R Chart (범위 관리도)</option>
                            </select>
                        </div>
                        <div className="h-96 w-full">
                            <Plot
                                data={[
                                    {
                                        y: controlData.values || [],
                                        type: 'scatter',
                                        mode: 'lines+markers',
                                        name: chartType === 'r' ? '범위(Range)' : '측정값',
                                        line: { color: '#0ea5e9' }
                                    },
                                    {
                                        y: Array((controlData.values || []).length).fill(controlData.mean),
                                        type: 'scatter', mode: 'lines', name: 'Center Line',
                                        line: { color: '#ffffff', dash: 'dash', width: 1 }
                                    },
                                    {
                                        y: Array((controlData.values || []).length).fill(controlData.ucl),
                                        type: 'scatter', mode: 'lines', name: 'UCL',
                                        line: { color: '#ef4444', width: 2 }
                                    },
                                    {
                                        y: Array((controlData.values || []).length).fill(controlData.lcl),
                                        type: 'scatter', mode: 'lines', name: 'LCL',
                                        line: { color: '#ef4444', width: 2 }
                                    }
                                ]}
                                layout={{
                                    title: {
                                        text: chartType === 'xbar' ? 'X-bar 관리도' : (chartType === 'imr' ? 'I-MR 관리도 (Simulated)' : 'R 관리도 (Simulated)'),
                                        font: { color: '#ccc' }
                                    },
                                    paper_bgcolor: 'rgba(0,0,0,0)',
                                    plot_bgcolor: 'rgba(0,0,0,0)',
                                    xaxis: { color: '#666', gridcolor: '#222' },
                                    yaxis: { color: '#666', gridcolor: '#222' },
                                    showlegend: true,
                                    legend: { font: { color: '#ccc' } }
                                }}
                                style={{ width: "100%", height: "100%" }}
                            />
                        </div>
                    </div>
                )}

                {/* 2. Histogram */}
                {activeTab === 'histogram' && spcResult?.histogram && (
                    <div className="h-96 w-full">
                        <Plot
                            data={[{
                                x: safeData.map(d => d.synthetic_output_score || d[variables[0]?.name]), // Fallback to first var
                                type: 'histogram',
                                marker: { color: '#bef264', opacity: 0.7 }
                            }]}
                            layout={{
                                title: { text: '공정 능력 분포', font: { color: '#ccc' } },
                                paper_bgcolor: 'rgba(0,0,0,0)',
                                plot_bgcolor: 'rgba(0,0,0,0)',
                                xaxis: { color: '#666', gridcolor: '#222' },
                                yaxis: { color: '#666', gridcolor: '#222' },
                            }}
                            style={{ width: "100%", height: "100%" }}
                        />
                    </div>
                )}

                {/* 3. Fishbone */}
                {activeTab === 'fishbone' && (
                    <FishboneDiagram
                        effect="합성 수율"
                        factors={safeVariables}
                    />
                )}

                {/* 4. Pareto Chart (Updated) */}
                {activeTab === 'pareto' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-400">층별화(Stratification) 분석</h4>
                            <select
                                value={stratificationVar}
                                onChange={(e) => setStratificationVar(e.target.value)}
                                className="bg-black/30 border border-white/10 rounded px-3 py-1 text-sm text-slate-300 focus:outline-none focus:border-lab-lime"
                            >
                                <option value="">분석 변수 선택...</option>
                                {safeVariables.map((v) => (
                                    <option key={v.name} value={v.name}>{v.name} ({v.type})</option>
                                ))}
                            </select>
                        </div>

                        {!paretoData ? (
                            <div className="h-64 flex items-center justify-center text-slate-500 border border-dashed border-white/10 rounded-xl">
                                {safeVariables.length > 0 ? "분석할 변수를 선택해주세요." : "분석 가능한 변수가 없습니다."}
                            </div>
                        ) : (
                            <div className="h-96 w-full">
                                <Plot
                                    data={[
                                        {
                                            x: paretoData.labels,
                                            y: paretoData.values,
                                            type: 'bar',
                                            name: '빈도수',
                                            marker: { color: '#0ea5e9' }
                                        },
                                        {
                                            x: paretoData.labels,
                                            y: paretoData.cumulative,
                                            type: 'scatter',
                                            mode: 'lines+markers',
                                            name: '누적 점유율(%)',
                                            yaxis: 'y2',
                                            line: { color: '#f59e0b', width: 2 }
                                        }
                                    ]}
                                    layout={{
                                        title: { text: `${stratificationVar}별 빈도 분석`, font: { color: '#ccc' } },
                                        paper_bgcolor: 'rgba(0,0,0,0)',
                                        plot_bgcolor: 'rgba(0,0,0,0)',
                                        xaxis: { color: '#666', gridcolor: '#222' },
                                        yaxis: { title: '빈도', color: '#666', gridcolor: '#222' },
                                        yaxis2: {
                                            title: '누적(%)',
                                            overlaying: 'y',
                                            side: 'right',
                                            range: [0, 110],
                                            color: '#666'
                                        },
                                        showlegend: true,
                                        legend: { font: { color: '#ccc' } }
                                    }}
                                    style={{ width: "100%", height: "100%" }}
                                />
                            </div>
                        )}
                    </div>
                )}


                {/* 5. Scatter Diagram (Replaces Check Sheet) */}
                {activeTab === 'scatter' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 bg-black/30 p-3 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-bold text-slate-400">X축 변수:</label>
                                <select
                                    value={scatterX}
                                    onChange={(e) => setScatterX(e.target.value)}
                                    className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-slate-300 focus:border-lab-lime/50 focus:outline-none"
                                >
                                    <option value="">선택...</option>
                                    {safeVariables.map((v) => (
                                        <option key={v.name} value={v.name}>{v.name}</option>
                                    ))}
                                    <option value="synthetic_output_score">Result (Y)</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <label className="text-xs font-bold text-slate-400">Y축 변수:</label>
                                <select
                                    value={scatterY}
                                    onChange={(e) => setScatterY(e.target.value)}
                                    className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-slate-300 focus:border-lab-lime/50 focus:outline-none"
                                >
                                    <option value="">선택...</option>
                                    <option value="synthetic_output_score">Result (Y)</option>
                                    {safeVariables.map((v) => (
                                        <option key={v.name} value={v.name}>{v.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="h-96 w-full border border-white/5 rounded-xl bg-black/20 overflow-hidden relative">
                            {(!scatterX || !scatterY) ? (
                                <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                                    X축과 Y축 변수를 선택하여 상관관계를 분석하세요.
                                </div>
                            ) : (
                                <Plot
                                    data={[{
                                        x: safeData.map(d => d[scatterX]),
                                        y: safeData.map(d => d[scatterY]),
                                        mode: 'markers',
                                        type: 'scatter',
                                        marker: {
                                            color: '#bef264',
                                            size: 8,
                                            opacity: 0.6,
                                            line: { color: 'white', width: 0.5 }
                                        }
                                    }]}
                                    layout={{
                                        title: {
                                            text: `${scatterX} vs ${scatterY}`,
                                            font: { color: '#ccc', size: 14 }
                                        },
                                        paper_bgcolor: 'rgba(0,0,0,0)',
                                        plot_bgcolor: 'rgba(0,0,0,0)',
                                        xaxis: {
                                            title: { text: scatterX, font: { color: '#666' } },
                                            color: '#666',
                                            gridcolor: '#222'
                                        },
                                        yaxis: {
                                            title: { text: scatterY, font: { color: '#666' } },
                                            color: '#666',
                                            gridcolor: '#222'
                                        },
                                        margin: { t: 40, r: 20, l: 50, b: 50 }
                                    }}
                                    style={{ width: "100%", height: "100%" }}
                                    config={{ displayModeBar: false }}
                                />
                            )}
                        </div>
                    </div>
                )}


                {/* Fallback for others/empty */}
                {!controlData && activeTab === 'control' && (
                    <div className="flex items-center justify-center h-64 text-slate-500">
                        실험 데이터를 먼저 생성해주세요.
                    </div>
                )}
            </div>
        </div>
    );
};
