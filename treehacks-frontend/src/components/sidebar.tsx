"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, User, Bell, Menu, Video } from "lucide-react"
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

export function Sidebar() {
  const pathname = usePathname()

  // Hide the sidebar if the current route is professor-setup or student path
  if (pathname === '/professor-setup' || pathname.startsWith('/student')) {
    return null;
  }

  const SidebarItems = (
    <>
      <SidebarHeader>
        <Link href="/" className="hover:opacity-80">
          <h2 className="text-xl font-bold">Teacher's Pet</h2>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith("/assignments")}>
              <Link href="/assignments">
                <BookOpen className="mr-2 h-4 w-4" />
                <span>Assignments</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith("/lectures")}>
              <Link href="/lectures">
                <Video className="mr-2 h-4 w-4" />
                <span>Lectures</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/sessions"}>
              <Link href="/sessions">
                <BookOpen className="mr-2 h-4 w-4" />
                <span>Sessions</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/profile"}>
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/announcements"}>
              <Link href="/announcements">
                <Bell className="mr-2 h-4 w-4" />
                <span>Announcements</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
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
