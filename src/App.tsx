import { Suspense } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import Home from "./components/home";
import routes from "tempo-routes";
import { AuthProvider } from "@/components/auth/AuthProvider"; // Import the AuthProvider

function App() {
  // Call useRoutes at the top level of your component
  const tempoRoutes =
    import.meta.env.VITE_TEMPO === "true" ? useRoutes(routes) : null;

  return (
    <AuthProvider>
      {" "}
      {/* Wrap everything with AuthProvider */}
      <Suspense fallback={<p>Loading...</p>}>
        <>
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
          {tempoRoutes}
        </>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
