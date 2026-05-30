"use client";

import type { ComponentType } from "react";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: EmptyStateAction;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 select-none font-sans bg-white border border-[#E5E5E5] rounded-[4px] shadow-sm">

      <div className="w-16 h-16 rounded-full bg-[#F4F4F4] flex items-center justify-center mb-4 text-[#767676] border border-[#E5E5E5]">
        <Icon className="w-7 h-7 stroke-[1.25] flex-shrink-0" />
      </div>

      <h3 className="font-sans font-bold text-[16px] text-[#0A0A0A] tracking-tight leading-tight">
        {title}
      </h3>
      <p className="font-sans font-normal text-[13.5px] text-[#767676] mt-2 max-w-[340px] leading-relaxed">
        {description}
      </p>

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="h-[38px] px-5 bg-[#EB0A1E] hover:bg-[#C5081A] text-white text-[13px] font-semibold rounded-none transition-colors duration-200 mt-6 focus:ring-2 focus:ring-[#EB0A1E] focus:ring-offset-2 outline-none"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
