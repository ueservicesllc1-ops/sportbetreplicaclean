

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BannersList } from "./_components/banners-list";
import { AddBannerForm } from "./_components/add-banner-form";


export default function AdminBannersPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Banners</h1>
            
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
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
                <div>
                     <Card>
                        <CardHeader>
                            <CardTitle>Añadir Nuevo Banner</CardTitle>
                            <CardDescription>
                                Sube una nueva imagen para el carrusel de promociones.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AddBannerForm />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
