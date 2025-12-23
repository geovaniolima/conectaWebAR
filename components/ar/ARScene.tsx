"use client"

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

type ARSceneProps = {
    mindFileUrl: string;
    onTargetFound?: () => void;
    onTargetLost?: () => void;
    children: React.ReactNode;
}

declare global {
    interface Window {
        MINDAR: any;
    }
}

export default function ARScene({ mindFileUrl, onTargetFound, onTargetLost, children }: ARSceneProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [started, setStarted] = useState(false);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [status, setStatus] = useState("Initializing...");

    const loadScript = () => {
        if (window.MINDAR && window.MINDAR.IMAGE) {
            setScriptLoaded(true);
            return;
        }

        setStatus("Setting up AR Environment...");

        // 1. Inject Import Map for "three" (Critical for CDN modules)
        if (!document.getElementById('three-import-map')) {
            const mapScript = document.createElement('script');
            mapScript.id = 'three-import-map';
            mapScript.type = "importmap";
            mapScript.textContent = JSON.stringify({
                imports: {
                    "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
                    "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
                }
            });
            document.head.appendChild(mapScript);
        }

        setStatus("Loading AR Engine...");
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js";
        script.type = "module";
        script.async = true;
        script.crossOrigin = "anonymous";

        script.onload = () => {
            console.log("MindAR Script Loaded");
            // Wait for object to be available
            let attempts = 0;
            const timer = setInterval(() => {
                attempts++;
                if (window.MINDAR && window.MINDAR.IMAGE) {
                    clearInterval(timer);
                    setScriptLoaded(true);
                    setStatus("Ready");
                } else if (attempts > 50) {
                    clearInterval(timer);
                    setStatus("Engine Load Timeout. Refresh page.");
                }
            }, 100);
        };

        script.onerror = () => {
            setStatus("Failed to load AR Engine. Check connection.");
        };

        document.body.appendChild(script);
    };

    useEffect(() => {
        // Small delay to ensure client-side hydration
        setTimeout(loadScript, 500);
        return () => {
            // Cleanup script if needed?
        }
    }, []);

    return (
        <div className="relative w-full h-full overflow-hidden" ref={containerRef}>
            {!started && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-50 text-white p-4 text-center">
                    <h3 className="text-xl font-bold mb-4">AR Experience</h3>

                    {!scriptLoaded ? (
                        <div className="text-muted-foreground">{status}</div>
                    ) : (
                        <button
                            onClick={() => setStarted(true)}
                            className="px-8 py-4 bg-primary rounded-full font-bold text-lg animate-pulse"
                        >
                            Start Camera
                        </button>
                    )}
                </div>
            )}

            {started && scriptLoaded && (
                <ARCanvas
                    mindFileUrl={mindFileUrl}
                    containerRef={containerRef}
                    onTargetFound={onTargetFound}
                    onTargetLost={onTargetLost}
                >
                    {children}
                </ARCanvas>
            )}
        </div>
    );
}

function ARCanvas({ mindFileUrl, containerRef, onTargetFound, onTargetLost, children }: any) {
    const [mindAR, setMindAR] = useState<any>(null);

    useEffect(() => {
        if (!window.MINDAR) return;

        const initAR = async () => {
            const { MindARThree } = window.MINDAR.IMAGE;

            const mindarThree = new MindARThree({
                container: containerRef.current,
                imageTargetSrc: mindFileUrl,
            });

            const { renderer, scene, camera } = mindarThree;

            try {
                await mindarThree.start();
                setMindAR(mindarThree);

                // Setup event listeners for anchors
                const anchor = mindarThree.addAnchor(0);
                anchor.onTargetFound = () => {
                    console.log("Target Found");
                    if (onTargetFound) onTargetFound();
                };
                anchor.onTargetLost = () => {
                    console.log("Target Lost");
                    if (onTargetLost) onTargetLost();
                };
            } catch (err) {
                console.error("Failed to start MindAR", err);
            }
        };

        initAR();

        return () => {
            if (mindAR) {
                mindAR.stop();
            }
        };
    }, [mindFileUrl]);

    if (!mindAR) return <div className="absolute inset-0 flex items-center justify-center text-white">Initializing AR...</div>;

    return (
        <Canvas
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            onCreated={({ gl, scene, camera }) => {
                // Optional: Sync R3F state if needed
            }}
        >
            <MindARUpdateLoop mindAR={mindAR} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />

            <ARAnchor mindAR={mindAR} anchorIndex={0}>
                {children}
            </ARAnchor>
        </Canvas>
    );
}

function MindARUpdateLoop({ mindAR }: { mindAR: any }) {
    const { camera, scene, gl } = useThree();

    useFrame(() => {
        if (mindAR) {
            // MindAR handles the video background rendering internally usually, 
            // but we need to ensure R3F renders on top.
            // In this setup, R3F is the main renderer.
            // We might need to manually update the camera matrix from MindAR.

            // Note: MindARThree's camera is a Three.js camera.
            // We can copy its properties to the R3F camera.
            const mindCamera = mindAR.camera;
            camera.projectionMatrix.copy(mindCamera.projectionMatrix);
            camera.position.copy(mindCamera.position);
            camera.quaternion.copy(mindCamera.quaternion);
            camera.scale.copy(mindCamera.scale);
        }
    });

    return null;
}

function ARAnchor({ mindAR, anchorIndex, children }: any) {
    const groupRef = useRef<THREE.Group>(null);

    useFrame(() => {
        if (mindAR && groupRef.current) {
            const anchor = mindAR.anchors[anchorIndex];
            if (anchor.visible && anchor.matrix) {
                groupRef.current.visible = true;
                groupRef.current.matrix.fromArray(anchor.matrix);
                groupRef.current.matrixAutoUpdate = false;
            } else {
                groupRef.current.visible = false;
            }
        }
    });

    return (
        <group ref={groupRef} visible={false}>
            {children}
        </group>
    );
}
