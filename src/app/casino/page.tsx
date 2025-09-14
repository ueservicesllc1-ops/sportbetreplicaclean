
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dices } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const casinoGames = [
    {
        name: "Speedrun",
        description: "El juego de crash donde retiras antes de que el motor explote.",
        href: "/casino/speedrun",
        imageUrl: "https://iili.io/KT1Ttt4.jpg"
    },
    {
        name: "Ruleta de la Suerte",
        description: "Apuesta a tu color favorito y gira la rueda para ganar.",
        href: "/casino/ruleta",
        imageUrl: "https://iili.io/KTE7gRa.png"
    }
]


export default function CasinoLobbyPage() {
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Dices className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold tracking-tight">Casino</h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {casinoGames.map((game) => (
                   <Link href={game.href} key={game.name} className="group">
                     <Card className="h-full overflow-hidden transition-all group-hover:border-primary group-hover:scale-105">
                        <div className="relative aspect-[4/3]">
                            <Image 
                                src={game.imageUrl}
                                alt={`Imagen del juego ${game.name}`}
                                fill
                                className="object-cover transition-transform group-hover:scale-110"
                            />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        </div>
                        <CardHeader>
                            <CardTitle>{game.name}</CardTitle>
                            <CardDescription>{game.description}</CardDescription>
                        </CardHeader>
                    </Card>
                   </Link>
                ))}
            </div>
        </div>
    )
}

    