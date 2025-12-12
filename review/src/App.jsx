import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

export default function App() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    axios.get("http://localhost:5000/api/health")
      .then(() => setStatus("ok"))
      .catch(() => setStatus("down"));
  }, []);

  return (
    <div className="App" style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      <h1>Review App</h1>
      {status === "checking" && <p>Checking backend...</p>}
      {status === "ok" && <p style={{ color: "green" }}>Backend reachable — UI ready.</p>}
      {status === "down" && <p style={{ color: "crimson" }}>Backend unreachable. Start the backend on port 5000.</p>}
      <p>Open the app pages and use the UI. This file was repaired to fix a JSX syntax error.</p>
    </div>
  );
}
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

// Clean, minimal App component — focuses on correct JSX structure
export default function App() {
  const [movies, setMovies] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // keep load simple for now; backend provides /api/health
    axios.get("http://localhost:5000/api/health")
      .then(() => setMovies([]))
      .catch((e) => setError("Backend unreachable"));
  }, []);

  return (
    <div className="App" style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      <h1>Review App (UI fixed)</h1>
      {error && <div style={{ color: "crimson" }}>{error}</div>}
      <p>Open the console or interact with the app once the backend is running.</p>
    </div>
  );
}

import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);

  const [newTitle, setNewTitle] = useState("");
  const [newYear, setNewYear] = useState("");
  const [newGenre, setNewGenre] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  // review form states
  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState("");
  const [editingReviewId, setEditingReviewId] = useState(null);

  // helper axios instance that reads token fresh before each request
  const api = axios.create({ baseURL: "http://localhost:5000/api" });
  api.interceptors.request.use(cfg => {
    return (
      <div className="App" style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
        <h1>Movie Rating App</h1>

        {!isLoggedIn ? (
          <div style={{ display: "flex", gap: 40 }}>
            <div style={{ flex: 1 }}>
              <h2>Login</h2>
              <form onSubmit={handleLogin}>
                <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
                <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="submit">Login</button>
              </form>
            </div>

            <div style={{ flex: 1 }}>
              <h2>Register</h2>
              <form onSubmit={handleRegister}>
                <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
                <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="submit">Register</button>
              </form>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2>Movies</h2>
              <div>
                <button onClick={handleLogout}>Logout</button>
              </div>
            </div>

            <form onSubmit={addMovie} style={{ marginBottom: 20 }}>
              <input placeholder="Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} required />
              <input placeholder="Year" value={newYear} onChange={e => setNewYear(e.target.value)} />
              <input placeholder="Genre" value={newGenre} onChange={e => setNewGenre(e.target.value)} />
              <input placeholder="Description" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
              <button type="submit">Add Movie</button>
            </form>

            <div style={{ display: "flex", gap: 20 }}>
              <div style={{ flex: 1 }}>
                <ul>
                  {movies.map(m => (
                    <li key={m._id} style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <strong style={{ cursor: "pointer" }} onClick={() => selectMovie(m)}>
                            {m.title} {m.year ? `(${m.year})` : ""}
                          </strong>
                          <div style={{ fontSize: 12, color: "#666" }}>{m.genre} — {m.description}</div>
                        </div>

                        <div>
                          <button onClick={() => selectMovie(m)} style={{ marginRight: 8 }}>Open</button>
                          <button onClick={() => deleteMovie(m._id)}>Delete</button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ flex: 1.2, borderLeft: "1px solid #ddd", paddingLeft: 20 }}>
                {!selectedMovie ? (
                  <div>Select a movie to see reviews and rating.</div>
                ) : (
                  <div>
                    <h3>{selectedMovie.title} {selectedMovie.year ? `(${selectedMovie.year})` : ""}</h3>
                    <p style={{ marginTop: 0 }}>{selectedMovie.description}</p>

                    <p><strong>Average:</strong> ⭐ {avgRating.toFixed(1)} ({reviewCount} reviews)</p>

                    <h4>{editingReviewId ? "Edit Your Review" : "Add Review"}</h4>
                    <form onSubmit={submitReview} style={{ marginBottom: 12 }}>
                      <select value={myRating} onChange={e => setMyRating(Number(e.target.value))}>
                        <option value={1}>1 ⭐</option>
                        <option value={2}>2 ⭐</option>
                        <option value={3}>3 ⭐</option>
                        <option value={4}>4 ⭐</option>
                        <option value={5}>5 ⭐</option>
                      </select>
                      <input placeholder="Comment" value={myComment} onChange={e => setMyComment(e.target.value)} />
                      <button type="submit">{editingReviewId ? "Update" : "Submit"}</button>
                      {editingReviewId && <button type="button" onClick={() => { setEditingReviewId(null); setMyRating(5); setMyComment(""); }}>Cancel</button>}
                    </form>

                    <h4>Reviews</h4>
                    <ul>
                      {reviews.length === 0 && <li>No reviews yet.</li>}
                      {reviews.map(r => (
                        <li key={r._id} style={{ marginBottom: 8 }}>
                          <div>
                            <strong>⭐ {r.rating}</strong> — {r.comment}
                          </div>
                          <div style={{ fontSize: 12, marginTop: 4 }}>
                            <button onClick={() => startEdit(r)} style={{ marginRight: 8 }}>Edit</button>
                            <button onClick={() => deleteReview(r._1d)}>Delete</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  export default App;
  // Edit review: populate form
  const startEdit = (review) => {
    setEditingReviewId(review._id);
    setMyRating(review.rating);
    setMyComment(review.comment || "");
  };

  // Delete review
  const deleteReview = async (id) => {
    if (!window.confirm("Delete your review?")) return;
    try {
      await api.delete(`/reviews/${id}`);
      await selectMovie(selectedMovie);
    } catch (err) {
      alert(err.response?.data || "Delete review failed");
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setSelectedMovie(null);
    setReviews([]);
  };

  return (
    <div className="App" style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      <h1>Movie Rating App</h1>

      {/* AUTH */}
      {!isLoggedIn ? (
        <div style={{ display: "flex", gap: 40 }}>
          <div style={{ flex: 1 }}>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
              <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
              <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="submit">Login</button>
            </form>
          </div>

          <div style={{ flex: 1 }}>
            <h2>Register</h2>
            <form onSubmit={handleRegister}>
              <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
              <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="submit">Register</button>
            </form>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>Movies</h2>
            <div>
              <button onClick={handleLogout}>Logout</button>
            </div>
          </div>

          {/* ADD MOVIE */}
          <form onSubmit={addMovie} style={{ marginBottom: 20 }}>
            <input placeholder="Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} required />
            <input placeholder="Year" value={newYear} onChange={e => setNewYear(e.target.value)} />
            <input placeholder="Genre" value={newGenre} onChange={e => setNewGenre(e.target.value)} />
            <input placeholder="Description" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
            <button type="submit">Add Movie</button>
          </form>

          <div style={{ display: "flex", gap: 20 }}>
            {/* MOVIE LIST */}
            <div style={{ flex: 1 }}>
              <ul>
                {movies.map(m => (
                  <li key={m._id} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong style={{ cursor: "pointer" }} onClick={() => selectMovie(m)}>
                          {m.title} {m.year ? `(${m.year})` : ""}
                        </strong>
                        <div style={{ fontSize: 12, color: "#666" }}>{m.genre} — {m.description}</div>
                      </div>

                      <div>
                        <button onClick={() => selectMovie(m)} style={{ marginRight: 8 }}>Open</button>
                        <button onClick={() => deleteMovie(m._id)}>Delete</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* DETAILS + REVIEWS */}
            <div style={{ flex: 1.2, borderLeft: "1px solid #ddd", paddingLeft: 20 }}>
              {!selectedMovie ? (
                <div>Select a movie to see reviews and rating.</div>
              ) : (
                <>
                  <h3>{selectedMovie.title} {selectedMovie.year ? `(${selectedMovie.year})` : ""}</h3>
                  <p style={{ marginTop: 0 }}>{selectedMovie.description}</p>

                  <p><strong>Average:</strong> ⭐ {avgRating.toFixed(1)} ({reviewCount} reviews)</p>

                  <h4>{editingReviewId ? "Edit Your Review" : "Add Review"}</h4>
                  <form onSubmit={submitReview} style={{ marginBottom: 12 }}>
                    <select value={myRating} onChange={e => setMyRating(Number(e.target.value))}>
                      <option value={1}>1 ⭐</option>
                      <option value={2}>2 ⭐</option>
                      <option value={3}>3 ⭐</option>
                      <option value={4}>4 ⭐</option>
                      <option value={5}>5 ⭐</option>
                    </select>
                    <input placeholder="Comment" value={myComment} onChange={e => setMyComment(e.target.value)} />
                    <button type="submit">{editingReviewId ? "Update" : "Submit"}</button>
                    {editingReviewId && <button type="button" onClick={() => { setEditingReviewId(null); setMyRating(5); setMyComment(""); }}>Cancel</button>}
                  </form>

                  <h4>Reviews</h4>
                  <ul>
                    {reviews.length === 0 && <li>No reviews yet.</li>}
                    {reviews.map(r => (
                      <li key={r._id} style={{ marginBottom: 8 }}>
                        <div>
                          <strong>⭐ {r.rating}</strong> — {r.comment}
                        </div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>
                          <button onClick={() => startEdit(r)} style={{ marginRight: 8 }}>Edit</button>
                          <button onClick={() => deleteReview(r._id)}>Delete</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        )}
    </div>
  );
}

export default App;
