import { Storage } from "@plasmohq/storage"

// 初始化存储
const storage = new Storage()

// 监听存储变化
storage.watch({
  "newTabRequest": async (change) => {
    if (!change.newValue) return
    
    const { type, urls } = change.newValue
    console.log("New tab request received:", type, urls)
    
    // 构建URL和查询参数
    const queryParams = new URLSearchParams()
    queryParams.set("type", type)
    queryParams.set("urls", JSON.stringify(urls))
    
    const newTabUrl = `tabs/formatter.html?${queryParams.toString()}`
    
    try {
      // 创建新标签页
      const tab = await chrome.tabs.create({
        url: chrome.runtime.getURL(newTabUrl)
      })
      
      console.log("New tab created:", tab.id)
      
      // 可选：清除请求数据以防止重复处理
      await storage.remove("newTabRequest")
    } catch (error) {
      console.error("Error creating new tab:", error)
    }
  }
})

// 其他背景脚本逻辑可以放在这里
console.log("Background script initialized")