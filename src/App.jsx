import { useState, useEffect } from "react";
import "./App.css";
import ports from "./data/indian_ocean_ports.json";
import shipTypesData from "./data/ship_data.json";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import axios from "axios";

/* ─────────────────────────── icons (monochrome, stroke-based) ─────────────────────────── */
const I = {
  pin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
  ),
  flag: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1Z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
  ),
  sliders: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
  ),
  ship: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20a2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1 2.4 2.4 0 0 1 2-1 2.4 2.4 0 0 1 2 1 2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1 2.4 2.4 0 0 1 2-1 2.4 2.4 0 0 1 2 1 2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1"/><path d="M4 18l-1-5h18l-2 5"/><path d="M5 13V7h14v6"/><path d="M9 7V4h6v3"/></svg>
  ),
  fuel: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="15" y2="22"/><line x1="4" y1="9" x2="14" y2="9"/><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2 2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/></svg>
  ),
  balance: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
  ),
  gauge: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
  ),
  route: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  ),
  layers: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
  ),
};

/* ─────────────────────────── animated helpers ─────────────────────────── */
function CountUp({ value, decimals = 0, duration = 1300 }) {
  const [d, setD] = useState(0);
  useEffect(() => {
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / duration);
      setD(value * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{d.toFixed(decimals)}</>;
}

function AnimatedPolyline({ positions }) {
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    if (!positions || positions.length < 2) { setRevealed(0); return; }
    const total = positions.length;
    const steps = 110;                 // ≈1.8s draw-on
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setRevealed(Math.round((i / steps) * total));
      if (i >= steps) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [positions]);

  // once fully revealed this is a completely static polyline —
  // zoom/pan-proof by construction (no CSS dash tricks for Leaflet to fight)
  if (!positions || positions.length < 2) return null;
  const n = Math.max(2, Math.min(revealed, positions.length));

  return (
    <Polyline
      positions={positions.slice(0, n)}
      pathOptions={{
        color: "#ffffff",
        weight: 3.5,
        opacity: 0.92,
        smoothFactor: 0.2,
        lineCap: "round",
        lineJoin: "round",
      }}
    />
  );
}

function Meter({ pct }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(pct || 0), 80);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div className="mg-meter">
      <i style={{ width: Math.max(0, Math.min(100, w)) + "%" }} />
    </div>
  );
}

/* ─────────────────────────── map markers ─────────────────────────── */
const originIcon = L.divIcon({
  className: "",
  html: '<div class="mg-marker mg-origin"><i></i></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});
const destIcon = L.divIcon({
  className: "",
  html: '<div class="mg-marker mg-dest"><i></i></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

/* ─────────────────────────── app ─────────────────────────── */
const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

const PRIORITIES = [
  { id: "fuel", label: "Fuel", icon: I.fuel },
  { id: "balanced", label: "Balanced", icon: I.balance },
  { id: "safety", label: "Safety", icon: I.shield },
];

function App() {
  const [Start, setStart] = useState([22.535744, 88.299581]);
  const [End, setEnd] = useState([22.535744, 88.299581]);
  const [Shipdata, setShipdata] = useState({
    shipType: "Cargo", Loa: 2414.0, Draft: 1241.0, Displ: 2414.0,
    Power: 440.0, Load: 2200.0, Speed: 15.0, Beam: 30.0,
  });
  const [Priority, setPriority] = useState("balanced");
  const [data, setData] = useState({});
  const [route, setRoute] = useState([]);
  const [init, setInit] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [voyage, setVoyage] = useState({ o: "—", d: "—" });

  const nameOf = (coord) => {
    const p = ports.find(
      (q) => Math.abs(Number(q.latitude) - coord[0]) < 1e-6 && Math.abs(Number(q.longitude) - coord[1]) < 1e-6
    );
    return p ? p.fullname : "Custom point";
  };

  const changeShipDet = (type) => (e) => {
    const v = e.target.value;
    setShipdata((prev) => ({ ...prev, [type]: type === "shipType" ? v : Number(v) || prev[type] }));
  };
  const putstart = (e) => setStart(e.target.value.split(",").map(Number));
  const putend = (e) => setEnd(e.target.value.split(",").map(Number));

  const callApi = () => {
    setLoading(true);
    setError(null);
    axios
      .post(`${API}/map`, {
        start: Start, end: End, ship: Shipdata, priority: Priority,
      })
      .then((response) => {
        setData(response.data);
        setRoute(response.data["path"]);
        setVoyage({ o: nameOf(Start), d: nameOf(End) });
        setInit(false);
      })
      .catch((err) => {
        setError(
          err.response
            ? `Backend error ${err.response.status}.`
            : "Route engine unreachable — is the MARG backend running?"
        );
      })
      .finally(() => setLoading(false));
  };

  const etaHrs = typeof data.eta === "number" ? data.eta : null;
  const km = typeof data.km === "number" ? data.km : null;
  const nm = km != null ? km * 0.53996 : null;
  const fuel = typeof data.fuel === "number" ? data.fuel : null;
  const avgKn =
    typeof data.avg_kn === "number" ? data.avg_kn : etaHrs > 0 && km > 0 ? (km * 0.53996) / etaHrs : null;
  const directKm = typeof data.direct_km === "number" ? data.direct_km : null;
  const detourPct = typeof data.detour_pct === "number" ? data.detour_pct : null;
  const efficiency = typeof data.efficiency === "number" ? data.efficiency : null;
  const engineMs = typeof data.computed_ms === "number" ? data.computed_ms : null;
  const arrivalDate = data.arrival
    ? new Date(data.arrival)
    : etaHrs != null
      ? new Date(Date.now() + etaHrs * 3600000)
      : null;
  const departDate = data.departure ? new Date(data.departure) : null;

  return (
    <div className="w-full h-full">
      <MapContainer
        center={[20.593, 78.962]}
        zoom={5}
        scrollWheelZoom={true}
        className="absolute top-0 left-0 w-full h-full z-0"
      >
        <TileLayer
          attribution="Esri, Maxar, Earthstar Geographics"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />

        {route.length > 0 && (
          <>
            <AnimatedPolyline positions={route} />
            <Marker position={route[0]} icon={originIcon}>
              <Popup>Origin</Popup>
            </Marker>
            <Marker position={route[route.length - 1]} icon={destIcon}>
              <Popup>Destination</Popup>
            </Marker>
          </>
        )}
      </MapContainer>

      {/* brand */}
      <div className="mg-glass fixed top-3 md:top-4 left-1/2 -translate-x-1/2 z-[500] rounded-xl md:rounded-2xl px-5 md:px-9 py-2 md:py-3.5 text-center pointer-events-none mg-rise">
        <h1 className="text-lg font-semibold tracking-[0.45em] text-white leading-none pl-[0.45em]">MARG</h1>
        <p className="text-[10px] tracking-widest text-neutral-400 mt-1.5 uppercase">
          Maritime Analysis &amp; Route Generation
        </p>
        <p className="text-[9px] tracking-[0.3em] text-neutral-600 mt-0.5 uppercase">by Shubham</p>
      </div>

      {init ? (
        <div className="mg-glass mg-form scrollbar-thin fixed z-50 overflow-auto inset-x-0 bottom-0 max-h-[64dvh] rounded-t-2xl p-5 pb-[max(20px,env(safe-area-inset-bottom))] md:inset-x-auto md:left-8 md:right-auto md:top-24 md:bottom-6 md:w-[334px] md:max-h-none md:p-6 md:rounded-2xl mg-rise">
          {/* ports */}
          <label className="mg-label flex items-center gap-2" style={{ animationDelay: ".08s" }}>
            <span className="mg-ic">{I.pin}</span> Origin Port
          </label>
          <select onChange={putstart} className="mg-input mg-stagger" style={{ animationDelay: ".12s" }}>
            {ports.map((port, idx) => (
              <option key={`s-${idx}`} value={[port.latitude, port.longitude]} className="bg-[#151517]">
                {port.fullname}
              </option>
            ))}
          </select>

          <label className="mg-label mt-5 flex items-center gap-2" style={{ animationDelay: ".16s" }}>
            <span className="mg-ic">{I.flag}</span> Destination Port
          </label>
          <select onChange={putend} className="mg-input mg-stagger" style={{ animationDelay: ".2s" }}>
            {ports.map((port, idx) => (
              <option key={`d-${idx}`} value={[port.latitude, port.longitude]} className="bg-[#151517]">
                {port.fullname}
              </option>
            ))}
          </select>

          {/* priority */}
          <p className="mg-label mt-6 mb-2 flex items-center gap-2" style={{ animationDelay: ".24s" }}>
            <span className="mg-ic">{I.sliders}</span> Routing Priority
          </p>
          <div className="grid grid-cols-3 gap-2 mg-stagger" style={{ animationDelay: ".28s" }}>
            {PRIORITIES.map((p) => (
              <button
                key={p.id}
                onClick={() => setPriority(p.id)}
                title={p.label}
                className={`mg-pri ${Priority === p.id ? "mg-pri-on" : ""}`}
              >
                <span className="mx-auto block w-4 h-4 mb-1">{p.icon}</span>
                {p.label}
              </button>
            ))}
          </div>

          {/* vessel */}
          <p className="mg-label mt-6 mb-1.5 flex items-center gap-2" style={{ animationDelay: ".32s" }}>
            <span className="mg-ic">{I.ship}</span> Vessel Profile
          </p>
          <select
            onChange={changeShipDet("shipType")}
            className="mg-input mg-stagger"
            style={{ animationDelay: ".36s" }}
          >
            {shipTypesData.ship_types.map((category, index) => (
              <optgroup key={index} label={category.category}>
                {category.types.map((type, typeIndex) => (
                  <option key={typeIndex} value={type} className="bg-[#151517]">
                    {type}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-x-3 gap-y-3 mt-4 mg-stagger" style={{ animationDelay: ".4s" }}>
            {[
              ["Loa", "Length Overall"], ["Beam", "Beam"], ["Draft", "Draft"],
              ["Displ", "Displacement"], ["Power", "Power"], ["Load", "Cargo Load"],
              ["Speed", "Service Speed"],
            ].map(([key, label]) => (
              <div key={key} className={key === "Speed" ? "col-span-2" : ""}>
                <label className="mb-1 block text-[10px] font-medium text-neutral-500">{label}</label>
                <input
                  type="number" step="any" value={Shipdata[key]}
                  onChange={changeShipDet(key)}
                  className="mg-input w-full p-2"
                />
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-4 text-xs bg-white/5 border border-white/10 text-neutral-300 rounded-lg p-3 leading-relaxed">
              {error}
            </div>
          )}

          {loading && (
            <div className="mt-4 h-[3px] w-full rounded-full bg-white/10 overflow-hidden">
              <div className="mg-progress" />
            </div>
          )}

          <button
            onClick={callApi}
            disabled={loading}
            className="mt-5 w-full bg-white hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-wait text-[#151517] font-medium rounded-lg text-sm px-6 py-3 transition-all active:scale-[.985]"
          >
            {loading ? "Computing optimal route…" : "Generate Route"}
          </button>

          <p className="mt-4 pt-3 border-t border-white/[.07] flex items-center justify-between text-[9px] uppercase tracking-widest text-neutral-600">
            <span>{ports.length} ports · Indian Ocean</span>
            <span>SARAT · GFS</span>
          </p>
        </div>
      ) : (
        <>
          {/* results card */}
          <div className="mg-glass fixed z-50 mg-rise inset-x-2 bottom-2 rounded-2xl px-5 py-4 md:inset-x-auto md:left-8 md:right-auto md:bottom-6 md:min-w-[380px] md:max-w-[92vw] md:px-7 md:py-5">
            {/* voyage header */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-widest text-neutral-500">Voyage</p>
                <p className="text-sm font-semibold text-white truncate mt-0.5">
                  {voyage.o} <span className="text-neutral-500 font-normal">→</span> {voyage.d}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-medium uppercase tracking-widest text-neutral-500">Dep / Arr</p>
                <p className="text-[11px] text-neutral-300 mt-0.5 tabular-nums">
                  {departDate ? departDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—"}
                  {" → "}
                  {arrivalDate ? arrivalDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—"}
                </p>
              </div>
            </div>

            {/* hero ETA */}
            <div className="mt-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
              <div>
                <p className="mg-label flex items-center gap-2 mb-0.5">
                  <span className="mg-ic">{I.clock}</span> Time Underway
                </p>
                <p className="text-[28px] font-semibold text-white leading-none tabular-nums">
                  <CountUp value={Math.floor(etaHrs || 0)} />
                  <span className="text-sm font-normal text-neutral-400"> hrs </span>
                  <span className="text-base font-medium text-neutral-300 tabular-nums">
                    {etaHrs != null ? Math.round((etaHrs % 1) * 60) : 0}
                    <span className="text-xs font-normal text-neutral-400"> min</span>
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-medium uppercase tracking-widest text-neutral-500">Arrival</p>
                <p className="text-sm text-neutral-300 mt-0.5">
                  {arrivalDate
                    ? arrivalDate.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })
                    : "—"}
                </p>
              </div>
            </div>

            <hr className="my-4 border-white/10" />

            {/* stat grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-4">
              <div>
                <p className="mg-label flex items-center gap-1.5"><span className="mg-ic w-3 h-3">{I.route}</span>Distance</p>
                <p className="text-base font-semibold text-white leading-tight mt-0.5 tabular-nums">
                  <CountUp value={Math.floor(km || 0)} /><span className="text-[11px] font-normal text-neutral-400"> km</span>
                </p>
              </div>
              <div>
                <p className="mg-label flex items-center gap-1.5"><span className="mg-ic w-3 h-3">{I.gauge}</span>Nautical</p>
                <p className="text-base font-semibold text-white leading-tight mt-0.5 tabular-nums">
                  <CountUp value={Math.floor(nm || 0)} /><span className="text-[11px] font-normal text-neutral-400"> nmi</span>
                </p>
              </div>
              <div>
                <p className="mg-label flex items-center gap-1.5"><span className="mg-ic w-3 h-3">{I.fuel}</span>Fuel</p>
                <p className="text-base font-semibold text-white leading-tight mt-0.5 tabular-nums">
                  <CountUp value={Math.floor(fuel || 0)} /><span className="text-[11px] font-normal text-neutral-400"> u</span>
                </p>
              </div>
              <div>
                <p className="mg-label flex items-center gap-1.5"><span className="mg-ic w-3 h-3">{I.ship}</span>Avg Speed</p>
                <p className="text-base font-semibold text-white leading-tight mt-0.5 tabular-nums">
                  {avgKn != null ? avgKn.toFixed(1) : "—"}<span className="text-[11px] font-normal text-neutral-400"> kn</span>
                </p>
              </div>
              <div>
                <p className="mg-label flex items-center gap-1.5"><span className="mg-ic w-3 h-3">{I.pin}</span>Direct Line</p>
                <p className="text-base font-semibold text-white leading-tight mt-0.5 tabular-nums">
                  {directKm != null ? directKm.toFixed(0) : "—"}<span className="text-[11px] font-normal text-neutral-400"> km</span>
                </p>
              </div>
              <div>
                <p className="mg-label flex items-center gap-1.5"><span className="mg-ic w-3 h-3">{I.balance}</span>Detour</p>
                <p className="text-base font-semibold text-white leading-tight mt-0.5 tabular-nums">
                  {detourPct != null ? `+${detourPct.toFixed(1)}` : "—"}<span className="text-[11px] font-normal text-neutral-400">%</span>
                </p>
              </div>
            </div>

            {/* efficiency meter */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-1.5">
                <p className="mg-label flex items-center gap-1.5 mb-0"><span className="mg-ic w-3 h-3">{I.shield}</span>Route Efficiency</p>
                <p className="text-xs font-semibold text-white tabular-nums">
                  {efficiency != null ? `${efficiency}%` : "—"}
                  <span className="text-[10px] font-normal text-neutral-500"> of direct line</span>
                </p>
              </div>
              <Meter pct={efficiency} />
            </div>

            <p className="mt-4 pt-3 border-t border-white/10 text-[10px] text-neutral-500 tracking-wider uppercase flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="mg-ic w-3 h-3">{I.route}</span>
                Isochrone-A* · {route.length} wpts{engineMs != null ? ` · ${engineMs} ms` : ""}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-neutral-200 tracking-normal normal-case text-[10px]">
                {Priority}
              </span>
            </p>
          </div>

          <button
            className="mg-glass fixed top-3 right-3 md:top-5 md:right-5 rounded-xl z-50 w-10 h-10 items-center flex justify-center text-white hover:bg-white/10 transition-colors mg-rise"
            onClick={() => { setInit(true); setRoute([]); }}
            aria-label="New voyage"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m15 18-6-6 6-6"/></svg>
          </button>
        </>
      )}
    </div>
  );
}

export default App;
