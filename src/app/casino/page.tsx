
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dices } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getLobbyAssets } from "../admin/game-assets/actions";


export default async function CasinoLobbyPage() {
    const lobbyAssets = await getLobbyAssets();

    const casinoGames = [
        {
            name: "Speedrun",
            description: "El juego de crash donde retiras antes de que el motor explote.",
            href: "/casino/speedrun",
            imageUrl: lobbyAssets['speedrun'] || "https://iili.io/KT1Ttt4.jpg"
        },
        {
            name: "Ruleta de la Suerte",
            description: "Apuesta a tu color favorito y gira la rueda para ganar.",
            href: "/casino/ruleta",
            imageUrl: lobbyAssets['ruleta'] || "https://iili.io/KTE7gRa.png"
        },
        {
            name: "Tanda de Penales",
            description: "Elige tu esquina y patea para ganar. ¡Gol o atajada!",
            href: "/casino/penalty-shootout",
            imageUrl: lobbyAssets['penalty_shootout'] || "https://i.postimg.cc/8PLdM9d3/penalty-shootout.jpg"
        },
        {
            name: "Campo Minado",
            description: "Descubre gemas y evita las minas para multiplicar tu apuesta.",
            href: "/casino/mines",
            imageUrl: lobbyAssets['mines'] || "https://i.postimg.cc/pX4gXyJ8/mines-game-cover.jpg"
        }
    ]

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Dices className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold tracking-tight">Casino</h1>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {casinoGames.map((game) => (
                   <Link href={game.href} key={game.name} className="group">
                     <Card className="h-full overflow-hidden transition-all group-hover:border-primary group-hover:scale-105">
                        <div className="relative aspect-[4/3] border-b">
                            <Image 
                                src={game.imageUrl}
                                alt={`Imagen del juego ${game.name}`}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover transition-transform group-hover:scale-110"
                            />
                        </div>
                        <CardHeader className="p-4">
                            <CardTitle className="text-base">{game.name}</CardTitle>
                            <CardDescription className="text-xs">{game.description}</CardDescription>
                        </CardHeader>
                    </Card>
                   </Link>
                ))}
            </div>
        </div>
    )
}
    
