import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import LandingPage from '@/pages/LandingPage';
import MainDashboardPage from '@/pages/MainDashboardPage';
import DashboardPage from '@/pages/DashboardPage';
import BeltConfigPage from '@/pages/BeltConfigPage';
import SensorsPage from '@/pages/SensorsPage';
import LoadAnalysisPage from '@/pages/LoadAnalysisPage';
import ThermalPage from '@/pages/ThermalPage';
import VisionPage from '@/pages/VisionPage';
import PredictionPage from '@/pages/PredictionPage';
import AlertsPage from '@/pages/AlertsPage';
import DigitalTwinPage from '@/pages/DigitalTwinPage';
import WorkOrderPage from '@/pages/WorkOrderPage';
import VideoAnalyticsPage from '@/pages/VideoAnalyticsPage';
import PLCPage from '@/pages/PLCPage';
import SettingsPage from '@/pages/SettingsPage';
import AboutPage from '@/pages/AboutPage';
import HelpPage from '@/pages/HelpPage';

export default function App() {
  return (
    <Routes>
      {/* Landing page — outside the app shell, no sidebar/topbar */}
      <Route path="/landing" element={<LandingPage />} />

      {/* App shell — sidebar + topbar */}
      <Route path="/" element={<Layout />}>
        <Route index element={<MainDashboardPage />} />
        <Route path="dashboard"       element={<DashboardPage />} />
        <Route path="digital-twin"    element={<DigitalTwinPage />} />
        <Route path="load"            element={<LoadAnalysisPage />} />
        <Route path="sensors"         element={<SensorsPage />} />
        <Route path="thermal"         element={<ThermalPage />} />
        <Route path="vision"          element={<VisionPage />} />
        <Route path="video-analytics" element={<VideoAnalyticsPage />} />
        <Route path="prediction"      element={<PredictionPage />} />
        <Route path="alerts"          element={<AlertsPage />} />
        <Route path="work-orders"     element={<WorkOrderPage />} />
        <Route path="plc"             element={<PLCPage />} />
        <Route path="config"          element={<BeltConfigPage />} />
        <Route path="settings"        element={<SettingsPage />} />
        <Route path="about"           element={<AboutPage />} />
        <Route path="help"            element={<HelpPage />} />
      </Route>
    </Routes>
  );
}
