'use client';

import { Dispatch, SetStateAction, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import CustomDropdown from '@/components/ui/customDropdown';
import CustomDropzone from '@/components/ui/CustomDropzone';
import { DocumentType } from '../types';
import { UnitFormValues } from './types';

interface StepMediaDocsProps {
    uploadedMedia: File[];
    setUploadedMedia: Dispatch<SetStateAction<File[]>>;
    uploadRef: React.MutableRefObject<{ url: string; file: File }[]>;
    docFiles: { file: File; type: DocumentType }[];
    setDocFiles: Dispatch<SetStateAction<{ file: File; type: DocumentType }[]>>;
    units: UnitFormValues[];
    unitMediaMap: Record<string, File[]>;
    setUnitMediaMap: Dispatch<SetStateAction<Record<string, File[]>>>;
    unitUploadRefs: React.MutableRefObject<Record<string, { url: string; file: File }[]>>;
}

export default function StepMediaDocs({
    uploadedMedia,
    setUploadedMedia,
    uploadRef,
    docFiles,
    setDocFiles,
    units,
    unitMediaMap,
    setUnitMediaMap,
    unitUploadRefs,
}: StepMediaDocsProps) {
    const [selectedDocType, setSelectedDocType] = useState<DocumentType>(DocumentType.UTILITY_BILL);

    const getUnitUploadRef = (key: string) => {
        if (!unitUploadRefs.current[key]) {
            unitUploadRefs.current[key] = [];
        }
        return { current: unitUploadRefs.current[key] };
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {/* Property Gallery */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4 shadow-sm">
                <div>
                    <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                        <Icon icon="solar:camera-bold-duotone" className="text-lg text-primary" />
                        Property Gallery
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                        Upload at least 3 photos of the property. High-quality images attract more guests.
                    </p>
                </div>
                <CustomDropzone
                    onDrop={(files: File[]) => setUploadedMedia(files)}
                    multiple
                    previewsRef={uploadRef}
                    minFiles={3}
                />
                {uploadedMedia.length > 0 && uploadedMedia.length < 3 && (
                    <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                        <Icon icon="solar:danger-triangle-bold" className="text-sm" />
                        Please upload at least 3 images ({uploadedMedia.length}/3)
                    </p>
                )}
            </div>

            {/* Unit Media (per-unit sections) */}
            {units.length > 0 && (
                <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-5 shadow-sm">
                    <div>
                        <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                            <Icon icon="solar:gallery-bold-duotone" className="text-lg text-primary" />
                            Unit Media
                        </h3>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Upload photos for each unit. Unit-specific media helps guests choose the right room.
                        </p>
                    </div>

                    {units.map((unit, index) => (
                        <div key={unit._key} className="border border-zinc-100 rounded-xl p-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Icon icon="solar:buildings-bold-duotone" className="text-xs text-primary" />
                                </div>
                                <h4 className="text-sm font-bold text-zinc-900">
                                    {unit.name || `Unit ${index + 1}`}
                                </h4>
                                {(unitMediaMap[unit._key]?.length ?? 0) > 0 && (
                                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                        {unitMediaMap[unit._key].length} file{unitMediaMap[unit._key].length !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                            <CustomDropzone
                                onDrop={(files: File[]) => {
                                    setUnitMediaMap(prev => ({ ...prev, [unit._key]: files }));
                                }}
                                multiple
                                previewsRef={getUnitUploadRef(unit._key)}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Ownership Documents */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4 shadow-sm">
                <div>
                    <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                        <Icon icon="solar:file-text-bold-duotone" className="text-lg text-primary" />
                        Ownership Documents
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                        Upload proof of ownership (optional). These will be reviewed during verification.
                    </p>
                </div>

                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Document Type</label>
                        <CustomDropdown
                            selected={selectedDocType}
                            options={Object.values(DocumentType)}
                            handleSelection={(val) => setSelectedDocType(val as DocumentType)}
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1 mb-1 block">Select File</label>
                        <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    setDocFiles(prev => [...prev, { file, type: selectedDocType }]);
                                    e.target.value = '';
                                }
                            }}
                            className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer cursor-pointer"
                        />
                    </div>

                    {docFiles.length > 0 && (
                        <div className="space-y-2">
                            {docFiles.map((doc, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Icon icon="solar:file-text-bold-duotone" className="text-lg text-primary flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-zinc-800 truncate">{doc.file.name}</p>
                                            <p className="text-[10px] text-zinc-400">{doc.type.replace(/_/g, ' ')}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setDocFiles(prev => prev.filter((_, i) => i !== idx))}
                                        className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                    >
                                        <Icon icon="solar:trash-bin-trash-bold" className="text-sm" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Review summary */}
            <div className="bg-zinc-900 rounded-2xl p-5 text-white">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-white/10 rounded-xl flex-shrink-0">
                        <Icon icon="solar:shield-check-bold-duotone" className="text-lg text-primary" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold mb-1">Ready to submit?</h4>
                        <p className="text-xs text-zinc-400">
                            Your property will be created with a "Pending Verification" status.
                            An agent will be assigned to verify the property before it goes live.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
