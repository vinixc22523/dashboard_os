import { getDashboardPayload } from "@/lib/dashboard-data";
import { ChamadosView } from "@/components/ChamadosView";

export const dynamic = "force-dynamic";

export default async function Page() {
  const payload = await getDashboardPayload();
  return <ChamadosView payload={payload} />;
}
