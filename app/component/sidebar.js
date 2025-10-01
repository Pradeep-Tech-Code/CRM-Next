"use client"

import { Home, Settings, HelpCircle, BookCopy, ClipboardMinus, FileChartColumnIncreasing, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { cn } from "@/lib/utils"
import Image from 'next/image'
import { useState } from "react"

const menuItems = [
    { label: "Dashboard", icon: Home, href: "dashboard", active: true },
    { label: "Custom Form", icon: BookCopy, href: "custom-form" },
    { label: "Form Analytics", icon: FileChartColumnIncreasing, href: "form-analytics" },
    { label: "Report", icon: ClipboardMinus, href: "report" },
    { label: "Setting", icon: Settings, href: "setting" },
    { label: "Help", icon: HelpCircle, href: "help" },
]

export default function Sidebar({activeTab, setActiveTab, isCollapsed, setIsCollapsed}) {
    const [isHovered, setIsHovered] = useState(false)

    return (
        <aside className={cn(
            "fixed md:relative inset-y-0 left-0 z-50 transition-all duration-300 bg-sidebar border-r border-sidebar-border",
            isCollapsed ? "-translate-x-full md:translate-x-0 md:w-16" : "translate-x-0 w-64 md:w-64"
        )}>
            <Card className="m-3 h-[calc(100vh-1.5rem)] p-3 flex flex-col gap-6 bg-sidebar border-0 shadow-none">
                <div className="flex items-center justify-between">
                    <div className={cn("flex items-center gap-3 px-2", isCollapsed && "md:justify-center md:px-0")}>
                        <div className="size-10 rounded-md flex items-center justify-center overflow-hidden">
                            <Image
                                src="/SlashLogo.png"
                                alt="SlashRtc Logo"
                                width={40}
                                height={40}
                                quality={75}
                                priority
                                className="object-cover"
                            />
                        </div>
                        {!isCollapsed && <span className="text-xl font-semibold text-sidebar-foreground">Slash CRM</span>}
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="md:hidden h-8 w-8"
                    >
                        <X className="size-4" />
                    </Button>
                </div>

                {/* Collapse Toggle Button for Desktop */}
                <div className="hidden md:flex justify-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="h-8 w-8 rounded-full bg-sidebar-accent hover:bg-sidebar-accent/80"
                    >
                        {isCollapsed ? (
                            <ChevronRight className="size-4 text-sidebar-accent-foreground" />
                        ) : (
                            <ChevronLeft className="size-4 text-sidebar-accent-foreground" />
                        )}
                    </Button>
                </div>

                <nav className="flex-1">
                    {!isCollapsed && (
                        <div className="text-xs uppercase text-sidebar-foreground/70 px-2 mb-3 font-semibold tracking-wider">
                            General
                        </div>
                    )}
                    <ul className="grid gap-1">
                        {menuItems.map((item) => (
                            <li key={item.label}>
                                <Button 
                                    variant={activeTab === item.href ? "secondary" : "ghost"} 
                                    className={cn(
                                        "w-full gap-2 transition-all duration-200",
                                        isCollapsed ? "md:justify-center md:px-2 md:py-3" : "justify-start py-3",
                                        activeTab === item.href && "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80"
                                    )}
                                    onClick={() => setActiveTab(item.href)}
                                    onMouseEnter={() => setIsHovered(true)}
                                    onMouseLeave={() => setIsHovered(false)}
                                >
                                    <item.icon className="size-5 shrink-0" />
                                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                                </Button>
                            </li>
                        ))}
                    </ul>
                </nav>

                {!isCollapsed && (
                    <div className="mt-auto pt-4 border-t border-sidebar-border">
                        <div className="text-xs text-sidebar-foreground/70 px-2">
                            © 2025 Slash CRM
                        </div>
                    </div>
                )}
            </Card>
        </aside>
    )
}