import React, { useEffect, useRef, useState } from 'react';

const FindingPlayerScreen = ({ onCancel, autoFindMs = 30000 }) => {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef(null);
  const TEAL_ACCENT = 'border-[#1DB954] text-[#1DB954] hover:bg-[#1DB954] hover:text-white';
  const DARK_BG = 'bg-[#101418]';

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, []); 

  const handleCancel = () => {
    clearInterval(intervalRef.current);
    if (typeof onCancel === 'function') onCancel();

  };

  return (
    <div className={`text-center w-full max-w-sm mx-auto p-8 rounded-lg shadow-2xl ${DARK_BG} text-white`}>
      <h2 className="text-3xl font-light mb-6">Finding a random player...</h2>


      <div className="relative flex items-center justify-center h-20 mb-4">

        <div className="w-16 h-16 border-4 border-t-4 border-gray-600 rounded-full animate-spin" />
        

        <div className={`absolute w-12 h-12 border-4 border-t-4 ${TEAL_ACCENT.replace(/border-\[#1DB954\]/, 'border-[#1DB954]')} rounded-full animate-[spin_1.5s_linear_infinite]`} />


        <div className="absolute text-xl font-bold">
          <span className="text-white">{seconds}</span>
        </div>
      </div>
      
      <p className="text-sm text-gray-400 mb-2">
        Elapsed time: <span className="text-white font-medium">{seconds}s</span>
      </p>
      
      <p className="text-xs text-gray-500 mb-8">
        It usually takes around 25 seconds.
      </p>
      <button
        onClick={handleCancel}
        className={`text-sm py-2 px-8 rounded-full transition duration-300 ease-in-out font-medium 
                    border-2 border-gray-600 text-gray-400 hover:border-white hover:text-white`}
      >
        Cancel Matchmaking
      </button>
      
    </div>
  );
};

export default FindingPlayerScreen;