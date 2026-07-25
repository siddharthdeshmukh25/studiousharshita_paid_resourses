'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // Create particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 500;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 10;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.02,
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.8,
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Create floating geometric shapes
    const shapesGroup = new THREE.Group();
    
    // Icosahedron
    const icoGeometry = new THREE.IcosahedronGeometry(1, 0);
    const icoMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x3b82f6, 
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    const icosahedron = new THREE.Mesh(icoGeometry, icoMaterial);
    icosahedron.position.set(3, 1, -2);
    shapesGroup.add(icosahedron);

    // Octahedron
    const octGeometry = new THREE.OctahedronGeometry(0.8, 0);
    const octMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x8b5cf6, 
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    const octahedron = new THREE.Mesh(octGeometry, octMaterial);
    octahedron.position.set(-3, -1, -2);
    shapesGroup.add(octahedron);

    // Torus
    const torusGeometry = new THREE.TorusGeometry(0.6, 0.2, 16, 100);
    const torusMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x06b6d4, 
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    const torus = new THREE.Mesh(torusGeometry, torusMaterial);
    torus.position.set(0, 2, -3);
    shapesGroup.add(torus);

    scene.add(shapesGroup);

    camera.position.z = 5;

    // Mouse movement
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation
    const animate = () => {
      requestAnimationFrame(animate);

      // Rotate particles
      particlesMesh.rotation.y += 0.001;
      particlesMesh.rotation.x += 0.0005;

      // Rotate shapes
      icosahedron.rotation.x += 0.01;
      icosahedron.rotation.y += 0.01;

      octahedron.rotation.x -= 0.008;
      octahedron.rotation.y -= 0.008;

      torus.rotation.x += 0.012;
      torus.rotation.y += 0.006;

      // Mouse interaction
      shapesGroup.rotation.x += (mouseY * 0.5 - shapesGroup.rotation.x) * 0.05;
      shapesGroup.rotation.y += (mouseX * 0.5 - shapesGroup.rotation.y) * 0.05;

      // Floating animation
      const time = Date.now() * 0.001;
      icosahedron.position.y = 1 + Math.sin(time) * 0.3;
      octahedron.position.y = -1 + Math.sin(time + 1) * 0.3;
      torus.position.y = 2 + Math.sin(time + 2) * 0.3;

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      icoGeometry.dispose();
      icoMaterial.dispose();
      octGeometry.dispose();
      octMaterial.dispose();
      torusGeometry.dispose();
      torusMaterial.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 -z-10"
      style={{ pointerEvents: 'none' }}
    />
  );
}
