"use client"

import React from 'react'

interface InstrumElecLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function InstrumElecLogo({ className = "", size = 'md' }: InstrumElecLogoProps) {
  const sizeClasses = {
    sm: 'w-32 h-16',
    md: 'w-48 h-24',
    lg: 'w-64 h-32'
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Logo SVG */}
      <div className={`${sizeClasses[size]} flex-shrink-0`}>
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Cercle bleu principal */}
          <circle
            cx="60"
            cy="60"
            r="55"
            fill="#00BFFF"
            stroke="#0080FF"
            strokeWidth="2"
          />
          
          {/* Lettre E stylisée */}
          <path
            d="M25 35 L25 85 L70 85 M25 60 L60 60 M25 35 L65 35"
            stroke="white"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          
          {/* Éclair rouge */}
          <path
            d="M45 25 L35 55 L50 55 L40 95 L65 50 L50 50 L60 25 Z"
            fill="#FF4444"
            stroke="#CC0000"
            strokeWidth="1"
          />
        </svg>
      </div>
      
      {/* Texte InstrumElec Cameroun */}
      <div className="flex flex-col">
        <div className="flex items-baseline space-x-1">
          <span className="text-red-500 font-bold text-xl">Instrum</span>
          <span className="text-blue-500 font-bold text-xl">Elec</span>
        </div>
        <div className="bg-blue-500 text-white text-sm font-semibold px-2 py-1 rounded">
          CAMEROUN
        </div>
      </div>
    </div>
  )
}
