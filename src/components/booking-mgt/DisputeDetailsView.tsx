"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { ArrowIcon } from "@/src/components/icons";
import { DisputeStatus, DisputeOutcome, DisputeCategory } from "@/src/lib/enums";
import {
    useDisputeDetails,
    useMyDisputeDetails,
    useUpdateDisputeStatus,
    useRequestDisputeEvidence,
    useResolveDispute,
    useUploadDisputeEvidence,
    useDeleteDisputeEvidence
} from "@/src/hooks/useDisputes";
import Spinner from "@/src/components/ui/Spinner";
import { format } from "date-fns";
import CustomModal from "@/src/components/ui/CustomModal";
import toast from "react-hot-toast";
import { usePermissions } from "@/src/hooks/usePermissions";
import Image from "next/image";

const DisputeDetailsView = () => {
    const { id } = useParams();
    const disputeId = id as string;
    const router = useRouter();
    const { isAdmin, isOwner, isAgent } = usePermissions();

    const adminQuery = useDisputeDetails(disputeId);
    const ownerQuery = useMyDisputeDetails(disputeId);

    const { data: dispute, isLoading } = isAdmin ? adminQuery : ownerQuery;

    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
    const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
    const [isUploadEvidenceModalOpen, setIsUploadEvidenceModalOpen] = useState(false);

    const updateStatusMutation = useUpdateDisputeStatus();
    const requestEvidenceMutation = useRequestDisputeEvidence();
    const resolveMutation = useResolveDispute();
    const uploadEvidenceMutation = useUploadDisputeEvidence();
    const deleteEvidenceMutation = useDeleteDisputeEvidence();

    const [deletingEvidenceId, setDeletingEvidenceId] = useState<string | null>(null);

    const handleDeleteEvidence = (evidenceId: string) => {
        if (window.confirm("Are you sure you want to delete this evidence?")) {
            setDeletingEvidenceId(evidenceId);
            deleteEvidenceMutation.mutate(
                { disputeId, evidenceId },
                {
                    onSettled: () => setDeletingEvidenceId(null),
                }
            );
        }
    };

    const [adminNotes, setAdminNotes] = useState("");
    const [newStatus, setNewStatus] = useState<DisputeStatus>(DisputeStatus.OPEN);
    const [outcome, setOutcome] = useState<DisputeOutcome>(DisputeOutcome.NO_ACTION);
    const [evidenceReason, setEvidenceReason] = useState("");
    const [amount, setAmount] = useState<string>("");
    const [uploadFiles, setUploadFiles] = useState<File[]>([]);

    useEffect(() => {
        if (isResolveModalOpen && dispute) {
            // Default to NO_ACTION for all roles as it's a common option now
            setOutcome(DisputeOutcome.NO_ACTION);
        }
    }, [isResolveModalOpen, dispute]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spinner />
            </div>
        );
    }

    if (!dispute) {
        return (
            <div className="p-8 text-center bg-white rounded-2xl border border-gray-100">
                <Icon icon="solar:danger-bold" className="mx-auto text-4xl text-red-500 mb-4" />
                <h3 className="text-xl font-bold text-gray-900">Dispute not found</h3>
                <button onClick={() => router.back()} className="mt-4 text-primary font-medium hover:underline">
                    Go back
                </button>
            </div>
        );
    }


    const handleUpdateStatus = () => {
        updateStatusMutation.mutate({ id: disputeId, status: newStatus, admin_notes: adminNotes }, {
            onSuccess: () => {
                setIsStatusModalOpen(false);
                setAdminNotes("");
            }
        });
    };

    const handleRequestEvidence = () => {
        requestEvidenceMutation.mutate({ id: disputeId, reason: evidenceReason }, {
            onSuccess: () => {
                setIsEvidenceModalOpen(false);
                setEvidenceReason("");
            }
        });
    };

    const handleResolve = () => {
        resolveMutation.mutate({ id: disputeId, outcome, admin_notes: adminNotes, amount: Number(amount) || 0 }, {
            onSuccess: () => {
                setIsResolveModalOpen(false);
                setAdminNotes("");
                setAmount("");
            }
        });
    };

    const getStatusColor = (status: DisputeStatus) => {
        switch (status) {
            case DisputeStatus.OPEN: return "bg-amber-50 text-amber-600 border-amber-100";
            case DisputeStatus.UNDER_REVIEW: return "bg-blue-50 text-blue-600 border-blue-100";
            case DisputeStatus.AWAITING_EVIDENCE: return "bg-purple-50 text-purple-600 border-purple-100";
            case DisputeStatus.RESOLVED: return "bg-green-50 text-green-600 border-green-100";
            case DisputeStatus.CLOSED: return "bg-gray-50 text-gray-600 border-gray-100";
            default: return "bg-gray-50 text-gray-500";
        }
    };

    return (
        <div className="space-y-6 px-4 py-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline group">
                        <ArrowIcon className="w-3.5 h-3.5 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                        BACK TO DISPUTES
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Case ID: {dispute.dispute_id || disputeId.split('-')[0].toUpperCase()}</h1>
                    <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(dispute.status)}`}>
                            {dispute.status}
                        </span>
                        <span className="text-[10px] font-medium text-gray-400">Created on {format(new Date(dispute.created_at), "MMM d, yyyy • p")}</span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Admin Actions */}
                    {isAdmin && (
                        <>
                            <button
                                onClick={() => setIsStatusModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl transition-all text-xs font-bold"
                            >
                                <Icon icon="solar:tuning-bold-duotone" width="18" />
                                UPDATE STATUS
                            </button>
                            <button
                                onClick={() => setIsEvidenceModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 border border-amber-200 text-amber-600 hover:bg-amber-50 rounded-xl transition-all text-xs font-bold"
                            >
                                <Icon icon="solar:document-bold-duotone" width="18" />
                                REQUEST EVIDENCE
                            </button>
                            {dispute.status !== DisputeStatus.RESOLVED && (
                                <button
                                    onClick={() => setIsResolveModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-xl transition-all shadow-md text-xs font-bold"
                                >
                                    <Icon icon="solar:check-circle-bold-duotone" width="18" />
                                    RESOLVE CASE
                                </button>
                            )}
                        </>
                    )}

                    {/* Owner/Agent Actions */}
                    {!isAdmin && (
                        <button
                            onClick={() => setIsUploadEvidenceModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white hover:bg-primary/90 rounded-xl transition-all shadow-md text-xs font-bold"
                        >
                            <Icon icon="solar:add-circle-bold-duotone" width="18" />
                            ADD EVIDENCE
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
                        <div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Dispute Context</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Category</p>
                                    <p className="text-sm font-bold text-gray-900 italic tracking-tight">{dispute.category.replace(/_/g, ' ')}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Booking Reference</p>
                                    <p className="text-sm font-bold text-gray-900"># {dispute.booking_id.split('-')[0].toUpperCase()}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Description</h3>
                            <div className="p-6 bg-primary/5 border border-primary/10 rounded-2xl">
                                <p className="text-gray-700 leading-relaxed italic">
                                    "{dispute.description}"
                                </p>
                            </div>
                        </div>

                        {/* Evidence Gallery */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Evidence Attached</h3>
                                <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-500">
                                    {dispute.evidence?.length || 0} ITEMS
                                </span>
                            </div>
                            {dispute.evidence && dispute.evidence.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {dispute.evidence.map((item, idx) => (
                                        <div key={idx} className="group relative aspect-square rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 hover:shadow-lg transition-all">
                                            <img src={item.media_url} alt="Evidence" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                <a href={item.media_url} target="_blank" className="p-2 bg-white rounded-full text-gray-900 shadow-xl transform scale-75 group-hover:scale-100 transition-transform">
                                                    <Icon icon="solar:eye-bold" />
                                                </a>
                                                {!isAdmin && (
                                                    <button
                                                        onClick={() => handleDeleteEvidence(item.id)}
                                                        disabled={deletingEvidenceId === item.id}
                                                        className="p-2 bg-red-500 rounded-full text-white shadow-xl transform scale-75 group-hover:scale-100 transition-transform hover:bg-red-600 disabled:opacity-50"
                                                        title="Delete Evidence"
                                                    >
                                                        {deletingEvidenceId === item.id ? <Spinner color="white" /> : <Icon icon="solar:trash-bin-trash-bold" />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center text-center">
                                    <Icon icon="solar:gallery-wide-linear" className="text-4xl text-gray-200 mb-4" />
                                    <p className="text-sm text-gray-400">No evidence images uploaded yet.</p>
                                </div>
                            )}
                        </div>

                        {/* Logs */}
                        {dispute.logs && dispute.logs.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Timeline & Logs</h3>
                                <div className="space-y-4">
                                    {dispute.logs.map((log: any, idx: number) => (
                                        <div key={idx} className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                                                <Icon icon="solar:history-bold-duotone" className="text-primary text-xl" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <p className="text-sm font-bold text-gray-900">{log.action}</p>
                                                    <p className="text-[10px] text-gray-400">{format(new Date(log.created_at), "MMM d, HH:mm")}</p>
                                                </div>
                                                <p className="text-xs text-gray-600 mt-1">{log.comment || "No comment"}</p>
                                                {log.new_status && (
                                                    <span className="inline-block mt-2 px-2 py-0.5 bg-white border border-gray-100 rounded text-[10px] font-bold text-primary uppercase">
                                                        {log.new_status}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Parties Involved */}
                    <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-zinc-900/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32" />
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 relative z-10">
                            <Icon icon="solar:users-group-two-rounded-bold-duotone" className="text-xl text-primary" />
                            Parties Involved
                        </h3>
                        <div className="space-y-6 relative z-10">
                            {/* Guest Details */}
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-xl font-bold italic flex-shrink-0">
                                    G
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                        GUEST {dispute.raised_by_role === 'GUEST' && <span className="px-1.5 py-0.5 bg-primary/20 text-primary rounded text-[8px]">RAISED BY</span>}
                                    </p>
                                    <p className="text-sm font-bold text-white">{dispute.guest_name || 'Guest'}</p>
                                    {dispute.guest_email && <p className="text-xs text-zinc-400 flex items-center gap-1.5"><Icon icon="solar:letter-bold" /> {dispute.guest_email}</p>}
                                    {dispute.guest_phone && <p className="text-xs text-zinc-400 flex items-center gap-1.5"><Icon icon="solar:phone-calling-bold" /> {dispute.guest_phone}</p>}
                                </div>
                            </div>

                            <div className="w-full h-px bg-white/5" />

                            {/* Owner Details */}
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-xl font-bold italic flex-shrink-0">
                                    O
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                        OWNER {dispute.raised_by_role === 'OWNER' && <span className="px-1.5 py-0.5 bg-primary/20 text-primary rounded text-[8px]">RAISED BY</span>}
                                    </p>
                                    <p className="text-sm font-bold text-white">{dispute.owner_name || 'Owner'}</p>
                                    {dispute.owner_email && <p className="text-xs text-zinc-400 flex items-center gap-1.5"><Icon icon="solar:letter-bold" /> {dispute.owner_email}</p>}
                                    {dispute.owner_phone && <p className="text-xs text-zinc-400 flex items-center gap-1.5"><Icon icon="solar:phone-calling-bold" /> {dispute.owner_phone}</p>}
                                </div>
                            </div>

                            <div className="w-full h-px bg-white/5" />

                            {/* Booking Reference */}
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-xl font-bold text-primary italic flex-shrink-0">B</div>
                                <div>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">REFERENCED BOOKING</p>
                                    <p className="text-sm font-bold text-white"># {dispute.booking_id.split('-')[0].toUpperCase()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Outcome Summary if Resolved */}
                    {dispute.outcome && (
                        <div className="bg-white border-2 border-green-100 rounded-[2rem] p-8 space-y-4 shadow-lg shadow-green-500/5">
                            <h3 className="text-sm font-bold text-green-600 uppercase tracking-widest">Resolved Outcome</h3>
                            <div className="flex items-center gap-2">
                                <Icon icon="solar:check-circle-bold" className="text-2xl text-green-500" />
                                <span className="text-xl font-bold text-gray-900">{dispute.outcome.replace(/_/g, ' ')}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <CustomModal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} title="Update Dispute Status">
                <div className="space-y-6 p-2">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">New Status</label>
                        <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value as DisputeStatus)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                        >
                            {Object.values(DisputeStatus).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Admin Notes (Optional)</label>
                        <textarea
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            placeholder="Add internal notes about this status change..."
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all min-h-[120px] resize-none"
                        />
                    </div>
                    <button
                        onClick={handleUpdateStatus}
                        disabled={updateStatusMutation.isPending}
                        className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {updateStatusMutation.isPending ? <Spinner color="white" /> : "UPDATE STATUS"}
                    </button>
                </div>
            </CustomModal>

            <CustomModal isOpen={isEvidenceModalOpen} onClose={() => setIsEvidenceModalOpen(false)} title="Request More Evidence">
                <div className="space-y-6 p-2">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Reason for Request</label>
                        <textarea
                            value={evidenceReason}
                            onChange={(e) => setEvidenceReason(e.target.value)}
                            placeholder="Specify what additional evidence or clarification is needed from the complainant..."
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all min-h-[150px] resize-none"
                        />
                    </div>
                    <button
                        onClick={handleRequestEvidence}
                        disabled={requestEvidenceMutation.isPending || !evidenceReason.trim()}
                        className="w-full py-4 bg-amber-600 text-white font-bold rounded-2xl hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {requestEvidenceMutation.isPending ? <Spinner color="white" /> : "SEND EVIDENCE REQUEST"}
                    </button>
                </div>
            </CustomModal>

            <CustomModal isOpen={isResolveModalOpen} onClose={() => setIsResolveModalOpen(false)} title="Resolve Dispute Case">
                <div className="space-y-6 p-2">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Final Outcome</label>
                        <div className="grid grid-cols-2 gap-3">
                            {(dispute.raised_by_role?.toString()?.toUpperCase() === 'GUEST'
                                ? [DisputeOutcome.PARTIAL_REFUND, DisputeOutcome.FULL_REFUND, DisputeOutcome.NO_ACTION]
                                : [DisputeOutcome.PARTIAL_COMPENSATION, DisputeOutcome.FULL_REFUND, DisputeOutcome.NO_ACTION]
                            ).map(o => (
                                <button
                                    key={o}
                                    type="button"
                                    onClick={() => setOutcome(o)}
                                    className={`py-3 px-4 rounded-2xl border-2 text-[10px] font-bold transition-all ${outcome === o ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-zinc-100 bg-zinc-50 text-zinc-500 hover:border-zinc-200'}`}
                                >
                                    {o.replace(/_/g, ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                    {([DisputeOutcome.PARTIAL_REFUND, DisputeOutcome.PARTIAL_COMPENSATION].includes(outcome)) && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                                {outcome === DisputeOutcome.PARTIAL_REFUND ? "Refund Amount (NGN)" : "Compensation Amount (NGN)"}
                            </label>
                            <input
                                type="text"
                                value={amount}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "" || /^\d*$/.test(val)) {
                                        setAmount(val);
                                    }
                                }}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                placeholder="Enter amount..."
                            />
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Resolution Summary</label>
                        <textarea
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            placeholder="Explain the basis for this decision. This may be shared with both parties."
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all min-h-[150px] resize-none"
                        />
                    </div>
                    <button
                        onClick={handleResolve}
                        disabled={resolveMutation.isPending || !adminNotes.trim()}
                        className="w-full py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {resolveMutation.isPending ? <Spinner color="white" /> : "FINALIZE RESOLUTION"}
                    </button>
                </div>
            </CustomModal>

            {/* Upload Evidence Modal for Owners */}
            <CustomModal isOpen={isUploadEvidenceModalOpen} onClose={() => setIsUploadEvidenceModalOpen(false)} title="Upload Additional Evidence">
                <div className="space-y-6 p-2">
                    <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl flex gap-3">
                        <Icon icon="solar:info-circle-bold" className="text-primary text-xl flex-shrink-0" />
                        <p className="text-xs text-primary leading-relaxed italic">
                            Adding more photos or documents can help the support team resolve your case faster.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">New Evidence Files</label>
                        <div className="flex flex-wrap gap-3">
                            {uploadFiles.map((file, idx) => (
                                <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-zinc-200 group">
                                    {file.type.startsWith('image') ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={URL.createObjectURL(file)} alt="Evidence" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                                            <Icon icon="solar:document-bold" width="24" />
                                        </div>
                                    )}
                                    <button
                                        onClick={() => setUploadFiles(files => files.filter((_, i) => i !== idx))}
                                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                    >
                                        <Icon icon="solar:trash-bin-trash-bold" />
                                    </button>
                                </div>
                            ))}
                            <label className="w-20 h-20 rounded-xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group">
                                <Icon icon="solar:add-circle-bold" className="text-zinc-300 group-hover:text-primary text-xl" />
                                <span className="text-[10px] font-bold text-zinc-400 group-hover:text-primary mt-1">UPLOAD</span>
                                <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files) setUploadFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                                    }}
                                    accept="image/*,application/pdf"
                                />
                            </label>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            const formData = new FormData();
                            uploadFiles.forEach(file => formData.append("media_file", file));
                            uploadEvidenceMutation.mutate({ id: disputeId, formData }, {
                                onSuccess: () => {
                                    setIsUploadEvidenceModalOpen(false);
                                    setUploadFiles([]);
                                }
                            });
                        }}
                        disabled={uploadEvidenceMutation.isPending || uploadFiles.length === 0}
                        className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {uploadEvidenceMutation.isPending ? <Spinner color="white" /> : "UPLOAD EVIDENCE"}
                    </button>
                </div>
            </CustomModal>
        </div>
    );
};

export default DisputeDetailsView;
