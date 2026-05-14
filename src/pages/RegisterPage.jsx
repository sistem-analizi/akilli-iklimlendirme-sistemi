import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

function RegisterPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!email || !password || !passwordAgain) {
      alert("Lütfen tüm alanları doldur.");
      return;
    }

    if (password.length < 6) {
      alert("Şifre en az 6 karakter olmalı.");
      return;
    }

    if (password !== passwordAgain) {
      alert("Şifreler eşleşmiyor.");
      return;
    }

    try {
      setLoading(true);

      await createUserWithEmailAndPassword(auth, email, password);

      alert("Kullanıcı başarıyla oluşturuldu.");
      navigate("/login");
    } catch (error) {
      console.error("Kayıt hatası:", error);

      if (error.code === "auth/email-already-in-use") {
        alert("Bu e-posta zaten kullanılıyor.");
      } else if (error.code === "auth/invalid-email") {
        alert("Geçersiz e-posta adresi.");
      } else if (error.code === "auth/weak-password") {
        alert("Şifre çok zayıf.");
      } else {
        alert("Kayıt sırasında hata oluştu.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <form style={styles.card} onSubmit={handleRegister}>
        <h1 style={styles.title}>Kayıt Ol</h1>
        <p style={styles.subtitle}>Yeni kullanıcı hesabı oluştur</p>

        <label style={styles.label}>E-posta</label>
        <input
          style={styles.input}
          type="email"
          placeholder="ornek@mail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label style={styles.label}>Şifre</label>
        <input
          style={styles.input}
          type="password"
          placeholder="En az 6 karakter"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label style={styles.label}>Şifre Tekrar</label>
        <input
          style={styles.input}
          type="password"
          placeholder="Şifreyi tekrar gir"
          value={passwordAgain}
          onChange={(e) => setPasswordAgain(e.target.value)}
        />

        <button style={styles.button} type="submit" disabled={loading}>
          {loading ? "Oluşturuluyor..." : "Kullanıcı Oluştur"}
        </button>

        <p style={styles.footerText}>
          Zaten hesabın var mı?{" "}
          <Link style={styles.link} to="/login">
            Giriş yap
          </Link>
        </p>
      </form>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "radial-gradient(circle at top, #1e3a8a 0%, #020617 45%, #020617 100%)",
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: "430px",
    background: "rgba(15, 23, 42, 0.82)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "24px",
    padding: "30px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
    color: "white",
  },
  title: {
    margin: 0,
    fontSize: "34px",
    fontWeight: "800",
  },
  subtitle: {
    color: "#cbd5e1",
    marginTop: "8px",
    marginBottom: "24px",
  },
  label: {
    display: "block",
    color: "#e2e8f0",
    marginBottom: "8px",
    marginTop: "14px",
    fontWeight: "700",
  },
  input: {
    width: "100%",
    padding: "13px 14px",
    borderRadius: "13px",
    border: "1px solid #334155",
    background: "rgba(2, 6, 23, 0.72)",
    color: "white",
    outline: "none",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    marginTop: "22px",
    padding: "14px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #2563eb, #3b82f6)",
    color: "white",
    fontWeight: "800",
    cursor: "pointer",
  },
  footerText: {
    textAlign: "center",
    color: "#cbd5e1",
    marginTop: "18px",
  },
  link: {
    color: "#60a5fa",
    fontWeight: "800",
    textDecoration: "none",
  },
};

export default RegisterPage;