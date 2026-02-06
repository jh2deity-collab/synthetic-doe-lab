"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { Variable } from "@/types";

// Plotly must be imported dynamically to avoid SSR issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false }) as any;

export const DistributionPlot = ({ matrix = [], variables = [] }: { matrix: Record<string, unknown>[]; variables: Variable[] }) => {

    const plotData = useMemo(() => {
        if (!matrix || matrix.length === 0) return [];

        // Filter variables to only those that exist in the matrix
        // (LHC strategy only generates continuous variables, so categorical ones are missing from matrix)
        const validVariables = variables.filter(v => v.name in matrix[0]);

        if (validVariables.length === 0) return [];

        const xVar = validVariables[0]?.name;
        const yVar = validVariables[1]?.name;
        const zVar = validVariables[2]?.name;

        // X is guaranteed if check above passed
        const x = matrix.map(row => row[xVar]);
        // Use 0-fill only if no variable at all, but validVariables handles validity.
        // If yVar exists (length >= 2), map it. Else 0.
        const y = yVar ? matrix.map(row => row[yVar]) : Array(matrix.length).fill(0);
        const z = zVar ? matrix.map(row => row[zVar]) : Array(matrix.length).fill(0);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const trace: any = {
            x: x,
            y: y,
            mode: 'markers',
            marker: {
                size: 8,
                color: '#bef264', // Neon Lime
                opacity: 0.8,
                line: {
                    color: 'rgba(255,255,255,0.5)',
                    width: 1
                }
            },
            type: zVar ? 'scatter3d' : 'scatter'
        };

        if (zVar) {
            trace.z = z;
        }

        return [trace];
    }, [matrix, variables]);

    return (
        <div className="w-full h-64 bg-black/20 rounded-lg overflow-hidden border border-white/5 relative">
            {matrix.length > 0 ? (
                <Plot
                    data={plotData}
                    layout={{
                        autosize: true,
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        plot_bgcolor: 'rgba(0,0,0,0)',
                        margin: { l: 0, r: 0, b: 0, t: 0 },
                        showlegend: false,
                        scene: {
                            xaxis: {
                                title: variables[0]?.name,
                                zerolinecolor: '#333',
                                gridcolor: '#222',
                                tickfont: { color: '#666' }
                            },
                            yaxis: {
                                title: variables[1]?.name,
                                zerolinecolor: '#333',
                                gridcolor: '#222',
                                tickfont: { color: '#666' }
                            },
                            zaxis: {
                                title: variables[2]?.name,
                                zerolinecolor: '#333',
                                gridcolor: '#222',
                                tickfont: { color: '#666' }
                            },
                            camera: {
                                eye: { x: 1.5, y: 1.5, z: 1.5 }
                            }
                        },
                        // 2D fallback layout
                        xaxis: {
                            title: variables[0]?.name,
                            color: '#666',
                            gridcolor: '#222'
                        },
                        yaxis: {
                            title: variables[1]?.name,
                            color: '#666',
                            gridcolor: '#222'
                        }
                    }}
                    style={{ width: "100%", height: "100%" }}
                    config={{ displayModeBar: false }}
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs">
                    No data to visualize
                </div>
            )}
        </div>
    );
};
