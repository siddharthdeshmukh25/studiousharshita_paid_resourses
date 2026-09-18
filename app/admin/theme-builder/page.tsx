'use client';

import { useState } from 'react';
import { 
  Palette, 
  Type, 
  Layout, 
  Save, 
  RefreshCw,
  Eye,
  Monitor,
  Smartphone,
  X
} from 'lucide-react';

interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    card: string;
  };
  typography: {
    fontFamily: string;
    fontSize: number;
    headingSize: number;
  };
  spacing: {
    container: number;
    section: number;
    element: number;
  };
}

export default function ThemeBuilderPage() {
  const [activePanel, setActivePanel] = useState<'colors' | 'typography' | 'spacing' | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  const [theme, setTheme] = useState<ThemeConfig>({
    colors: {
      primary: '#2563EB',
      secondary: '#10B981',
      background: '#FFFFFF',
      text: '#0F172A',
      card: '#F8FAFC'
    },
    typography: {
      fontFamily: 'Inter',
      fontSize: 16,
      headingSize: 32
    },
    spacing: {
      container: 1200,
      section: 80,
      element: 16
    }
  });

  const updateTheme = (section: keyof ThemeConfig, key: string, value: string | number) => {
    setTheme(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const resetTheme = () => {
    setTheme({
      colors: {
        primary: '#2563EB',
        secondary: '#10B981',
        background: '#FFFFFF',
        text: '#0F172A',
        card: '#F8FAFC'
      },
      typography: {
        fontFamily: 'Inter',
        fontSize: 16,
        headingSize: 32
      },
      spacing: {
        container: 1200,
        section: 80,
        element: 16
      }
    });
  };

  const saveTheme = () => {
    localStorage.setItem('custom-theme', JSON.stringify(theme));
    alert('Theme saved successfully!');
  };

  const loadTheme = () => {
    const saved = localStorage.getItem('custom-theme');
    if (saved) {
      setTheme(JSON.parse(saved));
      alert('Theme loaded successfully!');
    } else {
      alert('No saved theme found.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Primary Sidebar - Icons Only */}
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-4">
        <button
          onClick={() => setActivePanel(activePanel === 'colors' ? null : 'colors')}
          className={`p-3 rounded-lg transition-colors ${
            activePanel === 'colors' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'
          }`}
          title="Colors"
        >
          <Palette className="h-5 w-5" />
        </button>
        <button
          onClick={() => setActivePanel(activePanel === 'typography' ? null : 'typography')}
          className={`p-3 rounded-lg transition-colors ${
            activePanel === 'typography' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'
          }`}
          title="Typography"
        >
          <Type className="h-5 w-5" />
        </button>
        <button
          onClick={() => setActivePanel(activePanel === 'spacing' ? null : 'spacing')}
          className={`p-3 rounded-lg transition-colors ${
            activePanel === 'spacing' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'
          }`}
          title="Spacing"
        >
          <Layout className="h-5 w-5" />
        </button>
      </div>

      {/* Theme Panel - Slides in when icon is clicked */}
      {activePanel && (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Panel Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 capitalize">{activePanel}</h2>
            <button
              onClick={() => setActivePanel(null)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activePanel === 'colors' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={theme.colors.primary}
                      onChange={(e) => updateTheme('colors', 'primary', e.target.value)}
                      className="w-12 h-12 rounded cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={theme.colors.primary}
                      onChange={(e) => updateTheme('colors', 'primary', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={theme.colors.secondary}
                      onChange={(e) => updateTheme('colors', 'secondary', e.target.value)}
                      className="w-12 h-12 rounded cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={theme.colors.secondary}
                      onChange={(e) => updateTheme('colors', 'secondary', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Background</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={theme.colors.background}
                      onChange={(e) => updateTheme('colors', 'background', e.target.value)}
                      className="w-12 h-12 rounded cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={theme.colors.background}
                      onChange={(e) => updateTheme('colors', 'background', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={theme.colors.text}
                      onChange={(e) => updateTheme('colors', 'text', e.target.value)}
                      className="w-12 h-12 rounded cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={theme.colors.text}
                      onChange={(e) => updateTheme('colors', 'text', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Card Background</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={theme.colors.card}
                      onChange={(e) => updateTheme('colors', 'card', e.target.value)}
                      className="w-12 h-12 rounded cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={theme.colors.card}
                      onChange={(e) => updateTheme('colors', 'card', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {activePanel === 'typography' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
                  <select
                    value={theme.typography.fontFamily}
                    onChange={(e) => updateTheme('typography', 'fontFamily', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Poppins">Poppins</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Lato">Lato</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Font Size: {theme.typography.fontSize}px
                  </label>
                  <input
                    type="range"
                    min="12"
                    max="24"
                    value={theme.typography.fontSize}
                    onChange={(e) => updateTheme('typography', 'fontSize', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Heading Size: {theme.typography.headingSize}px
                  </label>
                  <input
                    type="range"
                    min="24"
                    max="48"
                    value={theme.typography.headingSize}
                    onChange={(e) => updateTheme('typography', 'headingSize', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {activePanel === 'spacing' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Container Width: {theme.spacing.container}px
                  </label>
                  <input
                    type="range"
                    min="800"
                    max="1400"
                    step="50"
                    value={theme.spacing.container}
                    onChange={(e) => updateTheme('spacing', 'container', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section Padding: {theme.spacing.section}px
                  </label>
                  <input
                    type="range"
                    min="40"
                    max="120"
                    step="10"
                    value={theme.spacing.section}
                    onChange={(e) => updateTheme('spacing', 'section', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Element Spacing: {theme.spacing.element}px
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="32"
                    step="4"
                    value={theme.spacing.element}
                    onChange={(e) => updateTheme('spacing', 'element', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Panel Footer - Actions */}
          <div className="p-4 border-t border-gray-200 space-y-2">
            <button
              onClick={saveTheme}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="h-4 w-4" />
              Save Theme
            </button>
            <button
              onClick={loadTheme}
              className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Load Theme
            </button>
            <button
              onClick={resetTheme}
              className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
            >
              Reset to Default
            </button>
          </div>
        </div>
      )}

      {/* Main Content - Preview Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-900">Live Preview</h1>
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`p-2 rounded transition-colors ${
                  previewMode === 'desktop' ? 'bg-white shadow' : 'hover:bg-gray-200'
                }`}
              >
                <Monitor className="h-5 w-5" />
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`p-2 rounded transition-colors ${
                  previewMode === 'mobile' ? 'bg-white shadow' : 'hover:bg-gray-200'
                }`}
              >
                <Smartphone className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600">Changes apply in real-time</span>
          </div>
        </div>

        {/* Preview Canvas */}
        <div className="flex-1 bg-gray-200 p-8 overflow-auto">
          <div 
            className={`mx-auto bg-white rounded-lg shadow-lg overflow-auto ${
              previewMode === 'mobile' ? 'w-[375px]' : 'w-full'
            }`}
            style={{
              maxWidth: previewMode === 'desktop' ? `${theme.spacing.container}px` : '375px',
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
              fontFamily: theme.typography.fontFamily,
              fontSize: `${theme.typography.fontSize}px`
            }}
          >
            {/* Sample Content */}
            <div style={{ padding: `${theme.spacing.section}px ${theme.spacing.element}px` }}>
              <h1 
                style={{ 
                  fontSize: `${theme.typography.headingSize}px`,
                  color: theme.colors.primary,
                  marginBottom: `${theme.spacing.element}px`
                }}
              >
                Welcome to Your Website
              </h1>
              
              <p style={{ marginBottom: `${theme.spacing.element}px` }}>
                This is a live preview of your theme. Click the icons on the left to customize colors, typography, and spacing.
              </p>

              <div 
                style={{ 
                  backgroundColor: theme.colors.card,
                  padding: `${theme.spacing.element}px`,
                  borderRadius: '12px',
                  marginBottom: `${theme.spacing.element}px`,
                  border: '1px solid #e5e7eb'
                }}
              >
                <h3 style={{ color: theme.colors.primary, marginBottom: '8px' }}>
                  Sample Card
                </h3>
                <p style={{ fontSize: '0.9em' }}>
                  This card shows how your theme affects component styling.
                </p>
              </div>

              <div style={{ display: 'flex', gap: `${theme.spacing.element}px` }}>
                <button
                  style={{
                    backgroundColor: theme.colors.primary,
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Primary Button
                </button>
                <button
                  style={{
                    backgroundColor: theme.colors.secondary,
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Secondary Button
                </button>
              </div>

              <div style={{ marginTop: `${theme.spacing.section}px` }}>
                <h2 style={{ color: theme.colors.primary, marginBottom: `${theme.spacing.element}px` }}>
                  Feature Section
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: `${theme.spacing.element}px` }}>
                  {[1, 2, 3].map((i) => (
                    <div 
                      key={i}
                      style={{ 
                        backgroundColor: theme.colors.card,
                        padding: `${theme.spacing.element}px`,
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}
                    >
                      <h4 style={{ color: theme.colors.primary, marginBottom: '8px' }}>
                        Feature {i}
                      </h4>
                      <p style={{ fontSize: '0.9em' }}>
                        This is a feature card that demonstrates the theme styling.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
