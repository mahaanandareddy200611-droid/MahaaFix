import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/login";
import Signup from "../pages/Signup";
import Dashboard from "../pages/Dashboard";
import CreateWorkRecord from "../pages/createWorkRecord";
import WorkRecords from "../pages/allWorkRecords";
import Forgotpassword from "../pages/forgotpasswordotp"


function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path= "/dashboard" element = {<Dashboard/>}/>
                <Route path ="/createWorkRecord" element={<CreateWorkRecord/>}/>
                <Route path = "/WorkRecords" element={<WorkRecords/>}/>
                <Route path="/forgotpasswordotp" element={<Forgotpassword/>}/>
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;