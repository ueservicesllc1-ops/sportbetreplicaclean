
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { UsersTable } from "@/components/admin/users-table";


export default function AdminUsersPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold tracking-tight mb-6">Gestión de Usuarios</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Todos los Usuarios</CardTitle>
                    <CardDescription>
                       Aquí puedes ver y gestionar todos los usuarios registrados en la plataforma.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <UsersTable />
                </CardContent>
            </Card>
        </div>
    )
}
