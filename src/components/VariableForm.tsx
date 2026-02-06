"use client";

import { Plus, Trash2, Settings2 } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import clsx from "clsx";
import { Variable } from "@/types";

interface FormValues {
    variables: Variable[];
}

const RAINBOW_COLORS = [
    { name: "Red", value: "#ef4444" },
    { name: "Orange", value: "#f97316" },
    { name: "Yellow", value: "#eab308" },
    { name: "Lime", value: "#bef264" },
    { name: "Green", value: "#22c55e" },
    { name: "Teal", value: "#14b8a6" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Indigo", value: "#6366f1" },
    { name: "Purple", value: "#a855f7" },
    { name: "Pink", value: "#ec4899" },
];

const ColorPicker = ({ value, onChange }: { value?: string, onChange: (val: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const currentColor = value || '#bef264';

    return (
        <div className="relative">
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setIsOpen(false)}
                />
            )}
            <div
                className="w-9 h-9 p-0.5 bg-black/20 border border-white/10 rounded cursor-pointer relative z-40 transition-transform hover:scale-105 active:scale-95"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div
                    className="w-full h-full rounded-sm shadow-inner"
                    style={{ backgroundColor: currentColor }}
                />
            </div>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 p-2 bg-[#1a1c2e] border border-white/10 rounded-xl shadow-xl z-50 w-48 animate-in fade-in zoom-in-95 duration-200">
                    <div className="grid grid-cols-5 gap-2">
                        {RAINBOW_COLORS.map((c) => (
                            <button
                                key={c.value}
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChange(c.value);
                                    setIsOpen(false);
                                }}
                                className={clsx(
                                    "w-6 h-6 rounded-full transition-transform hover:scale-125 border border-white/10 focus:outline-none hover:border-white shadow-sm",
                                    currentColor === c.value && "ring-2 ring-white scale-110"
                                )}
                                style={{ backgroundColor: c.value }}
                                title={c.name}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const VariableForm = () => {
    const { register, control, watch, setValue } = useFormContext<FormValues>();
    const { fields, append, remove } = useFieldArray({
        control,
        name: "variables",
    });

    // Watch types to conditionally render bounds vs levels
    const watchFieldArray = watch("variables");
    const controlledFields = fields.map((field, index) => {
        return {
            ...field,
            ...watchFieldArray?.[index],
        };
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-lab-lime" />
                    입력 변수 (Factors)
                </h3>
                <button
                    type="button"
                    onClick={() => append({ name: "New Factor", type: "continuous", min: 0, max: 100 })}
                    className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded transition-colors flex items-center gap-1"
                >
                    <Plus className="w-3 h-3" /> 변수 추가
                </button>
            </div>

            <div className="space-y-3">
                <AnimatePresence>
                    {controlledFields.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-start gap-4 group hover:border-lab-lime/30 transition-colors"
                        >
                            <div className="grid grid-cols-12 gap-4 flex-1">
                                {/* Name */}
                                <div className="col-span-3">
                                    <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">변수명</label>
                                    <input
                                        {...register(`variables.${index}.name` as const)}
                                        className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-lab-lime focus:outline-none focus:ring-1 focus:ring-lab-lime/50 transition-all"
                                        placeholder="예: 온도"
                                    />
                                </div>

                                {/* Type */}
                                <div className="col-span-3">
                                    <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">타입</label>
                                    <div className="flex gap-2">
                                        <select
                                            {...register(`variables.${index}.type` as const)}
                                            className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-lab-lime focus:outline-none appearance-none"
                                        >
                                            <option value="continuous">연속형 (범위)</option>
                                            <option value="categorical">범주형 (레벨)</option>
                                            <option value="discrete">이산형</option>
                                        </select>

                                        {/* Rainbow Color Picker */}
                                        <ColorPicker
                                            value={item.color}
                                            onChange={(val) => setValue(`variables.${index}.color`, val)}
                                        />
                                    </div>
                                </div>

                                {/* Bounds / Settings */}
                                <div className="col-span-6 grid grid-cols-2 gap-2">
                                    {item.type === 'continuous' && (
                                        <>
                                            <div>
                                                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">최소값</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    {...register(`variables.${index}.min` as const, { valueAsNumber: true })}
                                                    className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white text-right focus:border-lab-lime focus:outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">최대값</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    {...register(`variables.${index}.max` as const, { valueAsNumber: true })}
                                                    className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white text-right focus:border-lab-lime focus:outline-none"
                                                />
                                            </div>
                                        </>
                                    )}
                                    {item.type !== 'continuous' && (
                                        <div className="col-span-2">
                                            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">레벨 (쉼표로 구분)</label>
                                            <input
                                                {...register(`variables.${index}.levels` as const)}
                                                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-lab-lime focus:outline-none"
                                                placeholder="예: Red, Green, Blue"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Remove */}
                            <button
                                type="button"
                                onClick={() => remove(index)}
                                className="mt-6 p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {fields.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-xl text-slate-500 text-sm">
                    설정된 변수가 없습니다. &quot;변수 추가&quot; 버튼을 눌러 시작하세요.
                </div>
            )}
        </div>
    );
};
