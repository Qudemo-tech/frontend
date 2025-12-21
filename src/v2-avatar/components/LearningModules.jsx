import React, { useState } from 'react';
import { CheckCircle, BookOpen, Lock, Award } from 'lucide-react';

/**
 * LearningModules - Interactive learning module selector
 * Similar to the image with boxes for different topics
 */
const LearningModules = ({ onModuleSelect, activeModule, completedModules = [] }) => {
  const modules = [
    {
      id: 'natural-selection',
      title: 'Natural Sel.',
      icon: CheckCircle,
      color: 'bg-green-100 border-green-300',
      activeColor: 'bg-green-200 border-green-400',
      textColor: 'text-green-800',
      order: 1
    },
    {
      id: 'genetic-drift',
      title: 'Genetic Drift',
      icon: BookOpen,
      color: 'bg-emerald-100 border-emerald-300',
      activeColor: 'bg-emerald-200 border-emerald-400',
      textColor: 'text-emerald-800',
      order: 2
    },
    {
      id: 'fossil-record',
      title: 'Fossil Record',
      icon: Lock,
      color: 'bg-gray-100 border-gray-300',
      activeColor: 'bg-gray-200 border-gray-400',
      textColor: 'text-gray-600',
      order: 3
    },
    {
      id: 'final-quiz',
      title: 'Final Quiz',
      icon: Award,
      color: 'bg-gray-100 border-gray-300 border-2 border-orange-400',
      activeColor: 'bg-gray-200 border-gray-400 border-2 border-orange-500',
      textColor: 'text-gray-600',
      order: 4
    }
  ];

  // Determine module status dynamically - all modules are unlocked
  const getModuleStatus = (module) => {
    const isCompleted = completedModules.includes(module.id);
    const isActive = activeModule === module.id;
    
    // All modules are available - no locking
    if (isCompleted) {
      return 'completed';
    } else if (isActive) {
      return 'active';
    } else {
      return 'available';
    }
  };

  const handleModuleClick = (module) => {
    // All modules are clickable - no restrictions
    onModuleSelect(module.id);
  };

  return (
    <div className="flex gap-2 justify-center items-center p-2">
      {modules.map((module) => {
        const Icon = module.icon;
        const status = getModuleStatus(module);
        const isActive = activeModule === module.id;
        const isCompleted = completedModules.includes(module.id);
        
        return (
          <button
            key={module.id}
            onClick={() => handleModuleClick(module)}
            className={`
              relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-all
              ${isActive ? module.activeColor : module.color}
              cursor-pointer hover:scale-105 hover:shadow-md
              ${isActive ? 'ring-1 ring-blue-400' : ''}
            `}
          >
            <Icon 
              className={`w-4 h-4 ${module.textColor}`}
            />
            <div className="flex flex-col items-start">
              <span className={`font-semibold text-xs ${module.textColor}`}>
                {module.title}
              </span>
              {isCompleted && (
                <span className={`text-xs ${module.textColor} opacity-70`}>
                  ✔
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default LearningModules;

