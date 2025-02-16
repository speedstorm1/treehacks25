"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BookOpen, User, Bell, Menu, Video, LogOut } from "lucide-react"
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useClass } from "@/app/context/ClassContext"

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { setClassId } = useClass()

  // Hide the sidebar if the current route is professor-setup or student path
  if (pathname === '/' || pathname.startsWith('/student')) {
    return null;
  }

  const handleExitClass = () => {
    setClassId(null)
    router.push('/')
  }

  const SidebarItems = (
    <>
      <SidebarHeader>
        <Link href="/home" className="hover:opacity-80 pl-2">
          <h2 className="text-xl font-bold">Teacher's Pet</h2>
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex flex-col h-full">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith("/assignments")}>
              <Link href="/assignments" className="text-base pl-4">
                <BookOpen className="mr-2 h-5 w-5" />
                <span>Assignments</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith("/lectures")}>
              <Link href="/lectures" className="text-base pl-4">
                <Video className="mr-2 h-5 w-5" />
                <span>Lectures</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/sessions"}>
              <Link href="/sessions" className="text-base pl-4">
                <BookOpen className="mr-2 h-5 w-5" />
                <span>Learning Checks</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/profile"}>
              <Link href="/profile" className="text-base pl-4">
                <User className="mr-2 h-5 w-5" />
                <span>Profile</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/announcements"}>
              <Link href="/announcements" className="text-base pl-4">
                <Bell className="mr-2 h-5 w-5" />
                <span>Announcements</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="mt-auto py-4 px-3">
          <Button 
            variant="outline" 
            className="w-full justify-start pl-4 text-base"
            onClick={handleExitClass}
          >
            <LogOut className="mr-2 h-5 w-5" />
            Exit Class
          </Button>
        </div>
      </SidebarContent>
    </>
  )

  return (
    <>
      <ShadcnSidebar className="hidden md:block">{SidebarItems}</ShadcnSidebar>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden fixed top-4 left-4 z-40">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[240px] sm:w-[300px]">
          {SidebarItems}
        </SheetContent>
      </Sheet>
    </>
  )
}
