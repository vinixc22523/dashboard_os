import { getDashboardPayload } from "@/lib/dashboard-data";
import { DashboardView } from "@/components/DashboardView";

export const dynamic = "force-dynamic";

export default async function Page() {
  const payload = await getDashboardPayload();
  return <DashboardView payload={payload} />;
}
