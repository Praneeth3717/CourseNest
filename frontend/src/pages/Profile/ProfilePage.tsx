import {
    User,
    Mail,
    Phone,
    Calendar,
    MapPin,
    BadgeCheck,
    ShieldCheck,
    GraduationCap,
    Briefcase,
    Clock,
    Venus,
} from "lucide-react";

import { useAppSelector } from "@/store/hooks";
import type { TeacherProfile } from "@/types/auth.types";

/* ─── Helper ──────────────────────────────────── */

function isTeacherProfile(
    profile: object,
): profile is TeacherProfile {
    return "specialization" in profile;
}

/* ─── Sub-components ──────────────────────────── */

interface InfoRowProps {
    icon: React.ReactNode;
    label: string;
    value: string | number | null | undefined;
}

const InfoRow = ({ icon, label, value }: InfoRowProps) => (
    <div className="flex items-start gap-3 py-3 border-b border-[#343540] last:border-0">
        <span className="mt-0.5 text-[#10A37F] shrink-0">{icon}</span>
        <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-xs text-[#E1E1E1]/50 uppercase tracking-wide">
                {label}
            </span>
            <span className="text-sm text-[#E1E1E1] break-words">
                {value ?? "—"}
            </span>
        </div>
    </div>
);

interface SectionCardProps {
    title: string;
    children: React.ReactNode;
}

const SectionCard = ({ title, children }: SectionCardProps) => (
    <div className="rounded-xl border border-[#343540] bg-[#1E1E1E] p-5">
        <h3 className="text-sm font-semibold text-[#FFFFFF] mb-1 uppercase tracking-wider">
            {title}
        </h3>
        <div>{children}</div>
    </div>
);

/* ─── Main Component ──────────────────────────── */

const ProfilePage = () => {
    const { email, role, isActive, userId, profile } = useAppSelector(
        (state) => state.auth,
    );

    // Derive display name — profile may be null before hydration
    const displayName = profile?.full_name || email || "User";
    const initials = displayName.charAt(0).toUpperCase();

    const isTeacher = role === "Teacher";
    const teacherProfile =
        isTeacher && profile && isTeacherProfile(profile)
            ? profile
            : null;

    return (
        <div className="min-h-screen p-6 text-[#E1E1E1]">
            {/* Page title */}
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-[#FFFFFF]">
                    Profile
                </h1>
                <p className="text-sm text-[#E1E1E1]/60">
                    Your account details and personal information.
                </p>
            </div>

            {/* Header card */}
            <div className="mb-6 flex items-center gap-4 rounded-xl border border-[#343540] bg-[#1E1E1E] p-5">
                {profile?.profile_image ? (
                    <img
                        src={profile.profile_image}
                        alt={displayName}
                        className="h-16 w-16 rounded-full object-cover ring-2 ring-[#10A37F]/40 shrink-0"
                    />
                ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#10A37F]/15 ring-2 ring-[#10A37F]/40 text-2xl font-semibold text-[#10A37F]">
                        {initials}
                    </div>
                )}

                <div className="flex flex-col gap-1 min-w-0">
                    <h2 className="text-lg font-semibold text-[#FFFFFF] truncate">
                        {displayName}
                    </h2>

                    <p className="text-sm text-[#E1E1E1]/60 truncate">
                        {email}
                    </p>

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {/* Role badge */}
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#10A37F]/15 px-2.5 py-0.5 text-xs font-medium text-[#10A37F]">
                            <ShieldCheck size={11} />
                            {role}
                        </span>

                        {/* Status badge */}
                        <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${isActive
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : "bg-red-500/10 text-red-400"
                                }`}
                        >
                            <BadgeCheck size={11} />
                            {isActive ? "Active" : "Inactive"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* Account information */}
                <SectionCard title="Account Information">
                    <InfoRow
                        icon={<Mail size={15} />}
                        label="Email"
                        value={email}
                    />
                    <InfoRow
                        icon={<User size={15} />}
                        label="User ID"
                        value={userId}
                    />
                    <InfoRow
                        icon={<BadgeCheck size={15} />}
                        label="Status"
                        value={isActive ? "Active" : "Inactive"}
                    />
                    <InfoRow
                        icon={<ShieldCheck size={15} />}
                        label="Role"
                        value={role}
                    />
                </SectionCard>

                {/* Personal information */}
                <SectionCard title="Personal Information">
                    <InfoRow
                        icon={<User size={15} />}
                        label="Full Name"
                        value={profile?.full_name}
                    />
                    <InfoRow
                        icon={<Phone size={15} />}
                        label="Phone"
                        value={profile?.phone}
                    />
                    <InfoRow
                        icon={<Calendar size={15} />}
                        label="Date of Birth"
                        value={
                            profile?.dob
                                ? new Date(profile.dob).toLocaleDateString()
                                : null
                        }
                    />
                    <InfoRow
                        icon={<Venus size={15} />}
                        label="Gender"
                        value={profile?.gender}
                    />
                    <InfoRow
                        icon={<MapPin size={15} />}
                        label="Address"
                        value={profile?.address}
                    />
                </SectionCard>

                {/* Teacher-only: Professional information */}
                {teacherProfile && (
                    <SectionCard title="Professional Information">
                        <InfoRow
                            icon={<GraduationCap size={15} />}
                            label="Specialization"
                            value={teacherProfile.specialization}
                        />
                        <InfoRow
                            icon={<Briefcase size={15} />}
                            label="Qualification"
                            value={teacherProfile.qualification}
                        />
                        <InfoRow
                            icon={<Clock size={15} />}
                            label="Experience"
                            value={
                                teacherProfile.experience_years != null
                                    ? `${teacherProfile.experience_years} Years`
                                    : null
                            }
                        />
                    </SectionCard>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;