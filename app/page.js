"use client"

import { useState, useEffect } from "react"
import Sidebar from "./component/sidebar";
import Topbar from "./component/topbar";
import CustomFormPage from "./custom-form/page";
import { cn } from "@/lib/utils";

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  const renderContent = () => {
    switch (activeTab) {
      case "custom-form":
        return <CustomFormPage />
      case "dashboard":
      default:
        return (
          <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome to your CRM dashboard. Select "Custom Form" from the sidebar to start building forms.
            </p>
          </div>
        )
    }
  }

  return (
    <main className="min-h-screen">
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
      
      <div className="mx-auto max-w-[1400px]">
        <div className="flex">
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />
          <section className={cn(
            "flex-1 p-3 md:p-4 transition-all duration-300 flex flex-col",
            isCollapsed ? "md:ml-0" : "md:ml-0"
          )}>
            <div className="mb-4">
              <Topbar 
                darkMode={darkMode} 
                toggleDarkMode={toggleDarkMode}
                toggleSidebar={toggleSidebar}
              />
            </div>
            <div className="flex-1">
              {renderContent()}
            </div>
          </section>
        </div>
      </div>  
    </main>
  );
}