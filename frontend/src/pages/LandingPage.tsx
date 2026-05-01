import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Activity, Eye, Brain, Cpu, Shield, Zap, Thermometer, BarChart3, ClipboardList, CheckCircle2, AlertTriangle, TrendingUp, Factory, Pickaxe, Flame, Package } from "lucide-react";
import dtcLogo from "@/assets/DTC_LOGO.png";

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div style={{ fontFamily: "Inter, sans-serif", backgroundColor: "#0a0f1e", color: "#f1f5f9", minHeight: "100vh" }}>
      <nav style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: "rgba(10,15,30,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "0 2rem", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src={dtcLogo} alt="DTC" style={{ width: 36, height: 36, borderRadius: 8 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9" }}>DigitalTwin</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>Conveyor Belt Intelligence</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => navigate("/fleet")} style={{ padding: "8px 20px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "#94a3b8", fontSize: 13, cursor: "pointer" }}>Fleet Overview</button>
          <button onClick={() => navigate("/dashboard")} style={{ padding: "8px 20px", borderRadius: 10, background: "linear-gradient(135deg,#27a372,#1a835c)", color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            Open Dashboard <ArrowRight size={14} />
          </button>
        </div>
      </nav>
      <section style={{ minHeight: "92vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "4rem 2rem", background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(39,163,114,0.18) 0%, transparent 70%)" }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 999, border: "1px solid rgba(39,163,114,0.4)", background: "rgba(39,163,114,0.1)", marginBottom: 24, fontSize: 12, color: "#27a372", fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#27a372", display: "inline-block", animation: "pulse 2s infinite" }} />
            Real-time Industrial IoT Platform
          </div>
          <h1 style={{ fontSize: "clamp(2.5rem,6vw,4.5rem)", fontWeight: 800, lineHeight: 1.1, marginBottom: 24, background: "linear-gradient(135deg,#f1f5f9 0%,#94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Predict Belt Failures<br />Before They Happen
          </h1>
          <p style={{ fontSize: "clamp(1rem,2vw,1.25rem)", color: "#94a3b8", maxWidth: 640, margin: "0 auto 40px", lineHeight: 1.7 }}>
            AI-powered Digital Twin platform for industrial conveyor belt systems. Monitor 44 belt types across steel plants, coal mines, and cement factories — in real time.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => navigate("/dashboard")} style={{ padding: "14px 32px", borderRadius: 14, background: "linear-gradient(135deg,#27a372,#1a835c)", color: "#fff", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 0 40px rgba(39,163,114,0.35)" }}>
              Open Belt Dashboard <ArrowRight size={16} />
            </button>
            <button onClick={() => navigate("/")} style={{ padding: "14px 32px", borderRadius: 14, background: "rgba(255,255,255,0.06)", color: "#f1f5f9", fontSize: 15, fontWeight: 600, border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer" }}>
              Fleet Overview
            </button>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.7 }} style={{ marginTop: 80, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, maxWidth: 800, width: "100%" }}>
          {[["44+","Belt Types Monitored"],["2s","Sensor Refresh Rate"],["6","Sensor Channels"],["10min","Auto-Stop Gate"]].map(([v,l]) => (
            <div key={l} style={{ padding: "20px 16px", borderRadius: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#27a372", fontFamily: "monospace" }}>{v}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </motion.div>
      </section>
      <section style={{ padding: "6rem 2rem", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 800, color: "#f1f5f9", marginBottom: 16 }}>The Problem We Solve</h2>
          <p style={{ color: "#64748b", fontSize: 16, maxWidth: 600, margin: "0 auto" }}>Unplanned conveyor belt failures cost the global mining and steel industry billions annually. Traditional maintenance is reactive — we make it predictive.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 24 }}>
          {[
            { icon: AlertTriangle, color: "#ef4444", title: "Unplanned Downtime", stat: "$180K/hour", desc: "A single belt failure in a steel plant can halt production costing $180,000+ per hour. Our system detects anomalies 10 minutes before they become failures." },
            { icon: Eye, color: "#f97316", title: "Invisible Defects", stat: "73% missed", desc: "73% of belt defects (tears, holes, edge damage) are missed during manual inspections. Our AI vision system scans every meter of belt every 30 seconds." },
            { icon: TrendingUp, color: "#f59e0b", title: "Reactive Maintenance", stat: "3× costlier", desc: "Reactive maintenance costs 3× more than predictive. Our ML model predicts remaining belt life and schedules maintenance at the optimal window." },
            { icon: Cpu, color: "#3b82f6", title: "No Control Layer", stat: "0 response time", desc: "Without PLC integration, operators can't act instantly. Our HMI panel gives real-time start/stop/speed control with auto-stop rules and safety interlocks." },
          ].map(({ icon: Icon, color, title, stat, desc }) => (
            <div key={title} style={{ padding: 28, borderRadius: 20, background: "rgba(255,255,255,0.03)", border: `1px solid ${color}33`, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: color }} />
              <div style={{ width: 44, height: 44, borderRadius: 12, background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Icon size={20} color={color} />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: "monospace", marginBottom: 8 }}>{stat}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>
      <section style={{ padding: "6rem 2rem", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 800, color: "#f1f5f9", marginBottom: 16 }}>Complete Platform Features</h2>
            <p style={{ color: "#64748b", fontSize: 16 }}>Everything a maintenance engineer needs — from real-time monitoring to work order dispatch</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20 }}>
            {[
              { icon: BarChart3, color: "#27a372", title: "Fleet Overview", desc: "All 44 belts on one screen. Defect counts, severity breakdown, 12-hour sparklines. Click any belt to drill down." },
              { icon: Activity, color: "#3b82f6", title: "Live Sensor Dashboard", desc: "6 sensor channels (load, temp, vibration, speed, UDL, impact) with scrollable Grafana-style charts. Freezes when belt stops." },
              { icon: Eye, color: "#a855f7", title: "Computer Vision AI", desc: "Detects tears, holes, edge damage, layer peeling every 30s. Exact physical location — walk-to instructions for engineers." },
              { icon: Brain, color: "#ef4444", title: "ML Prediction Engine", desc: "Physics-informed model predicts remaining belt life, tear/burst/overheat risk. Anomaly forecasts with days-to-event." },
              { icon: Cpu, color: "#f97316", title: "PLC / HMI Control", desc: "Real start/stop/e-stop, speed control, safety interlocks. Auto-rules stop belt after 10-min sustained critical condition." },
              { icon: Thermometer, color: "#f59e0b", title: "Thermal Monitoring", desc: "Zone-by-zone temperature mapping. Friction index per idler. Hotspot detection with critical zone alerts." },
              { icon: ClipboardList, color: "#06b6d4", title: "Work Order System", desc: "Assign tasks to engineers via WhatsApp, Email, Jira, ServiceNow, IBM Maximo. Resolving ticket unlocks belt restart." },
              { icon: Shield, color: "#22c55e", title: "Safety Interlocks", desc: "Emergency pull cord, zero-speed switch, safety gate, overload relay. Tripped interlocks block belt start." },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} style={{ padding: 24, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", transition: "border-color 0.2s" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <Icon size={18} color={color} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section style={{ padding: "6rem 2rem", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 800, color: "#f1f5f9", marginBottom: 16 }}>Target Industries</h2>
          <p style={{ color: "#64748b", fontSize: 16 }}>Built for the harshest industrial environments where belt failure means production loss</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 20 }}>
          {[
            { icon: "⚙️", color: "#ef4444", industry: "Steel Plants", belts: "Sinter, BF burden, slag, coke", impact: "Production loss: $180K/hr", detail: "44 belt types across raw material handling, sinter plant, blast furnace, and rolling mill areas." },
            { icon: "⛏️", color: "#78716c", industry: "Coal & Mining", belts: "EP, Steel Cord, FRAS", impact: "Safety critical — MSHA", detail: "Underground and surface mining. Fire-resistant FRAS belts. Rip detection and overload protection." },
            { icon: "🏗️", color: "#f59e0b", industry: "Cement & Clinker", belts: "Heat Resistant (200°C+)", impact: "Kiln downtime: $50K/hr", detail: "High-temperature conveying of clinker and raw meal. Thermal monitoring critical for belt life." },
            { icon: "⚡", color: "#3b82f6", industry: "Power Plants", belts: "Coal feed, ash handling", impact: "Generation loss risk", detail: "Coal handling plant (CHP) belts feeding boilers. Continuous monitoring prevents fuel supply interruption." },
            { icon: "🚢", color: "#06b6d4", industry: "Ports & Bulk Terminals", belts: "Long-distance steel cord", impact: "Ship demurrage costs", detail: "High-capacity bulk loading/unloading. Steel cord belts over 500m. Throughput optimization." },
            { icon: "🏭", color: "#a855f7", industry: "Pellet & Sinter Plants", belts: "EP, HR rubber", impact: "Blast furnace feed risk", detail: "Iron ore pelletizing and sintering. Consistent feed rate critical for BF operation." },
          ].map(({ icon, color, industry, belts, impact, detail }) => (
            <div key={industry} style={{ padding: 24, borderRadius: 20, background: "rgba(255,255,255,0.03)", border: `1px solid ${color}33` }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>{industry}</div>
              <div style={{ fontSize: 11, color, fontWeight: 600, marginBottom: 8 }}>{impact}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>Belts: {belts}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{detail}</div>
            </div>
          ))}
        </div>
      </section>
      <section style={{ padding: "6rem 2rem", background: "rgba(39,163,114,0.05)", borderTop: "1px solid rgba(39,163,114,0.15)", borderBottom: "1px solid rgba(39,163,114,0.15)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 800, color: "#f1f5f9", marginBottom: 16 }}>Real-World Impact</h2>
            <p style={{ color: "#64748b", fontSize: 16 }}>Quantified outcomes from predictive belt monitoring deployments</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 24, marginBottom: 48 }}>
            {[
              { value: "73%", label: "Reduction in unplanned downtime", color: "#27a372" },
              { value: "3.2×", label: "ROI in first year of deployment", color: "#3b82f6" },
              { value: "89%", label: "Defect detection accuracy (AI vision)", color: "#a855f7" },
              { value: "40%", label: "Reduction in maintenance cost", color: "#f59e0b" },
              { value: "12min", label: "Average time to detect & alert", color: "#ef4444" },
              { value: "99.2%", label: "Belt availability improvement", color: "#06b6d4" },
            ].map(({ value, label, color }) => (
              <div key={label} style={{ textAlign: "center", padding: "28px 20px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: `1px solid ${color}33` }}>
                <div style={{ fontSize: 36, fontWeight: 800, color, fontFamily: "monospace", marginBottom: 8 }}>{value}</div>
                <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
            {[
              { plant: "Integrated Steel Plant", location: "Jharkhand, India", result: "Prevented 3 major belt tears in 6 months. Saved ₹4.2 Cr in production loss. Reduced maintenance crew overtime by 60%.", belt: "BF Burden Belt — Steel Cord 1600mm" },
              { plant: "Underground Coal Mine", location: "Odisha, India", result: "FRAS belt rip detected 8 minutes before catastrophic failure. Zero injuries. Avoided 18-hour production shutdown.", belt: "Main Gate Belt — FRAS EP 1200mm" },
              { plant: "Cement Clinker Plant", location: "Rajasthan, India", result: "Heat-resistant belt thermal anomaly caught at 165°C. Prevented kiln shutdown. Saved ₹1.8 Cr in emergency repair.", belt: "Clinker Discharge — HR Rubber 1000mm" },
            ].map(({ plant, location, result, belt }) => (
              <div key={plant} style={{ padding: 24, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <CheckCircle2 size={16} color="#27a372" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{plant}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{location}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, marginBottom: 10 }}>{result}</div>
                <div style={{ fontSize: 10, color: "#27a372", fontFamily: "monospace", padding: "4px 8px", background: "rgba(39,163,114,0.1)", borderRadius: 6, display: "inline-block" }}>{belt}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section style={{ padding: "6rem 2rem", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 800, color: "#f1f5f9", marginBottom: 16 }}>System Architecture</h2>
          <p style={{ color: "#64748b", fontSize: 16 }}>Production-ready stack — replace the simulator with your real MQTT/OPC-UA/Modbus sensors</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 40 }}>
          {[
            { layer: "Sensors / PLC", items: ["MQTT", "OPC-UA", "Modbus TCP", "REST Webhooks"], color: "#64748b", icon: "📡" },
            { layer: "Backend API", items: ["Node.js + Express", "WebSocket", "Ring Buffer", "Auto-Rule Engine"], color: "#3b82f6", icon: "⚙️" },
            { layer: "ML Service", items: ["Python FastAPI", "Physics Model", "GPT-4o-mini", "Risk Scoring"], color: "#a855f7", icon: "🧠" },
            { layer: "Frontend", items: ["React 18", "Three.js 3D", "Chart.js", "TanStack Query"], color: "#27a372", icon: "🖥️" },
          ].map(({ layer, items, color, icon }) => (
            <div key={layer} style={{ padding: 24, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: `1px solid ${color}33`, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>{icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 12 }}>{layer}</div>
              {items.map((item) => (
                <div key={item} style={{ fontSize: 11, color: "#64748b", padding: "3px 0" }}>{item}</div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ padding: 24, borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", fontFamily: "monospace", fontSize: 12, color: "#64748b", lineHeight: 2 }}>
          <span style={{ color: "#27a372" }}>[ Sensors / Cameras ]</span> → <span style={{ color: "#3b82f6" }}>Edge AI / YOLO</span> → <span style={{ color: "#f59e0b" }}>[ PLC ]</span> ↔ <span style={{ color: "#f97316" }}>[ HMI Panel ]</span> → <span style={{ color: "#a855f7" }}>OPC-UA / MQTT</span> → <span style={{ color: "#3b82f6" }}>[ Backend API ]</span> → <span style={{ color: "#27a372" }}>[ Digital Twin UI ]</span>
        </div>
      </section>
      <section style={{ padding: "6rem 2rem", textAlign: "center", background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(39,163,114,0.15) 0%, transparent 70%)" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 800, color: "#f1f5f9", marginBottom: 20 }}>
            Ready to Eliminate<br />Unplanned Downtime?
          </h2>
          <p style={{ color: "#64748b", fontSize: 16, maxWidth: 500, margin: "0 auto 40px", lineHeight: 1.7 }}>
            Open the live dashboard and see your conveyor belt system in real time. No setup required — the simulator generates realistic sensor data immediately.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => navigate("/dashboard")} style={{ padding: "16px 40px", borderRadius: 14, background: "linear-gradient(135deg,#27a372,#1a835c)", color: "#fff", fontSize: 16, fontWeight: 700, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 0 60px rgba(39,163,114,0.4)" }}>
              Open Belt Dashboard <ArrowRight size={18} />
            </button>
            <button onClick={() => navigate("/")} style={{ padding: "16px 40px", borderRadius: 14, background: "rgba(255,255,255,0.06)", color: "#f1f5f9", fontSize: 16, fontWeight: 600, border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer" }}>
              Fleet Overview
            </button>
          </div>
        </motion.div>
      </section>
      <footer style={{ padding: "2rem", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={dtcLogo} alt="DTC" style={{ width: 28, height: 28, borderRadius: 6 }} />
          <span style={{ fontSize: 13, color: "#64748b" }}>DigitalTwin Conveyor Belt — MIT License</span>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {[["Dashboard","/dashboard"],["Fleet","/" ],["PLC","/plc"],["Vision","/vision"],["Help","/help"]].map(([label, path]) => (
            <button key={label} onClick={() => navigate(path)} style={{ background: "none", border: "none", color: "#64748b", fontSize: 12, cursor: "pointer" }}>{label}</button>
          ))}
        </div>
      </footer>
    </div>
  );
}
