import React, { useState } from 'react';
import { CheckCircle, BookOpen, Award, ChevronDown, ChevronRight, Lock, Unlock, Bookmark, X, Menu } from 'lucide-react';

/**
 * LearningModules - LinkedIn Learning style sidebar with course contents
 */
const LearningModules = ({ onModuleSelect, activeModule, completedModules = [], onClose, isMobile = false }) => {
  const [expandedSections, setExpandedSections] = useState({
    'module-1': true,
    'module-2': true,
    'module-3': true
  });

  // Determine if a module is unlocked based on completion of previous modules
  const isModuleUnlocked = (moduleId) => {
    const moduleOrder = ['natural-selection', 'genetic-drift', 'fossil-record', 'final-quiz'];
    const moduleIndex = moduleOrder.indexOf(moduleId);
    
    if (moduleIndex === 0) {
      // First module is always unlocked
      return true;
    }
    
    if (moduleId === 'final-quiz') {
      // Quiz unlocks only when all 3 topics are completed
      return completedModules.includes('natural-selection') &&
             completedModules.includes('genetic-drift') &&
             completedModules.includes('fossil-record');
    }
    
    // Other modules unlock when previous module is completed
    const previousModuleId = moduleOrder[moduleIndex - 1];
    return completedModules.includes(previousModuleId);
  };

  const courseStructure = [
    {
      id: 'module-1',
      title: '1. Natural Selection',
      items: [
        {
          id: 'natural-selection',
          title: 'What is natural selection?',
          type: 'lesson',
          duration: '5m',
          icon: CheckCircle
        }
      ]
    },
    {
      id: 'module-2',
      title: '2. Genetic Drift',
      items: [
        {
          id: 'genetic-drift',
          title: 'Understanding genetic drift',
          type: 'lesson',
          duration: '4m',
          icon: BookOpen
        }
      ]
    },
    {
      id: 'module-3',
      title: '3. Fossil Record',
      items: [
        {
          id: 'fossil-record',
          title: 'What the fossil record shows us',
          type: 'lesson',
          duration: '6m',
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
          questions: 4,
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
    // Check if module is unlocked before allowing click
    if (!isModuleUnlocked(itemId)) {
      return; // Don't allow clicking locked modules
    }
    onModuleSelect(itemId);
  };

  const isItemActive = (itemId) => {
    return activeModule === itemId;
  };

  const isItemCompleted = (itemId) => {
    return completedModules.includes(itemId);
  };

  return (
    <div className={`fixed left-0 top-0 bottom-0 bg-gray-800 text-white z-50 flex flex-col shadow-2xl transition-all duration-300 ${
      isMobile ? 'w-full' : 'w-80'
    }`}>
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
        <h1 className="font-semibold text-base">Human Evolution</h1>
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
                        disabled={!isUnlocked}
                        className={`
                          w-full flex items-center gap-3 p-3 text-left transition-colors
                          ${isActive 
                            ? 'bg-black text-white' 
                            : isUnlocked
                            ? 'hover:bg-gray-700 text-gray-200 cursor-pointer'
                            : 'text-gray-500 cursor-not-allowed opacity-60'
                          }
                        `}
                      >
                        {/* Bullet point */}
                        <div className={`
                          w-2 h-2 rounded-full flex-shrink-0
                          ${isActive ? 'bg-white' : isUnlocked ? 'bg-gray-500' : 'bg-gray-600'}
                        `} />
                        
                        {/* Icon */}
                        <Icon className={`
                          w-4 h-4 flex-shrink-0
                          ${isActive ? 'text-white' : isUnlocked ? 'text-gray-400' : 'text-gray-600'}
                        `} />
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`
                              text-sm font-medium truncate
                              ${isActive ? 'text-white' : isUnlocked ? 'text-gray-200' : 'text-gray-500'}
                            `}>
                              {item.title}
                            </span>
                            {isCompleted && (
                              <span className="text-green-400 text-xs">✓</span>
                            )}
                          </div>
                          {item.duration && (
                            <span className={`text-xs ${isUnlocked ? 'text-gray-400' : 'text-gray-600'}`}>
                              {item.duration}
                            </span>
                          )}
                          {item.questions && (
                            <span className={`text-xs ${isUnlocked ? 'text-gray-400' : 'text-gray-600'}`}>
                              {item.questions} questions
                            </span>
                          )}
                        </div>

                        {/* Lock/Unlock Icon */}
                        {isUnlocked ? (
                          <Unlock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        ) : (
                          <Lock className="w-4 h-4 text-gray-600 flex-shrink-0" />
                        )}

                        {/* Bookmark Icon */}
                        <Bookmark className={`w-4 h-4 flex-shrink-0 ${isUnlocked ? 'text-gray-400 opacity-50' : 'text-gray-600 opacity-30'}`} />
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

export default LearningModules;

