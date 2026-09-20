import React from 'react';

/**
 * High-definition, luminous abstract audio-wave and neon ambient background decoration.
 * Faithfully mirrors the 3D undulating ribbon mesh, acoustic frequency waveform,
 * glowing neon cyan/purple bloom, and particle dust from the SpeechEngine hero image.
 */
export default function AuthBackgroundDecor() {
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 1. Luminous Ambient Radial Light Blooms (Matching Hero Image Atmosphere) */}
      <div className="absolute -top-20 -right-20 w-[520px] h-[520px] rounded-full bg-cyan-500/25 dark:bg-cyan-400/30 blur-[120px] animate-pulse duration-[7000ms]" />
      <div className="absolute -bottom-28 -left-20 w-[560px] h-[560px] rounded-full bg-indigo-600/25 dark:bg-indigo-500/30 blur-[130px]" />
      <div className="absolute top-1/4 -right-12 w-[380px] h-[380px] rounded-full bg-violet-600/20 dark:bg-purple-500/25 blur-[100px]" />
      <div className="absolute bottom-1/6 right-12 w-[340px] h-[340px] rounded-full bg-teal-400/20 dark:bg-cyan-300/25 blur-[90px]" />

      {/* 2. High-Tech Precision Dot Matrix Field */}
      <div className="absolute inset-0 bg-[radial-gradient(#0ea5e9_1.25px,transparent_1.25px)] [background-size:28px_28px] opacity-[0.08] dark:opacity-[0.16]" />

      {/* 3. Full-Scale Sleek 3D Acoustic Waveform & Ribbon Mesh */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1200 1000"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Intense Neon Core Bloom Filter */}
          <filter id="neonIntenseGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4.5" result="blur1" />
            <feGaussianBlur stdDeviation="1.5" result="blur2" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Soft Atmospheric Glow Filter */}
          <filter id="softAtmosphere" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Primary Multi-Stop Hero Gradients */}
          {/* Vibrant Cyan to Electric Violet */}
          <linearGradient id="heroRibbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f5ff" stopOpacity="0.95" />
            <stop offset="25%" stopColor="#22d3ee" stopOpacity="0.9" />
            <stop offset="55%" stopColor="#818cf8" stopOpacity="0.85" />
            <stop offset="85%" stopColor="#a855f7" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0.5" />
          </linearGradient>

          {/* Electric Cyan Spine Glow */}
          <linearGradient id="cyanSpineGrad" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
            <stop offset="30%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#22d3ee" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.6" />
          </linearGradient>

          {/* Secondary Wireframe Harmonic Gradient */}
          <linearGradient id="wireHarmonicGrad" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.75" />
            <stop offset="40%" stopColor="#6366f1" stopOpacity="0.65" />
            <stop offset="75%" stopColor="#a855f7" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
          </linearGradient>

          {/* Subtle Transverse Grid Ribs */}
          <linearGradient id="transverseRibGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#818cf8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0.1" />
          </linearGradient>

          {/* Light Mode Specific High-Contrast Gradient */}
          <linearGradient id="lightModeWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
            <stop offset="45%" stopColor="#4f46e5" stopOpacity="0.7" />
            <stop offset="85%" stopColor="#7c3aed" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0891b2" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* ========================================================================= */}
        {/* GROUP 1: LOWER-TO-MID SWEEPING 3D ACOUSTIC RIBBON MESH (16 Harmonic Strands) */}
        {/* ========================================================================= */}
        <g className="opacity-90 dark:opacity-95">
          {/* Deep Underlying Glow Cushion */}
          <path
            d="M -60,780 C 220,520 480,940 760,660 C 940,480 1060,560 1260,420"
            stroke="#00f5ff"
            strokeWidth="5"
            strokeOpacity="0.25"
            filter="url(#softAtmosphere)"
          />

          {/* Harmonic Wireframe Ribbon Strands */}
          <path
            d="M -60,840 C 230,580 490,1000 775,720 C 955,540 1075,620 1260,480"
            stroke="url(#wireHarmonicGrad)"
            strokeWidth="1.2"
            strokeDasharray="4 6"
          />
          <path
            d="M -60,820 C 228,560 488,980 770,700 C 950,520 1070,600 1260,460"
            stroke="url(#heroRibbonGrad)"
            strokeWidth="1.2"
          />
          <path
            d="M -60,800 C 225,540 485,960 765,680 C 945,500 1065,580 1260,440"
            stroke="url(#wireHarmonicGrad)"
            strokeWidth="1.3"
          />
          <path
            d="M -60,780 C 220,520 480,940 760,660 C 940,480 1060,560 1260,420"
            stroke="url(#heroRibbonGrad)"
            strokeWidth="1.6"
          />

          {/* MAIN LUMINOUS SPINE OF THE 3D WAVE (Sharp Neon Core) */}
          <path
            d="M -60,760 C 215,500 475,920 755,640 C 935,460 1055,540 1260,400"
            stroke="url(#cyanSpineGrad)"
            strokeWidth="2.8"
            filter="url(#neonIntenseGlow)"
          />
          <path
            d="M -60,760 C 215,500 475,920 755,640 C 935,460 1055,540 1260,400"
            stroke="#ffffff"
            strokeWidth="1"
            strokeOpacity="0.8"
          />

          <path
            d="M -60,740 C 210,480 470,900 750,620 C 930,440 1050,520 1260,380"
            stroke="url(#heroRibbonGrad)"
            strokeWidth="1.6"
          />
          <path
            d="M -60,720 C 205,460 465,880 745,600 C 925,420 1045,500 1260,360"
            stroke="url(#wireHarmonicGrad)"
            strokeWidth="1.4"
            strokeDasharray="6 4"
          />
          <path
            d="M -60,700 C 200,440 460,860 740,580 C 920,400 1040,480 1260,340"
            stroke="url(#heroRibbonGrad)"
            strokeWidth="1.3"
          />
          <path
            d="M -60,680 C 195,420 455,840 735,560 C 915,380 1035,460 1260,320"
            stroke="url(#wireHarmonicGrad)"
            strokeWidth="1.1"
          />
          <path
            d="M -60,660 C 190,400 450,820 730,540 C 910,360 1030,440 1260,300"
            stroke="url(#heroRibbonGrad)"
            strokeWidth="1"
            strokeDasharray="3 5"
          />
          <path
            d="M -60,640 C 185,380 445,800 725,520 C 905,340 1025,420 1260,280"
            stroke="url(#wireHarmonicGrad)"
            strokeWidth="0.9"
          />

          {/* Transverse Cross-Mesh Ribs (Creating 3D Wireframe Depth from Hero Image) */}
          <line x1="160" y1="360" x2="240" y2="600" stroke="url(#transverseRibGrad)" strokeWidth="0.8" strokeDasharray="2 3" />
          <line x1="280" y1="410" x2="350" y2="660" stroke="url(#transverseRibGrad)" strokeWidth="0.8" strokeDasharray="2 3" />
          <line x1="420" y1="520" x2="490" y2="780" stroke="url(#transverseRibGrad)" strokeWidth="0.9" strokeDasharray="2 3" />
          <line x1="560" y1="620" x2="630" y2="870" stroke="url(#transverseRibGrad)" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="700" y1="560" x2="770" y2="780" stroke="url(#transverseRibGrad)" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="840" y1="430" x2="910" y2="640" stroke="url(#transverseRibGrad)" strokeWidth="0.9" strokeDasharray="2 3" />
          <line x1="980" y1="360" x2="1050" y2="570" stroke="url(#transverseRibGrad)" strokeWidth="0.8" strokeDasharray="2 3" />
          <line x1="1120" y1="290" x2="1190" y2="490" stroke="url(#transverseRibGrad)" strokeWidth="0.8" strokeDasharray="2 3" />
        </g>

        {/* ========================================================================= */}
        {/* GROUP 2: UPPER HARMONIC SWEEPING ACOUSTIC CONTOURS                       */}
        {/* ========================================================================= */}
        <g className="opacity-80 dark:opacity-90">
          <path
            d="M -40,190 C 240,360 520,110 820,290 C 970,380 1080,290 1240,310"
            stroke="url(#wireHarmonicGrad)"
            strokeWidth="2.2"
            filter="url(#neonIntenseGlow)"
          />
          <path
            d="M -40,215 C 255,385 535,135 835,315 C 985,405 1095,315 1240,335"
            stroke="url(#heroRibbonGrad)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <path
            d="M -40,240 C 270,410 550,160 850,340 C 1000,430 1110,340 1240,360"
            stroke="url(#wireHarmonicGrad)"
            strokeWidth="1.2"
          />
          <path
            d="M -40,265 C 285,435 565,185 865,365 C 1015,455 1125,365 1240,385"
            stroke="url(#heroRibbonGrad)"
            strokeWidth="1"
            strokeDasharray="3 5"
          />
          <path
            d="M -40,165 C 225,335 505,85 805,265 C 955,355 1065,265 1240,285"
            stroke="url(#cyanSpineGrad)"
            strokeWidth="1.3"
          />
        </g>

        {/* ========================================================================= */}
        {/* GROUP 3: ICONIC "SPEECH ENGINE" FREQUENCY WAVE EMBLEM (Top-Right Accent)   */}
        {/* Directly mirrors the luminous glowing logo waveform in the hero image      */}
        {/* ========================================================================= */}
        <g className="opacity-95" transform="translate(40, -10)">
          {/* Ambient Glow behind frequency spike */}
          <ellipse cx="985" cy="165" rx="140" ry="70" fill="#00f5ff" fillOpacity="0.08" filter="url(#softAtmosphere)" />

          {/* Harmonic Wave Oscillations */}
          <path
            d="M 830,165 C 870,165 895,140 920,115 C 945,85 965,225 985,60 C 1005,255 1025,95 1050,195 C 1075,135 1100,165 1140,165"
            stroke="url(#heroRibbonGrad)"
            strokeWidth="2.5"
            filter="url(#neonIntenseGlow)"
          />
          {/* Luminous Hot-White Core Spike */}
          <path
            d="M 830,165 C 870,165 895,140 920,115 C 945,85 965,225 985,60 C 1005,255 1025,95 1050,195 C 1075,135 1100,165 1140,165"
            stroke="#ffffff"
            strokeWidth="1.1"
            strokeOpacity="0.9"
          />
          {/* Echo Wave 1 (Violet Upper Phase) */}
          <path
            d="M 830,165 C 870,165 895,150 920,130 C 945,105 965,205 985,90 C 1005,230 1025,120 1050,185 C 1075,145 1100,165 1140,165"
            stroke="url(#wireHarmonicGrad)"
            strokeWidth="1.4"
            strokeDasharray="4 3"
          />
          {/* Echo Wave 2 (Cyan Lower Phase) */}
          <path
            d="M 830,165 C 870,165 895,175 920,190 C 945,215 965,115 985,245 C 1005,80 1025,210 1050,155 C 1075,180 1100,165 1140,165"
            stroke="url(#heroRibbonGrad)"
            strokeWidth="1.5"
          />
          {/* Echo Wave 3 (Faint outer envelope) */}
          <path
            d="M 830,165 C 870,165 895,185 920,205 C 945,235 965,145 985,265 C 1005,110 1025,225 1050,140 C 1075,190 1100,165 1140,165"
            stroke="url(#wireHarmonicGrad)"
            strokeWidth="1"
            strokeDasharray="2 4"
            strokeOpacity="0.6"
          />

          {/* Glowing Anchor Nodes at Emblem Peaks */}
          <circle cx="985" cy="60" r="3.5" fill="#38bdf8" filter="url(#neonIntenseGlow)" />
          <circle cx="985" cy="60" r="1.8" fill="#ffffff" />
          <circle cx="985" cy="245" r="3" fill="#c084fc" filter="url(#neonIntenseGlow)" />
          <circle cx="985" cy="245" r="1.5" fill="#ffffff" />
          <circle cx="965" cy="225" r="2.5" fill="#22d3ee" />
          <circle cx="1025" cy="95" r="2.5" fill="#818cf8" />
        </g>

        {/* ========================================================================= */}
        {/* GROUP 4: SPARKLING PARTICLE CONSTELLATIONS & ACOUSTIC ENERGY DUST         */}
        {/* Exactly mirroring the stardust particle field along the wave crests       */}
        {/* ========================================================================= */}
        <g>
          {/* Main Wave Crest Nodes (High Luminosity) */}
          <circle cx="215" cy="500" r="3.5" fill="#38bdf8" filter="url(#neonIntenseGlow)" />
          <circle cx="215" cy="500" r="1.8" fill="#ffffff" />

          <circle cx="475" cy="920" r="4" fill="#a855f7" filter="url(#neonIntenseGlow)" />
          <circle cx="475" cy="920" r="2" fill="#ffffff" />

          <circle cx="755" cy="640" r="4.5" fill="#22d3ee" filter="url(#neonIntenseGlow)" />
          <circle cx="755" cy="640" r="2.2" fill="#ffffff" />

          <circle cx="935" cy="460" r="3.5" fill="#818cf8" filter="url(#neonIntenseGlow)" />
          <circle cx="935" cy="460" r="1.8" fill="#ffffff" />

          <circle cx="1055" cy="540" r="3.5" fill="#38bdf8" filter="url(#neonIntenseGlow)" />
          <circle cx="1055" cy="540" r="1.8" fill="#ffffff" />

          {/* Upper Harmonic Nodes */}
          <circle cx="240" cy="360" r="3" fill="#22d3ee" filter="url(#softAtmosphere)" />
          <circle cx="240" cy="360" r="1.5" fill="#ffffff" />
          <circle cx="820" cy="290" r="3" fill="#a855f7" filter="url(#softAtmosphere)" />
          <circle cx="820" cy="290" r="1.5" fill="#ffffff" />

          {/* Ambient Floating Acoustic Particles (Varying Depth & Opacities) */}
          <circle cx="120" cy="680" r="1.5" fill="#38bdf8" opacity="0.8" />
          <circle cx="170" cy="420" r="2.2" fill="#22d3ee" opacity="0.9" />
          <circle cx="310" cy="310" r="1.4" fill="#c084fc" opacity="0.75" />
          <circle cx="360" cy="740" r="1.8" fill="#818cf8" opacity="0.85" />
          <circle cx="410" cy="490" r="1.2" fill="#38bdf8" opacity="0.7" />
          <circle cx="530" cy="670" r="1.8" fill="#22d3ee" opacity="0.8" />
          <circle cx="610" cy="420" r="1.5" fill="#a855f7" opacity="0.7" />
          <circle cx="690" cy="790" r="2.2" fill="#38bdf8" opacity="0.9" />
          <circle cx="730" cy="350" r="1.4" fill="#22d3ee" opacity="0.85" />
          <circle cx="820" cy="530" r="2" fill="#818cf8" opacity="0.95" />
          <circle cx="880" cy="380" r="1.6" fill="#38bdf8" opacity="0.9" />
          <circle cx="910" cy="680" r="1.8" fill="#c084fc" opacity="0.8" />
          <circle cx="1010" cy="430" r="2.4" fill="#22d3ee" opacity="0.9" />
          <circle cx="1090" cy="610" r="1.5" fill="#818cf8" opacity="0.85" />
          <circle cx="1140" cy="380" r="2" fill="#38bdf8" opacity="0.95" />
          <circle cx="1170" cy="510" r="1.6" fill="#c084fc" opacity="0.8" />

          {/* Micro-sparkle dust cluster */}
          <circle cx="780" cy="600" r="1" fill="#ffffff" opacity="0.9" />
          <circle cx="795" cy="625" r="1.2" fill="#38bdf8" opacity="0.85" />
          <circle cx="770" cy="650" r="0.9" fill="#22d3ee" opacity="0.75" />
          <circle cx="950" cy="490" r="1" fill="#ffffff" opacity="0.9" />
          <circle cx="965" cy="510" r="1.2" fill="#818cf8" opacity="0.8" />
          <circle cx="1030" cy="500" r="1.1" fill="#38bdf8" opacity="0.85" />
        </g>

        {/* ========================================================================= */}
        {/* GROUP 5: SLEEK HIGH-TECH CORNER ACCENTS                                   */}
        {/* Subtle acoustic coordinate crosshairs and frequency calibration indicators*/}
        {/* ========================================================================= */}
        <g className="opacity-40 dark:opacity-60">
          {/* Top-Right Calibration Crosshairs */}
          <path d="M 1130,45 L 1150,45 M 1140,35 L 1140,55" stroke="#38bdf8" strokeWidth="1" />
          <circle cx="1140" cy="45" r="7" stroke="#38bdf8" strokeWidth="0.75" strokeDasharray="2 2" fill="none" />
          <text x="1095" y="70" fill="#38bdf8" fontSize="8" fontFamily="monospace" letterSpacing="0.1em" opacity="0.85">
            48kHz // AI-TTS
          </text>

          {/* Bottom-Right Coordinate Crosshairs */}
          <path d="M 1140,935 L 1160,935 M 1150,925 L 1150,945" stroke="#818cf8" strokeWidth="1" />
          <text x="1105" y="960" fill="#818cf8" fontSize="8" fontFamily="monospace" letterSpacing="0.1em" opacity="0.85">
            SYNTH // v2.0
          </text>

          {/* Left Margins Subtle Pulse Tick Marks */}
          <line x1="30" y1="200" x2="45" y2="200" stroke="#00f5ff" strokeWidth="1" opacity="0.7" />
          <line x1="30" y1="210" x2="38" y2="210" stroke="#00f5ff" strokeWidth="0.8" opacity="0.5" />
          <line x1="30" y1="220" x2="42" y2="220" stroke="#00f5ff" strokeWidth="0.8" opacity="0.6" />
          <line x1="30" y1="230" x2="36" y2="230" stroke="#00f5ff" strokeWidth="0.8" opacity="0.4" />
        </g>
      </svg>
    </div>
  );
}
