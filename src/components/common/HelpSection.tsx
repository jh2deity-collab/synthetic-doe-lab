import React from 'react';
import { HelpCircle, Info, ChevronRight } from 'lucide-react';

interface HelpItem {
    title: string;
    description: string;
    details?: string[];
    color?: string;
}

interface HelpSectionProps {
    title: string;
    subtitle: string;
    items: HelpItem[];
    onClose?: () => void;
}

export const HelpSection: React.FC<HelpSectionProps> = ({ title, subtitle, items, onClose }) => {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                            <HelpCircle className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">{title}</h2>
                            <p className="text-slate-400">{subtitle}</p>
                        </div>
                    </div>

                    {onClose && (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-all hover:text-lab-lime"
                        >
                            닫기
                        </button>
                    )}
                </div>

                <div className="grid gap-6">
                    {items.map((item, index) => (
                        <div
                            key={index}
                            className="group bg-black/20 border border-white/5 rounded-2xl p-6 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color || 'bg-slate-500/10'}`}>
                                    <Info className={`w-5 h-5 ${item.color ? 'text-white' : 'text-slate-400'}`} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                        {item.title}
                                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 transition-transform" />
                                    </h3>
                                    <p className="text-slate-400 leading-relaxed text-sm">
                                        {item.description}
                                    </p>
                                    {item.details && item.details.length > 0 && (
                                        <ul className="mt-4 space-y-2">
                                            {item.details.map((detail, dIdx) => (
                                                <li key={dIdx} className="flex items-center gap-2 text-xs text-slate-500">
                                                    <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                                                    {detail}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 p-6 bg-lab-lime/5 border border-lab-lime/10 rounded-2xl">
                    <p className="text-xs text-slate-500 text-center leading-relaxed">
                        💡 본 도움말은 <strong className="text-lab-lime">Synthetic DOE Lab</strong>의 원활한 이용을 위해 제공되는 기초 가이드입니다.<br />
                        더 궁금한 점이 있으시다면 시스템 관리자 또는 데이터 전문가에게 문의하세요.
                    </p>
                </div>
            </div>
        </div>
    );
};
