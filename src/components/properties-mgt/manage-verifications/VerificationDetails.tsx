'use client'

import Image from 'next/image';
import { MdCopyAll } from "react-icons/md";
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import { IoLocationOutline } from 'react-icons/io5';
import { formatDate } from '@/src/lib/utils';
import { VerificationBadge } from '../../badge';
import { CalendarIcon } from '../../icons';
import { IProperty, IPropertyVerification, PropertyVerificationStatus } from '../types';
import { useAuth } from '@/src/hooks/useAuth';
import { AssignToProperty, GetPropertyVerification, UpdatePropertyVerification } from '@/src/lib/request-handlers/propertyMgt';
import { UserRole } from '@/src/lib/enums';
import { useFormik } from 'formik';
import { useDispatch } from 'react-redux';
import { showAlert } from "@/src/lib/slices/alertDialogSlice";
import CustomModal from '../../ui/CustomModal';
import { GetAllUsers } from '@/src/lib/request-handlers/userMgt';
import { IUser } from '@/src/lib/types';
import toast from 'react-hot-toast';
import AdjustableFilterDropdown from "../../ui/AdjustableFilterDropdown";
import Spinner from '../../ui/Spinner';
import Loader from '../../loader';
import { PAGE_ROUTES } from '@/src/lib/routes/page_routes';


export default function VerificationDetails({
    propertyId,
    verificationId
}: {
    propertyId: string | number,
    verificationId: string | number
}) {
    const dispatch = useDispatch();
    const router = useRouter();
    const searchParams = useSearchParams();
    const editFromUrlRef = useRef(false);
    const { user } = useAuth();
    const { mutate: assignAgent, isPending: assignmentLoading } = AssignToProperty(propertyId)
    const { mutate: updateVerification, isPending: verificationUdateLoading } = UpdatePropertyVerification()
    const { data: verificationData, isLoading: verificationLoading } = GetPropertyVerification(verificationId)
    const [verification, setVerification] = useState<IPropertyVerification | null>(null);
    const [property, setProperty] = useState<IProperty | null>(null);
    const [editMode, setEditMode] = useState<boolean>(false)
    const [agentSearchTerm, setAgentSearchTerm] = useState<string>('')


    const { data: agentsList, isLoading: agentsLoading } = GetAllUsers(1, 12, agentSearchTerm, UserRole.AGENT);
    const [agents, setAgents] = useState<IUser[]>(agentsList?.data?.data?.data)
    const [selectedAgent, setSelectedAgent] = useState<IUser | null>(null)
    const [showAgentSelection, setShowAgentSelecteion] = useState(false);
    const [skipKycCheck, setSkipKycCheck] = useState(false);
    const [skipDocumentCheck, setSkipDocumentCheck] = useState(false);


    const formik =
        useFormik({
            enableReinitialize: true,
            initialValues: {
                feedback: verification?.feedback ?? ''
            },
            onSubmit: async () => {
                updateVerification(
                    {
                        propertyId,
                        payload: {
                            feedback: formik.values.feedback,
                            status: verification?.status ?? PropertyVerificationStatus.PENDING,
                        }
                    },
                    {
                        onSuccess: () => {
                            toast.success('Property verification updated successfuly', {
                                duration: 6000,
                                style: {
                                    maxWidth: '500px',
                                    width: 'max-content'
                                }
                            });
                            setEditMode(false)
                        },
                        onError: (error) =>
                            toast.error('Something went wrong', {
                                duration: 6000,
                                style: {
                                    maxWidth: '500px',
                                    width: 'max-content'
                                }
                            }),

                    }
                )
            },
        });

    const handleRejection = () => {
        dispatch(
            showAlert({
                title: "Are you sure?",
                description: "This will permanently reject the verification of this property.",
                confirmText: "Reject",
                cancelText: "Cancel",
                onConfirm: () => updateVerification(
                    {
                        propertyId,
                        payload: {
                            feedback: formik.values.feedback,
                            status: PropertyVerificationStatus.REJECTED
                        }
                    },
                    {
                        onSuccess: () =>
                            toast.success('Property verification updated successfuly', {
                                duration: 6000,
                                style: {
                                    maxWidth: '500px',
                                    width: 'max-content'
                                }
                            }),
                        onError: (error) =>
                            toast.error('Something went wrong', {
                                duration: 6000,
                                style: {
                                    maxWidth: '500px',
                                    width: 'max-content'
                                }
                            }),
                    }
                ),
            })
        );
    };

    const handleVerification = () => {
        dispatch(
            showAlert({
                title: "Are you sure?",
                description: "This will verify this property.",
                confirmText: "Verify",
                cancelText: "Cancel",
                onConfirm: () => updateVerification(
                    {
                        propertyId,
                        payload: {
                            feedback: formik.values.feedback,
                            status: PropertyVerificationStatus.VERIFIED,
                            skip_kyc_check: skipKycCheck,
                            skip_document_check: skipDocumentCheck
                        }
                    },
                    {
                        onSuccess: () =>
                            toast.success('Property verification updated successfuly', {
                                duration: 6000,
                                style: {
                                    maxWidth: '500px',
                                    width: 'max-content'
                                }
                            }),
                        onError: (error: any) =>
                            toast.error(error?.response?.data?.detail || 'Failed to verify property', {
                                duration: 6000,
                                style: {
                                    maxWidth: '500px',
                                    width: 'max-content'
                                }
                            }),
                    }
                ),
            })
        );
    };

    const handleApproval = (name: string) => {
        dispatch(
            showAlert({
                title: "Are you sure?",
                description: `This will approve ${name}'s verification of the property.`,
                confirmText: "Approve",
                cancelText: "Cancel",
                onConfirm: () => updateVerification(
                    {
                        propertyId,
                        payload: {
                            feedback: formik.values.feedback,
                            status: PropertyVerificationStatus.VERIFIED,
                            skip_kyc_check: skipKycCheck,
                            skip_document_check: skipDocumentCheck
                        }
                    },
                    {
                        onSuccess: () =>
                            toast.success('Property verification approved successfuly', {
                                duration: 6000,
                                style: {
                                    maxWidth: '500px',
                                    width: 'max-content'
                                }
                            }),
                        onError: (error: any) =>
                            toast.error(error?.response?.data?.detail || 'Failed to verify property', {
                                duration: 6000,
                                style: {
                                    maxWidth: '500px',
                                    width: 'max-content'
                                }
                            })
                    }
                ),
            })
        );
    };

    const handleAgentSelection = (email: string) => {
        const filteredUsers = agents?.filter(el => {
            if (el?.email === email) return el;
        })
        setSelectedAgent(filteredUsers[0])
    }


    const handleAgentAssignment = (agentId: number) => {
        assignAgent(
            {
                payload: { agent_id: String(agentId) }
            },
            {
                onSuccess: () => {
                    toast.success('Agent assigned successfully', {
                        duration: 6000,
                        style: {
                            maxWidth: '500px',
                            width: 'max-content'
                        }
                    });

                    setShowAgentSelecteion(false)
                },
                onError: (error: any) => {
                    toast.error(error.status === 409 ? 'Agent already assigned with pending verification' : 'Something went wrong', {
                        duration: 6000,
                        style: {
                            maxWidth: '500px',
                            width: 'max-content'
                        }
                    })
                }
            }
        )
    }


    useEffect(() => {
        setAgents(agentsList?.data?.data?.data)
    }, [agentsList])

    useEffect(() => {
        setVerification(verificationData?.data?.data)
        setProperty(verificationData?.data?.data?.property)
        setSelectedAgent(verificationData?.data?.data?.property?.agent)

        // Handle ?edit=true from URL (only once, only for agents)
        if (verificationData?.data?.data && !editFromUrlRef.current && searchParams?.get('edit') === 'true') {
            editFromUrlRef.current = true;
            if (user?.role === UserRole.AGENT && verificationData?.data?.data?.status === PropertyVerificationStatus.PENDING) {
                setEditMode(true);
            }
        }
    }, [verificationData, verificationId, searchParams, user?.role])

    if (verificationLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh] w-full">
                <Loader />
            </div>
        );
    }

    return (
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10 w-full max-w-[1600px] mx-auto">
            <div className="w-full border border-zinc-500/20 bg-white rounded-xl sm:rounded-2xl min-h-[50vh] overflow-hidden">
                <div className='p-4 sm:p-6 md:p-8 lg:p-10 w-full border-b border-zinc-200'>
                    <h4 className='text-zinc-800 text-xl sm:text-2xl md:text-3xl font-medium'>
                        Verification Details
                    </h4>
                </div>

                {/* Main Content Section */}
                <section className="flex flex-col lg:flex-row justify-between gap-4 sm:gap-6 w-full p-4 sm:p-6 md:p-8 lg:p-10">
                    {/* Image Slider */}
                    <div className={`${user?.role !== UserRole.AGENT ? 'w-full lg:w-[70%]' : 'w-full'} relative`}>
                        <Swiper
                            loop={true}
                            modules={[Navigation, Autoplay]}
                            spaceBetween={5}
                            slidesPerView={1}
                            navigation
                            autoplay
                            className="rewind rounded-xl overflow-hidden"
                        >
                            {
                                property?.media && property?.media.length > 0 ?
                                    property?.media?.map((el: any, index: any) => {
                                        const isVideo = (el.media_type || el.mediaType) === 'VIDEO';
                                        const src = el.media_url || el.mediaUrl || "/png/placeholder.png";
                                        return (
                                            <SwiperSlide key={index}>
                                                <div className="relative aspect-[16/9] w-full">
                                                    {isVideo ? (
                                                        <video
                                                            src={src}
                                                            controls
                                                            muted
                                                            preload="metadata"
                                                            className="w-full h-full object-cover rounded-xl"
                                                        />
                                                    ) : (
                                                        <Image
                                                            alt={`${property?.name}_img_${index}`}
                                                            src={src}
                                                            className="object-cover rounded-xl"
                                                            fill
                                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 60vw"
                                                            priority={index === 0}
                                                        />
                                                    )}
                                                </div>
                                            </SwiperSlide>
                                        );
                                    })
                                    :
                                    <SwiperSlide>
                                        <div className="relative aspect-[16/9] w-full">
                                            <Image
                                                alt={`img_`}
                                                src={`/png/sample_properties.png`}
                                                className="object-cover rounded-xl"
                                                fill
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 60vw"
                                            />
                                        </div>
                                    </SwiperSlide>
                            }
                        </Swiper>
                    </div>

                    {/* Agent Info (Desktop Sidebar) */}
                    {
                        user?.role !== UserRole.AGENT &&
                        <div className='w-full lg:w-[30%] flex flex-col gap-y-3 sm:gap-y-4'>
                            <div className='size-full flex flex-col justify-center items-center bg-background rounded-xl p-4 sm:p-6 border border-zinc-100'>
                                <p className='text-sm sm:text-base text-zinc-800 font-medium text-center mb-2'>
                                    Assigned agent
                                </p>
                                <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-xl overflow-hidden my-2 sm:my-3 border-2 border-white shadow-lg">
                                    <Image
                                        alt={`agent_img`}
                                        src={(selectedAgent?.profile?.profileImage || selectedAgent?.profile?.profile_image) ?? `/png/sample_owner.png`}
                                        className="object-cover"
                                        fill
                                        sizes="(max-width: 768px) 96px, 128px"
                                    />
                                </div>
                                <p className='text-sm sm:text-base text-zinc-800 font-medium text-center mb-1 px-2'>
                                    {selectedAgent?.profile?.firstName ? `${selectedAgent?.profile?.firstName} ${selectedAgent?.profile?.lastName}` : (selectedAgent?.firstName ? `${selectedAgent?.firstName} ${selectedAgent?.lastName}` : (selectedAgent?.email || '--/--'))}
                                </p>
                                <p className='text-xs sm:text-sm text-zinc-500 font-medium text-center break-all px-2'>
                                    {selectedAgent?.email ?? '--/--'}
                                </p>
                            </div>

                            <div className='flex flex-col sm:flex-row lg:flex-col gap-2 sm:gap-3 w-full'>
                                <button
                                    type='button'
                                    onClick={() => {
                                        const agentId = selectedAgent?.id;
                                        if (agentId) {
                                            router.push(PAGE_ROUTES.dashboard.userManagement.agents.details(agentId));
                                        }
                                    }}
                                    className="flex-1 text-center cursor-pointer rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base font-medium text-white bg-zinc-500 hover:bg-zinc-600 disabled:hover:bg-zinc-500 disabled:opacity-75 disabled:cursor-not-allowed transition-colors"
                                >
                                    View Agent
                                </button>
                                {
                                    verification?.status !== PropertyVerificationStatus.PENDING && user?.role !== UserRole.OWNER &&
                                    <button
                                        type='button'
                                        onClick={() => {
                                            setShowAgentSelecteion(true);
                                        }}
                                        className="flex-1 text-center cursor-pointer bg-primary/90 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base font-medium text-white hover:bg-primary disabled:hover:bg-primary/90 disabled:opacity-75 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Re-assign
                                    </button>
                                }
                            </div>
                        </div>
                    }
                </section>

                {/* Property Title */}
                <section className='w-full px-4 sm:px-6 md:px-8 lg:px-10 pb-2 sm:pb-3'>
                    <div className='w-full flex justify-between'>
                        <div className='w-full flex flex-col'>
                            <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-zinc-800">
                                {property?.name}
                            </h3>
                            <div className="flex gap-1.5 sm:gap-2 items-center mt-1 sm:mt-2 text-sm sm:text-base text-zinc-600">
                                <IoLocationOutline className="flex-shrink-0" />
                                <p className="text-xs sm:text-sm">
                                    {property?.address || "N/A"}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Property Details Grid */}
                <section className='px-4 sm:px-6 md:px-8 lg:px-10 pb-4 sm:pb-6'>
                    {/* Desktop: Horizontal scrollable cards */}
                    <div className="hidden lg:block overflow-x-auto pb-2">
                        <div className="flex items-center gap-4 min-w-max">
                            {/* Property ID with Copy */}
                            <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-zinc-100 hover:border-primary/20 transition-all shadow-sm hover:shadow">
                                <p className="text-sm text-zinc-500 font-medium whitespace-nowrap">Property ID:</p>
                                <div className="flex items-center gap-1.5">
                                    <p className="text-sm font-semibold text-zinc-900">
                                        APRT25-{property?.id}
                                    </p>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigator.clipboard.writeText(`APRT25-${property?.id}`);
                                            toast.success('ID copied!', { duration: 1500 });
                                        }}
                                        className="text-zinc-400 hover:text-primary transition-colors"
                                    >
                                        <MdCopyAll className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-zinc-100 hover:border-primary/20 transition-all shadow-sm hover:shadow">
                                <p className="text-sm text-zinc-500 font-medium whitespace-nowrap">Status:</p>
                                <VerificationBadge status={verification?.status ?? PropertyVerificationStatus.REJECTED} />
                            </div>

                            {/* Verification Date */}
                            <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-zinc-100 hover:border-primary/20 transition-all shadow-sm hover:shadow">
                                <p className="text-sm text-zinc-500 font-medium whitespace-nowrap">Verified:</p>
                                <div className="flex items-center gap-1.5">
                                    <CalendarIcon color="#a6a4a4" className="w-4 h-4" />
                                    <p className="text-sm font-medium text-zinc-900 whitespace-nowrap">
                                        {verification?.verificationDate ? formatDate(verification?.verificationDate) : '--/--'}
                                    </p>
                                </div>
                            </div>

                            {/* Property Type */}
                            <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-zinc-100 hover:border-primary/20 transition-all shadow-sm hover:shadow">
                                <p className="text-sm text-zinc-500 font-medium whitespace-nowrap">Type:</p>
                                <p className="text-sm font-semibold text-zinc-900 capitalize whitespace-nowrap">
                                    {property?.propertyType?.toLowerCase() || "N/A"}
                                </p>
                            </div>

                            {/* Owner */}
                            <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-zinc-100 hover:border-primary/20 transition-all shadow-sm hover:shadow">
                                <p className="text-sm text-zinc-500 font-medium whitespace-nowrap">Owner:</p>
                                <p className="text-sm text-teal-700 font-medium cursor-pointer hover:text-teal-800 hover:underline flex items-center gap-1">
                                    <span>
                                        {property?.owner?.profile?.firstName 
                                            ? `${property?.owner?.profile?.firstName} ${property?.owner?.profile?.lastName || ''}`
                                            : property?.owner?.firstName 
                                                ? `${property?.owner?.firstName} ${property?.owner?.lastName || ''}`
                                                : property?.owner?.email || '--/--'}
                                    </span>
                                    <span className="text-teal-400/50 text-xs">↗</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Mobile/Tablet: Grid layout */}
                    <div className="lg:hidden grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                        <div className="bg-white px-3 py-2.5 rounded-xl border border-zinc-100 shadow-sm">
                            <p className="text-xs text-zinc-500 font-medium mb-1">Property ID</p>
                            <p className="text-sm font-semibold text-zinc-900 truncate">APRT25-{property?.id}</p>
                        </div>
                        <div className="bg-white px-3 py-2.5 rounded-xl border border-zinc-100 shadow-sm">
                            <p className="text-xs text-zinc-500 font-medium mb-1">Status</p>
                            <VerificationBadge status={verification?.status ?? PropertyVerificationStatus.PENDING} />
                        </div>
                        <div className="bg-white px-3 py-2.5 rounded-xl border border-zinc-100 shadow-sm">
                            <p className="text-xs text-zinc-500 font-medium mb-1">Verified</p>
                            <p className="text-sm font-medium text-zinc-900">
                                {verification?.verificationDate ? formatDate(verification.verificationDate) : '--/--'}
                            </p>
                        </div>
                        <div className="bg-white px-3 py-2.5 rounded-xl border border-zinc-100 shadow-sm">
                            <p className="text-xs text-zinc-500 font-medium mb-1">Type</p>
                            <p className="text-sm font-semibold text-zinc-900 capitalize">
                                {property?.propertyType?.toLowerCase() || 'N/A'}
                            </p>
                        </div>
                        <div className="bg-white px-3 py-2.5 rounded-xl border border-zinc-100 shadow-sm col-span-2 sm:col-span-1">
                            <p className="text-xs text-zinc-500 font-medium mb-1">Owner</p>
                            <p className="text-sm text-teal-700 font-medium truncate">
                                {property?.owner?.profile?.firstName
                                    ? `${property.owner.profile.firstName} ${property.owner.profile.lastName || ''}`
                                    : property?.owner?.email || '--/--'}
                            </p>
                        </div>
                    </div>

                    {/* Amenities - common for all screens */}
                    {property?.amenities && property?.amenities.length > 0 && (
                        <div className="mt-5 lg:mt-6 pt-4 lg:pt-5 border-t border-zinc-100">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-1 h-4 bg-primary/60 rounded-full"></div>
                                <p className="text-xs lg:text-sm font-semibold text-zinc-700 uppercase tracking-wider">Amenities</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {property?.amenities.map((el, index) => (
                                    <div 
                                        key={index} 
                                        className="group relative px-3 py-1.5 lg:px-4 lg:py-2 bg-gradient-to-br from-zinc-50 to-white rounded-lg lg:rounded-xl border border-zinc-200 text-xs lg:text-sm text-zinc-700 hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-default"
                                    >
                                        <span className="relative z-10 font-medium">{el.name}</span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 rounded-lg lg:rounded-xl transition-opacity"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {/* KYC Details */}
                <section className='w-full px-4 sm:px-6 md:px-8 lg:px-10 pb-4 sm:pb-5'>
                    <p className="text-sm sm:text-base font-medium text-zinc-900 mb-2">Owner KYC Details</p>
                    {property?.owner?.profile ? (
                        <div className="p-4 sm:p-5 bg-background/70 rounded-xl space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div>
                                    <p className="text-xs text-zinc-500 mb-1">KYC Status</p>
                                    <VerificationBadge status={property.owner.profile.kycStatus || 'PENDING'} />
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 mb-1">BVN</p>
                                    <p className="text-sm font-medium text-zinc-800">{property.owner.profile.bvn || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 mb-1">NIN</p>
                                    <p className="text-sm font-medium text-zinc-800">{property.owner.profile.nin || 'Not provided'}</p>
                                </div>
                                {property.owner.profile.kycProvider && (
                                    <div>
                                        <p className="text-xs text-zinc-500 mb-1">Provider</p>
                                        <p className="text-sm font-medium text-zinc-800 capitalize">{property.owner.profile.kycProvider}</p>
                                    </div>
                                )}
                            </div>
                            {property.owner.kycDocuments && property.owner.kycDocuments.length > 0 && (
                                <div className="pt-3 border-t border-zinc-200">
                                    <p className="text-xs text-zinc-500 mb-2">KYC Documents</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {property.owner.kycDocuments.map((doc: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-zinc-100">
                                                <div>
                                                    <p className="text-xs font-medium text-zinc-800 capitalize">{doc.documentType?.replace(/_/g, ' ')?.toLowerCase()}</p>
                                                    <VerificationBadge status={doc.status} />
                                                </div>
                                                <a href={doc.documentUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">View</a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-4 sm:p-5 bg-background/70 rounded-xl">
                            <p className="text-sm text-zinc-400 italic">No KYC information available</p>
                        </div>
                    )}
                </section>

                {/* Property Documents */}
                <section className='w-full px-4 sm:px-6 md:px-8 lg:px-10 pb-4 sm:pb-5'>
                    <p className="text-sm sm:text-base font-medium text-zinc-900 mb-2">Property Documents</p>
                    {property?.documents && property.documents.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {property.documents.map((doc: any, index: number) => (
                                <div key={index} className="p-4 bg-background/70 rounded-xl border border-zinc-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-zinc-800 capitalize">{doc.documentType?.replace(/_/g, ' ')?.toLowerCase()}</p>
                                        <div className="mt-1">
                                            <VerificationBadge status={doc.status} />
                                        </div>
                                        {doc.rejectionReason && (
                                            <p className="text-xs text-red-500 mt-1">{doc.rejectionReason}</p>
                                        )}
                                    </div>
                                    <a href={doc.documentUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline shrink-0 ml-3">View</a>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 sm:p-5 bg-background/70 rounded-xl">
                            <p className="text-sm text-zinc-400 italic">No documents uploaded</p>
                        </div>
                    )}
                </section>

                {/* Feedback Section */}
                <section className='w-full px-4 sm:px-6 md:px-8 lg:px-10 pb-4 sm:pb-5'>
                    <p className="text-sm sm:text-base font-medium text-zinc-900 mb-2">
                        {user?.id === property?.agent?.id ? 'Your' : 'Agent'} feedback
                    </p>
                    {
                        !editMode ?
                            <div className='p-4 sm:p-5 md:p-6 bg-background/70 min-h-[10rem] sm:min-h-[12rem] w-full rounded-xl'>
                                <p className="text-sm sm:text-base">
                                    {verification?.feedback ??
                                        <em className='text-zinc-400'>No comments yet</em>
                                    }
                                </p>
                            </div>
                            :
                            <div className="relative mt-2">
                                <span className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 text-xs sm:text-sm text-zinc-400">{`${formik.values.feedback.length}/500`}</span>
                                <textarea
                                    id="description"
                                    maxLength={500}
                                    rows={6}
                                    placeholder={'Enter your feedback about this property...'}
                                    value={formik.values.feedback}
                                    onChange={e => formik.setFieldValue('feedback', e.target.value)}
                                    className="w-full border border-zinc-300 bg-background/70 rounded-xl p-3 sm:p-4 text-sm sm:text-base focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                />
                            </div>
                    }
                </section>

                {/* Override Checks */}
                {(user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN) && verification?.status === PropertyVerificationStatus.PENDING && !editMode && (
                    <section className='w-full px-4 sm:px-6 md:px-8 lg:px-10'>
                        <div className='p-3 bg-amber-50 rounded-lg border border-amber-100'>
                            <p className='text-sm font-medium text-amber-800 mb-2'>Override Checks</p>
                            <label className='flex items-center gap-2 mb-2 cursor-pointer'>
                                <input
                                    type='checkbox'
                                    checked={skipKycCheck}
                                    onChange={(e) => setSkipKycCheck(e.target.checked)}
                                    className='w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500'
                                />
                                <span className='text-sm text-amber-700'>Skip owner KYC verification check</span>
                            </label>
                            <label className='flex items-center gap-2 cursor-pointer'>
                                <input
                                    type='checkbox'
                                    checked={skipDocumentCheck}
                                    onChange={(e) => setSkipDocumentCheck(e.target.checked)}
                                    className='w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500'
                                />
                                <span className='text-sm text-amber-700'>Skip document verification check</span>
                            </label>
                        </div>
                    </section>
                )}

                {/* Action Buttons */}
                <section className='my-6 sm:my-8 w-full px-4 sm:px-6 md:px-8 lg:px-10 pb-4 sm:pb-6'>
                    <div className='w-full flex justify-between items-center'>
                        <div className='flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 items-center w-full'>
                            {
                                !editMode && verification?.status !== PropertyVerificationStatus.REJECTED &&
                                <button
                                    type='button'
                                    disabled={verificationLoading || verificationUdateLoading}
                                    onClick={() => handleRejection()}
                                    className="w-full sm:w-auto bg-red-600 text-white hover:bg-red-700 rounded-lg px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base font-medium disabled:opacity-75 disabled:hover:bg-red-600 disabled:cursor-not-allowed transition-colors"
                                >
                                    Reject
                                </button>
                            }
                            {
                                editMode ?
                                    <div className='w-full flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 items-center'>
                                        <button
                                            type='button'
                                            onClick={() => setEditMode(false)}
                                            className="w-full sm:w-auto text-center cursor-pointer rounded-lg px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base font-medium text-white bg-zinc-500 hover:bg-zinc-600 disabled:hover:bg-zinc-500 disabled:opacity-75 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type='button'
                                            onClick={() => formik.handleSubmit()}
                                            disabled={verificationLoading || verificationUdateLoading}
                                            className="w-full sm:w-auto border border-primary bg-transparent text-primary/90 hover:text-white hover:bg-primary/90 rounded-lg px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base font-medium disabled:hover:bg-transparent disabled:hover:text-primary/90 disabled:opacity-75 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Save
                                        </button>
                                    </div>
                                    : !property?.isVerified &&
                                    <div className='w-full flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 items-center'>
                                        {
                                            verification?.status === PropertyVerificationStatus.PENDING && user?.role === UserRole.AGENT &&
                                            <button
                                                type='button'
                                                disabled={verificationLoading || verificationUdateLoading}
                                                onClick={() => setEditMode(true)}
                                                className="w-full sm:w-auto text-center cursor-pointer rounded-lg px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base font-medium text-white bg-zinc-500 hover:bg-zinc-600 disabled:hover:bg-zinc-500 disabled:opacity-75 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Edit
                                            </button>
                                        }

                                        {
                                            verification?.status === PropertyVerificationStatus.PENDING && (user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN) &&
                                            <button
                                                type='button'
                                                disabled={verificationLoading || verificationUdateLoading}
                                                onClick={() => handleApproval(`${selectedAgent?.profile?.firstName ?? selectedAgent?.firstName ?? ''} ${selectedAgent?.profile?.lastName ?? selectedAgent?.lastName ?? ''}`)}
                                                className="w-full sm:w-auto border border-primary bg-transparent text-primary/90 hover:text-white hover:bg-primary/90 rounded-lg px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base font-medium disabled:hover:bg-transparent disabled:hover:text-primary/90 disabled:opacity-75 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Approve
                                            </button>
                                        }

                                        {
                                            verification?.status === PropertyVerificationStatus.PENDING && user?.role === UserRole.AGENT &&
                                            <button
                                                type='button'
                                                disabled={verificationLoading || verificationUdateLoading}
                                                onClick={() => handleVerification()}
                                                className="w-full sm:w-auto border border-primary bg-transparent text-primary/90 hover:text-white hover:bg-primary/90 rounded-lg px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base font-medium disabled:hover:bg-transparent disabled:hover:text-primary/90 disabled:opacity-75 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Verify
                                            </button>
                                        }
                                    </div>
                            }
                        </div>
                    </div>
                </section>

                {/* Agent Assignment Modal */}
                <CustomModal
                    isOpen={showAgentSelection}
                    onClose={() => {
                        setShowAgentSelecteion(false)
                        setSelectedAgent(verificationData?.data?.data?.property?.agent)
                    }}
                    title="Assign agent to property"
                >
                    <div className="w-full p-2 sm:p-3">
                        {
                            !selectedAgent ?
                                <div className="relative my-3">
                                    <label htmlFor="city" className="text-sm sm:text-base font-medium text-zinc-700 mb-1 block">Search agents</label>
                                    <AdjustableFilterDropdown
                                        placeholder={`E.g. Abiola Graham`}
                                        options={agents?.map(el => el?.email)}
                                        handleSelection={(val) => handleAgentSelection(val)}
                                        searchTerm={agentSearchTerm}
                                        setSearchTerm={setAgentSearchTerm}
                                        isLoading={agentsLoading}
                                    />
                                </div>
                                :
                                <div>
                                    <div className="my-4 sm:my-6">
                                        <div className="flex gap-3 sm:gap-4 items-center rounded-xl mt-2 p-3 bg-background/50">
                                            <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-white shadow-md">
                                                <Image
                                                    alt="agent-image"
                                                    src={(selectedAgent?.profile?.profileImage || selectedAgent?.profile?.profile_image) ?? '/png/sample_profile.png'}
                                                    fill
                                                    sizes="48px"
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm sm:text-base font-medium text-zinc-900 truncate">
                                                    {selectedAgent?.profile?.firstName ? `${selectedAgent?.profile?.firstName} ${selectedAgent?.profile?.lastName}` : (selectedAgent?.firstName ? `${selectedAgent?.firstName} ${selectedAgent?.lastName}` : (selectedAgent?.email || '--/--'))}
                                                </p>
                                                <p className="text-xs sm:text-sm text-zinc-500 truncate">{`${selectedAgent?.email}`}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm sm:text-base text-zinc-700 font-normal my-3 sm:my-4">
                                        You're about to {selectedAgent?.id === verificationData?.data?.data?.property?.assignedAgent ? 're-assign' : 'assign'} <strong className="text-zinc-900">{selectedAgent?.profile?.firstName ? `${selectedAgent?.profile?.firstName} ${selectedAgent?.profile?.lastName}` : (selectedAgent?.firstName ? `${selectedAgent?.firstName} ${selectedAgent?.lastName}` : (selectedAgent?.email || 'this agent'))}</strong> to this property.
                                    </p>
                                    <p className="text-sm sm:text-base font-medium text-zinc-900 mb-4">
                                        Are you sure?
                                    </p>
                                    <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 mt-4 sm:mt-6 w-full">
                                        <button
                                            type='button'
                                            onClick={() => setSelectedAgent(null)}
                                            disabled={assignmentLoading}
                                            className="w-full sm:w-1/2 font-medium rounded-lg px-4 py-2 text-sm sm:text-base bg-zinc-600 text-white hover:bg-zinc-700 disabled:hover:bg-zinc-600 disabled:opacity-75 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Change
                                        </button>
                                        <button
                                            onClick={() => handleAgentAssignment(selectedAgent?.id)}
                                            disabled={assignmentLoading}
                                            type='button'
                                            className="w-full sm:w-1/2 rounded-lg px-4 py-2 text-sm sm:text-base font-medium bg-primary/90 text-white hover:bg-primary disabled:hover:bg-primary/90 disabled:opacity-75 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                                        >
                                            {assignmentLoading ? <Spinner /> : 'Assign'}
                                        </button>
                                    </div>
                                </div>
                        }
                    </div>
                </CustomModal>
            </div>
        </div>
    )
}