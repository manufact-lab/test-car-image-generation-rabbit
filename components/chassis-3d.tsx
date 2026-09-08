"use client"

import { useRef, useMemo, Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, ContactShadows, Html } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import type { Mesh, Group, Shape } from "three"
import type { DoorTrim } from "@/lib/inventory-data"

// Door-trim mount positions on the car body.
// Car length runs along X (front = +X), width along Z (left = +Z, right = -Z).
const DOOR_POSITION: Record<DoorTrim, [number, number, number]> = {
  "DT FL": [0.45, 0.72, 0.83],
  "DT FR": [0.45, 0.72, -0.83],
  "DT RL": [-0.55, 0.72, 0.83],
  "DT RR": [-0.55, 0.72, -0.83],
}

// Build a smooth sedan side-profile as a 2D shape, then extrude across the width.
function useCarShape() {
  return useMemo(() => {
    const s: Shape = new THREE.Shape()
    s.moveTo(-2.15, 0.06)
    s.lineTo(-2.05, 0.42) // rear bumper
    s.lineTo(-1.5, 0.5)
    s.lineTo(-1.15, 0.86) // trunk deck
    s.bezierCurveTo(-0.7, 1.16, -0.2, 1.22, 0.25, 1.18) // roof
    s.bezierCurveTo(0.55, 1.14, 0.7, 0.98, 0.95, 0.82) // windshield base
    s.lineTo(1.55, 0.66) // hood
    s.lineTo(2.05, 0.56)
    s.lineTo(2.18, 0.34) // front bumper
    s.lineTo(2.1, 0.08)
    s.lineTo(1.7, 0.02)
    // front wheel arch
    s.absarc(1.35, 0.04, 0.42, Math.PI * 0.98, Math.PI * 0.02, true)
    s.lineTo(-0.9, 0.02)
    // rear wheel arch
    s.absarc(-1.25, 0.04, 0.42, Math.PI * 0.98, Math.PI * 0.02, true)
    s.lineTo(-2.05, 0.02)
    s.closePath()
    return s
  }, [])
}

function CarBody() {
  const shape = useCarShape()
  const roofShape = useMemo(() => {
    const s: Shape = new THREE.Shape()
    s.moveTo(-1.12, 0.9)
    s.bezierCurveTo(-0.7, 1.17, -0.2, 1.23, 0.25, 1.19)
    s.bezierCurveTo(0.5, 1.15, 0.62, 1.04, 0.82, 0.9)
    s.closePath()
    return s
  }, [])

  const extrudeSettings = useMemo(
    () => ({ depth: 1.6, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 3 }),
    [],
  )
  const roofExtrude = useMemo(
    () => ({ depth: 1.5, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 }),
    [],
  )

  return (
    <group>
      {/* Body — white paint */}
      <mesh castShadow receiveShadow position={[0, 0, -0.8]}>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial color="#f4f5f7" metalness={0.35} roughness={0.28} />
      </mesh>

      {/* Black roof / greenhouse overlay */}
      <mesh position={[0, 0.02, -0.75]}>
        <extrudeGeometry args={[roofShape, roofExtrude]} />
        <meshStandardMaterial color="#111318" metalness={0.4} roughness={0.35} />
      </mesh>

      {/* Windshield + side glass tint band */}
      <mesh position={[-0.15, 0.99, 0]}>
        <boxGeometry args={[1.55, 0.34, 1.68]} />
        <meshStandardMaterial color="#0c1015" metalness={0.6} roughness={0.15} transparent opacity={0.85} />
      </mesh>

      {/* Front grille (dark) */}
      <mesh position={[2.02, 0.42, 0]}>
        <boxGeometry args={[0.12, 0.34, 0.9]} />
        <meshStandardMaterial color="#1c1f26" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Headlights */}
      {[0.55, -0.55].map((z) => (
        <mesh key={z} position={[2.0, 0.6, z]}>
          <boxGeometry args={[0.12, 0.12, 0.3]} />
          <meshStandardMaterial color="#dfe6ef" emissive="#afc7e6" emissiveIntensity={0.4} metalness={0.6} roughness={0.2} />
        </mesh>
      ))}

      {/* Taillights */}
      {[0.6, -0.6].map((z) => (
        <mesh key={z} position={[-2.06, 0.55, z]}>
          <boxGeometry args={[0.08, 0.16, 0.28]} />
          <meshStandardMaterial color="#c0261f" emissive="#ff2b1d" emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  )
}

function Wheel({ position }: { position: [number, number, number] }) {
  const spokes = Array.from({ length: 5 })
  return (
    <group position={position} rotation={[Math.PI / 2, 0, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.42, 0.42, 0.28, 48]} />
        <meshStandardMaterial color="#131313" roughness={0.85} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.145, 0]}>
        <cylinderGeometry args={[0.27, 0.27, 0.04, 40]} />
        <meshStandardMaterial color="#c3c7cd" metalness={0.9} roughness={0.25} />
      </mesh>
      {spokes.map((_, i) => (
        <mesh key={i} position={[0, 0.16, 0]} rotation={[0, (i / spokes.length) * Math.PI * 2, 0]}>
          <boxGeometry args={[0.06, 0.02, 0.48]} />
          <meshStandardMaterial color="#8b9098" metalness={0.85} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.03, 24]} />
        <meshStandardMaterial color="#6d727a" metalness={0.8} roughness={0.35} />
      </mesh>
    </group>
  )
}

function DoorHighlight({ doorTrim }: { doorTrim: DoorTrim }) {
  const ringRef = useRef<Mesh>(null)
  const markerRef = useRef<Mesh>(null)
  const pos = DOOR_POSITION[doorTrim]

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const pulse = 1 + Math.sin(t * 3) * 0.25
    if (ringRef.current) ringRef.current.scale.setScalar(pulse)
    if (markerRef.current) markerRef.current.position.y = pos[1] + 0.4 + Math.sin(t * 2) * 0.05
  })

  return (
    <group>
      <mesh ref={markerRef} position={[pos[0], pos[1] + 0.4, pos[2]]}>
        <sphereGeometry args={[0.08, 20, 20]} />
        <meshStandardMaterial color="#1e3a6b" emissive="#2f5fb0" emissiveIntensity={1.2} />
      </mesh>
      <mesh ref={ringRef} position={pos} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.22, 0.03, 16, 40]} />
        <meshStandardMaterial color="#3f6fc0" emissive="#2f5fb0" emissiveIntensity={0.9} />
      </mesh>
      <Html position={[pos[0], pos[1] + 0.65, pos[2]]} center distanceFactor={8}>
        <div className="pointer-events-none whitespace-nowrap rounded-md border border-[#2f5fb0]/50 bg-white/90 px-2 py-1 text-[11px] font-medium text-[#1e3a6b] backdrop-blur">
          {doorTrim}
        </div>
      </Html>
    </group>
  )
}

function Car({ doorTrim }: { doorTrim: DoorTrim }) {
  const groupRef = useRef<Group>(null)
  return (
    <group ref={groupRef}>
      <CarBody />
      <Wheel position={[1.35, 0.04, 0.86]} />
      <Wheel position={[1.35, 0.04, -0.86]} />
      <Wheel position={[-1.25, 0.04, 0.86]} />
      <Wheel position={[-1.25, 0.04, -0.86]} />
      <DoorHighlight doorTrim={doorTrim} />
    </group>
  )
}

export function Chassis3D({ doorTrim }: { doorTrim: DoorTrim }) {
  return (
    <div className="relative h-full min-h-[280px] w-full overflow-hidden rounded-lg border border-border bg-gradient-to-b from-secondary/40 to-background">
      <Canvas shadows camera={{ position: [4.5, 2.6, 5], fov: 40 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 8, 5]} intensity={1.4} castShadow />
          <directionalLight position={[-5, 4, -5]} intensity={0.5} />
          <Environment preset="city" />
          <Car doorTrim={doorTrim} />
          <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={12} blur={2.4} far={4} />
          <OrbitControls
            autoRotate
            autoRotateSpeed={1.2}
            enablePan={false}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.1}
            minDistance={4}
            maxDistance={9}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
