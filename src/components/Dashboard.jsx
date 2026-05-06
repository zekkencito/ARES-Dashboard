import React, { useState, useEffect, useRef } from 'react';
import { Settings, Droplet, Thermometer, Activity, Zap, ShieldAlert, Cpu, Wind, Map, MessageSquare } from 'lucide-react';

export default function Dashboard({ totalArea, setTotalArea }) {
  // Estados para los inputs del simulador
  const [temperature, setTemperature] = useState(-15);
  const [humidity, setHumidity] = useState(15);
  const [pressure, setPressure] = useState(600);
  const [currentWater, setCurrentWater] = useState(2500000);

  // Estados para resultados y estado de carga
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationResult, setCalculationResult] = useState(null);

  // Estados de Voz y mensajes inmersivos
  const [messageIndex, setMessageIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef(null);

  // Estados del Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatContainerRef = useRef(null);

  const loadingMessages = [
    "Estableciendo conexión...",
  ];

  // Auto-scroll del chat
  useEffect(() => {
    if (chatContainerRef.current && isChatLoading) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages.length, isChatLoading]);

  // Efecto para rotar mensajes cada 10 segundos
  useEffect(() => {
    let interval;
    if (isCalculating) {
      interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 10000);
    } else {
      setMessageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isCalculating]);

  const team1Area = totalArea * 0.5;
  const team2Area = totalArea * 0.5;

  const handleCalculate = async () => {
    setIsCalculating(true);
    setCalculationResult(null);

    // Detener audio anterior si existe
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlayingAudio(false);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${baseUrl}/api/analizar-terreno`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temperature, humidity, pressure, totalArea, currentWater
        })
      });

      const result = await response.json();

      if (response.ok) {
        setCalculationResult(result);
        if (result.audioBase64) {
          const audio = new Audio("data:audio/mp3;base64," + result.audioBase64);
          audioRef.current = audio;
          audio.play();
          setIsPlayingAudio(true);
          audio.onended = () => setIsPlayingAudio(false);
        }
      } else {
        console.error("Error from backend:", result);
        setCalculationResult({ aguaRequeridaLitros: 0, explicacion: "Error interno del servidor FastAPI." });
      }
    } catch (e) {
      console.error(e);
      setCalculationResult({ aguaRequeridaLitros: 0, explicacion: "Error de red: Imposible contactar con el servidor en la Tierra." });
    }

    setIsCalculating(false);
  };

  const handleInterrupt = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlayingAudio(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const newUserMsg = { role: "user", content: chatInput.trim() };
    setChatMessages((prev) => [...prev, newUserMsg]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, newUserMsg],
          telemetry: {
            temperature,
            humidity,
            pressure,
            totalArea,
            currentWater,
            requiredWater: calculationResult ? calculationResult.aguaRequeridaLitros : 0
          }
        })
      });
      const result = await response.json();
      if (response.ok) {
        setChatMessages((prev) => [...prev, { role: "assistant", content: result.response }]);
      } else {
        setChatMessages((prev) => [...prev, { role: "assistant", content: "Error en comunicaciones con Dalia." }]);
      }
    } catch (e) {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Error de red. La señal a la Tierra se ha perdido." }]);
    }
    setIsChatLoading(false);
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'INSUFICIENTE':
        return {
          title: '¡ALERTA CRÍTICA: AGUA INSUFICIENTE!',
          textColor: 'text-red-400',
          bgClass: 'bg-red-950/40 border-red-500/50',
          barClass: 'bg-red-500',
          icon: <ShieldAlert className="w-8 h-8 text-red-500 flex-shrink-0 mt-1 animate-pulse" />
        };
      case 'EXCESIVO':
        return {
          title: '¡ADVERTENCIA: EXCESO DE AGUA!',
          textColor: 'text-yellow-400',
          bgClass: 'bg-yellow-950/40 border-yellow-500/50',
          barClass: 'bg-yellow-500',
          icon: <ShieldAlert className="w-8 h-8 text-yellow-500 flex-shrink-0 mt-1 animate-pulse" />
        };
      case 'OPTIMO':
      default:
        return {
          title: 'ESTADO DE RECURSOS ÓPTIMO',
          textColor: 'text-green-400',
          bgClass: 'bg-green-950/40 border-green-500/50',
          barClass: 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]',
          icon: <Droplet className="w-8 h-8 text-green-500 flex-shrink-0 mt-1" />
        };
    }
  };

  const statusConfig = calculationResult ? getStatusConfig(calculationResult.estado) : null;
  const progressPercentage = calculationResult && calculationResult.aguaRequeridaLitros > 0
    ? Math.min((currentWater / calculationResult.aguaRequeridaLitros) * 100, 100).toFixed(1)
    : 100;

  return (
    <div className="h-full overflow-y-auto p-6 bg-black text-gray-300 font-sans custom-scrollbar">

      {/* Header */}
      <header className="mb-8 flex items-center justify-between border-b border-cyber-cyan/30 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Cpu className="text-cyber-cyan w-8 h-8" />
            SISTEMA A.R.E.S.
          </h1>
          <p className="text-cyber-cyan/70 font-mono text-sm mt-1">Análisis de Recursos y Equidad de Suelo</p>
        </div>
        <div className="flex items-center gap-4 bg-mars-dark px-4 py-2 rounded-lg border border-mars-base/30">
          <Activity className="text-mars-light animate-pulse" />
          <span className="font-mono text-mars-light">LINK STABLE</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Panel Izquierdo: Controles */}
        <div className="space-y-6">

          <div className="bg-gray-900/80 p-6 rounded-xl border border-gray-800 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Map className="text-purple-500" />
              Configuración de Terreno
            </h2>

            <div className="space-y-5">
              <div>
                <label className="flex justify-between text-sm font-mono mb-2 text-gray-400">
                  <span className="flex items-center gap-2"><Zap size={16} /> Cuadrante Total (km²)</span>
                  <span className="text-white">{totalArea} km²</span>
                </label>
                <input
                  type="range" min="1" max="100" step="1"
                  value={totalArea} onChange={(e) => setTotalArea(Number(e.target.value))}
                  className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div className="pt-2">
                <h3 className="text-xs font-mono text-gray-500 mb-3 uppercase tracking-widest">División Equitativa</h3>
                <div className="flex gap-4">
                  <div className="flex-1 bg-gray-950 p-3 rounded-lg border border-mars-base/30 text-center">
                    <span className="block text-xs text-mars-light font-mono mb-1">EQUIPO 1</span>
                    <span className="text-xl font-black text-white">{team1Area} km²</span>
                  </div>
                  <div className="flex-1 bg-gray-950 p-3 rounded-lg border border-purple-500/30 text-center">
                    <span className="block text-xs text-purple-400 font-mono mb-1">EQUIPO 2</span>
                    <span className="text-xl font-black text-white">{team2Area} km²</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/80 p-6 rounded-xl border border-gray-800 shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-md">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Settings className="text-cyber-cyan" />
              Simulador Ambiental
            </h2>

            <div className="space-y-5">
              <div>
                <label className="flex justify-between text-sm font-mono mb-2 text-gray-400">
                  <span className="flex items-center gap-2"><Thermometer size={16} /> Temp Superficial</span>
                  <span className="text-white">{temperature}°C</span>
                </label>
                <input
                  type="range" min="-80" max="20"
                  value={temperature} onChange={(e) => setTemperature(Number(e.target.value))}
                  className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-mars-light"
                />
              </div>

              <div>
                <label className="flex justify-between text-sm font-mono mb-2 text-gray-400">
                  <span className="flex items-center gap-2"><Droplet size={16} /> Humedad del Terreno</span>
                  <span className="text-white">{humidity}%</span>
                </label>
                <input
                  type="range" min="0" max="100"
                  value={humidity} onChange={(e) => setHumidity(Number(e.target.value))}
                  className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyber-cyan"
                />
              </div>

              <div>
                <label className="flex justify-between text-sm font-mono mb-2 text-gray-400">
                  <span className="flex items-center gap-2"><Wind size={16} /> Presión Atmosférica</span>
                  <span className="text-white">{pressure} Pa</span>
                </label>
                <input
                  type="range" min="100" max="1000" step="10"
                  value={pressure} onChange={(e) => setPressure(Number(e.target.value))}
                  className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-gray-400"
                />
              </div>

              <div className="pt-2 border-t border-gray-800">
                <label className="flex justify-between text-sm font-mono mb-2 text-gray-400 mt-2">
                  <span className="flex items-center gap-2"><Droplet size={16} /> Reservas de Agua (L)</span>
                  <span className="text-white">{currentWater.toLocaleString()} L</span>
                </label>
                <input
                  type="number"
                  value={currentWater} onChange={(e) => setCurrentWater(Number(e.target.value))}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white font-mono focus:outline-none focus:border-cyber-cyan transition-colors"
                />
              </div>
            </div>

            <button
              onClick={handleCalculate}
              disabled={isCalculating}
              className={`w-full mt-8 py-4 rounded-lg font-bold tracking-widest uppercase transition-all duration-300
                ${isCalculating
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-cyber-blue hover:bg-cyber-cyan hover:text-black text-white shadow-[0_0_20px_rgba(0,102,255,0.4)] hover:shadow-[0_0_30px_rgba(0,243,255,0.6)]'
                }
              `}
            >
              {isCalculating ? 'Calculando...' : 'Ejecutar Análisis A.R.E.S.'}
            </button>
          </div>
        </div>

        {/* Panel Derecho: Resultados IA y Chat */}
        <div className="flex flex-col space-y-6 relative">

          {isPlayingAudio && (
            <button
              onClick={handleInterrupt}
              className="absolute top-4 right-4 z-20 bg-red-900/80 hover:bg-red-600 text-white font-mono text-xs px-4 py-2 rounded border border-red-500 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.5)] flex items-center gap-2"
            >
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              Silenciar Sistema
            </button>
          )}

          {/* Resultados de la IA */}
          <div className="bg-gradient-to-b from-gray-900/80 to-black p-6 rounded-xl border border-gray-800 relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyber-cyan/5 rounded-full blur-3xl -mr-20 -mt-20"></div>

            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Activity className="text-cyber-cyan" />
              Auditoría de Recursos
            </h2>

            {!calculationResult && !isCalculating && (
              <div className="h-64 flex flex-col items-center justify-center text-gray-600 border-2 border-dashed border-gray-800 rounded-xl">
                <Activity className="w-12 h-12 mb-4 opacity-50" />
                <p className="font-mono">Esperando ejecución del análisis...</p>
              </div>
            )}

            {isCalculating && (
              <div className="h-64 flex flex-col items-center justify-center text-cyber-cyan text-center px-6 border-2 border-dashed border-cyber-cyan/30 rounded-xl bg-cyber-cyan/5">
                <div className="w-16 h-16 border-4 border-cyber-cyan border-t-transparent rounded-full animate-spin mb-6 shadow-[0_0_15px_rgba(0,243,255,0.5)]"></div>
                <p className="font-mono animate-pulse text-lg h-8 transition-opacity duration-500">{loadingMessages[messageIndex]}</p>
              </div>
            )}

            {calculationResult && !isCalculating && (
              <div className="space-y-6 relative z-10 animate-[fadeIn_0.5s_ease-out]">

                <div className={`p-5 rounded-xl border ${statusConfig.bgClass}`}>
                  <div className="flex items-start gap-4">
                    {statusConfig.icon}
                    <div>
                      <h3 className={`text-lg font-bold mb-1 ${statusConfig.textColor}`}>
                        {statusConfig.title}
                      </h3>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {calculationResult.explicacion}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-950 p-4 rounded-lg border border-gray-800">
                    <span className="block text-xs font-mono text-gray-500 mb-1">AGUA REQUERIDA (IA)</span>
                    <span className="text-2xl font-black text-cyber-cyan">
                      {calculationResult.aguaRequeridaLitros.toLocaleString()} L
                    </span>
                  </div>
                  <div className="bg-gray-950 p-4 rounded-lg border border-gray-800">
                    <span className="block text-xs font-mono text-gray-500 mb-1">RESERVAS ACTUALES</span>
                    <span className={`text-2xl font-black ${statusConfig.textColor}`}>
                      {currentWater.toLocaleString()} L
                    </span>
                  </div>
                </div>

                <div className="pt-4">
                  <div className="flex justify-between text-sm font-mono mb-2">
                    <span className="text-gray-400">Proporción Agua Actual / Requerida</span>
                    <span className={`${statusConfig.textColor} font-bold`}>
                      {((currentWater / calculationResult.aguaRequeridaLitros) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-4 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                    <div
                      className={`h-full transition-all duration-1000 ease-out ${statusConfig.barClass}`}
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Sección de Chat Interactivo (Ahora en la columna derecha) */}
          <div className="bg-gray-900/80 p-6 rounded-xl border border-gray-800 shadow-[0_0_15px_rgba(0,0,0,0.5)] flex flex-col h-[500px]">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 shrink-0">
              <MessageSquare className="text-purple-500" />
              DaLiA - Enlace Directo A.R.E.S.
            </h2>

            {/* Historial */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto mb-4 p-4 bg-black/50 border border-gray-800 rounded-lg custom-scrollbar space-y-4">
              {chatMessages.length === 0 ? (
                <p className="text-gray-600 font-mono text-center mt-10">
                  Canal de comunicación abierto. DaLiA está lista para asistir.
                </p>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-lg font-mono text-sm whitespace-pre-wrap ${msg.role === 'user'
                      ? 'bg-purple-900/40 text-purple-200 border border-purple-500/30'
                      : 'bg-cyber-blue/10 text-cyber-cyan border border-cyber-cyan/30'
                      }`}>
                      <span className="block text-xs opacity-50 mb-1">{msg.role === 'user' ? 'COMANDANTE' : 'DALIA'}</span>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-cyber-blue/10 text-cyber-cyan border border-cyber-cyan/30 p-3 rounded-lg font-mono text-sm">
                    <span className="block text-xs opacity-50 mb-1">DALIA</span>
                    <span className="animate-pulse">Escribiendo transmisión...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleChatSubmit} className="flex gap-4">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Pregunta a Dalia..."
                className="flex-1 bg-gray-950 border border-gray-800 rounded-lg p-3 text-white font-mono focus:outline-none focus:border-purple-500 transition-colors"
              />
              <button
                type="submit"
                disabled={isChatLoading || !chatInput.trim()}
                className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold px-6 py-3 rounded-lg tracking-widest uppercase transition-all"
              >
                Enviar
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
