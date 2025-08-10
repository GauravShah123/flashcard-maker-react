import { useEffect, useRef } from "react";
import { useApp } from "../store";
import { List, Shuffle, ArrowLeft, ArrowRight, CheckCircle2, FlipHorizontal2 } from "lucide-react";

export default function ReviewView() {
    const { cards, orderList, idx, flipped, direction, order, setOrder, setDirection, next, prev, flip, markLearned } = useApp();
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            const active = document.activeElement as HTMLElement | null;
            if (active && active.classList.contains("cell")) return;
            const k = e.key.toLowerCase();
            if (e.key === "Escape") return;
            if (k === " " || k === "f") {
                e.preventDefault();
                animateFlip();
                setTimeout(() => flip(), 80);
            }
            if (k === "j" || e.key === "ArrowRight") {
                e.preventDefault();
                next();
            }
            if (k === "k" || e.key === "ArrowLeft") {
                e.preventDefault();
                prev();
            }
            if (k === "1") setOrder("chronological");
            if (k === "2" || k === "s") setOrder(order === "random" ? "chronological" : "random");
            if (k === "t") setDirection("term-first");
            if (k === "d") setDirection("def-first");
            if (k === "l") {
                e.preventDefault();
                markLearned();
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [order, setOrder, setDirection, next, prev, flip, markLearned]);

    function animateFlip() {
        const el = cardRef.current;
        if (!el) return;
        el.classList.remove("quickflip");
        void el.offsetWidth;
        el.classList.add("quickflip");
    }

    const currentIndex = orderList[idx];
    const c = currentIndex != null ? cards[currentIndex] : undefined;
    const front = direction === "term-first" ? c?.term : c?.def;
    const back = direction === "term-first" ? c?.def : c?.term;

    return (
        <section id="review-view">
            <div className="toolbar" role="group" aria-label="Review settings">
                <div className="seg" aria-label="Order">
                    <button className={`btn ${order === "chronological" ? "active" : ""}`} onClick={() => setOrder("chronological")} title="Chronological (1)">
                        <List className="lucide" /> <span>Chrono</span>
                    </button>
                    <button className={`btn ${order === "random" ? "active" : ""}`} onClick={() => setOrder("random")} title="Random (2 or S)">
                        <Shuffle className="lucide" /> <span>Random</span>
                    </button>
                </div>
                <div className="seg" aria-label="Direction">
                    <button className={`btn ${direction === "term-first" ? "active" : ""}`} onClick={() => setDirection("term-first")} title="Term → Definition (T)">

                        Term <ArrowRight className="lucide" /> Def

                    </button>
                    <button className={`btn ${direction === "def-first" ? "active" : ""}`} onClick={() => setDirection("def-first")} title="Definition → Term (D)">

                        Def <ArrowRight className="lucide" /> Term

                    </button>
                </div>
                <div style={{ flex: 1 }} />
                <div className="tips" style={{ margin: 0 }}>
                    Space or F flips. J/K or arrows move. L marks learned. Esc exits.
                </div>
            </div>

            <div className="card" id="card" ref={cardRef} tabIndex={0} aria-live="polite" onClick={() => { animateFlip(); setTimeout(() => flip(), 80); }}>
                <div id="cardText">{orderList.length === 0 ? "All done. You marked everything as learned." : flipped ? back || "(empty)" : front || "(empty)"}</div>
                <small>Click or press Space to flip</small>
            </div>

            <div className="controls">
                <button className="btn" onClick={() => prev()} title="Previous (K or ←)">
                    <ArrowLeft className="lucide" /> <span>Previous</span>
                </button>
                <button className="btn primary" onClick={() => { animateFlip(); setTimeout(() => flip(), 80); }} title="Flip (Space or F)">
                    <FlipHorizontal2 className="lucide" /> <span>Flip</span>
                </button>
                <button className="btn" onClick={() => next()} title="Next (J or →)">
                    <ArrowRight className="lucide" /> <span>Next</span>
                </button>
                <button className="btn" onClick={() => markLearned()} title="Mark learned (L)">
                    <CheckCircle2 className="lucide" /> <span>Learned</span>
                </button>
            </div>
            <div className="progress">{orderList.length > 0 ? `${Math.min(idx + 1, orderList.length)} of ${orderList.length}` : ""}</div>
        </section>
    );
}