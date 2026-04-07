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
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                        <Icon icon="solar:widget-3-bold-duotone" className="text-xl text-primary" />
                        Property Units
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                        Add rentable units to your property. You can add units now or after creation.
                    </p>
                </div>
                {units.length > 0 && (
                    <button
                        type="button"
                        onClick={onAddUnit}
                        className="h-9 px-4 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2"
                    >
                        <Icon icon="solar:add-circle-bold" className="text-sm" />
                        Add Unit
                    </button>
                )}
            </div>

            {/* Empty State */}
            {units.length === 0 && (
                <div className="border-2 border-dashed border-zinc-300 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
                        <Icon icon="solar:buildings-bold-duotone" className="text-3xl text-zinc-400" />
                    </div>
                    <h4 className="text-sm font-bold text-zinc-700 mb-1">No units added yet</h4>
                    <p className="text-xs text-zinc-500 mb-6 max-w-sm">
                        Units represent the individual bookable spaces within your property. Add at least one unit to start receiving bookings.
                    </p>
                    <button
                        type="button"
                        onClick={onAddUnit}
                        className="h-10 px-6 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2"
                    >
                        <Icon icon="solar:add-circle-bold" className="text-sm" />
                        Add Your First Unit
                    </button>
                </div>
            )}

            {/* Units Grid */}
            {units.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {units.map((unit, index) => (
                        <UnitCard
                            key={unit._key}
                            unit={unit}
                            index={index}
                            onEdit={() => onEditUnit(index)}
                            onDelete={() => onDeleteUnit(index)}
                        />
                    ))}

                    {/* Add Another Card */}
                    <button
                        type="button"
                        onClick={onAddUnit}
                        className="border-2 border-dashed border-zinc-300 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all group min-h-[120px]"
                    >
                        <Icon icon="solar:add-circle-bold-duotone" className="text-2xl text-zinc-400 group-hover:text-primary" />
                        <span className="text-xs font-semibold text-zinc-500 group-hover:text-primary">Add Another Unit</span>
                    </button>
                </div>
            )}

            {/* Tips Card */}
            <div className="bg-zinc-900 rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[60px] -mr-24 -mt-24" />
                <h4 className="text-sm font-bold mb-3 flex items-center gap-2 relative z-10">
                    <Icon icon="solar:lightbulb-bolt-bold-duotone" className="text-lg text-primary" />
                    Tips for Great Listings
                </h4>
                <ul className="space-y-2 relative z-10">
                    <li className="text-xs text-zinc-400 flex items-start gap-2">
                        <Icon icon="solar:check-circle-bold" className="text-primary text-sm mt-0.5 flex-shrink-0" />
                        Use descriptive names like &quot;Deluxe Ocean View Suite&quot; instead of &quot;Unit 1&quot;
                    </li>
                    <li className="text-xs text-zinc-400 flex items-start gap-2">
                        <Icon icon="solar:check-circle-bold" className="text-primary text-sm mt-0.5 flex-shrink-0" />
                        Set competitive pricing by researching similar properties in your area
                    </li>
                    <li className="text-xs text-zinc-400 flex items-start gap-2">
                        <Icon icon="solar:check-circle-bold" className="text-primary text-sm mt-0.5 flex-shrink-0" />
                        Add caution fees for high-value units to protect against damages
                    </li>
                    <li className="text-xs text-zinc-400 flex items-start gap-2">
                        <Icon icon="solar:check-circle-bold" className="text-primary text-sm mt-0.5 flex-shrink-0" />
                        Accurately list room counts and amenities to set the right expectations
                    </li>
                </ul>
            </div>
        </div>
    );
}
