'use client';

import { Icon } from '@iconify/react';
import { IoBedOutline } from 'react-icons/io5';
import { LuUsers } from 'react-icons/lu';
import { TbCurrencyNaira } from 'react-icons/tb';
import { UnitFormValues } from './types';
import { formatMoney } from '@/src/lib/utils';

interface UnitCardProps {
    unit: UnitFormValues;
    index: number;
    onEdit: () => void;
    onDelete: () => void;
}

export default function UnitCard({ unit, index, onEdit, onDelete }: UnitCardProps) {
    return (
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 hover:border-primary/30 hover:shadow-sm transition-all group">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon icon="solar:buildings-bold-duotone" className="text-lg text-primary" />
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-sm font-bold text-zinc-900 truncate">
                            {unit.name || `Unit ${index + 1}`}
                        </h4>
                        <p className="text-[10px] text-zinc-500 truncate">
                            {unit.description || 'No description'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                        type="button"
                        onClick={onEdit}
                        className="p-1.5 rounded-lg hover:bg-primary/10 text-zinc-400 hover:text-primary transition-colors"
                        title="Edit unit"
                    >
                        <Icon icon="solar:pen-bold" className="text-sm" />
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors"
                        title="Remove unit"
                    >
                        <Icon icon="solar:trash-bin-trash-bold" className="text-sm" />
                    </button>
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                    <TbCurrencyNaira className="text-primary text-sm" />
                    <span className="font-semibold">{formatMoney(Number(unit.price_per_night) || 0)}</span>
                    <span className="text-zinc-400">/night</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                    <IoBedOutline className="text-primary text-sm" />
                    <span className="font-semibold">{unit.bedroom_count}</span>
                    <span className="text-zinc-400">bed{unit.bedroom_count !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                    <LuUsers className="text-primary text-sm" />
                    <span className="font-semibold">{unit.max_guests}</span>
                    <span className="text-zinc-400">guest{unit.max_guests !== 1 ? 's' : ''}</span>
                </div>
                {unit.count > 1 && (
                    <span className="px-1.5 py-0.5 bg-primary/10 text-primary font-bold rounded text-[10px]">
                        x{unit.count}
                    </span>
                )}
            </div>
        </div>
    );
}
