import { Routes, Route, Outlet } from "react-router-dom";

import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Create from "./pages/Create/ProfileSelection";
import CreateEmployerProfile from "./pages/Create/CreateEmployerProfile";
import CreateJobseekerProfile from "./pages/Create/CreateJobseekerProfile";
import CreateJob from "./pages/Create/CreateJob";
import Profile from "./pages/Profile";
import BrowseJob from "./pages/Browse/BrowseJob";


function Layout() {
  return <Outlet />;
}

function App() {
  return (
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
      </Route>
    </Routes>
  );
}

export default App;