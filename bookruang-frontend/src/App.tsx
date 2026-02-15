import { useEffect, useState } from "react";
import "./App.css";

type RoomLoan = {
  id?: number;
  borrowerName: string;
  roomName: string;
  purpose: string;
  date: string;
  status: string;
  startTime?: string;
  endTime?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  notes?: string;
};

type Statistics = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};

function App() {
  const [loans, setLoans] = useState<RoomLoan[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<RoomLoan[]>([]);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [form, setForm] = useState<RoomLoan>({
    borrowerName: "",
    roomName: "",
    purpose: "",
    date: "",
    status: "Pending",
    startTime: "",
    endTime: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [searchRoom, setSearchRoom] = useState<string>("");
  const [searchBorrower, setSearchBorrower] = useState<string>("");
  
  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<RoomLoan | null>(null);
  const [adminName, setAdminName] = useState("");
  const [notes, setNotes] = useState("");

  const API = "http://localhost:5021/api/RoomLoans";

  const fetchLoans = async () => {
    const res = await fetch(API);
    const data = await res.json();
    setLoans(data);
    setFilteredLoans(data);
  };

  const fetchStatistics = async () => {
    const res = await fetch(`${API}/statistics`);
    const data = await res.json();
    setStats(data);
  };

  useEffect(() => {
    fetchLoans();
    fetchStatistics();
  }, []);

  // Apply filters whenever filter states change
  useEffect(() => {
    let filtered = [...loans];

    if (filterStatus) {
      filtered = filtered.filter(
        (loan) => loan.status.toLowerCase() === filterStatus.toLowerCase()
      );
    }

    if (searchRoom) {
      filtered = filtered.filter((loan) =>
        loan.roomName.toLowerCase().includes(searchRoom.toLowerCase())
      );
    }

    if (searchBorrower) {
      filtered = filtered.filter((loan) =>
        loan.borrowerName.toLowerCase().includes(searchBorrower.toLowerCase())
      );
    }

    setFilteredLoans(filtered);
  }, [filterStatus, searchRoom, searchBorrower, loans]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!form.borrowerName || !form.roomName || !form.purpose) {
      alert("Semua field wajib diisi!");
      return;
    }

    if (form.startTime && form.endTime) {
      if (new Date(form.startTime) >= new Date(form.endTime)) {
        alert("Waktu selesai harus lebih besar dari waktu mulai!");
        return;
      }
    }

    if (editingId) {
      // UPDATE
      await fetch(`${API}/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingId,
          ...form,
        }),
      });
      alert("Peminjaman berhasil diperbarui!");
      setEditingId(null);
    } else {
      // CREATE
      await fetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      alert("Peminjaman berhasil ditambahkan!");
    }

    setForm({
      borrowerName: "",
      roomName: "",
      purpose: "",
      date: "",
      status: "Pending",
      startTime: "",
      endTime: "",
    });
    fetchLoans();
    fetchStatistics();
  };

  const handleEdit = (loan: RoomLoan) => {
    setForm({
      ...loan,
      startTime: loan.startTime?.slice(0, 16) || "",
      endTime: loan.endTime?.slice(0, 16) || "",
    });
    setEditingId(loan.id || null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!window.confirm("Apakah Anda yakin ingin menghapus peminjaman ini?"))
      return;

    await fetch(`${API}/${id}`, {
      method: "DELETE",
    });
    alert("Peminjaman berhasil dihapus!");
    fetchLoans();
    fetchStatistics();
  };

  const handleApprove = async () => {
    if (!selectedLoan || !adminName.trim()) {
      alert("Nama admin wajib diisi!");
      return;
    }

    await fetch(`${API}/${selectedLoan.id}/approve`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        updatedBy: adminName,
        notes: notes,
      }),
    });

    alert("Peminjaman berhasil disetujui!");
    setShowApproveModal(false);
    setAdminName("");
    setNotes("");
    setSelectedLoan(null);
    fetchLoans();
    fetchStatistics();
  };

  const handleReject = async () => {
    if (!selectedLoan || !adminName.trim()) {
      alert("Nama admin wajib diisi!");
      return;
    }

    if (!notes.trim()) {
      alert("Alasan penolakan wajib diisi!");
      return;
    }

    await fetch(`${API}/${selectedLoan.id}/reject`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        updatedBy: adminName,
        notes: notes,
      }),
    });

    alert("Peminjaman berhasil ditolak!");
    setShowRejectModal(false);
    setAdminName("");
    setNotes("");
    setSelectedLoan(null);
    fetchLoans();
    fetchStatistics();
  };

  const openApproveModal = (loan: RoomLoan) => {
    setSelectedLoan(loan);
    setShowApproveModal(true);
  };

  const openRejectModal = (loan: RoomLoan) => {
    setSelectedLoan(loan);
    setShowRejectModal(true);
  };

  const openDetailModal = (loan: RoomLoan) => {
    setSelectedLoan(loan);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Pending: "#FFA726",
      Approved: "#66BB6A",
      Rejected: "#EF5350",
      Cancelled: "#9E9E9E",
    };
    return (
      <span
        style={{
          display: "inline-block",
          padding: "4px 12px",
          borderRadius: "20px",
          fontSize: "13px",
          fontWeight: "600",
          color: "white",
          backgroundColor: colors[status] || "#9E9E9E",
        }}
      >
        {status}
      </span>
    );
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const resetFilters = () => {
    setFilterStatus("");
    setSearchRoom("");
    setSearchBorrower("");
  };

  return (
    <div className="container" style={{ padding: "20px", maxWidth: "1200px" }}>
      <h1>📚 BookRuang</h1>
      <p style={{ textAlign: "center", color: "#7f8c8d", marginBottom: "30px" }}>
        Sistem Peminjaman Ruangan Kampus
      </p>

      {/* Statistics Dashboard */}
      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              padding: "25px",
              borderRadius: "16px",
              boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "16px", opacity: 0.9 }}>
              Total Peminjaman
            </h3>
            <p style={{ margin: "10px 0 0", fontSize: "36px", fontWeight: "700" }}>
              {stats.total}
            </p>
          </div>
          <div
            style={{
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              color: "white",
              padding: "25px",
              borderRadius: "16px",
              boxShadow: "0 4px 15px rgba(240, 147, 251, 0.3)",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "16px", opacity: 0.9 }}>
              Menunggu
            </h3>
            <p style={{ margin: "10px 0 0", fontSize: "36px", fontWeight: "700" }}>
              {stats.pending}
            </p>
          </div>
          <div
            style={{
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              color: "white",
              padding: "25px",
              borderRadius: "16px",
              boxShadow: "0 4px 15px rgba(79, 172, 254, 0.3)",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "16px", opacity: 0.9 }}>
              Disetujui
            </h3>
            <p style={{ margin: "10px 0 0", fontSize: "36px", fontWeight: "700" }}>
              {stats.approved}
            </p>
          </div>
          <div
            style={{
              background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
              color: "white",
              padding: "25px",
              borderRadius: "16px",
              boxShadow: "0 4px 15px rgba(250, 112, 154, 0.3)",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "16px", opacity: 0.9 }}>Ditolak</h3>
            <p style={{ margin: "10px 0 0", fontSize: "36px", fontWeight: "700" }}>
              {stats.rejected}
            </p>
          </div>
        </div>
      )}

      {/* Form Section */}
      <h2>{editingId ? "✏️ Edit Peminjaman" : "➕ Tambah Peminjaman"}</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Nama Peminjam"
          value={form.borrowerName}
          onChange={(e) => setForm({ ...form, borrowerName: e.target.value })}
          required
        />
        <input
          placeholder="Nama Ruangan"
          value={form.roomName}
          onChange={(e) => setForm({ ...form, roomName: e.target.value })}
          required
        />
        <input
          placeholder="Tujuan Peminjaman"
          value={form.purpose}
          onChange={(e) => setForm({ ...form, purpose: e.target.value })}
          required
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <input
            type="datetime-local"
            placeholder="Waktu Mulai"
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
          />
          <input
            type="datetime-local"
            placeholder="Waktu Selesai"
            value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
          />
        </div>
        <button type="submit">
          {editingId ? "💾 Perbarui" : "✓ Simpan"}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm({
                borrowerName: "",
                roomName: "",
                purpose: "",
                date: "",
                status: "Pending",
                startTime: "",
                endTime: "",
              });
            }}
            style={{ background: "#95a5a6", marginTop: "10px" }}
          >
            Batal Edit
          </button>
        )}
      </form>

      {/* Filter Section */}
      <h2>🔍 Filter & Pencarian</h2>
      <div
        style={{
          background: "#f8f9fa",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "15px",
          }}
        >
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "2px solid #e8eaf0",
              fontSize: "15px",
            }}
          >
            <option value="">Semua Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <input
            type="text"
            placeholder="Cari ruangan..."
            value={searchRoom}
            onChange={(e) => setSearchRoom(e.target.value)}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "2px solid #e8eaf0",
              fontSize: "15px",
              margin: 0,
            }}
          />
          <input
            type="text"
            placeholder="Cari peminjam..."
            value={searchBorrower}
            onChange={(e) => setSearchBorrower(e.target.value)}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "2px solid #e8eaf0",
              fontSize: "15px",
              margin: 0,
            }}
          />
          <button
            type="button"
            onClick={resetFilters}
            style={{
              padding: "12px",
              background: "#95a5a6",
              width: "auto",
              margin: 0,
            }}
          >
            Reset Filter
          </button>
        </div>
      </div>

      {/* List Section */}
      <h2>📋 Daftar Peminjaman ({filteredLoans.length})</h2>
      <ul>
        {filteredLoans.map((loan) => (
          <li key={loan.id}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div style={{ flex: 1, minWidth: "250px" }}>
                <strong style={{ fontSize: "18px", color: "#2c3e50" }}>
                  {loan.borrowerName}
                </strong>
                <br />
                <span style={{ color: "#7f8c8d" }}>
                  📍 {loan.roomName}
                </span>
                <br />
                <span style={{ color: "#7f8c8d", fontSize: "14px" }}>
                  {loan.purpose}
                </span>
                <br />
                <span style={{ color: "#7f8c8d", fontSize: "13px" }}>
                  🕐 {formatDateTime(loan.startTime)} - {formatDateTime(loan.endTime)}
                </span>
              </div>
              <div>
                {getStatusBadge(loan.status)}
              </div>
            </div>

            <div style={{ marginTop: "15px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => openDetailModal(loan)}
                style={{
                  background: "#3498db",
                  padding: "8px 16px",
                  fontSize: "14px",
                  width: "auto",
                  margin: 0,
                }}
              >
                👁️ Detail
              </button>

              {loan.status === "Pending" && (
                <>
                  <button
                    type="button"
                    onClick={() => openApproveModal(loan)}
                    style={{
                      background: "#27ae60",
                      padding: "8px 16px",
                      fontSize: "14px",
                      width: "auto",
                      margin: 0,
                    }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => openRejectModal(loan)}
                    style={{
                      background: "#e74c3c",
                      padding: "8px 16px",
                      fontSize: "14px",
                      width: "auto",
                      margin: 0,
                    }}
                  >
                    ✗ Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEdit(loan)}
                    style={{
                      background: "#f39c12",
                      padding: "8px 16px",
                      fontSize: "14px",
                      width: "auto",
                      margin: 0,
                    }}
                  >
                    ✏️ Edit
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => handleDelete(loan.id)}
                style={{
                  background: "#c0392b",
                  padding: "8px 16px",
                  fontSize: "14px",
                  width: "auto",
                  margin: 0,
                }}
              >
                🗑️ Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Approve Modal */}
      {showApproveModal && selectedLoan && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowApproveModal(false)}
        >
          <div
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "16px",
              maxWidth: "500px",
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0 }}>✓ Setujui Peminjaman</h2>
            <div
              style={{
                background: "#f8f9fa",
                padding: "15px",
                borderRadius: "8px",
                marginBottom: "20px",
              }}
            >
              <p style={{ margin: "5px 0" }}>
                <strong>Peminjam:</strong> {selectedLoan.borrowerName}
              </p>
              <p style={{ margin: "5px 0" }}>
                <strong>Ruangan:</strong> {selectedLoan.roomName}
              </p>
            </div>
            <input
              type="text"
              placeholder="Nama Admin/Approver *"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              style={{ marginBottom: "15px" }}
            />
            <textarea
              placeholder="Catatan (opsional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "2px solid #e8eaf0",
                fontSize: "15px",
                fontFamily: "inherit",
                marginBottom: "15px",
              }}
            />
            <button onClick={handleApprove} style={{ background: "#27ae60" }}>
              ✓ Setujui
            </button>
            <button
              onClick={() => {
                setShowApproveModal(false);
                setAdminName("");
                setNotes("");
              }}
              style={{ background: "#95a5a6", marginTop: "10px" }}
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedLoan && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowRejectModal(false)}
        >
          <div
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "16px",
              maxWidth: "500px",
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0 }}>✗ Tolak Peminjaman</h2>
            <div
              style={{
                background: "#f8f9fa",
                padding: "15px",
                borderRadius: "8px",
                marginBottom: "20px",
              }}
            >
              <p style={{ margin: "5px 0" }}>
                <strong>Peminjam:</strong> {selectedLoan.borrowerName}
              </p>
              <p style={{ margin: "5px 0" }}>
                <strong>Ruangan:</strong> {selectedLoan.roomName}
              </p>
            </div>
            <input
              type="text"
              placeholder="Nama Admin *"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              style={{ marginBottom: "15px" }}
            />
            <textarea
              placeholder="Alasan Penolakan *"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "2px solid #e8eaf0",
                fontSize: "15px",
                fontFamily: "inherit",
                marginBottom: "15px",
              }}
            />
            <button onClick={handleReject} style={{ background: "#e74c3c" }}>
              ✗ Tolak
            </button>
            <button
              onClick={() => {
                setShowRejectModal(false);
                setAdminName("");
                setNotes("");
              }}
              style={{ background: "#95a5a6", marginTop: "10px" }}
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedLoan && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setShowDetailModal(false)}
        >
          <div
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "16px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0 }}>📋 Detail Peminjaman</h2>
            
            <div style={{ marginBottom: "20px" }}>
              <p><strong>Nama Peminjam:</strong> {selectedLoan.borrowerName}</p>
              <p><strong>Ruangan:</strong> {selectedLoan.roomName}</p>
              <p><strong>Tujuan:</strong> {selectedLoan.purpose}</p>
              <p><strong>Status:</strong> {getStatusBadge(selectedLoan.status)}</p>
              <p><strong>Waktu Mulai:</strong> {formatDateTime(selectedLoan.startTime)}</p>
              <p><strong>Waktu Selesai:</strong> {formatDateTime(selectedLoan.endTime)}</p>
            </div>

            {selectedLoan.approvedBy && (
              <div
                style={{
                  background: "#d4edda",
                  border: "1px solid #c3e6cb",
                  padding: "15px",
                  borderRadius: "8px",
                  marginBottom: "15px",
                }}
              >
                <p style={{ margin: "5px 0", color: "#155724" }}>
                  <strong>✓ Disetujui oleh:</strong> {selectedLoan.approvedBy}
                </p>
                <p style={{ margin: "5px 0", color: "#155724" }}>
                  <strong>Pada:</strong> {formatDateTime(selectedLoan.approvedAt)}
                </p>
                {selectedLoan.notes && (
                  <p style={{ margin: "5px 0", color: "#155724" }}>
                    <strong>Catatan:</strong> {selectedLoan.notes}
                  </p>
                )}
              </div>
            )}

            {selectedLoan.rejectedBy && (
              <div
                style={{
                  background: "#f8d7da",
                  border: "1px solid #f5c6cb",
                  padding: "15px",
                  borderRadius: "8px",
                  marginBottom: "15px",
                }}
              >
                <p style={{ margin: "5px 0", color: "#721c24" }}>
                  <strong>✗ Ditolak oleh:</strong> {selectedLoan.rejectedBy}
                </p>
                <p style={{ margin: "5px 0", color: "#721c24" }}>
                  <strong>Pada:</strong> {formatDateTime(selectedLoan.rejectedAt)}
                </p>
                {selectedLoan.notes && (
                  <p style={{ margin: "5px 0", color: "#721c24" }}>
                    <strong>Alasan:</strong> {selectedLoan.notes}
                  </p>
                )}
              </div>
            )}

            <button
              onClick={() => setShowDetailModal(false)}
              style={{ background: "#95a5a6" }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;