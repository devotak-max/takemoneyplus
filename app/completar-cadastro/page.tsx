import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import CompleteProfileForm from "@/app/components/CompleteProfileForm";

export default function CompletarCadastroPage() {
  const user = getCurrentUser();
  if (!user) redirect("/entrar");
  if (user.cpf && user.phone && user.city) redirect("/descobrir");

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight text-ink">
        Falta pouco, {user.fullName.split(" ")[0]}
      </h1>
      <p className="mt-2 text-sm text-ink-muted">
        Para começar a operar, precisamos de CPF e telefone. São exigidos pela
        regulamentação do Banco Central para câmbio entre pessoas.
      </p>
      <div className="mt-6">
        <CompleteProfileForm defaultCity={user.city ?? ""} />
      </div>
    </main>
  );
}
