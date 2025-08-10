import { create } from "zustand";
import type { Card, Direction, Order } from "./types";
import { mulberry32 } from "./lib/random";

const SK = "fc-cards-v1";
const PK = "fc-prefs-v1";

export type AppState = {
    cards: Card[];
    undoStack: Card[][];
    redoStack: Card[][];
    view: "edit" | "review";
    order: Order;
    direction: Direction;
    dark: boolean;

    // review runtime
    sessionSeed: number;
    orderList: number[];
    learned: Set<number>;
    idx: number;
    flipped: boolean;

    // actions
    loadFromStorage: () => void;
    setView: (v: "edit" | "review") => void;
    setOrder: (o: Order) => void;
    setDirection: (d: Direction) => void;
    setDark: (b: boolean) => void;
    upsertCards: (cards: Card[]) => void;
    undo: () => void;
    redo: () => void;
    clearAll: () => void;
    startReview: () => void;
    next: () => void;
    prev: () => void;
    flip: () => void;
    markLearned: () => void;
};

function loadPrefs(): Partial<Pick<AppState, "order" | "direction" | "dark">> {
    try {
        const p = JSON.parse(localStorage.getItem(PK) || "{}");
        return {
            order: p.order || "chronological",
            direction: p.direction || "term-first",
            dark: typeof p.dark === "boolean" ? p.dark : false,
        };
    } catch {
        return {};
    }
}

export const useApp = create<AppState>((set, get) => ({
    cards: [],
    undoStack: [],
    redoStack: [],
    view: "edit",
    order: loadPrefs().order || "chronological",
    direction: loadPrefs().direction || "term-first",
    dark: loadPrefs().dark ?? false,

    sessionSeed: Date.now(),
    orderList: [],
    learned: new Set<number>(),
    idx: 0,
    flipped: false,

    loadFromStorage: () => {
        try {
            const raw = JSON.parse(localStorage.getItem(SK) || "[]");
            set({ cards: Array.isArray(raw) ? raw : [], undoStack: [], redoStack: [] });
        } catch {
            set({ cards: [], undoStack: [], redoStack: [] });
        }
    },

    setView: (v) => set({ view: v }),
    setOrder: (order) => {
        set({ order });
        localStorage.setItem(PK, JSON.stringify({ ...loadPrefs(), order }));
        if (get().view === "review") get().startReview();
    },
    setDirection: (direction) => {
        set({ direction, flipped: false });
        localStorage.setItem(PK, JSON.stringify({ ...loadPrefs(), direction }));
    },
    setDark: (dark) => {
        set({ dark });
        localStorage.setItem(PK, JSON.stringify({ ...loadPrefs(), dark }));
        document.body.dataset.theme = dark ? "dark" : "light";
    },

    upsertCards: (cards) => {
        set((state) => ({
            cards,
            undoStack: [...state.undoStack, state.cards],
            redoStack: [],
        }));
        // batch save
        queueMicrotask(() => localStorage.setItem(SK, JSON.stringify(get().cards)));
    },

    undo: () => {
        const { undoStack, cards, redoStack } = get();
        if (undoStack.length === 0) return;
        const prev = undoStack[undoStack.length - 1] as Card[];
        set({
            cards: prev,
            undoStack: undoStack.slice(0, -1),
            redoStack: [cards, ...redoStack],
        });
        queueMicrotask(() => localStorage.setItem(SK, JSON.stringify(get().cards)));
    },

    redo: () => {
        const { redoStack, cards, undoStack } = get();
        if (redoStack.length === 0) return;
        const next = redoStack[0] as Card[];
        set({
            cards: next,
            undoStack: [...undoStack, cards],
            redoStack: redoStack.slice(1),
        });
        queueMicrotask(() => localStorage.setItem(SK, JSON.stringify(get().cards)));
    },

    clearAll: () => {
        if (!confirm("Clear all cards?")) return;
        set((state) => ({
            cards: [],
            undoStack: [...state.undoStack, state.cards],
            redoStack: [],
            learned: new Set(),
            orderList: [],
            idx: 0,
            flipped: false,
        }));
        localStorage.setItem(SK, JSON.stringify([]));
    },

    startReview: () => {
        const nonEmpty = get().cards.filter((c) => c.term?.trim() || c.def?.trim());
        if (nonEmpty.length === 0) return;
        const order = get().order;
        const learned = new Set<number>();
        const sessionSeed = Date.now();
        let indices = nonEmpty.map((_, i) => i);
        if (order === "random") {
            const rng = mulberry32(sessionSeed);
            // inside startReview(), when shuffling:
            for (let i = indices.length - 1; i > 0; i--) {
                const j = Math.floor(rng() * (i + 1));
                const ai = indices[i] as number;
                const aj = indices[j] as number;
                indices[i] = aj;
                indices[j] = ai;
            }
        }
        set({
            view: "review",
            sessionSeed,
            learned,
            orderList: indices,
            idx: 0,
            flipped: false,
        });
    },

    next: () => {
        const { orderList, idx } = get();
        if (orderList.length === 0) return;
        set({ idx: (idx + 1) % orderList.length, flipped: false });
    },
    prev: () => {
        const { orderList, idx } = get();
        if (orderList.length === 0) return;
        set({ idx: (idx - 1 + orderList.length) % orderList.length, flipped: false });
    },
    flip: () => {
        const { orderList } = get();
        if (orderList.length === 0) return;
        set({ flipped: !get().flipped });
    },
    markLearned: () => {
        const { learned, orderList, idx } = get();
        if (orderList.length === 0) return;
        const current = orderList[idx] as number;
        learned.add(current);
        const newList = orderList.filter((i) => !learned.has(i));
        set({ learned: new Set(learned), orderList: newList, idx: 0, flipped: false });
    },
}));
