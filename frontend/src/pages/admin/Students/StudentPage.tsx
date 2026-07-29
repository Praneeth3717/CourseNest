import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { studentService } from "@/api/services/student.service";
import type { Student } from "@/types/student.types";

import EnrolledCoursesTable from "./EnrolledCoursesTable";

const StudentPage = () => {
    const navigate = useNavigate();
    const { studentId } = useParams();

    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!studentId) return;
        (async () => {
            try {
                setLoading(true);
                const res = await studentService.getStudentById(studentId);
                setStudent(res);
            } catch (err) {
                console.error("Failed to fetch student", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [studentId]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0C0C0C]">
                <p className="text-[#E1E1E1]/70 text-sm">Loading student details...</p>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0C0C0C]">
                <p className="text-[#E1E1E1]/70 text-sm">Student not found</p>
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

            {/* ── Student details card ── */}
            <div className="relative rounded-xl border border-[#343540] bg-[#1E1E1E] p-6 shadow-md">
                {student.profile_image && (
                    <img
                        src={student.profile_image}
                        alt={student.full_name}
                        className="absolute right-6 top-6 h-[140px] w-[140px] rounded-xl border border-[#343540] object-cover"
                    />
                )}

                <h1 className="mb-6 pr-[180px] text-2xl font-semibold text-[#FFFFFF]">
                    {student.full_name}
                </h1>

                <div className="grid grid-cols-1 gap-4 pr-0 sm:grid-cols-2 sm:pr-[180px]">
                    <DetailItem label="Email" value={student.email} />
                    <DetailItem label="Phone" value={student.phone} />
                    <DetailItem label="Gender" value={student.gender} />
                    <DetailItem label="Date of Birth" value={student.dob} />
                    <DetailItem label="Address" value={student.address} />
                    <DetailItem
                        label="Created At"
                        value={new Date(student.created_at).toLocaleString()}
                    />
                </div>
            </div>

            {/* ── Enrolled courses ── */}
            {studentId && <EnrolledCoursesTable studentId={studentId} />}
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

export default StudentPage;