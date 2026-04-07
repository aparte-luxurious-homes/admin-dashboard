'use client';

import { Icon } from '@iconify/react';
import { UnitFormValues } from './types';
import UnitCard from './UnitCard';

interface StepUnitsProps {
    units: UnitFormValues[];
    onAddUnit: () => void;
    onEditUnit: (index: number) => void;
    onDeleteUnit: (index: number) => void;
}

export default function StepUnits({ units, onAddUnit, onEditUnit, onDeleteUnit }: StepUnitsProps) {
    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                            <Icon icon="solar:widget-3-bold-duotone" className="text-lg text-primary" />
                            Property Units
                        </h3>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Add the rentable units for this property. You can skip this and add units later.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onAddUnit}
                        className="h-9 px-4 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1.5"
                    >
                        <Icon icon="solar:add-circle-bold" className="text-base" />
                        Add Unit
                    </button>
                </div>

                {units.length === 0 ? (
                    <div className="border-2 border-dashed border-zinc-200 rounded-xl py-12 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
                            <Icon icon="solar:buildings-bold-duotone" className="text-3xl text-zinc-300" />
                        </div>
                        <h4 className="text-sm font-bold text-zinc-600 mb-1">No units added yet</h4>
                        <p className="text-xs text-zinc-400 max-w-xs mb-4">
                            Units are individual rentable spaces within your property (e.g., rooms, suites, apartments).
                        </p>
                        <button
                            type="button"
                            onClick={onAddUnit}
                            className="h-9 px-5 bg-zinc-900 text-white text-xs font-semibold rounded-xl hover:bg-zinc-800 transition-all flex items-center gap-1.5"
                        >
                            <Icon icon="solar:add-circle-bold" className="text-base" />
                            Add Your First Unit
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {units.map((unit, index) => (
                            <UnitCard
                                key={unit._key}
                                unit={unit}
                                index={index}
                                onEdit={() => onEditUnit(index)}
                                onDelete={() => onDeleteUnit(index)}
                            />
                        ))}

                        {/* Add more card */}
                        <button
                            type="button"
                            onClick={onAddUnit}
                            className="border-2 border-dashed border-zinc-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:border-primary/30 hover:bg-primary/5 transition-all min-h-[100px] group"
                        >
                            <Icon icon="solar:add-circle-bold" className="text-2xl text-zinc-300 group-hover:text-primary transition-colors" />
                            <span className="text-xs font-semibold text-zinc-400 group-hover:text-primary transition-colors">Add Another Unit</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Tips card */}
            <div className="bg-zinc-900 rounded-2xl p-5 text-white">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-white/10 rounded-xl flex-shrink-0">
                        <Icon icon="solar:lightbulb-bolt-bold-duotone" className="text-lg text-yellow-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold mb-1">Tips for listing units</h4>
                        <ul className="text-xs text-zinc-400 space-y-1">
                            <li>Use clear, descriptive names (e.g., "Deluxe Suite", "Standard Room A")</li>
                            <li>Set a competitive price per night for your market</li>
                            <li>If the property is one whole unit, check "Whole property" in the unit config</li>
                            <li>You can always add more units from the property details page later</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
