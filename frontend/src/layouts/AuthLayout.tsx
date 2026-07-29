// components/layouts/AuthLayout.tsx
import React from "react";

interface AuthLayoutProps {
    children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen w-full grid grid-cols-1 md:grid-cols-5 bg-[#141414] text-[#E1E1E1]">
            <div className="col-span-1 md:col-span-3 flex items-center justify-center p-6 sm:p-8 bg-[#1E1E1E] shadow-md">
                <div className="w-full max-w-md px-4 sm:px-0">
                    {children}
                </div>
            </div>

            <div className="col-span-2 hidden md:block relative">
                <img
                    src="./cover_page_image.png"
                    alt="Background"
                    className="w-full h-full object-cover"
                />
                {/* <div className="absolute inset-0 bg-gradient-to-l from-[#141414] to-transparent" /> */}
            </div>
        </div>
    );
};

export default AuthLayout;