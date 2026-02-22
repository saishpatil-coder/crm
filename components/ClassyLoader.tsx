import React from "react";

const ClassyLoader = ({ size = 60, color = "currentColor" }) => {
  return (
    <div
      className="loader-wrapper"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "2rem",
      }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="triad-svg"
        style={{ color: color }}
      >
        <circle cx="50" cy="15" r="6" className="dot dot-1" />
        <circle cx="80" cy="65" r="6" className="dot dot-2" />
        <circle cx="20" cy="65" r="6" className="dot dot-3" />
      </svg>

      <style>{`
        .triad-svg {
          /* Slow, elegant rotation of the entire group */
          animation: spin 4s linear infinite;
        }
        
        .dot {
          fill: currentColor;
          transform-origin: 50px 50px;
        }

        /* Staggered pulsing for an organic feel */
        .dot-1 { animation: pulse 1.5s ease-in-out infinite; }
        .dot-2 { animation: pulse 1.5s ease-in-out infinite 0.5s; }
        .dot-3 { animation: pulse 1.5s ease-in-out infinite 1s; }

        @keyframes spin {
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { 
            transform: scale(1); 
            opacity: 0.9; 
          }
          50% { 
            transform: scale(1.5); 
            opacity: 0.3; 
          }
        }
      `}</style>
    </div>
  );
};

export default ClassyLoader;
