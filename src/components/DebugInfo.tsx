import { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface DebugData {
  [key: string]: any;
}

interface ApiCall {
  url: string;
  method: string;
  status: number;
  duration: number;
  timestamp: string;
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
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    memory: number;
    loadTime: number;
    timestamp: string;
    fcp: number; // First Contentful Paint
    lcp: number; // Largest Contentful Paint
    cls: number; // Cumulative Layout Shift
  }>({
    memory: 0,
    loadTime: 0,
    timestamp: new Date().toISOString(),
    fcp: 0,
    lcp: 0,
    cls: 0,
  });

  const [apiCalls, setApiCalls] = useState<ApiCall[]>([]);
  const [expandedApiCalls, setExpandedApiCalls] = useState<boolean[]>([]);
  const [networkInfo, setNetworkInfo] = useState({
    downlink: 0,
    effectiveType: '',
    rtt: 0,
    saveData: false,
  });

  useEffect(() => {
    // Collect performance metrics
    const navigation = window.performance?.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const memory = (performance as any)?.memory?.usedJSHeapSize;
    
    // Get Web Vitals using PerformanceObserver
    let fcpObserver: PerformanceObserver;
    let lcpObserver: PerformanceObserver;
    let clsObserver: PerformanceObserver;

    // FCP Observer
    try {
      fcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          setPerformanceMetrics(prev => ({
            ...prev,
            fcp: Math.round(entries[0].startTime),
          }));
        }
      });
      fcpObserver.observe({ type: 'paint', buffered: true });
    } catch (e) {
      console.warn('FCP measurement not supported', e);
    }

    // LCP Observer
    try {
      lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        setPerformanceMetrics(prev => ({
          ...prev,
          lcp: Math.round(lastEntry.startTime),
        }));
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      console.warn('LCP measurement not supported', e);
    }

    // CLS Observer
    try {
      let clsValue = 0;
      let clsEntries: PerformanceEntry[] = [];

      clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries() as PerformanceEntry[];
        
        entries.forEach(entry => {
          // Only count layout shifts without recent user input
          if (!(entry as any).hadRecentInput) {
            const firstSessionEntry = clsEntries.length === 0;
            const timestampDelta = entry.startTime - (clsEntries[clsEntries.length - 1]?.startTime ?? 0);
            
            // If it's the first entry or the gap between this entry and the last entry is less than 1 second,
            // include this entry in the current session
            if (firstSessionEntry || timestampDelta < 1000) {
              clsEntries.push(entry);
              clsValue += (entry as any).value;
            } else {
              // Start a new session
              clsEntries = [entry];
              clsValue = (entry as any).value;
            }
          }
        });

        setPerformanceMetrics(prev => ({
          ...prev,
          cls: Math.round(clsValue * 1000) / 1000,
        }));
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      console.warn('CLS measurement not supported', e);
    }
    
    setPerformanceMetrics(prev => ({
      ...prev,
      memory: memory ? Math.round(memory / (1024 * 1024)) : 0,
      loadTime: navigation ? Math.round(navigation.loadEventEnd - navigation.startTime) : 0,
      timestamp: new Date().toISOString(),
    }));

    // Track API calls
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;
        const newCall: ApiCall = {
          url: typeof args[0] === 'string' 
            ? args[0] 
            : args[0] instanceof URL 
              ? args[0].href
              : (args[0] as Request).url,
          method: args[1]?.method || 'GET',
          status: response.status,
          duration: Math.round(duration),
          timestamp: new Date().toISOString(),
        };
        setApiCalls(prev => [newCall, ...prev].slice(0, 10)); // Keep last 10 calls
        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        const newCall: ApiCall = {
          url: typeof args[0] === 'string' 
            ? args[0] 
            : args[0] instanceof URL 
              ? args[0].href
              : (args[0] as Request).url,
          method: args[1]?.method || 'GET',
          status: 0,
          duration: Math.round(duration),
          timestamp: new Date().toISOString(),
        };
        setApiCalls(prev => [newCall, ...prev].slice(0, 10));
        throw error;
      }
    };

    // Get network information
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setNetworkInfo({
        downlink: connection.downlink,
        effectiveType: connection.effectiveType,
        rtt: connection.rtt,
        saveData: connection.saveData,
      });

      connection.addEventListener('change', () => {
        setNetworkInfo({
          downlink: connection.downlink,
          effectiveType: connection.effectiveType,
          rtt: connection.rtt,
          saveData: connection.saveData,
        });
      });
    }

    // Cleanup observers
    return () => {
      try {
        fcpObserver?.disconnect();
        lcpObserver?.disconnect();
        clsObserver?.disconnect();
      } catch (e) {
        console.warn('Error disconnecting performance observers', e);
      }
    };
  }, []);

  // Update expanded states array when apiCalls change
  useEffect(() => {
    setExpandedApiCalls(new Array(apiCalls.length).fill(false));
  }, [apiCalls.length]);

  const systemInfo = {
    environment: process.env.NODE_ENV,
    nextRuntime: process.env.NEXT_RUNTIME,
    darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    userAgent: window.navigator.userAgent,
    language: window.navigator.language,
    online: window.navigator.onLine,
    performance: performanceMetrics,
    network: networkInfo,
  };

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

  const enhancedDebugData = {
    ...data,
    _system: systemInfo,
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
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {item.label}: <span className="text-[#FB8A13] dark:text-[#ffa53d]">{item.value}</span>
                    </span>
                    {index < summaryItems.length - 1 && (
                      <span className="text-gray-300 dark:text-gray-600 mx-4">•</span>
                    )}
                  </div>
                ))}
                <div className="flex items-center">
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    Load Time: <span className="text-[#FB8A13] dark:text-[#ffa53d]">{performanceMetrics.loadTime}ms</span>
                  </span>
                  <span className="text-gray-300 dark:text-gray-600 mx-4">•</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    Memory: <span className="text-[#FB8A13] dark:text-[#ffa53d]">{performanceMetrics.memory}MB</span>
                  </span>
                </div>
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
              <div className="flex flex-col gap-4">
                {/* Performance Metrics Section */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Performance Metrics</span>
                      <div className="group relative">
                        <div className="w-4 h-4 rounded-full bg-gray-400 text-white flex items-center justify-center text-xs cursor-help">?</div>
                        <div className="hidden group-hover:block absolute left-full ml-2 p-2 bg-gray-900 text-white text-xs rounded shadow-lg w-80 z-50">
                          Core Web Vitals and performance metrics that affect user experience:
                          <ul className="mt-1 list-disc list-inside">
                            <li>FCP: Time until first content appears</li>
                            <li>LCP: Time until largest content appears</li>
                            <li>CLS: Measures layout stability (lower is better)</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-md p-3 text-xs">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="group relative">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600 dark:text-gray-300">First Paint (FCP): </span>
                          <span className={`text-[#FB8A13] dark:text-[#ffa53d] ${performanceMetrics.fcp > 2000 ? 'text-red-500 dark:text-red-400' : ''}`}>
                            {performanceMetrics.fcp}ms
                          </span>
                        </div>
                        <div className="hidden group-hover:block absolute top-full mt-1 left-0 p-2 bg-gray-900 text-white text-xs rounded shadow-lg w-64 z-50">
                          Time until the first content appears on screen. {'Good: <1s, Needs Improvement: 1-2s, Poor: >2s'}
                        </div>
                      </div>
                      <div className="group relative">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600 dark:text-gray-300">Largest Paint (LCP): </span>
                          <span className={`text-[#FB8A13] dark:text-[#ffa53d] ${performanceMetrics.lcp > 2500 ? 'text-red-500 dark:text-red-400' : ''}`}>
                            {performanceMetrics.lcp}ms
                          </span>
                        </div>
                        <div className="hidden group-hover:block absolute top-full mt-1 left-0 p-2 bg-gray-900 text-white text-xs rounded shadow-lg w-64 z-50">
                          Time until the largest content appears. {'Good: <2.5s, Needs Improvement: 2.5-4s, Poor: >4s'}
                        </div>
                      </div>
                      <div className="group relative">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600 dark:text-gray-300">Layout Shift (CLS): </span>
                          <span className={`text-[#FB8A13] dark:text-[#ffa53d] ${performanceMetrics.cls > 0.1 ? 'text-red-500 dark:text-red-400' : ''}`}>
                            {performanceMetrics.cls}
                          </span>
                        </div>
                        <div className="hidden group-hover:block absolute top-full mt-1 left-0 p-2 bg-gray-900 text-white text-xs rounded shadow-lg w-64 z-50">
                          Measures visual stability. {'Good: <0.1, Needs Improvement: 0.1-0.25, Poor: >0.25'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Network Info Section */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Network Information</span>
                      <div className="group relative">
                        <div className="w-4 h-4 rounded-full bg-gray-400 text-white flex items-center justify-center text-xs cursor-help">?</div>
                        <div className="hidden group-hover:block absolute left-full ml-2 p-2 bg-gray-900 text-white text-xs rounded shadow-lg w-80 z-50">
                          Current network conditions and capabilities:
                          <ul className="mt-1 list-disc list-inside">
                            <li>Connection: Network type (4G, WiFi, etc.)</li>
                            <li>Downlink: Download speed in Mbps</li>
                            <li>RTT: Round-trip time (lower is better)</li>
                            <li>Save Data: Whether data saver is enabled</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-md p-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="group relative">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600 dark:text-gray-300">Connection Type: </span>
                          <span className="text-[#FB8A13] dark:text-[#ffa53d]">
                            {networkInfo.effectiveType.toUpperCase() || 'Unknown'}
                          </span>
                        </div>
                        <div className="hidden group-hover:block absolute top-full mt-1 left-0 p-2 bg-gray-900 text-white text-xs rounded shadow-lg w-64 z-50">
                          Effective connection type (4G, 3G, etc.). May differ from actual network type based on performance.
                        </div>
                      </div>
                      <div className="group relative">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600 dark:text-gray-300">Download Speed: </span>
                          <span className="text-[#FB8A13] dark:text-[#ffa53d]">{networkInfo.downlink} Mbps</span>
                        </div>
                        <div className="hidden group-hover:block absolute top-full mt-1 left-0 p-2 bg-gray-900 text-white text-xs rounded shadow-lg w-64 z-50">
                          Estimated download speed in Megabits per second (Mbps). Higher is better.
                        </div>
                      </div>
                      <div className="group relative">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600 dark:text-gray-300">Response Time: </span>
                          <span className={`text-[#FB8A13] dark:text-[#ffa53d] ${networkInfo.rtt > 100 ? 'text-yellow-500 dark:text-yellow-400' : ''}`}>
                            {networkInfo.rtt}ms
                          </span>
                        </div>
                        <div className="hidden group-hover:block absolute top-full mt-1 left-0 p-2 bg-gray-900 text-white text-xs rounded shadow-lg w-64 z-50">
                          Round-Trip Time - Time for data to reach server and return. Lower is better. {'Good: <50ms, OK: 50-100ms, Poor: >100ms'}
                        </div>
                      </div>
                      <div className="group relative">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600 dark:text-gray-300">Data Saver: </span>
                          <span className="text-[#FB8A13] dark:text-[#ffa53d]">{networkInfo.saveData ? 'Enabled' : 'Disabled'}</span>
                        </div>
                        <div className="hidden group-hover:block absolute top-full mt-1 left-0 p-2 bg-gray-900 text-white text-xs rounded shadow-lg w-64 z-50">
                          Indicates if the user has enabled data-saving mode in their browser or device.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent API Calls Section */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent API Calls</span>
                      <div className="group relative">
                        <div className="w-4 h-4 rounded-full bg-gray-400 text-white flex items-center justify-center text-xs cursor-help">
                          ?
                        </div>
                        <div className="hidden group-hover:block absolute left-full ml-2 p-2 bg-gray-900 text-white text-xs rounded shadow-lg w-64 z-50">
                          Shows the last 10 API calls. Green status indicates success (200-299), red indicates errors.
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setApiCalls([]);
                        setExpandedApiCalls([]);
                      }}
                      className="text-xs px-2 py-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-md p-3 text-xs">
                    <div className="space-y-2">
                      {apiCalls.map((call, index) => (
                        <div 
                          key={index} 
                          className="border border-gray-200/50 dark:border-gray-700/50 rounded-lg overflow-hidden backdrop-blur-sm transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600"
                        >
                          <div 
                            onClick={() => {
                              const newExpandedStates = [...expandedApiCalls];
                              newExpandedStates[index] = !newExpandedStates[index];
                              setExpandedApiCalls(newExpandedStates);
                            }}
                            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors duration-200"
                          >
                            <div className="flex items-center gap-3">
                              <span 
                                className={`px-2.5 py-1 rounded-full text-xs font-medium tracking-wide ${
                                  call.status >= 200 && call.status < 300 
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
                                }`}
                                title="HTTP Method"
                              >
                                {call.method}
                              </span>
                              <span 
                                className="text-gray-700 dark:text-gray-200 truncate max-w-[300px] font-medium"
                                title={call.url}
                              >
                                {call.url}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span 
                                className={`px-2.5 py-1 rounded-full text-xs font-medium tracking-wide ${
                                  call.status >= 200 && call.status < 300
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
                                }`}
                                title="HTTP Status Code"
                              >
                                {call.status || 'Error'}
                              </span>
                              <span 
                                className="text-[#FB8A13] dark:text-[#ffa53d] min-w-[60px] text-right font-medium"
                                title="Request Duration"
                              >
                                {call.duration}ms
                              </span>
                              <ChevronDownIcon 
                                className={`h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
                                  expandedApiCalls[index] ? 'transform rotate-180' : ''
                                }`}
                              />
                            </div>
                          </div>
                          {expandedApiCalls[index] && (
                            <div className="border-t border-gray-200/50 dark:border-gray-700/50 p-4 space-y-4 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-gray-100 mb-3 text-sm">Details</div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <span className="text-gray-500 dark:text-gray-400 text-xs block">Timestamp</span>
                                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                                      {new Date(call.timestamp).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-gray-500 dark:text-gray-400 text-xs block">Duration</span>
                                    <span className="text-[#FB8A13] dark:text-[#ffa53d] font-medium">
                                      {call.duration}ms
                                    </span>
                                  </div>
                                  <div className="col-span-2 space-y-1">
                                    <span className="text-gray-500 dark:text-gray-400 text-xs block">URL</span>
                                    <span className="text-gray-900 dark:text-gray-100 break-all font-medium">
                                      {call.url}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(JSON.stringify(call, null, 2));
                                    toast.success('API call details copied to clipboard');
                                  }}
                                  className="text-xs px-3 py-1.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 font-medium shadow-sm"
                                >
                                  Copy Details
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {apiCalls.length === 0 && (
                        <div className="text-gray-500 dark:text-gray-400 text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm">
                          No API calls recorded yet
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* System Info Section */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">System Information</span>
                      <div className="group relative">
                        <div className="w-4 h-4 rounded-full bg-gray-400 text-white flex items-center justify-center text-xs cursor-help">?</div>
                        <div className="hidden group-hover:block absolute left-full ml-2 p-2 bg-gray-900 text-white text-xs rounded shadow-lg w-80 z-50">
                          System and environment details:
                          <ul className="mt-1 list-disc list-inside">
                            <li>Environment: Current running mode</li>
                            <li>Runtime: Server/client execution context</li>
                            <li>Theme & Display settings</li>
                            <li>Browser and system information</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-md p-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="group relative">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600 dark:text-gray-300">Environment: </span>
                          <span className="text-[#FB8A13] dark:text-[#ffa53d] capitalize">{systemInfo.environment}</span>
                        </div>
                        <div className="hidden group-hover:block absolute top-full mt-1 left-0 p-2 bg-gray-900 text-white text-xs rounded shadow-lg w-64 z-50">
                          Current running environment (development/production/test)
                        </div>
                      </div>
                      <div className="group relative">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600 dark:text-gray-300">Runtime: </span>
                          <span className="text-[#FB8A13] dark:text-[#ffa53d]">{systemInfo.nextRuntime || 'Client-side'}</span>
                        </div>
                        <div className="hidden group-hover:block absolute top-full mt-1 left-0 p-2 bg-gray-900 text-white text-xs rounded shadow-lg w-64 z-50">
                          Where the code is executing (server-side or client-side)
                        </div>
                      </div>
                      <div className="group relative">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600 dark:text-gray-300">Screen Size: </span>
                          <span className="text-[#FB8A13] dark:text-[#ffa53d]">
                            {systemInfo.viewport.width}×{systemInfo.viewport.height}
                          </span>
                        </div>
                        <div className="hidden group-hover:block absolute top-full mt-1 left-0 p-2 bg-gray-900 text-white text-xs rounded shadow-lg w-64 z-50">
                          Current viewport dimensions in pixels (width × height)
                        </div>
                      </div>
                      <div className="group relative">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600 dark:text-gray-300">Theme: </span>
                          <span className="text-[#FB8A13] dark:text-[#ffa53d]">{systemInfo.darkMode ? 'Dark' : 'Light'}</span>
                        </div>
                        <div className="hidden group-hover:block absolute top-full mt-1 left-0 p-2 bg-gray-900 text-white text-xs rounded shadow-lg w-64 z-50">
                          Current color theme based on system preferences
                        </div>
                      </div>
                      <div className="group relative">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600 dark:text-gray-300">Connection: </span>
                          <span className={`text-[#FB8A13] dark:text-[#ffa53d] ${!systemInfo.online ? 'text-red-500 dark:text-red-400' : ''}`}>
                            {systemInfo.online ? 'Online' : 'Offline'}
                          </span>
                        </div>
                        <div className="hidden group-hover:block absolute top-full mt-1 left-0 p-2 bg-gray-900 text-white text-xs rounded shadow-lg w-64 z-50">
                          Current internet connectivity status
                        </div>
                      </div>
                      <div className="group relative">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600 dark:text-gray-300">Language: </span>
                          <span className="text-[#FB8A13] dark:text-[#ffa53d]">{systemInfo.language}</span>
                        </div>
                        <div className="hidden group-hover:block absolute top-full mt-1 left-0 p-2 bg-gray-900 text-white text-xs rounded shadow-lg w-64 z-50">
                          Browser's configured language
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Debug Data Section */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Debug Data</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(enhancedDebugData, null, 2));
                        toast.success('Debug data copied to clipboard');
                      }}
                      className="text-xs px-2 py-1 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Copy JSON
                    </button>
                  </div>
                  <pre 
                    className="overflow-auto p-3 rounded-md font-mono text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 shadow-inner cursor-text select-text"
                    dangerouslySetInnerHTML={{ __html: formatJSON(enhancedDebugData) }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 