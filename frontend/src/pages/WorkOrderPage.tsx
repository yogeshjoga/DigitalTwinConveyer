import WorkOrderAssignment from "@/components/maintenance/WorkOrderAssignment";
import { useMLPrediction } from "@/api/hooks";
import { useBeltStore } from "@/store/useBeltStore";
import { Wrench } from "lucide-react";

export default function WorkOrderPage() {
  const { data: pred } = useMLPrediction();
  const selectedBelt   = useBeltStore((s) => s.selectedBeltEntry);

  const topAnomaly =
    pred?.anomalyForecasts && pred.anomalyForecasts.length > 0
      ? pred.anomalyForecasts.reduce((a, b) => (a.probability > b.probability ? a : b)).type
      : "General Maintenance";

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Work Orders</h1>
          <p className="text-secondary text-sm mt-1">
            Assign maintenance tasks to engineers and notify via your preferred channels
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: "#27a37222", color: "#27a372", border: "1px solid #27a37244" }}
        >
          <Wrench size={12} />
          {selectedBelt.name} · {selectedBelt.id}
        </div>
      </div>

      <WorkOrderAssignment
        beltName={selectedBelt.name}
        beltId={selectedBelt.id}
        anomalyType={topAnomaly}
        nextMaintenanceDays={pred?.nextMaintenanceDays ?? 7}
      />
    </div>
  );
}
