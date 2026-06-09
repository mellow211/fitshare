'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Upload, Camera, Check, RotateCcw, RotateCw, Scissors, 
  Maximize2, Save, Loader2, Sparkles, Sliders, ArrowLeft, Info
} from 'lucide-react';
import styles from './admin.module.css';
import { uploadImage, addCloth } from '../../lib/db';

export default function AdminPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Upload, 2: Calibration/Chroma, 3: Edit/Save
  const [imageSrc, setImageSrc] = useState(null);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270 (Degrees to rotate image clockwise)
  
  // Chroma Key Settings
  const [chromaMode, setChromaMode] = useState('green'); // 'green', 'blue', 'none'
  const [tolerance, setTolerance] = useState(60);
  
  // Calibration Markers: TL, TR, BR, BL
  const [markers, setMarkers] = useState([]);
  const markerLabels = ['좌측 상단 (Top-Left)', '우측 상단 (Top-Right)', '우측 하단 (Bottom-Right)', '좌측 하단 (Bottom-Left)'];
  
  // Form Metadata
  const [name, setName] = useState('');
  const [category, setCategory] = useState('상의'); // '상의', '하의', '아우터'
  const [color, setColor] = useState('네이비');
  const [style, setStyle] = useState('체육복'); // '교복', '체육복', '일상복'
  const [spaceCode, setSpaceCode] = useState('default-wardrobe');

  // Warped Canvas & AI measurements
  const [warpedImageSrc, setWarpedImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const renderMinimap = (targetIdx) => {
    const isCurrent = markers.length === targetIdx;
    let tlColor = "#94a3b8";
    if (markers.length > 0) tlColor = "#10b981";
    else if (markers.length === 0 && targetIdx === 0) tlColor = "#f43f5e";

    let trColor = "#94a3b8";
    if (markers.length > 1) trColor = "#10b981";
    else if (markers.length === 1 && targetIdx === 1) trColor = "#f43f5e";

    let brColor = "#94a3b8";
    if (markers.length > 2) brColor = "#10b981";
    else if (markers.length === 2 && targetIdx === 2) brColor = "#f43f5e";

    let blColor = "#94a3b8";
    if (markers.length > 3) blColor = "#10b981";
    else if (markers.length === 3 && targetIdx === 3) blColor = "#f43f5e";

    return (
      <svg width="24" height="18" viewBox="0 0 24 18" style={{ marginRight: '8px', flexShrink: 0 }}>
        <rect x="2" y="2" width="20" height="14" rx="2" fill="none" stroke={isCurrent ? "hsl(var(--primary))" : "#cbd5e1"} strokeWidth="1.5" />
        <circle cx="5" cy="5" r="2.5" fill={tlColor} className={markers.length === 0 && targetIdx === 0 ? styles.blinkingMinimapDot : ''} />
        <circle cx="19" cy="5" r="2.5" fill={trColor} className={markers.length === 1 && targetIdx === 1 ? styles.blinkingMinimapDot : ''} />
        <circle cx="19" cy="13" r="2.5" fill={brColor} className={markers.length === 2 && targetIdx === 2 ? styles.blinkingMinimapDot : ''} />
        <circle cx="5" cy="13" r="2.5" fill={blColor} className={markers.length === 3 && targetIdx === 3 ? styles.blinkingMinimapDot : ''} />
      </svg>
    );
  };

  // Measurement Line Handles (Percentage coordinates 0-100)
  // Each line has point A (x1, y1) and point B (x2, y2)
  const [lineHandles, setLineHandles] = useState({
    shoulder: { x1: 30, y1: 20, x2: 70, y2: 20 },
    chest: { x1: 25, y1: 36, x2: 75, y2: 36 },
    sleeve: { x1: 30, y1: 20, x2: 12, y2: 50 },
    length: { x1: 50, y1: 20, x2: 50, y2: 85 },
    // for pants
    waist: { x1: 30, y1: 15, x2: 70, y2: 15 },
    pantsLength: { x1: 50, y1: 15, x2: 50, y2: 92 }
  });

  const [activeHandle, setActiveHandle] = useState(null); // { line: 'shoulder', point: '1' }

  // Canvas Refs
  const displayCanvasRef = useRef(null);
  const workspaceRef = useRef(null);

  // Load space code from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fitshare_active_space');
      if (saved) setSpaceCode(saved);
    }
  }, []);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Step 1: Handle File Upload / Camera Capture
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const { compressImage } = await import('../../lib/db');
      // Pre-compress to max 1200px width/height and 0.90 quality
      // This automatically handles browser auto-rotation and removes EXIF metadata
      const compressedBlob = await compressImage(file, 1200, 1200, 0.9);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const testImg = new Image();
        testImg.src = event.target.result;
        testImg.onload = () => {
          setImageSrc(event.target.result);
          setMarkers([]); // Reset markers
          // Auto-detect if image is landscape (width > height).
          // If it is, rotate it 90 degrees clockwise by default to display it upright (portrait).
          if (testImg.width > testImg.height) {
            setRotation(90);
          } else {
            setRotation(0);
          }
          setStep(2);
          setIsLoading(false);
        };
      };
      reader.readAsDataURL(compressedBlob);
    } catch (err) {
      console.error('Failed to pre-compress image:', err);
      // Fallback
      const reader = new FileReader();
      reader.onload = (event) => {
        const testImg = new Image();
        testImg.src = event.target.result;
        testImg.onload = () => {
          setImageSrc(event.target.result);
          setMarkers([]);
          if (testImg.width > testImg.height) {
            setRotation(90);
          } else {
            setRotation(0);
          }
          setStep(2);
          setIsLoading(false);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
    setMarkers([]); // Reset markers since coordinate mapping orientation changed
  };

  // Draw setup canvas (original image + chroma key + markers overlay)
  useEffect(() => {
    if (step !== 2 || !imageSrc) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = displayCanvasRef.current;
      if (!canvas) return;

      const isRotated = rotation === 90 || rotation === 270;
      const targetWidth = isRotated ? img.height : img.width;
      const targetHeight = isRotated ? img.width : img.height;

      // Set original canvas dimensions to rotated image size (for processing)
      const originalCanvas = document.createElement('canvas');
      originalCanvas.width = targetWidth;
      originalCanvas.height = targetHeight;
      const oCtx = originalCanvas.getContext('2d');
      
      oCtx.save();
      oCtx.translate(targetWidth / 2, targetHeight / 2);
      oCtx.rotate((rotation * Math.PI) / 180);
      oCtx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);
      oCtx.restore();

      // Set display canvas dimensions
      const containerWidth = canvas.parentNode?.clientWidth || 400;
      const scale = containerWidth / targetWidth;
      canvas.width = containerWidth;
      canvas.height = targetHeight * scale;
      
      drawProcessedImage(originalCanvas, canvas);
    };
  }, [step, imageSrc, chromaMode, tolerance, markers, rotation]);

  // Apply Chroma-key Background Removal and draw markers on canvas
  const drawProcessedImage = (srcCanvas, canvas) => {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw original rotated image on display canvas first
    ctx.drawImage(srcCanvas, 0, 0, canvas.width, canvas.height);

    // If chroma-key is enabled, process pixels
    if (chromaMode !== 'none') {
      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const tol = Number(tolerance);

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          let match = false;
          if (chromaMode === 'green') {
            // Green backdrop detection
            match = g > 75 && g - r > tol - 40 && g - b > tol - 40;
          } else if (chromaMode === 'blue') {
            // Blue backdrop detection
            match = b > 75 && b - r > tol - 40 && b - g > tol - 40;
          }

          if (match) {
            // Replace matching pixels with pure studio-white
            data[i] = 255;     // R
            data[i + 1] = 255; // G
            data[i + 2] = 255; // B
            data[i + 3] = 255; // Alpha
          }
        }
        ctx.putImageData(imgData, 0, 0);
      } catch (e) {
        console.error("Canvas pixel read blocked (cross-origin error). Running without chroma-key overlay.", e);
      }
    }

    // Draw calibration markers and connecting lines
    ctx.lineWidth = 2;
    
    if (markers.length > 0) {
      ctx.strokeStyle = '#f43f5e';
      ctx.beginPath();
      ctx.moveTo(markers[0].x * canvas.width, markers[0].y * canvas.height);
      
      for (let i = 1; i < markers.length; i++) {
        ctx.lineTo(markers[i].x * canvas.width, markers[i].y * canvas.height);
      }
      
      if (markers.length === 4) {
        ctx.closePath();
      }
      ctx.stroke();
    }

    // Draw individual corner marker points
    markers.forEach((m, idx) => {
      ctx.fillStyle = '#f43f5e';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(m.x * canvas.width, m.y * canvas.height, 8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      
      // Draw label number
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Inter';
      ctx.fillText(idx + 1, m.x * canvas.width - 3, m.y * canvas.height + 4);
    });
  };

  // Capture mouse clicks on canvas to position 4-corner markers
  const handleCanvasClick = (e) => {
    if (markers.length >= 4) return; // All markers set

    const canvas = displayCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Prevent duplicate/bouncing clicks on the exact same coordinate (esp. for touch screens)
    if (markers.length > 0) {
      const lastMarker = markers[markers.length - 1];
      const dist = Math.sqrt(Math.pow(lastMarker.x - x, 2) + Math.pow(lastMarker.y - y, 2));
      if (dist < 0.03) {
        console.log('Duplicate marker click ignored');
        return;
      }
    }

    setMarkers([...markers, { x, y }]);
  };

  const resetMarkers = () => {
    setMarkers([]);
  };

  // Step 2 Action: Apply Bilinear Warping (Homography simulation) and invoke Gemini AI
  const handleWarpAndAnalyze = async () => {
    if (markers.length < 4) {
      triggerToast('촬영 상자의 4개 모서리 마커를 모두 지정해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      // Load original image in-memory
      const img = new Image();
      img.src = imageSrc;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const isRotated = rotation === 90 || rotation === 270;
      const imgWidth = isRotated ? img.height : img.width;
      const imgHeight = isRotated ? img.width : img.height;

      const originalCanvas = document.createElement('canvas');
      originalCanvas.width = imgWidth;
      originalCanvas.height = imgHeight;
      const oCtx = originalCanvas.getContext('2d');

      oCtx.save();
      oCtx.translate(imgWidth / 2, imgHeight / 2);
      oCtx.rotate((rotation * Math.PI) / 180);
      oCtx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);
      oCtx.restore();

      const srcImgData = oCtx.getImageData(0, 0, imgWidth, imgHeight);
      const srcData = srcImgData.data;

      // 1. Get original high-res points from normalized coordinates
      console.log('DEBUG WarpAndAnalyze - Image info:', {
        imgWidth,
        imgHeight,
        originalImgWidth: img.width,
        originalImgHeight: img.height,
        rotation,
        isRotated,
        markers
      });
      const pts = markers.map(m => ({
        x: m.x * imgWidth,
        y: m.y * imgHeight
      }));
      console.log('DEBUG WarpAndAnalyze - Computed pts JSON:', JSON.stringify(pts));
      console.log('DEBUG WarpAndAnalyze - Markers JSON:', JSON.stringify(markers));

      // Create destination canvas for warped ortho-image (500x500 pixels = 100cm x 100cm)
      const destWidth = 500;
      const destHeight = 500;
      const destCanvas = document.createElement('canvas');
      destCanvas.width = destWidth;
      destCanvas.height = destHeight;
      const dCtx = destCanvas.getContext('2d');
      const destImgData = dCtx.createImageData(destWidth, destHeight);
      const destData = destImgData.data;

      // 2. Perform bilinear inverse-perspective warping
      // pts: 0: TL, 1: TR, 2: BR, 3: BL
      for (let yd = 0; yd < destHeight; yd++) {
        for (let xd = 0; xd < destWidth; xd++) {
          const u = xd / (destWidth - 1);
          const v = yd / (destHeight - 1);

          // Bilinear interpolation equations
          const xs = Math.round(
            (1 - u) * (1 - v) * pts[0].x +
            u * (1 - v) * pts[1].x +
            u * v * pts[2].x +
            (1 - u) * v * pts[3].x
          );

          const ys = Math.round(
            (1 - u) * (1 - v) * pts[0].y +
            u * (1 - v) * pts[1].y +
            u * v * pts[2].y +
            (1 - u) * v * pts[3].y
          );

          // Boundary check
          let r = 255, g = 255, b = 255, a = 255;
          if (xs >= 0 && xs < imgWidth && ys >= 0 && ys < imgHeight) {
            const index = (ys * imgWidth + xs) * 4;
            r = srcData[index];
            g = srcData[index + 1];
            b = srcData[index + 2];
            a = srcData[index + 3];
          }

          const destIndex = (yd * destWidth + xd) * 4;
          destData[destIndex] = r;
          destData[destIndex + 1] = g;
          destData[destIndex + 2] = b;
          destData[destIndex + 3] = a;
        }
      }
      dCtx.putImageData(destImgData, 0, 0);

      // Apply chroma key on the warped 500x500 image directly (48x fewer pixels to process!)
      if (chromaMode !== 'none') {
        const destImgDataWarped = dCtx.getImageData(0, 0, destWidth, destHeight);
        const dData = destImgDataWarped.data;
        const tol = Number(tolerance);
        
        for (let i = 0; i < dData.length; i += 4) {
          const r = dData[i];
          const g = dData[i + 1];
          const b = dData[i + 2];
          let match = false;
          if (chromaMode === 'green') {
            match = g > 75 && g - r > tol - 40 && g - b > tol - 40;
          } else if (chromaMode === 'blue') {
            match = b > 75 && b - r > tol - 40 && b - g > tol - 40;
          }
          if (match) {
            dData[i] = 255; dData[i + 1] = 255; dData[i + 2] = 255; dData[i + 3] = 255;
          }
        }
        dCtx.putImageData(destImgDataWarped, 0, 0);
      }

      const warpedDataURL = destCanvas.toDataURL('image/jpeg', 0.85);
      setWarpedImageSrc(warpedDataURL);

      // Create a small low-res thumbnail specifically for the Gemini AI analysis payload
      // This reduces payload size from ~80KB to ~10KB, making API requests nearly instant!
      const aiCanvas = document.createElement('canvas');
      aiCanvas.width = 250;
      aiCanvas.height = 250;
      const aiCtx = aiCanvas.getContext('2d');
      aiCtx.drawImage(destCanvas, 0, 0, 250, 250);
      const aiDataURL = aiCanvas.toDataURL('image/jpeg', 0.5);

      // 3. Call AI Analysis API with the compressed thumbnail
      const aiResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: aiDataURL, categoryHint: category })
      });

      if (!aiResponse.ok) {
        let errMsg = 'Gemini API 분석 요청 실패';
        try {
          const errData = await aiResponse.json();
          if (errData.error) errMsg = `AI 분석 오류: ${errData.error}`;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const aiData = await aiResponse.json();

      // Defensive parsing to prevent crashes from incomplete AI JSON structures
      const detectedCategory = aiData.category || '상의';
      const detectedColor = aiData.color || '네이비';
      const detectedStyle = aiData.style || '체육복';
      const ms = aiData.measurements || {};
      const gl = aiData.guidelines || {};

      // Populate form values
      setName(`${detectedStyle} ${detectedCategory} (자동 태깅)`);
      setCategory(detectedCategory);
      setColor(detectedColor);
      setStyle(detectedStyle);

      // Initialize handle coordinates based on Gemini analysis
      if (detectedCategory === '하의') {
        const w_half = ms.waist ? Number(ms.waist) / 2 : 15;
        
        setLineHandles(prev => ({
          ...prev,
          waist: { x1: 50 - w_half, y1: gl.waist_y || 15, x2: 50 + w_half, y2: gl.waist_y || 15 },
          pantsLength: { x1: 50, y1: gl.length_start_y || 15, x2: 50, y2: gl.length_end_y || 92 }
        }));
      } else {
        const s_half = ms.shoulder ? Number(ms.shoulder) / 2 : 20;
        const c_half = ms.chest ? Number(ms.chest) / 2 : 23;
        
        setLineHandles(prev => ({
          ...prev,
          shoulder: { x1: 50 - s_half, y1: gl.shoulder_y || 20, x2: 50 + s_half, y2: gl.shoulder_y || 20 },
          chest: { x1: 50 - c_half, y1: gl.chest_y || 36, x2: 50 + c_half, y2: gl.chest_y || 36 },
          sleeve: { x1: 50 - s_half, y1: gl.shoulder_y || 20, x2: gl.sleeve_end_x || 12, y2: 48 },
          length: { x1: 50, y1: gl.length_start_y || 20, x2: 50, y2: gl.length_end_y || 88 }
        }));
      }

      setStep(3);
    } catch (e) {
      console.error(e);
      triggerToast(e.message || '이미지 처리 및 AI 분석 과정 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Drag Events for measurement coordinates
  const handleHandleStart = (line, point, e) => {
    e.preventDefault();
    setActiveHandle({ line, point });
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (!activeHandle) return;

      const container = workspaceRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      
      // Get pointer position (mouse or touch)
      let clientX, clientY;
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      // Calculate percentage inside container (clamped 0 to 100)
      const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));

      setLineHandles(prev => {
        const lineData = { ...prev[activeHandle.line] };
        if (activeHandle.point === '1') {
          lineData.x1 = Math.round(x);
          lineData.y1 = Math.round(y);
        } else {
          lineData.x2 = Math.round(x);
          lineData.y2 = Math.round(y);
        }
        return {
          ...prev,
          [activeHandle.line]: lineData
        };
      });
    };

    const handleEnd = () => {
      setActiveHandle(null);
    };

    if (activeHandle) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [activeHandle]);

  // Calculate live dimensions in cm (since W=100cm, H=100cm, 1% distance = 1cm)
  const getDistance = (line) => {
    const coords = lineHandles[line];
    if (!coords) return 0;
    const dist = Math.sqrt(Math.pow(coords.x2 - coords.x1, 2) + Math.pow(coords.y2 - coords.y1, 2));
    return Math.round(dist);
  };

  const getMeasurements = () => {
    if (category === '하의') {
      return {
        waist: getDistance('waist'),
        length: getDistance('pantsLength')
      };
    } else {
      return {
        shoulder: getDistance('shoulder'),
        chest: getDistance('chest'),
        sleeve: getDistance('sleeve'),
        length: getDistance('length')
      };
    }
  };

  // Convert coordinate handles to relative layout markers for dashboard overlays
  const getGuidelines = () => {
    if (category === '하의') {
      return {
        waist_y: lineHandles.waist.y1,
        length_start_y: lineHandles.pantsLength.y1,
        length_end_y: lineHandles.pantsLength.y2
      };
    } else {
      return {
        shoulder_y: lineHandles.shoulder.y1,
        chest_y: lineHandles.chest.y1,
        sleeve_start_x: lineHandles.sleeve.x1,
        sleeve_end_x: lineHandles.sleeve.x2,
        length_start_y: lineHandles.length.y1,
        length_end_y: lineHandles.length.y2
      };
    }
  };

  // Submit and Save Clothing item
  const handleSave = async () => {
    if (!name.trim()) {
      triggerToast('의류 명칭을 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Fetch clean warped image canvas blob
      const warpedBlob = await fetch(warpedImageSrc).then(r => r.blob());
      const file = new File([warpedBlob], 'clothing.jpg', { type: 'image/jpeg' });

      // 2. Upload photo to storage
      const uploadedUrl = await uploadImage(file, spaceCode);

      // 3. Save to database
      const dbPayload = {
        name,
        category,
        color,
        style,
        image_url: uploadedUrl,
        measurements: getMeasurements(),
        guidelines: getGuidelines()
      };

      await addCloth(spaceCode, dbPayload);
      
      triggerToast('옷장에 새 옷이 등록되었습니다!');
      
      // Delay and redirect to main dashboard
      setTimeout(() => {
        router.push('/');
      }, 1500);

    } catch (e) {
      console.error(e);
      triggerToast('데이터베이스 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Toast Alert */}
      {toastMessage && (
        <div className={styles.toast}>
          <Check size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Area */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <button 
            className={styles.backBtn}
            onClick={() => step > 1 ? setStep(step - 1) : router.push('/')}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className={styles.stepTitle}>
              {step === 1 && '옷 기증 사진 업로드'}
              {step === 2 && '✨ AI 의류 자동 스캐너'}
              {step === 3 && '📏 옷 사이즈 확인 및 저장하기'}
            </h1>
            <p className={styles.stepSubtitle}>
              {step === 1 && '기증받을 옷의 정면 사진을 올려주세요. (모바일 촬영 지원)'}
              {step === 2 && 'AI가 옷의 크기를 정확하게 잴 수 있도록 아래 3단계를 순서대로 진행해 주세요.'}
              {step === 3 && 'AI가 분석한 치수선 위치를 직접 맞춰서 정확한 사이즈를 확인하고 옷장에 추가합니다.'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="badge badge-available" style={{ fontSize: '12px', padding: '6px 12px' }}>
            옷장 코드: {spaceCode}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressBar}>
        <div className={styles.progress} style={{ width: `${(step / 3) * 100}%` }}></div>
      </div>

      {/* STEP 1: Upload or Capture */}
      {step === 1 && (
        <div className="fade-in">
          <label htmlFor="camera-upload">
            <div className={styles.uploadCard}>
              <div className={styles.uploadIcon}>
                <Camera size={36} />
              </div>
              <h2 className={styles.uploadTitle}>옷 정면 사진 촬영 또는 선택</h2>
              <p className={styles.uploadDesc}>
                모바일에서 터치 시 카메라 앱이 즉시 실행됩니다. 크로마키 초록색 박스 중앙에 옷을 예쁘게 펼쳐서 정면에서 촬영해주세요.
              </p>
              <button className="glow-btn" style={{ pointerEvents: 'none' }}>
                <Upload size={18} /> 사진 촬영하기
              </button>
              <button 
                id="mock-upload-btn"
                className="glow-btn-secondary" 
                style={{ marginTop: '10px', zIndex: 10 }}
                onClick={async (e) => {
                  e.preventDefault();
                  const blob = await fetch('/test.png').then(r => r.blob());
                  const file = new File([blob], 'test.png', { type: 'image/png' });
                  handleFileChange({ target: { files: [file] } });
                }}
              >
                [개발자 디버그] test.png 가상 업로드
              </button>
            </div>
            <input 
              id="camera-upload"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      )}

      {/* STEP 2: Calibration and Chroma Key removal */}
      {step === 2 && (
        <div className={`${styles.setupGrid} fade-in`}>
          {/* Main Calibration canvas wrapper */}
          <div className={`${styles.canvasContainer} scanning-container`} style={{ position: 'relative' }}>
            {/* Technical scanning brackets overlay */}
            <div className="scanning-bracket scanning-bracket-tl" />
            <div className="scanning-bracket scanning-bracket-tr" />
            <div className="scanning-bracket scanning-bracket-bl" />
            <div className="scanning-bracket scanning-bracket-br" />
            
            {/* Constant faint high-tech scan line overlay */}
            <div className="scannerOverlay" style={{ opacity: 0.15, border: 'none', background: 'transparent', animation: 'none' }}>
              <div className="scanLine" style={{ animationDuration: '3.5s', opacity: 0.7 }} />
            </div>

            <canvas 
              ref={displayCanvasRef}
              className={styles.interactiveCanvas}
              onClick={handleCanvasClick}
            />
            {isLoading && (
              <div className="scannerOverlay">
                <div className="scanLine" />
              </div>
            )}
          </div>

          {/* Control parameters */}
          <div className={`glass-panel ${styles.controlCard}`} style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div className={styles.controlStep}>
              <h3 className={styles.cardSectionTitle}>
                <Sliders size={16} /> [Step 1. 배경 지우기]
              </h3>
              <div className={styles.optionGrid}>
                {['green', 'blue', 'none'].map((mode) => (
                  <button
                    key={mode}
                    className={`${styles.optionButton} ${chromaMode === mode ? styles.optionButtonActive : ''}`}
                    onClick={() => setChromaMode(mode)}
                  >
                    {mode === 'green' && '초록색 배경'}
                    {mode === 'blue' && '파란색 배경'}
                    {mode === 'none' && '지우지 않기'}
                  </button>
                ))}
              </div>
              
              {chromaMode !== 'none' && (
                <div className={styles.sliderContainer}>
                  <div className={styles.sliderLabel}>
                    <span>배경 지우기 세기 조절</span>
                    <span>{tolerance}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '12px', width: '100%' }}>
                    <span style={{ fontSize: '14px', opacity: 0.6, flexShrink: 0 }}>☁️</span>
                    <input 
                      type="range"
                      min="10"
                      max="150"
                      value={tolerance}
                      onChange={(e) => setTolerance(e.target.value)}
                      className={styles.sliderInput}
                      style={{ flexGrow: 1 }}
                    />
                    <span style={{ fontSize: '14px', opacity: 0.6, flexShrink: 0 }}>☁️</span>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.controlStep}>
              <h3 className={styles.cardSectionTitle}>
                <RotateCw size={16} /> [Step 2. 사진 방향 맞추기]
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '8px', lineHeight: '1.4' }}>
                사진이 옆으로 돌아가 있다면 똑바로 눕도록 돌려 주세요:
              </p>
              <button 
                className="glow-btn-secondary" 
                style={{ width: '100%', marginTop: '10px', padding: '10px' }}
                onClick={handleRotate}
              >
                <RotateCw size={14} /> 시계 방향 90° 회전
              </button>
            </div>

            <div className={styles.controlStep}>
              <h3 className={styles.cardSectionTitle}>
                <Maximize2 size={16} /> [Step 3. 실제 크기 측정 기준점 찍기] ({markers.length}/4)
              </h3>
              <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px', marginBottom: '12px', lineHeight: '1.5' }}>
                촬영 박스 내의 실제 가로/세로 100cm 꼭짓점 4곳을 깜빡이는 미니맵에 맞게 순서대로 클릭하세요:
              </p>
              
              <div className={styles.markerInfoList}>
                {markerLabels.map((lbl, idx) => (
                  <div key={idx} className={`${styles.markerItem} ${markers.length === idx ? styles.markerItemActive : ''}`}>
                    {renderMinimap(idx)}
                    <div className={`
                      ${styles.markerDot} 
                      ${markers.length === idx ? styles.markerDotActive : ''} 
                      ${markers.length > idx ? styles.markerDotFilled : ''}
                    `} />
                    <span>{lbl}</span>
                  </div>
                ))}
              </div>

              {markers.length > 0 && (
                <button 
                  className="glow-btn-secondary" 
                  style={{ width: '100%', marginTop: '15px', padding: '10px' }}
                  onClick={resetMarkers}
                >
                  <RotateCcw size={14} /> 모서리 다시 지정
                </button>
              )}
            </div>

            <div style={{ marginTop: 'auto' }}>
              <button 
                className={`${styles.ctaButton} glow-btn`}
                style={{ width: '100%' }}
                disabled={markers.length < 4 || isLoading}
                onClick={handleWarpAndAnalyze}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} /> 원근 보정 및 AI 분석 중...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} /> ✨ AI 치수 분석 및 스캔 완료하기
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Edit attributes & adjust measurements */}
      {step === 3 && (
        <div className={`${styles.workspaceGrid} fade-in`}>
          {/* Draggable handle interface overlaid on warped canvas */}
          <div className={`${styles.editorCanvasContainer} scanning-container`} ref={workspaceRef}>
            {/* Technical scanning brackets overlay */}
            <div className="scanning-bracket scanning-bracket-tl" />
            <div className="scanning-bracket scanning-bracket-tr" />
            <div className="scanning-bracket scanning-bracket-bl" />
            <div className="scanning-bracket scanning-bracket-br" />

            {/* The corrected orthophoto */}
            <img 
              src={warpedImageSrc} 
              alt="Warped Clothing" 
              className={styles.editorCanvas}
              draggable={false}
            />

            {/* Draggable handles SVG and HTML layer */}
            <svg 
              width="100%" 
              height="100%" 
              viewBox="0 0 100 100" 
              style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
            >
              {category === '하의' ? (
                <>
                  {/* Waist Line */}
                  <line 
                    x1={lineHandles.waist.x1} y1={lineHandles.waist.y1} 
                    x2={lineHandles.waist.x2} y2={lineHandles.waist.y2}
                    stroke="hsl(var(--neon-chest))" strokeWidth="1.2" strokeDasharray="2,2"
                  />
                  {/* Pants Length Line */}
                  <line 
                    x1={lineHandles.pantsLength.x1} y1={lineHandles.pantsLength.y1} 
                    x2={lineHandles.pantsLength.x2} y2={lineHandles.pantsLength.y2}
                    stroke="hsl(var(--neon-length))" strokeWidth="1.2" strokeDasharray="2,2"
                  />
                </>
              ) : (
                <>
                  {/* Shoulder Line */}
                  <line 
                    x1={lineHandles.shoulder.x1} y1={lineHandles.shoulder.y1} 
                    x2={lineHandles.shoulder.x2} y2={lineHandles.shoulder.y2}
                    stroke="hsl(var(--neon-shoulder))" strokeWidth="1.2" strokeDasharray="2,2"
                  />
                  {/* Chest Line */}
                  <line 
                    x1={lineHandles.chest.x1} y1={lineHandles.chest.y1} 
                    x2={lineHandles.chest.x2} y2={lineHandles.chest.y2}
                    stroke="hsl(var(--neon-chest))" strokeWidth="1.2" strokeDasharray="2,2"
                  />
                  {/* Sleeve Line */}
                  <line 
                    x1={lineHandles.sleeve.x1} y1={lineHandles.sleeve.y1} 
                    x2={lineHandles.sleeve.x2} y2={lineHandles.sleeve.y2}
                    stroke="hsl(var(--neon-sleeve))" strokeWidth="1.2" strokeDasharray="2,2"
                  />
                  {/* Length Line */}
                  <line 
                    x1={lineHandles.length.x1} y1={lineHandles.length.y1} 
                    x2={lineHandles.length.x2} y2={lineHandles.length.y2}
                    stroke="hsl(var(--neon-length))" strokeWidth="1.2" strokeDasharray="2,2"
                  />
                </>
              )}
            </svg>

            {/* Render touch handles on top */}
            {category === '하의' ? (
              <>
                {/* Waist Handles */}
                <div 
                  className={styles.draggableHandle} 
                  style={{ position: 'absolute', left: `${lineHandles.waist.x1}%`, top: `${lineHandles.waist.y1}%`, transform: 'translate(-50%, -50%)', width: '16px', height: '16px', borderRadius: '50%', border: '2px solid white', background: 'hsl(var(--neon-chest))', cursor: 'pointer', boxShadow: '0 0 6px rgba(0,0,0,0.5)' }}
                  onMouseDown={(e) => handleHandleStart('waist', '1', e)}
                  onTouchStart={(e) => handleHandleStart('waist', '1', e)}
                />
                <div 
                  className={styles.draggableHandle} 
                  style={{ position: 'absolute', left: `${lineHandles.waist.x2}%`, top: `${lineHandles.waist.y2}%`, transform: 'translate(-50%, -50%)', width: '16px', height: '16px', borderRadius: '50%', border: '2px solid white', background: 'hsl(var(--neon-chest))', cursor: 'pointer', boxShadow: '0 0 6px rgba(0,0,0,0.5)' }}
                  onMouseDown={(e) => handleHandleStart('waist', '2', e)}
                  onTouchStart={(e) => handleHandleStart('waist', '2', e)}
                />
                {/* Length Handles */}
                <div 
                  className={styles.draggableHandle} 
                  style={{ position: 'absolute', left: `${lineHandles.pantsLength.x1}%`, top: `${lineHandles.pantsLength.y1}%`, transform: 'translate(-50%, -50%)', width: '16px', height: '16px', borderRadius: '50%', border: '2px solid white', background: 'hsl(var(--neon-length))', cursor: 'pointer', boxShadow: '0 0 6px rgba(0,0,0,0.5)' }}
                  onMouseDown={(e) => handleHandleStart('pantsLength', '1', e)}
                  onTouchStart={(e) => handleHandleStart('pantsLength', '1', e)}
                />
                <div 
                  className={styles.draggableHandle} 
                  style={{ position: 'absolute', left: `${lineHandles.pantsLength.x2}%`, top: `${lineHandles.pantsLength.y2}%`, transform: 'translate(-50%, -50%)', width: '16px', height: '16px', borderRadius: '50%', border: '2px solid white', background: 'hsl(var(--neon-length))', cursor: 'pointer', boxShadow: '0 0 6px rgba(0,0,0,0.5)' }}
                  onMouseDown={(e) => handleHandleStart('pantsLength', '2', e)}
                  onTouchStart={(e) => handleHandleStart('pantsLength', '2', e)}
                />
              </>
            ) : (
              <>
                {/* Shoulder Handles */}
                <div 
                  className={styles.draggableHandle} 
                  style={{ position: 'absolute', left: `${lineHandles.shoulder.x1}%`, top: `${lineHandles.shoulder.y1}%`, transform: 'translate(-50%, -50%)', width: '16px', height: '16px', borderRadius: '50%', border: '2px solid white', background: 'hsl(var(--neon-shoulder))', cursor: 'pointer', boxShadow: '0 0 6px rgba(0,0,0,0.5)' }}
                  onMouseDown={(e) => handleHandleStart('shoulder', '1', e)}
                  onTouchStart={(e) => handleHandleStart('shoulder', '1', e)}
                />
                <div 
                  className={styles.draggableHandle} 
                  style={{ position: 'absolute', left: `${lineHandles.shoulder.x2}%`, top: `${lineHandles.shoulder.y2}%`, transform: 'translate(-50%, -50%)', width: '16px', height: '16px', borderRadius: '50%', border: '2px solid white', background: 'hsl(var(--neon-shoulder))', cursor: 'pointer', boxShadow: '0 0 6px rgba(0,0,0,0.5)' }}
                  onMouseDown={(e) => handleHandleStart('shoulder', '2', e)}
                  onTouchStart={(e) => handleHandleStart('shoulder', '2', e)}
                />
                {/* Chest Handles */}
                <div 
                  className={styles.draggableHandle} 
                  style={{ position: 'absolute', left: `${lineHandles.chest.x1}%`, top: `${lineHandles.chest.y1}%`, transform: 'translate(-50%, -50%)', width: '16px', height: '16px', borderRadius: '50%', border: '2px solid white', background: 'hsl(var(--neon-chest))', cursor: 'pointer', boxShadow: '0 0 6px rgba(0,0,0,0.5)' }}
                  onMouseDown={(e) => handleHandleStart('chest', '1', e)}
                  onTouchStart={(e) => handleHandleStart('chest', '1', e)}
                />
                <div 
                  className={styles.draggableHandle} 
                  style={{ position: 'absolute', left: `${lineHandles.chest.x2}%`, top: `${lineHandles.chest.y2}%`, transform: 'translate(-50%, -50%)', width: '16px', height: '16px', borderRadius: '50%', border: '2px solid white', background: 'hsl(var(--neon-chest))', cursor: 'pointer', boxShadow: '0 0 6px rgba(0,0,0,0.5)' }}
                  onMouseDown={(e) => handleHandleStart('chest', '2', e)}
                  onTouchStart={(e) => handleHandleStart('chest', '2', e)}
                />
                {/* Sleeve Handles */}
                <div 
                  className={styles.draggableHandle} 
                  style={{ position: 'absolute', left: `${lineHandles.sleeve.x1}%`, top: `${lineHandles.sleeve.y1}%`, transform: 'translate(-50%, -50%)', width: '16px', height: '16px', borderRadius: '50%', border: '2px solid white', background: 'hsl(var(--neon-sleeve))', cursor: 'pointer', boxShadow: '0 0 6px rgba(0,0,0,0.5)' }}
                  onMouseDown={(e) => handleHandleStart('sleeve', '1', e)}
                  onTouchStart={(e) => handleHandleStart('sleeve', '1', e)}
                />
                <div 
                  className={styles.draggableHandle} 
                  style={{ position: 'absolute', left: `${lineHandles.sleeve.x2}%`, top: `${lineHandles.sleeve.y2}%`, transform: 'translate(-50%, -50%)', width: '16px', height: '16px', borderRadius: '50%', border: '2px solid white', background: 'hsl(var(--neon-sleeve))', cursor: 'pointer', boxShadow: '0 0 6px rgba(0,0,0,0.5)' }}
                  onMouseDown={(e) => handleHandleStart('sleeve', '2', e)}
                  onTouchStart={(e) => handleHandleStart('sleeve', '2', e)}
                />
                {/* Length Handles */}
                <div 
                  className={styles.draggableHandle} 
                  style={{ position: 'absolute', left: `${lineHandles.length.x1}%`, top: `${lineHandles.length.y1}%`, transform: 'translate(-50%, -50%)', width: '16px', height: '16px', borderRadius: '50%', border: '2px solid white', background: 'hsl(var(--neon-length))', cursor: 'pointer', boxShadow: '0 0 6px rgba(0,0,0,0.5)' }}
                  onMouseDown={(e) => handleHandleStart('length', '1', e)}
                  onTouchStart={(e) => handleHandleStart('length', '1', e)}
                />
                <div 
                  className={styles.draggableHandle} 
                  style={{ position: 'absolute', left: `${lineHandles.length.x2}%`, top: `${lineHandles.length.y2}%`, transform: 'translate(-50%, -50%)', width: '16px', height: '16px', borderRadius: '50%', border: '2px solid white', background: 'hsl(var(--neon-length))', cursor: 'pointer', boxShadow: '0 0 6px rgba(0,0,0,0.5)' }}
                  onMouseDown={(e) => handleHandleStart('length', '2', e)}
                  onTouchStart={(e) => handleHandleStart('length', '2', e)}
                />
              </>
            )}

            {isLoading && (
              <div className={styles.loadingOverlay}>
                <Loader2 className="animate-spin" size={36} color="hsl(var(--primary))" />
                <span className={styles.loadingText}>옷장 등록 진행 중...</span>
              </div>
            )}
          </div>

          {/* Form edit and save inputs */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 className={styles.cardSectionTitle}>
              <Check size={16} /> 📝 AI가 분석한 옷 정보
            </h3>

            <div className={styles.formGrid}>
              <div>
                <label className={styles.formLabel}>의류 명칭</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className={`input-field ${styles.adminInputField}`} 
                  placeholder="예: OOO초 체육복 상의"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label className={styles.formLabel}>카테고리</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className={`input-field ${styles.adminInputField}`}
                    style={{ appearance: 'auto' }}
                  >
                    <option value="상의">상의</option>
                    <option value="하의">하의</option>
                    <option value="아우터">아우터</option>
                    <option value="원피스/세트">원피스/세트</option>
                    <option value="기타(잡화)">기타(잡화)</option>
                  </select>
                </div>
                <div>
                  <label className={styles.formLabel}>의류 스타일</label>
                  <select 
                    value={style} 
                    onChange={(e) => setStyle(e.target.value)}
                    className={`input-field ${styles.adminInputField}`}
                    style={{ appearance: 'auto' }}
                  >
                    <option value="교복/생활복">교복/생활복</option>
                    <option value="체육복">체육복</option>
                    <option value="일상복">일상복</option>
                    <option value="기타(행사/특수복)">기타(행사/특수복)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={styles.formLabel}>색상</label>
                <input 
                  type="text" 
                  value={color} 
                  onChange={(e) => setColor(e.target.value)} 
                  className={`input-field ${styles.adminInputField}`}
                  placeholder="예: 네이비, 화이트, 블랙"
                />
              </div>
            </div>

            {/* CM measurement results cards */}
            <div className={styles.dimensionGrid}>
              {category === '하의' ? (
                <>
                  <div className={styles.dimensionBox}>
                    <span className={styles.dimensionName} style={{ borderLeft: '3px solid hsl(var(--neon-chest))', paddingLeft: '6px' }}>허리 단면</span>
                    <span className={styles.dimensionValue} style={{ color: 'hsl(var(--neon-chest))' }}>
                      {getDistance('waist')}<span className={styles.dimensionUnit}>cm</span>
                    </span>
                  </div>
                  <div className={styles.dimensionBox}>
                    <span className={styles.dimensionName} style={{ borderLeft: '3px solid hsl(var(--neon-length))', paddingLeft: '6px' }}>바지 총장</span>
                    <span className={styles.dimensionValue} style={{ color: 'hsl(var(--neon-length))' }}>
                      {getDistance('pantsLength')}<span className={styles.dimensionUnit}>cm</span>
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.dimensionBox}>
                    <span className={styles.dimensionName} style={{ borderLeft: '3px solid hsl(var(--neon-shoulder))', paddingLeft: '6px' }}>어깨 너비</span>
                    <span className={styles.dimensionValue} style={{ color: 'hsl(var(--neon-shoulder))' }}>
                      {getDistance('shoulder')}<span className={styles.dimensionUnit}>cm</span>
                    </span>
                  </div>
                  <div className={styles.dimensionBox}>
                    <span className={styles.dimensionName} style={{ borderLeft: '3px solid hsl(var(--neon-chest))', paddingLeft: '6px' }}>가슴 단면</span>
                    <span className={styles.dimensionValue} style={{ color: 'hsl(var(--neon-chest))' }}>
                      {getDistance('chest')}<span className={styles.dimensionUnit}>cm</span>
                    </span>
                  </div>
                  <div className={styles.dimensionBox}>
                    <span className={styles.dimensionName} style={{ borderLeft: '3px solid hsl(var(--neon-sleeve))', paddingLeft: '6px' }}>소매 길이</span>
                    <span className={styles.dimensionValue} style={{ color: 'hsl(var(--neon-sleeve))' }}>
                      {getDistance('sleeve')}<span className={styles.dimensionUnit}>cm</span>
                    </span>
                  </div>
                  <div className={styles.dimensionBox}>
                    <span className={styles.dimensionName} style={{ borderLeft: '3px solid hsl(var(--neon-length))', paddingLeft: '6px' }}>의류 총장</span>
                    <span className={styles.dimensionValue} style={{ color: 'hsl(var(--neon-length))' }}>
                      {getDistance('length')}<span className={styles.dimensionUnit}>cm</span>
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className={styles.markerItem} style={{ background: 'hsl(var(--muted)/0.3)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px dashed hsl(var(--border))', alignItems: 'center' }}>
              <span style={{ fontSize: '18px', marginRight: '8px', lineHeight: '1' }}>💡</span>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', lineHeight: '1.5', margin: 0 }}>
                화면 좌측 이미지의 동그라미 조절점(●)을 마우스나 손가락으로 드래그하면 실측 치수가 실시간으로 갱신됩니다.
              </p>
            </div>

            <div className={styles.actionRow}>
              <button 
                className="glow-btn-secondary" 
                style={{ flex: 1 }}
                onClick={() => setStep(2)}
                disabled={isLoading}
              >
                재보정하기
              </button>
              <button 
                className={`glow-btn ${styles.saveButton}`} 
                style={{ flex: 1.5 }}
                onClick={handleSave}
                disabled={isLoading}
              >
                <Save size={16} /> ✨ 이 옷 옷장에 넣기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
