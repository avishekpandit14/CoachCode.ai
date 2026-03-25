import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const studentNav = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/materials", label: "Materials" },
  { to: "/practice", label: "Practice" },
  { to: "/notes", label: "Notes" },

  // 🔥 FIXED
  { to: "/mock-test", label: "Mock Tests" },

  { to: "/roadmap", label: "Roadmap" },
  { to: "/bookmarks", label: "Bookmarks" },
  { to: "/announcements", label: "Announcements" },
  { to: "/contests", label: "Contests" },
];

const facultyNav = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/materials", label: "Materials" },
  { to: "/practice", label: "Practice" },
  

  // 🔥 FIXED
  { to: "/mock-test", label: "Mock Tests" },

  { to: "/roadmap", label: "Roadmap" },
  { to: "/announcements", label: "Announcements" },
  { to: "/contests", label: "Contests" },
  { to: "/create-quiz", label: "Create Quiz" },
];

const adminNav = [
  ...facultyNav,
  { to: "/admin/users", label: "Manage Users" },
  
];

export default function Sidebar() {
  const { user } = useAuth();

  const nav =
    user?.role === "admin"
      ? adminNav
      : user?.role === "faculty"
      ? facultyNav
      : studentNav;

  return (
    <aside
      style={{
        width: "220px",
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        padding: "1rem 0",
      }}
    >
      <div
        style={{
          padding: "0 1rem 1rem",
          borderBottom: "1px solid var(--border)",
          marginBottom: "0.5rem",
        }}
      >
        <strong style={{ fontSize: "1.1rem" }}>CoachCode.ai</strong>
      </div>

      <nav>
        {nav.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: "block",
              padding: "0.5rem 1rem",
              color: isActive ? "var(--primary)" : "var(--text)",
              background: isActive
                ? "rgba(88, 166, 255, 0.1)"
                : "transparent",
              borderLeft: isActive
                ? "3px solid var(--primary)"
                : "3px solid transparent",
            })}
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}