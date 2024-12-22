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

export default function Header() {
  const { theme, setTheme } = useTheme()
  const navigationItems = [
    { name: 'Home', href: '/' },
    { name: 'Obstacle Avoidance', href: '/obstacle-avoidance' },
    { name: 'Warning System', href: '/warning-system' },
    { name: 'System Monitor', href: '/system' },
  ];

  return (
    <header className="w-full bg-background border-b border-border py-4 font-['Verdana','Arial',sans-serif] flex items-center justify-between">
      <NavigationMenu>
        <NavigationMenuList className="gap-3 ml-4">
          {navigationItems.map((item) => (
            <NavigationMenuItem key={item.name}>
              <Link href={item.href} legacyBehavior passHref>
                <NavigationMenuLink className={`${navigationMenuTriggerStyle()} bg-secondary text-secondary-foreground hover:text-primary transition-colors duration-200 font-medium`}>
                  {item.name}
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="p-2 rounded-md bg-secondary text-secondary-foreground mr-4 hover:bg-secondary/80 transition-colors"
      >
        {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </header>
  )
}