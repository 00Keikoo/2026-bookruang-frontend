import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";

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

function Dashboard() {
    const navigate = useNavigate();
    const currentUser = authService.getCurrentUser();
    const isAdmin = authService.isAdmin();

    const [loans, setLoans] = useState<RoomLoan[]>([]);
    const [filteredLoans, setFilteredLoans] = useState<RoomLoan[]>([]);
    const [stats, setStats] = useState<Statistics | null>(null);
    const [form, setForm] = useState<RoomLoan>({
        borrowerName: currentUser?.fullName || "",
        roomName: "", purpose: "", date: "", status: "Pending", startTime: "", endTime: "",
    });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [filterStatus, setFilterStatus] = useState("");
    const [searchRoom, setSearchRoom] = useState("");
    const [searchBorrower, setSearchBorrower] = useState("");
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState<RoomLoan | null>(null);
    const [adminName, setAdminName] = useState(currentUser?.fullName || "");
    const [notes, setNotes] = useState("");

    const API = "http://localhost:5021/api/RoomLoans";

    const inp: React.CSSProperties = {
        width: "100%", padding: "12px", borderRadius: "8px",
        border: "2px solid #e8eaf0", fontSize: "15px", marginBottom: "12px",
        backgroundColor: "white", color: "#2c3e50", fontFamily: "inherit", boxSizing: "border-box",
    };

    const fetchLoans = async () => {
        try {
            const res = await fetch(API, { headers: authService.getAuthHeader() });
            if (res.status === 401) { authService.logout(); navigate("/login"); return; }
            const data = await res.json();
            setLoans(data); setFilteredLoans(data);
        } catch (e) { console.error(e); }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch(API + "/statistics", { headers: authService.getAuthHeader() });
            if (res.status === 401) { authService.logout(); navigate("/login"); return; }
            setStats(await res.json());
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetchLoans(); fetchStats(); }, []);

    useEffect(() => {
        let f = [...loans];
        if (filterStatus) f = f.filter(l => l.status.toLowerCase() === filterStatus.toLowerCase());
        if (searchRoom) f = f.filter(l => l.roomName.toLowerCase().includes(searchRoom.toLowerCase()));
        if (searchBorrower && isAdmin) f = f.filter(l => l.borrowerName.toLowerCase().includes(searchBorrower.toLowerCase()));
        setFilteredLoans(f);
    }, [filterStatus, searchRoom, searchBorrower, loans]);

    const resetForm = () => setForm({
        borrowerName: currentUser?.fullName || "",
        roomName: "", purpose: "", date: "", status: "Pending", startTime: "", endTime: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.borrowerName || !form.roomName || !form.purpose) { alert("Semua field wajib diisi!"); return; }
        if (form.startTime && form.endTime && new Date(form.startTime) >= new Date(form.endTime)) {
            alert("Waktu selesai harus lebih besar dari waktu mulai!"); return;
        }
        try {
            if (editingId) {
                const res = await fetch(API + "/" + editingId, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", ...authService.getAuthHeader() },
                    body: JSON.stringify({ id: editingId, ...form }),
                });
                if (!res.ok) { const err = await res.json(); alert(err.message || "Gagal update"); return; }
                alert("Peminjaman berhasil diperbarui!"); setEditingId(null);
            } else {
                const res = await fetch(API, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", ...authService.getAuthHeader() },
                    body: JSON.stringify(form),
                });
                if (!res.ok) { const err = await res.json(); alert(err.message || "Gagal simpan"); return; }
                alert("Peminjaman berhasil ditambahkan!");
            }
            resetForm(); fetchLoans(); fetchStats();
        } catch (e) { alert("Terjadi kesalahan!"); }
    };

    const handleEdit = (loan: RoomLoan) => {
        setForm({ ...loan, startTime: loan.startTime?.slice(0, 16) || "", endTime: loan.endTime?.slice(0, 16) || "" });
        setEditingId(loan.id || null);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (id?: number) => {
        if (!id || !window.confirm("Yakin ingin menghapus?")) return;
        const res = await fetch(API + "/" + id, { method: "DELETE", headers: authService.getAuthHeader() });
        if (!res.ok) { alert("Gagal menghapus"); return; }
        alert("Berhasil dihapus!"); fetchLoans(); fetchStats();
    };

    const handleApprove = async () => {
        if (!selectedLoan || !adminName.trim()) { alert("Nama admin wajib diisi!"); return; }
        const res = await fetch(API + "/" + selectedLoan.id + "/approve", {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...authService.getAuthHeader() },
            body: JSON.stringify({ updatedBy: adminName, notes }),
        });
        if (!res.ok) { const err = await res.json(); alert(err.message || "Gagal approve"); return; }
        alert("Disetujui!"); setShowApproveModal(false); setNotes(""); setSelectedLoan(null);
        fetchLoans(); fetchStats();
    };

    const handleReject = async () => {
        if (!selectedLoan || !adminName.trim()) { alert("Nama admin wajib diisi!"); return; }
        if (!notes.trim()) { alert("Alasan wajib diisi!"); return; }
        const res = await fetch(API + "/" + selectedLoan.id + "/reject", {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...authService.getAuthHeader() },
            body: JSON.stringify({ updatedBy: adminName, notes }),
        });
        if (!res.ok) { const err = await res.json(); alert(err.message || "Gagal reject"); return; }
        alert("Ditolak!"); setShowRejectModal(false); setNotes(""); setSelectedLoan(null);
        fetchLoans(); fetchStats();
    };

    const handleLogout = () => {
        if (window.confirm("Yakin logout?")) { authService.logout(); navigate("/login"); }
    };

    const badge = (status: string) => {
        const c: Record<string, string> = { Pending: "#FFA726", Approved: "#66BB6A", Rejected: "#EF5350", Cancelled: "#9E9E9E" };
        return <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: 600, color: "white", backgroundColor: c[status] || "#9E9E9E" }}>{status}</span>;
    };

    const fdt = (d?: string) => d ? new Date(d).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

    return (
        <>
            <style>{`
                .db { width:100%; padding:24px 32px; box-sizing:border-box; }

                .db-head { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:24px; flex-wrap:wrap; }
                .db-head h1 { margin:0; font-size:1.8rem; }
                .db-head p  { margin:4px 0 0; color:#7f8c8d; font-size:13px; }

                .ubox { display:flex; align-items:center; gap:12px; background:#f0f2f5; padding:10px 16px; border-radius:12px; flex-shrink:0; }
                .uname  { font-weight:600; color:#2c3e50; font-size:14px; }
                .uemail { font-size:12px; color:#7f8c8d; }

                .role-badge {
                    display:inline-block; padding:3px 10px; border-radius:20px;
                    font-size:11px; font-weight:700; letter-spacing:.5px; text-transform:uppercase;
                    background: ${isAdmin ? "linear-gradient(135deg,#667eea,#764ba2)" : "linear-gradient(135deg,#4facfe,#00f2fe)"};
                    color:white; margin-top:3px;
                }

                .sgrid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:32px; }
                .scard { color:white; padding:20px; border-radius:16px; }
                .scard h3 { margin:0; font-size:13px; opacity:.9; font-weight:600; }
                .scard p  { margin:8px 0 0; font-size:32px; font-weight:700; }

                .btn { display:block; width:100%; padding:13px 20px; margin:8px 0 0; border:none; border-radius:8px; font-size:15px; font-weight:600; font-family:inherit; cursor:pointer; transition:transform .15s, box-shadow .15s; }
                .btn:hover { transform:translateY(-2px); box-shadow:0 4px 14px rgba(0,0,0,.2); }
                .btn:active { transform:translateY(0); }
                .btn-save   { background:linear-gradient(135deg,#667eea,#764ba2); color:white; }
                .btn-cancel { background:#95a5a6; color:white; }
                .btn-reset  { display:block; width:100%; padding:12px 20px; margin:0; background:#95a5a6; color:white; border:none; border-radius:8px; font-size:15px; font-weight:600; font-family:inherit; cursor:pointer; }
                .btn-reset:hover { background:#7f8c8d; }
                .btn-logout { padding:8px 16px; background:#e74c3c; color:white; border:none; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; white-space:nowrap; }
                .btn-logout:hover { background:#c0392b; }
                .bsm { padding:7px 14px; font-size:13px; border:none; border-radius:6px; color:white; cursor:pointer; font-weight:600; font-family:inherit; white-space:nowrap; }
                .bsm:hover { opacity:.85; }

                .info-box { background:#e8f4fd; border:1px solid #bee3f8; padding:14px 18px; border-radius:10px; color:#2b6cb0; font-size:14px; margin-bottom:20px; }
                .admin-banner { background:linear-gradient(135deg,#667eea,#764ba2); color:white; padding:12px 18px; border-radius:10px; font-size:14px; font-weight:600; margin-bottom:20px; }

                .time-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px; }
                .fgrid    { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
                .lmeta    { display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px; }
                .lacts    { margin-top:12px; display:flex; gap:8px; flex-wrap:wrap; }

                .moverlay { position:fixed; inset:0; background:rgba(0,0,0,.5); display:flex; justify-content:center; align-items:center; z-index:1000; padding:16px; }
                .mbox     { background:white; padding:28px; border-radius:16px; width:100%; max-width:500px; max-height:90vh; overflow-y:auto; }
                .mbox.wide { max-width:600px; }

                @media (max-width:900px) {
                    .sgrid { grid-template-columns:repeat(2,1fr); }
                    .fgrid { grid-template-columns:repeat(2,1fr); }
                }
                @media (max-width:576px) {
                    .db { padding:16px; }
                    .db-head h1 { font-size:1.3rem; }
                    .ubox { width:100%; justify-content:space-between; }
                    .sgrid { grid-template-columns:repeat(2,1fr); gap:10px; }
                    .scard { padding:14px; }
                    .scard p { font-size:24px; }
                    .time-row { grid-template-columns:1fr; }
                    .fgrid { grid-template-columns:1fr; }
                    .bsm { font-size:12px; padding:6px 10px; }
                }
            `}</style>

            <div className="db">

                {/* Header */}
                <div className="db-head">
                    <div>
                        <h1>📚 BookRuang</h1>
                        <p>Sistem Peminjaman Ruangan Kampus</p>
                    </div>
                    <div className="ubox">
                        <div>
                            <div className="uname">👤 {currentUser?.fullName}</div>
                            <div className="uemail">{currentUser?.email}</div>
                            <div className="role-badge">{isAdmin ? "👑 Admin" : "🎓 User"}</div>
                        </div>
                        <button className="btn-logout" onClick={handleLogout}>🚪 Logout</button>
                    </div>
                </div>

                {/* Banner role */}
                {isAdmin
                    ? <div className="admin-banner">👑 Mode Admin — Kamu bisa approve, reject, dan hapus semua peminjaman</div>
                    : <div className="info-box">🎓 Kamu login sebagai <strong>User</strong>. Kamu hanya bisa melihat dan mengajukan peminjaman milikmu sendiri.</div>
                }

                {/* Stats */}
                {stats && (
                    <div className="sgrid">
                        <div className="scard" style={{ background:"linear-gradient(135deg,#667eea,#764ba2)", boxShadow:"0 4px 15px rgba(102,126,234,.3)" }}><h3>Total Peminjaman</h3><p>{stats.total}</p></div>
                        <div className="scard" style={{ background:"linear-gradient(135deg,#f093fb,#f5576c)", boxShadow:"0 4px 15px rgba(240,147,251,.3)" }}><h3>Menunggu</h3><p>{stats.pending}</p></div>
                        <div className="scard" style={{ background:"linear-gradient(135deg,#4facfe,#00f2fe)", boxShadow:"0 4px 15px rgba(79,172,254,.3)" }}><h3>Disetujui</h3><p>{stats.approved}</p></div>
                        <div className="scard" style={{ background:"linear-gradient(135deg,#fa709a,#fee140)", boxShadow:"0 4px 15px rgba(250,112,154,.3)" }}><h3>Ditolak</h3><p>{stats.rejected}</p></div>
                    </div>
                )}

                {/* Form — semua role bisa tambah */}
                <h2>{editingId ? "✏️ Edit Peminjaman" : "➕ Tambah Peminjaman"}</h2>
                <form onSubmit={handleSubmit}>
                    <input placeholder="Nama Peminjam"     value={form.borrowerName} onChange={e => setForm({...form, borrowerName:e.target.value})} required style={inp}
                        readOnly={!isAdmin} />
                    <input placeholder="Nama Ruangan"      value={form.roomName}     onChange={e => setForm({...form, roomName:e.target.value})}     required style={inp} />
                    <input placeholder="Tujuan Peminjaman" value={form.purpose}      onChange={e => setForm({...form, purpose:e.target.value})}      required style={inp} />
                    <div className="time-row">
                        <input type="datetime-local" value={form.startTime} onChange={e => setForm({...form, startTime:e.target.value})} style={{...inp, marginBottom:0}} />
                        <input type="datetime-local" value={form.endTime}   onChange={e => setForm({...form, endTime:e.target.value})}   style={{...inp, marginBottom:0}} />
                    </div>
                    <button type="submit" className="btn btn-save">{editingId ? "💾 Perbarui" : "✓ Simpan"}</button>
                    {editingId && <button type="button" className="btn btn-cancel" onClick={() => { setEditingId(null); resetForm(); }}>Batal Edit</button>}
                </form>

                {/* Filter */}
                <h2>🔍 Filter & Pencarian</h2>
                <div style={{ background:"#f0f2f5", padding:"16px", borderRadius:"12px", marginBottom:"20px" }}>
                    <div className="fgrid">
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                            style={{ padding:"12px", borderRadius:"8px", border:"2px solid #e8eaf0", fontSize:"15px", background:"white", color:"#2c3e50", width:"100%", boxSizing:"border-box" as const }}>
                            <option value="">Semua Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                        <input type="text" placeholder="Cari ruangan..."  value={searchRoom}     onChange={e => setSearchRoom(e.target.value)}     style={{...inp, marginBottom:0}} />
                        {isAdmin && <input type="text" placeholder="Cari peminjam..." value={searchBorrower} onChange={e => setSearchBorrower(e.target.value)} style={{...inp, marginBottom:0}} />}
                        <button className="btn-reset" onClick={() => { setFilterStatus(""); setSearchRoom(""); setSearchBorrower(""); }}>Reset Filter</button>
                    </div>
                </div>

                {/* List */}
                <h2>📋 {isAdmin ? "Semua Peminjaman" : "Peminjaman Saya"} ({filteredLoans.length})</h2>
                <ul>
                    {filteredLoans.map(loan => (
                        <li key={loan.id}>
                            <div className="lmeta">
                                <div style={{ flex:1, minWidth:"180px" }}>
                                    <strong style={{ fontSize:"16px", color:"#2c3e50" }}>{loan.borrowerName}</strong>
                                    {isAdmin && <span style={{ fontSize:"12px", color:"#7f8c8d", marginLeft:"8px" }}>#{loan.id}</span>}
                                    <br/>
                                    <span style={{ color:"#7f8c8d" }}>📍 {loan.roomName}</span><br/>
                                    <span style={{ color:"#7f8c8d", fontSize:"14px" }}>{loan.purpose}</span><br/>
                                    <span style={{ color:"#7f8c8d", fontSize:"13px" }}>🕐 {fdt(loan.startTime)} – {fdt(loan.endTime)}</span>
                                </div>
                                <div>{badge(loan.status)}</div>
                            </div>
                            <div className="lacts">
                                {/* Tombol Detail — semua role */}
                                <button className="bsm" style={{ background:"#3498db" }} onClick={() => { setSelectedLoan(loan); setShowDetailModal(true); }}>👁️ Detail</button>

                                {/* Tombol Admin Only */}
                                {isAdmin && loan.status === "Pending" && (<>
                                    <button className="bsm" style={{ background:"#27ae60" }} onClick={() => { setSelectedLoan(loan); setAdminName(currentUser?.fullName||""); setShowApproveModal(true); }}>✓ Approve</button>
                                    <button className="bsm" style={{ background:"#e74c3c" }} onClick={() => { setSelectedLoan(loan); setAdminName(currentUser?.fullName||""); setShowRejectModal(true); }}>✗ Reject</button>
                                </>)}

                                {/* Edit — User hanya bisa edit miliknya & status Pending */}
                                {loan.status === "Pending" && (isAdmin || loan.borrowerName === currentUser?.fullName) && (
                                    <button className="bsm" style={{ background:"#f39c12" }} onClick={() => handleEdit(loan)}>✏️ Edit</button>
                                )}

                                {/* Delete — Admin only */}
                                {isAdmin && (
                                    <button className="bsm" style={{ background:"#c0392b" }} onClick={() => handleDelete(loan.id)}>🗑️ Delete</button>
                                )}
                            </div>
                        </li>
                    ))}
                    {filteredLoans.length === 0 && (
                        <li style={{ textAlign:"center", color:"#7f8c8d", padding:"40px" }}>
                            {isAdmin ? "📭 Belum ada peminjaman" : "📭 Kamu belum punya peminjaman. Silakan tambah di atas!"}
                        </li>
                    )}
                </ul>

                {/* Approve Modal — Admin only */}
                {showApproveModal && selectedLoan && (
                    <div className="moverlay" onClick={() => setShowApproveModal(false)}>
                        <div className="mbox" onClick={e => e.stopPropagation()}>
                            <h2 style={{ marginTop:0 }}>✓ Setujui Peminjaman</h2>
                            <div style={{ background:"#f0f2f5", padding:"14px", borderRadius:"8px", marginBottom:"18px" }}>
                                <p style={{ margin:"4px 0" }}><strong>Peminjam:</strong> {selectedLoan.borrowerName}</p>
                                <p style={{ margin:"4px 0" }}><strong>Ruangan:</strong> {selectedLoan.roomName}</p>
                                <p style={{ margin:"4px 0" }}><strong>Waktu:</strong> {fdt(selectedLoan.startTime)} – {fdt(selectedLoan.endTime)}</p>
                            </div>
                            <input type="text" placeholder="Nama Admin *" value={adminName} onChange={e => setAdminName(e.target.value)} style={inp} />
                            <textarea placeholder="Catatan (opsional)" value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{...inp, resize:"vertical"} as React.CSSProperties} />
                            <button className="btn btn-save" style={{ background:"#27ae60" }} onClick={handleApprove}>✓ Setujui</button>
                            <button className="btn btn-cancel" onClick={() => { setShowApproveModal(false); setNotes(""); }}>Batal</button>
                        </div>
                    </div>
                )}

                {/* Reject Modal — Admin only */}
                {showRejectModal && selectedLoan && (
                    <div className="moverlay" onClick={() => setShowRejectModal(false)}>
                        <div className="mbox" onClick={e => e.stopPropagation()}>
                            <h2 style={{ marginTop:0 }}>✗ Tolak Peminjaman</h2>
                            <div style={{ background:"#f0f2f5", padding:"14px", borderRadius:"8px", marginBottom:"18px" }}>
                                <p style={{ margin:"4px 0" }}><strong>Peminjam:</strong> {selectedLoan.borrowerName}</p>
                                <p style={{ margin:"4px 0" }}><strong>Ruangan:</strong> {selectedLoan.roomName}</p>
                                <p style={{ margin:"4px 0" }}><strong>Waktu:</strong> {fdt(selectedLoan.startTime)} – {fdt(selectedLoan.endTime)}</p>
                            </div>
                            <input type="text" placeholder="Nama Admin *" value={adminName} onChange={e => setAdminName(e.target.value)} style={inp} />
                            <textarea placeholder="Alasan Penolakan *" value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{...inp, resize:"vertical"} as React.CSSProperties} />
                            <button className="btn btn-save" style={{ background:"#e74c3c" }} onClick={handleReject}>✗ Tolak</button>
                            <button className="btn btn-cancel" onClick={() => { setShowRejectModal(false); setNotes(""); }}>Batal</button>
                        </div>
                    </div>
                )}

                {/* Detail Modal — semua role */}
                {showDetailModal && selectedLoan && (
                    <div className="moverlay" onClick={() => setShowDetailModal(false)}>
                        <div className="mbox wide" onClick={e => e.stopPropagation()}>
                            <h2 style={{ marginTop:0 }}>📋 Detail Peminjaman</h2>
                            <div style={{ marginBottom:"18px" }}>
                                <p style={{ margin:"6px 0" }}><strong>Nama Peminjam:</strong> {selectedLoan.borrowerName}</p>
                                <p style={{ margin:"6px 0" }}><strong>Ruangan:</strong> {selectedLoan.roomName}</p>
                                <p style={{ margin:"6px 0" }}><strong>Tujuan:</strong> {selectedLoan.purpose}</p>
                                <p style={{ margin:"6px 0" }}><strong>Status:</strong> {badge(selectedLoan.status)}</p>
                                <p style={{ margin:"6px 0" }}><strong>Waktu Mulai:</strong> {fdt(selectedLoan.startTime)}</p>
                                <p style={{ margin:"6px 0" }}><strong>Waktu Selesai:</strong> {fdt(selectedLoan.endTime)}</p>
                            </div>
                            {selectedLoan.approvedBy && (
                                <div style={{ background:"#d4edda", border:"1px solid #c3e6cb", padding:"14px", borderRadius:"8px", marginBottom:"14px" }}>
                                    <p style={{ margin:"4px 0", color:"#155724" }}><strong>✓ Disetujui oleh:</strong> {selectedLoan.approvedBy}</p>
                                    <p style={{ margin:"4px 0", color:"#155724" }}><strong>Pada:</strong> {fdt(selectedLoan.approvedAt)}</p>
                                    {selectedLoan.notes && <p style={{ margin:"4px 0", color:"#155724" }}><strong>Catatan:</strong> {selectedLoan.notes}</p>}
                                </div>
                            )}
                            {selectedLoan.rejectedBy && (
                                <div style={{ background:"#f8d7da", border:"1px solid #f5c6cb", padding:"14px", borderRadius:"8px", marginBottom:"14px" }}>
                                    <p style={{ margin:"4px 0", color:"#721c24" }}><strong>✗ Ditolak oleh:</strong> {selectedLoan.rejectedBy}</p>
                                    <p style={{ margin:"4px 0", color:"#721c24" }}><strong>Pada:</strong> {fdt(selectedLoan.rejectedAt)}</p>
                                    {selectedLoan.notes && <p style={{ margin:"4px 0", color:"#721c24" }}><strong>Alasan:</strong> {selectedLoan.notes}</p>}
                                </div>
                            )}
                            <button className="btn btn-cancel" onClick={() => setShowDetailModal(false)}>Tutup</button>
                        </div>
                    </div>
                )}

            </div>
        </>
    );
}

export default Dashboard;
