import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { logoutUser } from "../services/authService";

function Layout({ user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [logsOpen, setLogsOpen] = useState(true);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
    } catch (error) {
      console.error("Çıkış hatası:", error);
    }dsfjds;
  };

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div style={styles.page}>
      <aside
        style={{
          ...styles.sidebar,
          width: sidebarOpen ? "290px" : "92px",
        }}
      >
        <div>
          <div style={styles.topBar}>
            {sidebarOpen && <h2 style={styles.logo}>İklimlendirme Sistemi</h2>}

            <button
              style={styles.toggleBtn}
              onClick={() => setSidebarOpen((prev) => !prev)}
              title={sidebarOpen ? "Menüyü daralt" : "Menüyü genişlet"}
            >
              {sidebarOpen ? "◀" : "▶"}
            </button>
          </div>

          <nav style={styles.nav}>
            <Link
              style={{
                ...styles.link,
                ...(isActive("/") ? styles.activeLink : {}),
              }}
              to="/"
            >
              <span style={styles.icon}>🏠</span>
              {sidebarOpen && <span>Ana Sayfa</span>}
            </Link>

            <button
              style={{
                ...styles.dropdownButton,
                ...(isActive("/sensor-history") ||
                isActive("/device-history") ||
                isActive("/reference-history")
                  ? styles.activeLink
                  : {}),
              }}
              onClick={() => setLogsOpen((prev) => !prev)}
            >
              <span style={styles.dropdownLeft}>
                <span style={styles.icon}>📋</span>
                {sidebarOpen && <span>Geçmiş Kayıtlar</span>}
              </span>
              {sidebarOpen && <span>{logsOpen ? "▲" : "▼"}</span>}
            </button>

            {sidebarOpen && logsOpen && (
              <div style={styles.submenu}>
                <Link
                  style={{
                    ...styles.subLink,
                    ...(isActive("/sensor-history") ? styles.activeSubLink : {}),
                  }}
                  to="/sensor-history"
                >
                  Sensör Verileri Geçmişi
                </Link>

                <Link
                  style={{
                    ...styles.subLink,
                    ...(isActive("/device-history") ? styles.activeSubLink : {}),
                  }}
                  to="/device-history"
                >
                  Cihaz Durumu Geçmişi
                </Link>

                <Link
                  style={{
                    ...styles.subLink,
                    ...(isActive("/reference-history")
                      ? styles.activeSubLink
                      : {}),
                  }}
                  to="/reference-history"
                >
                  Referans Değerleri Geçmişi
                </Link>
              </div>
            )}<Link
            style={{
              ...styles.link,
              ...(isActive("/reference-settings") ? styles.activeLink : {}),
            }}
            to="/reference-settings"
          >
            <span style={styles.icon}>⚙️</span>
            {sidebarOpen && <span>Ayarlar</span>}
          </Link>
            
          </nav>
        </div>

        <div style={styles.bottom}>
          {sidebarOpen && <div style={styles.userMail}>{user?.email}</div>}

          <button style={styles.logoutBtn} onClick={handleLogout}>
            {sidebarOpen ? "Çıkış Yap" : "⎋"}
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const glassBorder = "1px solid rgba(255,255,255,0.08)";

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    background:
      "radial-gradient(circle at top left, rgba(59,130,246,0.22), transparent 28%), radial-gradient(circle at bottom right, rgba(16,185,129,0.18), transparent 30%), linear-gradient(135deg, #0f172a, #111827, #1e293b)",
    color: "white",
  },
  sidebar: {
    padding: "20px 16px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    background: "rgba(15,23,42,0.82)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    borderRight: glassBorder,
    transition: "width 0.3s ease",
    boxSizing: "border-box",
    position: "sticky",
    top: 0,
    height: "100vh",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "22px",
  },
  logo: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "800",
    letterSpacing: "0.3px",
    color: "white",
  },
  toggleBtn: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    border: glassBorder,
    background: "rgba(255,255,255,0.08)",
    color: "white",
    cursor: "pointer",
    fontSize: "16px",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  link: {
    textDecoration: "none",
    color: "white",
    background: "rgba(255,255,255,0.06)",
    padding: "14px 14px",
    borderRadius: "14px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    border: glassBorder,
    transition: "all 0.2s ease",
  },
  activeLink: {
    background: "linear-gradient(135deg, rgba(37,99,235,0.95), rgba(59,130,246,0.75))",
    boxShadow: "0 8px 20px rgba(37,99,235,0.25)",
  },
  dropdownButton: {
    width: "100%",
    padding: "14px 14px",
    borderRadius: "14px",
    border: glassBorder,
    background: "rgba(255,255,255,0.06)",
    color: "white",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    fontSize: "15px",
  },
  dropdownLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  submenu: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "2px",
    marginLeft: "12px",
    paddingLeft: "12px",
    borderLeft: "1px solid rgba(255,255,255,0.08)",
  },
  subLink: {
    textDecoration: "none",
    color: "#dbeafe",
    background: "rgba(255,255,255,0.04)",
    padding: "12px 14px",
    borderRadius: "12px",
    fontWeight: "500",
    border: glassBorder,
  },
  activeSubLink: {
    background: "rgba(37,99,235,0.3)",
    color: "white",
  },
  icon: {
    width: "18px",
    textAlign: "center",
    flexShrink: 0,
  },
  bottom: {
    borderTop: "1px solid rgba(255,255,255,0.08)",
    paddingTop: "16px",
    marginTop: "18px",
  },
  userMail: {
    fontSize: "14px",
    color: "#cbd5e1",
    marginBottom: "12px",
    wordBreak: "break-word",
    lineHeight: "1.5",
  },
  logoutBtn: {
    width: "100%",
    padding: "13px",
    border: "none",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #dc2626, #ef4444)",
    color: "white",
    fontWeight: "700",
    cursor: "pointer",
  },
  main: {
    flex: 1,
    padding: "28px",
    boxSizing: "border-box",
  },
};

export default Layout;