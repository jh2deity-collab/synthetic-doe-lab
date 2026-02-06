"use client";

import { useState } from "react";
import Link from "next/link";
import { Upload, FileSpreadsheet, Table2, Play, AlertCircle, Download, FlaskConical } from "lucide-react";
import * as XLSX from "xlsx";
import { clsx } from "clsx";
import { SPCDashboard } from "@/components/spc/SPCDashboard";

import { SPCResult } from "@/types";

export default function AnalysisPage() {
    const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');
    const [data, setData] = useState<Record<string, unknown>[] | null>(null);
    const [columns, setColumns] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<SPCResult | null>(null);
    const [dataContext, setDataContext] = useState("");

    // PDF State
    const [showReport, setShowReport] = useState(false);
    const [analysisHtml, setAnalysisHtml] = useState<string>("");

    // Initial Manual Data State
    // const [manualColumns, setManualColumns] = useState<string[]>(['Column1', 'Column2', 'Response']);
    // const [manualRows, setManualRows] = useState<Record<string, unknown>[]>([{}, {}, {}]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });

                if (!jsonData || jsonData.length < 2) {
                    throw new Error("File is empty or invalid format.");
                }

                const headers = jsonData[0] as string[];
                const rows = jsonData.slice(1).map((r: unknown) => {
                    const rowArray = r as unknown[];
                    const rowObj: Record<string, unknown> = {};
                    headers.forEach((h, i) => {
                        rowObj[h] = rowArray[i];
                    });
                    return rowObj;
                });

                setColumns(headers);
                setData(rows);
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : "Unknown error";
                setError("Failed to parse file: " + msg);
            } finally {
                setIsLoading(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleAnalyze = async () => {
        if (!data || (data || []).length === 0) return;

        let target = "Response";
        if (columns && (columns || []).length > 0 && !columns.includes("Response")) {
            target = columns[columns.length - 1];
        }

        try {
            setIsLoading(true);
            const { performSPCAnalysis } = await import("@/lib/api");
            const spcRes = await performSPCAnalysis({
                data: data,
                target_variable: target
            });
            setAnalysisResult(spcRes);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Unknown error";
            setError("Analysis failed: " + msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportPDF = async () => {
        if (!data || !analysisResult) return;

        try {
            setIsLoading(true);
            setShowReport(true);

            // Fetch Expert Analysis
            const { generateExpertAnalysis } = await import("@/lib/api");

            // Check if analysis is already populated
            if (!analysisHtml) {
                const contextPrompt = dataContext.trim()
                    ? dataContext
                    : "Uploaded experimental data for quality control analysis. The user has not provided specific domain context, so infer the process based on variable names.";

                const analysisRes = await generateExpertAnalysis({
                    context: contextPrompt,
                    results: data.slice(0, 50), // Limit data for prompt
                    mock: false // Assume real data or treat as such
                });

                if (analysisRes && analysisRes.analysis_html) {
                    setAnalysisHtml(analysisRes.analysis_html);
                }
            }

            // Wait for render
            await new Promise(resolve => setTimeout(resolve, 1500));

            const reportElement = document.getElementById("full-report-container");
            if (!reportElement) throw new Error("Report element not found");

            // Setup PDF with Section-based Layout
            const { default: jsPDF } = await import("jspdf");
            const { toPng } = await import("html-to-image");

            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });

            const pdfWidth = pdf.internal.pageSize.getWidth(); // 210
            const pdfHeight = pdf.internal.pageSize.getHeight(); // 297
            const margin = 10;
            const contentWidth = pdfWidth - (margin * 2);

            let currentY = margin;

            // Capture Sections
            const sections = Array.from(document.querySelectorAll("#full-report-container .report-section"));

            for (const section of sections) {
                const sectionEl = section as HTMLElement;

                const imgData = await toPng(sectionEl, {
                    backgroundColor: "#ffffff",
                    quality: 1.0,
                    pixelRatio: 2,
                    style: { transform: 'scale(1)' }
                });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const imgProps = (pdf as any).getImageProperties(imgData);
                const imgHeight = (imgProps.height * contentWidth) / imgProps.width;

                // Check page break
                if (currentY + imgHeight > pdfHeight - margin) {
                    pdf.addPage();
                    currentY = margin;
                }

                pdf.addImage(imgData, 'PNG', margin, currentY, contentWidth, imgHeight);
                currentY += imgHeight + 5;
            }

            pdf.save(`analysis_report_${new Date().toISOString().slice(0, 10)}.pdf`);

        } catch (error: unknown) {
            console.error("PDF Export failed", error);
            const msg = error instanceof Error ? error.message : "알 수 없는 오류";
            alert(`PDF 생성 실패: ${msg}`);
        } finally {
            setShowReport(false);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-lab-dark text-white font-sans pb-20">
            <header className="border-b border-white/10 backdrop-blur-md sticky top-0 z-10 bg-lab-dark/80">
                <div className="w-full px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-2xl tracking-tight">
                        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <FlaskConical className="w-6 h-6 text-lab-lime" />
                            <span>Synthetic <span className="text-lab-lime">DOE</span> Lab</span>
                        </Link>
                        <span className="text-slate-600 mx-2">/</span>
                        <span className="text-white">DOE 데이터 분석</span>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Input */}
                    <section className="bg-white/5 border border-white/10 p-6 rounded-2xl h-fit">
                        <div className="flex gap-4 border-b border-white/10 pb-4 mb-6">
                            <button
                                onClick={() => setActiveTab('upload')}
                                className={clsx("flex items-center gap-2 pb-2 text-sm font-bold transition-all border-b-2", activeTab === 'upload' ? "border-lab-lime text-lab-lime" : "border-transparent text-slate-400")}
                            >
                                <Upload className="w-4 h-4" /> 파일 업로드
                            </button>
                        </div>

                        {activeTab === 'upload' && (
                            <div className="text-center py-10 border-2 border-dashed border-white/10 rounded-xl hover:border-lab-lime/50 transition-colors bg-black/20">
                                <FileSpreadsheet className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                                <p className="text-slate-400 text-sm mb-4">
                                    CSV 또는 Excel 파일을 드래그하거나<br />클릭하여 업로드하세요.
                                </p>
                                <input
                                    type="file"
                                    accept=".csv, .xlsx, .xls"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="inline-block bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg cursor-pointer text-sm font-bold transition-colors"
                                >
                                    파일 선택
                                </label>
                            </div>
                        )}

                        {error && (
                            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 text-red-400 text-sm">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        {data && (
                            <div className="mt-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-slate-400">로드된 데이터: <strong className="text-white">{(data || []).length}</strong> 행</span>
                                    <button
                                        onClick={() => { setData(null); setAnalysisResult(null); }}
                                        className="text-xs text-red-400 hover:text-red-300 underline"
                                    >
                                        초기화
                                    </button>
                                </div>

                                {/* Context Input */}
                                <div className="mb-4">
                                    <label className="block text-xs font-bold text-slate-400 mb-1">데이터 설명 (AI 분석 정확도 향상)</label>
                                    <textarea
                                        value={dataContext}
                                        onChange={(e) => setDataContext(e.target.value)}
                                        placeholder="예: 반도체 식각 공정 데이터입니다. 온도가 수율에 미치는 영향을 중점적으로 분석해주세요."
                                        className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-lab-lime focus:outline-none h-20 resize-none transition-colors hover:border-white/20"
                                    />
                                </div>

                                <button
                                    onClick={handleAnalyze}
                                    disabled={isLoading}
                                    className={clsx(
                                        "w-full py-4 font-bold rounded-xl mt-4 transition-colors shadow-lg flex items-center justify-center gap-2",
                                        isLoading ? "bg-slate-700 text-slate-400" : "bg-lab-lime text-lab-dark hover:bg-lime-300 shadow-lab-lime/20"
                                    )}
                                >
                                    {isLoading ? "처리 중..." : <><Play className="w-5 h-5" /> 통계 분석 실행</>}
                                </button>

                                {analysisResult && (
                                    <button
                                        onClick={handleExportPDF}
                                        disabled={isLoading}
                                        className="w-full mt-3 py-3 border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Download className="w-5 h-5" /> PDF 리포트 저장
                                    </button>
                                )}
                            </div>
                        )}
                    </section>

                    {/* Right Column: Preview & Results */}
                    <section className="lg:col-span-2 space-y-6">
                        {data && !analysisResult && (
                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl overflow-hidden">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Table2 className="w-5 h-5 text-slate-400" /> 데이터 미리보기
                                </h3>
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-xs text-left whitespace-nowrap">
                                        <thead className="bg-white/5 text-slate-400">
                                            <tr>
                                                {(columns || []).map(c => <th key={c} className="p-3 font-mono">{c}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 text-slate-300 font-mono">
                                            {(data || []).slice(0, 10).map((row, i) => (
                                                <tr key={i} className="hover:bg-white/5">
                                                    {(columns || []).map(c => <td key={c} className="p-3">{String(row[c] ?? "")}</td>)}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {(data || []).length > 10 && <p className="text-center text-xs text-slate-500 py-3 italic">... {(data || []).length - 10} more rows ...</p>}
                                </div>
                            </div>
                        )}

                        {analysisResult && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <SPCDashboard
                                    data={data ?? []}
                                    spcResult={analysisResult}
                                    variables={columns.map(c => ({ name: c, type: (data && (data || []).length > 0 && typeof (data || [])[0][c] === 'number') ? 'continuous' : 'categorical', min: 0, max: 0 }))}
                                />
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {/* Hidden PDF Report Container */}
            <div
                id="full-report-container"
                className={clsx(
                    "fixed top-0 w-[794px] min-h-screen bg-white text-black p-12 shadow-2xl transition-all duration-300 font-sans",
                    showReport ? "left-0 z-[9999]" : "left-[100vw] z-[-50]"
                )}
            >
                <div className="border-b-2 border-black pb-4 mb-8 flex justify-between items-end report-section">
                    <div>
                        <h1 className="text-3xl font-bold">DOE Analysis Report</h1>
                        <p className="text-gray-600 mt-1">Uploaded Data Analysis</p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                        <p>Date: {new Date().toLocaleDateString()}</p>
                        <p>Total Records: {data?.length}</p>
                    </div>
                </div>

                {/* Section 1: Data Summary */}
                <div className="mb-8 report-section">
                    <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4">1. 데이터 요약 (Data Summary)</h2>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="mb-2"><strong className="font-semibold">Context:</strong></p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap mb-4">{dataContext || "N/A"}</p>
                        <p><strong>Variables Detected:</strong> {(columns || []).join(", ")}</p>
                        <p className="mt-2"><strong>Analysis Target:</strong> {(columns || []).includes("Response") ? "Response" : (columns && columns.length > 0 ? columns[columns.length - 1] : "N/A")}</p>
                    </div>
                </div>

                {/* Section 2: SPC Charts Snapshot */}
                <div className="mb-8 report-section">
                    <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4">2. 공정 능력 분석 (SPC Analysis)</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Please refer to the interactive dashboard for dynamic charts.
                        Below is the statistical summary.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 border border-gray-200 rounded">
                            <h4 className="font-bold text-sm mb-2">Process Capability</h4>
                            <ul className="text-sm space-y-1">
                                <li><strong>Mean:</strong> {analysisResult?.mean?.toFixed(4) || "N/A"}</li>
                                <li><strong>Std Dev:</strong> {analysisResult?.std_dev?.toFixed(4) || "N/A"}</li>
                                <li><strong>Cp:</strong> {analysisResult?.cp?.toFixed(4) || "N/A"}</li>
                                <li><strong>Cpk:</strong> {analysisResult?.cpk?.toFixed(4) || "N/A"}</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Section 3: Expert Analysis */}
                <div className="mb-8 report-section">
                    <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4 text-lab-lime-dark">3. 전문가 분석 (Expert Opinion)</h2>
                    {analysisHtml ? (
                        <div className="prose prose-sm max-w-none text-gray-800 bg-blue-50/50 p-6 rounded-lg border border-blue-100" dangerouslySetInnerHTML={{ __html: analysisHtml }} />
                    ) : (
                        <p className="text-gray-400 italic">Generating analysis...</p>
                    )}
                </div>

                {/* Section 4: Data Table */}
                <div className="mb-8 report-section">
                    <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4">4. 원본 데이터 (Raw Data Snapshot)</h2>
                    {data && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-gray-100">
                                    <tr>
                                        {(columns || []).map(k => (
                                            <th key={k} className="p-2 border-b">{k}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(data || []).slice(0, 20).map((row: Record<string, unknown>, i: number) => (
                                        <tr key={i} className="even:bg-gray-50">
                                            {(columns || []).map(k => (
                                                <td key={k} className="p-2 border-b truncate max-w-[150px]">{String(row[k] ?? "")}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {(data || []).length > 20 && <p className="text-xs text-center p-2 text-gray-500 bg-gray-50 italic">...Showing first 20 rows of {(data || []).length}...</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
