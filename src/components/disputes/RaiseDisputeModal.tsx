"use client";

import { MESSAGES } from '@/src/lib/messages';
import { useState } from "react";
import { Icon } from "@iconify/react";
import CustomModal from "../ui/CustomModal";
import { DisputeCategory } from "../../lib/enums";
import { useCreateDispute } from "../../hooks/useDisputes";
import Spinner from "../ui/Spinner";
import toast from "react-hot-toast";

interface RaiseDisputeModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookingId: string;
}

const RaiseDisputeModal = ({ isOpen, onClose, bookingId }: RaiseDisputeModalProps) => {
    const [category, setCategory] = useState<DisputeCategory>(DisputeCategory.GUEST_DAMAGE);
    const [description, setDescription] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    
    const createDisputeMutation = useCreateDispute();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!description.trim()) {
            toast.error(MESSAGES.MSG_PLEASE_PROVIDE_A_DESCRIPTION_OF_THE_ISSU);
            return;
        }

        const formData = new FormData();
        formData.append("booking_id", bookingId);
        formData.append("category", category);
        formData.append("description", description);
        
        files.forEach(file => {
            formData.append("media_file", file);
        });

        createDisputeMutation.mutate(formData, {
            onSuccess: () => {
                onClose();
                setCategory(DisputeCategory.GUEST_DAMAGE);
                setDescription("");
                setFiles([]);
            }
        });
    };

    return (
        <CustomModal isOpen={isOpen} onClose={onClose} title="Raise a Dispute">
            <div className="space-y-6 p-2">
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
                    <Icon icon="solar:info-circle-bold" className="text-amber-600 text-xl flex-shrink-0" />
                    <p className="text-xs text-amber-700 leading-relaxed">
                        Raising a dispute will notify the support team. Please provide as much detail and evidence (photos/videos) as possible to expedite resolution.
                    </p>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Dispute Category</label>
                    <select 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value as DisputeCategory)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all appearance-none"
                    >
                        <option value={DisputeCategory.GUEST_DAMAGE}>Guest Damage</option>
                        <option value={DisputeCategory.RULE_VIOLATION}>Rule Violation</option>
                        <option value={DisputeCategory.UNAUTHORIZED_GUEST}>Unauthorized Guest</option>
                        <option value={DisputeCategory.OVERSTAYING}>Overstaying</option>
                        <option value={DisputeCategory.OTHER}>Other Issues</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">What happened?</label>
                    <textarea 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Provide a detailed description of the incident..."
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all min-h-[120px] resize-none"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Evidence Files (Optional)</label>
                    <div className="flex flex-wrap gap-3">
                        {files.map((file, idx) => (
                            <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-zinc-200 group">
                                {file.type.startsWith('image') ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={URL.createObjectURL(file)} alt="Evidence" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
                                        <Icon icon="solar:document-bold" className="text-zinc-400 text-2xl" />
                                    </div>
                                )}
                                <button 
                                    onClick={() => removeFile(idx)}
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                >
                                    <Icon icon="solar:trash-bin-trash-bold" />
                                </button>
                            </div>
                        ))}
                        <label className="w-20 h-20 rounded-xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group">
                            <Icon icon="solar:add-circle-bold" className="text-zinc-300 group-hover:text-primary text-xl" />
                            <span className="text-[10px] font-bold text-zinc-400 group-hover:text-primary mt-1 px-1 text-center leading-tight">ADD MEDIA</span>
                            <input type="file" multiple className="hidden" onChange={handleFileChange} accept="image/*,application/pdf" />
                        </label>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-2">Max 5MB per file. Formats: JPG, PNG, PDF.</p>
                </div>

                <button 
                    onClick={handleSubmit}
                    disabled={createDisputeMutation.isPending || !description.trim()}
                    className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                >
                    {createDisputeMutation.isPending ? <Spinner color="white" /> : "RAISE DISPUTE"}
                </button>
            </div>
        </CustomModal>
    );
};

export default RaiseDisputeModal;
