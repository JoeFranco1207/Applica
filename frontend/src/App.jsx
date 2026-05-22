import { useEffect } from "react";
import { Routes, Route, Outlet, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import GlobalTranslator from "./components/GlobalTranslator";
import ProtectedRoute from "./components/ProtectedRoute";
import { NotificationProvider } from "./contexts/NotificationContext";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Create from "./pages/Create/ProfileSelection";
import CreateEmployerProfile from "./pages/Create/CreateEmployerProfile";
import CreateJobseekerProfile from "./pages/Create/CreateJobseekerProfile";
import CreateJob from "./pages/Create/CreateJob";
import Profile from "./pages/Profile";
import PostView from "./pages/PostView";
import BrowseJob from "./pages/Browse/BrowseJob";
import EmployerApplicants from "./pages/EmployerApplicants";
import ResumeDesigns from "./pages/ResumeDesigns";
import Chat from "./pages/Chat";
import UserSessions from "./pages/Admin/UserSessions";

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let storedUser = null;
    try {
      storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    } catch (error) {
      storedUser = null;
    }

    if (
      storedUser?.role === "user" &&
      !location.pathname.startsWith("/create") &&
      location.pathname !== "/auth"
    ) {
      navigate("/create", { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <>
      <Navbar />
      <GlobalTranslator />
      <Outlet />
      <Footer />
    </>
  );
}

function App() {
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        if (status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          if (window.location.pathname !== "/auth") {
            window.location.href = "/auth";
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  return (
    <NotificationProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/auth" element={<Signup />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/" element={<Landing />} />
          <Route path="/explore" element={<ProtectedRoute><BrowseJob /></ProtectedRoute>} />
          <Route path="/create/employer" element={<ProtectedRoute><CreateEmployerProfile /></ProtectedRoute>} />
          <Route path="/create/jobseeker" element={<ProtectedRoute><CreateJobseekerProfile /></ProtectedRoute>} />
          <Route path="/create/job" element={<ProtectedRoute><CreateJob /></ProtectedRoute>} />
          <Route path="/create" element={<ProtectedRoute><Create /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/post/:id" element={<ProtectedRoute><PostView /></ProtectedRoute>} />
          <Route path="/resume-designs" element={<ProtectedRoute><ResumeDesigns /></ProtectedRoute>} />
          <Route path="/employer/applicants" element={<ProtectedRoute><EmployerApplicants /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/admin/users/:id/sessions" element={<ProtectedRoute><UserSessions /></ProtectedRoute>} />
        </Route>
      </Routes>
    </NotificationProvider>
  );
}

export default App;