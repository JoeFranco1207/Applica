import { useEffect } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import axios from "axios";

import Navbar from "./components/Navbar";
import NotificationPopup from "./components/NotificationPopup";
import Footer from "./components/Footer";
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

function Layout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <NotificationPopup />
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
          <Route path="/" element={<Landing />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/create/employer" element={<CreateEmployerProfile />} />
          <Route path="/create/jobseeker" element={<CreateJobseekerProfile />} />
          <Route path="/auth" element={<Signup />} />
          <Route path="/explore" element={<BrowseJob />} />
          <Route path="/create/job" element={<CreateJob />} />
          <Route path="/create" element={<Create />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/post/:id" element={<PostView />} />
          <Route path="/resume-designs" element={<ResumeDesigns />} />
          <Route path="/employer/applicants" element={<EmployerApplicants />} />
        </Route>
      </Routes>
    </NotificationProvider>
  );
}

export default App;