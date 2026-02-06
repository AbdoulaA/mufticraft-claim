import { MapPin, Users, Zap, Copy, Check } from 'lucide-react';
import { useState } from 'react';

function App() {
  const [copied, setCopied] = useState(false);
  const serverIP = 'play.mufticraft.store';

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
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              <span>{copied ? 'Copied!' : serverIP}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-2">Explore & Claim Your Land</h2>
            <p className="text-blue-100 mb-4">
              Use the interactive map below to explore our world and find the perfect spot for your base.
              Zoom in, check out available areas, and start your adventure!
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2 bg-blue-800/50 px-4 py-2 rounded-lg">
                <MapPin className="w-5 h-5 text-yellow-400" />
                <span className="text-white">Navigate the map to find your spot</span>
              </div>
              <div className="flex items-center space-x-2 bg-blue-800/50 px-4 py-2 rounded-lg">
                <Users className="w-5 h-5 text-yellow-400" />
                <span className="text-white">See where other players are building</span>
              </div>
              <div className="flex items-center space-x-2 bg-blue-800/50 px-4 py-2 rounded-lg">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-white">Join and start claiming immediately</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-lg overflow-hidden border border-white/20 shadow-2xl">
          <div className="bg-gradient-to-r from-blue-800 to-blue-700 px-6 py-3 border-b border-white/20">
            <h3 className="text-xl font-semibold text-white">Live Server Map</h3>
          </div>
          <div className="relative" style={{ height: 'calc(100vh - 400px)', minHeight: '500px' }}>
            <iframe
              src="https://map.mufticraft.store/"
              className="w-full h-full"
              title="MuftiCraft Server Map"
              style={{ border: 'none' }}
              allowFullScreen
            />
          </div>
        </div>

        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg p-6 text-blue-900">
            <h3 className="text-xl font-bold mb-2">How to Claim Land</h3>
            <ol className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="font-bold mr-2">1.</span>
                <span>Join the server using the IP above</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">2.</span>
                <span>Use /claim or a golden shovel to claim your area</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">3.</span>
                <span>Your land will be protected from other players</span>
              </li>
            </ol>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-2">Server Rules</h3>
            <ul className="space-y-2 text-sm text-blue-100">
              <li>• No griefing or stealing</li>
              <li>• Respect other players' claims</li>
              <li>• Be kind and helpful</li>
              <li>• Have fun building!</li>
            </ul>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-2">Server Info</h3>
            <ul className="space-y-2 text-sm text-blue-100">
              <li>• <span className="text-yellow-400 font-semibold">Mode:</span> Survival</li>
              <li>• <span className="text-yellow-400 font-semibold">Version:</span> Latest</li>
              <li>• <span className="text-yellow-400 font-semibold">Difficulty:</span> Normal</li>
              <li>• <span className="text-yellow-400 font-semibold">PvP:</span> Optional</li>
            </ul>
          </div>
        </div>
      </main>

      <footer className="bg-white/5 backdrop-blur-md border-t border-white/10 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-blue-200">© 2024 MuftiCraft. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
