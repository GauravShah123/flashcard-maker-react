import { useApp } from "../store";
import { Moon, Sun, Table, Play } from "lucide-react";

export default function Header({ onToggleTheme }: { onToggleTheme: () => void }) {
    const { view, setView, startReview, dark } = useApp();
    return (
        <header className="hdr">
            <div className="container row">
                <div className="title">
                    <img src="/Flashcard.svg" alt="Logo" width={22} height={20} />
                    Flashcard Maker
                </div>
                <div className="hdr-actions">
                    <button className={`btn ${view === "edit" ? "primary" : ""}`} onClick={() => setView("edit")} title="Edit (E)">
                        <Table className="lucide" /> <span>Edit</span>
                    </button>
                    <button className={`btn ${view === "review" ? "primary" : ""}`} onClick={() => startReview()} title="Review (R)">
                        <Play className="lucide" /> <span>Review</span>
                    </button>
                    <button className="btn" id="btnTheme" onClick={onToggleTheme} title="Toggle light/dark">
                        {dark ? <Sun className="lucide" /> : <Moon className="lucide" />} <span>{dark ? "Light" : "Dark"}</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
