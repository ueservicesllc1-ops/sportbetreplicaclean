
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, BarChart3 } from "lucide-react";

const stats = [
    { title: "Usuarios Registrados", value: "1,250", icon: Users, change: "+12.5%" },
    { title: "Apuestas Totales", value: "8,420", icon: BarChart3, change: "+8.2%" },
    { title: "Depósitos Totales", value: "$45,231", icon: DollarSign, change: "+20.1%" },
]

export default function AdminPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Panel de Administración</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change} desde el último mes</p>
            </CardContent>
          </Card>
        ))}
      </div>

       <Card className="mt-8">
            <CardHeader>
                <CardTitle>Bienvenido al Panel de Administración</CardTitle>
                <CardDescription>
                    Aquí puedes gestionar los usuarios, ver estadísticas y controlar la configuración de la plataforma.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    Usa el menú de la izquierda para navegar por las diferentes secciones.
                    Esta es una versión inicial con funcionalidades básicas.
                </p>
            </CardContent>
        </Card>
    </div>
  );
}
