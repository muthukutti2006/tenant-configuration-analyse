import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { OverviewPage } from "./pages/OverviewPage";
import { AnalyzePage } from "./pages/AnalyzePage";
import { ConflictsPage } from "./pages/ConflictsPage";
import { ConfigurationsPage } from "./pages/ConfigurationsPage";
import { RulesPage } from "./pages/RulesPage";
import { ApproachPage } from "./pages/ApproachPage";
import { AboutPage } from "./pages/AboutPage";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/analyze" element={<AnalyzePage />} />
          <Route path="/conflicts" element={<ConflictsPage />} />
          <Route path="/configurations" element={<ConfigurationsPage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/approach" element={<ApproachPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
