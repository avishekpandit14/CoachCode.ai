import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";
import Layout from "./components/layout/Layout";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import Dashboard from "./pages/dashboard/Dashboard";
import Materials from "./pages/materials/Materials";
import Practice from "./pages/practice/Practice";
import Notes from "./pages/notes/Notes";

import Tests from "./pages/tests/Tests";
import TestAttempt from "./pages/tests/TestAttempt";

// 🔥 QUIZ SYSTEM
import MockTest from "./pages/tests/MockTest";
import QuizAttempt from "./pages/tests/QuizAttempt";
import QuizResult from "./pages/tests/QuizResult";
import CreateQuiz from "./pages/tests/CreateQuiz";

import Roadmap from "./pages/roadmap/Roadmap";
import Bookmarks from "./pages/bookmarks/Bookmarks";
import Announcements from "./pages/announcements/Announcements";
import Contests from "./pages/contests/Contests";

import AdminUsers from "./pages/admin/AdminUsers";

export default function App() {
  return (
    <Routes>
      {/* AUTH */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* PROTECTED */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* DEFAULT */}
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* MAIN */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="materials" element={<Materials />} />
        <Route path="practice" element={<Practice />} />

        <Route
          path="notes"
          element={
            <RoleRoute allowedRoles={["student"]}>
              <Notes />
            </RoleRoute>
          }
        />

        {/* OLD TEST SYSTEM */}
        <Route path="tests" element={<Tests />} />
        <Route path="tests/:id/attempt" element={<TestAttempt />} />

        {/* 🔥 NEW QUIZ SYSTEM */}
        <Route path="mock-test" element={<MockTest />} />
        <Route path="quiz/:id" element={<QuizAttempt />} />
        <Route path="quiz/:id/result" element={<QuizResult />} />

        {/* 🔥 CREATE QUIZ (ADMIN/FACULTY ONLY) */}
        <Route
          path="create-quiz"
          element={
            <RoleRoute allowedRoles={["admin", "faculty"]}>
              <CreateQuiz />
            </RoleRoute>
          }
        />

        {/* OTHER */}
        <Route path="roadmap" element={<Roadmap />} />

        <Route
          path="bookmarks"
          element={
            <RoleRoute allowedRoles={["student"]}>
              <Bookmarks />
            </RoleRoute>
          }
        />

        <Route path="announcements" element={<Announcements />} />
        <Route path="contests" element={<Contests />} />

        {/* ADMIN */}
        <Route
          path="admin/users"
          element={
            <RoleRoute allowedRoles={["admin"]}>
              <AdminUsers />
            </RoleRoute>
          }
        />
      </Route>

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}