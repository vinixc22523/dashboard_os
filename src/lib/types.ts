export type PipefyLabel = { id: string; name: string; color: string };

export type PipefyField = { name: string; value: string };

export type PipefyCard = {
  id: string;
  title: string;
  phaseId: string;
  phaseName: string;
  labels: PipefyLabel[];
  fields: PipefyField[];
  createdAt: string;
  dueDate: string | null;
  finishedAt: string | null;
  done: boolean;
  late: boolean;
};

export type PipefyPhase = {
  id: string;
  name: string;
  done: boolean;
  cardsCount: number;
};

export type PipefyKpis = {
  total: number;
  onTime: number;
  late: number;
  avgCycleHours: number;
  conversionRate: number;
};

export type PipefySnapshot = {
  id: string;
  pipeId: string;
  pipeName: string | null;
  syncedAt: string;
  source: "manual" | "scheduled" | "demo";
  status: "success" | "error";
  errorMessage: string | null;
  kpis: PipefyKpis;
  phases: PipefyPhase[];
  cards: PipefyCard[];
};

export type MaintenanceRecord = {
  id: string;
  osNumber: string;
  title: string;
  equipment: string;
  technician: string;
  technicians: string[];
  type: string;
  maintenanceNature: string;
  isCorrective: boolean;
  priority: string;
  stopped: boolean;
  startedAt: string | null;
  endedAt: string | null;
  downtimeHours: number;
  createdAt: string;
  phaseName: string;
  done: boolean;
  late: boolean;
};

export type MaintenanceKpis = {
  totalOs: number;
  failures: number;
  downtime: number;
  mttr: number;
  mtbf: number;
  availability: number;
  operatingHours: number;
};

export type EquipmentMetric = {
  equipment: string;
  os: number;
  failures: number;
  downtime: number;
  mttr: number;
  availability: number;
};

export type DashboardPayload = {
  configured: boolean;
  demo: boolean;
  pipeId: string | null;
  snapshot: PipefySnapshot | null;
};
