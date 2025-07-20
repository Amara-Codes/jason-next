import { Home, Cross, Boxes, Search, Settings, ChartNoAxesCombined, Bot } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
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
        url: "/admin/settings",
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

export function AppSidebar() {
    return (
        <Sidebar>
            <SidebarHeader>
                <div className="w-full flex">
                    <Image
                        src="/assets/img/logo.png"
                        alt="Logo"
                        width={80}
                        height={80}
                    />
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Basic Operations</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {basic.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>

                                        <Link href={item.url}>
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
                                        <Link href={item.url}>
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