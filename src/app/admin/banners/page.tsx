
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BannersList } from "./_components/banners-list";
import { AddBannerForm } from "./_components/add-banner-form";


export default function AdminBannersPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Banners</h1>

            <div className="grid gap-6 md:grid-cols-2">
                 <Card>
                    <CardHeader>
                        <CardTitle>Añadir Nuevo Banner</CardTitle>
                        <CardDescription>
                            Crea un nuevo banner usando una URL para la imagen.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AddBannerForm />
                    </CardContent>
                </Card>
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
    )
}
