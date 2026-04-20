import type { TrackPoint } from '@/types/workout'

export type AMapPath = [number, number]

export interface AMapMapInstance {
  add: (overlay: unknown) => void
  remove: (overlay: unknown) => void
  setFitView: (overlays?: unknown[]) => void
  addControl: (control: unknown) => void
  destroy: () => void
}

export interface AMapPolylineInstance {
  setPath: (path: AMapPath[]) => void
}

export interface AMapNamespace {
  Map: new (container: HTMLElement, options: Record<string, unknown>) => AMapMapInstance
  Polyline: new (options: Record<string, unknown>) => AMapPolylineInstance
  ToolBar: new () => unknown
}

declare global {
  interface Window {
    AMap?: AMapNamespace
  }
}

// 复用同一个 Promise，避免重复插入地图脚本。
let loaderPromise: Promise<AMapNamespace> | null = null

export function pointsToPath(points: TrackPoint[]): AMapPath[] {
  return points.map((point) => [point.lng, point.lat])
}

export function loadAmap(): Promise<AMapNamespace> {
  if (window.AMap) {
    return Promise.resolve(window.AMap)
  }

  if (loaderPromise) {
    return loaderPromise
  }

  const key = import.meta.env.VITE_AMAP_KEY
  if (!key) {
    return Promise.reject(new Error('未配置高德地图 Key，请在 .env 文件中设置 VITE_AMAP_KEY。'))
  }

  loaderPromise = new Promise((resolve, reject) => {
    const scriptId = 'amap-jsapi-loader'
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null

    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if (window.AMap) {
          resolve(window.AMap)
          return
        }

        reject(new Error('高德地图脚本已加载，但 AMap 未初始化。'))
      })
      existingScript.addEventListener('error', () => {
        reject(new Error('高德地图脚本加载失败，请检查网络与 Key。'))
      })
      return
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.type = 'text/javascript'
    script.async = true
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}&plugin=AMap.ToolBar`

    script.onload = () => {
      if (window.AMap) {
        resolve(window.AMap)
        return
      }

      reject(new Error('高德地图脚本加载成功，但 AMap 对象不存在。'))
    }

    script.onerror = () => {
      reject(new Error('高德地图脚本加载失败，请检查网络与 Key。'))
    }

    document.head.appendChild(script)
  })

  return loaderPromise
}
