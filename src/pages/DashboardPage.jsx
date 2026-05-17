import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import LedIndicator from "../components/LedIndicator";

function DashboardPage() {
  const [anlikVeri, setAnlikVeri] = useState(null);
  const [cihazDurumu, setCihazDurumu] = useState(null);

  const [modeChanging, setModeChanging] = useState(false);
  const [fanPending, setFanPending] = useState(false);
  const [ampulPending, setAmpulPending] = useState(false);
  const [pwmPending, setPwmPending] = useState(false);

  const [localFanValue, setLocalFanValue] = useState(null);
  const [localAmpulValue, setLocalAmpulValue] = useState(null);

  const [fanPwm, setFanPwm] = useState(0);
  const [ampulPwm, setAmpulPwm] = useState(0);

  useEffect(() => {
    const anlikRef = doc(db, "anlik_veriler", "anlikveriid");
    const cihazRef = doc(db, "cihaz_durumu", "cihazdurumuid");

    const unsubAnlik = onSnapshot(anlikRef, (snap) => {
      if (snap.exists()) setAnlikVeri(snap.data());
    });

    const unsubCihaz = onSnapshot(cihazRef, (snap) => {
      if (!snap.exists()) return;

      const yeniVeri = snap.data();
      setCihazDurumu(yeniVeri);

      if (modeChanging && yeniVeri?.mod) setModeChanging(false);

      if (fanPending && typeof yeniVeri?.fandurumu !== "undefined") {
        setFanPending(false);
        setLocalFanValue(null);
      }

      if (ampulPending && typeof yeniVeri?.ampuldurumu !== "undefined") {
        setAmpulPending(false);
        setLocalAmpulValue(null);
      }

      if (typeof yeniVeri?.fan_pwm !== "undefined") {
        setFanPwm(Number(yeniVeri.fan_pwm));
      }

      if (typeof yeniVeri?.ampul_pwm !== "undefined") {
        setAmpulPwm(Number(yeniVeri.ampul_pwm));
      }

      setPwmPending(false);
    });

    return () => {
      unsubAnlik();
      unsubCihaz();
    };
  }, [modeChanging, fanPending, ampulPending]);

  const currentMode = cihazDurumu?.mod ?? "auto";
  const isManualMode = currentMode === "manual";

  const displayedFan =
    localFanValue !== null ? localFanValue : cihazDurumu?.fandurumu;

  const displayedAmpul =
    localAmpulValue !== null ? localAmpulValue : cihazDurumu?.ampuldurumu;

  const controlsReady = useMemo(() => {
    return (
      isManualMode &&
      !modeChanging &&
      cihazDurumu &&
      typeof cihazDurumu.fandurumu !== "undefined" &&
      typeof cihazDurumu.ampuldurumu !== "undefined"
    );
  }, [isManualMode, modeChanging, cihazDurumu]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Yok";
    if (typeof timestamp === "string") return timestamp;
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString("tr-TR");
    }
    return "Geçersiz tarih";
  };

  const toggleFan = async () => {
    if (!controlsReady || fanPending) return;
    if (typeof displayedFan === "undefined") return;

    const yeniFanDegeri = !displayedFan;
    const yeniFanPwm = yeniFanDegeri ? (fanPwm > 0 ? fanPwm : 255) : 0;

    try {
      setFanPending(true);
      setLocalFanValue(yeniFanDegeri);
      setFanPwm(yeniFanPwm);

      await updateDoc(doc(db, "cihaz_durumu", "cihazdurumuid"), {
        mod: "manual",
        fandurumu: yeniFanDegeri,
        fan_pwm: yeniFanPwm,
        timestamp: new Date().toLocaleString("tr-TR"),
      });
    } catch (error) {
      console.error("Fan güncellenemedi:", error);
      setFanPending(false);
      setLocalFanValue(null);
    }
  };

  const toggleAmpul = async () => {
    if (!controlsReady || ampulPending) return;
    if (typeof displayedAmpul === "undefined") return;

    const yeniAmpulDegeri = !displayedAmpul;
    const yeniAmpulPwm = yeniAmpulDegeri ? (ampulPwm > 0 ? ampulPwm : 255) : 0;

    try {
      setAmpulPending(true);
      setLocalAmpulValue(yeniAmpulDegeri);
      setAmpulPwm(yeniAmpulPwm);

      await updateDoc(doc(db, "cihaz_durumu", "cihazdurumuid"), {
        mod: "manual",
        ampuldurumu: yeniAmpulDegeri,
        ampul_pwm: yeniAmpulPwm,
        timestamp: new Date().toLocaleString("tr-TR"),
      });
    } catch (error) {
      console.error("Ampul güncellenemedi:", error);
      setAmpulPending(false);
      setLocalAmpulValue(null);
    }
  };

  const toggleMode = async () => {
    if (!cihazDurumu || modeChanging || fanPending || ampulPending) return;

    try {
      setModeChanging(true);
      const yeniMod = currentMode === "manual" ? "auto" : "manual";

      await updateDoc(doc(db, "cihaz_durumu", "cihazdurumuid"), {
        mod: yeniMod,
        timestamp: new Date().toLocaleString("tr-TR"),
      });
    } catch (error) {
      console.error("Mod değiştirilemedi:", error);
      setModeChanging(false);
    }
  };

  const updateFanPwm = async (value) => {
    if (!controlsReady || !displayedFan) return;

    try {
      setPwmPending(true);

      await updateDoc(doc(db, "cihaz_durumu", "cihazdurumuid"), {
        mod: "manual",
        fandurumu: value > 0,
        fan_pwm: value,
        timestamp: new Date().toLocaleString("tr-TR"),
      });
    } catch (error) {
      console.error("Fan PWM güncellenemedi:", error);
      setPwmPending(false);
    }
  };

  const updateAmpulPwm = async (value) => {
    if (!controlsReady || !displayedAmpul) return;

    try {
      setPwmPending(true);

      await updateDoc(doc(db, "cihaz_durumu", "cihazdurumuid"), {
        mod: "manual",
        ampuldurumu: value > 0,
        ampul_pwm: value,
        timestamp: new Date().toLocaleString("tr-TR"),
      });
    } catch (error) {
      console.error("Ampul PWM güncellenemedi:", error);
      setPwmPending(false);
    }
  };

  return (
    <div>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>Ana Sayfa</h1>
          <p style={styles.subtitle}>Anlık ortam verileri ve cihaz kontrolü</p>
        </div>
      </div>

      <div style={styles.topGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Sıcaklık</div>
          <div style={styles.metricValue}>
            {anlikVeri ? `${anlikVeri.sicaklik} °C` : "Yükleniyor..."}
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Nem</div>
          <div style={styles.metricValue}>
            {anlikVeri ? `${anlikVeri.nem} %` : "Yükleniyor..."}
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Gaz</div>
          <div style={styles.metricValue}>
            {anlikVeri ? `${anlikVeri.gaz} ppm` : "Yükleniyor..."}
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Mod</div>
          <div style={styles.metricValue}>
            {currentMode === "manual" ? "Manuel" : "Otomatik"}
          </div>
        </div>
      </div>

      <div style={styles.mainGrid}>
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Cihaz Kontrol Paneli</h2>
            <span style={styles.badge}>
              {isManualMode ? "Manuel kontrol açık" : "Otomatik kontrol açık"}
            </span>
          </div>

          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <strong>Mod</strong>
              <span>{isManualMode ? "Manuel" : "Otomatik"}</span>
            </div>

            <div style={styles.infoItem}>
              <strong>Son Güncelleme</strong>
              <span>
                {cihazDurumu
                  ? formatTimestamp(cihazDurumu.timestamp)
                  : "Yükleniyor..."}
              </span>
            </div>
          </div>

          <div style={{ ...styles.infoGrid, marginTop: "16px" }}>
            <LedIndicator active={!!displayedFan} label="Fan" />
            <LedIndicator active={!!displayedAmpul} label="Ampul" />
          </div>

          {!isManualMode && !modeChanging && (
            <div style={styles.warningBox}>
              Otomatik mod aktif. Fan ve ampul sistem tarafından kontrol ediliyor.
            </div>
          )}

          {modeChanging && (
            <div style={styles.infoMessage}>Mod güncelleniyor...</div>
          )}

          {(fanPending || ampulPending || pwmPending) && !modeChanging && (
            <div style={styles.infoMessage}>Komut gönderiliyor...</div>
          )}

          <div style={styles.buttonRow}>
            <button
              style={{
                ...styles.button,
                background: displayedFan ? "#16a34a" : "#dc2626",
                opacity: controlsReady && !fanPending ? 1 : 0.55,
              }}
              disabled={!controlsReady || fanPending}
              onClick={toggleFan}
            >
              {fanPending
                ? "Gönderiliyor..."
                : displayedFan
                ? "Fanı Kapat"
                : "Fanı Aç"}
            </button>

            <button
              style={{
                ...styles.button,
                background: displayedAmpul ? "#16a34a" : "#dc2626",
                opacity: controlsReady && !ampulPending ? 1 : 0.55,
              }}
              disabled={!controlsReady || ampulPending}
              onClick={toggleAmpul}
            >
              {ampulPending
                ? "Gönderiliyor..."
                : displayedAmpul
                ? "Ampulü Kapat"
                : "Ampulü Aç"}
            </button>

            <button
              style={{
                ...styles.button,
                background: isManualMode ? "#2563eb" : "#f59e0b",
                opacity: modeChanging || fanPending || ampulPending ? 0.7 : 1,
              }}
              disabled={modeChanging || fanPending || ampulPending || !cihazDurumu}
              onClick={toggleMode}
            >
              {modeChanging
                ? "Geçiliyor..."
                : isManualMode
                ? "Otomatik Moda Geç"
                : "Manuel Moda Geç"}
            </button>
          </div>

          {isManualMode && (
            <div style={styles.sliderGrid}>
              <div style={styles.sliderCard}>
                <div style={styles.sliderHeader}>
                  <strong>Fan Hızı</strong>
                  <span>{displayedFan ? fanPwm : 0}</span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="255"
                  value={fanPwm}
                  disabled={!displayedFan}
                  onChange={(e) => setFanPwm(Number(e.target.value))}
                  onMouseUp={(e) => updateFanPwm(Number(e.target.value))}
                  onTouchEnd={(e) => updateFanPwm(Number(e.target.value))}
                  style={{
                    ...styles.slider,
                    opacity: displayedFan ? 1 : 0.4,
                    cursor: displayedFan ? "pointer" : "not-allowed",
                  }}
                />
              </div>

              <div style={styles.sliderCard}>
                <div style={styles.sliderHeader}>
                  <strong>Isı Seviyesi</strong>
                  <span>{displayedAmpul ? ampulPwm : 0}</span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="255"
                  value={ampulPwm}
                  disabled={!displayedAmpul}
                  onChange={(e) => setAmpulPwm(Number(e.target.value))}
                  onMouseUp={(e) => updateAmpulPwm(Number(e.target.value))}
                  onTouchEnd={(e) => updateAmpulPwm(Number(e.target.value))}
                  style={{
                    ...styles.slider,
                    opacity: displayedAmpul ? 1 : 0.4,
                    cursor: displayedAmpul ? "pointer" : "not-allowed",
                  }}
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const glass = {
  background: "rgba(15, 23, 42, 0.72)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 14px 34px rgba(0,0,0,0.18)",
};

const styles = {
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "22px",
    flexWrap: "wrap",
  },
  title: {
    fontSize: "36px",
    margin: 0,
    color: "white",
    fontWeight: "800",
  },
  subtitle: {
    color: "#cbd5e1",
    marginTop: "8px",
    marginBottom: 0,
    lineHeight: "1.6",
  },
  topGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
  },
  metricCard: {
    ...glass,
    borderRadius: "22px",
    padding: "22px",
  },
  metricLabel: {
    color: "#cbd5e1",
    fontSize: "14px",
    marginBottom: "10px",
  },
  metricValue: {
    fontSize: "30px",
    fontWeight: "800",
    color: "white",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "20px",
    marginTop: "24px",
  },
  section: {
    ...glass,
    borderRadius: "24px",
    padding: "24px",
    color: "white",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "18px",
    flexWrap: "wrap",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "800",
  },
  badge: {
    background: "rgba(59,130,246,0.18)",
    color: "#dbeafe",
    border: "1px solid rgba(96,165,250,0.35)",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "600",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },
  infoItem: {
    background: "rgba(2, 6, 23, 0.55)",
    padding: "16px",
    borderRadius: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  warningBox: {
    marginTop: "16px",
    marginBottom: "16px",
    padding: "14px",
    borderRadius: "14px",
    backgroundColor: "rgba(37, 99, 235, 0.18)",
    border: "1px solid rgba(96, 165, 250, 0.38)",
    color: "#dbeafe",
  },
  infoMessage: {
    marginTop: "16px",
    marginBottom: "16px",
    padding: "14px",
    borderRadius: "14px",
    backgroundColor: "rgba(245, 158, 11, 0.18)",
    border: "1px solid rgba(251, 191, 36, 0.38)",
    color: "#fef3c7",
  },
  buttonRow: {
    marginTop: "18px",
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  button: {
    border: "none",
    borderRadius: "14px",
    padding: "14px 18px",
    color: "white",
    fontWeight: "800",
    cursor: "pointer",
    minWidth: "170px",
    boxShadow: "0 10px 20px rgba(0,0,0,0.12)",
  },
  sliderGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginTop: "20px",
  },
  sliderCard: {
    background: "rgba(2, 6, 23, 0.55)",
    padding: "16px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  sliderHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
  },
  slider: {
    width: "100%",
  },
};

export default DashboardPage;