import { useState, useEffect } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

export default function Announcements() {
  const { user } = useAuth();
  const isStaff = user?.role === "admin" || user?.role === "faculty";
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  const loadAnnouncements = () => {
    api.get("/announcements")
      .then(({ data }) => {
        if (data.success) setAnnouncements(data.data);
      })
      .catch(() => toast.error("Failed to load announcements"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const createAnnouncement = async () => {
    if (!title.trim() || !body.trim()) return toast.error("Title and description are required.");
    setPosting(true);
    try {
      const { data } = await api.post("/announcements", { title: title.trim(), body: body.trim() });
      if (data.success) {
        toast.success("Announcement posted");
        setTitle("");
        setBody("");
        loadAnnouncements();
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to post announcement");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="container">
      <h1>Announcements</h1>
      <p style={{ color: "var(--text-muted)" }}>
        Faculty and admin announcements.
      </p>

      {isStaff && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>Create Announcement</h3>
          <input
            placeholder="Announcement title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            placeholder="Write announcement content"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            style={{ width: "100%", marginTop: 8 }}
          />
          <button className="btn btn-primary" onClick={createAnnouncement} disabled={posting} style={{ marginTop: 8 }}>
            {posting ? "Posting..." : "Post Announcement"}
          </button>
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : announcements.length === 0 ? (
        <div className="card">No announcements yet.</div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {announcements.map((a) => (
            <li
              key={a.id}
              className="card"
              style={{ marginBottom: "0.5rem" }}
            >
              <strong>{a.title}</strong>

              {a.User && (
                <span
                  style={{
                    color: "var(--text-muted)",
                    marginLeft: "0.5rem",
                  }}
                >
                  — {a.User.name}
                </span>
              )}

              <p style={{ margin: "0.5rem 0 0" }}>
                {a.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}