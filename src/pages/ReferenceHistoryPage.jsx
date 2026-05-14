import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

function ReferenceHistoryPage() {
  const [rows, setRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dataType, setDataType] = useState("all");

  const itemsPerPage = 10;

  useEffect(() => {
    const q = query(
      collection(db, "referans_log"),
      orderBy("timestamp", "desc"),
      
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));

      setRows(data);
      setCurrentPage(1);
    });

    return () => unsubscribe();
  }, []);

  const timestampToDate = (timestamp) => {
    if (!timestamp) return null;

    if (typeof timestamp === "object" && timestamp.seconds) {
      return new Date(timestamp.seconds * 1000);
    }

    if (typeof timestamp === "string") {
      const value = timestamp.trim();

      if (/^\d+$/.test(value)) return null;

      const trParts = value.match(
        /(\d{1,2})[./](\d{1,2})[./](\d{4}).*?(\d{1,2}):(\d{1,2}):?(\d{1,2})?/
      );

      if (trParts) {
        return new Date(
          Number(trParts[3]),
          Number(trParts[2]) - 1,
          Number(trParts[1]),
          Number(trParts[4]),
          Number(trParts[5]),
          Number(trParts[6] || 0)
        );
      }

      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }

    return null;
  };

  const formatTimestamp = (timestamp) => {
    const date = timestampToDate(timestamp);
    if (!date) return "-";
    return date.toLocaleString("tr-TR");
  };

  const filteredRows = useMemo(() => {
    let result = rows
      .filter((row) => !row.uptime)
      .map((row) => ({
        ...row,
        parsedDate: timestampToDate(row.timestamp),
      }))
      .filter((row) => row.parsedDate);

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter((row) => row.parsedDate >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter((row) => row.parsedDate <= end);
    }

    return result;
  }, [rows, startDate, endDate]);

  const sortedRows = useMemo(() => {
    if (startDate || endDate) {
      return [...filteredRows].sort((a, b) => a.parsedDate - b.parsedDate);
    }

    return filteredRows;
  }, [filteredRows, startDate, endDate]);

  const totalPages = Math.ceil(sortedRows.length / itemsPerPage);

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedRows.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedRows, currentPage]);

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setDataType("all");
    setCurrentPage(1);
  };

  const goPrev = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div>
      <h1 style={styles.title}>Referans Logları</h1>

      <div style={styles.filterBox}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Başlangıç Tarihi</label>
          <input
            style={styles.input}
            type="date"
            value={startDate}
            onChange={handleFilterChange(setStartDate)}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Bitiş Tarihi</label>
          <input
            style={styles.input}
            type="date"
            value={endDate}
            onChange={handleFilterChange(setEndDate)}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Gösterilecek Tür</label>
          <select
            style={styles.input}
            value={dataType}
            onChange={handleFilterChange(setDataType)}
          >
            <option value="all">Tümü</option>
            <option value="sicaklik">Sıcaklık</option>
            <option value="nem">Nem</option>
            <option value="gaz">Gaz</option>
          </select>
        </div>

        <button style={styles.clearButton} onClick={resetFilters}>
          Filtreleri Temizle
        </button>
      </div>

      <div style={styles.infoBar}>
        <span>Gösterilen kayıt: {sortedRows.length}</span>
        <span>
          Sayfa: {totalPages === 0 ? 0 : currentPage} / {totalPages}
        </span>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Tarih</th>
              {(dataType === "all" || dataType === "sicaklik") && (
                <th style={styles.th}>Sıcaklık</th>
              )}
              {(dataType === "all" || dataType === "nem") && (
                <th style={styles.th}>Nem</th>
              )}
              {(dataType === "all" || dataType === "gaz") && (
                <th style={styles.th}>Gaz</th>
              )}
            </tr>
          </thead>

          <tbody>
            {paginatedRows.length > 0 ? (
              paginatedRows.map((row) => (
                <tr key={row.id}>
                  <td style={styles.td}>{formatTimestamp(row.timestamp)}</td>

                  {(dataType === "all" || dataType === "sicaklik") && (
                    <td style={styles.td}>{row.sicaklik_ref ?? "-"} °C</td>
                  )}

                  {(dataType === "all" || dataType === "nem") && (
                    <td style={styles.td}>{row.nem_ref ?? "-"} %</td>
                  )}

                  {(dataType === "all" || dataType === "gaz") && (
                    <td style={styles.td}>{row.gaz_ref ?? "-"} ppm</td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td style={styles.emptyTd} colSpan="4">
                  Gösterilecek kayıt bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={styles.pagination}>
        <button
          style={styles.pageButton}
          onClick={goPrev}
          disabled={currentPage === 1}
        >
          Önceki
        </button>

        <span style={styles.pageText}>
          {totalPages === 0 ? "0 / 0" : `${currentPage} / ${totalPages}`}
        </span>

        <button
          style={styles.pageButton}
          onClick={goNext}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          Sonraki
        </button>
      </div>
    </div>
  );
}

const styles = {
  title: {
    fontSize: "32px",
    marginBottom: "20px",
    color: "white",
    fontWeight: "800",
  },
  filterBox: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "14px",
    marginBottom: "16px",
    padding: "18px",
    borderRadius: "18px",
    background: "rgba(15, 23, 42, 0.72)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    color: "#cbd5e1",
    fontSize: "14px",
    fontWeight: "700",
  },
  input: {
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #334155",
    background: "rgba(2, 6, 23, 0.72)",
    color: "white",
    outline: "none",
  },
  clearButton: {
    alignSelf: "end",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "none",
    background: "#dc2626",
    color: "white",
    fontWeight: "800",
    cursor: "pointer",
  },
  infoBar: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "14px",
    color: "#cbd5e1",
    fontSize: "14px",
  },
  tableWrap: {
    background: "rgba(15, 23, 42, 0.72)",
    padding: "18px",
    borderRadius: "18px",
    overflowX: "auto",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    color: "white",
  },
  th: {
    textAlign: "left",
    padding: "14px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.16)",
    color: "#cbd5e1",
  },
  td: {
    padding: "14px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  emptyTd: {
    padding: "20px 12px",
    textAlign: "center",
    color: "#cbd5e1",
  },
  pagination: {
    marginTop: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "14px",
    flexWrap: "wrap",
  },
  pageButton: {
    padding: "11px 16px",
    borderRadius: "12px",
    border: "none",
    background: "#2563eb",
    color: "white",
    fontWeight: "700",
    cursor: "pointer",
  },
  pageText: {
    color: "white",
    fontWeight: "700",
  },
};

export default ReferenceHistoryPage;