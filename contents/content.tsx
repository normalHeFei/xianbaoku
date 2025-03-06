import type { PlasmoCSConfig } from "plasmo"

import { sendToBackground } from "@plasmohq/messaging"
import { Storage } from "@plasmohq/storage"

export const config: PlasmoCSConfig = {
  matches: ["https://new.xianbao.fun/search.php*"],
  run_at: "document_idle"
}

const listItemSelector = "#mainbox > div.listbox > ul > li"

function addCheckboxAndButtons() {
  console.log("开始执行 addCheckboxAndButtons 函数")

  const listItems = document.querySelectorAll(listItemSelector)
  if (listItems.length === 0) {
    console.warn(`未找到列表项元素，请检查选择器: ${listItemSelector}`)
    return
  }

  console.log(`找到 ${listItems.length} 个列表项`)

  listItems.forEach((item, index) => {
    const checkbox = document.createElement("input")
    checkbox.type = "checkbox"
    checkbox.className = "item-checkbox"
    checkbox.id = `item-checkbox-${index}`

    // 直接设置行内样式
    checkbox.style.marginRight = "10px"
    checkbox.style.verticalAlign = "middle"

    item.style.display = "flex"
    item.style.alignItems = "center"

    item.insertBefore(checkbox, item.firstChild)
  })

  // 创建按钮容器
  const buttonContainer = document.createElement("div")

  // 设置内联样式定位到右上角
  buttonContainer.style.position = "fixed"
  buttonContainer.style.top = "10px"
  buttonContainer.style.right = "10px"
  buttonContainer.style.zIndex = "9999" // 确保在最上层
  buttonContainer.style.display = "flex"
  buttonContainer.style.gap = "10px" // 按钮之间的间距

  // 创建 "生成（小红书）" 按钮
  const xiaohongshuButton = document.createElement("button")
  xiaohongshuButton.textContent = "生成（小红书）"
  xiaohongshuButton.style.padding = "5px 10px"
  xiaohongshuButton.style.backgroundColor = "#f0f0f0"
  xiaohongshuButton.style.border = "1px solid #ddd"
  xiaohongshuButton.style.borderRadius = "4px"
  xiaohongshuButton.style.cursor = "pointer"
  xiaohongshuButton.onclick = () => {
    console.log("生成（小红书）按钮点击")
    const selectedUrls = getSelectedItemUrls()
    if (selectedUrls.length === 0) {
      alert("请先选择至少一个帖子")
      return
    }
    openNewTab("xiaohongshu", selectedUrls)
  }

  // 创建 "生成（公众号）" 按钮
  const gongzhonghaoButton = document.createElement("button")
  gongzhonghaoButton.textContent = "生成（公众号）"
  gongzhonghaoButton.style.padding = "5px 10px"
  gongzhonghaoButton.style.backgroundColor = "#f0f0f0"
  gongzhonghaoButton.style.border = "1px solid #ddd"
  gongzhonghaoButton.style.borderRadius = "4px"
  gongzhonghaoButton.style.cursor = "pointer"
  gongzhonghaoButton.onclick = () => {
    console.log("生成（公众号）按钮点击")
    const selectedUrls = getSelectedItemUrls()
    if (selectedUrls.length === 0) {
      alert("请先选择至少一个帖子")
      return
    }
    openNewTab("gongzhonghao", selectedUrls)
  }

  // 将按钮添加到容器
  buttonContainer.appendChild(xiaohongshuButton)
  buttonContainer.appendChild(gongzhonghaoButton)

  // 将按钮容器添加到页面
  document.body.appendChild(buttonContainer)
}

// 获取选中项的URL
function getSelectedItemUrls() {
  const selectedUrls = []
  const checkboxes = document.querySelectorAll(".item-checkbox:checked")

  checkboxes.forEach((checkbox) => {
    const listItem = checkbox.closest(listItemSelector)
    if (listItem) {
      const linkElement = listItem.querySelector("a")
      if (linkElement && linkElement.href) {
        selectedUrls.push(
          linkElement.href.substring(0, linkElement.href.indexOf("?"))
        )
      }
    }
  })

  return selectedUrls
}

// 初始化存储
const storage = new Storage()

// 打开新标签页的函数
function openNewTab(type, urls) {
  console.log("Preparing to open new tab:", type, urls)

  // 使用存储API传递数据
  storage
    .set("newTabRequest", {
      type,
      urls,
      timestamp: Date.now() // 添加时间戳以确保每次请求都是唯一的
    })
    .then(() => {
      console.log("Tab request stored successfully")
    })
    .catch((error) => {
      console.error("Error storing tab request:", error)
    })
}


addCheckboxAndButtons()
