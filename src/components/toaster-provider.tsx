"use client";

import { Toaster } from "react-hot-toast";

export function ToasterProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 1800,
        style: {
          borderRadius: "6px",
          border: "1px solid #e0e3e5",
          background: "#ffffff",
          color: "#191c1e",
          fontSize: "13px",
        },
      }}
    />
  );
}
