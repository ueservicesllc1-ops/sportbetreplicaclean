
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AssetUploadForm } from "./_components/asset-upload-form";
import { getPenaltyGameAssets, getLobbyAssets } from "./actions";
import { LobbyAssetsForm } from "./_components/lobby-assets-form";


const assetsToManage = [
    { key: 'background', title: 'Imagen de Fondo/Portería', description: 'La imagen principal de la portería y el campo.' },
    { key: 'ball', title: 'Imagen del Balón', description: 'La pelota que se patea.' },
    { key: 'keeper_standing', title: 'Portero (parado inicial)', description: 'El portero en su posición inicial antes del disparo.' },
    { key: 'keeper_flying', title: 'Portero (volando y atajando)', description: 'Imagen del portero cuando ataja el balón.' },
    { key: 'keeper_miss', title: 'Portero (volando sin atajar)', description: 'Imagen del portero cuando se lanza pero no ataja (gol).' },
]

export default async function AdminGameAssetsPage() {
    const currentAssets = await getPenaltyGameAssets();
    const lobbyAssets = await getLobbyAssets();

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Recursos de Juegos</h1>

            <LobbyAssetsForm currentImages={lobbyAssets} />
            
            <Card>
                <CardHeader>
                    <CardTitle>Juego: Tanda de Penales</CardTitle>
                    <CardDescription>
                       Gestiona las imágenes utilizadas en el juego de penales. Sube archivos PNG con fondo transparente para mejores resultados.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {assetsToManage.map(asset => (
                        <AssetUploadForm 
                            key={asset.key}
                            assetKey={asset.key}
                            title={asset.title}
                            description={asset.description}
                            currentImageUrl={currentAssets[asset.key] as string || null}
                        />
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

    
