"use client";

import { useState, useRef } from "react";
import Plot from "react-plotly.js";
import { calculateEffectSize } from "@/lib/api";
import { EffectSizeResult } from "@/types";
import { Scale, Loader2, FileDown, Upload } from "lucide-react";
import { toPng } from "html-to-image";
import { downloadPDF } from "@/lib/reportUtils";
import { ReportView } from "./ReportView";
import { parseDataFile } from "@/lib/fileParser";

export default function EffectSizeSection() {
    const [groupAInput, setGroupAInput] = useState<string>("85, 87, 86, 88, 85, 89, 84");
    const [groupBInput, setGroupBInput] = useState<string>("92, 91, 93, 90, 94, 91, 92");
    const [result, setResult] = useState<EffectSizeResult | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // PDF Generation State
    const [reportChartImg, setReportChartImg] = useState<string | undefined>(undefined);
    const chartRef = useRef<HTMLDivElement>(null);
    const fileInputRefA = useRef<HTMLInputElement>(null);
    const fileInputRefB = useRef<HTMLInputElement>(null);

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
            setIsGeneratingPdf(true);

            // 1. Capture Chart using html-to-image
            const imgData = await toPng(chartRef.current, { backgroundColor: '#1e293b', pixelRatio: 2 });
            setReportChartImg(imgData);

            // 2. Wait for ReportView to render with image (using overlay)
            setTimeout(async () => {
                await downloadPDF("effect-size-report", "EffectSize_Report.pdf");
                setIsGeneratingPdf(false);
            }, 1000);

        } catch (e) {
            console.error("PDF Fail", e);
            setIsGeneratingPdf(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, setInput: (v: string) => void) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const parsedData = await parseDataFile(file);
            setInput(parsedData);
            setError(null);
        } catch (err) {
            console.error("File upload error:", err);
            setError("파일 처리 중 오류가 발생했습니다.");
        } finally {
            // Reset input
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
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-purple-400" />
                    효과 크기 분석 (Cohen's d)
                </h3>
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-slate-300">
                                    그룹 A 데이터 (실험군)
                                </label>
                                <button
                                    onClick={() => fileInputRefA.current?.click()}
                                    className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                                >
                                    <Upload className="w-3 h-3" />
                                    파일 업로드
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRefA}
                                    onChange={(e) => handleFileUpload(e, setGroupAInput)}
                                    accept=".csv,.xlsx,.xls,.txt"
                                    className="hidden"
                                />
                            </div>
                            <textarea
                                value={groupAInput}
                                onChange={(e) => setGroupAInput(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white h-24 focus:outline-none focus:border-purple-400 transition-colors"
                                placeholder="85, 87, 86..."
                            />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-slate-300">
                                    그룹 B 데이터 (대조군)
                                </label>
                                <button
                                    onClick={() => fileInputRefB.current?.click()}
                                    className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                                >
                                    <Upload className="w-3 h-3" />
                                    파일 업로드
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRefB}
                                    onChange={(e) => handleFileUpload(e, setGroupBInput)}
                                    accept=".csv,.xlsx,.xls,.txt"
                                    className="hidden"
                                />
                            </div>
                            <textarea
                                value={groupBInput}
                                onChange={(e) => setGroupBInput(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white h-24 focus:outline-none focus:border-purple-400 transition-colors"
                                placeholder="92, 91, 93..."
                            />
                        </div>
                    </div>
                </div>
                <div className="mt-6">
                    <button
                        onClick={handleCalculate}
                        disabled={loading || isGeneratingPdf}
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
                            disabled={isGeneratingPdf}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-bold border border-white/10"
                        >
                            {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
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

                    {/* Report Container (Masked) */}
                    {isGeneratingPdf && (
                        <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 9000, backgroundColor: 'white' }}>
                            <div id="effect-size-report-page-1">
                                <ReportView
                                    title="효과 크기 분석 리포트"
                                    date={new Date().toLocaleDateString('ko-KR')}
                                    params={[
                                        { label: "그룹 A 평균", value: result.mean_a.toFixed(2) },
                                        { label: "그룹 B 평균", value: result.mean_b.toFixed(2) }
                                    ]}
                                    results={[
                                        { label: "Cohen's d", value: result.cohens_d.toFixed(4), highlight: true },
                                        { label: "해석", value: result.interpretation },
                                        { label: "통합 표준편차", value: result.std_pooled.toFixed(4) }
                                    ]}
                                    chartImage={reportChartImg}
                                    insight={`계산된 Cohen's d는 ${result.cohens_d.toFixed(2)}이며, 이는 두 그룹 간 "${result.interpretation}" 효과 크기를 나타냅니다. 평균 차이는 ${Math.abs(result.mean_a - result.mean_b).toFixed(2)}입니다.`}
                                />
                            </div>
                            <div id="effect-size-report-page-2" style={{ display: 'none' }}></div>
                        </div>
                        </div>
            )}
        </div>
    )
}
        </div >
    );
}
