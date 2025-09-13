
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Home, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "../ui/badge";
import { Logo } from "../logo";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { useAuth } from "@/contexts/auth-context";

export function AdminNav() {
    const pathname = usePathname();
    const { user } = useAuth();
    
    const navItems = [
        { href: "/admin", label: "Dashboard", icon: Home },
        { href: "/admin/users", label: "Usuarios", icon: Users },
    ]

    return (
        <div className="hidden border-r bg-muted/40 md:block">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <Link href="/admin" className="flex items-center gap-2 font-semibold">
                        <Logo className="h-6 w-auto" />
                        <span className="">Admin Panel</span>
                    </Link>
                    <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
                        <Bell className="h-4 w-4" />
                        <span className="sr-only">Toggle notifications</span>
                    </Button>
                </div>
                <div className="flex-1">
                    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                        {navItems.map(item => (
                             <Link
                                key={item.label}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname === item.href ? 'bg-muted text-primary' : ''}`}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>
                 <div className="mt-auto p-4">
                    <Card>
                        <CardHeader className="p-2 pt-0 md:p-4">
                            <CardTitle className="text-sm">Administrador</CardTitle>
                            <CardDescription className="text-xs truncate">
                                {user?.email}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                            <Link href="/">
                                 <Button size="sm" variant="outline" className="w-full">
                                    Volver al Sitio
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
