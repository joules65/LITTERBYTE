import { LeafyGreenIcon } from "lucide-react";

export default function Anima() {
    return (
      <div className="relative w-32 h-32 mx-auto mb-8">
        <div className="absolute inset-0 rounded-full bg-emerald-950 opacity-20 animate-pulse"></div>
        <div className="absolute inset-2 rounded-full bg-green-400 opacity-40 animate-ping"></div>
        <div className="absolute inset-4 rounded-full bg-green-300 opacity-60 animate-spin"></div>
        <div className="absolute inset-6 rounded-full bg-green-50 opacity-80 animate-bounce"></div>
        <LeafyGreenIcon className="absolute inset-0 m-auto h-16 w-16 text-green-600 animate-pulse"/>
      </div>
    );
  }