import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function DevLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto max-w-4xl py-8">
       <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Volver al Inicio
       </Link>
      {children}
    </div>
  );
}
