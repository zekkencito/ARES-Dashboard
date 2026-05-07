import React, { useState } from 'react';
import Dashboard from './components/Dashboard';

function App() {
  const [totalArea, setTotalArea] = useState(10);

  return (
    <div className="w-screen h-screen bg-black overflow-hidden">
      <Dashboard totalArea={totalArea} setTotalArea={setTotalArea} />
    </div>
  );
}

export default App;