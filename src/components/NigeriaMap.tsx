import * as React from "react";
import { MapPin } from "lucide-react";

export const ZONE_PERFORMANCE = [
  { name: "North West", compliance: 95, pending: 2, status: "green" },
  { name: "North East", compliance: 88, pending: 5, status: "yellow" },
  { name: "North Central", compliance: 92, pending: 3, status: "green" },
  { name: "South West", compliance: 98, pending: 1, status: "green" },
  { name: "South East", compliance: 75, pending: 12, status: "red" },
  { name: "South South", compliance: 89, pending: 4, status: "yellow" },
];

export const NigeriaMap = ({ onZoneClick }: { onZoneClick: (zone: string) => void }) => {
  return (
    <div className="relative w-full aspect-square max-w-[400px] mx-auto">
      <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-xl">
        {/* North West */}
        <path 
          d="M50 50 L180 50 L180 180 L50 180 Z" 
          className="fill-green-500/80 hover:fill-green-600 transition-colors cursor-pointer stroke-white stroke-2"
          onClick={() => onZoneClick("North West")}
        />
        {/* North East */}
        <path 
          d="M180 50 L350 50 L350 180 L180 180 Z" 
          className="fill-yellow-500/80 hover:fill-yellow-600 transition-colors cursor-pointer stroke-white stroke-2"
          onClick={() => onZoneClick("North East")}
        />
        {/* North Central */}
        <path 
          d="M100 180 L300 180 L300 250 L100 250 Z" 
          className="fill-green-500/80 hover:fill-green-600 transition-colors cursor-pointer stroke-white stroke-2"
          onClick={() => onZoneClick("North Central")}
        />
        {/* South West */}
        <path 
          d="M50 250 L150 250 L150 350 L50 350 Z" 
          className="fill-green-500/80 hover:fill-green-600 transition-colors cursor-pointer stroke-white stroke-2"
          onClick={() => onZoneClick("South West")}
        />
        {/* South East */}
        <path 
          d="M150 250 L250 250 L250 350 L150 350 Z" 
          className="fill-red-500/80 hover:fill-red-600 transition-colors cursor-pointer stroke-white stroke-2"
          onClick={() => onZoneClick("South East")}
        />
        {/* South South */}
        <path 
          d="M250 250 L350 250 L350 350 L250 350 Z" 
          className="fill-yellow-500/80 hover:fill-yellow-600 transition-colors cursor-pointer stroke-white stroke-2"
          onClick={() => onZoneClick("South South")}
        />
        
        {/* Labels */}
        <text x="115" y="115" className="fill-white text-[12px] font-bold pointer-events-none" textAnchor="middle">NW</text>
        <text x="265" y="115" className="fill-white text-[12px] font-bold pointer-events-none" textAnchor="middle">NE</text>
        <text x="200" y="215" className="fill-white text-[12px] font-bold pointer-events-none" textAnchor="middle">NC</text>
        <text x="100" y="300" className="fill-white text-[12px] font-bold pointer-events-none" textAnchor="middle">SW</text>
        <text x="200" y="300" className="fill-white text-[12px] font-bold pointer-events-none" textAnchor="middle">SE</text>
        <text x="300" y="300" className="fill-white text-[12px] font-bold pointer-events-none" textAnchor="middle">SS</text>
      </svg>
      
      <div className="absolute bottom-0 right-0 bg-white/80 backdrop-blur-sm p-3 rounded-lg border text-[10px] space-y-1 shadow-sm">
        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /> Compliant</div>
        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500" /> Partial</div>
        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500" /> Non-Compliant</div>
      </div>
    </div>
  );
};
