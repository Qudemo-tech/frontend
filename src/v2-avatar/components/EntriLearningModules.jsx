import React, { useState, useMemo } from 'react';
import {
  CheckCircle,
  BookOpen,
  Award,
  ChevronDown,
  ChevronRight,
  Unlock,
  Bookmark,
  X,
  Menu,
  Shield,
  Heart,
  Users,
  Building2,
  Video,
  FileText,
  HelpCircle
} from 'lucide-react';

/**
 * Icon resolver - maps icon string names to Lucide components
 */
const iconMap = {
  CheckCircle,
  BookOpen,
  Award,
  Shield,
  Heart,
  Users,
  Building2,
  Video,
  FileText,
  HelpCircle,
};

const getIcon = (iconName) => {
  return iconMap[iconName] || BookOpen;
};

/**
 * EntriLearningModules - Dynamic sidebar for Entri onboarding
 *
 * Renders course structure from persona config - no hardcoded modules.
 * All module data comes from persona.modules.courseStructure and persona.modules.definitions.
 *
 * Props:
 * - persona: The persona configuration object
 * - onModuleSelect: Callback when a module is clicked
 * - activeModule: Currently active module ID
 * - completedModules: Array of completed module IDs
 * - onClose: Callback to close the sidebar
 */
const EntriLearningModules = ({
  persona,
  onModuleSelect,
  activeModule,
  completedModules = [],
  onClose
}) => {
  // Get course data from persona config
  const courseStructure = persona?.modules?.courseStructure || [];
  const moduleDefinitions = persona?.modules?.definitions || {};
  const courseMeta = persona?.modules?.courseMeta || { title: 'Course' };

  // Initialize all sections as expanded
  const initialExpandedState = useMemo(() => {
    const state = {};
    courseStructure.forEach(section => {
      state[section.id] = true;
    });
    return state;
  }, [courseStructure]);

  const [expandedSections, setExpandedSections] = useState(initialExpandedState);

  // All modules are unlocked for Entri (linear flow handled by avatar)
  const isModuleUnlocked = () => true;

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleItemClick = (itemId) => {
    onModuleSelect(itemId);
  };

  const isItemActive = (itemId) => activeModule === itemId;
  const isItemCompleted = (itemId) => completedModules.includes(itemId);

  // If no course structure, show empty state
  if (!courseStructure.length) {
    return (
      <div className="fixed left-0 top-0 bottom-0 w-80 bg-gray-800 text-white z-50 flex flex-col shadow-2xl">
        <div className="flex items-center justify-center h-full text-gray-400">
          No modules configured
        </div>
      </div>
    );
  }

  return (
    <div className="fixed left-0 top-0 bottom-0 w-80 bg-gray-800 text-white z-50 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Menu className="w-5 h-5 cursor-pointer hover:text-gray-300" />
          <h2 className="font-semibold text-sm">Contents</h2>
        </div>
        {onClose && (
          <X
            className="w-5 h-5 cursor-pointer hover:text-gray-300"
            onClick={onClose}
          />
        )}
      </div>

      {/* Course Title */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="font-semibold text-base">{courseMeta.title}</h1>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {courseStructure.map((section) => {
          const isExpanded = expandedSections[section.id];

          return (
            <div key={section.id} className="border-b border-gray-700">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-700 transition-colors"
              >
                <span className="font-medium text-sm text-left">{section.title}</span>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {/* Section Items */}
              {isExpanded && (
                <div className="bg-gray-800">
                  {section.items.map((itemId) => {
                    const item = moduleDefinitions[itemId];
                    if (!item) return null; // Skip if module not defined

                    const isActive = isItemActive(itemId);
                    const isCompleted = isItemCompleted(itemId);
                    const Icon = getIcon(item.icon);

                    return (
                      <button
                        key={itemId}
                        onClick={() => handleItemClick(itemId)}
                        className={`
                          w-full flex items-center gap-3 p-3 text-left transition-colors
                          ${isActive
                            ? 'bg-black text-white'
                            : 'hover:bg-gray-700 text-gray-200 cursor-pointer'
                          }
                        `}
                      >
                        {/* Bullet point */}
                        <div className={`
                          w-2 h-2 rounded-full flex-shrink-0
                          ${isActive ? 'bg-white' : 'bg-gray-500'}
                        `} />

                        {/* Icon */}
                        <Icon className={`
                          w-4 h-4 flex-shrink-0
                          ${isActive ? 'text-white' : 'text-gray-400'}
                        `} />

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`
                              text-sm font-medium truncate
                              ${isActive ? 'text-white' : 'text-gray-200'}
                            `}>
                              {item.title}
                            </span>
                            {isCompleted && (
                              <span className="text-green-400 text-xs">✓</span>
                            )}
                          </div>
                          {item.duration && (
                            <span className="text-xs text-gray-400">
                              {item.duration}
                            </span>
                          )}
                          {item.questions && (
                            <span className="text-xs text-gray-400">
                              {item.questions} questions
                            </span>
                          )}
                        </div>

                        {/* Unlock Icon */}
                        <Unlock className="w-4 h-4 text-gray-400 flex-shrink-0" />

                        {/* Bookmark Icon */}
                        <Bookmark className="w-4 h-4 text-gray-400 opacity-50 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EntriLearningModules;
