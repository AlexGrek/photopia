// src/context/NotificationContext.tsx
import { createContext, useContext, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Notification = {
  id: number;
  message: string;
  type?: "success" | "error" | "info" | "warning";
};

type NotificationContextType = {
  notify: (message: string, type?: Notification["type"]) => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

let idCounter = 0;

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = (message: string, type: Notification["type"] = "info") => {
    const id = ++idCounter;
    setNotifications((prev) => [...prev, { id, message, type }]);

    // auto-remove after 3s
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      {/* Notification container */}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`px-4 py-2 rounded-2xl shadow-lg font-light text-white backdrop-blur-md bg-opacity-40
                ${
                  n.type === "success"
                    ? "bg-green-600/80"
                    : n.type === "error"
                    ? "bg-red-600/80"
                    : n.type === "warning"
                    ? "bg-yellow-500/80 text-black"
                    : "bg-gray-700/80"
                }`}
            >
              {n.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};
