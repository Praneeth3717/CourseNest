// pages/admin/Teachers/UpdateTeacherPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    teacherService,
} from "@/api/services/teacher.service";
import type {
    Teacher,
    UpdateTeacherPayload,
    Gender,
} from "@/types/teacher.types";

const UpdateTeacherPage = () => {
    const navigate = useNavigate();
    const { teacherId } = useParams();

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState<UpdateTeacherPayload>({
        full_name: "",
        phone: "",
        dob: "",
        gender: "Male",
        specialization: "",
        qualification: "",
        experience_years: 0,
        address: "",
        profile_image: null,
    });

    const fetchTeacher = async () => {
        if (!teacherId) return;

        try {
            setLoading(true);
            setError("");

            const response = await teacherService.getTeacherById(teacherId);

            setTeacher(response);

            setFormData({
                full_name: response.full_name || "",
                phone: response.phone || "",
                dob: response.dob ? response.dob.substring(0, 10) : "",
                gender: response.gender || "Male",
                specialization: response.specialization || "",
                qualification: response.qualification || "",
                experience_years: response.experience_years || 0,
                address: response.address || "",
                profile_image: null,
            });
        } catch (err: any) {
            console.error("Failed to fetch teacher", err);
            setError(err.message || "Failed to load teacher");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeacher();
    }, [teacherId]);

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
    ) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]:
                name === "experience_years" ? Number(value) : value,
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;

        setFormData((prev) => ({
            ...prev,
            profile_image: file,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!teacherId) return;

        try {
            setSubmitting(true);
            setError("");

            await teacherService.updateTeacher(teacherId, formData);

            navigate(`/admin/teachers/${teacherId}`);
        } catch (err: any) {
            console.error("Failed to update teacher", err);
            setError(err.message || "Failed to update teacher");
        } finally {
            setSubmitting(false);
        }
    };

    const inputClass =
        "p-2 rounded-md bg-[#0C0C0C] text-[#E1E1E1] border border-[#343540] focus:outline-none focus:ring-2 focus:ring-[#10A37F] transition text-sm w-full";

    const labelClass = "text-xs text-[#E1E1E1] mb-1 block";

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0C0C0C]">
                <p className="text-[#E1E1E1] text-sm">Loading...</p>
            </div>
        );
    }

    if (!teacher) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0C0C0C]">
                <p className="text-[#E1E1E1] text-sm">Teacher not found</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 flex justify-center">
            <div className="w-full max-w-3xl bg-[#161616] border border-[#343540] rounded-lg p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-4 text-[#FFFFFF]">
                    Update Teacher
                </h2>

                {error && (
                    <p className="text-red-500 text-xs mb-3 p-1 text-center">
                        {error}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Full Name</label>
                            <input
                                type="text"
                                name="full_name"
                                value={formData.full_name ?? ""}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Phone</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone ?? ""}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Date of Birth</label>
                            <input
                                type="date"
                                name="dob"
                                value={formData.dob ?? ""}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Gender</label>
                            <select
                                name="gender"
                                value={formData.gender ?? ""}
                                onChange={handleChange}
                                className={inputClass}
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>Specialization</label>
                            <input
                                type="text"
                                name="specialization"
                                value={formData.specialization ?? ""}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Qualification</label>
                            <input
                                type="text"
                                name="qualification"
                                value={formData.qualification ?? ""}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Experience Years</label>
                            <input
                                type="number"
                                name="experience_years"
                                value={formData.experience_years ?? 0}
                                onChange={handleChange}
                                className={inputClass}
                                min={0}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Profile Image</label>
                            {teacher.profile_image && (
                                <img
                                    src={teacher.profile_image}
                                    alt={teacher.full_name}
                                    className="w-16 h-16 rounded-full object-cover mb-2 border border-[#343540]"
                                />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="text-xs text-[#E1E1E1] w-full"
                            />
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Address</label>
                        <textarea
                            name="address"
                            value={formData.address ?? ""}
                            onChange={handleChange}
                            rows={4}
                            className={inputClass}
                        />
                    </div>

                    <div className="flex gap-3 mt-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-[#10A37F] hover:bg-[#0e8f70] text-white p-2 px-5 rounded-md font-medium shadow-md transition duration-300 text-sm flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {submitting ? "Updating..." : "Update Teacher"}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="bg-transparent border border-[#343540] hover:bg-[#1f1f1f] text-[#E1E1E1] p-2 px-5 rounded-md font-medium transition duration-300 text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateTeacherPage;