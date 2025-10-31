import React from "react";
import ProductionDashboard from "./pages/ProductionDashboard.jsx";
import Finalizados from "./pages/Finalizados.jsx";
export default function App(){
  const path = window.location.pathname;
  if(path.startsWith("/finalizados")) return <Finalizados />;
  return <ProductionDashboard />;
}
