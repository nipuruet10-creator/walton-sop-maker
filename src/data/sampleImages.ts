// Crisp offline SVG data URLs for Walton SOP demo steps so images never fail to load
export const offlineSampleImages = [
  // 1. Packaging Tape Dispenser
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="%23f8fafc">
    <rect width="400" height="300" fill="%23e2e8f0"/>
    <rect x="40" y="50" width="320" height="200" rx="8" fill="%23cbd5e1" stroke="%2394a3b8" stroke-width="4"/>
    <circle cx="150" cy="150" r="60" fill="%23f59e0b" stroke="%23b45309" stroke-width="6"/>
    <circle cx="150" cy="150" r="30" fill="%23fef3c7"/>
    <path d="M 150 90 L 290 120 L 290 180 L 150 210 Z" fill="%23fbbf24" opacity="0.8"/>
    <rect x="280" y="110" width="20" height="80" rx="4" fill="%23475569"/>
    <text x="200" y="275" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23334155" text-anchor="middle">Packaging Tape Dispenser (200 mm)</text>
  </svg>`,

  // 2. Cartoon Top Tape Alignment
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="%23f8fafc">
    <rect width="400" height="300" fill="%23fed7aa"/>
    <!-- Cardboard Box / Cartoon -->
    <rect x="60" y="60" width="280" height="180" fill="%23d97706" stroke="%2392400e" stroke-width="4"/>
    <polygon points="60,60 120,20 340,20 280,60" fill="%23b45309"/>
    <polygon points="340,20 340,160 280,240 280,60" fill="%2378350f"/>
    <!-- BOPP Tape Line -->
    <rect x="50" y="140" width="300" height="24" fill="%23fef08a" stroke="%23ca8a04" stroke-width="2" opacity="0.9"/>
    <!-- Hand placement indicator -->
    <circle cx="180" cy="152" r="18" fill="%2338bdf8" opacity="0.8"/>
    <text x="200" y="275" font-family="sans-serif" font-size="14" font-weight="bold" fill="%2378350f" text-anchor="middle">Cassette Indoor Cartoon Taping (Step 2)</text>
  </svg>`,

  // 3. Lower Corner Taping
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="%23f8fafc">
    <rect width="400" height="300" fill="%23e2e8f0"/>
    <rect x="50" y="40" width="300" height="200" fill="%23d97706" stroke="%2392400e" stroke-width="4"/>
    <!-- Bottom Corner Tape -->
    <rect x="40" y="210" width="320" height="26" fill="%23facc15" stroke="%23a16207" stroke-width="2"/>
    <text x="200" y="275" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23334155" text-anchor="middle">Bottom Edge Tape Application (Step 3)</text>
  </svg>`,

  // 4. Cartoon 8-Point Tape Layout
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="%23f8fafc">
    <rect width="400" height="300" fill="%23fed7aa"/>
    <rect x="70" y="50" width="260" height="190" fill="%23b45309" stroke="%2378350f" stroke-width="3"/>
    <!-- 4 tapes left/right -->
    <rect x="50" y="70" width="80" height="20" fill="%23facc15" stroke="%23ca8a04"/>
    <rect x="50" y="130" width="80" height="20" fill="%23facc15" stroke="%23ca8a04"/>
    <rect x="50" y="190" width="80" height="20" fill="%23facc15" stroke="%23ca8a04"/>
    <rect x="270" y="70" width="80" height="20" fill="%23facc15" stroke="%23ca8a04"/>
    <rect x="270" y="130" width="80" height="20" fill="%23facc15" stroke="%23ca8a04"/>
    <rect x="270" y="190" width="80" height="20" fill="%23facc15" stroke="%23ca8a04"/>
    <text x="200" y="275" font-family="sans-serif" font-size="14" font-weight="bold" fill="%2378350f" text-anchor="middle">8 Specified Taping Points (Step 4)</text>
  </svg>`,

  // 5. PET Belt Machine Tension Dial Setting 3
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="%23f8fafc">
    <rect width="400" height="300" fill="%23334155"/>
    <circle cx="200" cy="140" r="85" fill="%2322c55e" stroke="%2315803d" stroke-width="8"/>
    <circle cx="200" cy="140" r="70" fill="%2316a34a"/>
    <!-- Dial Numbers -->
    <text x="200" y="85" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23ffffff" text-anchor="middle">3</text>
    <text x="245" y="115" font-family="sans-serif" font-size="16" fill="%23ffffff" text-anchor="middle">4</text>
    <text x="255" y="160" font-family="sans-serif" font-size="16" fill="%23ffffff" text-anchor="middle">5</text>
    <text x="155" y="115" font-family="sans-serif" font-size="16" fill="%23ffffff" text-anchor="middle">2</text>
    <text x="145" y="160" font-family="sans-serif" font-size="16" fill="%23ffffff" text-anchor="middle">1</text>
    <!-- Pointer at 3 -->
    <polygon points="200,92 194,140 206,140" fill="%23ffffff"/>
    <circle cx="200" cy="140" r="10" fill="%230f172a"/>
    <text x="200" y="200" font-family="sans-serif" font-size="13" font-weight="bold" fill="%23ffffff" text-anchor="middle">TENSION</text>
    <text x="200" y="275" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23f8fafc" text-anchor="middle">PET Belt Machine Setting 3 (Step 5)</text>
  </svg>`,

  // 6. Finished Strapped Carton
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="%23f8fafc">
    <rect width="400" height="300" fill="%23fed7aa"/>
    <rect x="60" y="50" width="280" height="190" fill="%23d97706" stroke="%2392400e" stroke-width="4"/>
    <!-- Green PET Strapping Band -->
    <rect x="130" y="45" width="20" height="200" fill="%2316a34a" stroke="%2315803d"/>
    <rect x="250" y="45" width="20" height="200" fill="%2316a34a" stroke="%2315803d"/>
    <rect x="55" y="130" width="290" height="20" fill="%2316a34a" stroke="%2315803d"/>
    <!-- Walton Quality Logo -->
    <text x="200" y="110" font-family="sans-serif" font-size="18" font-weight="bold" fill="%23005697" text-anchor="middle">WALTON</text>
    <text x="200" y="275" font-family="sans-serif" font-size="14" font-weight="bold" fill="%2378350f" text-anchor="middle">Final Strapped Carton Inspection (Step 6)</text>
  </svg>`,
];
