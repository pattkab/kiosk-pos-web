import { redirect } from "next/navigation";

type RegisterPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = (await searchParams) ?? {};
  const next = typeof params.next === "string" ? params.next : undefined;
  const query = new URLSearchParams({ mode: "create" });
  if (next) query.set("next", next);
  redirect(`/login?${query.toString()}`);
}
