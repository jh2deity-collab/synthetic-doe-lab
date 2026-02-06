"use client";

import { useState, useRef } from "react";
import Plot from "react-plotly.js";
import { calculateAdvancedEstimation } from "@/lib/api";
import { AdvancedResult } from "@/types";
import { BrainCircuit, Loader2, FileDown } from "lucide-react";
import html2canvas from "html2canvas";
import { downloadPDF } from "@/lib/reportUtils";
import { ReportView } from "./ReportView";

export default function AdvancedEstimationSection() {
    const [dataInput, setDataInput] = useState<string>("5.1, 4.9, 5.2, 5.8, 4.8, 5.1, 5.3, 5.0");
    const [priorMean, setPriorMean] = useState<number>(5.5);
    const [priorStd, setPriorStd] = useState<number>(0.5);
    const [result, setResult] = useState<AdvancedResult | null>(null);
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
            const res = await calculateAdvancedEstimation({
                data,
                prior_mean: priorMean,
                prior_std: priorStd
            });
            setResult(res);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    };

    // Normal Distribution Generator
    const generateNormal = (mean: number, std: number, xRange: number[]) => {
        const x = [];
        const y = [];
        const step = (xRange[1] - xRange[0]) / 200;
        for (let val = xRange[0]; val <= xRange[1]; val += step) {
            const prob = (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((val - mean) / std, 2));
            x.push(val);
            y.push(prob);
        }
        return { x, y };
    };

    let plotData: any[] = [];
    if (result) {
        // Determine x-axis range for plotting
        const allX = [...result.kde_x];
        const minX = Math.min(...allX);
        const maxX = Math.max(...allX);

        // Generate Curve Points
        const mleCurve = generateNormal(result.mle_mean, result.mle_std, [minX, maxX]);
        const mapCurve = generateNormal(result.map_mean, result.map_std, [minX, maxX]);
        const priorCurve = generateNormal(priorMean, priorStd, [minX, maxX]);

        plotData = [
            {
                x: result.kde_x,
                y: result.kde_y,
                type: 'scatter',
                mode: 'lines',
                name: 'KDE (Actual Data)',
                line: { color: 'white', width: 3, dash: 'solid' }
            },
            {
                x: mleCurve.x,
                y: mleCurve.y,
                type: 'scatter',
                mode: 'lines',
                name: 'MLE (Data Only)',
                line: { color: '#BEF264', width: 2, dash: 'dot' }
            },
            {
                x: mapCurve.x,
                y: mapCurve.y,
                type: 'scatter',
                mode: 'lines',
                name: 'MAP (Prior + Data)',
                line: { color: '#A855F7', width: 3 }
            },
            {
                x: priorCurve.x,
                y: priorCurve.y,
                type: 'scatter',
                mode: 'lines',
                name: 'Prior Belief',
                line: { color: 'rgba(255, 255, 255, 0.3)', width: 1 }
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
                downloadPDF("advanced-estimation-report", "Bayesian_Estimation_Report.pdf");
            }, 100);

        } catch (e) {
            console.error("PDF Fail", e);
        }
    };

    return (
        <div className="space-y-8 relative">
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-blue-400" />
                    베이지안 추정 설정
                </h3>
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                관측 데이터 (Data)
                            </label>
                            <textarea
                                value={dataInput}
                                onChange={(e) => setDataInput(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white h-24 focus:outline-none focus:border-blue-400 transition-colors"
                            />
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="bg-blue-900/10 p-4 rounded-xl border border-blue-500/20">
                            <div className="text-sm font-bold text-blue-300 mb-4">사전 믿음 (Prior Belief)</div>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs mb-1 text-slate-400">
                                        <span>예상 평균 (Prior Mean)</span>
                                        <span>{priorMean}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="10"
                                        step="0.1"
                                        value={priorMean}
                                        onChange={(e) => setPriorMean(parseFloat(e.target.value))}
                                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-400"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1 text-slate-400">
                                        <span>불확실성 (Prior Std Dev)</span>
                                        <span>{priorStd}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="5"
                                        step="0.1"
                                        value={priorStd}
                                        onChange={(e) => setPriorStd(parseFloat(e.target.value))}
                                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-400"
                                    />
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleCalculate}
                            disabled={loading}
                            className="w-full bg-blue-500 text-white font-bold py-3 rounded-xl hover:bg-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "파라미터 추정 (MLE vs MAP)"}
                        </button>
                    </div>
                </div>
                {error && (
                    <div className="mt-4 p-3 bg-red-500/20 text-red-400 rounded-lg text-sm border border-red-500/30">
                        {error}
                    </div>
                )}
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-black/20 rounded-xl border-l-4 border-lime-400">
                            <div className="text-xs text-slate-400 mb-1">MLE (데이터만 고려)</div>
                            <div className="text-xl font-bold text-white">Mean: {result.mle_mean.toFixed(3)}</div>
                            <div className="text-xs text-slate-500">데이터 평균 그대로</div>
                        </div>
                        <div className="p-4 bg-black/20 rounded-xl border-l-4 border-purple-500">
                            <div className="text-xs text-slate-400 mb-1">MAP ({priorStd < 0.5 ? "강한 믿음" : "약한 믿음"} 반영)</div>
                            <div className="text-xl font-bold text-white">Mean: {result.map_mean.toFixed(3)}</div>
                            <div className="text-xs text-slate-500">Prior쪽으로 {Math.abs(result.mle_mean - result.map_mean).toFixed(3)} 이동</div>
                        </div>
                        <div className="p-4 bg-black/20 rounded-xl border-l-4 border-slate-500">
                            <div className="text-xs text-slate-400 mb-1">Prior (사전 믿음)</div>
                            <div className="text-xl font-bold text-white">Mean: {priorMean}</div>
                            <div className="text-xs text-slate-500">Std: {priorStd}</div>
                        </div>
                    </div>

                    <div ref={chartRef} className="h-[450px] w-full bg-black/20 rounded-xl overflow-hidden border border-white/5 p-2">
                        <Plot
                            data={plotData}
                            layout={{
                                title: { text: "파라미터 추정 비교 (MLE vs MAP vs Prior)", font: { color: 'white' } },
                                paper_bgcolor: 'rgba(0,0,0,0)',
                                plot_bgcolor: 'rgba(0,0,0,0)',
                                xaxis: {
                                    showgrid: true,
                                    gridcolor: '#333',
                                    tickfont: { color: '#ccc' },
                                },
                                yaxis: {
                                    showgrid: false,
                                    tickfont: { color: '#ccc' },
                                    title: 'Probability Density'
                                },
                                legend: { orientation: 'h', x: 0.5, xanchor: 'center', font: { color: '#ccc' } },
                                autosize: true,
                                margin: { t: 50, b: 30, l: 30, r: 30 }
                            }}
                            useResizeHandler={true}
                            style={{ width: "100%", height: "100%" }}
                        />
                    </div>

                    <div className="text-sm text-slate-400 bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                        💡 <strong>인사이트:</strong>
                        데이터가 충분하면(n이 커지면) <strong>MAP(보라색)</strong>는 <strong>MLE(점선)</strong>에 수렴합니다.
                        반대로 데이터가 적거나 사전 믿음이 강할수록(작은 Prior Std) MAP는 Prior(사전 분포) 쪽에 머무릅니다.
                        현재 결과에서 MAP 추정량은 MLE보다 <strong>{Math.abs(result.mle_mean - result.map_mean) < 0.05 ? "거의 차이가 없습니다." : "확연히 다릅니다."}</strong>
                    </div>

                    {/* Hidden Report Container */}
                    <div style={{ position: 'fixed', top: 0, left: '-9999px', zIndex: -1 }} id="advanced-estimation-report">
                        <ReportView
                            title="Bayesian Parameter Estimation Report"
                            date={new Date().toLocaleDateString()}
                            params={[
                                { label: "Prior Mean", value: priorMean },
                                { label: "Prior Std Dev", value: priorStd }
                            ]}
                            results={[
                                { label: "MLE Mean (Data)", value: result.mle_mean.toFixed(4) },
                                { label: "MAP Mean (Posterior)", value: result.map_mean.toFixed(4), highlight: true },
                                { label: "Prior Influence", value: Math.abs(result.mle_mean - result.map_mean) < 0.05 ? "Low" : "High" }
                            ]}
                            chartImage={reportChartImg}
                            insight={`The Maximum Likelihood Estimate (MLE) based solely on data is ${result.mle_mean.toFixed(3)}. Incorporating prior beliefs (Mean=${priorMean}, Std=${priorStd}), the Maximum A Posteriori (MAP) estimate is ${result.map_mean.toFixed(3)}. The shift from MLE to MAP indicates the influence of the prior distribution on the final estimate.`}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
