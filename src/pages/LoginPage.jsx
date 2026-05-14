import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Lütfen tüm alanları doldur.");
      return;
    }

    try {
      setLoading(true);

      await signInWithEmailAndPassword(auth, email, password);

      navigate("/"); // giriş sonrası dashboard
    } catch (error) {
      console.error(error);

      if (error.code === "auth/user-not-found") {
        alert("Kullanıcı bulunamadı.");
      } else if (error.code === "auth/wrong-password") {
        alert("Şifre yanlış.");
      } else {
        alert("Giriş hatası.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <form style={styles.card} onSubmit={handleLogin}>
        <h1 style={styles.title}>Giriş Yap</h1>

        <input
          style={styles.input}
          type="email"
          placeholder="E-posta"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button style={styles.button} type="submit" disabled={loading}>
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>

        <p style={styles.text}>
          Hesabın yok mu?{" "}
          <Link to="/register" style={styles.link}>
            Kayıt ol
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
    background: "#020617",
  },
  card: {
    width: "350px",
    padding: "30px",
    background: "#0f172a",
    borderRadius: "16px",
    color: "white",
  },
  title: {
    marginBottom: "20px",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "12px",
    borderRadius: "10px",
    border: "1px solid #334155",
    background: "#020617",
    color: "white",
  },
  button: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    background: "#2563eb",
    color: "white",
    border: "none",
    fontWeight: "bold",
  },
  text: {
    marginTop: "15px",
    textAlign: "center",
  },
  link: {
    color: "#60a5fa",
  },
};

export default LoginPage;