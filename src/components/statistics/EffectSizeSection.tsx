"use client";

import { useState, useRef } from "react";
import Plot from "react-plotly.js";
import { calculateEffectSize } from "@/lib/api";
import { EffectSizeResult } from "@/types";
import { Scale, Loader2, FileDown } from "lucide-react";
import html2canvas from "html2canvas";
import { downloadPDF } from "@/lib/reportUtils";
import { ReportView } from "./ReportView";

export default function EffectSizeSection() {
    const [groupAInput, setGroupAInput] = useState<string>("85, 87, 86, 88, 85, 89, 84");
    const [groupBInput, setGroupBInput] = useState<string>("92, 91, 93, 90, 94, 91, 92");
    const [result, setResult] = useState<EffectSizeResult | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // PDF Generation State
    const [reportChartImg, setReportChartImg] = useState<string | undefined>(undefined);
    const chartRef = useRef<HTMLDivElement>(null);

    const handleCalculate = async () => {
        setLoading(true);
        setError(null);
        try {
            const groupA = groupAInput.split(",").map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
            const groupB = groupBInput.split(",").map(s => parseFloat(s.trim())).filter(n => !isNaN(n));

            if (groupA.length < 2 || groupB.length < 2) {
                throw new Error("각 그룹은 최소 2개 이상의 데이터가 필요합니다.");
            }

            const res = await calculateEffectSize({ group_a: groupA, group_b: groupB });
            setResult(res);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    };

    // Helper for visualization
    const generateNormalDist = (mean: number, std: number, nPoints = 100) => {
        const x = [];
        const y = [];
        const minX = mean - 4 * std;
        const maxX = mean + 4 * std;
        const step = (maxX - minX) / nPoints;

        for (let i = 0; i < nPoints; i++) {
            const val = minX + i * step;
            const prob = (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((val - mean) / std, 2));
            x.push(val);
            y.push(prob);
        }
        return { x, y };
    };

    let plotData: any[] = [];
    if (result) {
        const distA = generateNormalDist(result.mean_a, result.std_pooled); // Use pooled std for visualization consistency in effect size context often simplified
        const distB = generateNormalDist(result.mean_b, result.std_pooled);

        plotData = [
            {
                x: distA.x,
                y: distA.y,
                type: 'scatter',
                mode: 'lines',
                name: 'Group A',
                fill: 'tozeroy',
                fillcolor: 'rgba(190, 242, 100, 0.2)',
                line: { color: '#BEF264' }
            },
            {
                x: distB.x,
                y: distB.y,
                type: 'scatter',
                mode: 'lines',
                name: 'Group B',
                fill: 'tozeroy',
                fillcolor: 'rgba(168, 85, 247, 0.2)',
                line: { color: '#A855F7' }
            }
        ];
    }

    const handleDownloadPDF = async () => {
        if (!result || !chartRef.current) return;

        try {
            // 1. Capture Chart
            const canvas = await html2canvas(chartRef.current, { backgroundColor: null, scale: 2 });
            const imgData = canvas.toDataURL("image/png");
            setReportChartImg(imgData);

            // 2. Wait for ReportView to render with image (short delay)
            setTimeout(() => {
                downloadPDF("effect-size-report", "EffectSize_Report.pdf");
            }, 100);

        } catch (e) {
            console.error("PDF Fail", e);
        }
    };

    return (
        <div className="space-y-8 relative">
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-purple-400" />
                    그룹 데이터 입력
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            Group A (Control)
                        </label>
                        <textarea
                            value={groupAInput}
                            onChange={(e) => setGroupAInput(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white h-24 focus:outline-none focus:border-lab-lime transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            Group B (Experimental)
                        </label>
                        <textarea
                            value={groupBInput}
                            onChange={(e) => setGroupBInput(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white h-24 focus:outline-none focus:border-purple-400 transition-colors"
                        />
                    </div>
                </div>
                <div className="mt-6">
                    <button
                        onClick={handleCalculate}
                        disabled={loading}
                        className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "효과 크기 (Cohen's d) 계산"}
                    </button>
                    {error && (
                        <div className="mt-3 p-3 bg-red-500/20 text-red-400 rounded-lg text-sm border border-red-500/30">
                            {error}
                        </div>
                    )}
                </div>
            </div>

            {result && (
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-6">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-bold text-white">분석 결과</h4>
                        <button
                            onClick={handleDownloadPDF}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-bold border border-white/10"
                        >
                            <FileDown className="w-4 h-4" />
                            PDF 리포트 저장
                        </button>
                    </div>

                    <div className="flex flex-col items-center justify-center p-8 bg-black/20 rounded-2xl border border-white/5">
                        <div className="text-slate-400 mb-2">Cohen's d</div>
                        <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-lab-lime to-purple-400">
                            {result.cohens_d.toFixed(2)}
                        </div>
                        <div className="mt-3 px-4 py-1 rounded-full bg-white/10 text-white font-bold">
                            {result.interpretation}
                        </div>
                    </div>

                    <div ref={chartRef} className="h-[400px] w-full bg-black/20 rounded-xl overflow-hidden border border-white/5 p-2">
                        <Plot
                            data={plotData}
                            layout={{
                                title: { text: "두 집단 분포 비교 (Overlap Visualization)", font: { color: 'white' } },
                                paper_bgcolor: 'rgba(0,0,0,0)',
                                plot_bgcolor: 'rgba(0,0,0,0)',
                                xaxis: {
                                    showgrid: true,
                                    gridcolor: '#333',
                                    tickfont: { color: '#ccc' },
                                },
                                yaxis: {
                                    showgrid: false,
                                    tickfont: { color: '#ccc' }
                                },
                                legend: { orientation: 'h', x: 0.5, xanchor: 'center', font: { color: '#ccc' } },
                                autosize: true,
                                margin: { t: 50, b: 30, l: 30, r: 30 }
                            }}
                            useResizeHandler={true}
                            style={{ width: "100%", height: "100%" }}
                        />
                    </div>

                    <div className="text-sm text-slate-400 bg-purple-500/10 p-4 rounded-xl border border-purple-500/20">
                        💡 <strong>해석:</strong> 두 집단 간의 평균 차이는 표준편차의 약 <strong>{result.cohens_d.toFixed(2)}배</strong>에 해당합니다.
                        이는 통계적으로 <strong>"{result.interpretation}"</strong> 정도의 중요성을 가집니다.
                        {Math.abs(result.cohens_d) > 0.8 && " 차이가 매우 크므로 실질적인 의미가 큽니다."}
                        {Math.abs(result.cohens_d) < 0.2 && " 차이가 미미하여 우연에 의한 것일 수 있습니다."}
                    </div>

                    {/* Hidden Report Container */}
                    <div style={{ position: 'fixed', top: 0, left: '-9999px', zIndex: -1 }} id="effect-size-report">
                        <ReportView
                            title="Effect Size Analysis Report"
                            date={new Date().toLocaleDateString()}
                            params={[
                                { label: "Group A Mean", value: result.mean_a.toFixed(2) },
                                { label: "Group B Mean", value: result.mean_b.toFixed(2) }
                            ]}
                            results={[
                                { label: "Cohen's d", value: result.cohens_d.toFixed(4), highlight: true },
                                { label: "Interpretation", value: result.interpretation },
                                { label: "Pooled Std Dev", value: result.std_pooled.toFixed(4) }
                            ]}
                            chartImage={reportChartImg}
                            insight={`The calculated Cohen's d is ${result.cohens_d.toFixed(2)}, which indicates a "${result.interpretation}" between the two groups. The mean difference is ${Math.abs(result.mean_a - result.mean_b).toFixed(2)}.`}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
