"use client";

import { useState, useRef } from "react";
import Plot from "react-plotly.js";
import { TrendingUp, Loader2, FileDown } from "lucide-react";
import { toPng } from "html-to-image";
import { downloadPDF } from "@/lib/reportUtils";
import { ReportView } from "./ReportView";
import { performARIMAAnalysis, ARIMAResult } from "@/lib/api";

export default function ARIMAAnalysis() {
    const [dataInput, setDataInput] = useState<string>("10, 12, 13, 15, 14, 16, 18, 17, 19, 21, 20, 22, 24, 23, 25");
    const [p, setP] = useState<number>(1);
    const [d, setD] = useState<number>(1);
    const [q, setQ] = useState<number>(1);
    const [forecastSteps, setForecastSteps] = useState<number>(5);
    const [result, setResult] = useState<ARIMAResult | null>(null);
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
                throw new Error("ARIMA 분석을 위해 최소 10개 이상의 데이터가 필요합니다.");
            }

            const res = await performARIMAAnalysis({
                data: { values: data },
                p, d, q,
                forecast_steps: forecastSteps
            });

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
                await downloadPDF("arima-report", "ARIMA_Report.pdf");
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
        const forecastStart = originalData.length;

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
                x: Array.from({ length: result.fitted_values.length }, (_, i) => i + 1),
                y: result.fitted_values,
                type: 'scatter',
                mode: 'lines',
                name: '적합값',
                line: { color: '#3b82f6', width: 2, dash: 'dot' }
            },
            {
                x: Array.from({ length: result.forecast.length }, (_, i) => forecastStart + i + 1),
                y: result.forecast,
                type: 'scatter',
                mode: 'lines+markers',
                name: '예측값',
                line: { color: '#f59e0b', width: 2 },
                marker: { size: 8 }
            },
            {
                x: Array.from({ length: result.forecast.length }, (_, i) => forecastStart + i + 1),
                y: result.forecast_ci_upper,
                type: 'scatter',
                mode: 'lines',
                name: '신뢰구간 상한',
                line: { color: 'rgba(245, 158, 11, 0.3)', width: 1 },
                showlegend: false
            },
            {
                x: Array.from({ length: result.forecast.length }, (_, i) => forecastStart + i + 1),
                y: result.forecast_ci_lower,
                type: 'scatter',
                mode: 'lines',
                name: '신뢰구간 하한',
                line: { color: 'rgba(245, 158, 11, 0.3)', width: 1 },
                fill: 'tonexty',
                fillcolor: 'rgba(245, 158, 11, 0.1)',
                showlegend: false
            }
        ];
    };

    return (
        <div className="space-y-6">
            {/* Input Section */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-lime-400" />
                    ARIMA 모델 설정
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            AR 차수 (p)
                        </label>
                        <input
                            type="number"
                            value={p}
                            onChange={(e) => setP(parseInt(e.target.value))}
                            min="0"
                            max="5"
                            className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            차분 차수 (d)
                        </label>
                        <input
                            type="number"
                            value={d}
                            onChange={(e) => setD(parseInt(e.target.value))}
                            min="0"
                            max="2"
                            className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            MA 차수 (q)
                        </label>
                        <input
                            type="number"
                            value={q}
                            onChange={(e) => setQ(parseInt(e.target.value))}
                            min="0"
                            max="5"
                            className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            예측 기간
                        </label>
                        <input
                            type="number"
                            value={forecastSteps}
                            onChange={(e) => setForecastSteps(parseInt(e.target.value))}
                            min="1"
                            max="20"
                            className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                        />
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
                            id="arima-file-upload"
                        />
                        <label
                            htmlFor="arima-file-upload"
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
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-lime-500 focus:border-transparent font-mono text-sm"
                        placeholder="10, 12, 13, 15, 14, 16... 또는 위에서 파일 업로드"
                    />
                </div>

                <button
                    onClick={handleCalculate}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            분석 중...
                        </>
                    ) : (
                        <>
                            <TrendingUp className="w-5 h-5" />
                            ARIMA 분석 실행
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
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-lime-500/20">
                            <div className="text-sm text-slate-400 mb-1">AIC</div>
                            <div className="text-2xl font-bold text-lime-400">{result.aic.toFixed(2)}</div>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-blue-500/20">
                            <div className="text-sm text-slate-400 mb-1">BIC</div>
                            <div className="text-2xl font-bold text-blue-400">{result.bic.toFixed(2)}</div>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-orange-500/20">
                            <div className="text-sm text-slate-400 mb-1">모델</div>
                            <div className="text-2xl font-bold text-orange-400">ARIMA({p},{d},{q})</div>
                        </div>
                    </div>

                    {/* Chart */}
                    <div ref={chartRef} className="bg-slate-900 rounded-lg p-4 mb-4">
                        <Plot
                            data={getChartData() as any}
                            layout={{
                                title: { text: 'ARIMA 시계열 예측', font: { color: '#fff', size: 18 } },
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
                            {result.forecast.map((val: number, idx: number) => (
                                <div key={idx} className="bg-slate-800 px-3 py-1 rounded text-sm">
                                    <span className="text-slate-400">t+{idx + 1}:</span>{" "}
                                    <span className="text-orange-400 font-semibold">{val.toFixed(2)}</span>
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
                        baseId="arima-report"
                        title="ARIMA 시계열 분석 리포트"
                        date={new Date().toLocaleDateString('ko-KR')}
                        params={[
                            { label: "모델", value: `ARIMA(${p},${d},${q})` },
                            { label: "예측 기간", value: forecastSteps }
                        ]}
                        results={[
                            { label: "AIC", value: result.aic.toFixed(2) },
                            { label: "BIC", value: result.bic.toFixed(2), highlight: true },
                            { label: "첫 예측값", value: result.forecast[0].toFixed(2) }
                        ]}
                        chartImage={reportChartImg}
                        insight={`ARIMA(${p},${d},${q}) 모델을 사용하여 시계열 데이터를 분석했습니다. AIC는 ${result.aic.toFixed(2)}, BIC는 ${result.bic.toFixed(2)}로 나타났습니다. 향후 ${forecastSteps}개 시점에 대한 예측을 수행했으며, 첫 예측값은 ${result.forecast[0].toFixed(2)}입니다.`}
                    />
                </div>
            )}
        </div>
    );
}
