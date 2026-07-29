import React from "react";
import { useNavigate } from "react-router-dom";

import { UserRole } from "../../types/role";
import { useAppSelector } from "@/store/hooks";

interface NavbarProps {
  role: UserRole;
}

const Navbar: React.FC<NavbarProps> = ({ role }) => {
  const navigate = useNavigate();

  const { profile, email } = useAppSelector(
    (state) => state.auth,
  );

  const displayName =
    profile?.full_name ||
    email ||
    "User";

  const profileImage =
    profile?.profile_image || null;

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-end border-b border-[#343540] bg-[#1E1E1E] px-6">
      <div
        className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-[#2A2A2A]"
        onClick={() => {
          console.log(window.location.pathname);
          navigate("/profile");
        }}
      >
        {profileImage ? (
          <img
            src={profileImage}
            alt={displayName}
            className="h-10 w-10 rounded-full border border-[#343540] object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#10A37F] text-sm font-semibold text-white">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}

        <span className="text-sm font-medium text-[#E1E1E1]">
          {displayName}
        </span>
      </div>
    </header>
  );
};

export default Navbar;