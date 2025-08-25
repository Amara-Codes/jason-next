"use client";

import { useSidebar } from "@/components/ui/sidebar"
import { Sparkles } from "lucide-react";
 
export function SidebarCustomTrigger() {
  const { toggleSidebar } = useSidebar()

  return (
    <button onClick={toggleSidebar}>
        <div className="sparkles-wrapper">

      <Sparkles className="w-8 h-8 m-8 hidden lg:block text-teal-900" />
          <Sparkles className="w-16 h-16 m-4 block lg:hidden text-teal-900" />
        </div>
     
    </button>
  )
}
