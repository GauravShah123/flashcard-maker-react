import type { Card } from "../types";

export function toCSV(rows: Card[]): string {
    const clean = rows.filter((c) => c.term.trim() || c.def.trim());
    const lines = ["Term,Definition", ...clean.map(({ term, def }) => [term, def].map(csvEscape).join(","))];
    return lines.join("\n");
}

function csvEscape(v = "") {
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
}

export function parseCSV(text: string): Card[] {
    const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.length > 0);
    if (lines.length === 0) return [];
    const first = lines[0] ?? "";
    const start = first.toLowerCase().startsWith("term,definition") ? 1 : 0;
    const out: Card[] = [];
    for (let i = start; i < lines.length; i++) {
        const line = lines[i] ?? "";
        const fields = splitCSVLine(line);
        const term = fields[0] ?? "";
        const def = fields[1] ?? "";
        if (term.trim() || def.trim()) out.push({ term, def });
    }
    return out;
}

function splitCSVLine(line: string) {
    const res: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQ) {
            if (ch === '"') {
                if (line[i + 1] === '"') {
                    cur += '"';
                    i++;
                } else {
                    inQ = false;
                }
            } else cur += ch;
        } else {
            if (ch === ",") {
                res.push(cur);
                cur = "";
            } else if (ch === '"') {
                inQ = true;
            } else cur += ch;
        }
    }
    res.push(cur);
    return res;
}
