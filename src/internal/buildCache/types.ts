export type CacheRecord = Record<string, { modificationTime: number }> & { compilerSettings?: Record<string, any> };
