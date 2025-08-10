import { useEffect, useMemo, useState } from "react";

const USED_KEY = "fc-kb-used-v1";
const CELEB_KEY = "fc-kb-celebrated-v1";

export default function KeyboardShortcutsModal() {
    const [open, setOpen] = useState(false);
    const [used, setUsed] = useState<Record<string, boolean>>(() => {
        try {
            return JSON.parse(localStorage.getItem(USED_KEY) || "{}") || {};
        } catch {
            return {};
        }
    });

    function markUsed(id: string) {
        setUsed((prev) => {
            const next = { ...prev, [id]: true };
            localStorage.setItem(USED_KEY, JSON.stringify(next));
            return next;
        });
    }

    const isMac = /Mac|iPhone|iPad/.test(navigator.platform);

    const KB = useMemo(
        () => ({
            global: [
                { id: "help", title: "Open shortcuts menu", combos: [[isMac ? "Cmd" : "Ctrl", "Shift", "/"]], track: true },
                { id: "save", title: "Save", combos: [[isMac ? "Cmd" : "Ctrl", "S"]], track: true },
                { id: "edit", title: "Go to Edit view", combos: [["E"]], track: true },
                { id: "review", title: "Start or restart review", combos: [["R"]], track: true },
            ],
            edit: [{ id: "clear", title: "Clear current cell", combos: [[isMac ? "Cmd" : "Ctrl", "Backspace"]], track: false }],
            review: [
                { id: "flip", title: "Flip", combos: [["Space"], ["F"]], track: true },
                { id: "next", title: "Next card", combos: [["J"], ["→"]], track: true },
                { id: "prev", title: "Previous card", combos: [["K"], ["←"]], track: true },
                { id: "learned", title: "Mark learned", combos: [["L"]], track: true },
                { id: "chrono", title: "Chronological order", combos: [["1"]], track: true },
                { id: "random", title: "Toggle random", combos: [["2"], ["S"]], track: true },
                { id: "termfirst", title: "Term first", combos: [["T"]], track: true },
                { id: "deffirst", title: "Definition first", combos: [["D"]], track: true },
            ],
        }),
        []
    );

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            const ctrlOrMeta = e.ctrlKey || e.metaKey;
            const helpCombo = ctrlOrMeta && e.shiftKey && (e.key === "?" || e.key === "/");
            if (open) {
                if (e.key === "Escape" || helpCombo) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    setOpen(false);
                    return;
                }
            } else {
                if (helpCombo) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    setOpen(true);
                    markUsed("help");
                    return;
                }
            }

            // Global tracking only (no behavior changes here)
            const lower = e.key?.toLowerCase?.() || "";
            if (ctrlOrMeta && lower === "s") markUsed("save");
            if (!ctrlOrMeta && lower === "e") markUsed("edit");
            if (!ctrlOrMeta && lower === "r") markUsed("review");
        }
        window.addEventListener("keydown", onKey, true);
        return () => window.removeEventListener("keydown", onKey, true);
    }, [open]);

    const tracked = [...KB.global, ...KB.review].filter((x) => x.track).map((x) => x.id);
    const total = tracked.length;
    const count = tracked.filter((k) => used[k]).length;

    useEffect(() => {
        if (count === total && !localStorage.getItem(CELEB_KEY)) {
            // quick confetti
            const layer = document.createElement("div");
            layer.className = "confetti";
            document.body.appendChild(layer);
            const n = 60;
            for (let i = 0; i < n; i++) {
                const el = document.createElement("i");
                el.style.left = Math.random() * 100 + "vw";
                el.style.top = "-10px";
                el.style.background = `hsl(${Math.floor(Math.random() * 360)},80%,60%)`;
                el.style.transform = `translateY(-20px) rotate(${Math.random() * 180}deg)`;
                el.style.animationDelay = Math.random() * 0.3 + "s";
                layer.appendChild(el);
            }
            setTimeout(() => layer.remove(), 1400);
            localStorage.setItem(CELEB_KEY, "1");
        }
    }, [count, total]);

    if (!open) return null;

    return (
        <div className="kb-backdrop show" role="dialog" aria-modal="true" onClick={(e) => e.currentTarget === e.target && setOpen(false)}>
            <div className="kb-modal" tabIndex={-1}>
                <div className="kb-header">
                    <div className="kb-title">Keyboard shortcuts</div>
                </div>
                <KbSection title="Global" rows={KB.global} used={used} />
                <KbSection title="Edit view" rows={KB.edit} used={used} />
                <KbSection title="Review view" rows={KB.review} used={used} />
            </div>
        </div>
    );
}

function KbSection({ title, rows, used }: { title: string; rows: { id: string; title: string; combos: string[][] }[]; used: Record<string, boolean> }) {
    return (
        <div className="kb-section">
            <h4>{title}</h4>
            <div className="kb-rows">
                {rows.map((r) => (
                    <div className="kb-row" key={r.id}>
                        <div className="kb-left">{r.title}</div>
                        <div className={`kb-right ${used[r.id] ? "done" : ""}`}>{r.combos.map((keys, i) => <KeyCombo keys={keys} key={i} />)}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function KeyCombo({ keys }: { keys: string[] }) {
    return (
        <>
            {keys.map((k, i) => (
                <span className="keycap" key={i}>
                    {k}
                </span>
            ))}
        </>
    );
}
