// native 版本：数据库由 expo-sqlite 管理，App 启动即就绪
export function useDatabase() {
  return {
    ready: true,
    progress: 100,
    status: 'ready' as 'checking' | 'downloading' | 'extracting' | 'ready' | 'error',
    loadedMB: 0,
    totalMB: 0,
    error: '',
  };
}
