import { Canvas } from './canvas'
import './app.css'

export function App() {
  return <canvas ref={init} />
}

function init(canvas: HTMLCanvasElement) {
  console.log('init')
  new Canvas(canvas)
}
