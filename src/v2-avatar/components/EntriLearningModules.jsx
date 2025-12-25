import React, { useState } from 'react';
import { CheckCircle, BookOpen, Award, ChevronDown, ChevronRight, Unlock, Bookmark, X, Menu, Shield, Heart, Users, Building2 } from 'lucide-react';

/**
 * EntriLearningModules - LinkedIn Learning style sidebar for Entri onboarding
 * All modules are unlocked - no progressive unlocking
 */
const EntriLearningModules = ({ onModuleSelect, activeModule, completedModules = [], onClose }) => {
  const [expandedSections, setExpandedSections] = useState({
    'module-1': true,
    'module-2': true,
    'module-3': true,
    'module-4': true,
    'module-5': true,
    'module-6': true,
    'quiz-section': true
  });

  // All modules are unlocked - no locking logic
  const isModuleUnlocked = (moduleId) => {
    return true; // Everything is unlocked
  };

  const courseStructure = [
    {
      id: 'module-1',
      title: '1. Welcome & Introduction',
      items: [
        {
          id: 'welcome-intro',
          title: 'Welcome to Entri',
          type: 'lesson',
          duration: '3m',
          icon: CheckCircle
        },
        {
          id: 'founder-video',
          title: "Founder's Video",
          type: 'video',
          duration: '5m',
          icon: BookOpen
        }
      ]
    },
    {
      id: 'module-3',
      title: '3. POSH Information',
      items: [
        {
          id: 'posh-info',
          title: 'Prevention of Sexual Harassment',
          type: 'lesson',
          duration: '4m',
          icon: Shield
        }
      ]
    },
    {
      id: 'module-4',
      title: '4. Employee Benefits',
      items: [
        {
          id: 'employee-benefits',
          title: 'Benefits Overview',
          type: 'lesson',
          duration: '6m',
          icon: Heart
        }
      ]
    },
    {
      id: 'module-5',
      title: '5. Lifestyle Benefits',
      items: [
        {
          id: 'lifestyle-benefits',
          title: 'Wellness & Recreation',
          type: 'lesson',
          duration: '5m',
          icon: Users
        }
      ]
    },
    {
      id: 'module-6',
      title: '6. Company Rules and Policies',
      items: [
        {
          id: 'company-rules',
          title: 'Rules and Policies',
          type: 'lesson',
          duration: '7m',
          icon: BookOpen
        }
      ]
    },
    {
      id: 'quiz-section',
      title: 'Assessment',
      items: [
        {
          id: 'final-quiz',
          title: 'Final Quiz',
          type: 'quiz',
          questions: 5,
          icon: Award
        }
      ]
    }
  ];

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleItemClick = (itemId) => {
    // All modules are unlocked, so always allow clicking
    onModuleSelect(itemId);
  };

  const isItemActive = (itemId) => {
    return activeModule === itemId;
  };

  const isItemCompleted = (itemId) => {
    return completedModules.includes(itemId);
  };

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
        <h1 className="font-semibold text-base">Entri Employee Onboarding</h1>
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
                  {section.items.map((item) => {
                    const isActive = isItemActive(item.id);
                    const isCompleted = isItemCompleted(item.id);
                    const isUnlocked = isModuleUnlocked(item.id);
                    const Icon = item.icon;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item.id)}
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

                        {/* Unlock Icon - always shown since everything is unlocked */}
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

