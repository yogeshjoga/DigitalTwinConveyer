import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';

interface HandTrackingProps {}

export default function HandTracking({}: HandTrackingProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Virtual cursor state tracking
  const wasPinchingRef = useRef(false);

  useEffect(() => {
    // Empty effect, kept for structure if needed
  }, []);

  const initCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240, facingMode: 'user' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
        };
      }
    } catch (err) {
      console.error("Error accessing webcam", err);
      setError("Webcam access denied or unavailable.");
    }
  };

  const drawHand = (predictions: handpose.AnnotatedPrediction[], ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (predictions.length > 0) {
      predictions.forEach((prediction) => {
        const landmarks = prediction.landmarks;
        
        // Draw connections
        ctx.strokeStyle = '#3b82f6'; // blue
        ctx.lineWidth = 2;
        
        const drawPath = (indices: number[]) => {
            ctx.beginPath();
            ctx.moveTo(ctx.canvas.width - landmarks[indices[0]][0], landmarks[indices[0]][1]);
            for(let i = 1; i < indices.length; i++) {
                ctx.lineTo(ctx.canvas.width - landmarks[indices[i]][0], landmarks[indices[i]][1]);
            }
            ctx.stroke();
        }
        
        drawPath([0, 1, 2, 3, 4]); // Thumb
        drawPath([0, 5, 6, 7, 8]); // Index
        drawPath([0, 9, 10, 11, 12]); // Middle
        drawPath([0, 13, 14, 15, 16]); // Ring
        drawPath([0, 17, 18, 19, 20]); // Pinky
        drawPath([5, 9, 13, 17]); // Palm base

        // Draw points
        for (let i = 0; i < landmarks.length; i++) {
          const x = ctx.canvas.width - landmarks[i][0]; // Flip X for mirror effect
          const y = landmarks[i][1];
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, 2 * Math.PI);
          ctx.fillStyle = i === 8 || i === 12 || i === 16 || i === 20 ? '#ef4444' : '#22c55e';
          ctx.fill();
        }
      });
    }
  };

  const detectGesture = useCallback((predictions: handpose.AnnotatedPrediction[]) => {
    if (predictions.length === 0) return;
    
    const landmarks = predictions[0].landmarks;
    
    // Virtual Cursor & Pinch-to-Click
    const indexTip = landmarks[8];
    const thumbTip = landmarks[4];
    
    // Map video coordinates (320x240) to screen coordinates (window inner width/height).
    // Note: The camera is horizontally mirrored.
    const screenX = window.innerWidth - (indexTip[0] / 320) * window.innerWidth;
    const screenY = (indexTip[1] / 240) * window.innerHeight;
    
    // Calculate 3D distance between thumb tip and index tip
    const pinchDist = Math.hypot(
        thumbTip[0] - indexTip[0],
        thumbTip[1] - indexTip[1],
        (thumbTip[2] || 0) - (indexTip[2] || 0)
    );
    const isPinching = pinchDist < 30; // Threshold for pinch

    if (window.updateVirtualCursor) {
        window.updateVirtualCursor(screenX, screenY, isPinching, true);
    }

    // Trigger click exactly when pinch begins
    if (isPinching && !wasPinchingRef.current) {
        wasPinchingRef.current = true;
        const el = document.elementFromPoint(screenX, screenY) as HTMLElement;
        if (el) {
            const event = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: screenX,
                clientY: screenY
            });
            el.dispatchEvent(event);
            
            // Visual click feedback
            if (el.style) {
                const oldTransition = el.style.transition;
                const oldTransform = el.style.transform;
                el.style.transition = 'transform 0.1s';
                el.style.transform = (oldTransform || '') + ' scale(0.95)';
                setTimeout(() => {
                    if (el && el.style) {
                        el.style.transform = oldTransform;
                        setTimeout(() => {
                            if (el && el.style) el.style.transition = oldTransition;
                        }, 100);
                    }
                }, 100);
            }
        }
    } else if (!isPinching) {
        wasPinchingRef.current = false;
    }
  }, []); // Empty dependency array because we use refs for callbacks

  useEffect(() => {
    let animationFrameId: number;
    let model: handpose.HandPose;

    const runModel = async () => {
      await tf.ready();
      try {
        await tf.setBackend('webgl');
      } catch (e) {
        console.warn("WebGL not available, falling back to CPU");
      }
      model = await handpose.load();
      setIsLoaded(true);
      await initCamera();

      const loop = async () => {
        if (videoRef.current && canvasRef.current && videoRef.current.readyState >= 2) {
          const predictions = await model.estimateHands(videoRef.current);
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            drawHand(predictions, ctx);
            detectGesture(predictions);
          }
        }
        animationFrameId = requestAnimationFrame(loop);
      };
      
      loop();
    };

    runModel();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (window.updateVirtualCursor) {
        window.updateVirtualCursor(0, 0, false, false);
      }
    };
  }, [detectGesture]);

  return (
    <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 50, borderRadius: 12, overflow: 'hidden', border: '2px solid rgba(59,130,246,0.5)', background: '#000', boxShadow: '0 4px 24px rgba(0,0,0,0.5)', width: 240, height: 180, pointerEvents: 'none' }}>
      <video ref={videoRef} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} playsInline autoPlay muted />
      <canvas ref={canvasRef} width={320} height={240} style={{ position: 'absolute', top: 0, left: 0, display: 'block', width: 240, height: 180 }} />
      {!isLoaded && !error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', color: '#60a5fa', fontSize: 12, fontWeight: 'bold' }}>
          Loading AI Model...
        </div>
      )}
      {error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.8)', color: '#fff', fontSize: 12, fontWeight: 'bold', textAlign: 'center', padding: 8 }}>
          {error}
        </div>
      )}
      <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.6)', color: '#3b82f6', fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 'bold' }}>
        AI VISION ACTIVE
      </div>
    </div>
  );
}
