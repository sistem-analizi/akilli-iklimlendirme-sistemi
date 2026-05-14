import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";

function ReferenceSettingsPage() {
  const [referanslar, setReferanslar] = useState(null);
  const [savingRefs, setSavingRefs] = useState(false);

  const [refForm, setRefForm] = useState({
    sicaklik_ref: "",
    nem_ref: "",
    gaz_ref: "",
  });

  useEffect(() => {
    const referansRef = doc(db, "referans", "referansid");

    const unsubscribe = onSnapshot(referansRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setReferanslar(data);

        setRefForm({
          sicaklik_ref:
            data?.sicaklik_ref !== undefined ? String(data.sicaklik_ref) : "",
          nem_ref: data?.nem_ref !== undefined ? String(data.nem_ref) : "",
          gaz_ref: data?.gaz_ref !== undefined ? String(data.gaz_ref) : "",
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleRefChange = (e) => {
    const { name, value } = e.target;

    setRefForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveReferences = async (e) => {
    e.preventDefault();

    const sicaklik = Number(refForm.sicaklik_ref);
    const nem = Number(refForm.nem_ref);
    const gaz = Number(refForm.gaz_ref);

    if (
      Number.isNaN(sicaklik) ||
      Number.isNaN(nem) ||
      Number.isNaN(gaz) ||
      refForm.sicaklik_ref === "" ||
      refForm.nem_ref === "" ||
      refForm.gaz_ref === ""
    ) {
      alert("Lütfen tüm referans alanlarını sayı olarak doldur.");
      return;
    }

    try {
      setSavingRefs(true);

      const payload = {
        sicaklik_ref: sicaklik,
        nem_ref: nem,
        gaz_ref: gaz,
        updatedBy: auth.currentUser?.email || "Bilinmiyor",
        timestamp: new Date().toLocaleString("tr-TR"),
      };

      await updateDoc(doc(db, "referans", "referansid"), payload);
      await addDoc(collection(db, "referans_log"), payload);

      alert("Referans değerleri güncellendi.");
    } catch (error) {
      console.error("Referans kaydetme hatası:", error);
      alert("Kayıt sırasında hata oluştu.");
    } finally {
      setSavingRefs(false);
    }
  };

  return (
    <div>
      <h1 style={styles.title}>Referans Ayarları</h1>
      <p style={styles.subtitle}>
        Sıcaklık, nem ve gaz referans değerlerini buradan değiştirebilirsin.
      </p>

      <section style={styles.section}>
        <div style={styles.refCards}>
          <div style={styles.refDisplayCard}>
            <div style={styles.refLabel}>Sıcaklık Referansı</div>
            <div style={styles.refValue}>
              {referanslar?.sicaklik_ref ?? "Yok"} °C
            </div>
          </div>

          <div style={styles.refDisplayCard}>
            <div style={styles.refLabel}>Nem Referansı</div>
            <div style={styles.refValue}>
              {referanslar?.nem_ref ?? "Yok"} %
            </div>
          </div>

          <div style={styles.refDisplayCard}>
            <div style={styles.refLabel}>Gaz Referansı</div>
            <div style={styles.refValue}>
              {referanslar?.gaz_ref ?? "Yok"} ppm
            </div>
          </div>
        </div>

        <form style={styles.form} onSubmit={handleSaveReferences}>
          <div style={styles.formGrid}>
            <div style={styles.inputWrap}>
              <label style={styles.label}>Sıcaklık Referansı</label>
              <input
                style={styles.input}
                type="number"
                name="sicaklik_ref"
                value={refForm.sicaklik_ref}
                onChange={handleRefChange}
              />
            </div>

            <div style={styles.inputWrap}>
              <label style={styles.label}>Nem Referansı</label>
              <input
                style={styles.input}
                type="number"
                name="nem_ref"
                value={refForm.nem_ref}
                onChange={handleRefChange}
              />
            </div>

            <div style={styles.inputWrap}>
              <label style={styles.label}>Gaz Referansı</label>
              <input
                style={styles.input}
                type="number"
                name="gaz_ref"
                value={refForm.gaz_ref}
                onChange={handleRefChange}
              />
            </div>
          </div>

          <button style={styles.button} type="submit" disabled={savingRefs}>
            {savingRefs ? "Kaydediliyor..." : "Referansları Güncelle"}
          </button>
        </form>
      </section>
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
  title: {
    fontSize: "36px",
    margin: 0,
    color: "white",
    fontWeight: "800",
  },
  subtitle: {
    color: "#cbd5e1",
    marginTop: "8px",
    marginBottom: "22px",
  },
  section: {
    ...glass,
    borderRadius: "24px",
    padding: "24px",
    color: "white",
  },
  refCards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "20px",
  },
  refDisplayCard: {
    background: "rgba(2, 6, 23, 0.55)",
    padding: "16px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  refLabel: {
    color: "#cbd5e1",
    fontSize: "13px",
    marginBottom: "8px",
  },
  refValue: {
    fontSize: "24px",
    fontWeight: "800",
    color: "white",
  },
  form: {
    marginTop: "10px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
  },
  inputWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontWeight: "700",
    color: "#e2e8f0",
  },
  input: {
    padding: "13px 14px",
    borderRadius: "12px",
    border: "1px solid #334155",
    background: "rgba(2, 6, 23, 0.72)",
    color: "white",
    outline: "none",
  },
  button: {
    marginTop: "18px",
    border: "none",
    borderRadius: "14px",
    padding: "14px 18px",
    color: "white",
    fontWeight: "800",
    cursor: "pointer",
    minWidth: "220px",
    background: "linear-gradient(135deg, #2563eb, #3b82f6)",
  },
};

export default ReferenceSettingsPage;