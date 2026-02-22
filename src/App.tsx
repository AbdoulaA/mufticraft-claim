import { MapPin, Users, Zap, Copy, Check } from "lucide-react";
import { useState } from "react";
import AuthCard from "./components/AuthCard";


function App() {
  const [copied, setCopied] = useState(false);
  const serverIP = "mc.mufticraft.store";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(serverIP);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-900" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">MuftiCraft</h1>
                <p className="text-sm text-blue-200">Survival Server</p>
              </div>
            </div>
            <button
              onClick={copyToClipboard}
              className="flex items-center space-x-2 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-semibold px-6 py-3 rounded-lg transition-all transform hover:scale-105"
            >
              {copied ? (
                <Check className="w-5 h-5" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
              <span>{copied ? "Copied!" : serverIP}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <AuthCard />

        <div className="bg-white/10 backdrop-blur-md rounded-lg overflow-hidden border border-white/20 shadow-2xl">
          <div className="bg-gradient-to-r from-blue-800 to-blue-700 px-6 py-3 border-b border-white/20">
            <h3 className="text-xl font-semibold text-white">
              Live Server Map
            </h3>
          </div>
          
          <div
            className="relative"
            style={{ height: "calc(100vh - 400px)", minHeight: "500px" }}
          >
            
            <iframe
              src="https://map.mufticraft.store/"
              className="w-full h-full"
              title="MuftiCraft Server Map"
              style={{ border: "none" }}
              allowFullScreen
            />

            {/* <ClaimDrawOverlay
              onSave={(points) => {
                // frontend-only for now: store in localStorage or show JSON
                localStorage.setItem(
                  "mufticraft_claim_draft",
                  JSON.stringify(points),
                );
                console.log("Saved polygon points (normalized):", points);
                alert("Saved! (frontend-only) Check console / localStorage.");
              }}
            /> */}
          </div>
        </div>

      </main>

      <footer className="bg-white/5 backdrop-blur-md border-t border-white/10 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-blue-200">
            © 2024 MuftiCraft. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
