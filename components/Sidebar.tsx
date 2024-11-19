/* eslint-disable @typescript-eslint/no-unused-vars */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import {MapPin, Trash, Handshake,Medal,Settings,Home, Recycle, PlayIcon} from 'lucide-react'

const sidebarItems = [
    {href: "/", label: "Home", icon: Home},
    {href: "/Reports", label: "Report Waste", icon: Recycle},
    {href: "/Collection", label: "Collect Waste", icon:Trash},
    {href: "/Rewards", label: "Rewards", icon: Handshake},
    {href: "/LeaderBoard", label:"LeaderBoard", icon: Medal},
]

interface SidebarProps{
    open: boolean;
}

export default function Sidebar({ open }: SidebarProps) {
    const  pathname = usePathname();

    return (
        <aside className={`bg-black border-r pt-20 border-green-200 text-white w-64 fixed inset-y-0 left-0 z-30 transform transition-transform duration-400 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0
        `}>
            <nav className="h-full flex flex-col justify-between">
                <div className="px-4 py-6 space-y-8">
                    {
                        sidebarItems.map((item)=> (
                            <Link href={item.href} key={item.href} passHref>
                                <Button variant={pathname === item.href ? 'secondary' : 'outline'} className={`w-full justify-start py-3 ${pathname === item.href ? "text-white bg-black" : "text-black hover:bg-green-200"} mb-2 h-10 mx-auto mt-5`}>
                                    <item.icon className="mr-3 h-5 w-5"/>
                                    <span className="text-base">{item.label}</span>
                                </Button>
                            </Link>
                        ))
                    }
                </div>

                <div className="p-4 border-t border-green-200">
                    <Link href="/Settings" passHref>
                        <Button variant={pathname === "/settings" ? 'secondary' : 'outline'} className={`w-full justify-start py-3 ${pathname === "/settings" ? "bg-green-800 text-green-800" : "text-white bg-green-800 hover:bg-green-600"}`}>
                            <Settings className="mr-3 h-5 w-5"/>
                            <span className="text-base">Settings</span>
                        </Button>
                    </Link>
                </div>
            </nav>
        </aside>
    );
}