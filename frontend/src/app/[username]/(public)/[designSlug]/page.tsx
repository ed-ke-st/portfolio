import { redirect } from "next/navigation";

export default async function DesignDirectDetailPage({
  params,
}: {
  params: Promise<{ username: string; designSlug: string }>;
}) {
  const { designSlug } = await params;
  redirect(`./designs/${designSlug}`);
}
