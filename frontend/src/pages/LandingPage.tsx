import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowRight, Activity, Eye, Brain, Cpu, Shield, Zap, Thermometer, 
  BarChart3, ClipboardList, CheckCircle2, AlertTriangle, TrendingUp, 
  Factory, Pickaxe, Flame, Package, Search, Plane, HardHat, Video, Bot, Map, Network, Sun, Moon
} from "lucide-react";
import dtcLogo from "@/assets/DTC_LOGO.png";
import ecosystemBg from "@/assets/ecosystem_bg.png";
import ecosystemBgLight from "@/assets/ecosystem_bg_light.png";
import aiVideoImg from "@/assets/ai_video_analytics.png";
import dronesImg from "@/assets/autonomous_drones.png";
import helmetsImg from "@/assets/smart_helmets.png";
import robotsImg from "@/assets/smart_robots.png";
import cadImg from "@/assets/agentic_cad.png";
import eliteImg from "@/assets/elite_ecosystem.png";
import conveyorImg from "@/assets/conveyor_dt.png";

export default function LandingPage() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const theme = isDarkMode ? {
    bg: "#0a0f1e",
    panelBg: "#111827",
    textPrimary: "#f8fafc",
    textSecondary: "#94a3b8",
    textMuted: "#64748b",
    navBg: "rgba(10,15,30,0.92)",
    borderSoft: "rgba(255,255,255,0.05)",
    borderMed: "rgba(255,255,255,0.1)",
    btnGhost: "rgba(255,255,255,0.05)",
    heroGradient: `linear-gradient(to bottom, rgba(10,15,30,0.6) 0%, rgba(10,15,30,0.8) 60%, #0a0f1e 100%)`,
    accentText: "#60a5fa",
    checkText: "#cbd5e1"
  } : {
    bg: "#f8fafc",
    panelBg: "#ffffff",
    textPrimary: "#0f172a",
    textSecondary: "#1e293b",
    textMuted: "#64748b",
    navBg: "rgba(248,250,252,0.92)",
    borderSoft: "rgba(0,0,0,0.08)",
    borderMed: "rgba(0,0,0,0.15)",
    btnGhost: "rgba(0,0,0,0.05)",
    heroGradient: `linear-gradient(to bottom, rgba(248,250,252,0.3) 0%, rgba(248,250,252,0.7) 80%, #f8fafc 100%)`,
    accentText: "#2563eb",
    checkText: "#334155"
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif", backgroundColor: theme.bg, color: theme.textPrimary, minHeight: "100vh", transition: "all 0.3s ease" }}>
      {/* NAVBAR */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: theme.navBg, backdropFilter: "blur(12px)", borderBottom: `1px solid ${theme.borderSoft}`, padding: "0 2rem", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.3s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src={dtcLogo} alt="DTC" style={{ width: 36, height: 36, borderRadius: 8 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: theme.textPrimary }}>Industry 4.0 Ecosystem</div>
            <div style={{ fontSize: 10, color: theme.textMuted }}>India's 1st IIoT Platform</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={() => setIsDarkMode(!isDarkMode)} style={{ padding: "8px", borderRadius: "50%", border: `1px solid ${theme.borderSoft}`, background: "transparent", color: theme.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={() => window.scrollTo({ top: document.getElementById('products')?.offsetTop, behavior: 'smooth' })} style={{ padding: "8px 20px", borderRadius: 10, border: `1px solid ${theme.borderMed}`, background: "transparent", color: theme.textSecondary, fontSize: 13, cursor: "pointer" }}>
            Explore Products
          </button>
          <button onClick={() => navigate("/conveyor")} style={{ padding: "8px 20px", borderRadius: 10, background: "linear-gradient(135deg,#27a372,#1a835c)", color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            Launch Digital Twin <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section style={{ 
        minHeight: "85vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "4rem 2rem", 
        backgroundImage: `${theme.heroGradient}, url(${isDarkMode ? ecosystemBg : ecosystemBgLight})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        position: "relative",
        transition: "all 0.3s ease"
      }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} style={{ position: "relative", zIndex: 10 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 999, border: "1px solid rgba(59,130,246,0.4)", background: "rgba(59,130,246,0.1)", marginBottom: 24, fontSize: 12, color: theme.accentText, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6", display: "inline-block", animation: "pulse 2s infinite" }} />
            Proudly Made In India
          </div>
          <h1 style={{ fontSize: "clamp(2.5rem,4.5vw,4rem)", fontWeight: 800, lineHeight: 1.1, marginBottom: 24, color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>
            India's 1st Industry 4.1 & 5.0<br />End-to-End IIoT Ecosystem
          </h1>
          <p style={{ fontSize: "clamp(1rem,2vw,1.25rem)", color: theme.textSecondary, maxWidth: 750, margin: "0 auto 16px", lineHeight: 1.7, fontWeight: 500 }}>
            A fully customizable smart factory architecture. We unify real-time digital twins, autonomous drones, AI video analytics, and smart robotics to automate and optimize your entire operation.
          </p>
          <div style={{ display: "inline-block", padding: "12px 24px", borderRadius: 16, background: isDarkMode ? "rgba(15,23,42,0.6)" : "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`, marginBottom: 40, boxShadow: "0 8px 32px rgba(0,0,0,0.05)" }}>
            <p style={{ fontSize: "0.95rem", color: isDarkMode ? "#60a5fa" : "#1d4ed8", fontWeight: 800, margin: 0, letterSpacing: 0.5, textTransform: "uppercase" }}>
              100% Indigenous Innovation: Every chip and system architecture is proudly designed and engineered in India.
            </p>
          </div>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => window.scrollTo({ top: document.getElementById('products')?.offsetTop, behavior: 'smooth' })} style={{ padding: "14px 32px", borderRadius: 14, background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 0 40px rgba(59,130,246,0.35)" }}>
              Explore Ecosystem <ArrowRight size={16} />
            </button>
            <button onClick={() => navigate("/conveyor")} style={{ padding: "14px 32px", borderRadius: 14, background: theme.btnGhost, color: theme.textPrimary, fontSize: 15, fontWeight: 600, border: `1px solid ${theme.borderMed}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              Open Conveyor Digital Twin <Activity size={16} color="#27a372" />
            </button>
          </div>
        </motion.div>
      </section>

      {/* PRODUCTS ECOSYSTEM */}
      <section id="products" style={{ padding: "6rem 2rem", background: theme.panelBg, borderTop: `1px solid ${theme.borderSoft}`, transition: "all 0.3s ease" }}>
        <div style={{ maxWidth: 1600, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{ fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, color: theme.textPrimary, marginBottom: 16 }}>Our Product Ecosystem</h2>
            <p style={{ color: theme.textSecondary, fontSize: 16, maxWidth: 600, margin: "0 auto" }}>Next-generation smart factory solutions ready for immediate deployment.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 40 }}>
            
            {/* 1. DIGITAL TWIN CONVEYOR BELT (Current Embedded Project) */}
            <div style={{ padding: "40px", borderRadius: 24, background: isDarkMode ? "rgba(39,163,114,0.05)" : "rgba(39,163,114,0.1)", border: "1px solid rgba(39,163,114,0.2)", position: "relative", overflow: "hidden", display: "flex", gap: 40, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: 250, height: 250, background: "radial-gradient(circle, rgba(39,163,114,0.1) 0%, transparent 70%)", zIndex: 0 }}></div>
              
              <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", gap: 24, flex: "1 1 500px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(39,163,114,0.15)", border: "1px solid rgba(39,163,114,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Activity size={32} color="#27a372" />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#27a372", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Live Embedded Project</div>
                    <h3 style={{ fontSize: 28, fontWeight: 800, color: theme.textPrimary }}>Digital Twin Conveyor Belt</h3>
                  </div>
                </div>
                <p style={{ fontSize: 16, color: theme.textSecondary, lineHeight: 1.7, maxWidth: 800 }}>
                  Predict belt failures before they happen with our AI-powered Digital Twin platform. Monitor 44 belt types across heavy industries in real time with PLC control and predictive maintenance.
                </p>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 8 }}>
                  <button onClick={() => navigate("/conveyor")} style={{ padding: "12px 24px", borderRadius: 10, background: "#27a372", color: "#fff", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                    View Project Details <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              <div style={{ position: "relative", zIndex: 10, flex: "1 1 400px", display: "flex", justifyContent: "flex-end" }}>
                <img src={conveyorImg} alt="Digital Twin Conveyor" style={{ width: "100%", maxWidth: 600, height: 260, objectFit: "cover", borderRadius: 16, boxShadow: "0 20px 40px rgba(0,0,0,0.15)", border: "1px solid rgba(39,163,114,0.2)" }} />
              </div>

            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(450px,1fr))", gap: 32 }}>
              
              {/* 2. AI Video Searching & Analytics */}
              <motion.div whileHover={{ y: -8, scale: 1.01 }} transition={{ duration: 0.2 }} style={{ padding: 32, borderRadius: 24, background: theme.panelBg, border: `1px solid ${theme.borderSoft}`, position: "relative", boxShadow: isDarkMode ? "none" : "0 4px 20px rgba(0,0,0,0.05)" }}>
                <img src={aiVideoImg} alt="AI Video Analytics" style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: 16, marginBottom: 24, border: `1px solid ${theme.borderSoft}` }} />
                <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                  <Video size={26} color="#3b82f6" />
                </div>
                <h3 style={{ fontSize: 24, fontWeight: 800, color: theme.textPrimary, marginBottom: 16 }}>AI Video Searching & Analytics</h3>
                <p style={{ fontSize: 15, color: theme.textSecondary, lineHeight: 1.7, marginBottom: 24 }}>
                  Advanced edge-computing vision models to transform raw CCTV feeds into structured safety and operational intelligence.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 500, color: theme.checkText }}>
                    <CheckCircle2 size={18} color="#3b82f6" /> PPE Detection (Hardhats, vests, glasses)
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 500, color: theme.checkText }}>
                    <CheckCircle2 size={18} color="#3b82f6" /> Smart safety engineering alerts sent directly to smart helmets
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 500, color: theme.checkText }}>
                    <CheckCircle2 size={18} color="#3b82f6" /> Easy natural language video search by frames
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 500, color: theme.checkText }}>
                    <CheckCircle2 size={18} color="#3b82f6" /> Easy object and anomaly detection
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 500, color: theme.checkText }}>
                    <CheckCircle2 size={18} color="#3b82f6" /> Vehicle detection and Automatic Number Plate Recognition (ANPR)
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 500, color: theme.checkText }}>
                    <CheckCircle2 size={18} color="#3b82f6" /> Robotic interaction through Digital Twin & IIoT
                  </div>
                </div>
              </motion.div>

              {/* 3. Autonomous Drone Technology */}
              <motion.div whileHover={{ y: -8, scale: 1.01 }} transition={{ duration: 0.2 }} style={{ padding: 32, borderRadius: 24, background: theme.panelBg, border: `1px solid ${theme.borderSoft}`, position: "relative", boxShadow: isDarkMode ? "none" : "0 4px 20px rgba(0,0,0,0.05)" }}>
                <img src={dronesImg} alt="Autonomous Drones" style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: 16, marginBottom: 24, border: `1px solid ${theme.borderSoft}` }} />
                <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                  <Plane size={26} color="#a855f7" />
                </div>
                <h3 style={{ fontSize: 24, fontWeight: 800, color: theme.textPrimary, marginBottom: 16 }}>Autonomous Drone Technology</h3>
                <p style={{ fontSize: 15, color: theme.textSecondary, lineHeight: 1.7, marginBottom: 24 }}>
                  Aerial intelligence fleet managed through our centralized command hub for heavy industries and extensive site footprints.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 500, color: theme.checkText }}>
                    <CheckCircle2 size={18} color="#a855f7" /> FPV Drones for rapid remote inspections
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 500, color: theme.checkText }}>
                    <CheckCircle2 size={18} color="#a855f7" /> 24/7 Security & Perimeter Surveillances
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 500, color: theme.checkText }}>
                    <CheckCircle2 size={18} color="#a855f7" /> 3D Mapping & Site Engineering
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 500, color: theme.checkText }}>
                    <CheckCircle2 size={18} color="#a855f7" /> Automated volumetric stockpiling estimations
                  </div>
                </div>
              </motion.div>

              {/* 4. Smart Worker Helmets */}
              <motion.div whileHover={{ y: -8, scale: 1.01 }} transition={{ duration: 0.2 }} style={{ padding: 32, borderRadius: 24, background: theme.panelBg, border: `1px solid ${theme.borderSoft}`, position: "relative", boxShadow: isDarkMode ? "none" : "0 4px 20px rgba(0,0,0,0.05)" }}>
                <img src={helmetsImg} alt="Smart Worker Helmets" style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: 16, marginBottom: 24, border: `1px solid ${theme.borderSoft}` }} />
                <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                  <HardHat size={26} color="#f59e0b" />
                </div>
                <h3 style={{ fontSize: 24, fontWeight: 800, color: theme.textPrimary, marginBottom: 16 }}>Smart Worker Helmets</h3>
                <p style={{ fontSize: 15, color: theme.textSecondary, lineHeight: 1.7, marginBottom: 24 }}>
                  Next-gen personal protective equipment integrating AR, AI, and continuous connectivity for field engineers.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 500, color: theme.checkText }}>
                    <CheckCircle2 size={18} color="#f59e0b" /> Edge AI object detection built into the visor
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 500, color: theme.checkText }}>
                    <CheckCircle2 size={18} color="#f59e0b" /> Real-time Audio and Video recording for compliance
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 500, color: theme.checkText }}>
                    <CheckCircle2 size={18} color="#f59e0b" /> Smart AR suggestions overlaid to the worker
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 500, color: theme.checkText }}>
                    <CheckCircle2 size={18} color="#f59e0b" /> Over-the-shoulder remote troubleshooting help
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 500, color: theme.checkText }}>
                    <CheckCircle2 size={18} color="#f59e0b" /> Fast fire and evacuation alerts to every user
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 500, color: theme.checkText }}>
                    <CheckCircle2 size={18} color="#f59e0b" /> Mandatory wear compliance tracking
                  </div>
                </div>
              </motion.div>

              {/* 5. Smart Robots */}
              <motion.div whileHover={{ y: -8, scale: 1.01 }} transition={{ duration: 0.2 }} style={{ padding: 32, borderRadius: 24, background: theme.panelBg, border: `1px solid ${theme.borderSoft}`, position: "relative", boxShadow: isDarkMode ? "none" : "0 4px 20px rgba(0,0,0,0.05)" }}>
                <img src={robotsImg} alt="Smart Robots" style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: 16, marginBottom: 24, border: `1px solid ${theme.borderSoft}` }} />
                <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(236,72,153,0.15)", border: "1px solid rgba(236,72,153,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                  <Bot size={26} color="#ec4899" />
                </div>
                <h3 style={{ fontSize: 24, fontWeight: 800, color: theme.textPrimary, marginBottom: 16 }}>Smart Robots</h3>
                <p style={{ fontSize: 15, color: theme.textSecondary, lineHeight: 1.7, marginBottom: 24 }}>
                  Automated Guided Vehicles (AGVs) and Autonomous Mobile Robots (AMRs) perfectly synced with the IIoT core.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 500, color: theme.checkText }}>
                    <CheckCircle2 size={18} color="#ec4899" /> Mobile equipment distribution point to point
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 500, color: theme.checkText }}>
                    <CheckCircle2 size={18} color="#ec4899" /> Dynamic obstacle avoidance using LiDAR
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 500, color: theme.checkText }}>
                    <CheckCircle2 size={18} color="#ec4899" /> Fleet orchestration via Digital Twin UI
                  </div>
                </div>
              </motion.div>

              {/* 6. Agentic CAD/CAM/FEA Software */}
              <motion.div whileHover={{ y: -8, scale: 1.01 }} transition={{ duration: 0.2 }} style={{ padding: 32, borderRadius: 24, background: theme.panelBg, border: `1px solid ${theme.borderSoft}`, position: "relative", boxShadow: isDarkMode ? "none" : "0 4px 20px rgba(0,0,0,0.05)" }}>
                <img src={cadImg} alt="Agentic CAD CAM" style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: 16, marginBottom: 24, border: `1px solid ${theme.borderSoft}` }} />
                <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                  <Brain size={26} color="#10b981" />
                </div>
                <h3 style={{ fontSize: 24, fontWeight: 800, color: theme.textPrimary, marginBottom: 16 }}>Agentic CAD, CAM & FEA</h3>
                <p style={{ fontSize: 15, color: theme.textSecondary, lineHeight: 1.7, marginBottom: 24 }}>
                  Generative AI for mechanical design. Transform text prompts into 3D manufacturing files and simulations instantly.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 500, color: theme.checkText }}>
                    <CheckCircle2 size={18} color="#10b981" /> Provide a text prompt to generate 90% accurate 3D models
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 500, color: theme.checkText }}>
                    <CheckCircle2 size={18} color="#10b981" /> Automated CNC toolpath scripting (CAM generation)
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 500, color: theme.checkText }}>
                    <CheckCircle2 size={18} color="#10b981" /> Rapid Finite Element Analysis (FEA) simulations
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 500, color: theme.checkText }}>
                    <CheckCircle2 size={18} color="#10b981" /> Final 10% refinement via human engineering & testing
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 500, color: theme.checkText }}>
                    <CheckCircle2 size={18} color="#10b981" /> Drastically reduces R&D prototyping lifecycle
                  </div>
                </div>
              </motion.div>

              {/* 7. Elite Custom IIoT Ecosystem */}
              <motion.div whileHover={{ y: -8, scale: 1.01 }} transition={{ duration: 0.2 }} style={{ padding: 32, borderRadius: 24, background: theme.panelBg, border: `1px solid ${theme.borderSoft}`, position: "relative", overflow: "hidden", boxShadow: isDarkMode ? "none" : "0 4px 20px rgba(0,0,0,0.05)" }}>
                <div style={{ position: "absolute", top: 16, right: 16, padding: "4px 12px", background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: 999, fontSize: 11, fontWeight: 800, color: "#eab308", letterSpacing: 1, textTransform: "uppercase", zIndex: 20 }}>
                  Elite Offering
                </div>
                <div style={{ position: "absolute", bottom: -50, right: -50, width: 200, height: 200, background: "radial-gradient(circle, rgba(234,179,8,0.1) 0%, transparent 70%)", zIndex: 0 }}></div>
                <div style={{ position: "relative", zIndex: 10 }}>
                  <img src={eliteImg} alt="Elite Custom Ecosystem" style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: 16, marginBottom: 24, border: `1px solid ${theme.borderSoft}` }} />
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                    <Network size={26} color="#eab308" />
                  </div>
                  <h3 style={{ fontSize: 24, fontWeight: 800, color: theme.textPrimary, marginBottom: 16 }}>Bespoke IIoT & Digital Twin Ecosystem</h3>
                  <p style={{ fontSize: 15, color: theme.textSecondary, lineHeight: 1.7, marginBottom: 24 }}>
                    An end-to-end, fully customized Smart Factory architecture built specifically around your unique industrial requirements.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 500, color: theme.checkText }}>
                      <CheckCircle2 size={18} color="#eab308" /> 100% Flexible — not tightly coupled to legacy technology
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 500, color: theme.checkText }}>
                      <CheckCircle2 size={18} color="#eab308" /> Built precisely for what makes sense for your automation goals
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 500, color: theme.checkText }}>
                      <CheckCircle2 size={18} color="#eab308" /> Zero redundancy and no extra charges for unused components
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 500, color: theme.checkText }}>
                      <CheckCircle2 size={18} color="#eab308" /> Completely tailored AI models and Edge Computing logic
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 500, color: theme.checkText }}>
                      <CheckCircle2 size={18} color="#eab308" /> Full ownership of a highly customized industrial architecture
                    </div>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section style={{ padding: "6rem 2rem", textAlign: "center", background: isDarkMode ? "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(59,130,246,0.15) 0%, transparent 70%)" : "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(59,130,246,0.1) 0%, transparent 70%)", transition: "all 0.3s ease" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 800, color: theme.textPrimary, marginBottom: 20 }}>
            Ready to upgrade your<br />industrial operations?
          </h2>
          <p style={{ color: theme.textSecondary, fontSize: 16, maxWidth: 500, margin: "0 auto 40px", lineHeight: 1.7 }}>
            Experience the power of our embedded IIoT ecosystem. Start by exploring our live Digital Twin Conveyor Belt simulator.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => navigate("/conveyor")} style={{ padding: "16px 40px", borderRadius: 14, background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff", fontSize: 16, fontWeight: 700, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 0 60px rgba(59,130,246,0.4)" }}>
              Open Conveyor Digital Twin <ArrowRight size={18} />
            </button>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ padding: "16px 40px", borderRadius: 14, background: theme.btnGhost, color: theme.textPrimary, fontSize: 16, fontWeight: 600, border: `1px solid ${theme.borderMed}`, cursor: "pointer" }}>
              Back to Top
            </button>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "2rem", borderTop: `1px solid ${theme.borderSoft}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, transition: "all 0.3s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={dtcLogo} alt="DTC" style={{ width: 28, height: 28, borderRadius: 6 }} />
          <span style={{ fontSize: 13, color: theme.textMuted }}>Industry 4.0 Ecosystem — India's 1st IIoT</span>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {[["Conveyor Twin","/conveyor"],["AI Video","#"],["Drones","#"],["Smart Helmets","#"],["Robotics","#"]].map(([label, path]) => (
            <button key={label} onClick={() => path !== "#" ? navigate(path) : null} style={{ background: "none", border: "none", color: theme.textMuted, fontSize: 12, cursor: path !== "#" ? "pointer" : "default" }}>{label}</button>
          ))}
        </div>
      </footer>
    </div>
  );
}
