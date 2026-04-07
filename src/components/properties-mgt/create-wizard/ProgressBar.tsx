'use client';

import { Icon } from '@iconify/react';
import { WizardStep, WIZARD_STEPS } from './types';

interface ProgressBarProps {
    currentStep: WizardStep;
    highestStep: WizardStep;
    onStepClick: (step: WizardStep) => void;
}

export default function ProgressBar({ currentStep, highestStep, onStepClick }: ProgressBarProps) {
    return (
        <div className="w-full">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
                {WIZARD_STEPS.map((step, index) => {
                    const isActive = currentStep === step.key;
                    const isCompleted = step.key < currentStep;
                    const isClickable = step.key <= highestStep;

                    return (
                        <div key={step.key} className="flex items-center flex-1 last:flex-none">
                            {/* Step circle + label */}
                            <button
                                type="button"
                                onClick={() => isClickable && onStepClick(step.key)}
                                disabled={!isClickable}
                                className={`flex flex-col items-center gap-1.5 group transition-all ${
                                    isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
                                }`}
                            >
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                        isActive
                                            ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110'
                                            : isCompleted
                                            ? 'bg-primary/20 text-primary'
                                            : 'bg-zinc-100 text-zinc-400'
                                    } ${isClickable && !isActive ? 'group-hover:scale-105' : ''}`}
                                >
                                    {isCompleted ? (
                                        <Icon icon="solar:check-read-bold" className="text-lg" />
                                    ) : (
                                        <Icon icon={step.icon} className="text-lg" />
                                    )}
                                </div>
                                <span
                                    className={`text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap ${
                                        isActive ? 'text-primary' : isCompleted ? 'text-primary/70' : 'text-zinc-400'
                                    }`}
                                >
                                    {step.label}
                                </span>
                            </button>

                            {/* Connector line */}
                            {index < WIZARD_STEPS.length - 1 && (
                                <div className="flex-1 mx-3 mt-[-18px]">
                                    <div className="h-0.5 rounded-full bg-zinc-200 overflow-hidden">
                                        <div
                                            className={`h-full bg-primary transition-all duration-500 ${
                                                step.key < currentStep ? 'w-full' : 'w-0'
                                            }`}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
