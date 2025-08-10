import { Play, Table } from "lucide-react";
import { useApp } from "../store";

export default function BottomNav() {
    const { view, setView, startReview } = useApp();
    return (
        <nav className="bottom-nav" role="navigation" aria-label="Primary">
            <button className={`btn ${view === "edit" ? "primary" : ""}`} onClick={() => setView("edit")}>
                <Table className="lucide" /> <span>Edit</span>
            </button>
            <button className={`btn ${view === "review" ? "primary" : ""}`} onClick={() => startReview()}>
                <Play className="lucide" /> <span>Review</span>
            </button>
        </nav>
    );
}
