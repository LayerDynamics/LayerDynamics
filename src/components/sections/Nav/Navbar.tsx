
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuIndicator,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    NavigationMenuViewport,
} from "@/components/ui/navigation-menu";

const Navbar = () => {
return (
    <header className="py-4">
        <div className="container mx-auto flex items-center justify-between">
            <div className="logo">
                <a href="/" className="text-xl font-bold">
                    LayerDynamics
                </a>
            </div>
            
            <NavigationMenu>
                <NavigationMenuList>
                    <NavigationMenuItem>
                        <NavigationMenuTrigger>Item One</NavigationMenuTrigger>
                        <NavigationMenuContent>
                            <NavigationMenuLink>Link</NavigationMenuLink>
                        </NavigationMenuContent>
                    </NavigationMenuItem>
                    
                    <NavigationMenuItem>
                        <NavigationMenuTrigger>About</NavigationMenuTrigger>
                        <NavigationMenuContent>
                            <ul className="grid gap-3 p-4 w-[400px]">
                                <li>
                                    <NavigationMenuLink href="/about">Our Story</NavigationMenuLink>
                                </li>
                                <li>
                                    <NavigationMenuLink href="/team">Team</NavigationMenuLink>
                                </li>
                            </ul>
                        </NavigationMenuContent>
                    </NavigationMenuItem>
                    
                    <NavigationMenuItem>
                        <NavigationMenuLink href="/contact" className="block py-2 px-3">
                            Contact
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                    
                    {/* Add NavigationMenuIndicator to show the active menu item */}
                    <NavigationMenuIndicator />
                </NavigationMenuList>
                
                {/* Add NavigationMenuViewport for displaying dropdown content */}
                <NavigationMenuViewport />
            </NavigationMenu>
        </div>
    </header>
);
};

export default Navbar;