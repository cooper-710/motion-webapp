import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useFBX } from "@react-three/drei";
import * as THREE from "three";

// Component to render orange spheres at bone vertices
function BoneVertices({ fbx }: { fbx: THREE.Group }) {
  const [bones, setBones] = useState<THREE.Bone[]>([]);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const boneList: THREE.Bone[] = [];
    fbx.traverse((obj: any) => {
      if (obj.isBone) {
        boneList.push(obj);
      }
    });
    setBones(boneList);
  }, [fbx]);

  useFrame(() => {
    if (!groupRef.current) return;
    
    // Update all bone world matrices
    fbx.updateMatrixWorld(true);
  });

  return (
    <group ref={groupRef}>
      {bones.map((bone, index) => (
        <BoneVertex key={`vertex-${index}-${bone.uuid}`} bone={bone} />
      ))}
    </group>
  );
}

// Individual vertex sphere component
function BoneVertex({ bone }: { bone: THREE.Bone }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const positionRef = useRef(new THREE.Vector3());

  useFrame(() => {
    if (!meshRef.current) return;
    
    // Get world position of the bone
    bone.getWorldPosition(positionRef.current);
    meshRef.current.position.copy(positionRef.current);
  });

  const sphereRadius = 0.0295; // Size of the orange balls

  return (
    <mesh ref={meshRef} castShadow>
      <sphereGeometry args={[sphereRadius, 16, 16]} />
      <meshStandardMaterial
        color={0xe5812b} // Sequence orange color (#e5812b)
        emissive={0xe5812b}
        emissiveIntensity={0.3}
        roughness={0.4}
        metalness={0.2}
      />
    </mesh>
  );
}

// Procedural bone mesh component - draws a cylinder from parent to child bone
function ProceduralBone({ 
  bone, 
  parentBone 
}: { 
  bone: THREE.Bone; 
  parentBone: THREE.Bone | null;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!meshRef.current || !groupRef.current || !parentBone) return;

    // Get world positions
    const bonePos = new THREE.Vector3();
    const parentPos = new THREE.Vector3();
    bone.getWorldPosition(bonePos);
    parentBone.getWorldPosition(parentPos);

    // Calculate bone vector
    const direction = new THREE.Vector3().subVectors(bonePos, parentPos);
    const length = direction.length();

    if (length > 0.001) {
      // Position cylinder at midpoint
      const midpoint = new THREE.Vector3().addVectors(parentPos, bonePos).multiplyScalar(0.5);
      groupRef.current.position.copy(midpoint);

      // Orient cylinder along bone direction
      const up = new THREE.Vector3(0, 1, 0);
      direction.normalize();
      const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
      groupRef.current.quaternion.copy(quaternion);

      // Scale to bone length
      meshRef.current.scale.y = length;
    }
  });

  const boneThickness = 0.015; // Bone radius (thicker for stick figure)

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} castShadow receiveShadow>
        <cylinderGeometry args={[boneThickness, boneThickness, 1, 12]} />
        <meshStandardMaterial
          color={0xffffff}
          roughness={0.5}
          metalness={0.2}
        />
      </mesh>
    </group>
  );
}

// Procedural skeleton component (fallback if GLB loading fails)
function ProceduralSkeleton({ fbx }: { fbx: THREE.Group }) {
  const [bonePairs, setBonePairs] = useState<Array<{ bone: THREE.Bone; parent: THREE.Bone | null }>>([]);

  useEffect(() => {
    const pairs: Array<{ bone: THREE.Bone; parent: THREE.Bone | null }> = [];

    // Find all bones with their parents
    fbx.traverse((obj: any) => {
      if (obj.isBone && obj.parent && obj.parent.isBone) {
        pairs.push({
          bone: obj,
          parent: obj.parent as THREE.Bone,
        });
      }
    });

    setBonePairs(pairs);
  }, [fbx]);

  return (
    <>
      {bonePairs.map(({ bone, parent }, index) => (
        <ProceduralBone 
          key={`bone-${index}-${bone.uuid}`} 
          bone={bone} 
          parentBone={parent} 
        />
      ))}
    </>
  );
}

export default function FBXModel({
  url,
  scale = 0.01,
  position = [0, 0, 0] as [number, number, number],
  rotation = [0, 0, 0] as [number, number, number],
  time = 0,                          // absolute time (seconds)
  displayMode = "normal",
  onReadyDuration,
}: {
  url: string | null;
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  time?: number;
  displayMode?: "normal" | "stick";
  onReadyDuration?: (duration: number) => void;
}) {
  const fbx = url ? useFBX(url) : null;

  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionRef = useRef<THREE.AnimationAction | null>(null);
  const durationRef = useRef<number>(0);

  useEffect(() => {
    if (!fbx) return;

    // Ensure meshes are visible and have reasonable materials
    fbx.traverse((obj: any) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;

        // If the imported material is unlit/black, use a neutral PBR fallback
        const m = obj.material as THREE.Material | undefined;
        const needsFallback =
          !m ||
          // @ts-ignore
          (m.color && (m as any).color.equals?.(new THREE.Color(0x000000)));

        if (needsFallback) {
          obj.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color("#d4d8e0"),
            roughness: 0.85,
            metalness: 0.08,
            envMapIntensity: 1.0,
          });
        } else if (m && (m as any).isMeshStandardMaterial) {
          // Enhance existing materials if they're standard materials
          const mat = m as THREE.MeshStandardMaterial;
          // Note: castShadow and receiveShadow are properties of Mesh, not Material
          // These are set when traversing meshes above
          if (mat.roughness !== undefined) {
            mat.roughness = Math.max(0.3, Math.min(mat.roughness, 0.95));
          }
        }

        // Toggle mesh visibility based on display mode
        if (displayMode === "stick") {
          obj.visible = false;
        } else {
          obj.visible = true;
        }
      }
    });

    fbx.scale.setScalar(scale);
    fbx.position.set(position[0], position[1], position[2]);
    fbx.rotation.set(rotation[0], rotation[1], rotation[2]);

    if (fbx.animations && fbx.animations.length > 0) {
      const clip = fbx.animations[0];
      durationRef.current = clip.duration;

      const mixer = new THREE.AnimationMixer(fbx);
      const action = mixer.clipAction(clip);
      action.enabled = true;
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.setEffectiveWeight(1);
      action.play();

      mixerRef.current = mixer;
      actionRef.current = action;

      onReadyDuration?.(clip.duration);
    } else {
      mixerRef.current = null;
      actionRef.current = null;
      durationRef.current = 0;
      onReadyDuration?.(0);
    }

    return () => {
      actionRef.current?.stop();
      mixerRef.current?.stopAllAction();
      if (fbx) mixerRef.current?.uncacheRoot(fbx as THREE.Object3D);
      actionRef.current = null;
      mixerRef.current = null;
      durationRef.current = 0;
    };
  }, [fbx, scale, position, rotation, displayMode, onReadyDuration]);


  // Drive to exact time (scrub/play controlled by parent)
  useFrame(() => {
    const mixer = mixerRef.current;
    const action = actionRef.current;
    const dur = durationRef.current;
    if (!mixer || !action) return;

    const t = dur > 0 ? (time % dur + dur) % dur : 0;
    mixer.setTime(t);
  });

  if (!fbx) return null;
  
  return (
    <>
      <primitive object={fbx} />
      {displayMode === "stick" && (
        <>
          <ProceduralSkeleton fbx={fbx} />
          <BoneVertices fbx={fbx} />
        </>
      )}
    </>
  );
}
