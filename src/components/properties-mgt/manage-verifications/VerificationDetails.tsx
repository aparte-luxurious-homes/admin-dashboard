'use client'

import Image from 'next/image';
import { useEffect, useState } from 'react';
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


export default function VerificationDetails({
    propertyId,
    verificationId
}: {
    propertyId: number,
    verificationId: number
}){
    const dispatch = useDispatch();
    const  { user } = useAuth();
    const { mutate: assignAgent, isPending: assignmentLoading } = AssignToProperty(propertyId)
    const  { mutate: updateVerification, isPending: verificationUdateLoading } = UpdatePropertyVerification()
    const { data: verificationData, isLoading: verificationLoading } = GetPropertyVerification(verificationId, user?.role || '')
    const [verification, setVerification] = useState<IPropertyVerification | null>(null);
    const [property, setProperty] = useState<IProperty | null>(null);
    const [editMode, setEditMode] = useState<boolean>(false)
    const [agentSearchTerm, setAgentSearchTerm] = useState<string>('')


    const { data: agentsList, isLoading: agentsLoading } = GetAllUsers(1, 12, agentSearchTerm, UserRole.AGENT);
    const [agents, setAgents] = useState<IUser[]>(agentsList?.data?.data?.data)
    const [selectedAgent, setSelectedAgent] = useState<IUser|null>(null)
    const [showAgentSelection, setShowAgentSelecteion] = useState(false);


    const formik = 
        useFormik({
            initialValues: {
                feedback: verification?.feedback??``
            },
            onSubmit: async () => {
                updateVerification(
                    {
                        propertyId,
                        payload: {
                            feedback: formik.values.feedback,
                            status: verification?.status??PropertyVerificationStatus.PENDING,
                        }
                    },
                    {
                        onSuccess: () =>{ 
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
                description: "This will verify delete the property.",
                confirmText: "Verify",
                cancelText: "Cancel",
                onConfirm: () => updateVerification(
                    {
                        propertyId,
                        payload: {
                            feedback: formik.values.feedback,
                            status: PropertyVerificationStatus.VERIFIED
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
                            status: PropertyVerificationStatus.VERIFIED
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
                        onError: () => 
                            toast.error('Something went wrong', {
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
            if (el?.email === email ) return el;
        })
        setSelectedAgent(filteredUsers[0])
    }


    const handleAgentAssignment = (agentId: number) => {
        assignAgent(
            { 
                payload: { agent_id: agentId }
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
                onError: (error: any) =>{
                    toast.error(error.status === 409 ? 'Agent already assigned with pending verification' : 'Something went wrong', {
                        duration: 6000,
                        style: {
                            maxWidth: '500px',
                            width: 'max-content'
                        }
                    })}
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
    }, [verificationData, verificationId])
    
    return (
        <div className="p-10 w-full">
            <div className="w-full border border-zinc-500/20 bg-white rounded-xl min-h-[50vh]">
                <div className='p-10 w-full'>
                    <h4 className='text-zinc-800 text-2xl font-medium'>
                        Verification Details
                    </h4>
                </div>
                
                <section className="flex  justify-between gap-6 w-full px-10">
                    <div className={`${user?.role !== UserRole.AGENT ? 'w-[70%]' : 'w-full'} relative`}>
                        <Swiper
                            loop={true}
                            modules={[Navigation, Autoplay]}
                            spaceBetween={5}
                            slidesPerView={1}
                            navigation
                            autoplay
                            className="rewind"
                        >   
                            {
                                property?.media && property?.media.length > 0 ?
                                property?.media?.map((el: any, index: any) => (
                                    <SwiperSlide key={index}>
                                        <Image
                                            alt={`${property?.name}_img_${index}`}
                                            src={el.mediaUrl}
                                            className="w-full rounded-xl"
                                            width={900}
                                            height={900}
                                        />
                                    </SwiperSlide>
                                ))
                                :
                                <SwiperSlide>
                                    <Image
                                        alt={`img_`}
                                        src={`/png/sample_properties.png`}
                                        className="w-full rounded-xl"
                                        width={900}
                                        height={900}
                                    />
                                </SwiperSlide>
                                
                            }
                        </Swiper>
                    </div>
                    {
                        user?.role !== UserRole.AGENT &&
                        <div className='w-full flex flex-col gap-y-3'>
                            <div className='size-full flex flex-col justify-center items-center bg-background rounded-xl'>
                                <p className='text-base text-zinc-800 font-medium text-center mb-1'>
                                    Assigned agent
                                </p>
                                <Image 
                                    alt={`owner_img`}
                                    src={selectedAgent?.profile?.profileImage??`/png/sample_owner.png`}
                                    className="w-full max-w-[10rem] rounded-xl my-3"
                                    width={400}
                                    height={400}
                                />
                                <p className='text-base text-zinc-800 font-medium text-center mb-1'>
                                    {`${selectedAgent?.profile?.firstName??`--/--`} ${selectedAgent?.profile?.lastName??`--/--`}`}
                                </p>
                                <p className='text-sm text-zinc-800 font-medium text-center'>
                                    {selectedAgent?.email??'--/--'}
                                </p>
                            </div>
                            
                            <div className='flex justify-between items-center gap-5 w-full'>
                                <button type='button'  className="w-full text-center cursor-pointer rounded-lg px-5 py-2.5 text-lg font-medium text-white bg-zinc-500 hover:bg-zinc-600 disabled:hover:bg-zinc-500 disabled:opacity-75 disabled:cursor-not-allowed">
                                    View Agent 
                                </button>
                                {
                                    verification?.status !==  PropertyVerificationStatus.PENDING && user?.role !== UserRole.OWNER &&
                                    <button 
                                        type='button' 
                                        onClick={() => {
                                            setShowAgentSelecteion(true);
                                        }} 
                                        className="text-center w-full cursor-pointer bg-primary/90 rounded-lg px-5 py-2.5 text-lg font-medium text-white hover:bg-primary disabled:hover:bg-primary/90 disabled:opacity-75 disabled:cursor-not-allowed"
                                    >
                                        Re-assign
                                    </button>
                                }
                            </div>
                        </div>
                    }
                </section>

                <section className='w-full pt-10 px-10 pb-5'>
                    <div className='w-full flex justify-between'>
                        <div className='w-full flex flex-col'>
                            <h3 className="text-3xl font-normal text-zinc-800">
                                {property?.name}
                            </h3>
                            <div className="flex gap-2 items-center mt-2 text-xl text-zinc-600">
                                <IoLocationOutline />
                                <p className="text-base">
                                    {property?.address}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className='px-10 pb-8'>
                    <div className="w-full flex items-center gap-10 mx-0">
                        <div className="flex items-center">
                            <p className="text-zinc-500 text-base">PropertyID:</p>
                            <p className="text-zinc-900 text-base ml-3">
                                APRT25-{property?.id}
                            </p>
                        </div>
                        <div className="flex items-center">
                            <p className="text-zinc-500 text-sm">Status:</p>
                            <VerificationBadge status={verification?.status??PropertyVerificationStatus.REJECTED} classNames="ml-2" />
                        </div>
                        <div className="flex items-center">
                            <CalendarIcon color="#a6a4a4"/>
                            <p className="text-zinc-900 text-sm ml-2">{verification?.verificationDate ? formatDate(verification?.verificationDate) : '--/--'}</p>
                        </div>
                        <div className="flex items-center">
                            <p className="text-zinc-500 text-base">Property Type</p>
                            <p className="text-zinc-900 text-base ml-3">
                                {property?.propertyType}
                            </p>
                        </div>
                        <div className="flex items-center">
                            <p className="text-zinc-500 text-base">Owner</p>
                            <p className="text-teal-800 text-base ml-3 cursor-pointer hover:underline">
                                {`${property?.owner?.profile?.firstName??'--/--'} ${property?.owner?.profile?.lastName??'--/--'}`}
                            </p>
                        </div>
                    </div>
                    <div className="my-5">
                        <div className="w-full flex gap-3">
                            {
                                property?.amenities &&
                                property?.amenities.map((el, index) => 
                                    <div key={index} className="w-fit flex items-center justify-center px-5 py-2  bg-zinc-200 rounded-lg text-[14px]">
                                        {el.name}
                                    </div>
                                )
                            }
                        </div>
                    </div>
                </section>

                <section className='w-full  px-10 pb-5 '>
                    <p className="text-lg zinc-900 font-medium my-1 pl-1">KYC Details</p>
                    <p className="text-lg font-medium text-zinc-900 pl-2">
                        <em className="text-zinc-400 font-normal">Coming soon...</em>
                    </p>
                </section>

                <section className='w-full  px-10 pb-5'>
                    <p className="text-lg zinc-900 font-medium my-1 pl-1">{user?.id === property?.agent?.id ? 'Your' : 'Agent'} feedback</p>
                    {
                        !editMode ? 
                        <div className='p-6 bg-background/70 min-h-[14rem] w-full rounded-xl'>
                            <p>
                                {
                                    verification?.feedback??
                                    <em className='text-lg text-zinc-400'>No comments yet</em>
                                }
                            </p>
                        </div>
                        :
                        <div className="relative mt-2">
                            <span className="absolute bottom-3 right-3 text-base font-normal">{`${formik.values.feedback.length}/1000`}</span>
                            <textarea
                                id="description"
                                maxLength={300}
                                rows={6}
                                placeholder={'Unique attractive details about your property...'}
                                value={formik.values.feedback}
                                onChange={e => formik.setFieldValue('feedback', e.target.value)}
                                className="size-full border border-zinc-400 bg-background/70 rounded-xl p-6 text-lg"
                            />
                        </div>
                    }
                </section>
                <section className='my-10 w-full px-10'>
                    <div className='w-full flex justify-between items-center'>
                        <div className='flex justify-between gap-4 items-center w-full'>
                            {
                                !editMode && verification?.status !== PropertyVerificationStatus.REJECTED &&
                                <button 
                                    type='button' 
                                    disabled={verificationLoading || verificationUdateLoading} 
                                    onClick={() => handleRejection()} 
                                    className="bg-red-600 text-white hover:bg-red-700 rounded-lg px-5 py-2.5  text-lg font-medium disabled:opacity-75 disabled:hover:bg-red-600 disabled:cursor-not-allowed"
                                >
                                    Reject 
                                </button>
                            }
                            {
                                editMode ?
                                <div className='w-full justify-end flex gap-4 items-center'>
                                    <button 
                                        type='button' 
                                        onClick={() => setEditMode(false)} 
                                        className="text-center cursor-pointer rounded-lg px-5 py-2.5 text-lg font-medium text-white bg-zinc-500 hover:bg-zinc-600 disabled:hover:bg-zinc-500 disabled:opacity-75 disabled:cursor-not-allowed"
                                    >
                                        Cancel 
                                    </button>
                                    {/* pending | rejected ? */}
                                    <button 
                                        type='button'  
                                        onClick={() => formik.handleSubmit()}
                                        disabled={verificationLoading || verificationUdateLoading} 
                                        className="border border-primary bg-transparent text-primary/90 hover:text-white hover:bg-primary/90 rounded-lg px-5 py-2.5  text-lg font-medium disabled:hover:bg-transparent disabled:hover:text-primary/90 disabled:opacity-75 disabled:cursor-not-allowed"
                                    >
                                        Save 
                                    </button>
                                </div> 
                                : !property?.isVerified &&
                                <div className=' w-ful justify-end flex gap-4 items-center'>
                                    {
                                        verification?.status === PropertyVerificationStatus.PENDING && user?.role === UserRole.AGENT &&
                                        <button 
                                            type='button' 
                                            disabled={verificationLoading || verificationUdateLoading} 
                                            onClick={() => setEditMode(true)} 
                                            className="text-center cursor-pointer rounded-lg px-5 py-2.5 text-lg font-medium text-white bg-zinc-500 hover:bg-zinc-600 disabled:hover:bg-zinc-500 disabled:opacity-75 disabled:cursor-not-allowed"
                                        >
                                            Edit 
                                        </button>
                                    }

                                    {
                                        verification?.status === PropertyVerificationStatus.PENDING && user?.role === UserRole.ADMIN &&
                                        <button 
                                            type='button'
                                            disabled={verificationLoading || verificationUdateLoading} 
                                            onClick={() => handleApproval(`${selectedAgent?.profile?.firstName} ${selectedAgent?.profile?.lastName}`)} 
                                            className="border border-primary bg-transparent text-primary/90 hover:text-white hover:bg-primary/90 rounded-lg px-5 py-2.5  text-lg font-medium disabled:hover:bg-transparent disabled:hover:text-primary/90  disabled:opacity-75 disabled:cursor-not-allowed"
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
                                            className="border border-primary bg-transparent text-primary/90 hover:text-white hover:bg-primary/90 rounded-lg px-5 py-2.5  text-lg font-medium disabled:hover:bg-transparent disabled:hover:text-primary/90  disabled:opacity-75 disabled:cursor-not-allowed"
                                        >
                                            Verify
                                        </button>
                                    }
                                </div> 
                            }
                        </div>
                    </div>
                </section>


                <CustomModal 
                    isOpen={showAgentSelection}
                    onClose={() => {
                        setShowAgentSelecteion(false)
                        setSelectedAgent(verificationData?.data?.data?.property?.agent)
                    }}
                    title="Assign agent to property"
                >
                    <div className="w-full">
                        {
                            !selectedAgent ?
                            <div className="relative my-3">
                                <label htmlFor="city" className="text-lg zinc-900 font-normal">Search agents</label>
                                <AdjustableFilterDropdown
                                    placeholder={`E.g. Abiola Graham`} 
                                    options={agents?.map(el => el?.email)}
                                    handleSelection={
                                        (val) => handleAgentSelection(val)
                                    }
                                    searchTerm={agentSearchTerm}
                                    setSearchTerm={setAgentSearchTerm}
                                    isLoading={agentsLoading}
                                />
                            </div>
                            :
                            <div>
                                <div className="my-8">
                                    <div className="flex gap-4 items-center rounded-full mt-3">
                                        <Image 
                                            alt="agent-image"
                                            src={selectedAgent?.profile?.profileImage??'/png/sample_profile.png'}
                                            height={50}
                                            width={60}
                                        />
                                        <div>
                                            <p className="text-lg text-zinc-900 m-0">{`${selectedAgent?.profile?.firstName??'Kunle'} ${selectedAgent?.profile?.lastName??'Aina'}`}</p>
                                            <p className="text-base text-zinc-500">{`${selectedAgent?.email}`}</p>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-base text-zinc-800 font-normal my-5">
                                    You're about to {selectedAgent?.id === verificationData?.data?.data?.property?.assignedAgent ? 're-assign' : 'assign' } {`${selectedAgent?.profile?.firstName??'James'} ${selectedAgent?.profile?.lastName??'Bond'}`} to this property. 
                                    <br />
                                    <strong>Are you sure?</strong>
                                </p>
                                <div className="flex justify-between items-center gap-5 mt-10 w-full">
                                    <button
                                        type='button' 
                                        onClick={() => {
                                            setSelectedAgent(null)
                                        }}
                                        disabled={assignmentLoading}
                                        className="font-medium rounded-lg px-5 py-2.5 text-lg bg-zinc-600 text-white hover:bg-zinc-700 disabled:hover:bg-zinc-600 disabled:opacity-75 disabled:cursor-not-allowed"
                                    >
                                        Change
                                    </button>
                                    <button 
                                        onClick={() => handleAgentAssignment(selectedAgent?.id)} 
                                        disabled={assignmentLoading} 
                                        type='button'
                                        className="rounded-lg px-5 py-2.5 text-lg font-medium bg-primary/90 text-white hover:bg-primary disabled:hover:bg-primary/90 disabled:opacity-75 disabled:cursor-not-allowed">
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