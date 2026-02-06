"use client";

import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

interface UserEditFormProps {
    initialData: {
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
        gender?: string;
        role?: string;
        bio?: string;
        isActive?: boolean;
        isVerified?: boolean;
    };
    onSave: (data: any) => void;
    onCancel: () => void;
    isSaving: boolean;
    showRoleSelector?: boolean;
}

const UserEditForm: React.FC<UserEditFormProps> = ({
    initialData,
    onSave,
    onCancel,
    isSaving,
    showRoleSelector = true
}) => {
    const [formData, setFormData] = useState({
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        gender: (initialData.gender || '').toLowerCase(),
        role: initialData.role || '',
        bio: initialData.bio || '',
        isActive: initialData.isActive ?? true,
        isVerified: initialData.isVerified ?? false,
    });

    useEffect(() => {
        setFormData({
            firstName: initialData.firstName || '',
            lastName: initialData.lastName || '',
            email: initialData.email || '',
            phone: initialData.phone || '',
            gender: (initialData.gender || '').toLowerCase(),
            role: initialData.role || '',
            bio: initialData.bio || '',
            isActive: initialData.isActive ?? true,
            isVerified: initialData.isVerified ?? false,
        });
    }, [initialData]);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-1 md:p-4 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                    {/* Section: Personal Details */}
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-4 w-1 bg-primary rounded-full"></div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Personal Information</h3>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">First Name</label>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                <Icon icon="mdi:account" width="18" />
                            </div>
                            <input
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all duration-200"
                                placeholder="John"
                                value={formData.firstName}
                                onChange={e => handleChange('firstName', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Last Name</label>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                <Icon icon="mdi:account-outline" width="18" />
                            </div>
                            <input
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all duration-200"
                                placeholder="Doe"
                                value={formData.lastName}
                                onChange={e => handleChange('lastName', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Gender</label>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none">
                                <Icon icon="mdi:gender-male-female" width="18" />
                            </div>
                            <select
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all duration-200 appearance-none pointer-events-auto"
                                value={formData.gender}
                                onChange={e => handleChange('gender', e.target.value)}
                            >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                <Icon icon="mdi:chevron-down" width="18" />
                            </div>
                        </div>
                    </div>

                    {showRoleSelector && (
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Account Role</label>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none">
                                    <Icon icon="mdi:shield-account" width="18" />
                                </div>
                                <select
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all duration-200 appearance-none"
                                    value={formData.role}
                                    onChange={e => handleChange('role', e.target.value)}
                                >
                                    <option value="GUEST">Guest</option>
                                    <option value="AGENT">Agent</option>
                                    <option value="OWNER">Owner</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="SUPER_ADMIN">Super Admin</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                    <Icon icon="mdi:chevron-down" width="18" />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Email Address</label>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                <Icon icon="mdi:email-outline" width="18" />
                            </div>
                            <input
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all duration-200"
                                placeholder="john@example.com"
                                type="email"
                                value={formData.email}
                                onChange={e => handleChange('email', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Phone Number</label>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                <Icon icon="mdi:phone-outline" width="18" />
                            </div>
                            <input
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all duration-200"
                                placeholder="+234 800 000 0000"
                                value={formData.phone}
                                onChange={e => handleChange('phone', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">About User (Bio)</label>
                        <div className="relative group">
                            <div className="absolute left-3 top-4 text-gray-400 group-focus-within:text-primary transition-colors">
                                <Icon icon="mdi:text-account" width="18" />
                            </div>
                            <textarea
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all duration-200 min-h-[100px] resize-none"
                                placeholder="Tell us a bit about this user..."
                                value={formData.bio}
                                onChange={e => handleChange('bio', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Section: Account Settings */}
                    <div className="md:col-span-2 mt-4">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="h-4 w-1 bg-primary rounded-full"></div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Account Settings</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between group hover:border-primary/20 transition-all duration-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                        <Icon icon="mdi:account-check-outline" width="20" className={formData.isActive ? "text-green-500" : "text-gray-400"} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">Active Account</p>
                                        <p className="text-xs text-gray-500 font-medium">Allow user to login</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleChange('isActive', !formData.isActive)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.isActive ? 'bg-primary' : 'bg-gray-200'}`}
                                >
                                    <span className={`${formData.isActive ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                                </button>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between group hover:border-primary/20 transition-all duration-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                        <Icon icon="mdi:verified-badge-outline" width="20" className={formData.isVerified ? "text-blue-500" : "text-gray-400"} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">Verified Member</p>
                                        <p className="text-xs text-gray-500 font-medium">Show verified status</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleChange('isVerified', !formData.isVerified)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.isVerified ? 'bg-primary' : 'bg-gray-200'}`}
                                >
                                    <span className={`${formData.isVerified ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3">
                <button
                    onClick={onCancel}
                    className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                    {isSaving ? (
                        <>
                            <Icon icon="mdi:loading" className="animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Icon icon="mdi:content-save" />
                            Save Changes
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default UserEditForm;
