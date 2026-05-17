"use client";

import { CiMail } from "react-icons/ci";


export const SocialsHome = () => {
  return (
    <div className="flex gap-6 pt-4">
      <a href="mailto:team@viber" className="transition-transform hover:text-primary hover:rotate-15"><CiMail size={28} /></a>
    </div>
  );
};