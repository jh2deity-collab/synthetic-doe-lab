"use client";

import { useState, useRef } from "react";
import Plot from "react-plotly.js";
import { calculateEstimation } from "@/lib/api";
import { EstimationResult } from "@/types";
import { Calculator, Loader2, FileDown } from "lucide-react";
import { toPng } from "html-to-image";
import { downloadPDF } from "@/lib/reportUtils";
import { ReportView } from "./ReportView";

export default function EstimationSection() {
    const [dataInput, setDataInput] = useState<string>("10, 12, 11, 13, 10, 9, 14, 12, 11, 10");
    const [confidenceLevel, setConfidenceLevel] = useState<number>(0.95);
    const [result, setResult] = useState<EstimationResult | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // PDF Generation State
    const [reportChartImg, setReportChartImg] = useState<string | undefined>(undefined);
    const chartRef = useRef<HTMLDivElement>(null);

    const handleCalculate = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = dataInput.split(",").map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
            if (data.length < 2) {
                throw new Error("최소 2개 이상의 데이터가 필요합니다.");
            }
            const res = await calculateEstimation({ data, confidence_level: confidenceLevel });
            setResult(res);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!result || !chartRef.current) return;

        try {
            // 1. Capture Chart using html-to-image
            const imgData = await toPng(chartRef.current, { backgroundColor: '#1e293b', pixelRatio: 2 });
            setReportChartImg(imgData);

            // 2. Wait for ReportView to render with image (short delay)
            setTimeout(() => {
                downloadPDF("estimation-report", "Estimation_Report.pdf");
            }, 100);

        } catch (e) {
            console.error("PDF Fail", e);
        }
    };

    return (
        <div className="space-y-8 relative">
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-lab-lime" />
                    파라미터 설정
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            데이터 입력 (쉼표로 구분)
                        </label>
                        <textarea
                            value={dataInput}
                            onChange={(e) => setDataInput(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white h-24 focus:outline-none focus:border-lab-lime transition-colors"
                            placeholder="예: 10, 12, 11, 13..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            신뢰수준 (Confidence Level): {confidenceLevel * 100}%
                        </label>
                        <input
                            type="range"
                            min="0.90"
                            max="0.99"
                            step="0.01"
                            value={confidenceLevel}
                            onChange={(e) => setConfidenceLevel(parseFloat(e.target.value))}
                            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-lab-lime"
                        />
                    </div>
                    <button
                        onClick={handleCalculate}
                        disabled={loading}
                        className="w-full bg-lab-lime text-lab-dark font-bold py-3 rounded-xl hover:bg-lime-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "분석 실행"}
                    </button>
                    {error && (
                        <div className="p-3 bg-red-500/20 text-red-400 rounded-lg text-sm border border-red-500/30">
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

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-black/20 rounded-xl text-center">
                            <div className="text-sm text-slate-400">표본 평균</div>
                            <div className="text-2xl font-bold text-lab-lime">{result.mean.toFixed(2)}</div>
                        </div>
                        <div className="p-4 bg-black/20 rounded-xl text-center">
                            <div className="text-sm text-slate-400">표준 편차</div>
                            <div className="text-2xl font-bold text-white">{result.std_dev.toFixed(2)}</div>
                        </div>
                        <div className="p-4 bg-black/20 rounded-xl text-center">
                            <div className="text-sm text-slate-400">오차 한계 (MOE)</div>
                            <div className="text-2xl font-bold text-purple-400">±{result.margin_of_error.toFixed(2)}</div>
                        </div>
                        <div className="p-4 bg-black/20 rounded-xl text-center">
                            <div className="text-sm text-slate-400">신뢰 구간 ({result.confidence_level * 100}%)</div>
                            <div className="text-lg font-bold text-blue-400">
                                [{result.lower_bound.toFixed(2)}, {result.upper_bound.toFixed(2)}]
                            </div>
                        </div>
                    </div>

                    <div ref={chartRef} className="h-[400px] w-full bg-black/20 rounded-xl overflow-hidden border border-white/5 p-2">
                        <Plot
                            data={[
                                {
                                    x: [result.mean],
                                    y: ['Estimate'],
                                    error_x: {
                                        type: 'data',
                                        array: [result.margin_of_error],
                                        visible: true,
                                        color: '#BEF264',
                                        thickness: 3,
                                        width: 10
                                    },
                                    type: 'scatter',
                                    mode: 'markers',
                                    marker: { size: 12, color: '#BEF264' },
                                    name: 'Mean & CI'
                                }
                            ]}
                            layout={{
                                title: { text: "점 추정 및 신뢰 구간", font: { color: 'white' } },
                                paper_bgcolor: 'rgba(0,0,0,0)',
                                plot_bgcolor: 'rgba(0,0,0,0)',
                                xaxis: {
                                    showgrid: true,
                                    gridcolor: '#333',
                                    tickfont: { color: '#ccc' },
                                    zeroline: false
                                },
                                yaxis: {
                                    showgrid: false,
                                    tickfont: { color: '#ccc' }
                                },
                                showlegend: false,
                                autosize: true,
                                margin: { t: 50, b: 30, l: 30, r: 30 }
                            }}
                            useResizeHandler={true}
                            style={{ width: "100%", height: "100%" }}
                        />
                    </div>

                    <div className="text-sm text-slate-400 bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                        💡 <strong>해석:</strong> 위 데이터의 평균은 약 <strong>{result.mean.toFixed(2)}</strong>이며,
                        우리는 모집단의 실제 평균이 <strong>{result.confidence_level * 100}%</strong> 확률로
                        <strong> {result.lower_bound.toFixed(2)}</strong>와 <strong>{result.upper_bound.toFixed(2)}</strong> 사이에 있다고 추정할 수 있습니다.
                    </div>

                    {/* Hidden Report Container - Positioned behind content for capture */}
                    <div style={{ position: 'fixed', top: 0, left: 0, zIndex: -50, visibility: 'visible', opacity: 0.01, pointerEvents: 'none' }} id="estimation-report">
                        <ReportView
                            title="Statistical Estimation Report"
                            date={new Date().toLocaleDateString()}
                            params={[
                                { label: "Confidence Level", value: `${result.confidence_level * 100}%` },
                                { label: "Sample Size (N)", value: result.n }
                            ]}
                            results={[
                                { label: "Sample Mean", value: result.mean.toFixed(4), highlight: true },
                                { label: "Margin of Error", value: `±${result.margin_of_error.toFixed(4)}` },
                                { label: "CI Lower Bound", value: result.lower_bound.toFixed(4) },
                                { label: "CI Upper Bound", value: result.upper_bound.toFixed(4) },
                                { label: "Standard Deviation", value: result.std_dev.toFixed(4) }
                            ]}
                            chartImage={reportChartImg}
                            insight={`Based on the sample data (N=${result.n}), the estimated population mean is ${result.mean.toFixed(2)}. We can state with ${result.confidence_level * 100}% confidence that the true population mean lies between ${result.lower_bound.toFixed(2)} and ${result.upper_bound.toFixed(2)}. The margin of error is ±${result.margin_of_error.toFixed(2)}.`}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
