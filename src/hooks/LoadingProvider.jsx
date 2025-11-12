import React, { createContext, useContext, useMemo, useRef, useState } from "react";
import LoadingOverlay from "../components/ui/LoadingOverlay";

const LoadingCtx = createContext(null);

export function LoadingProvider({ children }) {
    const [visible, setVisible] = useState(false);
    const [label, setLabel] = useState("Loading...");
    // counter lets you call show() multiple times safely (nested calls)
    const counter = useRef(0);

    const api = useMemo(() => ({
        show(text = "Loading...") {
            counter.current += 1;
            setLabel(text);
            setVisible(true);
        },
        hide() {
            counter.current = Math.max(0, counter.current - 1);
            if (counter.current === 0) setVisible(false);
        },
        setText(text) {
            setLabel(text);
        }
    }), []);

    return (
        <LoadingCtx.Provider value={api}>
            {children}
            <LoadingOverlay show={visible} text={label} />
        </LoadingCtx.Provider>
    );
}

export function useLoading() {
    const ctx = useContext(LoadingCtx);
    if (!ctx) throw new Error("useLoading must be used within <LoadingProvider />");
    return ctx;
}
