'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormik } from 'formik';
import { useRouter } from 'next/navigation';
import { useJsApiLoader } from '@react-google-maps/api';
import { Icon } from '@iconify/react';
import { FaArrowLeftLong } from 'react-icons/fa6';
import Link from 'next/link';
import toast from 'react-hot-toast';

import { useAuth } from '@/src/hooks/useAuth';
import { PAGE_ROUTES } from '@/src/lib/routes/page_routes';
import { fixedAmenities } from '@/src/data/amenities';
import { GetAmenities, CreateProperty, UploadPropertyMedia, UploadPropertyDocument } from '@/src/lib/request-handlers/propertyMgt';
import { CreatePropertyUnit, UploadPropertyUnitMedia } from '@/src/lib/request-handlers/unitMgt';
import Spinner from '@/components/ui/Spinner';
import CustomModal from '@/components/ui/CustomModal';
import { CreateAmenityForm } from '../all-properties/CreatePropertyView';

import { IAmenity, ICreateProperty, DocumentType, MediaType, PropertyType } from '../types';
import { WizardStep, PropertyFormValues, UnitFormValues, createEmptyUnit } from './types';
import ProgressBar from './ProgressBar';
import StepPropertyDetails from './StepPropertyDetails';
import StepUnits from './StepUnits';
import StepMediaDocs from './StepMediaDocs';
import UnitDrawer from './UnitDrawer';

const libraries: any = ['places'];

export default function CreatePropertyWizard() {
    const { user } = useAuth();
    const router = useRouter();

    // --- Step state ---
    const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.PROPERTY_DETAILS);
    const [highestStep, setHighestStep] = useState<WizardStep>(WizardStep.PROPERTY_DETAILS);

    // --- API mutations ---
    const { mutate: createProperty, isPending: isCreatingProperty } = CreateProperty();
    const { data: fetchedAmenities } = GetAmenities();
    const { mutate: uploadMedia } = UploadPropertyMedia();
    const { mutate: uploadDoc } = UploadPropertyDocument();
    const { mutate: createUnits } = CreatePropertyUnit();
    const { mutate: uploadUnitMedia } = UploadPropertyUnitMedia();

    // --- Amenities ---
    const [availableAmenities, setAvailableAmenities] = useState<IAmenity[]>(fixedAmenities);
    useEffect(() => {
        setAvailableAmenities(fetchedAmenities?.data?.data ?? fixedAmenities);
    }, [fetchedAmenities]);

    // --- Units state ---
    const [units, setUnits] = useState<UnitFormValues[]>([]);
    const [unitMediaMap, setUnitMediaMap] = useState<Record<string, File[]>>({});
    const unitUploadRefs = useRef<Record<string, { url: string; file: File }[]>>({});

    // --- Unit drawer ---
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingUnitIndex, setEditingUnitIndex] = useState<number | null>(null);
    const [showAmenityForm, setShowAmenityForm] = useState(false);

    // --- Property media/docs ---
    const [uploadedMedia, setUploadedMedia] = useState<File[]>([]);
    const uploadRef = useRef<{ url: string; file: File }[]>([]);
    const [docFiles, setDocFiles] = useState<{ file: File; type: DocumentType }[]>([]);

    // --- Google Maps ---
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries,
    });

    // --- Formik (property fields only) ---
    const formik = useFormik<PropertyFormValues>({
        initialValues: {
            name: '',
            address: '',
            property_type: PropertyType.DUPLEX,
            country: 'Nigeria',
            state: 'Lagos',
            city: 'Ikeja',
            description: '',
            latitude: null,
            longitude: null,
            ownerId: 0,
            owner_name: '',
            owner_email: '',
            is_pet_allowed: false,
            amenities: [],
            amenityIds: [],
        },
        onSubmit: () => handleFinalSubmit(),
    });

    // --- Sort amenities helper ---
    const sortAmenities = (amenities: IAmenity[] = [], selectedNames: string[] = []): number[] => {
        const sorted: number[] = [];
        const safeAmenities = Array.isArray(amenities) ? amenities : [];
        const safeNames = Array.isArray(selectedNames) ? selectedNames : [];
        const nameList = safeAmenities.map(a => a.name);
        for (const name of safeNames) {
            const pos = nameList.indexOf(name);
            if (pos !== -1) sorted.push(safeAmenities[pos].id);
        }
        return sorted;
    };

    // --- Step validation ---
    const validateStep = (step: WizardStep): boolean => {
        if (step === WizardStep.PROPERTY_DETAILS) {
            const { name, address, property_type, city, state, country } = formik.values;
            if (!name.trim()) { toast.error('Property name is required'); return false; }
            if (!address.trim()) { toast.error('Address is required'); return false; }
            if (!property_type) { toast.error('Property type is required'); return false; }
            if (!city.trim()) { toast.error('City is required'); return false; }
            if (!state.trim()) { toast.error('State is required'); return false; }
            if (!country.trim()) { toast.error('Country is required'); return false; }
            return true;
        }
        if (step === WizardStep.UNITS) {
            // Units are optional
            return true;
        }
        if (step === WizardStep.MEDIA_DOCS) {
            if (uploadedMedia.length < 3) {
                toast.error('Please upload at least 3 property images');
                return false;
            }
            return true;
        }
        return true;
    };

    const goToStep = (step: WizardStep) => {
        // Can go back freely, but going forward requires validation
        if (step > currentStep) {
            if (!validateStep(currentStep)) return;
        }
        setCurrentStep(step);
        if (step > highestStep) setHighestStep(step);
    };

    const handleNext = () => {
        if (currentStep < WizardStep.MEDIA_DOCS) {
            goToStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > WizardStep.PROPERTY_DETAILS) {
            setCurrentStep(currentStep - 1);
        }
    };

    // --- Unit drawer handlers ---
    const handleAddUnit = () => {
        setEditingUnitIndex(null);
        setDrawerOpen(true);
    };

    const handleEditUnit = (index: number) => {
        setEditingUnitIndex(index);
        setDrawerOpen(true);
    };

    const handleDeleteUnit = (index: number) => {
        const unit = units[index];
        // Clean up media state
        setUnitMediaMap(prev => {
            const next = { ...prev };
            delete next[unit._key];
            return next;
        });
        delete unitUploadRefs.current[unit._key];
        setUnits(prev => prev.filter((_, i) => i !== index));
    };

    const handleSaveUnit = (unit: UnitFormValues) => {
        if (editingUnitIndex !== null) {
            // Editing existing — preserve the _key
            setUnits(prev => prev.map((u, i) => (i === editingUnitIndex ? { ...unit, _key: prev[editingUnitIndex]._key } : u)));
        } else {
            // Adding new
            setUnits(prev => [...prev, unit]);
        }
        setDrawerOpen(false);
        setEditingUnitIndex(null);
    };

    // --- Final submit ---
    const handleFinalSubmit = () => {
        if (!validateStep(WizardStep.MEDIA_DOCS)) return;

        const sortedAmenities = sortAmenities(availableAmenities, formik.values.amenities);
        const payload: ICreateProperty = {
            ...formik.values,
            amenities: sortedAmenities,
        };

        createProperty(
            { payload },
            {
                onSuccess: (response) => {
                    const propertyId = response?.data?.data?.id;
                    if (!propertyId) {
                        toast.error('Property created but no ID returned');
                        return;
                    }

                    // Upload property media
                    if (uploadedMedia.length > 0) {
                        const imageFiles = uploadedMedia.filter(f => !f.type.startsWith('video/'));
                        const videoFiles = uploadedMedia.filter(f => f.type.startsWith('video/'));

                        const uploadBatch = (files: File[], mediaType: string) => {
                            const batchFormData = new FormData();
                            files.forEach(file => batchFormData.append('media_file', file));
                            batchFormData.append('media_type', mediaType);
                            batchFormData.append('is_featured', 'true');
                            uploadMedia(
                                { propertyId, payload: batchFormData },
                                {
                                    onError: (error: any) =>
                                        toast.error(error.status === 422 ? 'Invalid media file format' : 'Media upload failed'),
                                },
                            );
                        };
                        if (imageFiles.length > 0) uploadBatch(imageFiles, MediaType.IMAGE);
                        if (videoFiles.length > 0) uploadBatch(videoFiles, MediaType.VIDEO);
                    }

                    // Upload documents
                    if (docFiles.length > 0) {
                        docFiles.forEach(({ file, type }) => {
                            const docFormData = new FormData();
                            docFormData.append('document_file', file);
                            docFormData.append('document_type', type);
                            uploadDoc(
                                { propertyId, payload: docFormData },
                                { onError: () => toast.error('Document upload failed') },
                            );
                        });
                    }

                    // Create units
                    if (units.length > 0) {
                        const unitsPayload = units.map(unit => ({
                            name: unit.name,
                            description: unit.description,
                            price_per_night: String(unit.price_per_night),
                            caution_fee: String(unit.caution_fee),
                            max_guests: unit.max_guests,
                            count: unit.count,
                            is_whole_property: unit.is_whole_property,
                            bedroom_count: unit.bedroom_count,
                            living_room_count: unit.living_room_count,
                            kitchen_count: unit.kitchen_count,
                            bathroom_count: unit.bathroom_count,
                            amenities: sortAmenities(availableAmenities, unit.amenityNames),
                        }));

                        createUnits(
                            { propertyId: String(propertyId), payload: unitsPayload },
                            {
                                onSuccess: (unitResponse) => {
                                    const createdUnits = unitResponse?.data?.data ?? [];
                                    // Upload unit media
                                    createdUnits.forEach((createdUnit: any, index: number) => {
                                        const unitKey = units[index]?._key;
                                        const files = unitMediaMap[unitKey];
                                        if (files?.length > 0) {
                                            const imageFiles = files.filter(f => !f.type.startsWith('video/'));
                                            const videoFiles = files.filter(f => f.type.startsWith('video/'));

                                            const uploadUnitBatch = (batchFiles: File[], mediaType: string) => {
                                                const fd = new FormData();
                                                batchFiles.forEach(f => fd.append('media_file', f));
                                                fd.append('media_type', mediaType);
                                                fd.append('is_featured', 'true');
                                                uploadUnitMedia(
                                                    { propertyId: String(propertyId), unitId: createdUnit.id, payload: fd },
                                                    { onError: () => toast.error(`Failed to upload media for ${units[index]?.name || 'unit'}`) },
                                                );
                                            };
                                            if (imageFiles.length > 0) uploadUnitBatch(imageFiles, MediaType.IMAGE);
                                            if (videoFiles.length > 0) uploadUnitBatch(videoFiles, MediaType.VIDEO);
                                        }
                                    });
                                },
                                onError: () => {
                                    toast.error('Units could not be created. You can add them from the property details page.', {
                                        duration: 6000,
                                    });
                                },
                            },
                        );
                    }

                    toast.success('Property created successfully!', { duration: 4000 });
                    router.push(PAGE_ROUTES.dashboard.propertyManagement.allProperties.details(propertyId));
                },
                onError: (error: any) => {
                    toast.error(
                        error?.response?.data?.detail || error?.response?.data?.message || 'Failed to create property',
                        { duration: 6000 },
                    );
                },
            },
        );
    };

    const isSubmitting = isCreatingProperty;

    return (
        <div className="min-h-screen bg-zinc-50">
            {/* Header */}
            <div className="bg-white border-b border-zinc-200 sticky top-0 z-30">
                <div className="max-w-4xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Link
                                href={PAGE_ROUTES.dashboard.propertyManagement.allProperties.base}
                                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                            >
                                <FaArrowLeftLong className="text-[10px]" />
                                <span>Back to Properties</span>
                            </Link>
                            <div className="h-4 w-px bg-zinc-200" />
                            <h1 className="text-sm font-bold text-zinc-900">List New Property</h1>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                            <span className="font-medium">Step {currentStep + 1} of 3</span>
                        </div>
                    </div>

                    <ProgressBar
                        currentStep={currentStep}
                        highestStep={highestStep}
                        onStepClick={goToStep}
                    />
                </div>
            </div>

            {/* Amenity modal (shared between property step and unit drawer) */}
            {showAmenityForm && (
                <CustomModal title="Create Amenity" onClose={() => setShowAmenityForm(false)} isOpen={showAmenityForm}>
                    <CreateAmenityForm show={setShowAmenityForm} />
                </CustomModal>
            )}

            {/* Unit Drawer */}
            <UnitDrawer
                isOpen={drawerOpen}
                onClose={() => { setDrawerOpen(false); setEditingUnitIndex(null); }}
                onSave={handleSaveUnit}
                editingUnit={editingUnitIndex !== null ? units[editingUnitIndex] : null}
                availableAmenities={availableAmenities}
                showAmenityForm={() => setShowAmenityForm(true)}
                userRole={user?.role}
            />

            {/* Step Content */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                {currentStep === WizardStep.PROPERTY_DETAILS && (
                    <StepPropertyDetails
                        formik={formik}
                        availableAmenities={availableAmenities}
                        userRole={user?.role}
                        isLoaded={isLoaded}
                    />
                )}

                {currentStep === WizardStep.UNITS && (
                    <StepUnits
                        units={units}
                        onAddUnit={handleAddUnit}
                        onEditUnit={handleEditUnit}
                        onDeleteUnit={handleDeleteUnit}
                    />
                )}

                {currentStep === WizardStep.MEDIA_DOCS && (
                    <StepMediaDocs
                        uploadedMedia={uploadedMedia}
                        setUploadedMedia={setUploadedMedia}
                        uploadRef={uploadRef}
                        docFiles={docFiles}
                        setDocFiles={setDocFiles}
                        units={units}
                        unitMediaMap={unitMediaMap}
                        setUnitMediaMap={setUnitMediaMap}
                        unitUploadRefs={unitUploadRefs}
                    />
                )}

                {/* Navigation buttons */}
                <div className="max-w-3xl mx-auto mt-8 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={handleBack}
                        disabled={currentStep === WizardStep.PROPERTY_DETAILS}
                        className="h-11 px-6 border border-zinc-200 text-zinc-600 text-xs font-semibold rounded-xl hover:bg-zinc-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Icon icon="solar:arrow-left-bold" className="text-sm" />
                        Back
                    </button>

                    {currentStep < WizardStep.MEDIA_DOCS ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="h-11 px-8 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2"
                        >
                            Next
                            <Icon icon="solar:arrow-right-bold" className="text-sm" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleFinalSubmit}
                            disabled={isSubmitting}
                            className="h-11 px-8 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <Spinner />
                            ) : (
                                <>
                                    <Icon icon="solar:check-read-bold" className="text-sm" />
                                    Create Property
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
