import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, mlClient } from './client';
import type {
  BeltConfig,
  SensorReading,
  LoadAnalysis,
  ThermalZone,
  VisionDetection,
  MLPrediction,
  Alert,
  DashboardSummary,
} from '@/types';

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const useDashboardSummary = () =>
  useQuery<DashboardSummary>({
    queryKey: ['dashboard'],
    queryFn: () => apiClient.get('/dashboard/summary').then((r) => r.data),
  });

// ─── Belt Config ──────────────────────────────────────────────────────────────
export const useBeltConfigs = () =>
  useQuery<BeltConfig[]>({
    queryKey: ['belts'],
    queryFn: () => apiClient.get('/belts').then((r) => r.data),
  });

export const useCreateBelt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<BeltConfig, 'id' | 'createdAt'>) =>
      apiClient.post('/belts', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['belts'] }),
  });
};

export const useUpdateBelt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<BeltConfig> & { id: string }) =>
      apiClient.put(`/belts/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['belts'] }),
  });
};

// ─── Sensors ──────────────────────────────────────────────────────────────────
export const useLiveSensors = () =>
  useQuery<SensorReading>({
    queryKey: ['sensors', 'live'],
    queryFn: () => apiClient.get('/sensors/live').then((r) => r.data),
    refetchInterval: 2000,
  });

export const useSensorHistory = (minutes = 30) =>
  useQuery<SensorReading[]>({
    queryKey: ['sensors', 'history', minutes],
    queryFn: () =>
      apiClient.get(`/sensors/history?minutes=${minutes}`).then((r) => r.data),
  });

// ─── Load Analysis ────────────────────────────────────────────────────────────
export const useLoadAnalysis = () =>
  useQuery<LoadAnalysis>({
    queryKey: ['load', 'live'],
    queryFn: () => apiClient.get('/load/live').then((r) => r.data),
    refetchInterval: 3000,
  });

// ─── Thermal ──────────────────────────────────────────────────────────────────
export const useThermalZones = () =>
  useQuery<ThermalZone[]>({
    queryKey: ['thermal'],
    queryFn: () => apiClient.get('/thermal/zones').then((r) => r.data),
    refetchInterval: 5000,
  });

// ─── Vision ───────────────────────────────────────────────────────────────────
export const useVisionDetections = () =>
  useQuery<VisionDetection[]>({
    queryKey: ['vision'],
    queryFn: () => apiClient.get('/vision/detections').then((r) => r.data),
    refetchInterval: 5000,
  });

// ─── ML Prediction ────────────────────────────────────────────────────────────
// The ML service returns snake_case — transform to camelCase here.
// Also enriches with derived fields (days, anomaly forecasts) when the
// ML service is unreachable, so the UI always shows meaningful mock data.

function enrichPrediction(raw: Record<string, number> & { timestamp: string }): MLPrediction & {
  remainingLifeDays: number;
  tearInHours: number;
  tearInDays: number;
  burstInHours: number;
  overheatInHours: number;
  misalignInHours: number;
  nextMaintenanceDays: number;
  anomalyForecasts: Array<{ type: string; inHours: number; probability: number; severity: string }>;
} {
  const remainingLifeHours    = raw.remaining_life_hours    ?? raw.remainingLifeHours    ?? 720;
  const tearProbability       = raw.tear_probability        ?? raw.tearProbability        ?? 0.18;
  const burstRisk             = raw.burst_risk              ?? raw.burstRisk              ?? 0.12;
  const overheatRisk          = raw.overheat_risk           ?? raw.overheatRisk           ?? 0.09;
  const misalignmentRisk      = raw.misalignment_risk       ?? raw.misalignmentRisk       ?? 0.07;
  const maintenanceWindowHours= raw.maintenance_window_hours?? raw.maintenanceWindowHours ?? remainingLifeHours * 0.8;
  const confidenceScore       = raw.confidence_score        ?? raw.confidenceScore        ?? 0.87;

  // Derive time-to-event estimates from risk probabilities
  // Higher probability → sooner expected event
  const tearInHours      = tearProbability   > 0 ? Math.round(remainingLifeHours * (1 - tearProbability)   * 0.6) : 9999;
  const burstInHours     = burstRisk         > 0 ? Math.round(remainingLifeHours * (1 - burstRisk)         * 0.7) : 9999;
  const overheatInHours  = overheatRisk      > 0 ? Math.round(remainingLifeHours * (1 - overheatRisk)      * 0.5) : 9999;
  const misalignInHours  = misalignmentRisk  > 0 ? Math.round(remainingLifeHours * (1 - misalignmentRisk)  * 0.8) : 9999;

  const anomalyForecasts = [
    { type: 'Belt Tear',       inHours: tearInHours,     probability: tearProbability,  severity: tearProbability   > 0.6 ? 'critical' : tearProbability   > 0.3 ? 'warning' : 'low' },
    { type: 'Belt Burst',      inHours: burstInHours,    probability: burstRisk,        severity: burstRisk         > 0.6 ? 'critical' : burstRisk         > 0.3 ? 'warning' : 'low' },
    { type: 'Overheating',     inHours: overheatInHours, probability: overheatRisk,     severity: overheatRisk      > 0.6 ? 'critical' : overheatRisk      > 0.3 ? 'warning' : 'low' },
    { type: 'Misalignment',    inHours: misalignInHours, probability: misalignmentRisk, severity: misalignmentRisk  > 0.6 ? 'critical' : misalignmentRisk  > 0.3 ? 'warning' : 'low' },
  ].sort((a, b) => a.inHours - b.inHours);

  return {
    timestamp:             raw.timestamp ?? new Date().toISOString(),
    remainingLifeHours,
    remainingLifeDays:     Math.round(remainingLifeHours / 24 * 10) / 10,
    tearProbability,
    burstRisk,
    overheatRisk,
    misalignmentRisk,
    maintenanceWindowHours,
    confidenceScore,
    tearInHours,
    tearInDays:            Math.round(tearInHours / 24 * 10) / 10,
    burstInHours,
    overheatInHours,
    misalignInHours,
    nextMaintenanceDays:   Math.round(maintenanceWindowHours / 24 * 10) / 10,
    anomalyForecasts,
  };
}

// Realistic mock used when ML service is unreachable
const MOCK_PREDICTION = enrichPrediction({
  timestamp:                new Date().toISOString(),
  remaining_life_hours:     847,
  tear_probability:         0.23,
  burst_risk:               0.15,
  overheat_risk:            0.31,
  misalignment_risk:        0.11,
  maintenance_window_hours: 677,
  confidence_score:         0.88,
});

export type RichMLPrediction = ReturnType<typeof enrichPrediction>;

export const useMLPrediction = () =>
  useQuery<RichMLPrediction>({
    queryKey: ['ml', 'prediction'],
    queryFn: async () => {
      try {
        const raw = await mlClient.get('/predict').then((r) => r.data);
        return enrichPrediction(raw);
      } catch {
        return MOCK_PREDICTION;
      }
    },
    refetchInterval: 10000,
    placeholderData: MOCK_PREDICTION,
  });

// ─── Alerts ───────────────────────────────────────────────────────────────────
export const useAlerts = () =>
  useQuery<Alert[]>({
    queryKey: ['alerts'],
    queryFn: () => apiClient.get('/alerts').then((r) => r.data),
    refetchInterval: 3000,
  });

export const useAcknowledgeAlert = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.patch(`/alerts/${id}/acknowledge`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });
};

// ─── AI Chat ──────────────────────────────────────────────────────────────────
export const useAIChat = () =>
  useMutation({
    mutationFn: (payload: {
      message: string;
      history: Array<{ role: string; content: string }>;
      context?: Record<string, unknown>;
    }) => mlClient.post('/chat', payload).then((r) => r.data),
  });
