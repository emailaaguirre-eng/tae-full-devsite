"use client";

import { useState, useRef, useEffect } from 'react';

interface ArtKeyHoverPreviewProps {
  productName: string;
  productId?: string | number;
  productInfo?: {
    description?: string;
    price?: string;
    image?: string;
    category?: string;
  };
  initialData?: {
    title: string;
    theme: {
      template: string;
      bg_color: string;
      bg_image_url?: string;
      button_color: string;
      title_color: string;
    };
  };
  hotspotPosition?: {
    x: string;
    y: string;
  };
  children: React.ReactNode;
}

export default function ArtKeyHoverPreview({
  productName,
  productId,
  productInfo,
  initialData,
  hotspotPosition = { x: '85%', y: '85%' },
  children,
}: ArtKeyHoverPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [configData, setConfigData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [effectiveHotspotPosition, setEffectiveHotspotPosition] = useState(hotspotPosition);
  
  // Use config data if available, otherwise use initialData or defaults
  const defaultData = {
    title: productName || 'Your ArtKey',
    theme: {
      template: 'classic',
      bg_color: '#F6F7FB',
      button_color: '#4f46e5',
      title_color: '#4f46e5',
    },
  };
  
  const effectiveData = configData?.artKeyData || initialData || defaultData;
  
  // Mini Editor State
  const [title, setTitle] = useState(effectiveData.title);
  const [bgColor, setBgColor] = useState(effectiveData.theme.bg_color);
  const [buttonColor, setButtonColor] = useState(effectiveData.theme.button_color);
  const [titleColor, setTitleColor] = useState(effectiveData.theme.title_color);
  const [selectedTemplate, setSelectedTemplate] = useState(effectiveData.theme.template);
  
  // Fetch product-specific ArtKey config from backend
  useEffect(() => {
    if (productId) {
      fetchProductConfig();
    }
  }, [productId]);
  
  const fetchProductConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/artkey/config?productId=${productId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.config && data.config.enabled) {
          setConfigData(data.config);
          // Update state with config data
          if (data.config.artKeyData) {
            setTitle(data.config.artKeyData.title || productName);
            setBgColor(data.config.artKeyData.theme?.bg_color || '#F6F7FB');
            setButtonColor(data.config.artKeyData.theme?.button_color || '#4f46e5');
            setTitleColor(data.config.artKeyData.theme?.title_color || '#4f46e5');
            setSelectedTemplate(data.config.artKeyData.theme?.template || 'classic');
            if (data.config.artKeyData.features) {
              setFeatures({
                showGallery: data.config.artKeyData.features.enable_gallery || false,
                showGuestbook: data.config.artKeyData.features.show_guestbook || false,
                showPlaylist: data.config.artKeyData.spotify?.url ? true : false,
              });
            }
          }
          // Update hotspot position if configured
          if (data.config.hotspot) {
            setEffectiveHotspotPosition({
              x: data.config.hotspot.x || hotspotPosition.x,
              y: data.config.hotspot.y || hotspotPosition.y,
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch product config:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Merge productInfo from props with config data
  const effectiveProductInfo = configData?.productInfo || productInfo;
  
  // Features state
  const [features, setFeatures] = useState({
    showGuestbook: false,
    showGallery: false,
    showPlaylist: false,
  });

  // Templates (mini version - 6 quick options)
  const templates = [
    { id: 'classic', name: 'Classic', bg: '#F6F7FB', button: '#4f46e5', title: '#4f46e5' },
    { id: 'aurora', name: 'Aurora', bg: 'linear-gradient(135deg,#667eea,#764ba2)', button: '#ffffff', title: '#ffffff' },
    { id: 'sunset', name: 'Sunset', bg: 'linear-gradient(135deg,#ff6b6b,#feca57)', button: '#ffffff', title: '#ffd700' },
    { id: 'dark', name: 'Dark', bg: '#0f1218', button: '#667eea', title: '#667eea' },
    { id: 'ocean', name: 'Ocean', bg: 'linear-gradient(135deg,#667eea,#74ebd5)', button: '#ffffff', title: '#74ebd5' },
    { id: 'forest', name: 'Forest', bg: 'linear-gradient(135deg,#134e5e,#71b280)', button: '#ffffff', title: '#d4fc79' },
  ];

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (!isPinned) {
      timeoutRef.current = setTimeout(() => setIsOpen(false), 300);
    }
  };

  const applyTemplate = (template: typeof templates[0]) => {
    setSelectedTemplate(template.id);
    setBgColor(template.bg);
    setButtonColor(template.button);
    setTitleColor(template.title);
  };

  const getButtonTextColor = (color: string) => {
    if (color === '#ffffff' || color === '#FFFFFF' || color === '#fef3c7' || color === '#fde047') {
      return '#000000';
    }
    return '#ffffff';
  };

  const handleOpenFullEditor = () => {
    // Save current customization to session storage
    sessionStorage.setItem('miniArtKeyData', JSON.stringify({
      title,
      theme: { bg_color: bgColor, button_color: buttonColor, title_color: titleColor, template: selectedTemplate },
      features,
    }));
    window.location.href = `/artkey-editor?product_id=${productId || ''}&from_mini=true`;
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

return (
    <div className="relative group/product">
      {children}

      {/* ArtKey Signature Icon - Like an artist signature in the corner */}    
      <div
        className="absolute cursor-pointer z-10 group/artkey opacity-0 group-hover/product:opacity-100 transition-opacity duration-300"
        style={{ 
          right: effectiveHotspotPosition.x === '85%' ? '8px' : effectiveHotspotPosition.x,
          bottom: effectiveHotspotPosition.y === '85%' ? '8px' : effectiveHotspotPosition.y,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => setIsPinned(!isPinned)}
      >
        {/* Radiating Halo Effect - Multiple concentric rings */}
        <div className="absolute inset-0 w-16 h-16 -m-3.5 flex items-center justify-center">
          {/* Outer ring - slow pulse */}
          <div className="absolute w-16 h-16 rounded-full border-2 border-brand-medium/30 animate-ping" style={{ animationDuration: '3s' }}></div>
          {/* Middle ring - medium pulse */}
          <div className="absolute w-12 h-12 rounded-full border-2 border-brand-medium/50 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }}></div>
          {/* Inner ring - fast pulse */}
          <div className="absolute w-8 h-8 rounded-full border-2 border-brand-medium/70 animate-ping" style={{ animationDuration: '1s', animationDelay: '1s' }}></div>
          {/* Glow effect */}
          <div className="absolute w-10 h-10 rounded-full bg-brand-medium/20 blur-sm animate-pulse"></div>
        </div>
        
        {/* Mini phone/ArtKey signature icon */}
        <div className="relative w-9 h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-md flex flex-col items-center justify-center shadow-lg border border-gray-600 overflow-hidden group-hover/artkey:scale-110 transition-transform z-10">
          {/* Mini notch */}
          <div className="absolute top-0.5 left-1/2 transform -translate-x-1/2 w-3 h-1 bg-black rounded-full"></div>
          
          {/* Mini screen with gradient */}
          <div 
            className="w-7 h-9 mt-1 rounded-sm flex items-center justify-center"
            style={{ background: bgColor }}
          >
            <span className="text-[8px] font-bold" style={{ color: titleColor }}>AK</span>
          </div>
          
          {/* Scan indicator */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-medium to-brand-light opacity-80"></div>
        </div>
        
        {/* Tooltip on hover */}
        <div className="absolute bottom-full right-0 mb-1 opacity-0 group-hover/artkey:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-black/80 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
            ✨ Scan to Explore
          </div>
        </div>
      </div>

      {/* Mini ArtKey Phone Popup - Larger Size */}
      {isOpen && (
        <div
          className="absolute z-50 transition-all duration-300"
          style={{ 
            right: '0',
            bottom: '100%',
            marginBottom: '10px',
          }}
          onMouseEnter={() => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }}
          onMouseLeave={handleMouseLeave}
        >
          <div className="rounded-2xl shadow-2xl border border-brand-light overflow-hidden" style={{ width: '420px', maxWidth: '90vw', backgroundColor: '#ffffff' }}>
            {/* Header with Product Info */}
            <div className="bg-gradient-to-r from-brand-medium to-brand-dark p-4 flex justify-between items-start">
              <div className="flex-1">
                <h4 className="text-white font-bold text-base font-playfair mb-1">✨ ArtKey Preview</h4>
                <p className="text-white font-semibold text-sm mb-1">{productName}</p>
                {effectiveProductInfo && (
                  <div className="space-y-0.5">
                    {effectiveProductInfo.description && (
                      <p className="text-white/80 text-xs line-clamp-2">{effectiveProductInfo.description}</p>
                    )}
                    {effectiveProductInfo.price && (
                      <p className="text-white/90 text-sm font-semibold">{effectiveProductInfo.price}</p>
                    )}
                    {effectiveProductInfo.category && (
                      <p className="text-white/70 text-xs">Category: {effectiveProductInfo.category}</p>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => { setIsOpen(false); setIsPinned(false); }}
                className="text-white/70 hover:text-white text-xl ml-2 flex-shrink-0"
              >
                ×
              </button>
            </div>

            <div className="p-5" style={{ backgroundColor: '#ffffff' }}>
              {/* Mini Phone Frame - Larger */}
              <div className="flex justify-center mb-5">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-[24px] p-2 shadow-xl relative" style={{ width: '240px' }}>
                  {/* Notch / Dynamic Island */}
                  <div className="absolute top-2.5 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-black rounded-full w-16 h-5 flex items-center justify-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-700"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-700"></div>
                    </div>
                  </div>
                  
                  {/* Phone Screen - Larger */}
                  <div 
                    className="rounded-[20px] overflow-hidden relative"
                    style={{ height: '380px' }}
                  >
                    <div
                      className="h-full w-full pt-8 pb-4 px-4 flex flex-col items-center justify-center text-center"
                      style={{ 
                        background: bgColor,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      {/* Title - Larger */}
                      <h1 
                        className="text-xl font-bold mb-4 font-playfair px-3"
                        style={{ color: titleColor }}
                      >
                        {title || productName || 'Your Title'}
                      </h1>
                      
                      {/* Product Info in ArtKey (if available) */}
                      {effectiveProductInfo && (
                        <div className="mb-4 px-3 space-y-2">
                          {effectiveProductInfo.description && (
                            <p className="text-xs opacity-80" style={{ color: titleColor }}>
                              {effectiveProductInfo.description}
                            </p>
                          )}
                          {effectiveProductInfo.price && (
                            <p className="text-sm font-semibold" style={{ color: titleColor }}>
                              {effectiveProductInfo.price}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Mini Buttons Preview - Larger */}
                      <div className="flex flex-col gap-2 w-full px-3">
                        {features.showGallery && (
                          <button
                            className="w-full py-2 px-4 rounded-full text-sm font-semibold shadow-sm"
                            style={{ backgroundColor: buttonColor, color: getButtonTextColor(buttonColor) }}
                          >
                            🖼️ Gallery
                          </button>
                        )}
                        {features.showGuestbook && (
                          <button
                            className="w-full py-2 px-4 rounded-full text-sm font-semibold shadow-sm"
                            style={{ backgroundColor: buttonColor, color: getButtonTextColor(buttonColor) }}
                          >
                            📝 Guestbook
                          </button>
                        )}
                        {features.showPlaylist && (
                          <button
                            className="w-full py-2 px-4 rounded-full text-sm font-semibold shadow-sm"
                            style={{ backgroundColor: buttonColor, color: getButtonTextColor(buttonColor) }}
                          >
                            🎵 Playlist
                          </button>
                        )}
                        {/* Product Info Button (if available) */}
                        {effectiveProductInfo && (
                          <button
                            className="w-full py-2 px-4 rounded-full text-sm font-semibold shadow-sm border-2"
                            style={{ 
                              backgroundColor: 'transparent', 
                              borderColor: buttonColor,
                              color: buttonColor 
                            }}
                          >
                            ℹ️ Product Info
                          </button>
                        )}
                        {!features.showGallery && !features.showGuestbook && !features.showPlaylist && (
                          <div className="text-xs opacity-60 py-2" style={{ color: titleColor }}>
                            Toggle features below
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Customization - Larger spacing */}
              <div className="space-y-4">
                {/* Title Input */}
                <div>
                  <label className="block text-sm font-semibold text-brand-darkest mb-2">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 border border-brand-light rounded-lg text-sm focus:border-brand-medium focus:outline-none"
                    style={{ backgroundColor: '#ffffff' }}
                    placeholder="Enter your title..."
                  />
                </div>

                {/* Quick Templates - Larger */}
                <div>
                  <label className="block text-sm font-semibold text-brand-darkest mb-2">Quick Theme</label>
                  <div className="grid grid-cols-6 gap-2">
                    {templates.map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => applyTemplate(tpl)}
                        className={`aspect-square rounded-lg border-2 transition-all ${
                          selectedTemplate === tpl.id ? 'border-brand-dark scale-110 shadow-md' : 'border-brand-light hover:border-brand-medium'
                        }`}
                        style={{ background: tpl.bg }}
                        title={tpl.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Quick Feature Toggles - Larger */}
                <div>
                  <label className="block text-sm font-semibold text-brand-darkest mb-2">Features</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFeatures(f => ({ ...f, showGallery: !f.showGallery }))}
                      className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium border-2 transition-all ${
                        features.showGallery ? 'border-brand-dark bg-brand-light' : 'border-brand-light hover:border-brand-medium'
                      }`}
                    >
                      🖼️ Gallery
                    </button>
                    <button
                      onClick={() => setFeatures(f => ({ ...f, showGuestbook: !f.showGuestbook }))}
                      className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium border-2 transition-all ${
                        features.showGuestbook ? 'border-brand-dark bg-brand-light' : 'border-brand-light hover:border-brand-medium'
                      }`}
                    >
                      📝 Book
                    </button>
                    <button
                      onClick={() => setFeatures(f => ({ ...f, showPlaylist: !f.showPlaylist }))}
                      className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium border-2 transition-all ${
                        features.showPlaylist ? 'border-brand-dark bg-brand-light' : 'border-brand-light hover:border-brand-medium'
                      }`}
                    >
                      🎵 Music
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Larger */}
            <div className="p-4 border-t border-brand-light flex gap-3" style={{ backgroundColor: '#ecece9' }}>
              <button
                onClick={handleOpenFullEditor}
                className="flex-1 bg-gradient-to-r from-brand-medium to-brand-dark text-white py-3 rounded-lg font-semibold text-sm hover:shadow-lg transition-all"
              >
                🎨 Full Editor
              </button>
              <button
                onClick={() => {
                  // Add to cart with customization
                  console.log('Adding to cart:', { title, bgColor, buttonColor, titleColor, features, productInfo });
                  alert('Added to cart! (Demo)');
                }}
                className="flex-1 border-2 border-brand-medium text-brand-dark py-3 rounded-lg font-semibold text-sm transition-all"
                style={{ backgroundColor: '#ecece9' }}
              >
                🛒 Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
