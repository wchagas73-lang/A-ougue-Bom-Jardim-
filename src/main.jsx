import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("Erro inesperado na interface do cardápio:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return React.createElement("main", {
        style: {
          minHeight: "100vh", display: "grid", placeContent: "center",
          padding: "24px", textAlign: "center", fontFamily: "Arial, sans-serif",
          color: "#29231d", background: "#fff"
        }
      },
        React.createElement("h1", null, "Não foi possível carregar o cardápio"),
        React.createElement("p", null, "Ocorreu um erro inesperado ao abrir o cardápio. Toque abaixo para tentar novamente."),
        React.createElement("button", {
          onClick: () => window.location.reload(),
          style: { padding: "12px 20px", border: 0, borderRadius: "8px", background: "#245b3c", color: "#fff", fontWeight: 700 }
        }, "Recarregar cardápio")
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppErrorBoundary><App /></AppErrorBoundary>
  </React.StrictMode>
);
