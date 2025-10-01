"use client"

import { Home, Settings, HelpCircle, BookCopy, ClipboardMinus, FileChartColumnIncreasing, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { cn } from "@/lib/utils"
import Image from 'next/image'

const menuItems = [
    { label: "Dashboard", icon: Home, href: "dashboard", active: true },
    { label: "Custom Form", icon: BookCopy, href: "custom-form" },
    { label: "Form Analytics", icon: FileChartColumnIncreasing, href: "form-analytics" },
    { label: "Report", icon: ClipboardMinus, href: "report" },
    { label: "Setting", icon: Settings, href: "setting" },
    { label: "Help", icon: HelpCircle, href: "help" },
]

export default function Sidebar({activeTab, setActiveTab, isCollapsed, setIsCollapsed}) {
    return (
        <aside className={cn(
            "fixed md:relative inset-y-0 left-0 z-50 transition-all duration-300",
            isCollapsed ? "-translate-x-full md:translate-x-0 md:w-20" : "translate-x-0 w-64 md:w-64"
        )}>
            <Card className="m-3 h-[calc(100vh-1.5rem)] p-3 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className={cn("flex items-center gap-3 px-2", isCollapsed && "md:justify-center md:px-0")}>
                        <div className="size-10 rounded-md flex items-center justify-center text-white font-bold">
                            <Image
                                src="/SlashLogo.png"
                                alt="SlashRtc Logo"
                                width={800}
                                height={600}
                                quality={75}
                                priority
                                style={{ objectFit: 'cover' }}
                            />
                        </div>
                        {!isCollapsed && <span className="text-xl font-semibold ">Slash CRM</span>}
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="md:hidden"
                    >
                        <X className="size-5" />
                    </Button>
                </div>

                <nav className="flex-1">
                    {!isCollapsed && (
                        <div className="text-xs uppercase text-muted-foreground px-2 mb-3 font-semibold tracking-wider">
                            General
                        </div>
                    )}
                    <ul className="grid gap-2">
                        {menuItems.map((item) => (
                            <li key={item.label}>
                                <Button 
                                    variant={activeTab === item.href ? "default" : "ghost"} 
                                    className={cn(
                                        "w-full gap-2",
                                        isCollapsed ? "md:justify-center md:px-2" : "justify-start"
                                    )}
                                    onClick={() => setActiveTab(item.href)}
                                >
                                    <item.icon className="size-5 shrink-0" />
                                    {!isCollapsed && <span>{item.label}</span>}
                                </Button>
                            </li>
                        ))}
                    </ul>
                </nav>

                {!isCollapsed && (
                    <div className="mt-auto pt-4 border-t">
                        <div className="text-xs text-muted-foreground px-2">
                            © 2025 Slash CRM
                        </div>
                    </div>
                )}
            </Card>
        </aside>
    )
}