import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "", errorStack: "", componentStack: "" };
  }
  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: String(error?.message || error || "Erro sem mensagem"),
      errorStack: String(error?.stack || "")
    };
  }
  componentDidCatch(error, info) {
    console.error("Erro inesperado na interface do cardápio:", error, info);
    this.setState({ componentStack: String(info?.componentStack || "") });
  }
  render() {
    if (this.state.hasError) {
      const details = [
        "Mensagem: " + this.state.errorMessage,
        this.state.errorStack ? "\nPilha técnica:\n" + this.state.errorStack : "",
        this.state.componentStack ? "\nComponente onde ocorreu:\n" + this.state.componentStack : ""
      ].filter(Boolean).join("\n");
      return React.createElement("main", {
        style: {
          minHeight: "100vh", display: "grid", alignContent: "center",
          gap: "12px", padding: "24px", fontFamily: "Arial, sans-serif",
          color: "#29231d", background: "#fff", boxSizing: "border-box"
        }
      },
        React.createElement("h1", { style: { margin: 0, fontSize: "24px" } }, "Não foi possível carregar o cardápio"),
        React.createElement("p", { style: { margin: 0, lineHeight: 1.5 } }, "Identificamos uma falha na abertura. Os detalhes abaixo ajudam a localizar a causa. Nenhum pedido ou produto foi apagado."),
        React.createElement("section", {
          style: { padding: "14px", border: "1px solid #d8d8d8", borderRadius: "8px", background: "#f7f7f7", overflow: "auto" }
        },
          React.createElement("strong", null, "Detalhes técnicos para diagnóstico"),
          React.createElement("pre", {
            style: { margin: "10px 0 0", whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: "12px", lineHeight: 1.45, maxHeight: "45vh", overflow: "auto" }
          }, details)
        ),
        React.createElement("button", {
          onClick: () => window.location.reload(),
          style: { padding: "13px 20px", border: 0, borderRadius: "8px", background: "#245b3c", color: "#fff", fontWeight: 700, fontSize: "15px" }
        }, "Tentar abrir novamente")
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
