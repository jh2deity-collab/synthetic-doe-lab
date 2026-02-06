"use client";

import { useForm, FormProvider } from "react-hook-form";
import { VariableForm } from "@/components/VariableForm";
import { DistributionPlot } from "@/components/DistributionPlot";
import { FlaskConical, ArrowRight, LayoutGrid, CheckCircle2, Download } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { generateDesign } from "@/lib/api";
import clsx from "clsx";
import { SPCResult, DesignConfig } from "@/types";
// import { SPCDashboard } from "@/components/spc/SPCDashboard"; // Removed unused
// import { jsPDF } from "jspdf"; // Removed unused dynamic import reference


type FormValues = {
    name: string;
    description: string;
    strategy: 'lhc' | 'factorial' | 'random';
    num_samples: number;
    variables: {
        name: string;
        type: 'continuous' | 'categorical' | 'discrete';
        min?: number;
        max?: number;
        levels?: string;
        color?: string;
    }[];
};

export default function NewExperimentPage() {
    const methods = useForm<FormValues>({
        defaultValues: {
            name: "새로운 실험 1",
            description: "",
            strategy: "lhc",
            num_samples: 20,
            variables: [
                { name: "Pressure", type: "continuous", min: 10, max: 100 },
                { name: "Temperature", type: "continuous", min: 200, max: 500 }
            ]
        }
    });

    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<(DesignConfig & { matrix: Record<string, unknown>[], num_runs?: number }) | null>(null);
    const [spcResult, setSpcResult] = useState<SPCResult | null>(null);
    const [useRealData, setUseRealData] = useState(false);
    const [analysisHtml, setAnalysisHtml] = useState<string>("");
    const [showReport, setShowReport] = useState(false);

    const onSubmit = async (data: FormValues) => {
        setIsLoading(true);
        // Transform levels string to array if needed (MVP simplified)
        const payload = {
            ...data,
            variables: data.variables.map(v => ({
                ...v,
                levels: v.levels ? v.levels.split(',').map(s => s.trim()) : []
            }))
        }

        // Call API
        const res = await generateDesign(payload);
        setResult(res);
        setIsLoading(false);
    };

    const handleExportPDF = async () => {
        if (!result) return;

        try {
            setIsLoading(true);
            setShowReport(true);

            // 1. Fetch Expert Analysis
            const { generateExpertAnalysis } = await import("@/lib/api");

            // Generate analysis only if we have results
            if (result && result.matrix) {
                // Check if analysis is already populated to avoid re-fetching if user clicks twice
                if (!analysisHtml) {
                    const analysisRes = await generateExpertAnalysis({
                        context: methods.getValues("description") || "Standard experiment",
                        results: result.matrix,
                        mock: !useRealData
                    });

                    if (analysisRes && analysisRes.analysis_html) {
                        setAnalysisHtml(analysisRes.analysis_html);
                    }
                }
            }

            // Wait for render
            await new Promise(resolve => setTimeout(resolve, 1500)); // Increased timeout for stability

            const reportElement = document.getElementById("full-report-container");
            if (!reportElement) throw new Error("Report element not found");

            // 2. Setup PDF
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

            // 3. Section-based Capture
            // We expect sections to have class 'report-section'
            const sections = Array.from(document.querySelectorAll("#full-report-container .report-section"));

            for (const section of sections) {
                const sectionEl = section as HTMLElement;

                // Capture section
                const imgData = await toPng(sectionEl, {
                    backgroundColor: "#ffffff",
                    quality: 1.0,
                    pixelRatio: 2,
                    style: { transform: 'scale(1)' } // Reset scaling issues
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
                currentY += imgHeight + 5; // Add 5mm spacing between sections
            }

            pdf.save(`${methods.getValues("name")}_report.pdf`);

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
                        <span className="text-white">새 실험 생성</span>
                    </div>
                </div>
            </header>

            <main className="w-full px-6 py-6">
                <FormProvider {...methods}>
                    <form onSubmit={methods.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">

                        {/* Column 1: Experiment Overview */}
                        <section className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col h-full overflow-y-auto custom-scrollbar">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 sticky top-0 bg-[#13141f] py-2 z-10 w-full border-b border-white/10">
                                <span className="bg-lab-lime text-lab-dark w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                                실험 개요
                            </h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2">실험명</label>
                                    <input
                                        {...methods.register("name")}
                                        className="w-full bg-black/20 border border-white/10 rounded px-4 py-3 text-white focus:border-lab-lime focus:outline-none transition-colors hover:border-white/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2">실험 상황 / 프롬프트 설명</label>
                                    <textarea
                                        {...methods.register("description")}
                                        placeholder="예: 고혈압 신약 임상 실험 데이터..."
                                        className="w-full bg-black/20 border border-white/10 rounded px-4 py-3 text-white focus:border-lab-lime focus:outline-none h-32 text-sm transition-colors hover:border-white/20 resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2">실험계획법 (DOE Strategy)</label>
                                    <select
                                        {...methods.register("strategy")}
                                        className="w-full bg-black/20 border border-white/10 rounded px-4 py-3 text-white focus:border-lab-lime focus:outline-none appearance-none transition-colors hover:border-white/20"
                                    >
                                        <option value="lhc">LHC (라틴 하이퍼큐브)</option>
                                        <option value="random">단순 무작위 (Random)</option>
                                        <option value="factorial">완전 요인 배치법 (Full Factorial)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2">
                                        샘플 수 (시뮬레이션 횟수)
                                        {methods.watch("strategy") === 'factorial' && <span className="text-xs text-lab-lime ml-2 font-normal">*요인 수에 따라 자동 결정됨</span>}
                                    </label>
                                    <input
                                        type="number"
                                        {...methods.register("num_samples", { valueAsNumber: true })}
                                        disabled={methods.watch("strategy") === 'factorial'}
                                        className={clsx(
                                            "w-full border rounded px-4 py-3 text-white focus:outline-none transition-colors",
                                            methods.watch("strategy") === 'factorial'
                                                ? "bg-white/5 border-white/5 text-slate-500 cursor-not-allowed"
                                                : "bg-black/20 border-white/10 focus:border-lab-lime hover:border-white/20"
                                        )}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Column 2: Variables */}
                        <section className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col h-full overflow-hidden">
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 sticky top-0 bg-[#13141f] py-2 z-10 w-full border-b border-white/10">
                                    <span className="bg-lab-lime text-lab-dark w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                                    변수(인자) 정의
                                </h2>
                                <VariableForm />
                            </div>

                            {/* Action Bar */}
                            <div className="pt-6 mt-4 border-t border-white/10">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={clsx(
                                        "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg text-lg",
                                        isLoading ? "bg-slate-600 cursor-not-allowed" : "bg-lab-lime text-lab-dark hover:bg-lime-300 shadow-lab-lime/20 hover:shadow-lab-lime/40 transform hover:-translate-y-1"
                                    )}
                                >
                                    {isLoading ? (
                                        <>처리중...</>
                                    ) : (
                                        <>
                                            <FlaskConical className="w-6 h-6" />
                                            실험계획 생성
                                        </>
                                    )}
                                </button>

                                {result && (
                                    <button
                                        type="button"
                                        onClick={handleExportPDF}
                                        className="w-full mt-3 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
                                    >
                                        <Download className="w-5 h-5" />
                                        PDF 리포트 저장
                                    </button>
                                )}
                            </div>
                        </section>

                        {/* Column 3: Result Preview */}
                        <section id="report-container" className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col h-full overflow-y-auto custom-scrollbar relative">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2 sticky top-0 bg-[#13141f] py-2 z-10 w-full border-b border-white/10">
                                <LayoutGrid className="w-4 h-4" />
                                결과 미리보기
                            </h3>

                            {!result ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 min-h-[400px]">
                                    <LayoutGrid className="w-16 h-16 mb-4 opacity-20" />
                                    <p className="text-center text-sm leading-relaxed">
                                        좌측에서 실험 조건을 설정하고<br />
                                        <strong className="text-lab-lime">실험계획 생성</strong> 버튼을 눌러주세요.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                                    <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
                                        <div className="flex items-center gap-2 text-green-400">
                                            <CheckCircle2 className="w-5 h-5" />
                                            <span className="font-bold">계획 생성 완료!</span>
                                        </div>
                                        <div className="flex gap-4 text-xs font-mono">
                                            <div>
                                                <span className="text-slate-500 mr-2">Strategy:</span>
                                                <span className="text-white">{result.strategy}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 mr-2">Runs:</span>
                                                <span className="text-green-400 font-bold">{result.num_runs}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Visualization */}
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] uppercase font-bold text-slate-500">공간 충진 시각화 (Space Filling)</h4>
                                        <DistributionPlot
                                            matrix={result.matrix}
                                            variables={methods.getValues().variables}
                                        />
                                    </div>

                                    {/* Generation Trigger */}
                                    <div className="pt-6 border-t border-white/5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[10px] uppercase font-bold text-slate-500">데이터 합성 (Data Synthesis)</h4>

                                            {/* Toggle Switch */}
                                            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setUseRealData(!useRealData)}>
                                                <span className={clsx("text-[10px] font-bold transition-colors", !useRealData ? "text-slate-400" : "text-slate-600")}>Mock</span>
                                                <div className={clsx(
                                                    "w-10 h-5 rounded-full p-1 transition-colors relative",
                                                    useRealData ? "bg-lab-lime" : "bg-slate-700"
                                                )}>
                                                    <div className={clsx(
                                                        "w-3 h-3 rounded-full bg-white transition-transform shadow-sm",
                                                        useRealData ? "translate-x-5" : "translate-x-0"
                                                    )} />
                                                </div>
                                                <span className={clsx("text-[10px] font-bold transition-colors", useRealData ? "text-lab-lime" : "text-slate-600")}>OpenAI</span>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const { generateSyntheticData, performSPCAnalysis } = await import("@/lib/api");
                                                setIsLoading(true);
                                                const genRes = await generateSyntheticData({
                                                    matrix: result.matrix,
                                                    context: methods.getValues("description") || "Standard scientific observation",
                                                    mock: !useRealData
                                                });

                                                if (genRes && genRes.data) {
                                                    const newMatrix = genRes.data;
                                                    setResult({ ...result, matrix: newMatrix });
                                                    const spcRes = await performSPCAnalysis({
                                                        data: newMatrix,
                                                        target_variable: "Response"
                                                    });
                                                    setSpcResult(spcRes);
                                                }
                                                setIsLoading(false);
                                            }}
                                            className={clsx(
                                                "w-full py-3 border rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg",
                                                useRealData
                                                    ? "bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/20 shadow-purple-900/10"
                                                    : "bg-lab-lime/10 hover:bg-lab-lime/20 text-lab-lime border-lab-lime/20 shadow-lime-900/10"
                                            )}
                                        >
                                            {isLoading ? "합성 데이터 생성 중..." : (useRealData ? "AI 기반 데이터 생성 시작" : "Mock 데이터 생성 시작")}
                                        </button>
                                    </div>

                                    {/* Table */}
                                    <div className="bg-black/30 rounded-xl border border-white/5 overflow-hidden">
                                        <div className="overflow-x-auto max-h-60 custom-scrollbar">
                                            <table className="w-full text-xs text-left whitespace-nowrap">
                                                <thead className="bg-white/5 text-slate-400 sticky top-0 z-10 backdrop-blur-sm">
                                                    <tr>
                                                        {result.matrix && result.matrix.length > 0 ? Object.keys(result.matrix[0]).map(k => {
                                                            // Find matching variable to get color
                                                            const matchedVar = methods.getValues("variables").find(v => v.name === k);
                                                            const color = matchedVar?.color; // e.g. "#ff0000"

                                                            return (
                                                                <th
                                                                    key={k}
                                                                    className="px-3 py-2 font-mono border-b border-white/10"
                                                                    style={color ? { color: color } : {}}
                                                                >
                                                                    {k}
                                                                </th>
                                                            );
                                                        }) : (
                                                            <th className="px-3 py-2 text-center text-slate-500 italic w-full">데이터 없음 (No Generated Data)</th>
                                                        )}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5 font-mono text-slate-300">
                                                    {(result.matrix || []).map((row: Record<string, unknown>, i: number) => (
                                                        <tr key={i} className="hover:bg-white/[0.02]">
                                                            {Object.entries(row).map(([k, v], j) => {
                                                                if (k === 'synthetic_output') return null;
                                                                if (k === 'Observation') return <td key={j} className="px-3 py-2 max-w-[200px] truncate text-xs text-slate-500" title={String(v)}>{String(v)}</td>;
                                                                if (k === 'Response') return <td key={j} className="px-3 py-2 font-bold text-lab-lime">{String(v)}</td>;

                                                                // Apply subtle color tint to cell content if variable has color
                                                                const matchedVar = methods.getValues("variables").find(v => v.name === k);
                                                                const color = matchedVar?.color;

                                                                return (
                                                                    <td
                                                                        key={j}
                                                                        className="px-3 py-2 max-w-[150px] truncate transition-colors"
                                                                        title={String(v)}
                                                                        style={color ? { color: color, opacity: 0.9 } : {}}
                                                                    >
                                                                        {String(v)}
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* SPC Integration */}
                                    {spcResult && (
                                        <div className="pt-4 border-t border-white/5">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const spcData = {
                                                        matrix: result.matrix,
                                                        settings: methods.getValues(),
                                                        spcResult: spcResult
                                                    };
                                                    sessionStorage.setItem('spc_analysis_data', JSON.stringify(spcData));
                                                    window.open('/spc', '_blank');
                                                }}
                                                className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-sm font-bold transition-all flex items-center justify-center gap-2 group"
                                            >
                                                분포 상세 분석 (새 창)
                                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>
                        {/* Full Report Container (Visible during export) */}
                        <div
                            id="full-report-container"
                            className={clsx(
                                "fixed top-0 w-[794px] min-h-screen bg-white text-black p-12 shadow-2xl transition-all duration-300",
                                showReport ? "left-0 z-[9999]" : "left-[100vw] z-[-50]"
                            )}
                        >
                            <div className="border-b-2 border-black pb-4 mb-8 flex justify-between items-end report-section">
                                <div>
                                    <h1 className="text-3xl font-bold">{methods.getValues("name")}</h1>
                                    <p className="text-gray-600 mt-1">Synthetic DOE Lab Experiment Report</p>
                                </div>
                                <div className="text-right text-sm text-gray-500">
                                    <p>Date: {new Date().toLocaleDateString()}</p>
                                    <p>Strategy: {methods.getValues("strategy")}</p>
                                </div>
                            </div>

                            {/* Section 1: Overview */}
                            <div className="mb-8 report-section">
                                <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4">1. 실험 개요 (Experiment Overview)</h2>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <p className="mb-2"><strong className="font-semibold">Description:</strong></p>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{methods.getValues("description") || "N/A"}</p>
                                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                        <p><strong>Sample Size:</strong> {methods.getValues("num_samples")}</p>
                                        <p><strong>Data Source:</strong> {useRealData ? "Synthetic Data Generation (AI)" : "Mock Data"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Variables */}
                            <div className="mb-8 report-section">
                                <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4">2. 변수 정의 (Design Variables)</h2>
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="border p-2">Name</th>
                                            <th className="border p-2">Type</th>
                                            <th className="border p-2">Range / Levels</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {methods.getValues("variables").map((v, i) => (
                                            <tr key={i}>
                                                <td className="border p-2 font-medium">{v.name}</td>
                                                <td className="border p-2">{v.type}</td>
                                                <td className="border p-2">
                                                    {v.type === 'continuous' ? `${v.min} - ${v.max}` : (Array.isArray(v.levels) ? v.levels.join(", ") : (v.levels || "-"))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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

                            {/* Section 4: Results Snapshot */}
                            <div className="mb-8 report-section">
                                <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4">4. 실험 결과 (Experimental Results)</h2>
                                {/* Duplicate the result table for print */}
                                {result && (
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    {result.matrix && result.matrix.length > 0 ? Object.keys(result.matrix[0]).filter(k => k !== 'synthetic_output').map(k => (
                                                        <th key={k} className="p-2 border-b">{k}</th>
                                                    )) : (
                                                        <th className="p-2 border-b text-center text-gray-500 italic">No Data Available</th>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(result.matrix || []).slice(0, 20).map((row: Record<string, unknown>, i: number) => (
                                                    <tr key={i} className="even:bg-gray-50">
                                                        {Object.entries(row).map(([k, v], j) => {
                                                            if (k === 'synthetic_output') return null;
                                                            return <td key={j} className="p-2 border-b truncate max-w-[150px]">{String(v)}</td>
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {(result.matrix || []).length > 20 && <p className="text-xs text-center p-2 text-gray-500 bg-gray-50 italic">...Showing first 20 rows of {(result.matrix || []).length}...</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </form>
                </FormProvider>
            </main>
        </div>
    );
}
