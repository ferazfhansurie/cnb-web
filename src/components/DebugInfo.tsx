import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface DebugData {
  [key: string]: any;
}

interface DebugInfoProps {
  data: DebugData;
  summaryItems: {
    label: string;
    value: string | number;
  }[];
}

export default function DebugInfo({ data, summaryItems }: DebugInfoProps) {
  const [isDebugExpanded, setIsDebugExpanded] = useState(false);

  const formatJSON = (data: any) => {
    const jsonString = JSON.stringify(data, null, 2);
    return jsonString.replace(
      /(".*?":|{|}|\[|\]|,|true|false|null|\d+)/g,
      (match) => {
        if (match.startsWith('"') && match.endsWith(':')) {
          // Property names in CNB orange
          return `<span class="text-[#FB8A13] dark:text-[#FB8A13]">${match}</span>`;
        } else if (match.startsWith('"')) {
          // String values in indigo
          return `<span class="text-indigo-600 dark:text-indigo-400">${match}</span>`;
        } else if (match === 'true' || match === 'false') {
          // Booleans in CNB orange (lighter shade)
          return `<span class="text-[#e07911] dark:text-[#ffa53d]">${match}</span>`;
        } else if (match === 'null') {
          // Null in gray
          return `<span class="text-gray-500 dark:text-gray-400">${match}</span>`;
        } else if (!isNaN(Number(match))) {
          // Numbers in CNB orange
          return `<span class="text-[#FB8A13] dark:text-[#FB8A13]">${match}</span>`;
        } else if (match === '{' || match === '}' || match === '[' || match === ']' || match === ',') {
          // Brackets and commas in gray
          return `<span class="text-gray-600 dark:text-gray-300">${match}</span>`;
        }
        return match;
      }
    );
  };

  return (
    <div className="mb-4">
      <div className="w-full bg-white dark:bg-gray-800 rounded-lg text-xs border border-gray-200 dark:border-gray-700 shadow-sm">
        <button
          onClick={() => setIsDebugExpanded(!isDebugExpanded)}
          className="w-full p-3 hover:bg-gray-500 dark:hover:bg-gray-750 rounded-t-lg transition-colors text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="font-medium text-gray-900 dark:text-white">Development Mode</h3>
              </div>
              <div className="flex gap-4 text-gray-600 dark:text-gray-300">
                {summaryItems.map((item, index) => (
                  <div key={item.label} className="flex items-center">
                    <span className="font-medium">
                      {item.label}: <span className="text-[#FB8A13] dark:text-[#FB8A13]">{item.value}</span>
                    </span>
                    {index < summaryItems.length - 1 && (
                      <span className="text-gray-300 dark:text-gray-600 mx-4">•</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              {isDebugExpanded ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
            </div>
          </div>
        </button>
        {isDebugExpanded && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="p-3 bg-gray-200 dark:bg-gray-900 rounded-b-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Debug Data</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                    toast.success('Debug data copied to clipboard');
                  }}
                  className="text-xs px-2 py-1 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Copy JSON
                </button>
              </div>
              <pre 
                className="overflow-auto p-3 rounded-md font-mono text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 shadow-inner cursor-text select-text"
                dangerouslySetInnerHTML={{ __html: formatJSON(data) }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 