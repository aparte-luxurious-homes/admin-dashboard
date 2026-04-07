'use client';

import { Dispatch, SetStateAction, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import CustomDropzone from '@/components/ui/CustomDropzone';
import CustomDropdown from '@/components/ui/customDropdown';
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

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Property Gallery */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
                <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                    <Icon icon="solar:camera-bold-duotone" className="text-xl text-primary" />
                    Property Gallery
                </h3>
                <p className="text-xs text-zinc-500">
                    Upload at least 3 high-quality images of the property. These will be the first thing potential guests see.
                </p>
                <div className="w-full">
                    <CustomDropzone
                        onDrop={(files: File[]) => setUploadedMedia(files)}
                        multiple
                        previewsRef={uploadRef}
                        minFiles={3}
                    />
                </div>
                {uploadedMedia.length > 0 && uploadedMedia.length < 3 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
                        <Icon icon="solar:danger-triangle-bold-duotone" className="text-amber-500 text-xl flex-shrink-0" />
                        <p className="text-sm text-amber-700">
                            Please add at least {3 - uploadedMedia.length} more image{3 - uploadedMedia.length > 1 ? 's' : ''} (minimum 3 required)
                        </p>
                    </div>
                )}
            </div>

            {/* Unit Media Sections */}
            {units.length > 0 && (
                <div className="space-y-6">
                    {units.map((unit) => {
                        // Ensure a ref array exists for this unit
                        if (!unitUploadRefs.current[unit._key]) {
                            unitUploadRefs.current[unit._key] = [];
                        }

                        return (
                            <div
                                key={unit._key}
                                className="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 space-y-4 shadow-sm"
                            >
                                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                                    <Icon icon="solar:buildings-bold-duotone" className="text-lg text-primary" />
                                    {unit.name || 'Unnamed Unit'} - Photos
                                </h3>
                                <p className="text-xs text-zinc-500">
                                    Add images specific to this unit to help guests see what they are booking.
                                </p>
                                <CustomDropzone
                                    onDrop={(files: File[]) => {
                                        setUnitMediaMap((prev) => ({
                                            ...prev,
                                            [unit._key]: files,
                                        }));
                                    }}
                                    multiple
                                    previewsRef={
                                        {
                                            get current() {
                                                return unitUploadRefs.current[unit._key] ?? [];
                                            },
                                            set current(val) {
                                                unitUploadRefs.current[unit._key] = val;
                                            },
                                        } as React.MutableRefObject<{ url: string; file: File }[]>
                                    }
                                    minFiles={0}
                                />
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Ownership Documents */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
                <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                    <Icon icon="solar:file-text-bold-duotone" className="text-xl text-primary" />
                    Ownership Documents
                </h3>
                <p className="text-xs text-zinc-500">
                    Upload proof of ownership documents (PDF, JPG, PNG). These will be reviewed during verification.
                </p>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Document Type</label>
                        <CustomDropdown
                            selected={selectedDocType}
                            options={Object.values(DocumentType)}
                            handleSelection={(val) => setSelectedDocType(val as DocumentType)}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1 mb-2 block">
                            Select File
                        </label>
                        <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    setDocFiles((prev) => [...prev, { file, type: selectedDocType }]);
                                    e.target.value = '';
                                }
                            }}
                            className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer cursor-pointer"
                        />
                    </div>

                    {docFiles.length > 0 && (
                        <div className="space-y-2">
                            {docFiles.map((doc, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Icon icon="solar:file-text-bold-duotone" className="text-lg text-primary flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-zinc-800 truncate">{doc.file.name}</p>
                                            <p className="text-[10px] text-zinc-400">{doc.type.replace(/_/g, ' ')}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setDocFiles((prev) => prev.filter((_, i) => i !== idx))}
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

            {/* Ready to Submit Info */}
            <div className="bg-zinc-900 rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[60px] -mr-24 -mt-24" />
                <h4 className="text-sm font-bold mb-3 flex items-center gap-2 relative z-10">
                    <Icon icon="solar:shield-check-bold-duotone" className="text-lg text-primary" />
                    Ready to submit?
                </h4>
                <ul className="space-y-2 relative z-10">
                    <li className="text-xs text-zinc-400 flex items-start gap-2">
                        <Icon icon="solar:check-circle-bold" className="text-primary text-sm mt-0.5 flex-shrink-0" />
                        Ensure you have uploaded at least 3 property images
                    </li>
                    <li className="text-xs text-zinc-400 flex items-start gap-2">
                        <Icon icon="solar:check-circle-bold" className="text-primary text-sm mt-0.5 flex-shrink-0" />
                        Ownership documents help speed up the verification process
                    </li>
                    <li className="text-xs text-zinc-400 flex items-start gap-2">
                        <Icon icon="solar:check-circle-bold" className="text-primary text-sm mt-0.5 flex-shrink-0" />
                        Unit-specific photos help guests see exactly what they are booking
                    </li>
                    <li className="text-xs text-zinc-400 flex items-start gap-2">
                        <Icon icon="solar:check-circle-bold" className="text-primary text-sm mt-0.5 flex-shrink-0" />
                        You can always add more media and documents after creation
                    </li>
                </ul>
            </div>
        </div>
    );
}
