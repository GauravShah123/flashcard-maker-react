import { useEffect, useMemo, useRef } from "react";
import { useApp } from "../store";
import { ArrowDownToLine, ArrowUpToLine, Trash2 } from "lucide-react";
import type { Card } from "../types";
import { parseCSV, toCSV } from "../lib/csv";

function insertPlainTextAtCaret(text: string) {
    // normalize line breaks
    const clean = text.replace(/\r\n?/g, "\n");
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    range.deleteContents();
    const node = document.createTextNode(clean);
    range.insertNode(node);

    // move caret to the end of the inserted text
    range.setStartAfter(node);
    range.setEndAfter(node);
    sel.removeAllRanges();
    sel.addRange(range);
}

function handlePastePlain(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain") ?? "";
    insertPlainTextAtCaret(text);
}

function handleDropPlain(e: React.DragEvent) {
    // Stop the browser from dropping HTML
    e.preventDefault();
    const text = e.dataTransfer.getData("text/plain") ?? "";
    insertPlainTextAtCaret(text);
}


function setRow(
    cards: Card[],
    upsert: (rows: Card[]) => void,
    idx: number,
    patch: Partial<Card>
) {
    const next = [...cards];
    if (!next[idx]) next[idx] = { term: "", def: "" }; // guarantee it exists
    next[idx] = { ...next[idx], ...patch };
    // store only non-empty rows; blank row is added by the rows memo
    const compact = next.filter(c => c.term.trim() || c.def.trim());
    upsert(compact);
}

function EditableCell({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
  }) {
    const ref = useRef<HTMLTableCellElement>(null);
  
    // Sync the DOM when value changes, but avoid useless writes that would move the caret
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      if (el.textContent !== value) el.textContent = value;
    }, [value]);
  
    return (
      <td
        ref={ref}
        className="cell"
        contentEditable
        suppressContentEditableWarning
        dir="ltr"
        onInput={(e) => onChange(e.currentTarget.textContent ?? "")}
        onPaste={handlePastePlain}
        onDrop={handleDropPlain}
      />
    );
  }
  


export default function TableEditor() {
    const { cards, upsertCards, clearAll, undo, redo } = useApp();
    const tbodyRef = useRef<HTMLTableSectionElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    // Build view rows by appending a trailing blank row
    const rows = useMemo<Card[]>(() => {
        const nonEmpty = cards.map((c) => ({ term: c.term, def: c.def }));
        return [...nonEmpty, { term: "", def: "" }];
    }, [cards]);

    useEffect(() => {
        function onInput() {
            const table = tbodyRef.current;
            if (!table) return;
            const trs = Array.from(table.querySelectorAll("tr"));
            const next: Card[] = [];
            for (const r of trs) {
                const t = (r.children[0] as HTMLElement).innerText.trim();
                const d = (r.children[1] as HTMLElement).innerText.trim();
                if (t || d) next.push({ term: t, def: d });
            }
            upsertCards(next);
        }

        function onKeydown(e: KeyboardEvent) {
            const target = e.target as HTMLElement;
            if (!target.classList.contains("cell")) return;

            const td = target;
            const tr = td.parentElement as HTMLTableRowElement;
            const table = tr.parentElement as HTMLTableSectionElement;
            const rowIndex = Array.from(table.children).indexOf(tr);
            const colIndex = Array.from(tr.children).indexOf(td);

            const lower = e.key.toLowerCase();
            const ctrlOrMeta = e.ctrlKey || e.metaKey;
            if (ctrlOrMeta && !e.shiftKey && lower === "z") {
                e.preventDefault();
                undo();
                return;
            }
            if (ctrlOrMeta && (lower === "y" || (e.shiftKey && lower === "z"))) {
                e.preventDefault();
                redo();
                return;
            }

            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (colIndex === 0) {
                    (tr.children[1] as HTMLElement).focus();
                    placeCaretEnd(tr.children[1] as HTMLElement);
                } else {
                    const nextRow = table.children[rowIndex + 1] as HTMLTableRowElement | undefined;
                    if (!nextRow) addEmptyRow(table);
                    const targetRow = table.children[rowIndex + 1] as HTMLTableRowElement;
                    const targetCell = targetRow.children[0] as HTMLElement;
                    targetCell.focus();
                    placeCaretEnd(targetCell);
                }
            }

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "backspace") {
                e.preventDefault();
                target.textContent = "";
                onInput();
            }

            if (e.key === "Delete") {
                const term = (tr.children[0] as HTMLElement).innerText.trim();
                const def = (tr.children[1] as HTMLElement).innerText.trim();
                const empty = !term && !def;
                if (empty && table.children.length > 1) {
                    e.preventDefault();
                    tr.remove();
                    onInput();
                    const newRow = table.children[Math.min(rowIndex, table.children.length - 1)] as HTMLTableRowElement | undefined;
                    if (newRow) {
                        const cell = newRow.children[Math.min(colIndex, 1)] as HTMLElement;
                        cell.focus();
                        placeCaretEnd(cell);
                    }
                }
            }
        }

        const table = tbodyRef.current;
        if (!table) return;
        table.addEventListener("input", onInput);
        table.addEventListener("keydown", onKeydown as any);
        return () => {
            table.removeEventListener("input", onInput);
            table.removeEventListener("keydown", onKeydown as any);
        };
    }, [upsertCards, undo, redo]);


    function addEmptyRow(tb: HTMLTableSectionElement) {
        const tr = document.createElement("tr");
        const tdTerm = document.createElement("td");
        const tdDef = document.createElement("td");
        tdTerm.className = "cell";
        tdDef.className = "cell";
        tdTerm.contentEditable = "true";
        tdDef.contentEditable = "true";
        tdTerm.textContent = "";
        tdDef.textContent = "";
        tr.appendChild(tdTerm);
        tr.appendChild(tdDef);
        tb.appendChild(tr);
    }

    function placeCaretEnd(el: HTMLElement) {
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const sel = window.getSelection();
        if (!sel) return;
        sel.removeAllRanges();
        sel.addRange(range);
    }

    function onExport() {
        const csv = toCSV(cards);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "flashcards.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const text = await file.text();
        const parsed = parseCSV(text);
        if (parsed.length === 0) return;
        upsertCards(parsed);
        e.target.value = "";
    }

    return (
        <section>
            <div className="toolbar">
                <button className="btn primary" onClick={onExport} title="Export CSV">
                    <ArrowUpToLine className="lucide" /> <span>Export</span>
                </button>
                <button className="btn" onClick={() => fileRef.current?.click()} title="Import CSV">
                    <ArrowDownToLine className="lucide" /> <span>Import</span>
                </button>
                <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={onImportFile} hidden />
                <div style={{ flex: 1 }} />
                <button className="btn danger" onClick={clearAll} title="Clear all cards">
                    <Trash2 className="lucide" /> <span>Clear</span>
                </button>
            </div>

            <div className="table-wrap">
                <table aria-label="Flashcards table editor">
                    <colgroup>
                        <col className="col-term" />
                        <col className="col-def" />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>Term</th>
                            <th>Definition</th>
                        </tr>
                    </thead>
                    <tbody ref={tbodyRef}>
                        {rows.map((r, i) => (
                            <tr key={i}>
                                <EditableCell
                                    value={r.term}
                                    onChange={(text) => setRow(cards, upsertCards, i, { term: text })}
                                />
                                <EditableCell
                                    value={r.def}
                                    onChange={(text) => setRow(cards, upsertCards, i, { def: text })}
                                />

                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="tips">
                Tips: Enter moves to next cell or adds a row. Tab moves across. Ctrl or Cmd + Backspace clears the current cell. Delete on an empty row removes it. Press Ctrl or Cmd + ? for the full list of keyboard shortcuts.
            </div>
        </section>
    );
}