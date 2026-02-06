import React from 'react';

interface ReportViewProps {
    title: string;
    date: string;
    params: { label: string; value: string | number }[];
    results: { label: string; value: string | number; highlight?: boolean }[];
    chartImage?: string; // Data URL of the captured chart
    insight: string;
}

export const ReportView = ({ title, date, params, results, chartImage, insight }: ReportViewProps) => {
    return (
        <>
            {/* Page 1: Summary and Results */}
            <div id="report-page-1" style={{
                width: '297mm',
                height: '210mm',
                backgroundColor: '#ffffff',
                color: '#000000',
                padding: '20mm',
                boxSizing: 'border-box',
                position: 'relative',
                fontFamily: 'sans-serif',
                lineHeight: '1.6',
                pageBreakAfter: 'always'
            }}>
                {/* Header */}
                <header style={{
                    borderBottom: '2px solid #000000',
                    paddingBottom: '16px',
                    marginBottom: '32px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end'
                }}>
                    <div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '24px',
                            fontWeight: 'bold',
                            color: '#000000',
                            marginBottom: '8px'
                        }}>
                            <span>Synthetic <span style={{ color: '#65a30d' }}>DOE</span> Lab</span>
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>AI 기반 실험 설계 및 분석 플랫폼</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <h1 style={{
                            fontSize: '20px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            color: '#1f2937',
                            margin: 0
                        }}>통계 분석 리포트</h1>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>{date}</div>
                    </div>
                </header>

                {/* Title */}
                <section style={{ marginBottom: '40px', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '30px', fontWeight: 'bold', color: '#000000', marginBottom: '8px' }}>{title}</h2>
                    <div style={{ height: '4px', width: '80px', backgroundColor: '#84cc16', margin: '0 auto' }}></div>
                </section>

                {/* Parameters & Summary */}
                <section style={{
                    marginBottom: '32px',
                    padding: '24px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                }}>
                    <h3 style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        borderLeft: '4px solid #1f2937',
                        paddingLeft: '12px',
                        marginBottom: '16px',
                        textTransform: 'uppercase',
                        color: '#374151'
                    }}>분석 파라미터</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 32px' }}>
                        {params.map((p, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                borderBottom: '1px solid #e5e7eb',
                                padding: '4px 0'
                            }}>
                                <span style={{ color: '#4b5563', fontWeight: '500' }}>{p.label}</span>
                                <span style={{ fontWeight: 'bold' }}>{p.value}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Key Results */}
                <section style={{ marginBottom: '32px' }}>
                    <h3 style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        borderLeft: '4px solid #84cc16',
                        paddingLeft: '12px',
                        marginBottom: '16px',
                        textTransform: 'uppercase',
                        color: '#374151'
                    }}>주요 결과</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        {results.map((r, i) => (
                            <div key={i} style={{
                                padding: '16px',
                                borderRadius: '12px',
                                border: r.highlight ? '1px solid #d9f99d' : '1px solid #e5e7eb',
                                backgroundColor: r.highlight ? '#f7fee7' : '#ffffff',
                                boxShadow: r.highlight ? 'none' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                            }}>
                                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>{r.label}</div>
                                <div style={{
                                    fontSize: '24px',
                                    fontWeight: 'bold',
                                    color: r.highlight ? '#4d7c0f' : '#000000'
                                }}>
                                    {r.value}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Expert Insight */}
                <section style={{ marginBottom: '48px' }}>
                    <h3 style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        borderLeft: '4px solid #3b82f6',
                        paddingLeft: '12px',
                        marginBottom: '16px',
                        textTransform: 'uppercase',
                        color: '#374151'
                    }}>전문가 인사이트</h3>
                    <div style={{
                        padding: '24px',
                        backgroundColor: '#eff6ff',
                        border: '1px solid #dbeafe',
                        borderRadius: '12px',
                        color: '#1f2937',
                        lineHeight: '1.75',
                        textAlign: 'justify'
                    }}>
                        <strong style={{ color: '#1d4ed8', display: 'block', marginBottom: '8px' }}>분석 해석:</strong>
                        {insight}
                    </div>
                </section>

                {/* Footer */}
                <footer style={{
                    position: 'absolute',
                    bottom: '20mm',
                    left: '20mm',
                    right: '20mm',
                    textAlign: 'center',
                    borderTop: '1px solid #e5e7eb',
                    paddingTop: '16px',
                    fontSize: '12px',
                    color: '#9ca3af'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Synthetic DOE Lab v0.1에서 생성됨</span>
                        <span>기밀 연구 데이터</span>
                    </div>
                </footer>
            </div>

            {/* Page 2: Visualization */}
            <div id="report-page-2" style={{
                width: '297mm',
                height: '210mm',
                backgroundColor: '#ffffff',
                color: '#000000',
                padding: '20mm',
                boxSizing: 'border-box',
                position: 'relative',
                fontFamily: 'sans-serif',
                lineHeight: '1.6'
            }}>
                {/* Header */}
                <header style={{
                    borderBottom: '2px solid #000000',
                    paddingBottom: '16px',
                    marginBottom: '32px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end'
                }}>
                    <div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '24px',
                            fontWeight: 'bold',
                            color: '#000000',
                            marginBottom: '8px'
                        }}>
                            <span>Synthetic <span style={{ color: '#65a30d' }}>DOE</span> Lab</span>
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>AI 기반 실험 설계 및 분석 플랫폼</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <h1 style={{
                            fontSize: '20px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            color: '#1f2937',
                            margin: 0
                        }}>통계 분석 리포트</h1>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>{date}</div>
                    </div>
                </header>

                {/* Visualization */}
                <section style={{ marginBottom: '32px' }}>
                    <h3 style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        borderLeft: '4px solid #a855f7',
                        paddingLeft: '12px',
                        marginBottom: '16px',
                        textTransform: 'uppercase',
                        color: '#374151'
                    }}>시각화</h3>
                    <div style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '8px',
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '400px'
                    }}>
                        {chartImage ? (
                            <img src={chartImage} alt="분석 차트" style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }} />
                        ) : (
                            <div style={{ color: '#9ca3af' }}>차트 이미지를 사용할 수 없습니다</div>
                        )}
                    </div>
                </section>

                {/* Footer */}
                <footer style={{
                    position: 'absolute',
                    bottom: '20mm',
                    left: '20mm',
                    right: '20mm',
                    textAlign: 'center',
                    borderTop: '1px solid #e5e7eb',
                    paddingTop: '16px',
                    fontSize: '12px',
                    color: '#9ca3af'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Synthetic DOE Lab v0.1에서 생성됨</span>
                        <span>페이지 2/2</span>
                    </div>
                </footer>
            </div>
        </>
    );
};
