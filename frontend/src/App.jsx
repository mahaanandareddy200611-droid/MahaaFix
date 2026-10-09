import AppRoutes from "./routes/appRouters";
import { AuthProvider } from "./context/AuthContext";

function App() {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    );
}

export default App;