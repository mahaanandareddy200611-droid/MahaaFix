
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

function NotFound() {
    return (
        <main className="route-state">
            <section className="route-state-card">
                <h1>Page not found</h1>
                <p>The requested page doesn't exist.</p>
                <Link to="/dashboard">
                    Return to dashboard
                </Link>
            </section>
        </main>
    );
}

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={<Navigate to="/login" replace />}
                />

                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                <Route
                    path="/forgotpasswordotp"
                    element={<Forgotpassword />}
                />
                <Route path="/profile" element={<Profile />} />

                {/* Any authenticated role */}
                <Route element={<ProtectedRoute />}>
                    <Route
                        path="/dashboard"
                        element={<Dashboard />}
                    />
                </Route>

                {/* Worker-only WorkRecord creation */}
                <Route
                    element={
                        <ProtectedRoute allowedRoles={["worker"]} />
                    }
                >
                    <Route
                        path="/createWorkRecord"
                        element={<CreateWorkRecord />}
                    />

                    <Route
                        path="/create-work-record"
                        element={<CreateWorkRecord />}
                    />
                </Route>

                {/* Public listing uses the public backend endpoint */}
                <Route
                    path="/WorkRecords"
                    element={<WorkRecords />}
                />

                <Route
                    path="/work-records"
                    element={<WorkRecords />}
                />

                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;