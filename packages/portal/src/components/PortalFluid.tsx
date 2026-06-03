import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragment = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    float swirl = sin(8.0 * r - uTime * 1.5 + atan(p.y, p.x) * 3.0);
    vec3 col = mix(vec3(0.02), vec3(1.0, 0.404, 0.314), 0.5 + 0.5 * swirl);
    gl_FragColor = vec4(col * (1.0 - r * 0.6), 1.0);
  }
`

/** The dormant "another world" surface — a cheap animated swirl shown while the
 *  portal is dormant/idle, so a non-engaged portal costs ~0 guest compute. */
export function PortalFluid({ width, height }: { width: number; height: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null)
  useFrame((_, dt) => {
    if (mat.current) mat.current.uniforms.uTime.value += dt
  })
  return (
    <mesh>
      <planeGeometry args={[width, height]} />
      <shaderMaterial
        ref={mat}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={{ uTime: { value: 0 } }}
      />
    </mesh>
  )
}
