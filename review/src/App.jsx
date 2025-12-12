import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

export default function App() {
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

  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState("");
  const [editingReviewId, setEditingReviewId] = useState(null);

  // 🔥 Axios instance using Vite environment variable
  const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
  });

  // Attach JWT token before every request
  API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // --------------------------
  // AUTH FUNCTIONS
  // --------------------------
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await API.post("/auth/register", { username, password });
      alert("Registration successful!");
    } catch (err) {
      alert(err.response?.data || "Registration failed");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/login", { username, password });
      localStorage.setItem("token", res.data.token);
      setIsLoggedIn(true);
      loadMovies();
    } catch (err) {
      alert(err.response?.data || "Login failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setSelectedMovie(null);
    setReviews([]);
  };

  // --------------------------
  // MOVIE FUNCTIONS
  // --------------------------
  const loadMovies = async () => {
    const res = await API.get("/movies");
    setMovies(res.data);
  };

  const addMovie = async (e) => {
    e.preventDefault();
    try {
      await API.post("/movies", {
        title: newTitle,
        year: newYear,
        genre: newGenre,
        description: newDesc,
      });
      setNewTitle("");
      setNewYear("");
      setNewGenre("");
      setNewDesc("");
      loadMovies();
    } catch (err) {
      alert("Error adding movie");
    }
  };

  const deleteMovie = async (id) => {
    if (!window.confirm("Delete this movie?")) return;
    await API.delete(`/movies/${id}`);
    loadMovies();
    setSelectedMovie(null);
  };

  const selectMovie = async (movie) => {
    setSelectedMovie(movie);
    loadMovieReviews(movie._id);
  };

  // --------------------------
  // REVIEW FUNCTIONS
  // --------------------------
  const loadMovieReviews = async (movieId) => {
    const res = await API.get(`/reviews/movie/${movieId}`);
    setReviews(res.data.reviews);
    setAvgRating(res.data.avg);
    setReviewCount(res.data.count);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      if (editingReviewId) {
        await API.put(`/reviews/${editingReviewId}`, {
          rating: myRating,
          comment: myComment,
        });
      } else {
        await API.post("/reviews", {
          movieId: selectedMovie._id,
          rating: myRating,
          comment: myComment,
        });
      }

      setMyRating(5);
      setMyComment("");
      setEditingReviewId(null);
      loadMovieReviews(selectedMovie._id);
    } catch (err) {
      alert("Review failed");
    }
  };

  const deleteReview = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    await API.delete(`/reviews/${id}`);
    loadMovieReviews(selectedMovie._id);
  };

  const startEdit = (review) => {
    setEditingReviewId(review._id);
    setMyRating(review.rating);
    setMyComment(review.comment);
  };

  // --------------------------
  // CHECK BACKEND ON LOAD
  // --------------------------
  useEffect(() => {
    API.get("/api/health").catch(() => {});
    if (localStorage.getItem("token")) {
      setIsLoggedIn(true);
      loadMovies();
    }
  }, []);

  return (
    <div className="App" style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      <h1>🎬 Movie Rating App</h1>

      {!isLoggedIn ? (
        <div style={{ display: "flex", gap: 40 }}>
          <div style={{ flex: 1 }}>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
              <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="submit">Login</button>
            </form>
          </div>

          <div style={{ flex: 1 }}>
            <h2>Register</h2>
            <form onSubmit={handleRegister}>
              <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="submit">Register</button>
            </form>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>Movies</h2>
            <button onClick={handleLogout}>Logout</button>
          </div>

          <form onSubmit={addMovie} style={{ marginBottom: 20 }}>
            <input placeholder="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
            <input placeholder="Year" value={newYear} onChange={(e) => setNewYear(e.target.value)} />
            <input placeholder="Genre" value={newGenre} onChange={(e) => setNewGenre(e.target.value)} />
            <input placeholder="Description" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
            <button type="submit">Add Movie</button>
          </form>

          <div style={{ display: "flex", gap: 20 }}>
            <div style={{ flex: 1 }}>
              <ul>
                {movies.map((m) => (
                  <li key={m._id} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div>
                        <strong style={{ cursor: "pointer" }} onClick={() => selectMovie(m)}>
                          {m.title} {m.year ? `(${m.year})` : ""}
                        </strong>
                        <div style={{ fontSize: 12, color: "#666" }}>
                          {m.genre} — {m.description}
                        </div>
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
                <div>Select a movie to view and add reviews.</div>
              ) : (
                <>
                  <h3>{selectedMovie.title} {selectedMovie.year ? `(${selectedMovie.year})` : ""}</h3>
                  <p>{selectedMovie.description}</p>

                  <p><strong>Average Rating:</strong> ⭐ {avgRating.toFixed(1)} ({reviewCount} reviews)</p>

                  <h4>{editingReviewId ? "Edit Your Review" : "Add Review"}</h4>
                  <form onSubmit={submitReview} style={{ marginBottom: 12 }}>
                    <select value={myRating} onChange={(e) => setMyRating(Number(e.target.value))}>
                      <option value={1}>1 ⭐</option>
                      <option value={2}>2 ⭐</option>
                      <option value={3}>3 ⭐</option>
                      <option value={4}>4 ⭐</option>
                      <option value={5}>5 ⭐</option>
                    </select>

                    <input placeholder="Comment" value={myComment} onChange={(e) => setMyComment(e.target.value)} />
                    <button type="submit">{editingReviewId ? "Update" : "Submit"}</button>

                    {editingReviewId && (
                      <button type="button" onClick={() => { 
                        setEditingReviewId(null); 
                        setMyRating(5); 
                        setMyComment(""); 
                      }}>
                        Cancel
                      </button>
                    )}
                  </form>

                  <h4>Reviews</h4>
                  <ul>
                    {reviews.length === 0 && <li>No reviews yet.</li>}

                    {reviews.map((r) => (
                      <li key={r._id} style={{ marginBottom: 8 }}>
                        <div><strong>⭐ {r.rating}</strong> — {r.comment}</div>
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
        </>
      )}
    </div>
  );
}
