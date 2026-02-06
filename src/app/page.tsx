import Link from "next/link";
import { FlaskConical, ArrowRight, Zap, BarChart3, Database } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-lab-dark text-white font-sans selection:bg-lab-lime selection:text-lab-dark">
      {/* Navbar */}
      <nav className="border-b border-white/5 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-3xl tracking-tight">
            <FlaskConical className="w-8 h-8 text-lab-lime" />
            <span>Synthetic <span className="text-lab-lime">DOE</span> Lab</span>
          </div>
          <div className="hidden md:flex gap-8 text-lg font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">기능 소개</a>
            <a href="#about" className="hover:text-white transition-colors">프로젝트 소개</a>
          </div>

        </div>
      </nav>

      <main className="relative overflow-hidden">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 pt-20 pb-20 relative z-10 flex flex-col md:flex-row items-center gap-12">
          {/* Text Content */}
          <div className="flex-1 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-lab-lime text-xs font-bold mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lab-lime opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-lab-lime"></span>
              </span>
              AI Powered Experimental Design
            </div>
            <h1 className="text-3xl md:text-5xl font-bold leading-[1.1] mb-6 tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              실험의 미래를<br />
              <span className="text-lab-lime">가상 공간</span>에서 설계하세요
            </h1>
            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
              복잡한 물리 실험을 <strong>Digital Twin</strong>으로 대체하세요.<br className="hidden md:block" />
              LLM 기반의 합성 데이터 엔진이 수천 번의 실험을 단 몇 초 만에 시뮬레이션합니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/projects/new"
                className="inline-flex items-center justify-center gap-2 bg-lab-lime text-lab-dark px-8 py-4 rounded-full font-bold text-lg hover:bg-lime-300 transition-all shadow-[0_0_20px_rgba(190,242,100,0.3)] hover:shadow-[0_0_30px_rgba(190,242,100,0.5)] transform hover:-translate-y-1"
              >
                <FlaskConical className="w-5 h-5" />
                가상 분석
              </Link>
              <Link
                href="/analysis"
                className="inline-flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-all backdrop-blur-sm"
              >
                DOE 분석
              </Link>
            </div>
          </div>

          {/* Hero Image */}
          <div className="flex-1 w-full max-w-[600px] relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-lab-lime to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
            <div className="relative rounded-2xl border border-white/10 bg-black/50 backdrop-blur-sm overflow-hidden shadow-2xl">
              <img
                src="/hero-lab.png"
                alt="Synthetic DOE Lab Interface"
                className="w-full h-auto transform transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-colors group">
              <div className="w-12 h-12 bg-lime-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Database className="w-6 h-6 text-lab-lime" />
              </div>
              <h3 className="text-xl font-bold mb-3">스마트 실험 설계 (DOE)</h3>
              <p className="text-slate-400 leading-relaxed">
                LHC(Latin Hypercube), 완전 요인 배치법 등 다양한 알고리즘을 지원합니다.
                변수만 정의하면 최적의 실험 조건을 자동으로 생성합니다.
              </p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-colors group">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">합성 데이터 생성</h3>
              <p className="text-slate-400 leading-relaxed">
                실제 실험 없이도 LLM을 통해 현실적인 가상 데이터를 생성해보세요.
                비용 없이 수천 번의 시뮬레이션이 가능합니다.
              </p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-colors group">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">실시간 SPC 분석</h3>
              <p className="text-slate-400 leading-relaxed">
                생성과 동시에 관리도(Control Chart), 히스토그램, 파레토 차트를 통해
                데이터의 품질과 공정 능력을 즉시 분석합니다.
              </p>
            </div>
          </div>
        </section>

        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-lab-lime/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
        {/* About Project Section */}
        <section id="about" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-10 text-center">프로젝트 소개</h2>

            <div className="space-y-12">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-lab-lime border-l-4 border-lab-lime pl-4">Synthetic DOE Lab이란?</h3>
                <p className="text-slate-400 leading-relaxed">
                  본 프로젝트는 전통적인 <strong>실험계획법(DOE)</strong>과 최신 <strong>생성형 AI(LLM)</strong> 기술을
                  융합한 하이브리드 실험 플랫폼입니다. 실제 실험을 수행하기 전, AI를 통해 가상의 데이터를
                  미리 생성하고 분석함으로써 연구 개발의 시행착오를 줄이고 효율성을 극대화하는 것을 목표로 합니다.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white border-l-4 border-white/20 pl-4">주요 기법 및 용어 정리</h3>
                <div className="grid gap-6">
                  <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                    <h4 className="font-bold mb-2 text-purple-400">DOE (Design of Experiments, 실험계획법)</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      효율적인 실험을 위해 해결하고자 하는 문제에 영향을 미치는 인자(Factor)를 선정하고,
                      그 인자들의 변화가 결과(Response)에 미치는 영향을 통계적으로 분석하기 위한 계획 수립 방법입니다.
                    </p>
                  </div>

                  <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                    <h4 className="font-bold mb-2 text-purple-400">LHC (Latin Hypercube Sampling)</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      모든 변수의 범위를 구간별로 나누어 각 구간에서 표본을 추출하는 방식입니다.
                      단순 무작위 추출보다 샘플이 전체 공간에 더욱 고르게 분포되도록 하여,
                      적은 횟수의 실험으로도 전체 경향성을 파악하기 좋습니다.
                    </p>
                  </div>

                  <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                    <h4 className="font-bold mb-2 text-purple-400">SPC (Statistical Process Control, 통계적 공정 관리)</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      제조 공정에서 발생하는 데이터를 통계적 기법으로 분석하여 품질 규격을 만족하는지 관리하는 기법입니다.
                      본 플랫폼에서는 <strong>X-bar 관리도</strong>와 <strong>공정 능력 지수(Cpk)</strong> 등을 자동으로 계산하여 시각화합니다.
                    </p>
                  </div>

                  <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                    <h4 className="font-bold mb-2 text-purple-400">Synthetic Data (합성 데이터)</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      실제 현장에서 수집한 데이터가 아니라 통계적 모델이나 AI 알고리즘에 의해 생성된 가상 데이터입니다.
                      본 프로젝트에서는 사용자가 입력한 실험 조건(프롬프트)을 바탕으로 LLM이 과학적 인과관계를 추론하여
                      현실성 있는 가상 실험 결과를 생성합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-16 text-center">
              <p className="text-slate-500 text-sm mb-6">
                지금 바로 가상의 실험 환경을 경험해보세요.
              </p>
              <Link
                href="/projects/new"
                className="inline-block bg-white/10 hover:bg-white/20 border border-white/10 text-white px-8 py-3 rounded-full text-sm font-bold transition-all"
              >
                가상 분석
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Fixed at bottom to ensure visibility */}
      <footer className="fixed bottom-0 left-0 w-full py-6 border-t border-white/10 bg-black/90 backdrop-blur-md text-center z-[9999]">
        <p className="text-white text-base font-bold tracking-wide shadow-black drop-shadow-md">
          @ 2026 by SNPE.INC ALL RIGHT RESERVED
        </p>
      </footer>
    </div>
  );
}
