"use client";

import { useState, useRef } from "react";
import Plot from "react-plotly.js";
import { calculateAdvancedEstimation } from "@/lib/api";
import { AdvancedResult } from "@/types";
import { BrainCircuit, Loader2, FileDown, Upload } from "lucide-react";
import { toPng } from "html-to-image";
import { downloadPDF } from "@/lib/reportUtils";
import { ReportView } from "./ReportView";
import { parseDataFile } from "@/lib/fileParser";
import ARIMAAnalysis from "./ARIMAAnalysis";
import ProphetAnalysis from "./ProphetAnalysis";

export default function AdvancedEstimationSection() {
    const [dataInput, setDataInput] = useState<string>("5.1, 4.9, 5.2, 5.8, 4.8, 5.1, 5.3, 5.0");
    const [priorMean, setPriorMean] = useState<number>(5.5);
    const [priorStd, setPriorStd] = useState<number>(0.5);
    const [result, setResult] = useState<AdvancedResult | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // PDF Generation State
    const [reportChartImg, setReportChartImg] = useState<string | undefined>(undefined);
    const chartRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Tab State
    const [activeTab, setActiveTab] = useState<'bayesian' | 'arima' | 'prophet'>('bayesian');

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
            setIsGeneratingPdf(true);

            // 1. Capture Chart using html-to-image
            const imgData = await toPng(chartRef.current, { backgroundColor: '#1e293b', pixelRatio: 2 });
            setReportChartImg(imgData);

            // 2. Wait for ReportView to render with image (using overlay)
            setTimeout(async () => {
                await downloadPDF("advanced-estimation-report", "Bayesian_Estimation_Report.pdf");
                setIsGeneratingPdf(false);
            }, 1000);

        } catch (e) {
            console.error("PDF Fail", e);
            setIsGeneratingPdf(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const parsedData = await parseDataFile(file);
            setDataInput(parsedData);
            setError(null);
        } catch (err) {
            console.error("File upload error:", err);
            setError("파일 처리 중 오류가 발생했습니다.");
        } finally {
            e.target.value = '';
        }
    };

    return (
        <div className="space-y-8 relative">
            {isGeneratingPdf && (
                <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center text-white">
                    <Loader2 className="w-12 h-12 animate-spin text-lab-lime mb-4" />
                    <p className="text-xl font-bold">PDF 리포트 생성 중...</p>
                    <p className="text-slate-400 text-sm mt-2">잠시만 기다려주세요.</p>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-2">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('bayesian')}
                        className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${activeTab === 'bayesian'
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        <BrainCircuit className="w-5 h-5 inline-block mr-2" />
                        베이지안 추정
                    </button>
                    <button
                        onClick={() => setActiveTab('arima')}
                        className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${activeTab === 'arima'
                            ? 'bg-gradient-to-r from-lime-500 to-green-600 text-white shadow-lg'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        📈 ARIMA
                    </button>
                    <button
                        onClick={() => setActiveTab('prophet')}
                        className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${activeTab === 'prophet'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        ✨ Prophet
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'bayesian' && (
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <BrainCircuit className="w-5 h-5 text-blue-400" />
                        베이지안 추정 설정
                    </h3>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-slate-300">
                                        관측 데이터 (Data)
                                    </label>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        <Upload className="w-3 h-3" />
                                        파일 업로드
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        accept=".csv,.xlsx,.xls,.txt"
                                        className="hidden"
                                    />
                                </div>
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
                                disabled={loading || isGeneratingPdf}
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

                    {result && (
                        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-6">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-lg font-bold text-white">분석 결과</h4>
                                <button
                                    onClick={handleDownloadPDF}
                                    disabled={isGeneratingPdf}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-bold border border-white/10"
                                >
                                    {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
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

                            {/* Report Container (Masked) */}
                            {isGeneratingPdf && (
                                <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 9000, backgroundColor: 'white' }}>
                                    <ReportView
                                        baseId="advanced-estimation-report"
                                        title="베이지안 파라미터 추정 리포트"
                                        date={new Date().toLocaleDateString('ko-KR')}
                                        params={[
                                            { label: "사전 평균", value: priorMean },
                                            { label: "사전 표준편차", value: priorStd }
                                        ]}
                                        results={[
                                            { label: "MLE 평균 (데이터)", value: result.mle_mean.toFixed(4) },
                                            { label: "MAP 평균 (사후)", value: result.map_mean.toFixed(4), highlight: true },
                                            { label: "사전 영향도", value: Math.abs(result.mle_mean - result.map_mean) < 0.05 ? "낮음" : "높음" }
                                        ]}
                                        chartImage={reportChartImg}
                                        insight={`이 분석은 베이지안 방식으로 데이터를 분석한 결과입니다. 베이지안 분석은 기존에 알고 있던 정보와 새로운 데이터를 함께 고려하는 방법입니다.

📊 핵심 결과:
• 데이터만 본 결과 (MLE): ${result.mle_mean.toFixed(3)}
• 사전 지식 + 데이터 (MAP): ${result.map_mean.toFixed(3)}
• 사전 지식의 영향: ${Math.abs(result.mle_mean - result.map_mean) < 0.05 ? '낮음 (데이터가 더 중요)' : '높음 (사전 지식이 중요)'}

💡 쉬운 해석:
실험 전에 우리는 평균이 약 ${priorMean} 정도일 것이라고 예상했습니다. 실제 데이터를 측정해보니 평균이 ${result.mle_mean.toFixed(3)}로 나타났습니다. 이 두 정보를 합리적으로 결합하면 최종 추정값은 ${result.map_mean.toFixed(3)}가 됩니다.

🎯 실용적 의미:
${Math.abs(result.mle_mean - result.map_mean) < 0.05 ? `사전 지식과 실제 데이터가 거의 일치합니다. 이는 우리의 초기 예상이 정확했다는 의미입니다.` : result.mle_mean > result.map_mean ? `실제 데이터가 예상보다 높게 나왔지만, 사전 지식을 고려하면 조금 낮춰서 해석하는 것이 안전합니다.` : `실제 데이터가 예상보다 낮게 나왔지만, 사전 지식을 고려하면 조금 높여서 해석하는 것이 안전합니다.`}

📚 참고:
MLE(최대우도추정)는 오직 데이터만 보는 방법이고, MAP(최대사후확률)는 과거 경험과 데이터를 함께 보는 방법입니다. 데이터가 충분하면 두 값이 비슷해지고, 데이터가 적으면 사전 지식이 더 중요해집니다.`}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ARIMA Tab Content */}
            {activeTab === 'arima' && <ARIMAAnalysis />}

            {/* Prophet Tab Content */}
            {activeTab === 'prophet' && <ProphetAnalysis />}
        </div>
    );
}
