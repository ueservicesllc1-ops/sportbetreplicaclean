

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AddBannerForm } from "./_components/add-banner-form";
import { BannersList } from "./_components/banners-list";


export default function AdminBannersPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Banners</h1>
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                     <Card>
                        <CardHeader>
                            <CardTitle>Añadir Nuevo Banner</CardTitle>
                            <CardDescription>
                            Sube una imagen y un título para el carrusel de la página principal.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AddBannerForm />
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Banners Actuales</CardTitle>
                            <CardDescription>
                            Estos son los banners que se muestran en la página de inicio.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <BannersList />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
