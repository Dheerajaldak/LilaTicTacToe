import React, { useState } from 'react';

const NicknameScreen = ({ goToNext }) => {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (input.trim()) {
      goToNext(input.trim()); 
    }
  };

  return (
    // Outer container for the dark background with the modal centered
    <div className="w-full max-w-sm mx-auto h-[400px] flex items-center justify-center">
      <div className="bg-[#1C2128] p-6 rounded-lg w-full shadow-lg">
        {/* Modal Header */}
        <div className="flex justify-between items-start mb-6">
          <p className="text-white text-lg font-light">Who are you?</p>
          <button className="text-white opacity-50 text-xl font-light">×</button>
        </div>

        {/* Nickname Input Field */}
        <div className="bg-[#101418] border-b-2 border-[#1DB954] p-3 mb-8">
          <input
            type="text"
            placeholder="Nickname"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none text-xl"
          />
        </div>

        {/* Continue Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            className="bg-[#1DB954] text-white py-2 px-6 rounded-md font-medium text-sm transition duration-150 ease-in-out hover:bg-[#158f40]"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default NicknameScreen;