// pages/admin/Students/UpdateStudentPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    studentService,
} from "@/api/services/student.service";
import type {
    Student,
    UpdateStudentPayload,
    Gender,
} from "@/types/student.types";

const UpdateStudentPage = () => {
    const navigate = useNavigate();
    const { studentId } = useParams();

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [student, setStudent] = useState<Student | null>(null);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState<UpdateStudentPayload>({
        full_name: "",
        phone: "",
        dob: "",
        gender: "Male",
        address: "",
        profile_image: null,
    });

    const fetchStudent = async () => {
        if (!studentId) return;

        try {
            setLoading(true);
            setError("");

            const response = await studentService.getStudentById(studentId);
            const data = response;

            setStudent(data);

            setFormData({
                full_name: data.full_name || "",
                phone: data.phone || "",
                dob: data.dob ? data.dob.substring(0, 10) : "",
                gender: data.gender || "Male",
                address: data.address || "",
                profile_image: null,
            });
        } catch (err: any) {
            console.error("Failed to fetch student", err);
            setError(err.message || "Failed to load student");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudent();
    }, [studentId]);

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
    ) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
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

        if (!studentId) return;

        try {
            setSubmitting(true);
            setError("");

            await studentService.updateStudent(studentId, formData);

            navigate(`/admin/students/${studentId}`);
        } catch (err: any) {
            console.error("Failed to update student", err);
            setError(err.message || "Failed to update student");
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

    if (!student) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0C0C0C]">
                <p className="text-[#E1E1E1] text-sm">Student not found</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 flex justify-center">
            <div className="w-full max-w-3xl bg-[#161616] border border-[#343540] rounded-lg p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-4 text-[#FFFFFF]">
                    Update Student
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
                            <label className={labelClass}>Profile Image</label>
                            {student.profile_image && (
                                <img
                                    src={student.profile_image}
                                    alt={student.full_name}
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
                            {submitting ? "Updating..." : "Update Student"}
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

export default UpdateStudentPage;