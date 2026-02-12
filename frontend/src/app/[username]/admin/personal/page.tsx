import { redirect } from "next/navigation";

export default async function AdminPersonalPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  redirect(`/${username}/admin/settings?tab=personal`);
}
