import { Routes, Route, Outlet } from "react-router-dom";

import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Create from "./pages/Create/ProfileSelection";
import CreateEmployerProfile from "./pages/Create/CreateEmployerProfile";
import CreateJobseekerProfile from "./pages/Create/CreateJobseekerProfile";
import BrowseJob from "./pages/Browse/BrowseJob";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";

function Layout() {
  return <Outlet />;
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/landing" element={<Landing />} />
        <Route
          path="/create/employer"
          element={
            <ProtectedRoute>
              <CreateEmployerProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create/jobseeker"
          element={
            <ProtectedRoute>
              <CreateJobseekerProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <Create />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="/explore" element={<BrowseJob />} />
        <Route path="/auth" element={<Signup />} />
      </Route>
    </Routes>
  );
}

export default App;