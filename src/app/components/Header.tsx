import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import Link from "next/link"

export default function Header() {
  const navigationItems = [
    { name: 'Home', href: '/' },
    { name: 'Obstacle Avoidance', href: '/obstacle-avoidance' },
    { name: 'Warning System', href: '/warning-system' },
    { name: 'System Monitor', href: '/system' },
  ];

  return (
    <header className="w-full bg-black border-b border-gray-800 py-4 font-['Verdana','Arial',sans-serif]">
      <NavigationMenu>
        <NavigationMenuList className="gap-3 ml-4">
          {navigationItems.map((item) => (
            <NavigationMenuItem key={item.name}>
              <Link href={item.href} legacyBehavior passHref>
                <NavigationMenuLink className={`${navigationMenuTriggerStyle()} bg-gray-800 text-white hover:text-primary transition-colors duration-200 font-medium`}>
                  {item.name}
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
}