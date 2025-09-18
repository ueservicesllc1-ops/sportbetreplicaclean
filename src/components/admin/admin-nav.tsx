

'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Home, Users, Wallet, Image as ImageIcon, ArrowDownUp, ShieldCheck, ImageUp, Banknote, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "../ui/badge";
import { Logo } from "../logo";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function AdminNav() {
    const pathname = usePathname();
    const { user, isAdmin, isSuperAdmin } = useAuth();
    const [pendingVerifications, setPendingVerifications] = useState(0);
    const [pendingDeposits, setPendingDeposits] = useState(0);

    useEffect(() => {
        if (!isAdmin) return;

        const verificationsQuery = query(collection(db, 'users'), where('verificationStatus', '==', 'pending'));
        const depositsQuery = query(collection(db, 'deposit_notifications'), where('status', '==', 'pending'));

        const unsubVerifications = onSnapshot(verificationsQuery, (snapshot) => {
            setPendingVerifications(snapshot.size);
        });
        
        const unsubDeposits = onSnapshot(depositsQuery, (snapshot) => {
            setPendingDeposits(snapshot.size);
        });

        return () => {
            unsubVerifications();
            unsubDeposits();
        };
    }, [isAdmin]);
    
    const navItems = [
        { href: "/admin", label: "Dashboard", icon: Home, requiredRole: 'admin' },
        { href: "/admin/users", label: "Usuarios", icon: Users, requiredRole: 'admin' },
        { href: "/admin/verifications", label: "Verificaciones", icon: ShieldCheck, requiredRole: 'admin', badge: pendingVerifications > 0 ? pendingVerifications : null },
        { href: "/admin/deposits", label: "Depósitos", icon: Inbox, requiredRole: 'superadmin', badge: pendingDeposits > 0 ? pendingDeposits : null },
        { href: "/admin/wallets", label: "Billeteras", icon: Wallet, requiredRole: 'superadmin' },
        { href: "/admin/withdrawals", label: "Retiros", icon: ArrowDownUp, requiredRole: 'superadmin' },
        { href: "/admin/banners", label: "Banners", icon: ImageIcon, requiredRole: 'admin' },
        { href: "/admin/game-assets", label: "Recursos Juegos", icon: ImageUp, requiredRole: 'admin' },
        { href: "/admin/banking", label: "Datos Bancarios", icon: Banknote, requiredRole: 'superadmin' },
    ];

    const canSeeSuperAdminItems = isSuperAdmin;
    const filteredNavItems = navItems.filter(item => {
        if (item.requiredRole === 'superadmin') {
            return canSeeSuperAdminItems;
        }
        return true;
    }).sort((a, b) => {
        // Keep banking at the bottom
        if (a.href === '/admin/banking') return 1;
        if (b.href === '/admin/banking') return -1;
        // Prioritize items with badges
        if (a.badge && !b.badge) return -1;
        if (!a.badge && b.badge) return 1;
        return 0;
    });

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
                        {filteredNavItems.map(item => (
                             <Link
                                key={item.label}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname === item.href ? 'bg-muted text-primary' : ''}`}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                                {item.badge && (
                                    <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                                        {item.badge}
                                    </Badge>
                                )}
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
