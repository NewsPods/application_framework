import { createPortal } from "react-dom";

export default function LoadingOverlay({ show, text = "Loading..." }) {
    if (!show) return null;
    return createPortal(
        <div
            className="fixed inset-0 z-[9999] bg-white/60 dark:bg-black/40 backdrop-blur-md
                 flex items-center justify-center"
            aria-live="polite"
            aria-busy="true"
            role="status"
        >
            <div className="bg-white/90 dark:bg-neutral-900/90 rounded-2xl shadow-xl
                      px-6 py-5 flex flex-col items-center gap-2 min-w-[140px]">
                <div className="w-9 h-9 border-2 border-gray-200 dark:border-neutral-700
                        border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{text}</div>
            </div>
        </div>,
        document.body
    );
}
