'use client';

import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { FaArrowLeftLong } from 'react-icons/fa6';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useJsApiLoader } from '@react-google-maps/api';
import { useAuth } from '@/src/hooks/useAuth';
import { PAGE_ROUTES } from '@/src/lib/routes/page_routes';
import { fixedAmenities } from '@/src/data/amenities';
import {
    GetAmenities,
    CreateProperty,
    UploadPropertyMedia,
    UploadPropertyDocument,
} from '@/src/lib/request-handlers/propertyMgt';
import { CreatePropertyUnit, UploadPropertyUnitMedia } from '@/src/lib/request-handlers/unitMgt';
import Spinner from '@/components/ui/Spinner';
import CustomModal from '@/components/ui/CustomModal';
import { CreateAmenityForm } from '../all-properties/CreatePropertyView';
import ProgressBar from './ProgressBar';
import StepPropertyDetails from './StepPropertyDetails';
import StepUnits from './StepUnits';
import StepMediaDocs from './StepMediaDocs';
import UnitDrawer from './UnitDrawer';
import IncompleteProfileDialog from '@/src/components/shared/IncompleteProfileDialog';
import {
    IAmenity,
    ICreateProperty,
    DocumentType,
    MediaType,
    PropertyType,
} from '../types';
import {
    WizardStep,
    PropertyFormValues,
    UnitFormValues,
    createEmptyUnit,
    CategorizedMedia,
    PropertyMediaCategory,
} from './types';
import { validatePropertyName } from './nameValidator';

const libraries: any = ['places'];

export default function CreatePropertyWizard() {
    const { user } = useAuth();
    const router = useRouter();

    // Step state
    const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.PROPERTY_DETAILS);
    const [highestStep, setHighestStep] = useState<WizardStep>(WizardStep.PROPERTY_DETAILS);

    // Unit state
    const [units, setUnits] = useState<UnitFormValues[]>([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingUnitIndex, setEditingUnitIndex] = useState<number | null>(null);

    // Amenity state
    const [showAmenityForm, setShowAmenityForm] = useState(false);

    // PROFILE_INCOMPLETE dialog state — surfaced when the backend rejects
    // POST /properties because the operator's profile lacks host-required fields.
    const [incompleteFields, setIncompleteFields] = useState<string[] | null>(null);

    // Media state — files grouped by PropertyMediaCategory. Each non-empty
    // category is uploaded in its own POST so the server can persist the tag.
    const [propertyMedia, setPropertyMedia] = useState<CategorizedMedia>({});
    const [unitMediaByCategory, setUnitMediaByCategory] = useState<Record<string, CategorizedMedia>>({});
    const [docFiles, setDocFiles] = useState<{ file: File; type: DocumentType }[]>([]);

    // Amenities
    const { data: fetchedAmenities } = GetAmenities();
    const [availableAmenities, setAvailableAmenities] = useState<IAmenity[]>(fixedAmenities);

    useEffect(() => {
        setAvailableAmenities(fetchedAmenities?.data?.data ?? fixedAmenities);
    }, [fetchedAmenities]);

    // API mutations
    const { mutate: createProperty, isPending: isCreating } = CreateProperty();
    const { mutate: uploadMedia } = UploadPropertyMedia();
    const { mutate: uploadDoc } = UploadPropertyDocument();
    const { mutate: createUnits } = CreatePropertyUnit();
    const { mutate: uploadUnitMedia } = UploadPropertyUnitMedia();

    // Google Maps
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries,
    });

    if (loadError) {
        console.error('Google Maps load error:', loadError);
    }

    // Amenity ID resolver
    const sortAmenities = (amenities: IAmenity[] = [], selectedNames: string[] = []): number[] => {
        const sorted: number[] = [];
        const safeAmenities = Array.isArray(amenities) ? amenities : [];
        const safeNames = Array.isArray(selectedNames) ? selectedNames : [];
        const amenityNames = safeAmenities.map((a) => a.name);
        for (const name of safeNames) {
            const pos = amenityNames.indexOf(name);
            if (pos !== -1) {
                sorted.push(safeAmenities[pos].id);
            }
        }
        return sorted;
    };

    // Formik
    const formik = useFormik<PropertyFormValues>({
        initialValues: {
            name: '',
            address: '',
            street_number: '',
            street_name: '',
            postal_code: '',
            landmark: '',
            google_place_id: '',
            geocode_raw: null,
            pin_confirmed: false,
            property_type: '',
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
            is_party_allowed: false,
            rules: '',
            amenities: [],
            amenityIds: [],
        },
        onSubmit: (values) => {
            handleCreateProperty(values);
        },
    });

    // Step validation
    const validateStep = (step: WizardStep): boolean => {
        switch (step) {
            case WizardStep.PROPERTY_DETAILS: {
                const {
                    name,
                    address,
                    property_type,
                    city,
                    state,
                    country,
                    google_place_id,
                    latitude,
                    longitude,
                    pin_confirmed,
                } = formik.values;

                const nameError = validatePropertyName(name);
                if (nameError) {
                    toast.error(nameError);
                    return false;
                }
                if (!address.trim()) {
                    toast.error('Address is required');
                    return false;
                }
                if (!google_place_id) {
                    toast.error('Please select the address from the suggestions so we can pin it on the map');
                    return false;
                }
                if (latitude == null || longitude == null) {
                    toast.error('Coordinates missing \u2014 pick the address from the suggestions again');
                    return false;
                }
                if (!pin_confirmed) {
                    toast.error('Please confirm the map pin matches the actual property location');
                    return false;
                }
                if (!property_type) {
                    toast.error('Property type is required');
                    return false;
                }
                if (!country.trim()) {
                    toast.error('Country is required');
                    return false;
                }
                if (!state.trim()) {
                    toast.error('State is required');
                    return false;
                }
                if (!city.trim()) {
                    toast.error('City is required');
                    return false;
                }
                return true;
            }
            case WizardStep.UNITS:
                return true; // Units are optional
            case WizardStep.MEDIA_DOCS: {
                const anyPropertyMedia = Object.values(propertyMedia).some((files) => (files?.length ?? 0) > 0);
                if (!anyPropertyMedia) {
                    toast.error('Please upload photos for at least one property category before creating');
                    return false;
                }
                return true;
            }
            default:
                return true;
        }
    };

    // Navigation
    const goToStep = (step: WizardStep) => {
        setCurrentStep(step);
        if (step > highestStep) {
            setHighestStep(step);
        }
    };

    const handleNext = () => {
        if (!validateStep(currentStep)) return;
        const next = (currentStep + 1) as WizardStep;
        if (next <= WizardStep.MEDIA_DOCS) {
            goToStep(next);
        }
    };

    const handleBack = () => {
        const prev = (currentStep - 1) as WizardStep;
        if (prev >= WizardStep.PROPERTY_DETAILS) {
            setCurrentStep(prev);
        }
    };

    // Unit handlers
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
        setUnits((prev) => prev.filter((_, i) => i !== index));
        // Clean up media for deleted unit
        setUnitMediaByCategory((prev) => {
            const next = { ...prev };
            delete next[unit._key];
            return next;
        });
    };

    const handleSaveUnit = (unit: UnitFormValues) => {
        if (editingUnitIndex !== null) {
            setUnits((prev) => prev.map((u, i) => (i === editingUnitIndex ? unit : u)));
        } else {
            setUnits((prev) => [...prev, unit]);
        }
        setDrawerOpen(false);
    };

    // Submit
    const handleCreateProperty = (values: PropertyFormValues) => {
        if (!validateStep(WizardStep.MEDIA_DOCS)) return;

        const sortedAmenities = sortAmenities(availableAmenities, values.amenities);

        if (values.latitude == null || values.longitude == null || !values.google_place_id) {
            toast.error('Address details are incomplete. Go back to step 1 and re-select the address.');
            return;
        }

        const payload: ICreateProperty = {
            name: values.name,
            description: values.description,
            address: values.address,
            property_type: values.property_type as PropertyType,
            city: values.city,
            state: values.state,
            country: values.country,
            latitude: values.latitude,
            longitude: values.longitude,
            google_place_id: values.google_place_id,
            amenities: sortedAmenities,
            is_pet_allowed: values.is_pet_allowed,
            is_party_allowed: values.is_party_allowed,
            ...(values.street_number && { street_number: values.street_number }),
            ...(values.street_name && { street_name: values.street_name }),
            ...(values.postal_code && { postal_code: values.postal_code }),
            ...(values.landmark && { landmark: values.landmark }),
            ...(values.geocode_raw && { geocode_raw: values.geocode_raw }),
            ...(values.rules && { rules: values.rules }),
            ...(values.owner_email && { owner_email: values.owner_email }),
            ...(values.owner_name && { owner_name: values.owner_name }),
        };

        createProperty(
            { payload },
            {
                onSuccess: (response) => {
                    const propertyId = response?.data?.data?.id;
                    if (!propertyId) {
                        toast.error('Property created but failed to get ID');
                        return;
                    }

                    toast.success('Property created successfully');

                    // Upload property media — one request per non-empty category, so
                    // the server persists the `category` tag on each PropertyMedia row.
                    const propertyMediaEntries = Object.entries(propertyMedia).filter(
                        ([, files]) => (files?.length ?? 0) > 0,
                    ) as [PropertyMediaCategory, File[]][];
                    propertyMediaEntries.forEach(([category, files]) => {
                        const imageFiles = files.filter((f) => !f.type.startsWith('video/'));
                        const videoFiles = files.filter((f) => f.type.startsWith('video/'));
                        const uploadCategoryBatch = (batch: File[], mediaType: string) => {
                            if (batch.length === 0) return;
                            const formData = new FormData();
                            batch.forEach((file) => formData.append('media_file', file));
                            formData.append('media_type', mediaType);
                            formData.append('is_featured', category === PropertyMediaCategory.EXTERIOR_FRONT ? 'true' : 'false');
                            formData.append('category', category);
                            uploadMedia(
                                { propertyId, payload: formData },
                                {
                                    onError: (error: any) =>
                                        toast.error(
                                            error?.response?.data?.detail || error?.response?.data?.message || `Media upload failed for ${category}`,
                                            { duration: 6000, style: { maxWidth: '500px', width: 'max-content' } },
                                        ),
                                },
                            );
                        };
                        uploadCategoryBatch(imageFiles, MediaType.IMAGE);
                        uploadCategoryBatch(videoFiles, MediaType.VIDEO);
                    });

                    // Upload documents
                    if (docFiles.length > 0) {
                        docFiles.forEach(({ file, type }) => {
                            const docFormData = new FormData();
                            docFormData.append('document_file', file);
                            docFormData.append('document_type', type);
                            uploadDoc(
                                { propertyId, payload: docFormData },
                                {
                                    onError: () =>
                                        toast.error('Document upload failed', {
                                            duration: 6000,
                                            style: { maxWidth: '500px', width: 'max-content' },
                                        }),
                                }
                            );
                        });
                    }

                    // Create units
                    if (units.length > 0) {
                        const unitPayloads = units.map((u) => ({
                            name: u.name,
                            description: u.description,
                            price_per_night: u.price_per_night,
                            caution_fee: u.caution_fee,
                            max_guests: u.max_guests,
                            count: u.count,
                            is_whole_property: u.is_whole_property,
                            bedroom_count: u.bedroom_count,
                            living_room_count: u.living_room_count,
                            kitchen_count: u.kitchen_count,
                            bathroom_count: u.bathroom_count,
                            amenities: sortAmenities(availableAmenities, u.amenityNames),
                        }));

                        createUnits(
                            { propertyId: String(propertyId), payload: unitPayloads },
                            {
                                onSuccess: (unitResponse) => {
                                    // Upload unit media — one request per non-empty category.
                                    const createdUnits = unitResponse?.data?.data?.units ?? unitResponse?.data?.data ?? [];
                                    units.forEach((localUnit, index) => {
                                        const createdUnit = createdUnits[index];
                                        // Whole-property units use the property gallery — never had per-unit media collected.
                                        if (localUnit.is_whole_property) return;
                                        const bucket = unitMediaByCategory[localUnit._key] ?? {};
                                        if (!createdUnit?.id) return;

                                        (Object.entries(bucket) as [PropertyMediaCategory, File[]][]).forEach(
                                            ([category, files]) => {
                                                if (!files || files.length === 0) return;
                                                const imageFiles = files.filter((f) => !f.type.startsWith('video/'));
                                                const videoFiles = files.filter((f) => f.type.startsWith('video/'));
                                                const uploadCategoryBatch = (batch: File[], mediaType: string) => {
                                                    if (batch.length === 0) return;
                                                    const formData = new FormData();
                                                    batch.forEach((file) => formData.append('media_file', file));
                                                    formData.append('media_type', mediaType);
                                                    formData.append('is_featured', 'false');
                                                    formData.append('category', category);
                                                    uploadUnitMedia(
                                                        {
                                                            propertyId,
                                                            unitId: createdUnit.id,
                                                            payload: formData,
                                                        },
                                                        {
                                                            onError: () =>
                                                                toast.error(
                                                                    `Failed to upload ${category} for unit: ${localUnit.name}`,
                                                                    {
                                                                        duration: 6000,
                                                                        style: { maxWidth: '500px', width: 'max-content' },
                                                                    },
                                                                ),
                                                        },
                                                    );
                                                };
                                                uploadCategoryBatch(imageFiles, MediaType.IMAGE);
                                                uploadCategoryBatch(videoFiles, MediaType.VIDEO);
                                            },
                                        );
                                    });
                                },
                                onError: () =>
                                    toast.error('Failed to create units', {
                                        duration: 6000,
                                        style: { maxWidth: '500px', width: 'max-content' },
                                    }),
                            }
                        );
                    }

                    // Navigate to property details
                    router.push(PAGE_ROUTES.dashboard.propertyManagement.allProperties.details(propertyId));
                },
                onError: (error: any) => {
                    const detail = error?.response?.data?.detail;
                    // Surface PROFILE_INCOMPLETE with the dedicated dialog so
                    // the user gets a clear list of missing fields + CTA.
                    if (
                        error?.response?.status === 403 &&
                        typeof detail === 'object' &&
                        detail?.code === 'PROFILE_INCOMPLETE'
                    ) {
                        setIncompleteFields(detail.missing_fields ?? []);
                        return;
                    }
                    // Otherwise, fall back to a toast but never render an object.
                    const message =
                        (typeof detail === 'string' ? detail : detail?.message) ||
                        error?.response?.data?.message ||
                        'Something went wrong';
                    toast.error(message, {
                        duration: 6000,
                        style: { maxWidth: '500px', width: 'max-content' },
                    });
                },
            }
        );
    };

    return (
        <div className="relative m-3 sm:m-5 pb-28 sm:pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Link
                            href={PAGE_ROUTES.dashboard.propertyManagement.allProperties.base}
                            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 transition-all"
                        >
                            <FaArrowLeftLong className="text-[10px]" /> Back to Properties
                        </Link>
                    </div>
                    <h2 className="text-lg sm:text-2xl font-bold text-zinc-900 tracking-tight">List New Property</h2>
                    <p className="text-sm font-medium text-zinc-500">
                        Step {currentStep + 1} of {Object.keys(WizardStep).length / 2}
                    </p>
                </div>
                <div className="p-2.5 bg-primary/10 rounded-xl">
                    <Icon icon="solar:home-add-bold-duotone" className="text-2xl text-primary" />
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-10">
                <ProgressBar
                    currentStep={currentStep}
                    highestStep={highestStep}
                    onStepClick={(step) => {
                        if (step <= highestStep) {
                            setCurrentStep(step);
                        }
                    }}
                />
            </div>

            {/* Amenity Modal */}
            {showAmenityForm && (
                <CustomModal
                    title="Create Amenity"
                    onClose={() => setShowAmenityForm(false)}
                    isOpen={showAmenityForm}
                >
                    <CreateAmenityForm show={setShowAmenityForm} />
                </CustomModal>
            )}

            {/* Unit Drawer */}
            <UnitDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onSave={handleSaveUnit}
                editingUnit={editingUnitIndex !== null ? units[editingUnitIndex] : null}
                availableAmenities={availableAmenities}
                showAmenityForm={() => setShowAmenityForm(true)}
                userRole={user?.role}
                propertyName={formik.values.name}
            />

            {/* Step Content */}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    formik.handleSubmit();
                }}
            >
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
                        propertyMedia={propertyMedia}
                        setPropertyMedia={setPropertyMedia}
                        docFiles={docFiles}
                        setDocFiles={setDocFiles}
                        units={units}
                        unitMediaByCategory={unitMediaByCategory}
                        setUnitMediaByCategory={setUnitMediaByCategory}
                    />
                )}

                {/* Navigation Buttons */}
                <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between md:relative md:bottom-auto md:left-auto md:right-auto md:z-auto md:bg-transparent md:border-0 md:px-0 md:py-0 md:max-w-3xl md:mx-auto md:mt-10">
                    <button
                        type="button"
                        onClick={handleBack}
                        disabled={currentStep === WizardStep.PROPERTY_DETAILS}
                        className="h-11 px-6 border border-zinc-200 text-zinc-600 text-sm font-semibold rounded-xl hover:bg-zinc-50 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Icon icon="solar:arrow-left-bold" className="text-base" />
                        Back
                    </button>

                    {currentStep === WizardStep.MEDIA_DOCS ? (
                        <button
                            type="submit"
                            disabled={isCreating}
                            className="h-11 px-8 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isCreating ? (
                                <Spinner width="20" height="20" color="#fff" />
                            ) : (
                                <>
                                    <Icon icon="solar:check-read-bold" className="text-base" />
                                    Create Property
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="h-11 px-8 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2"
                        >
                            Next
                            <Icon icon="solar:arrow-right-bold" className="text-base" />
                        </button>
                    )}
                </div>
            </form>

            <IncompleteProfileDialog
                open={incompleteFields !== null}
                missingFields={incompleteFields ?? []}
                onClose={() => setIncompleteFields(null)}
            />
        </div>
    );
}
