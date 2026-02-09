import { useEffect, useState } from "react";
import "./App.css";

type RoomLoan = {
  id?: number;
  borrowerName: string;
  roomName: string;
  purpose: string;
  date: string;
  status: string;
};

function App() {
  const [loans, setLoans] = useState<RoomLoan[]>([]);
  const [form, setForm] = useState<RoomLoan>({
    borrowerName: "",
    roomName: "",
    purpose: "",
    date: "",
    status: "pending",
  });

  const API = "http://localhost:5021/api/RoomLoans";

  const fetchLoans = async () => {
    const res = await fetch(API);
    const data = await res.json();
    setLoans(data);
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });
    setForm({
      borrowerName: "",
      roomName: "",
      purpose: "",
      date: "",
      status: "pending",
    });
    fetchLoans();
  };

  return (
    <div className="container">
      <h1>BookRuang</h1>
      <h2>Tambah Peminjaman</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Nama Peminjam"
          value={form.borrowerName}
          onChange={(e) => setForm({ ...form, borrowerName: e.target.value })}
        />
        <br />
        <input
          placeholder="Nama Ruangan"
          value={form.roomName}
          onChange={(e) => setForm({ ...form, roomName: e.target.value })}
        />
        <br />
        <input
          placeholder="Tujuan"
          value={form.purpose}
          onChange={(e) => setForm({ ...form, purpose: e.target.value })}
        />
        <br />
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
        <br />
        <button type="submit">Simpan</button>
      </form>
      <h2>Daftar Peminjaman</h2>
      <ul>
        {loans.map((loan) => (
          <li key={loan.id}>
            {loan.borrowerName} - {loan.roomName} - {loan.date} ({loan.status})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;