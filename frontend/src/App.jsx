import { useEffect } from "react";
import { Routes, Route, Outlet, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import GlobalTranslator from "./components/GlobalTranslator";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import { NotificationProvider } from "./contexts/NotificationContext";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Create from "./pages/Create/ProfileSelection";
import CreateEmployerProfile from "./pages/Create/CreateEmployerProfile";
import CreateJobseekerProfile from "./pages/Create/CreateJobseekerProfile";
import CreateJob from "./pages/Create/CreateJob";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import PostView from "./pages/PostView";
import BrowseJob from "./pages/Browse/BrowseJob";
import EmployerApplicants from "./pages/EmployerApplicants";
import EmployerDashboard from "./pages/EmployerDashboard";
import EmployerInterviews from "./pages/EmployerInterviews";
import JobseekerInterviews from "./pages/JobseekerInterviews";
import JobseekerApplications from "./pages/JobseekerApplications";
import InterviewRoom from "./pages/InterviewRoom";
import ResumeDesigns from "./pages/ResumeDesigns";
import Chat from "./pages/Chat";
import UserSessions from "./pages/Admin/UserSessions";
import Moderation from "./pages/Admin/Moderation";
import AdminDashboard from "./pages/Admin/Dashboard";
import AdminEmployers from "./pages/Admin/Employers";
import AdminReports from "./pages/Admin/Reports";
import AdminSubscriptions from "./pages/Admin/Subscriptions";
import AdminNotifications from "./pages/Admin/Notifications";
import AdminMaintenance from "./pages/Admin/Maintenance";
import AdminTeam from "./pages/Admin/Team";
import AIPaymentSuccess from "./pages/AIPaymentSuccess";
import AIPremium from "./pages/AIPremium";
import GCashPayment from './pages/Payment/GCashPayment';
import QRPayment from './pages/Payment/QRPayment';
import CardPayment from './pages/Payment/CardPayment';
import AdminAccess from './pages/AdminAccess';

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
        {/* Public payment redirect pages (no layout, no auth required) */}
        <Route path="/ai-premium/success" element={<AIPaymentSuccess page="success" />} />
        <Route path="/payment/gcash" element={<GCashPayment />} />
        <Route path="/payment/qr" element={<QRPayment />} />
        <Route path="/payment/card" element={<CardPayment />} />
        <Route path="/payment-failed" element={<AIPaymentSuccess page="failed" />} />
        <Route path="/payment-cancelled" element={<AIPaymentSuccess page="cancelled" />} />
        <Route path="/ai-premium/failed" element={<AIPaymentSuccess page="failed" />} />
        
        {/* Main app with layout and auth */}
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
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/post/:id" element={<ProtectedRoute><PostView /></ProtectedRoute>} />
          <Route path="/resume-designs" element={<ProtectedRoute><ResumeDesigns /></ProtectedRoute>} />
          <Route path="/ai-premium" element={<ProtectedRoute><AIPremium /></ProtectedRoute>} />
          <Route path="/employer/dashboard" element={<ProtectedRoute><EmployerDashboard /></ProtectedRoute>} />
          <Route path="/employer/applicants" element={<ProtectedRoute><EmployerApplicants /></ProtectedRoute>} />
          <Route path="/employer/interviews" element={<ProtectedRoute><EmployerInterviews /></ProtectedRoute>} />
          <Route path="/jobseeker/interviews" element={<ProtectedRoute><JobseekerInterviews /></ProtectedRoute>} />
          <Route path="/jobseeker/applications" element={<ProtectedRoute><JobseekerApplications /></ProtectedRoute>} />
          <Route path="/interview/:roomId" element={<ProtectedRoute><InterviewRoom /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        </Route>

        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/moderation" element={<ProtectedRoute><Moderation /></ProtectedRoute>} />
          <Route path="/admin/employers" element={<ProtectedRoute><AdminEmployers /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute><AdminReports /></ProtectedRoute>} />
          <Route path="/admin/subscriptions" element={<ProtectedRoute><AdminSubscriptions /></ProtectedRoute>} />
          <Route path="/admin/notifications" element={<ProtectedRoute><AdminNotifications /></ProtectedRoute>} />
          <Route path="/admin/maintenance" element={<ProtectedRoute><AdminMaintenance /></ProtectedRoute>} />
          <Route path="/admin/team" element={<ProtectedRoute><AdminTeam /></ProtectedRoute>} />
          <Route path="/admin/users/:id/sessions" element={<ProtectedRoute><UserSessions /></ProtectedRoute>} />
        </Route>

        <Route path="/admin-access" element={<AdminAccess />} />
        <Route path="/admin-access/" element={<AdminAccess />} />
      </Routes>
    </NotificationProvider>
  );
}

export default App;
