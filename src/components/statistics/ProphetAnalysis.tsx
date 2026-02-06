"use client";

import { useState, useRef } from "react";
import Plot from "react-plotly.js";
import { Sparkles, Loader2, FileDown } from "lucide-react";
import { toPng } from "html-to-image";
import { downloadPDF } from "@/lib/reportUtils";
import { ReportView } from "./ReportView";

interface ProphetResult {
    forecast: number[];
    forecast_lower: number[];
    forecast_upper: number[];
    trend: number[];
    dates: string[];
    components: {
        trend?: number[];
        yearly?: number[];
        weekly?: number[];
    };
}

export default function ProphetAnalysis() {
    const [dataInput, setDataInput] = useState<string>("100, 105, 110, 108, 115, 120, 118, 125, 130, 128, 135, 140, 138, 145, 150");
    const [forecastPeriods, setForecastPeriods] = useState<number>(7);
    const [seasonalityMode, setSeasonalityMode] = useState<'additive' | 'multiplicative'>('additive');
    const [result, setResult] = useState<ProphetResult | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [reportChartImg, setReportChartImg] = useState<string | undefined>(undefined);
    const chartRef = useRef<HTMLDivElement>(null);

    const handleCalculate = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = dataInput.split(",").map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
            if (data.length < 10) {
                throw new Error("Prophet 분석을 위해 최소 10개 이상의 데이터가 필요합니다.");
            }

            const response = await fetch("/api/prophet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    data: { values: data },
                    forecast_periods: forecastPeriods,
                    seasonality_mode: seasonalityMode,
                    yearly_seasonality: false,
                    weekly_seasonality: false,
                    daily_seasonality: false
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Prophet 분석 실패");
            }

            const res = await response.json();
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
            setIsGeneratingPdf(true);
            const imgData = await toPng(chartRef.current, { backgroundColor: '#1e293b', pixelRatio: 2 });
            setReportChartImg(imgData);

            setTimeout(async () => {
                await downloadPDF("prophet-report", "Prophet_Report.pdf");
                setIsGeneratingPdf(false);
            }, 1000);
        } catch (e) {
            console.error("PDF Fail", e);
            setIsGeneratingPdf(false);
        }
    };

    const getChartData = () => {
        if (!result) return [];

        const originalData = dataInput.split(",").map(s => parseFloat(s.trim())).filter(n => !isNaN(n));

        return [
            {
                x: Array.from({ length: originalData.length }, (_, i) => i + 1),
                y: originalData,
                type: 'scatter',
                mode: 'lines+markers',
                name: '원본 데이터',
                line: { color: '#84cc16', width: 2 },
                marker: { size: 6 }
            },
            {
                x: Array.from({ length: result.forecast.length }, (_, i) => originalData.length + i + 1),
                y: result.forecast,
                type: 'scatter',
                mode: 'lines+markers',
                name: '예측값',
                line: { color: '#8b5cf6', width: 2 },
                marker: { size: 8 }
            },
            {
                x: Array.from({ length: result.forecast.length }, (_, i) => originalData.length + i + 1),
                y: result.forecast_upper,
                type: 'scatter',
                mode: 'lines',
                name: '신뢰구간 상한',
                line: { color: 'rgba(139, 92, 246, 0.3)', width: 1 },
                showlegend: false
            },
            {
                x: Array.from({ length: result.forecast.length }, (_, i) => originalData.length + i + 1),
                y: result.forecast_lower,
                type: 'scatter',
                mode: 'lines',
                name: '신뢰구간 하한',
                line: { color: 'rgba(139, 92, 246, 0.3)', width: 1 },
                fill: 'tonexty',
                fillcolor: 'rgba(139, 92, 246, 0.1)',
                showlegend: false
            },
            {
                x: Array.from({ length: result.trend.length }, (_, i) => originalData.length + i + 1),
                y: result.trend,
                type: 'scatter',
                mode: 'lines',
                name: '트렌드',
                line: { color: '#f59e0b', width: 2, dash: 'dash' }
            }
        ];
    };

    return (
        <div className="space-y-6">
            {/* Input Section */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Prophet 모델 설정
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            예측 기간
                        </label>
                        <input
                            type="number"
                            value={forecastPeriods}
                            onChange={(e) => setForecastPeriods(parseInt(e.target.value))}
                            min="1"
                            max="30"
                            className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            계절성 모드
                        </label>
                        <select
                            value={seasonalityMode}
                            onChange={(e) => setSeasonalityMode(e.target.value as 'additive' | 'multiplicative')}
                            className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="additive">가법적 (Additive)</option>
                            <option value="multiplicative">승법적 (Multiplicative)</option>
                        </select>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        시계열 데이터
                    </label>

                    {/* File Upload Button */}
                    <div className="flex gap-2 mb-2">
                        <input
                            type="file"
                            accept=".csv,.txt"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                try {
                                    const text = await file.text();
                                    // Parse CSV - assume single column or comma-separated values
                                    const values = text
                                        .split(/[\n,]/)
                                        .map(v => v.trim())
                                        .filter(v => v && !isNaN(parseFloat(v)))
                                        .map(v => parseFloat(v));

                                    if (values.length > 0) {
                                        setDataInput(values.join(', '));
                                    }
                                } catch (err) {
                                    setError('파일을 읽을 수 없습니다.');
                                }
                            }}
                            className="hidden"
                            id="prophet-file-upload"
                        />
                        <label
                            htmlFor="prophet-file-upload"
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg cursor-pointer transition-colors flex items-center gap-2 text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            CSV 파일 업로드
                        </label>
                        <div className="text-xs text-slate-400 flex items-center">
                            (.csv, .txt 파일 지원)
                        </div>
                    </div>

                    {/* Manual Input */}
                    <textarea
                        value={dataInput}
                        onChange={(e) => setDataInput(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                        placeholder="100, 105, 110, 108, 115... 또는 위에서 파일 업로드"
                    />
                </div>

                <button
                    onClick={handleCalculate}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            분석 중...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5" />
                            Prophet 분석 실행
                        </>
                    )}
                </button>

                {error && (
                    <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                        {error}
                    </div>
                )}
            </div>

            {/* Results Section */}
            {result && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-white">분석 결과</h3>
                        <button
                            onClick={handleDownloadPDF}
                            disabled={isGeneratingPdf}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {isGeneratingPdf ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    생성 중...
                                </>
                            ) : (
                                <>
                                    <FileDown className="w-4 h-4" />
                                    PDF 리포트 저장
                                </>
                            )}
                        </button>
                    </div>

                    {/* Model Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-purple-500/20">
                            <div className="text-sm text-slate-400 mb-1">예측 기간</div>
                            <div className="text-2xl font-bold text-purple-400">{forecastPeriods}개</div>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-pink-500/20">
                            <div className="text-sm text-slate-400 mb-1">계절성 모드</div>
                            <div className="text-2xl font-bold text-pink-400">
                                {seasonalityMode === 'additive' ? '가법적' : '승법적'}
                            </div>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-orange-500/20">
                            <div className="text-sm text-slate-400 mb-1">첫 예측값</div>
                            <div className="text-2xl font-bold text-orange-400">{result.forecast[0].toFixed(2)}</div>
                        </div>
                    </div>

                    {/* Chart */}
                    <div ref={chartRef} className="bg-slate-900 rounded-lg p-4 mb-4">
                        <Plot
                            data={getChartData() as any}
                            layout={{
                                title: { text: 'Prophet 시계열 예측', font: { color: '#fff', size: 18 } },
                                paper_bgcolor: '#1e293b',
                                plot_bgcolor: '#0f172a',
                                xaxis: { title: '시점', gridcolor: '#334155', color: '#94a3b8' },
                                yaxis: { title: '값', gridcolor: '#334155', color: '#94a3b8' },
                                legend: { font: { color: '#fff' } },
                                margin: { t: 50, r: 20, b: 50, l: 60 }
                            }}
                            config={{ responsive: true, displayModeBar: false }}
                            style={{ width: '100%', height: '400px' }}
                        />
                    </div>

                    {/* Forecast Values */}
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                        <h4 className="text-sm font-semibold text-slate-300 mb-2">예측값</h4>
                        <div className="flex flex-wrap gap-2">
                            {result.forecast.map((val, idx) => (
                                <div key={idx} className="bg-slate-800 px-3 py-1 rounded text-sm">
                                    <span className="text-slate-400">t+{idx + 1}:</span>{" "}
                                    <span className="text-purple-400 font-semibold">{val.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* PDF Report (Hidden Overlay) */}
            {isGeneratingPdf && result && (
                <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 9000, backgroundColor: 'white' }}>
                    <ReportView
                        baseId="prophet-report"
                        title="Prophet 시계열 분석 리포트"
                        date={new Date().toLocaleDateString('ko-KR')}
                        params={[
                            { label: "예측 기간", value: forecastPeriods },
                            { label: "계절성 모드", value: seasonalityMode === 'additive' ? '가법적' : '승법적' }
                        ]}
                        results={[
                            { label: "첫 예측값", value: result.forecast[0].toFixed(2), highlight: true },
                            { label: "평균 트렌드", value: (result.trend.reduce((a, b) => a + b, 0) / result.trend.length).toFixed(2) },
                            { label: "예측 범위", value: `${result.forecast_lower[0].toFixed(1)} ~ ${result.forecast_upper[0].toFixed(1)}` }
                        ]}
                        chartImage={reportChartImg}
                        insight={`Prophet 모델을 사용하여 시계열 데이터를 분석하고 ${forecastPeriods}개 시점에 대한 예측을 수행했습니다. ${seasonalityMode === 'additive' ? '가법적' : '승법적'} 계절성 모드를 사용했으며, 첫 예측값은 ${result.forecast[0].toFixed(2)}입니다. 트렌드 분석 결과 ${result.trend[0] > result.trend[result.trend.length - 1] ? '하락' : '상승'} 추세를 보이고 있습니다.`}
                    />
                </div>
            )}
        </div>
    );
}
