import { getDashboardPayload } from "@/lib/dashboard-data";
import { TecnicosView } from "@/components/TecnicosView";

export const dynamic = "force-dynamic";

export default async function Page() {
  const payload = await getDashboardPayload();
  return <TecnicosView payload={payload} />;
}
