'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { FaPlus, FaMinus } from 'react-icons/fa6';
import { IoBedOutline } from 'react-icons/io5';
import { TbCurrencyNaira, TbToolsKitchen } from 'react-icons/tb';
import { PiBathtub } from 'react-icons/pi';
import { LuSofa, LuUsers } from 'react-icons/lu';
import CustomCheckbox from '@/components/ui/customCheckbox';
import MultipleChoice from '@/components/ui/MultipleChoice';
import { IAmenity } from '../types';
import { UnitFormValues, createEmptyUnit } from './types';
import { formatMoney } from '@/src/lib/utils';
import { UserRole } from '@/src/lib/enums';

type ConfigField = {
    id: keyof Pick<UnitFormValues, 'bedroom_count' | 'kitchen_count' | 'bathroom_count' | 'living_room_count' | 'max_guests'>;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description?: string;
};

const CONFIG_FIELDS: ConfigField[] = [
    { id: 'bedroom_count', label: 'Bedrooms', icon: IoBedOutline },
    { id: 'kitchen_count', label: 'Kitchens', icon: TbToolsKitchen },
    { id: 'bathroom_count', label: 'Bathrooms', icon: PiBathtub },
    { id: 'living_room_count', label: 'Lounges', icon: LuSofa },
    { id: 'max_guests', label: 'Max Guests', icon: LuUsers },
];

const MAX_VALUES: Record<string, number> = {
    bedroom_count: 20, kitchen_count: 5, bathroom_count: 15,
    living_room_count: 10, max_guests: 50, count: 100,
};

function NumberInput({ field, value, onChange, min = 0, max = 100 }: {
    field: ConfigField; value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
    const [isFocused, setIsFocused] = useState(false);
    const [dv, setDv] = useState(value.toString());
    useEffect(() => { setDv(value.toString()); }, [value]);

    const clamp = (n: number) => Math.min(Math.max(n, min), max);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const r = e.target.value;
        if (r === '') { setDv(''); return; }
        const c = r.replace(/^0+/, '').replace(/[^\d]/g, '') || '0';
        const n = parseInt(c, 10);
        if (!isNaN(n)) { const v = clamp(n); setDv(v.toString()); onChange(v); }
    };
    const handleBlur = () => { setIsFocused(false); const v = clamp(parseInt(dv, 10) || 0); setDv(v.toString()); onChange(v); };

    return (
        <div className="relative">
            <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${isFocused ? 'text-primary' : 'text-zinc-400'}`}>
                <field.icon className="text-base" />
            </div>
            <input type="text" inputMode="numeric" pattern="\d*" value={dv} onChange={handleChange}
                onFocus={() => setIsFocused(true)} onBlur={handleBlur}
                className={`w-full bg-zinc-50 border rounded-lg pl-9 pr-16 py-2.5 outline-none transition-all font-semibold text-zinc-900 text-sm ${isFocused ? 'border-primary ring-1 ring-primary/20' : 'border-zinc-200 hover:border-zinc-300'}`} />
            <div className="absolute inset-y-0 right-0 flex items-center gap-0.5 pr-1">
                <button type="button" onClick={() => { const v = clamp((parseInt(dv, 10) || 0) - 1); setDv(v.toString()); onChange(v); }} className="p-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors"><FaMinus className="text-[8px]" /></button>
                <button type="button" onClick={() => { const v = clamp((parseInt(dv, 10) || 0) + 1); setDv(v.toString()); onChange(v); }} className="p-1 rounded bg-primary/10 hover:bg-primary/20 text-primary transition-colors"><FaPlus className="text-[8px]" /></button>
            </div>
        </div>
    );
}

function CountInput({ value, onChange, min = 0, max = 100 }: { value: number; onChange: (v: number) => void; min?: number; max?: number; }) {
    const [isFocused, setIsFocused] = useState(false);
    const [dv, setDv] = useState(value.toString());
    useEffect(() => { setDv(value.toString()); }, [value]);
    const clamp = (n: number) => Math.min(Math.max(n, min), max);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const r = e.target.value;
        if (r === '') { setDv(''); return; }
        const c = r.replace(/^0+/, '').replace(/[^\d]/g, '') || '0';
        const n = parseInt(c, 10);
        if (!isNaN(n)) { const v = clamp(n); setDv(v.toString()); onChange(v); }
    };
    const handleBlur = () => { setIsFocused(false); const v = clamp(parseInt(dv, 10) || 0); setDv(v.toString()); onChange(v); };
    return (
        <input type="text" inputMode="numeric" pattern="\d*" value={dv} onChange={handleChange}
            onFocus={() => setIsFocused(true)} onBlur={handleBlur}
            className={`w-full bg-zinc-50 border rounded-lg px-3 py-2.5 outline-none transition-all font-semibold text-zinc-900 text-center text-sm ${isFocused ? 'border-primary ring-1 ring-primary/20' : 'border-zinc-200 hover:border-zinc-300'}`} />
    );
}

interface UnitDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (unit: UnitFormValues) => void;
    editingUnit: UnitFormValues | null;
    availableAmenities: IAmenity[];
    showAmenityForm: () => void;
    userRole?: string;
}

export default function UnitDrawer({ isOpen, onClose, onSave, editingUnit, availableAmenities, showAmenityForm, userRole }: UnitDrawerProps) {
    const [unit, setUnit] = useState<UnitFormValues>(editingUnit ?? createEmptyUnit());

    useEffect(() => {
        if (isOpen) setUnit(editingUnit ?? createEmptyUnit());
    }, [isOpen, editingUnit]);

    const updateField = (field: string, value: any) => setUnit(prev => ({ ...prev, [field]: value }));

    const handleSave = () => {
        if (!unit.name.trim()) return;
        onSave(unit);
    };

    return (
        <>
            {isOpen && <div className="fixed inset-0 bg-black/30 z-40 transition-opacity" onClick={onClose} />}
            <div className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Icon icon="solar:buildings-bold-duotone" className="text-lg text-primary" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-zinc-900">{editingUnit ? 'Edit Unit' : 'Add New Unit'}</h3>
                            <p className="text-[10px] text-zinc-500">Configure unit details</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-200 text-zinc-500 transition-colors">
                        <Icon icon="solar:close-circle-bold" className="text-xl" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    {/* Basic Info */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Basic Information</h4>
                        <div>
                            <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider ml-1">Unit Name <span className="text-primary">*</span></label>
                            <input type="text" placeholder="e.g., Luxury Suite A" value={unit.name} onChange={(e) => updateField('name', e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all text-sm" />
                        </div>
                        <div>
                            <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider ml-1">Description</label>
                            <textarea maxLength={300} rows={2} placeholder="Brief description..." value={unit.description} onChange={(e) => updateField('description', e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-3 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all text-sm resize-none" />
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Pricing</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider ml-1">Price Per Night <span className="text-primary">*</span></label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><TbCurrencyNaira className="text-base text-zinc-400" /></div>
                                    <input type="number" min="0.01" step="0.01" value={unit.price_per_night} onChange={(e) => updateField('price_per_night', e.target.value)}
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-8 pr-3 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all font-semibold text-sm" placeholder="0.00" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider ml-1">Caution Fee</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><TbCurrencyNaira className="text-base text-zinc-400" /></div>
                                    <input type="number" min="0" step="0.01" value={unit.caution_fee} onChange={(e) => updateField('caution_fee', e.target.value)}
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-8 pr-3 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all font-semibold text-sm" placeholder="0.00" />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-center gap-1 bg-zinc-900 rounded-xl py-3">
                            <TbCurrencyNaira className="text-lg text-primary" />
                            <span className="text-lg font-bold text-white tracking-tight">{formatMoney(Number(unit.price_per_night || 0) + Number(unit.caution_fee || 0))}</span>
                            <span className="text-xs text-zinc-400 ml-1">total package</span>
                        </div>
                    </div>

                    {/* Configuration */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Configuration</h4>
                        <div className="grid grid-cols-2 gap-3">
                            {CONFIG_FIELDS.map((field) => (
                                <div key={field.id} className="space-y-1">
                                    <label className="text-[8px] font-medium text-zinc-500 uppercase tracking-wider ml-1">{field.label}</label>
                                    <NumberInput field={field} value={unit[field.id]} onChange={(val) => updateField(field.id, val)} min={0} max={MAX_VALUES[field.id]} />
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                            <CustomCheckbox label="Whole property" checked={unit.is_whole_property} onChange={(val: boolean) => updateField('is_whole_property', val)} />
                            <div className="w-24">
                                <label className="text-[8px] font-medium text-zinc-500 uppercase tracking-wider ml-1">Units</label>
                                <CountInput value={unit.count} onChange={(val) => updateField('count', val)} min={1} max={MAX_VALUES.count} />
                            </div>
                        </div>
                    </div>

                    {/* Amenities */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Amenities</h4>
                            {userRole === UserRole.ADMIN && (
                                <button type="button" onClick={showAmenityForm} className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-medium rounded-lg hover:bg-primary/20 transition-all flex items-center gap-1">
                                    <FaPlus className="text-[7px]" /> ADD
                                </button>
                            )}
                        </div>
                        <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-3 max-h-40 overflow-y-auto">
                            <MultipleChoice options={availableAmenities?.map(el => el.name) ?? []} selected={unit.amenityNames} onChange={(val) => updateField('amenityNames', [...val])} />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 px-6 py-4 border-t border-zinc-200 bg-zinc-50 flex items-center gap-3">
                    <button type="button" onClick={onClose} className="flex-1 h-10 border border-zinc-200 text-zinc-600 text-xs font-semibold rounded-xl hover:bg-zinc-100 transition-all">Cancel</button>
                    <button type="button" onClick={handleSave} disabled={!unit.name.trim() || !unit.price_per_night}
                        className="flex-1 h-10 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        <Icon icon="solar:check-read-bold" className="text-sm" />
                        {editingUnit ? 'Update Unit' : 'Add Unit'}
                    </button>
                </div>
            </div>
        </>
    );
}
