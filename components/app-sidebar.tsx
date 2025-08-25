"use client"

import { Home, Cross, Boxes, Search, Settings, ChartNoAxesCombined, Bot } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import {
    useSidebar,
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"

// Menu items.
const basic = [
    {
        title: "Home",
        url: "/admin",
        icon: Home,
    },
    {
        title: "Add Product",
        url: "/admin/add-product",
        icon: Cross,
    },
    {
        title: "Add Variant",
        url: "/admin/add-variant",
        icon: Boxes,
    },
    {
        title: "Search",
        url: "/admin/search",
        icon: Search,
    },
    {
        title: "Settings",
        url: "/admin/soon",
        icon: Settings,
    },
]

const advanced = [
    {
        title: "Analytics",
        url: "/admin/soon",
        icon: ChartNoAxesCombined,
    },
    {
        title: "AI suggestions",
        url: "/admin/soon",
        icon: Bot,
    }
]

function useSidebarLinkHandler() {
    const { isMobile, setOpenMobile } = useSidebar()
    return () => {
        if (isMobile) {
            setOpenMobile(false)
        }
    }
}
export function AppSidebar() {
    // Call the hook at the top level of the component.
    const handleLinkClick = useSidebarLinkHandler();

    return (
        <Sidebar>
            <SidebarHeader>
                <Link href="/admin" className="w-full flex">
                    <Image
                        src="/assets/img/logo.png"
                        alt="Logo"
                        width={80}
                        height={80}
                    />
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Basic Operations</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {basic.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        {/* Use the handler function obtained from the hook call above. */}
                                        <Link href={item.url} onClick={handleLinkClick}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                <SidebarGroup>
                    <SidebarGroupLabel>Advanced Operations</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {advanced.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        {/* Apply the same handler here for consistent behavior. */}
                                        <Link href={item.url} onClick={handleLinkClick}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}