import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { teacherService } from "@/api/services/teacher.service";
import type { Teacher } from "@/types/teacher.types";

import AssignedCoursesTable from "./AssignedCoursesTable";

const TeacherPage = () => {
    const navigate = useNavigate();
    const { teacherId } = useParams();

    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!teacherId) return;
        (async () => {
            try {
                setLoading(true);
                const res = await teacherService.getTeacherById(teacherId);
                setTeacher(res);
            } catch (err) {
                console.error("Failed to fetch teacher", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [teacherId]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0C0C0C]">
                <p className="text-[#E1E1E1]/70 text-sm">Loading teacher details...</p>
            </div>
        );
    }

    if (!teacher) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0C0C0C]">
                <p className="text-[#E1E1E1]/70 text-sm">Teacher not found</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 text-[#E1E1E1]">
            <button
                onClick={() => navigate(-1)}
                className="mb-6 flex items-center gap-2 rounded-md border border-[#343540] bg-[#1E1E1E] px-4 py-2 text-sm font-medium text-[#E1E1E1] transition hover:bg-[#2A2A2A]"
            >
                <ArrowLeft size={16} />
                Back
            </button>

            {/* ── Teacher details card ── */}
            <div className="relative rounded-xl border border-[#343540] bg-[#1E1E1E] p-6 shadow-md">
                {teacher.profile_image && (
                    <img
                        src={teacher.profile_image}
                        alt={teacher.full_name}
                        className="absolute right-6 top-6 h-[140px] w-[140px] rounded-xl border border-[#343540] object-cover"
                    />
                )}

                <h1 className="mb-6 pr-[180px] text-2xl font-semibold text-[#FFFFFF]">
                    {teacher.full_name}
                </h1>

                <div className="grid grid-cols-1 gap-4 pr-0 sm:grid-cols-2 sm:pr-[180px]">
                    <DetailItem label="Email" value={teacher.email} />
                    <DetailItem label="Phone" value={teacher.phone} />
                    <DetailItem label="Gender" value={teacher.gender} />
                    <DetailItem label="Date of Birth" value={teacher.dob} />
                    <DetailItem label="Specialization" value={teacher.specialization} />
                    <DetailItem label="Qualification" value={teacher.qualification} />
                    <DetailItem
                        label="Experience"
                        value={teacher.experience_years != null ? `${teacher.experience_years} Years` : null}
                    />
                    <DetailItem label="Address" value={teacher.address} />
                    <DetailItem label="Created At" value={new Date(teacher.created_at).toLocaleString()} />
                </div>
            </div>

            {/* ── Assigned courses ── */}
            {teacherId && <AssignedCoursesTable teacherId={teacherId} />}
        </div>
    );
};

const DetailItem = ({
    label,
    value,
}: {
    label: string;
    value: string | number | null | undefined;
}) => (
    <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#E1E1E1]/50">
            {label}
        </p>
        <p className="text-sm text-[#E1E1E1]">
            {value !== null && value !== undefined && value !== "" ? value : "-"}
        </p>
    </div>
);

export default TeacherPage;