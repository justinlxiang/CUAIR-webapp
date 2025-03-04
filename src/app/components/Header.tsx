"use client"

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import Link from "next/link"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import React from "react"
import { usePathname } from "next/navigation"

export default function Header() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const pathname = usePathname()

  // Only render theme toggle after mounting to avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const navigationItems = [
    { name: 'Home', href: '/' },
    { name: 'Obstacle Avoidance', href: '/obstacle-avoidance' },
    { name: 'Warning System', href: '/warning-system' },
    { name: 'Mapping', href: '/mapping' },
    { name: 'System Monitor', href: '/system' },
  ];

  const isActivePath = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path === '/') return false;
    return pathname.startsWith(path);
  };

  return (
    <header className="w-full bg-background border-b border-border py-4 font-['Verdana','Arial',sans-serif] flex items-center justify-between">
      <NavigationMenu>
        <NavigationMenuList className="gap-3 ml-4">
          {navigationItems.map((item) => (
            <NavigationMenuItem key={item.name}>
              <Link href={item.href} legacyBehavior passHref>
                <NavigationMenuLink 
                  className={`${navigationMenuTriggerStyle()} 
                    transition-colors 
                    duration-200 
                    font-medium
                    ${isActivePath(item.href) 
                      ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground' 
                      : 'bg-secondary text-secondary-foreground hover:bg-tertiary hover:text-tertiary-foreground'
                    }`}
                >
                  {item.name}
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
      {mounted && (
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-md bg-secondary text-secondary-foreground mr-4 hover:bg-tertiary hover:text-tertiary-foreground transition-colors"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      )}
    </header>
  )
}