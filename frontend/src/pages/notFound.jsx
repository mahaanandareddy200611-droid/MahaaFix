
import { Link } from "react-router-dom";

export default function NotFound() {
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