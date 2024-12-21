import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import Link from "next/link"

export default function Header() {
  return (
    <header className="w-full bg-black border-b border-gray-800 py-4 font-['Verdana','Arial',sans-serif]">
      <NavigationMenu>
        <NavigationMenuList className="gap-3">
          <NavigationMenuItem className="ml-4">
            <Link href="/" legacyBehavior passHref>
              <NavigationMenuLink className={`${navigationMenuTriggerStyle()} bg-gray-800 text-white hover:text-primary transition-colors duration-200 font-medium`}>
                Obstacle Avoidance
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/warning-system" legacyBehavior passHref>
              <NavigationMenuLink className={`${navigationMenuTriggerStyle()} bg-gray-800 text-white hover:text-primary transition-colors duration-200 font-medium`}>
                Warning System
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
}