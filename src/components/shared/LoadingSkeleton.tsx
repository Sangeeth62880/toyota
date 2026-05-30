"use client";

export function CardSkeleton() {
  return (
    <div className="w-full h-[300px] bg-white border border-[#E5E5E5] rounded-[4px] overflow-hidden shadow-sm animate-pulse flex flex-col justify-between">

      <div className="w-full h-[180px] bg-gray-200" />

      <div className="p-4 h-[120px] flex flex-col justify-between border-t border-[#F4F4F4]">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded-[4px] w-2/3" />
          <div className="h-3.5 bg-gray-100 rounded-[4px] w-1/2" />
        </div>
        <div className="flex justify-end gap-2">
          <div className="h-6 w-6 bg-gray-100 rounded-[4px]" />
          <div className="h-6 w-6 bg-gray-100 rounded-[4px]" />
        </div>
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="border-b border-[#E5E5E5] animate-pulse h-[56px]">
      <td className="py-3 px-6 w-[120px]">
        <div className="h-4 bg-gray-200 rounded-[4px] w-16" />
      </td>
      <td className="py-3 px-6">
        <div className="h-4 bg-gray-200 rounded-[4px] w-28" />
      </td>
      <td className="py-3 px-6 w-[180px]">
        <div className="h-4 bg-gray-200 rounded-[4px] w-24" />
      </td>
      <td className="py-3 px-6 w-[200px]">
        <div className="h-4 bg-gray-100 rounded-[4px] w-20" />
      </td>
      <td className="py-3 px-6 text-right w-[120px]">
        <div className="inline-flex gap-2">
          <div className="h-6 w-6 bg-gray-100 rounded-[4px]" />
          <div className="h-6 w-6 bg-gray-100 rounded-[4px]" />
        </div>
      </td>
    </tr>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white border border-[#E5E5E5] rounded-[4px] p-6 flex flex-col justify-between min-h-[148px] shadow-sm animate-pulse">
      <div className="w-9 h-9 bg-gray-200 rounded-[4px] mb-4" />
      <div className="h-8 bg-gray-200 rounded-[4px] w-24 mb-2" />
      <div className="h-4 bg-gray-100 rounded-[4px] w-32" />
    </div>
  );
}
