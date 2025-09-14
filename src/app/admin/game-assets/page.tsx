import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AssetUploadForm } from "./_components/asset-upload-form";
import { getPenaltyGameAssets } from "./actions";


const assetsToManage = [
    { key: 'background', title: 'Imagen de Fondo/Portería', description: 'La imagen principal de la portería y el campo.' },
    { key: 'ball', title: 'Imagen del Balón', description: 'La pelota que se patea.' },
    { key: 'keeper_standing', title: 'Portero (de pie)', description: 'El portero en su posición inicial.' },
    { key: 'keeper_flying', title: 'Portero (volando/atajando)', description: 'La imagen del portero cuando se lanza a atajar.' },
]

export default async function AdminGameAssetsPage() {
    const currentAssets = await getPenaltyGameAssets();
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Recursos de Juegos</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Juego: Tanda de Penales</CardTitle>
                    <CardDescription>
                       Gestiona las imágenes utilizadas en el juego de penales. Sube archivos PNG con fondo transparente para mejores resultados.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                    {assetsToManage.map(asset => (
                        <AssetUploadForm 
                            key={asset.key}
                            assetKey={asset.key}
                            title={asset.title}
                            description={asset.description}
                            currentImageUrl={currentAssets[asset.key] || null}
                        />
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
