import { useEffect } from "react";
import { useApp } from "./store";
import Header from "./components/Header";
import TableEditor from "./components/TableEditor";
import ReviewView from "./components/ReviewView";
import KeyboardShortcutsModal from "./components/KeyboardShortcutsModal";
import BottomNav from "./components/BottomNav";

export default function App() {
  const { view, loadFromStorage, dark, setDark } = useApp();

  useEffect(() => {
    loadFromStorage();
    document.body.dataset.theme = dark ? "dark" : "light";
  }, []);

  useEffect(() => {
    document.body.dataset.theme = dark ? "dark" : "light";
  }, [dark]);

  return (
    <div>
      <Header onToggleTheme={() => setDark(!dark)} />
      <main className="main">
        {view === "edit" ? <TableEditor /> : <ReviewView />}
      </main>
      <KeyboardShortcutsModal />
      <BottomNav />
    </div>
  );
}