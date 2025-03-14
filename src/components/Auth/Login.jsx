import React, { useState, useEffect, useRef } from 'react';
import { Ship } from 'lucide-react';

const OperationTracker = () => {
  // Map reference
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const boatMarkerRef = useRef(null);
  const boundaryCircleRef = useRef(null);
  
  // Operation states
  const [currentStep, setCurrentStep] = useState(0); // 0: Not started, 1-5: Steps
  const [operationStarted, setOperationStarted] = useState(false);
  const [operationCompleted, setOperationCompleted] = useState(false);
  const [boatPosition, setBoatPosition] = useState([13.08, 80.29]); // Chennai port initial position [lat, lng]
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState([]);
  const [showHINInput, setShowHINInput] = useState(false);
  const [hinNumber, setHinNumber] = useState('');
  const [hinVerified, setHinVerified] = useState(false);
  const [showBoundaryAlert, setShowBoundaryAlert] = useState(false);
  const [boundaryReached, setBoundaryReached] = useState(false);
  
  const sourcePosition = [13.0827, 80.2707]; // Chennai port
  const destinationPosition = [13.094861, 80.522232]; // Destination in the sea
  const boundaryRadius = 1000; // 10km boundary in meters (Leaflet uses meters)
  
  // Calculate distance between two points in meters
  const calculateDistance = (pos1, pos2) => {
    if (!window.L) return 0;
    return window.L.latLng(pos1).distanceTo(window.L.latLng(pos2));
  };
  
  const steps = [
    { id: 1, name: "Start Engine", completed: false, color: "#6366F1", icon: "🔑" },
    { id: 2, name: "HIN Verification", completed: false, color: "#8B5CF6", icon: "🔍" },
    { id: 3, name: "Entering the Region", completed: false, color: "#EC4899", icon: "🚢" },
    { id: 4, name: "Sailing", completed: false, color: "#F59E0B", icon: "⚓" },
    { id: 5, name: "Returning to Harbor", completed: false, color: "#10B981", icon: "🏠" },
  ];

  // Initialize map using Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Load Leaflet from CDN
    const loadLeaflet = async () => {
      // Load CSS
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
        document.head.appendChild(link);
      }
      
      // Wait for a moment to ensure CSS is loaded
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Load JS
      if (!window.L) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
        script.onload = initializeMap;
        document.body.appendChild(script);
      } else {
        initializeMap();
      }
    };
    
    const initializeMap = () => {
      if (mapRef.current) return;
      
      // Initialize map
      mapRef.current = window.L.map(mapContainerRef.current).setView(sourcePosition, 13);
      
      // Add standard tile layer instead of dark theme
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(mapRef.current);
      
      // Add source marker
      window.L.marker(sourcePosition, {
        icon: window.L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: #3B82F6; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      })
        .addTo(mapRef.current)
        .bindPopup('<b>Chennai Port</b><br>Starting point');
      
      // Add destination marker
      window.L.marker(destinationPosition, {
        icon: window.L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: #EF4444; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      })
        .addTo(mapRef.current)
        .bindPopup('<b>Destination</b><br>Operation target');
      
      // Add boundary circle around destination
      boundaryCircleRef.current = window.L.circle(destinationPosition, {
        radius: boundaryRadius,
        color: '#EF4444',
        fillColor: '#EF4444',
        fillOpacity: 0.1,
        dashArray: '5, 10',
        weight: 2
      }).addTo(mapRef.current);
      
      // Initialize boat marker but don't add it to map yet
      boatMarkerRef.current = window.L.marker(sourcePosition, {
        icon: window.L.divIcon({
          className: 'boat-marker',
          html: createBoatIconHTML(),
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        })
      });
  
      
      // Add styles for pulse animation
      if (!document.getElementById('pulse-style')) {
        const style = document.createElement('style');
        style.id = 'pulse-style';
        style.textContent = `
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
          }
          .pulse-dot {
            animation: pulse 1.5s infinite ease-in-out;
          }
        `;
        document.head.appendChild(style);
      }
    };
    
    loadLeaflet();
    
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);
  
  // Create HTML for boat icon
  const createBoatIconHTML = () => {
    return `
      <div style="position: relative; width: 40px; height: 40px;">
        <div class="pulse-dot" style="position: absolute; top: 0; left: 0; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background-color: rgba(16, 185, 129, 0.2); border-radius: 50%;">
          <div style="width: 30px; height: 30px; background-color: #10B981; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(16, 185, 129, 0.7);">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 17h18"></path>
              <path d="M3 10l2-3h4l2 3h4l2-3h4l2 3"></path>
              <path d="M12 15v5"></path>
            </svg>
          </div>
        </div>
      </div>
    `;
  };
  
  // Add log entry
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prevLogs => [...prevLogs, { timestamp, message }]);
  };
  
  // Verify HIN number
  const verifyHIN = () => {
    if (hinNumber === 'IN7784') {
      setHinVerified(true);
      addLog("HIN verification successful: IN7784 authenticated.");
      
      // Continue to step 3
      setCurrentStep(3);
      addLog("HIN verified. Entering operational region...");
      
      // Move boat to sea
      startBoatMovement();
    } else {
      addLog(`HIN verification failed: ${hinNumber || 'No HIN provided'}. Operation halted.`);
    }
  };
  
  const startBoatMovement = () => {
    // Add boat marker to map if not already added
    if (!mapRef.current.hasLayer(boatMarkerRef.current)) {
      boatMarkerRef.current.addTo(mapRef.current);
    }
    
    // Animate boat movement to destination
    const startTime = Date.now();
    const duration = 10000; // 10 seconds to reach destination
    
    const moveBoat = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Linear interpolation between source and destination
      const newLat = sourcePosition[0] + (destinationPosition[0] - sourcePosition[0]) * progress;
      const newLng = sourcePosition[1] + (destinationPosition[1] - sourcePosition[1]) * progress;
      
      const newPosition = [newLat, newLng];
      setBoatPosition(newPosition);
      boatMarkerRef.current.setLatLng(newPosition);
      
      // Check distance to destination
      const distanceToDest = calculateDistance(newPosition, destinationPosition);
      
      // If we're entering the boundary (10km) and haven't already shown the alert
      if (distanceToDest <= boundaryRadius && !boundaryReached) {
        setBoundaryReached(true);
        setShowBoundaryAlert(true);
        addLog("ALERT: Approaching boundary (10km from destination). Preparing for return.");
      }
      
      // Center map on boat
      if (mapRef.current) {
        mapRef.current.panTo(newPosition, { animate: true, duration: 0.5 });
      }
      
      // Update current step to "Sailing" if not already
      if (currentStep < 4) {
        setCurrentStep(4);
        addLog("Sailing in progress. Monitoring position...");
      }
      
      if (progress < 1) {
        requestAnimationFrame(moveBoat);
      } else {
        // Reached destination
        addLog("Reached destination. Beginning operation...");
        
        // Return to harbor after 3 seconds
        setTimeout(() => {
          setCurrentStep(5);
          addLog("Operation complete. Returning to harbor...");
          
          // Animate boat returning to source
          returnToHarbor();
        }, 3000);
      }
    };
    
    requestAnimationFrame(moveBoat);
  };
  
  const returnToHarbor = () => {
    // Animate boat returning to source
    const returnStartTime = Date.now();
    const returnDuration = 10000; // 10 seconds to return
    
    const returnBoat = () => {
      const returnElapsed = Date.now() - returnStartTime;
      const returnProgress = Math.min(returnElapsed / returnDuration, 1);
      
      // Linear interpolation from destination back to source
      const newLat = destinationPosition[0] + (sourcePosition[0] - destinationPosition[0]) * returnProgress;
      const newLng = destinationPosition[1] + (sourcePosition[1] - destinationPosition[1]) * returnProgress;
      
      const newPosition = [newLat, newLng];
      setBoatPosition(newPosition);
      boatMarkerRef.current.setLatLng(newPosition);
      
      // Center map on boat
      if (mapRef.current) {
        mapRef.current.panTo(newPosition, { animate: true, duration: 0.5 });
      }
      
      if (returnProgress < 1) {
        requestAnimationFrame(returnBoat);
      } else {
        // Operation completed
        setOperationCompleted(true);
        addLog("Returned to harbor. Operation completed successfully!");
      }
    };
    
    requestAnimationFrame(returnBoat);
  };
  
  // Start the operation sequence
  const startOperation = () => {
    if (operationCompleted || operationStarted || !window.L || !mapRef.current) return;
    
    setOperationStarted(true);
    setCurrentStep(1);
    addLog("Operation started. Engine starting...");
    
    // Start engine (step 1)
    setTimeout(() => {
      // Move to HIN verification (step 2)
      setCurrentStep(2);
      setShowHINInput(true);
      addLog("Engine started. HIN verification required to proceed.");
    }, 3000);
  };
  
  // Reset the operation
  const resetOperation = () => {
    setCurrentStep(0);
    setOperationStarted(false);
    setOperationCompleted(false);
    setBoatPosition(sourcePosition);
    setLogs([]);
    setShowHINInput(false);
    setHinNumber('');
    setHinVerified(false);
    setShowBoundaryAlert(false);
    setBoundaryReached(false);
    
    // Reset map view
    if (mapRef.current) {
      mapRef.current.setView(sourcePosition, 13, { animate: true });
      
      // Remove boat marker
      if (boatMarkerRef.current && mapRef.current.hasLayer(boatMarkerRef.current)) {
        mapRef.current.removeLayer(boatMarkerRef.current);
        
        // Recreate boat marker
        boatMarkerRef.current = window.L.marker(sourcePosition, {
          icon: window.L.divIcon({
            className: 'boat-marker',
            html: createBoatIconHTML(),
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          })
        });
      }
    }
  };
  
  // Handle HIN input change
  const handleHINChange = (e) => {
    setHinNumber(e.target.value);
  };
  
  // Handle form submission
  const handleHINSubmit = (e) => {
    e.preventDefault();
    verifyHIN();
  };
  
  // Close boundary alert
  const closeBoundaryAlert = () => {
    setShowBoundaryAlert(false);
  };
  
  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-800 to-blue-800 px-6 py-4 shadow-xl">
        <h1 className="text-2xl font-bold">Maritime Operation Tracker</h1>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Operation Steps */}
        <div className="w-80 bg-slate-800 shadow-xl overflow-y-auto">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6 text-center">Operation Status</h2>
            
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className={`mb-6 p-4 rounded-xl flex items-center shadow-lg transition-all duration-500 ${
                  index + 1 === currentStep 
                    ? "bg-gradient-to-r from-blue-900 to-indigo-900 border-l-4 border-blue-500" 
                    : index + 1 < currentStep
                      ? "bg-gradient-to-r from-green-900 to-emerald-900 border-l-4 border-green-500"
                      : "bg-slate-700"
                }`}
              >
                <div className={`w-12 h-12 flex items-center justify-center rounded-full mr-4 shadow-lg text-xl ${
                  index + 1 === currentStep 
                    ? `bg-gradient-to-br from-blue-500 to-indigo-600 text-white` 
                    : index + 1 < currentStep
                      ? `bg-gradient-to-br from-green-500 to-emerald-600 text-white`
                      : "bg-slate-600 text-slate-400"
                }`}>
                  {step.icon}
                </div>
                <div>
                  <div className="font-medium text-lg">{step.name}</div>
                  <div className={`text-xs ${
                    index + 1 === currentStep 
                      ? "text-blue-300" 
                      : index + 1 < currentStep
                        ? "text-green-300"
                        : "text-slate-400"
                  }`}>
                    {index + 1 === currentStep 
                      ? "In Progress" 
                      : index + 1 < currentStep
                        ? "Completed"
                        : "Waiting"}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="px-6 pb-6 pt-2">
            {!operationStarted ? (
              <button
                onClick={startOperation}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-lg shadow-lg transform transition hover:scale-105"
              >
                Start Operation
              </button>
            ) : !operationCompleted ? (
              <div className="w-full py-4 rounded-xl bg-orange-600 text-white font-medium text-lg shadow-lg text-center">
                Operation in Progress...
              </div>
            ) : (
              <button
                onClick={resetOperation}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium text-lg shadow-lg transform transition hover:scale-105"
              >
                Reset Operation
              </button>
            )}
          </div>
        </div>
        
        {/* Right panel - Map and Logs */}
        <div className="flex-1 relative">
          {/* Map container */}
          <div 
            ref={mapContainerRef} 
            className="absolute inset-0 bg-slate-700"
            style={{ zIndex: 1 }} 
          />
          
          {/* Status bar */}
          <div className="absolute top-4 right-4 bg-slate-800 bg-opacity-80 p-3 rounded-lg shadow-lg backdrop-blur-sm z-10">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                operationStarted 
                  ? operationCompleted 
                    ? "bg-green-500" 
                    : "bg-blue-500" 
                  : "bg-yellow-500"
              }`}></div>
              <div className="text-sm">
                {operationStarted ? (
                  operationCompleted ? "Operation Complete" : `Step ${currentStep}: ${steps[currentStep - 1]?.name}`
                ) : "Ready to Start"}
              </div>
            </div>
          </div>
          
          {/* HIN Verification Modal */}
          {showHINInput && !hinVerified && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
              <div className="bg-slate-800 p-6 rounded-xl shadow-2xl w-96">
                <h3 className="text-xl font-bold mb-4">HIN Verification Required</h3>
                <p className="mb-4">Please enter the Hull Identification Number (HIN) to proceed with the operation.</p>
                
                <form onSubmit={handleHINSubmit}>
                  <input
                    type="text"
                    value={hinNumber}
                    onChange={handleHINChange}
                    placeholder="Enter HIN (e.g., IN7784)"
                    className="w-full p-3 rounded-lg bg-slate-700 text-white mb-4 border border-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                  
                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={resetOperation}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
                    >
                      Cancel Operation
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                    >
                      Verify HIN
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          
          {/* Boundary Alert */}
          {showBoundaryAlert && (
            <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-red-600 text-white p-4 rounded-lg shadow-xl z-20 animate-pulse">
              <div className="flex items-center">
                <div className="mr-3 text-2xl">⚠️</div>
                <div>
                  <div className="font-bold">Boundary Alert</div>
                  <div className="text-sm">Vessel has reached the 10km boundary. Preparing to return to harbor.</div>
                </div>
                <button 
                  onClick={closeBoundaryAlert}
                  className="ml-4 bg-red-700 hover:bg-red-800 p-2 rounded-full"
                >
                  <span className="text-xs">✕</span>
                </button>
              </div>
            </div>
          )}
          
          {/* View Logs button */}
          <div className="absolute bottom-6 right-4 z-10">
            <button 
              onClick={() => setShowLogs(!showLogs)}
              className="bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-slate-700 transition"
            >
              {showLogs ? "Hide Logs" : "View Logs"}
            </button>
          </div>
          
          {/* Logs panel */}
          {showLogs && (
            <div className="absolute bottom-16 right-4 w-96 h-64 bg-slate-800 bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden z-10">
              <div className="p-3 bg-slate-700 font-medium">Operation Logs</div>
              <div className="p-4 h-48 overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="text-slate-400 text-center">No logs yet</div>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="mb-2 pb-2 border-b border-slate-700 last:border-0">
                      <div className="text-xs text-slate-400">{log.timestamp}</div>
                      <div>{log.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperationTracker;
