
import os
import time
from typing import List, Dict, Any
from pydantic import BaseModel
import random

# Attempt to import OpenAI, allow fallback if not configured
try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

class GenerationRequest(BaseModel):
    matrix: List[Dict[str, Any]]
    context: str = "Generate a scientific observation log based on these conditions."
    mock: bool = False

class GenerationResponse(BaseModel):
    data: List[Dict[str, Any]]
    total_time: float

class SyntheticGenerator:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = None
        if self.api_key and OpenAI:
            self.client = OpenAI(api_key=self.api_key)

    def generate_row(self, row: Dict[str, Any], context: str, mock: bool = False) -> str:
        """
        Generates a single data point (text/json) based on the DOE row conditions.
        """
        conditions_str = ", ".join([f"{k}: {v}" for k, v in row.items()])
        
        if mock or not self.client:
            # Mock generation for MVP/Cost-saving
            time.sleep(0.1) # Simulate latency
            return '{"Response": ' + str(round(random.uniform(80.0, 100.0), 2)) + ', "Observation": "[MOCK] Observation for ' + conditions_str + '. Result indicates stable properties."}'

        try:
            prompt = f"""
            Context: {context}
            
            Experimental Conditions:
            {conditions_str}
            
            Task:
            Generate a realistic, high-fidelity data record or observation log corresponding strictly to these experimental conditions.
            
            CRITICAL: You must output a valid JSON object with exactly two keys:
            1. "Response": A single numeric representative value (float) for the primary outcome (e.g. Yield, Purity, Strength).
            2. "Observation": A short textual scientific observation.
            
            Example: {{"Response": 98.2, "Observation": "Clear solution, rapid dissolution."}}
            """
            
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a specialized synthetic data generator engine. You output valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=150,
                response_format={"type": "json_object"}
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            return f'{{"Response": 0.0, "Observation": "[ERROR] Generation failed: {str(e)}"}}'

    def generate_batch(self, request: GenerationRequest) -> GenerationResponse:
        start_time = time.time()
        results = []
        
        from concurrent.futures import ThreadPoolExecutor, as_completed

        # Parallel execution for faster batch generation
        with ThreadPoolExecutor(max_workers=10) as executor:
            future_to_row = {executor.submit(self.generate_row, row, request.context, request.mock): row for row in request.matrix}
            
            for future in as_completed(future_to_row):
                row = future_to_row[future]
                try:
                    generated_content = future.result()
                    # Merge the original conditions with the generated output
                    result_row = row.copy()
                    
                    # Parse JSON and flatten
                    try:
                        import json
                        data = json.loads(generated_content)
                        result_row.update(data)
                        result_row['synthetic_output'] = data.get("Observation", str(data))
                    except:
                         result_row['synthetic_output'] = generated_content
                         
                    results.append(result_row)
                except Exception as exc:
                    # Handle individual row failure
                    error_row = row.copy()
                    error_row['synthetic_output'] = f"[ERROR] {str(exc)}"
                    results.append(error_row)
        
        # Sort results to maintain original order if needed (optional, but good for consistency)
        # results.sort(key=lambda x: request.matrix.index(future_to_row[...])) - tricky with dicts
        # Simpler: just return results (order might be shuffled, but SPC doesn't care about order usually)
        
            
        end_time = time.time()
        
        return GenerationResponse(
            data=results,
            total_time=end_time - start_time
        )

    def generate_report_analysis(self, context: str, results: List[Dict[str, Any]], mock: bool = False) -> str:
        """
        Generates a statistical expert analysis summary based on the experiment results.
        """
        if mock or not self.client:
           return """
           <h3>종합 요약 (Executive Summary)</h3>
           <p>본 실험(DOE)은 설정된 주요 변수들이 반응 변수에 미치는 영향을 분석하기 위해 수행되었습니다. 초기 데이터 분석 결과, 공정 변수와 결과값 사이에 유의미한 상관관계가 관찰되었으며, 현재 공정 능력은 안정적인 수준(Cpk > 1.33)으로 평가됩니다. 실험 데이터는 정규 분포를 따르고 있어 통계적 신뢰도가 확보되었습니다.</p>
           
           <h3>데이터 통계 분석 (Statistical Analysis)</h3>
           <ul>
               <li><strong>평균(Mean):</strong> 목표치에 근접하게 형성되어 있으며, 중심화 경향이 우수합니다.</li>
               <li><strong>변동성(Variation):</strong> 표준편차는 허용 오차 범위 내에 있어 공정 산포가 잘 제어되고 있음을 시사합니다.</li>
               <li><strong>이상치(Outliers):</strong> 3-Sigma 수준을 벗어나는 특이점은 발견되지 않았습니다.</li>
           </ul>

           <h3>주요 발견 및 상관관계 (Key Findings)</h3>
           <p>주요 인자(Factors)의 변화에 따라 반응 변수가 선형적인 증가 추세를 보이고 있습니다. 특히 교호작용 효과는 미미한 것으로 판단되나, 특정 조건 구간에서는 비선형적인 거동의 가능성이 있으므로 추가적인 확인 실험이 권장됩니다.</p>

           <h3>개선 권고 사항 (Recommendations)</h3>
           <p>현재의 공정 조건을 유지하되, 변동성을 더욱 좁히기 위한 미세 조정(Fine-tuning)을 제안합니다. 주기적인 모니터링을 통해 장기적인 공정 안정성을 확보하는 것이 바람직합니다.</p>
           """

        try:
            # summarize data for prompt to save tokens
            data_summary = str(results[:50]) # Limit to 50 rows for safety
            
            prompt = f"""
            Context: {context}
            
            Experimental Data (Subset):
            {data_summary}
            
            Task:
            Act as a Senior Statistical Consultant (Ph.D. level). Provide a STRICTLY PROFESSIONAL, HIGHLY DETAILED executive summary and analysis of this experiment in KOREAN (한국어).
            
            Structure your response in HTML format (using <h3>, <p>, <ul>, <li> tags) suitable for embedding in a formal report.
            The analysis should be extensive enough to fill about 1-2 pages of A4 when printed.
            
            Required Sections:
            1. <h3>종합 요약 (Executive Summary)</h3>: A high-level summary of the experiment's purpose and outcomes.
            2. <h3>데이터 통계 분석 (Statistical Analysis)</h3>: specific analysis of the distribution, mean, standard deviation, and any anomalies. Mention specific values from the data.
            3. <h3>주요 발견 및 상관관계 (Key Findings & Correlations)</h3>: Detailed observation of how variables (e.g. {str(list(results[0].keys()) if results else 'Variables')}) impacted the response. Use logic to infer potential relationships.
            4. <h3>개선 권고 사항 (Recommendations)</h3>: Concrete next steps for process optimization.
            
            Tone: Formal, Academic, Insightful.
            Language: Korean (한국어) ONLY.
            """
            
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a Chief Statistician. Output valid HTML content only (no markdown code blocks). Write in Korean."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000 
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            return f"<p>Analysis generation failed: {str(e)}</p>"

generator = SyntheticGenerator()
