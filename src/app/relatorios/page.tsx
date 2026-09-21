import { getDashboardPayload } from "@/lib/dashboard-data";
import { RelatoriosView } from "@/components/RelatoriosView";

export const dynamic = "force-dynamic";

export default async function Page() {
  const payload = await getDashboardPayload();
  return <RelatoriosView payload={payload} />;
}
