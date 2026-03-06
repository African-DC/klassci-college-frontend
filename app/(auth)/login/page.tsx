import { auth } from "@/auth"
import { redirect } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LoginForm } from "@/components/forms/LoginForm"

export default async function LoginPage() {
  const session = await auth()

  if (session?.user && !session.error) {
    const portal = session.user.role ?? "admin"
    redirect(`/${portal}/dashboard` as never)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">KLASSCI Coll&egrave;ge</CardTitle>
        <CardDescription>
          Connectez-vous pour acc&eacute;der &agrave; votre espace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  )
}
