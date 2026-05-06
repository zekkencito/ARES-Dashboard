import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Visualizer3D from './components/Visualizer3D';

function App() {
  const [totalArea, setTotalArea] = useState(10);

  return (
    <div className="w-screen h-screen flex flex-col md:flex-row bg-black overflow-hidden">
      {/* Panel Izquierdo: Dashboard (60% ancho en desktop) */}
      <div className="w-full md:w-[60%] h-[50vh] md:h-screen border-b md:border-b-0 md:border-r border-cyber-cyan/20">
        <Dashboard totalArea={totalArea} setTotalArea={setTotalArea} />
      </div>

      {/* Panel Derecho: Visualizador 3D (40% ancho en desktop) */}
      <div className="w-full md:w-[40%] h-[50vh] md:h-screen relative">
        <Visualizer3D totalArea={totalArea} />
        
        {/* Decoración de bordes para que parezca una pantalla de nave */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyber-cyan z-20 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyber-cyan z-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyber-cyan z-20 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyber-cyan z-20 pointer-events-none"></div>
      </div>
    </div>
  );
}

export default App;
