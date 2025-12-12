import React, { useEffect, useState } from "react";
import "./App.css";

function useToken() {
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const save = (t) => {
    if (t) localStorage.setItem("token", t); else localStorage.removeItem("token");
    setToken(t);
  };
  return { token, setToken: save };
}

const API = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function App() {
  const [status, setStatus] = useState(null);
  const { token, setToken } = useToken();
  const [user, setUser] = useState(null);

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);

  // Auth form
  const [authMode, setAuthMode] = useState("login"); // or register
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Add movie form
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetch(`${API}/api/health`)
      .then((r) => r.json())
      .then((d) => setStatus(d))
      .catch(() => setStatus({ ok: false }));

    loadMovies();
    // if token exists, load profile
    if (token) loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const res = await fetch(`${API}/api/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const j = await res.json();
      setUser(j);
    } catch (err) {
      console.error('Load profile', err);
      setUser(null);
    }
  }

  async function loadMovies() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/movies`);
      const data = await res.json();
      // For each movie, fetch rating
      const withRatings = await Promise.all(data.map(async (m) => {
        try {
          const rr = await fetch(`${API}/api/movies/${m._id}/rating`);
          const rj = await rr.json();
          return { ...m, rating: rj.avgRating ? Number(rj.avgRating).toFixed(2) : null, ratingCount: rj.count || 0 };
        } catch (e) {
          return { ...m, rating: null, ratingCount: 0 };
        }
      }));
      setMovies(withRatings);
    } catch (err) {
      console.error("Load movies error", err);
    }
    setLoading(false);
  }

  async function handleRegisterOrLogin(e) {
    e.preventDefault();
    const url = authMode === "login" ? `${API}/api/login` : `${API}/api/register`;
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      if (!res.ok) {
        const text = await res.text();
        alert(text || "Auth error");
        return;
      }
      if (authMode === "login") {
        const json = await res.json();
        setToken(json.token);
        // fetch profile
        await loadProfile();
        setUsername(""); setPassword("");
      } else {
        alert("Registered — now log in.");
        setAuthMode("login");
      }
    } catch (err) {
      console.error(err);
      alert("Auth failed");
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  async function handleAddMovie(e) {
    e.preventDefault();
    if (!token) return alert("You must be logged in to add a movie.");
    try {
      const res = await fetch(`${API}/api/movies`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, year: year ? Number(year) : undefined, genre, description })
      });
      if (!res.ok) {
        const txt = await res.text();
        alert(txt || "Error creating movie");
        return;
      }
      setTitle(""); setYear(""); setGenre(""); setDescription("");
      await loadMovies();
    } catch (err) {
      console.error(err);
      alert("Error adding movie");
    }
  }

  // Edit / Delete
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editGenre, setEditGenre] = useState('');
  const [editDescription, setEditDescription] = useState('');

  function beginEdit(m) {
    setEditingId(m._id);
    setEditTitle(m.title || '');
    setEditYear(m.year || '');
    setEditGenre(m.genre || '');
    setEditDescription(m.description || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (!token) return alert('Not authenticated');
    try {
      const res = await fetch(`${API}/api/movies/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: editTitle, year: editYear ? Number(editYear) : undefined, genre: editGenre, description: editDescription })
      });
      if (!res.ok) {
        const txt = await res.text();
        alert(txt || 'Error updating movie');
        return;
      }
      setEditingId(null);
      await loadMovies();
    } catch (err) {
      console.error(err);
      alert('Error updating movie');
    }
  }

  async function deleteMovie(id) {
    if (!token) return alert('Not authenticated');
    if (!confirm('Delete this movie?')) return;
    try {
      const res = await fetch(`${API}/api/movies/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const txt = await res.text();
        alert(txt || 'Error deleting movie');
        return;
      }
      await loadMovies();
    } catch (err) {
      console.error(err);
      alert('Error deleting movie');
    }
  }

  // Reviews per movie state
  const [openReviewsFor, setOpenReviewsFor] = useState(null);
  const [reviews, setReviews] = useState({}); // movieId -> reviews array
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  async function loadReviews(movieId) {
    try {
      const res = await fetch(`${API}/api/reviews/${movieId}`);
      const j = await res.json();
      setReviews(prev => ({ ...prev, [movieId]: j }));
    } catch (err) {
      console.error("Load reviews", err);
    }
  }

  async function submitReview(e, movieId) {
    e.preventDefault();
    if (!token) return alert("Log in to post a review.");
    try {
      const res = await fetch(`${API}/api/reviews/${movieId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating: Number(reviewRating), comment: reviewComment })
      });
      if (!res.ok) {
        const txt = await res.text();
        alert(txt || "Error posting review");
        return;
      }
      setReviewComment(""); setReviewRating(5);
      await loadReviews(movieId);
      await loadMovies();
    } catch (err) {
      console.error(err);
      alert("Error posting review");
    }
  }

  async function deleteReview(reviewId, movieId) {
    if (!token) return alert('Log in to delete review');
    if (!confirm('Delete this review?')) return;
    try {
      const res = await fetch(`${API}/api/reviews/${reviewId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const txt = await res.text();
        alert(txt || 'Error deleting review');
        return;
      }
      // refresh reviews and movie ratings
      await loadReviews(movieId);
      await loadMovies();
    } catch (err) {
      console.error('Delete review', err);
      alert('Error deleting review');
    }
  }

  // enforce login-first: if no token, show centered auth form
  if (!token || !user) {
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
        <div style={{width:420,background:'rgba(255,255,255,0.02)',padding:20,borderRadius:12}}>
          <h2 style={{marginTop:0}}>Welcome — please {authMode==='login'?'login':'register'}</h2>
          <form onSubmit={handleRegisterOrLogin} style={{display:'flex',flexDirection:'column',gap:8}}>
            <input placeholder="Username" value={username} onChange={(e)=>setUsername(e.target.value)} style={{padding:8,borderRadius:6,border:'1px solid rgba(255,255,255,0.04)',background:'transparent',color:'inherit'}} />
            <input placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} style={{padding:8,borderRadius:6,border:'1px solid rgba(255,255,255,0.04)',background:'transparent',color:'inherit'}} />
            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button className="btn" type="submit">{authMode==='login'?'Login':'Register'}</button>
              <button type="button" className="btn secondary" onClick={()=>setAuthMode(a=>a==='login'?'register':'login')}>{authMode==='login'?'Switch to Register':'Switch to Login'}</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <div className="eyebrow">Movie Reviews</div>
          <div className="status-badge">Backend: {status ? (status.ok ? "Healthy" : "Unavailable") : "Checking..."}</div>
        </div>
        <div>
          {token ? (
            <button className="btn" onClick={logout}>Logout</button>
          ) : (
            <div style={{display:'flex',gap:8}}>
              <button className="btn secondary" onClick={() => setAuthMode(a => a === 'login' ? 'register' : 'login')}>{authMode === 'login' ? 'Register' : 'Login'}</button>
            </div>
          )}
        </div>
      </div>

      <div className="hero" style={{marginBottom:18}}>
        <div className="hero-left">
          <h1 className="title">Discover & Rate Movies</h1>
          <p className="lead">Browse community movies, add new entries, and post ratings. Log in to add movies or review them.</p>

          <div className="cta-row">
            <button className="btn" onClick={() => window.scrollTo({top:1000,behavior:'smooth'})}>Browse Movies</button>
            <button className="btn secondary" onClick={() => window.scrollTo({top:1800,behavior:'smooth'})}>Add Movie</button>
          </div>
        </div>
        <div className="hero-right">
          <div className="card-preview">
            <strong style={{display:'block',marginBottom:8}}>Quick Actions</strong>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <div style={{color:'#9aa4b2',fontSize:13}}>Movies: {movies.length}</div>
              <div style={{color:'#9aa4b2',fontSize:13}}>Logged in: {token ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:20}}>
        <div>
          <h3 style={{marginTop:0}}>Movies</h3>
          {loading && <div>Loading movies…</div>}
          {!loading && movies.map(m => (
            <div key={m._id} style={{background:'rgba(255,255,255,0.02)',padding:14,borderRadius:10,marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontWeight:700}}>{m.title} {m.year ? `(${m.year})` : ''}</div>
                  <div style={{color:'#9aa4b2',fontSize:13}}>{m.genre || '—'}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontWeight:700}}>{m.rating ? `${m.rating} ⭐` : 'No rating'}</div>
                  <div style={{color:'#9aa4b2',fontSize:13}}>{m.ratingCount} reviews</div>
                </div>
              </div>
              <p style={{color:'#9aa4b2',marginTop:8}}>{m.description}</p>
              <div style={{display:'flex',gap:8}}>
                <button className="btn secondary" onClick={async () => { setOpenReviewsFor(m._id); await loadReviews(m._id); }}>Reviews</button>
                <button className="btn" onClick={() => { setOpenReviewsFor(m._id); setReviewRating(5); setReviewComment(''); }}>Add Review</button>
                {m.createdBy && user && String(m.createdBy) === String(user.id) && (
                  <>
                    <button className="btn secondary" onClick={() => beginEdit(m)}>Edit</button>
                    <button className="btn" onClick={() => deleteMovie(m._id)}>Delete</button>
                  </>
                )}
              </div>

              {openReviewsFor === m._id && (
                <div style={{marginTop:12}}>
                  <div style={{marginBottom:8,fontWeight:700}}>Reviews</div>
                  {(reviews[m._id] || []).map(r => (
                    <div key={r._id} style={{padding:8,background:'rgba(0,0,0,0.25)',borderRadius:8,marginBottom:8}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <div style={{fontWeight:700}}>{r.user?.username || 'User' } — {r.rating} ⭐</div>
                        {user && r.user && String(r.user._id) === String(user.id) && (
                          <button className="btn secondary" onClick={() => deleteReview(r._id, m._id)}>Delete</button>
                        )}
                      </div>
                      <div style={{color:'#9aa4b2',fontSize:13}}>{new Date(r.createdAt).toLocaleString()}</div>
                      <div style={{marginTop:6}}>{r.comment}</div>
                    </div>
                  ))}

                  <form onSubmit={(e) => submitReview(e, m._id)} style={{marginTop:8,display:'flex',flexDirection:'column',gap:8}}>
                    <div style={{display:'flex',gap:8,alignItems:'center'}}>
                      <label style={{color:'#9aa4b2'}}>Rating</label>
                      <select value={reviewRating} onChange={(e)=>setReviewRating(e.target.value)}>
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                        <option value={4}>4</option>
                        <option value={5}>5</option>
                      </select>
                      <input placeholder="Comment (optional)" value={reviewComment} onChange={(e)=>setReviewComment(e.target.value)} style={{flex:1,padding:8,borderRadius:8,border:'1px solid rgba(255,255,255,0.04)',background:'transparent',color:'inherit'}} />
                      <button className="btn" type="submit">Post</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>

        <aside>
          <div style={{background:'rgba(255,255,255,0.02)',padding:14,borderRadius:10}}>
            <h4 style={{marginTop:0}}>User</h4>
            <div style={{marginBottom:8}}>Signed in as <strong>{user?.username}</strong></div>
            <button className="btn" onClick={logout}>Logout</button>
          </div>

          <div style={{height:18}}/>

          <div style={{background:'rgba(255,255,255,0.02)',padding:14,borderRadius:10}}>
            <h4 style={{marginTop:0}}>Add Movie</h4>
            <form onSubmit={handleAddMovie} style={{display:'flex',flexDirection:'column',gap:8}}>
              <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} style={{padding:8,borderRadius:6,border:'1px solid rgba(255,255,255,0.04)',background:'transparent',color:'inherit'}} />
              <input placeholder="Year" value={year} onChange={e=>setYear(e.target.value)} style={{padding:8,borderRadius:6,border:'1px solid rgba(255,255,255,0.04)',background:'transparent',color:'inherit'}} />
              <input placeholder="Genre" value={genre} onChange={e=>setGenre(e.target.value)} style={{padding:8,borderRadius:6,border:'1px solid rgba(255,255,255,0.04)',background:'transparent',color:'inherit'}} />
              <textarea placeholder="Short description" value={description} onChange={e=>setDescription(e.target.value)} style={{padding:8,borderRadius:6,border:'1px solid rgba(255,255,255,0.04)',background:'transparent',color:'inherit'}} />
              <button className="btn" type="submit">Add Movie</button>
            </form>
          </div>
          {editingId && (
            <div style={{height:18}} />
          )}
          {editingId && (
            <div style={{background:'rgba(255,255,255,0.02)',padding:14,borderRadius:10,marginTop:12}}>
              <h4 style={{marginTop:0}}>Edit Movie</h4>
              <form onSubmit={saveEdit} style={{display:'flex',flexDirection:'column',gap:8}}>
                <input value={editTitle} onChange={e=>setEditTitle(e.target.value)} style={{padding:8,borderRadius:6,border:'1px solid rgba(255,255,255,0.04)',background:'transparent',color:'inherit'}} />
                <input value={editYear} onChange={e=>setEditYear(e.target.value)} style={{padding:8,borderRadius:6,border:'1px solid rgba(255,255,255,0.04)',background:'transparent',color:'inherit'}} />
                <input value={editGenre} onChange={e=>setEditGenre(e.target.value)} style={{padding:8,borderRadius:6,border:'1px solid rgba(255,255,255,0.04)',background:'transparent',color:'inherit'}} />
                <textarea value={editDescription} onChange={e=>setEditDescription(e.target.value)} style={{padding:8,borderRadius:6,border:'1px solid rgba(255,255,255,0.04)',background:'transparent',color:'inherit'}} />
                <div style={{display:'flex',gap:8}}>
                  <button className="btn" type="submit">Save</button>
                  <button type="button" className="btn secondary" onClick={()=>setEditingId(null)}>Cancel</button>
                </div>
              </form>
            </div>
          )}
        </aside>
      </div>

      <div className="footer">Built with Express, MongoDB, and Vite + React. Replace this demo with your app UI.</div>
    </div>
  );
}
