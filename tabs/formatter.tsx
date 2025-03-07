import React, { useEffect, useState } from "react"
import { render } from "react-dom"

import "../style.css"

// 帖子详情接口
interface PostDetail {
  title: string
  content: string
  imageUrls: string[]
}

// 小红书格式化组件
const XiaoHongShuFormatter = ({ posts }: { posts: PostDetail[] }) => {
  const [isLoading, setIsLoading] = useState(false)

  // 处理文本内容（移除URL）
  const cleanedContent = posts
    .map((post, index) => {
      // 移除URL
      const cleanedText =
        `${index + 1}: ${post.title}\n\n ${post.content.replace(/https?:\/\/\S+/g, "")}`.trim()
      return cleanedText
    })
    .join("\n\n")

  // 获取所有图片URL
  const allImageUrls = posts.flatMap((post, index) => {
    return post.imageUrls.map((url) => ({
      url,
      postTitle: post.title.substring(0, 5) || `post-${index + 1}`
    }))
  })

  // 复制文本内容
  const copyContent = () => {
    navigator.clipboard
      .writeText(cleanedContent)
      .then(() => alert("内容已复制到剪贴板"))
      .catch((err) => console.error("复制失败:", err))
  }

  // 下载所有图片
  const downloadAllImages = () => {
    if (allImageUrls.length === 0) {
      alert("没有可下载的图片")
      return
    }

    setIsLoading(true)

    // 使用Promise.all来并行下载所有图片
    Promise.all(
      allImageUrls.map((item, index) =>
        downloadImage(item.url, `${item.postTitle}-${index + 1}`)
      )
    )
      .then(() => {
        setIsLoading(false)
        alert("所有图片下载完成")
      })
      .catch((error) => {
        setIsLoading(false)
        console.error("下载图片出错:", error)
        alert("下载图片时出错，请查看控制台")
      })
  }

  // 下载单个图片
  const downloadImage = (url: string, filename: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      fetch(url)
        .then((response) => response.blob())
        .then((blob) => {
          const objectUrl = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = objectUrl
          a.download = `${filename}.jpg`
          document.body.appendChild(a)
          a.click()
          a.remove()
          URL.revokeObjectURL(objectUrl)
          resolve()
        })
        .catch(reject)
    })
  }

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* 左侧内容展示区 */}
      <div className="w-full md:w-1/2 p-4 flex flex-col">
        <h2 className="text-xl font-bold mb-4">帖子内容</h2>
        <div className="flex-grow overflow-auto bg-gray-50 p-4 rounded mb-4 whitespace-pre-wrap">
          {cleanedContent || "没有内容"}
        </div>
        <button
          onClick={copyContent}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
          复制内容
        </button>
      </div>

      {/* 右侧URL列表 */}
      <div className="w-full md:w-1/2 p-4 flex flex-col">
        <h2 className="text-xl font-bold mb-4">图片URL列表</h2>
        <div className="flex-grow overflow-auto bg-gray-50 p-4 rounded mb-4">
          {allImageUrls.length > 0 ? (
            <ul className="list-disc pl-4">
              {allImageUrls.map((item, index) => (
                <li key={index} className="mb-2 break-all">
                  <span className="font-semibold">
                    {item.postTitle}-{index + 1}:
                  </span>{" "}
                  {item.url}
                </li>
              ))}
            </ul>
          ) : (
            <p>没有图片URL</p>
          )}
        </div>
        <button
          onClick={downloadAllImages}
          disabled={isLoading || allImageUrls.length === 0}
          className={`
            ${isLoading || allImageUrls.length === 0 ? "bg-gray-400" : "bg-green-500 hover:bg-green-600"} 
            text-white py-2 px-4 rounded
          `}>
          {isLoading ? "下载中..." : "下载所有图片"}
        </button>
      </div>
    </div>
  )
}

// 公众号格式化组件
const GongZhongHaoFormatter = ({ posts }: { posts: PostDetail[] }) => {
  // 转换为Markdown格式
  const markdownContent = posts
    .map((post) => {
      let content = post.content

      // 图片URL转换为Markdown图片格式
      post.imageUrls.forEach((url) => {
        if (content.includes(url)) {
          content = content.replace(url, `![图片](${url})`)
        } else {
          // 如果URL不在内容中，添加到内容末尾
          content += `\n\n![图片](${url})`
        }
      })

      return `## ${post.title}\n\n${content}`
    })
    .join("\n\n")

  // 复制Markdown内容
  const copyMarkdown = () => {
    navigator.clipboard
      .writeText(markdownContent)
      .then(() => alert("Markdown内容已复制到剪贴板"))
      .catch((err) => console.error("复制失败:", err))
  }

  return (
    <div className="flex flex-col h-screen p-4">
      <h2 className="text-xl font-bold mb-4">Markdown格式</h2>
      <textarea
        className="flex-grow p-4 bg-gray-50 rounded mb-4 font-mono"
        value={markdownContent}
        readOnly
      />
      <button
        onClick={copyMarkdown}
        className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
        复制Markdown
      </button>
    </div>
  )
}

// 主组件
const FormatterTab = () => {
  const [type, setType] = useState<string>("")
  const [urls, setUrls] = useState<string[]>([])
  const [posts, setPosts] = useState<PostDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 从URL参数获取类型和URLs
    const params = new URLSearchParams(window.location.search)
    const typeParam = params.get("type")
    const urlsParam = params.get("urls")

    if (typeParam) {
      setType(typeParam)
    }

    if (urlsParam) {
      try {
        const parsedUrls = JSON.parse(urlsParam)
        setUrls(parsedUrls)

        // 获取所有帖子详情
        fetchAllPostDetails(parsedUrls)
      } catch (e) {
        console.error("解析URL参数出错:", e)
        setError("解析URL参数出错")
        setIsLoading(false)
      }
    } else {
      setIsLoading(false)
      setError("未提供URL参数")
    }
  }, [])

  // 获取所有帖子详情
  const fetchAllPostDetails = async (urls: string[]) => {
    try {
      const details = await Promise.all(urls.map(fetchPostDetail))
      setPosts(details.filter(Boolean) as PostDetail[])
    } catch (error) {
      console.error("获取帖子详情出错:", error)
      setError("获取帖子详情出错")
    } finally {
      setIsLoading(false)
    }
  }

  // 获取单个帖子详情
  const fetchPostDetail = async (url: string): Promise<PostDetail | null> => {
    try {
      const response = await fetch(url)
      const html = await response.text()

      // 创建一个临时DOM解析HTML
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, "text/html")

      // 提取标题和内容 (这些选择器需要根据实际网站结构调整)
      const title = doc.querySelector("h1")?.textContent || "无标题"
      const content =
        doc.querySelector(".article-content")?.textContent || "无内容"

      // 提取图片URL
      const imageUrls: string[] = []
      const imgElements = doc.querySelectorAll("div.article-content img")
      imgElements.forEach((img) => {
        const src = img.getAttribute("src")
        if (src && src.startsWith("http")) {
          imageUrls.push(src)
        }
      })

      return { title, content, imageUrls }
    } catch (error) {
      console.error(`获取帖子详情失败 (${url}):`, error)
      return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p>正在获取帖子详情...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-red-500">
          <h2 className="text-xl font-bold mb-2">出错了</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {type === "xiaohongshu" ? (
        <XiaoHongShuFormatter posts={posts} />
      ) : type === "gongzhonghao" ? (
        <GongZhongHaoFormatter posts={posts} />
      ) : (
        <div className="flex items-center justify-center h-screen">
          <p>未知格式类型: {type}</p>
        </div>
      )}
    </div>
  )
}

// 渲染组件
const root = document.createElement("div")
root.id = "formatter-root"
document.body.appendChild(root)
render(<FormatterTab />, root)
