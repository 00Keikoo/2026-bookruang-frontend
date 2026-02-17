import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Password tidak cocok!');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter!');
      return;
    }

    if (username.length < 3) {
      setError('Username minimal 3 karakter!');
      return;
    }

    setLoading(true);

    try {
      await authService.register({ fullName, username, email, password });  // ⬅️ Kirim semua
      alert('✅ Registrasi berhasil! Silakan login.');
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Registrasi gagal! Email atau username mungkin sudah terdaftar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>📚 BookRuang</h1>
          <p style={styles.subtitle}>Sistem Peminjaman Ruangan Kampus</p>
        </div>

        <h2 style={styles.formTitle}>Daftar Akun Baru</h2>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleRegister}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nama</label>
            <input
              type="text"
              placeholder="Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={styles.input}
              required
              disabled={loading}
            />
          </div>

          {/* ⬅️ TAMBAH FIELD USERNAME */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              required
              disabled={loading}
              minLength={3}
              maxLength={100}
            />
            <small style={styles.hint}>Minimal 3 karakter, tanpa spasi</small>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
              disabled={loading}
              minLength={6}
            />
            <small style={styles.hint}>Minimal 6 karakter</small>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Konfirmasi Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={styles.input}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? '⏳ Memproses...' : '✓ Daftar'}
          </button>
        </form>

        <p style={styles.footer}>
          Sudah punya akun? <Link to="/login" style={styles.link}>Login di sini</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    padding: '20px',
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '20px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    width: '100%',
    maxWidth: '450px',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '30px',
  },
  title: {
    margin: 0,
    fontSize: '2.5em',
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    margin: '10px 0 0',
    color: '#7f8c8d',
    fontSize: '14px',
  },
  formTitle: {
    marginTop: 0,
    marginBottom: '25px',
    color: '#2c3e50',
    fontSize: '24px',
  },
  inputGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#2c3e50',
    fontWeight: '600' as const,
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '14px',
    borderRadius: '10px',
    border: '2px solid #e8eaf0',
    fontSize: '16px',
    boxSizing: 'border-box' as const,
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
    backgroundColor: 'white',
    color: '#2c3e50',
  },
  hint: {
    display: 'block',
    marginTop: '5px',
    color: '#95a5a6',
    fontSize: '12px',
  },
  button: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'transform 0.2s ease',
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '12px',
    borderRadius: '10px',
    marginBottom: '20px',
    fontSize: '14px',
    border: '1px solid #fcc',
  },
  footer: {
    textAlign: 'center' as const,
    marginTop: '25px',
    color: '#7f8c8d',
    fontSize: '14px',
  },
  link: {
    color: '#f5576c',
    textDecoration: 'none',
    fontWeight: '600' as const,
  },
};

export default Register;