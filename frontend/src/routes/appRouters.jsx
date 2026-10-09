
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    Link,
} from "react-router-dom";

import Login from "../pages/login";
import Signup from "../pages/Signup";
import Dashboard from "../pages/Dashboard";
import CreateWorkRecord from "../pages/createWorkRecord";
import WorkRecords from "../pages/allWorkRecords";
import Forgotpassword from "../pages/forgotpasswordotp";

import ProtectedRoute from "./ProtectedRoute";

import Profile from "../pages/Profile";

import Jobs from "../pages/Jobs";
import CreateJob from "../pages/CreateJob";
import JobDetails from "../pages/JobDetails";
import Operations from "../pages/Operations";
import WorkerPresence from "../pages/WorkerPresence";
import WorkRecordDetails from "../pages/WorkRecordDetails";
import NotFound from "../pages/notFound";

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Default entry point */}
                <Route
                    path="/"
                    element={<Navigate to="/login" replace />}
                />

                {/* Public authentication pages */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                <Route
                    path="/forgotpasswordotp"
                    element={<Forgotpassword />}
                />

                {/* Public WorkRecord listing */}
                <Route
                    path="/WorkRecords"
                    element={<WorkRecords />}
                />

                <Route
                    path="/work-records"
                    element={<WorkRecords />}
                />

                {/* All authenticated users */}
                <Route element={<ProtectedRoute />}>
                    <Route
                        path="/dashboard"
                        element={<Dashboard />}
                    />

                    <Route
                        path="/profile"
                        element={<Profile />}
                    />

                    

                    <Route
                        path="/jobs"
                        element={<Jobs />}
                    />

                    {/* Resource ownership is checked by the backend */}
                    <Route
                        path="/jobs/:id"
                        element={<JobDetails />}
                    />

                    <Route
                        path="/work-records/:id"
                        element={<WorkRecordDetails />}
                    />

                    {/* Preserve the previous URL format */}
                    <Route
                        path="/workRecords/:id"
                        element={<WorkRecordDetails />}
                    />
                </Route>

                {/* Customer-only pages */}
                <Route
                    element={
                        <ProtectedRoute
                            allowedRoles={["customer"]}
                        />
                    }
                >
                    <Route
                        path="/create-job"
                        element={<CreateJob />}
                    />
                </Route>

                {/* Worker-only pages */}
                <Route
                    element={
                        <ProtectedRoute
                            allowedRoles={["worker"]}
                        />
                    }
                >
                    <Route
                        path="/worker-presence"
                        element={<WorkerPresence />}
                    />

                    <Route
                        path="/createWorkRecord"
                        element={<CreateWorkRecord />}
                    />

                    <Route
                        path="/create-work-record"
                        element={<CreateWorkRecord />}
                    />
                </Route>

                {/* Admin and operator pages */}
                <Route
                    element={
                        <ProtectedRoute
                            allowedRoles={["admin", "operator"]}
                        />
                    }
                >
                    <Route
                        path="/operations"
                        element={<Operations />}
                    />
                </Route>

                {/* Fallback for unknown URLs */}
                <Route
                    path="*"
                    element={<NotFound />}
                />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;   