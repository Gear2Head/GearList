import React, { useState, useMemo } from 'react';
import { PieChart as PieChartIcon, Disc, Sparkles, Filter, Info, Eye } from 'lucide-react';
import { MediaItem } from '../types';
import { calculateGenreBreakdown } from '../utils/calculations';

interface GenrePieChartProps {
  mediaItems: MediaItem[];
  className?: string;
  onOpenDetails?: (item: MediaItem) => void;
}

export const GenrePieChart: React.FC<GenrePieChartProps> = ({
  mediaItems,
  className = '',
}) => {
  const [hoveredGenre, setHoveredGenre] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'donut' | 'pie'>('donut');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'anime' | 'tv' | 'movie'>('all');

  // Filter media items if a specific media type is selected
  const filteredItems = useMemo(() => {
    if (mediaTypeFilter === 'all') return mediaItems;
    return mediaItems.filter((item) => item.type === mediaTypeFilter);
  }, [mediaItems, mediaTypeFilter]);

  // Calculate ranked genre breakdown
  const genreData = useMemo(() => {
    return calculateGenreBreakdown(filteredItems);
  }, [filteredItems]);

  const totalCalculatedMinutes = useMemo(() => {
    return genreData.reduce((sum, g) => sum + g.minutes, 0);
  }, [genreData]);

  const totalHours = Math.round((totalCalculatedMinutes / 60) * 10) / 10;

  // Prepare slices for SVG Pie/Donut Chart
  const slices = useMemo(() => {
    if (genreData.length === 0 || totalCalculatedMinutes === 0) return [];

    let accumulatedAngle = 0;
    const cx = 150;
    const cy = 150;
    const outerRadius = 125;
    const innerRadius = chartType === 'donut' ? 76 : 0;

    return genreData.map((item) => {
      const sliceFraction = item.minutes / totalCalculatedMinutes;
      const angle = sliceFraction * 360;
      const startAngle = accumulatedAngle;
      const endAngle = accumulatedAngle + angle;
      accumulatedAngle += angle;

      // Convert angles from degrees to radians (-90 deg to start at top 12 o'clock)
      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;

      const isLargeArc = angle > 180 ? 1 : 0;

      // Outer arc points
      const x1 = cx + outerRadius * Math.cos(startRad);
      const y1 = cy + outerRadius * Math.sin(startRad);
      const x2 = cx + outerRadius * Math.cos(endRad);
      const y2 = cy + outerRadius * Math.sin(endRad);

      let path = '';
      if (chartType === 'donut') {
        // Inner arc points
        const x3 = cx + innerRadius * Math.cos(endRad);
        const y3 = cy + innerRadius * Math.sin(endRad);
        const x4 = cx + innerRadius * Math.cos(startRad);
        const y4 = cy + innerRadius * Math.sin(startRad);

        path = `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${isLargeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${isLargeArc} 0 ${x4} ${y4} Z`;
      } else {
        path = `M ${cx} ${cy} L ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${isLargeArc} 1 ${x2} ${y2} Z`;
      }

      // Mid angle for centroid label / hover effect
      const midAngle = startAngle + angle / 2;
      const midRad = ((midAngle - 90) * Math.PI) / 180;
      const offsetRadius = outerRadius + 8;
      const labelX = cx + offsetRadius * Math.cos(midRad);
      const labelY = cy + offsetRadius * Math.sin(midRad);

      return {
        ...item,
        path,
        startAngle,
        endAngle,
        angle,
        midAngle,
        labelX,
        labelY,
        sliceFraction,
      };
    });
  }, [genreData, totalCalculatedMinutes, chartType]);

  const activeGenreInfo = useMemo(() => {
    if (!hoveredGenre) return genreData[0] || null;
    return genreData.find((g) => g.genre === hoveredGenre) || genreData[0] || null;
  }, [hoveredGenre, genreData]);

  if (genreData.length === 0 || totalCalculatedMinutes === 0) {
    return (
      <div className="p-8 rounded-3xl bg-[#161618] border border-white/5 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
          <PieChartIcon className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-sm text-gray-200">Tür Verisi Henüz Oluşmadı</h4>
        <p className="text-xs text-gray-400 max-w-sm mx-auto">
          Kütüphanenize izlediğiniz veya izlemekte olduğunuz yapımları ekledikçe tür pasta grafiği otomatik olarak şekillenecektir.
        </p>
      </div>
    );
  }

  return (
    <div className={`p-6 sm:p-7 rounded-3xl bg-[#161618] border border-white/5 shadow-2xl space-y-6 ${className}`}>
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <PieChartIcon className="w-4 h-4" />
            </div>
            <h3 className="font-black text-base sm:text-lg text-white">
              Tür Dağılımı Pasta Grafiği (Genre Percentage)
            </h3>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            İzlediğiniz tüm içeriklerin tür bazında yüzdesel oranları ve alışkanlık haritanız
          </p>
        </div>

        {/* View mode & filter toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Chart Type Toggle */}
          <div className="flex items-center bg-[#0D0D0E] p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setChartType('donut')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                chartType === 'donut'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Disc className="w-3 h-3" />
              <span>Halka (Donut)</span>
            </button>
            <button
              onClick={() => setChartType('pie')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                chartType === 'pie'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <PieChartIcon className="w-3 h-3" />
              <span>Pasta (Pie)</span>
            </button>
          </div>

          {/* Media Type Filter */}
          <div className="flex items-center bg-[#0D0D0E] p-1 rounded-xl border border-white/5 text-xs">
            {[
              { id: 'all', label: 'Tümü' },
              { id: 'anime', label: '⛩️ Anime' },
              { id: 'tv', label: '📺 Dizi' },
              { id: 'movie', label: '🎬 Film' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setMediaTypeFilter(f.id as any)}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  mediaTypeFilter === f.id
                    ? 'bg-white/10 text-white font-bold'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chart Body: SVG Pie + Interactive Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left / Center: Interactive SVG Pie Chart */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative select-none">
          <div className="relative w-[280px] h-[280px] sm:w-[310px] sm:h-[310px]">
            <svg
              viewBox="0 0 300 300"
              className="w-full h-full transform transition-transform duration-300 drop-shadow-xl"
            >
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Slices */}
              {slices.map((slice) => {
                const isHovered = hoveredGenre === slice.genre;
                const isAnyHovered = hoveredGenre !== null;

                return (
                  <path
                    key={slice.genre}
                    d={slice.path}
                    fill={slice.color}
                    opacity={isHovered ? 1 : isAnyHovered ? 0.35 : 0.9}
                    stroke="#161618"
                    strokeWidth={isHovered ? "3" : "1.5"}
                    filter={isHovered ? "url(#glow)" : undefined}
                    className="cursor-pointer transition-all duration-300"
                    style={{
                      transformOrigin: '150px 150px',
                      transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                    }}
                    onMouseEnter={() => setHoveredGenre(slice.genre)}
                    onMouseLeave={() => setHoveredGenre(null)}
                  />
                );
              })}

              {/* Center Circle Cutout Overlay for Donut */}
              {chartType === 'donut' && (
                <circle
                  cx="150"
                  cy="150"
                  r="74"
                  fill="#161618"
                  className="pointer-events-none"
                />
              )}
            </svg>

            {/* Donut Center Display */}
            {chartType === 'donut' && activeGenreInfo && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
                <span
                  className="w-2.5 h-2.5 rounded-full mb-1 shadow-sm"
                  style={{ backgroundColor: activeGenreInfo.color }}
                />
                <p className="font-bold text-xs text-gray-200 truncate max-w-[120px]">
                  {activeGenreInfo.genre}
                </p>
                <p className="text-xl sm:text-2xl font-black text-white font-mono leading-none mt-0.5">
                  %{activeGenreInfo.percentage}
                </p>
                <p className="text-[10px] text-gray-400 font-mono mt-1">
                  {activeGenreInfo.hours}s • {activeGenreInfo.itemCount} Yapım
                </p>
              </div>
            )}
          </div>

          <p className="text-[11px] text-gray-500 mt-2 text-center">
            💡 Dilimlerin üzerine gelerek detayları inceleyebilirsiniz
          </p>
        </div>

        {/* Right: Legend Breakdown & Habit Insights */}
        <div className="lg:col-span-7 space-y-4">
          {/* Top Habit Spotlight Banner */}
          <div className="p-4 rounded-2xl bg-[#0D0D0E] border border-blue-500/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-lg"
                style={{ backgroundColor: `${genreData[0]?.color}25`, color: genreData[0]?.color }}
              >
                🏆
              </div>
              <div>
                <span className="text-[10px] text-blue-400 uppercase font-bold tracking-wider">
                  BASKIN SEYİR ALIŞKANLIĞI
                </span>
                <h4 className="font-black text-sm text-white flex items-center gap-1.5">
                  <span>En Çok: {genreData[0]?.genre}</span>
                  <span className="text-xs text-blue-400 font-mono font-bold">
                    (%{genreData[0]?.percentage})
                  </span>
                </h4>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs font-mono font-bold text-gray-200 block">
                {genreData[0]?.hours} Saat
              </span>
              <span className="text-[10px] text-gray-500">
                {genreData[0]?.itemCount} Eser
              </span>
            </div>
          </div>

          {/* Interactive Legend Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto pr-1 scrollbar-none">
            {genreData.map((item) => {
              const isHovered = hoveredGenre === item.genre;

              return (
                <div
                  key={item.genre}
                  onMouseEnter={() => setHoveredGenre(item.genre)}
                  onMouseLeave={() => setHoveredGenre(null)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isHovered
                      ? 'bg-[#1E1E22] border-blue-500/50 shadow-md scale-[1.02]'
                      : 'bg-[#0D0D0E] border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3 h-3 rounded-md shrink-0 shadow-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-gray-200 truncate">{item.genre}</p>
                      <p className="text-[10px] text-gray-500">
                        {item.itemCount} yapım
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-white block">
                      %{item.percentage}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">
                      {item.hours}s
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total Analyzed Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-white/5 font-mono">
            <span>Toplam Analiz Edilen: {totalHours} Saat</span>
            <span>{genreData.length} Farklı Tür</span>
          </div>
        </div>
      </div>
    </div>
  );
};
