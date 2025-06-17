# Chrome History API 使用示例

本文档提供 Chrome History API 的实际使用示例和最佳实践。

## 基础操作示例

### 1. 添加历史记录

```typescript
// 添加单个历史记录
const response = await fetch('/api/history', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwt_token}`
  },
  body: JSON.stringify({
    url: 'https://example.com/page',
    title: '示例页面',
    lastVisitTime: Date.now(),
    visitCount: 1,
    typedCount: 0
  })
});

const result = await response.json();
console.log('添加成功:', result.data.id);
```

### 2. 批量导入历史记录

```typescript
// 从 Chrome 扩展导入历史记录
const importHistoryFromChrome = async (chromeHistoryItems) => {
  const batchSize = 100; // 每批处理100条
  
  for (let i = 0; i < chromeHistoryItems.length; i += batchSize) {
    const batch = chromeHistoryItems.slice(i, i + batchSize);
    
    const response = await fetch('/api/history/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt_token}`
      },
      body: JSON.stringify({
        items: batch.map(item => ({
          url: item.url,
          title: item.title || 'Untitled',
          lastVisitTime: item.lastVisitTime || Date.now(),
          visitCount: item.visitCount || 1,
          typedCount: item.typedCount || 0
        }))
      })
    });
    
    const result = await response.json();
    console.log(`批次 ${Math.floor(i/batchSize) + 1} 导入完成:`, result.data);
  }
};
```

### 3. 分页查询历史记录

```typescript
// 获取最近的历史记录（分页）
const getRecentHistory = async (page = 0, limit = 50) => {
  const offset = page * limit;
  
  const response = await fetch(
    `/api/history?maxResults=${limit}&offset=${offset}&order=desc`, {
    headers: {
      'Authorization': `Bearer ${jwt_token}`
    }
  });
  
  const result = await response.json();
  
  return {
    items: result.data,
    pagination: result.pagination,
    hasMore: result.pagination.hasMore
  };
};

// 使用示例
const { items, pagination, hasMore } = await getRecentHistory(0, 20);
console.log(`显示 ${items.length} 条记录，共 ${pagination.total} 条`);
```

### 4. 按时间范围查询

```typescript
// 获取今天的历史记录
const getTodayHistory = async () => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
  
  const response = await fetch(
    `/api/history?startTime=${startOfDay.getTime()}&endTime=${endOfDay.getTime()}`, {
    headers: {
      'Authorization': `Bearer ${jwt_token}`
    }
  });
  
  return await response.json();
};

// 获取最近7天的历史记录
const getWeekHistory = async () => {
  const endTime = Date.now();
  const startTime = endTime - (7 * 24 * 60 * 60 * 1000);
  
  const response = await fetch(
    `/api/history?startTime=${startTime}&endTime=${endTime}`, {
    headers: {
      'Authorization': `Bearer ${jwt_token}`
    }
  });
  
  return await response.json();
};
```

## 搜索功能示例

### 5. 全文搜索

```typescript
// 搜索历史记录
const searchHistory = async (keyword, options = {}) => {
  const searchParams = {
    query: keyword,
    maxResults: options.limit || 20,
    searchFields: options.fields || ['title', 'url'],
    ...options
  };
  
  const response = await fetch('/api/history/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt_token}`
    },
    body: JSON.stringify(searchParams)
  });
  
  const result = await response.json();
  
  return {
    results: result.data.results,
    total: result.data.total,
    searchTime: result.data.searchTime
  };
};

// 使用示例
const { results, total, searchTime } = await searchHistory('JavaScript', {
  limit: 10,
  fields: ['title'],
  startTime: Date.now() - (30 * 24 * 60 * 60 * 1000) // 最近30天
});

console.log(`找到 ${total} 条结果，耗时 ${searchTime}ms`);
```

### 6. 高级搜索

```typescript
// 按域名搜索
const searchByDomain = async (domain) => {
  return await searchHistory('', {
    fields: ['url'],
    query: domain
  });
};

// 搜索特定时间段的内容
const searchInTimeRange = async (keyword, days = 7) => {
  const endTime = Date.now();
  const startTime = endTime - (days * 24 * 60 * 60 * 1000);
  
  return await searchHistory(keyword, {
    startTime,
    endTime,
    limit: 50
  });
};
```

## 统计分析示例

### 7. 获取访问统计

```typescript
// 获取本周统计
const getWeeklyStats = async () => {
  const response = await fetch('/api/history/stats?period=week', {
    headers: {
      'Authorization': `Bearer ${jwt_token}`
    }
  });
  
  const result = await response.json();
  return result.data;
};

// 获取自定义时间范围统计
const getCustomStats = async (startDate, endDate) => {
  const startTime = new Date(startDate).getTime();
  const endTime = new Date(endDate).getTime();
  
  const response = await fetch(
    `/api/history/stats?startTime=${startTime}&endTime=${endTime}`, {
    headers: {
      'Authorization': `Bearer ${jwt_token}`
    }
  });
  
  return await response.json();
};

// 使用示例
const stats = await getWeeklyStats();
console.log(`总访问次数: ${stats.totalVisits}`);
console.log(`唯一页面: ${stats.uniqueUrls}`);
console.log(`热门域名:`, stats.topDomains.slice(0, 5));
```

### 8. 生成访问报告

```typescript
// 生成详细的访问报告
const generateVisitReport = async (period = 'month') => {
  const stats = await fetch(`/api/history/stats?period=${period}`, {
    headers: { 'Authorization': `Bearer ${jwt_token}` }
  }).then(res => res.json());
  
  const report = {
    period,
    summary: {
      totalVisits: stats.data.totalVisits,
      uniqueUrls: stats.data.uniqueUrls,
      avgVisitsPerDay: stats.data.totalVisits / stats.data.dailyStats.length
    },
    topDomains: stats.data.topDomains.slice(0, 10),
    dailyTrend: stats.data.dailyStats,
    insights: {
      mostActiveDay: stats.data.dailyStats.reduce((max, day) => 
        day.visits > max.visits ? day : max
      ),
      leastActiveDay: stats.data.dailyStats.reduce((min, day) => 
        day.visits < min.visits ? day : min
      )
    }
  };
  
  return report;
};
```

## 数据管理示例

### 9. 清理旧数据

```typescript
// 删除30天前的历史记录
const cleanOldHistory = async (daysToKeep = 30) => {
  const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
  
  const response = await fetch('/api/history/clear', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt_token}`
    },
    body: JSON.stringify({
      confirm: true,
      endTime: cutoffTime
    })
  });
  
  const result = await response.json();
  console.log(`清理了 ${result.data.affected} 条旧记录`);
};

// 按URL模式批量删除
const deleteByPattern = async (urlPattern) => {
  const response = await fetch('/api/history/batch', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt_token}`
    },
    body: JSON.stringify({
      urlPattern
    })
  });
  
  return await response.json();
};

// 使用示例：删除所有广告页面
await deleteByPattern('ads.google.com');
```

### 10. 数据导出

```typescript
// 导出所有历史记录
const exportAllHistory = async () => {
  const allData = [];
  let offset = 0;
  const limit = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const response = await fetch(
      `/api/history?maxResults=${limit}&offset=${offset}&order=desc`, {
      headers: { 'Authorization': `Bearer ${jwt_token}` }
    });
    
    const result = await response.json();
    allData.push(...result.data);
    
    hasMore = result.pagination.hasMore;
    offset += limit;
    
    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return allData;
};

// 导出为 CSV 格式
const exportToCSV = async () => {
  const data = await exportAllHistory();
  
  const csvHeaders = ['URL', 'Title', 'Last Visit Time', 'Visit Count', 'Typed Count'];
  const csvRows = data.map(item => [
    item.url,
    item.title.replace(/"/g, '""'), // 转义双引号
    new Date(item.lastVisitTime).toISOString(),
    item.visitCount,
    item.typedCount
  ]);
  
  const csvContent = [
    csvHeaders.join(','),
    ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
  ].join('\n');
  
  return csvContent;
};
```

## 性能优化最佳实践

### 11. 批量操作优化

```typescript
// 优化的批量更新
const optimizedBatchUpdate = async (updates) => {
  const BATCH_SIZE = 50; // 调整批次大小以平衡性能和内存
  const DELAY_MS = 200;   // 批次间延迟，避免过载
  
  const results = [];
  
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);
    
    try {
      const promises = batch.map(update => 
        fetch(`/api/history/${update.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt_token}`
          },
          body: JSON.stringify(update.data)
        }).then(res => res.json())
      );
      
      const batchResults = await Promise.allSettled(promises);
      results.push(...batchResults);
      
      // 批次间延迟
      if (i + BATCH_SIZE < updates.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
      
    } catch (error) {
      console.error(`批次 ${Math.floor(i/BATCH_SIZE)} 处理失败:`, error);
    }
  }
  
  return results;
};
```

### 12. 智能缓存策略

```typescript
// 客户端缓存管理
class HistoryCache {
  constructor(maxSize = 1000, ttl = 5 * 60 * 1000) { // 5分钟TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  set(key, data) {
    // LRU 清理
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  clear() {
    this.cache.clear();
  }
}

// 使用缓存的历史记录查询
const historyCache = new HistoryCache();

const getCachedHistory = async (params) => {
  const cacheKey = JSON.stringify(params);
  let result = historyCache.get(cacheKey);
  
  if (!result) {
    const response = await fetch(`/api/history?${new URLSearchParams(params)}`, {
      headers: { 'Authorization': `Bearer ${jwt_token}` }
    });
    result = await response.json();
    historyCache.set(cacheKey, result);
  }
  
  return result;
};
```

## 错误处理示例

### 13. 健壮的错误处理

```typescript
// 带重试的API调用
const apiCallWithRetry = async (url, options, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.warn(`API调用失败 (尝试 ${attempt}/${maxRetries}):`, error.message);
      
      if (attempt === maxRetries) {
        throw new Error(`API调用最终失败: ${error.message}`);
      }
      
      // 指数退避
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// 使用示例
try {
  const result = await apiCallWithRetry('/api/history', {
    headers: { 'Authorization': `Bearer ${jwt_token}` }
  });
  console.log('获取成功:', result);
} catch (error) {
  console.error('获取历史记录失败:', error.message);
  // 显示用户友好的错误信息
}
```

这些示例涵盖了 Chrome History API 的主要使用场景，包括数据的增删改查、搜索、统计分析和性能优化。在实际使用中，请根据具体需求调整参数和错误处理策略。
