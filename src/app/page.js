'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, Search, SlidersHorizontal, RefreshCw, Smartphone, 
  MapPin, Check, QrCode, ClipboardList, Ruler, Info, ShoppingBag, Trash2, X,
  Loader2
} from 'lucide-react';
import styles from './dashboard.module.css';
import { getClothes, reserveCloth, deleteCloth } from '../lib/db';
import { getCurrentUser, awardUserXP } from '../lib/auth';
import GamificationBar from '../components/GamificationBar';
import AuthModal from '../components/AuthModal';
import BadgeModal from '../components/BadgeModal';

export default function DashboardPage() {
  const router = useRouter();
  
  // Gamification & User Auth States
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  // Wardrobe Space Code
  const [spaceCode, setSpaceCode] = useState('');
  const [enteredSpaceCode, setEnteredSpaceCode] = useState('');
  const [isSpaceLoaded, setIsSpaceLoaded] = useState(false);

  // Clothes Database & Loading
  const [clothes, setClothes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedStyle, setSelectedStyle] = useState('전체');
  const [selectedStatus, setSelectedStatus] = useState('전체');

  // Child Size Matcher & AI Matching active state
  const [isAiMatchingActive, setIsAiMatchingActive] = useState(false);
  const [childSize, setChildSize] = useState({
    height: '',
    weight: '',
    shoulder: '',
    chest: '',
    waist: '',
    length: ''
  });

  // AI Outfit Recommendations
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [isRecommendLoading, setIsRecommendLoading] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [isOutfitReserveModalOpen, setIsOutfitReserveModalOpen] = useState(false);

  // Active Interactive Modal
  const [selectedCloth, setSelectedCloth] = useState(null);
  const [hoveredSpec, setHoveredSpec] = useState(null); // 'shoulder', 'chest', 'sleeve', 'length', 'waist'

  // Modals visibility
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);

  // Try-On States & Refs
  const [isTryOnActive, setIsTryOnActive] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [isPoseTrackingActive, setIsPoseTrackingActive] = useState(false);
  const [isPoseModelLoading, setIsPoseModelLoading] = useState(false);
  const [tryOnScale, setTryOnScale] = useState(1.0);
  const [tryOnOffset, setTryOnOffset] = useState({ x: 0, y: 0 });
  const [isFlashing, setIsFlashing] = useState(false);
  const [facingMode, setFacingMode] = useState('user'); 
  const [cameraZoom, setCameraZoom] = useState(1.0);
  const [transparentImageUrl, setTransparentImageUrl] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);

  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const streamRef = React.useRef(null);
  const poseDetectionLoopRef = React.useRef(null);

  // Reservation Info
  const [reserveName, setReserveName] = useState('');
  const [reserveGrade, setReserveGrade] = useState('');
  const [reservePhone, setReservePhone] = useState('');

  const startCamera = async (currentFacing = facingMode) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 640, facingMode: currentFacing },
        audio: false
      });
      streamRef.current = stream;
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => {
          console.warn("Auto-play failed, retrying programmatically:", err);
        });
      }
      setHasCameraPermission(true);
      setIsTryOnActive(true);
      setTryOnScale(1.0);
      setTryOnOffset({ x: 0, y: 0 });
    } catch (err) {
      console.error("Camera stream access failed:", err);
      setHasCameraPermission(false);
      triggerToast("카메라 연결에 실패했습니다. 권한을 확인해주세요.");
    }
  };

  const toggleFacingMode = () => {
    if (poseDetectionLoopRef.current) {
      cancelAnimationFrame(poseDetectionLoopRef.current);
      poseDetectionLoopRef.current = null;
    }
    setIsPoseTrackingActive(false);

    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const stopCamera = () => {
    if (poseDetectionLoopRef.current) {
      cancelAnimationFrame(poseDetectionLoopRef.current);
      poseDetectionLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsTryOnActive(false);
    setIsPoseTrackingActive(false);
  };

  const closeDetailModal = () => {
    stopCamera();
    setSelectedCloth(null);
  };

  useEffect(() => {
    if (isTryOnActive && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(err => {
        console.warn("Auto-play blocked, retrying programmatically:", err);
      });
    }
  }, [isTryOnActive, cameraStream]);

  const processNukki = (imageUrl) => {
    if (!imageUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const width = canvas.width;
        const height = canvas.height;

        // 1. Sample border pixels to compute average background color
        let sampleR = 0, sampleG = 0, sampleB = 0, sampleCount = 0;
        const sampleCoords = [
          [5, 5], [width - 5, 5], [5, height - 5], [width - 5, height - 5],
          [Math.floor(width / 2), 5], [Math.floor(width / 2), height - 5],
          [5, Math.floor(height / 2)], [width - 5, Math.floor(height / 2)]
        ];

        for (const [sx, sy] of sampleCoords) {
          const sIdx = (sy * width + sx) * 4;
          sampleR += data[sIdx];
          sampleG += data[sIdx + 1];
          sampleB += data[sIdx + 2];
          sampleCount++;
        }

        const bgR = sampleR / sampleCount;
        const bgG = sampleG / sampleCount;
        const bgB = sampleB / sampleCount;

        // 2. BFS from border pixels to remove background
        const queue = [];
        const visited = new Uint8Array(width * height);

        for (let x = 0; x < width; x++) {
          queue.push([x, 0]);
          queue.push([x, height - 1]);
          visited[0 * width + x] = 1;
          visited[(height - 1) * width + x] = 1;
        }
        for (let y = 1; y < height - 1; y++) {
          queue.push([0, y]);
          queue.push([width - 1, y]);
          visited[y * width + 0] = 1;
          visited[y * width + (width - 1)] = 1;
        }

        let head = 0;
        while (head < queue.length) {
          const [cx, cy] = queue[head++];
          const idx = (cy * width + cx) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          if (a === 0) continue;

          const lum = (r + g + b) / 3;
          const sat = Math.max(r, g, b) - Math.min(r, g, b);
          const colorDist = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);

          // Background pixel condition: strictly connected to outer border with background color match
          const isBg = (colorDist < 60) || (lum > 235 && sat < 25);

          if (isBg) {
            data[idx + 3] = 0; // Make transparent

            const neighbors = [
              [cx + 1, cy],
              [cx - 1, cy],
              [cx, cy + 1],
              [cx, cy - 1]
            ];
            for (const [nx, ny] of neighbors) {
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nidx = ny * width + nx;
                if (!visited[nidx]) {
                  visited[nidx] = 1;
                  queue.push([nx, ny]);
                }
              }
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        setTransparentImageUrl(canvas.toDataURL('image/png'));
      } catch (err) {
        console.warn("Canvas pixel read error (CORS):", err);
        setTransparentImageUrl(imageUrl);
      }
    };
    img.onerror = () => {
      setTransparentImageUrl(imageUrl);
    };
    if (imageUrl.startsWith('data:')) {
      img.src = imageUrl;
    } else {
      img.src = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
    }
  };

  useEffect(() => {
    if (selectedCloth) {
      processNukki(selectedCloth.image_url);
    } else {
      setTransparentImageUrl(null);
    }
  }, [selectedCloth]);

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    });
  };

  const startPoseTracking = async () => {
    if (isPoseTrackingActive) {
      setIsPoseTrackingActive(false);
      if (poseDetectionLoopRef.current) {
        cancelAnimationFrame(poseDetectionLoopRef.current);
        poseDetectionLoopRef.current = null;
      }
      return;
    }

    setIsPoseModelLoading(true);
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs');
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/posenet');
      await new Promise(r => setTimeout(r, 100)); // Ensure script globals register
      
      const net = await window.posenet.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        inputResolution: { width: 257, height: 257 },
        multiplier: 0.5
      });
      
      setIsPoseModelLoading(false);
      setIsPoseTrackingActive(true);
      
      const detectPose = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          poseDetectionLoopRef.current = requestAnimationFrame(detectPose);
          return;
        }

        try {
          const pose = await net.estimateSinglePose(videoRef.current, {
            flipHorizontal: facingMode === 'user'
          });

          if (pose && pose.keypoints) {
            const keypoints = pose.keypoints;
            const vidW = videoRef.current.videoWidth || videoRef.current.width || 640;
            const vidH = videoRef.current.videoHeight || videoRef.current.height || 640;
            
            if (selectedCloth.category === '하의') {
              const leftHip = keypoints.find(k => k.part === 'leftHip');
              const rightHip = keypoints.find(k => k.part === 'rightHip');
              
              if (leftHip && rightHip && leftHip.position.x > 5 && rightHip.position.x > 5 && (leftHip.score > 0.05 || rightHip.score > 0.05)) {
                const midX = (leftHip.position.x + rightHip.position.x) / 2;
                const midY = (leftHip.position.y + rightHip.position.y) / 2;
                const width = Math.abs(leftHip.position.x - rightHip.position.x);

                const normX = midX / vidW;
                const normY = midY / vidH;
                const normW = width / vidW;

                const percentX = Math.max(-42, Math.min(42, normX * 100 - 50));
                const percentY = Math.max(-42, Math.min(42, normY * 100 - 45));
                const targetScale = Math.max(0.35, Math.min(2.5, normW / 0.20));

                setTryOnOffset(prev => ({
                  x: prev.x * 0.6 + percentX * 0.4,
                  y: prev.y * 0.6 + percentY * 0.4
                }));
                setTryOnScale(prev => prev * 0.6 + targetScale * 0.4);
              }
            } else {
              const leftShoulder = keypoints.find(k => k.part === 'leftShoulder');
              const rightShoulder = keypoints.find(k => k.part === 'rightShoulder');
              const leftEye = keypoints.find(k => k.part === 'leftEye');
              const rightEye = keypoints.find(k => k.part === 'rightEye');
              const nose = keypoints.find(k => k.part === 'nose');

              let midX = 0, midY = 0, width = 0;
              let hasMatch = false;

              if (leftShoulder && rightShoulder && leftShoulder.position.x > 5 && rightShoulder.position.x > 5 && (leftShoulder.score > 0.08 || rightShoulder.score > 0.08)) {
                midX = (leftShoulder.position.x + rightShoulder.position.x) / 2;
                midY = (leftShoulder.position.y + rightShoulder.position.y) / 2;
                width = Math.abs(leftShoulder.position.x - rightShoulder.position.x);
                hasMatch = true;
              } else if (leftEye && rightEye && nose && leftEye.position.x > 5 && rightEye.position.x > 5) {
                const eyeDist = Math.abs(leftEye.position.x - rightEye.position.x);
                midX = nose.position.x;
                midY = nose.position.y + eyeDist * 1.6;
                width = eyeDist * 2.8;
                hasMatch = true;
              }

              if (hasMatch && width > 5) {
                const normX = midX / vidW;
                const normY = midY / vidH;
                const normW = width / vidW;

                const percentX = Math.max(-42, Math.min(42, normX * 100 - 50));
                const percentY = Math.max(-42, Math.min(42, normY * 100 - 28));
                const targetScale = Math.max(0.35, Math.min(2.5, normW / 0.18));

                setTryOnOffset(prev => ({
                  x: prev.x * 0.6 + percentX * 0.4,
                  y: prev.y * 0.6 + percentY * 0.4
                }));
                setTryOnScale(prev => prev * 0.6 + targetScale * 0.4);
              }
            }
          }
        } catch (e) {
          console.error("Pose tracking frame estimation failed:", e);
        }

        poseDetectionLoopRef.current = requestAnimationFrame(detectPose);
      };

      detectPose();
    } catch (err) {
      console.error("Failed to load PoseNet model:", err);
      setIsPoseModelLoading(false);
      triggerToast("AI 모델 초기화 실패. 수동 조절 모드를 이용해주세요.");
    }
  };

  const captureTryOn = () => {
    if (!videoRef.current || !selectedCloth) return;

    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 500);

    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.warn("Audio Context beep error:", e);
    }

    const video = videoRef.current;
    const container = video.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext('2d');

    // Calculate exact crop matching object-fit: cover on screen
    const vWidth = video.videoWidth || 640;
    const vHeight = video.videoHeight || 640;
    const containerAspect = rect.width / rect.height;
    const videoAspect = vWidth / vHeight;

    let sx, sy, sw, sh;
    if (videoAspect > containerAspect) {
      sh = vHeight;
      sw = vHeight * containerAspect;
      sx = (vWidth - sw) / 2;
      sy = 0;
    } else {
      sw = vWidth;
      sh = vWidth / containerAspect;
      sx = 0;
      sy = (vHeight - sh) / 2;
    }

    ctx.save();
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const drawWidth = canvas.width * 0.7 * tryOnScale;
      const drawHeight = drawWidth;

      const overlayLeft = ((50 + tryOnOffset.x) / 100) * canvas.width;
      const overlayTop = ((50 + tryOnOffset.y) / 100) * canvas.height;

      const x = overlayLeft - drawWidth / 2;
      const y = overlayTop - drawHeight / 2;

      ctx.drawImage(img, x, y, drawWidth, drawHeight);

      const link = document.createElement('a');
      link.download = `fitshare_tryon_${selectedCloth.name.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      const xpResult = awardUserXP(30, 'try_on');
      if (xpResult.user) {
        setCurrentUser(xpResult.user);
        triggerToast("📸 피팅 샷 저장 완료! (+30 XP 획득)");
        if (xpResult.unlockedBadges && xpResult.unlockedBadges.length > 0) {
          const bName = xpResult.unlockedBadges[0].name;
          setTimeout(() => triggerToast(`🎉 축하합니다! '${bName}' 배지를 해금하셨습니다!`), 1200);
        }
      } else {
        triggerToast("📸 피팅 사진이 성공적으로 저장되었습니다!");
      }
    };
    img.src = transparentImageUrl || selectedCloth.image_url;
  };

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load space code on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fitshare_active_space');
      if (saved) {
        setSpaceCode(saved);
        setEnteredSpaceCode(saved);
        setIsSpaceLoaded(true);
      }
    }
  }, []);

  // Fetch clothes whenever spaceCode changes
  useEffect(() => {
    if (!spaceCode) return;
    loadClothes();
  }, [spaceCode]);

  const loadClothes = async () => {
    setIsLoading(true);
    try {
      const data = await getClothes(spaceCode);
      setClothes(data);
    } catch (e) {
      console.error(e);
      triggerToast('옷장 정보를 불러오는 데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSpace = (e) => {
    e.preventDefault();
    const code = enteredSpaceCode.trim() || 'default-wardrobe';
    localStorage.setItem('fitshare_active_space', code);
    setSpaceCode(code);
    setIsSpaceLoaded(true);
    triggerToast(`'${code}' 옷장에 접속했습니다.`);
  };

  const handleJoinDemo = () => {
    localStorage.setItem('fitshare_active_space', 'default-wardrobe');
    setSpaceCode('default-wardrobe');
    setEnteredSpaceCode('default-wardrobe');
    setIsSpaceLoaded(true);
    triggerToast(`'default-wardrobe' 데모 옷장에 접속했습니다.`);
  };

  const handleLeaveSpace = () => {
    localStorage.removeItem('fitshare_active_space');
    setSpaceCode('');
    setIsSpaceLoaded(false);
    setClothes([]);
  };

  // Auto-estimate children's flat measurements based on Height & Weight
  useEffect(() => {
    const h = Number(childSize.height);
    const w = Number(childSize.weight);
    
    if (h > 0) {
      // Standard empirical equations for Korean primary school children
      const estShoulder = Math.round(h * 0.27); // 120cm -> 32cm
      const estChest = Math.round(h * 0.35);    // 120cm -> 42cm
      const estWaist = w > 0 ? Math.round(w * 0.7 + 8) : Math.round(h * 0.22); // 25kg -> 25.5cm
      const estPantsLength = Math.round(h * 0.58); // 120cm -> 70cm
      
      setChildSize(prev => ({
        ...prev,
        shoulder: prev.shoulder === '' || prev.autoPopulated ? estShoulder : prev.shoulder,
        chest: prev.chest === '' || prev.autoPopulated ? estChest : prev.chest,
        waist: prev.waist === '' || prev.autoPopulated ? estWaist : prev.waist,
        length: prev.length === '' || prev.autoPopulated ? estPantsLength : prev.length,
        autoPopulated: true
      }));
    }
  }, [childSize.height, childSize.weight]);

  const handleSizeInput = (field, val) => {
    setChildSize(prev => ({
      ...prev,
      [field]: val,
      autoPopulated: field === 'height' || field === 'weight' ? prev.autoPopulated : false
    }));
  };

  const handleClearSizes = () => {
    setChildSize({ height: '', weight: '', shoulder: '', chest: '', waist: '', length: '' });
    setIsAiMatchingActive(false);
  };

  const fetchOutfitRecommendations = async (compatibleItems) => {
    if (compatibleItems.length === 0) {
      setAiRecommendations([]);
      return;
    }
    setIsRecommendLoading(true);
    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          clothes: compatibleItems, 
          childSize: childSize 
        })
      });
      if (response.ok) {
        const data = await response.json();
        setAiRecommendations(data);
      } else {
        console.warn('Failed to fetch outfit recommendations');
        setAiRecommendations([]);
      }
    } catch (e) {
      console.error(e);
      setAiRecommendations([]);
    } finally {
      setIsRecommendLoading(false);
    }
  };

  useEffect(() => {
    if (!isAiMatchingActive) {
      setAiRecommendations([]);
      return;
    }
    
    const compatibleItems = clothes.filter(item => {
      if (item.status !== 'available') return false;
      const comp = checkCompatibility(item);
      return !comp || comp.status === 'fit' || comp.status === 'loose';
    });
    
    fetchOutfitRecommendations(compatibleItems);
  }, [isAiMatchingActive, childSize.height, childSize.weight, clothes]);

  // Get compatibility score & message for a specific garment
  const checkCompatibility = (item) => {
    const s_child = Number(childSize.shoulder);
    const c_child = Number(childSize.chest);
    const w_child = Number(childSize.waist);
    const l_child = Number(childSize.length);

    if (!s_child && !c_child && !w_child && !l_child) return null;

    const ms = item.measurements;
    
    if (item.category === '상의' || item.category === '아우터') {
      if (!s_child || !c_child) return null;
      
      // Too small check
      if (ms.shoulder < s_child || ms.chest < c_child) {
        return { status: 'too-small', label: '작음 (불편함)', color: '#ef4444' };
      }
      // Just right
      if (ms.shoulder <= s_child + 2 && ms.chest <= c_child + 3) {
        return { status: 'fit', label: '예쁘게 잘 맞음', color: '#4ade80' };
      }
      // Grow room
      if (ms.shoulder <= s_child + 6 && ms.chest <= c_child + 8) {
        return { status: 'loose', label: '여유로움 (성장 대비)', color: '#fbbf24' };
      }
      // Too big
      return { status: 'too-large', label: '너무 큼 (비추천)', color: '#a855f7' };
    }

    if (item.category === '하의') {
      if (!w_child || !l_child) return null;

      // Too small
      if (ms.waist < w_child - 2 || ms.length < l_child - 3) {
        return { status: 'too-small', label: '작음 (길이/품 부족)', color: '#ef4444' };
      }
      // Just right
      if (ms.waist <= w_child + 2 && ms.length >= l_child - 1 && ms.length <= l_child + 3) {
        return { status: 'fit', label: '예쁘게 잘 맞음', color: '#4ade80' };
      }
      // Grow room
      if (ms.waist <= w_child + 4 && ms.length <= l_child + 8) {
        return { status: 'loose', label: '여유로움 (성장 대비)', color: '#fbbf24' };
      }
      // Too big
      return { status: 'too-large', label: '너무 큼 (기장 김)', color: '#a855f7' };
    }

    return null;
  };

  // Filter clothes
  const filteredClothes = clothes.filter(item => {
    // Search filter
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.color.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Dropdown filters
    const matchesCategory = selectedCategory === '전체' || item.category === selectedCategory;
    const matchesStyle = selectedStyle === '전체' || item.style === selectedStyle;
    const matchesStatus = selectedStatus === '전체' || item.status === selectedStatus;

    // Sizing filter
    const comp = checkCompatibility(item);
    const matchesSize = !isAiMatchingActive || !childSize.height || !comp || 
                        (comp.status === 'fit' || comp.status === 'loose');

    return matchesSearch && matchesCategory && matchesStyle && matchesStatus && matchesSize;
  });

  // Smart Outfit Recommendation Algorithm
  const getOutfitRecommendations = () => {
    const availableTops = clothes.filter(i => i.status === 'available' && (i.category === '상의' || i.category === '아우터'));
    const availableBottoms = clothes.filter(i => i.status === 'available' && i.category === '하의');
    
    const recommendations = [];

    availableTops.forEach(top => {
      availableBottoms.forEach(bottom => {
        // Calculate estimated height tier for top and bottom
        const topEstHeight = Math.round(top.measurements.shoulder / 0.27);
        const bottomEstHeight = Math.round(bottom.measurements.length / 0.58);

        // 1. Size Compatibility (should fit the same height tier within 12cm margin)
        const sizeCompatible = Math.abs(topEstHeight - bottomEstHeight) <= 12;

        // 2. Style Compatibility (Uniform sets or Gym sets are highly compatible)
        const styleCompatible = top.style === bottom.style;

        // 3. Color Harmony (Navy + Navy, Navy + White, Gray + White, etc.)
        const colors = [top.color, bottom.color];
        const colorCompatible = 
          top.color === bottom.color || 
          (colors.includes('네이비') && colors.includes('화이트')) ||
          (colors.includes('다크그레이') && colors.includes('화이트')) ||
          (colors.includes('블랙') && colors.includes('화이트'));

        if (sizeCompatible && styleCompatible) {
          let score = 50;
          if (top.style === '교복' || top.style === '체육복') score += 30; // standard uniform pairings
          if (colorCompatible) score += 20;

          recommendations.push({
            top,
            bottom,
            score,
            title: top.style === '체육복' 
              ? `활동적인 ${top.color} 단체 체육복 세트`
              : top.style === '교복'
              ? `정갈한 ${top.color} 정복 교복 세트`
              : `자연스러운 ${top.color} 나눔 상/하의 코디`,
            estHeight: Math.round((topEstHeight + bottomEstHeight) / 2)
          });
        }
      });
    });

    // Sort by compatibility score
    return recommendations.sort((a, b) => b.score - a.score).slice(0, 3);
  };

  const recommendations = getOutfitRecommendations();

  // Handle reserve click
  const openReserveModal = (cloth) => {
    setSelectedCloth(cloth);
    setIsReserveModalOpen(true);
  };

  const handleReserve = async () => {
    if (!reserveName.trim() || !reserveGrade.trim() || !reservePhone.trim()) {
      triggerToast('예약자 정보를 모두 입력해 주세요.');
      return;
    }

    try {
      const reservation = {
        student_name: reserveName,
        grade: reserveGrade,
        parent_phone: reservePhone
      };

      await reserveCloth(spaceCode, selectedCloth.id, reservation);
      
      const xpResult = awardUserXP(150, 'reserve');
      if (xpResult.user) {
        setCurrentUser(xpResult.user);
        triggerToast('나눔 옷 예약 완료! 🎉 (+150 XP 획득)');
      } else {
        triggerToast('나눔 옷 예약이 완료되었습니다. 학교로 방문해주세요!');
      }

      setIsReserveModalOpen(false);
      setSelectedCloth(null);
      
      // Reset reserve fields
      setReserveName('');
      setReserveGrade('');
      setReservePhone('');

      loadClothes(); // Refresh
    } catch (e) {
      console.error(e);
      triggerToast('예약 처리 중 오류가 발생했습니다.');
    }
  };

  const openOutfitReserveModal = (outfit) => {
    setSelectedOutfit(outfit);
    setIsOutfitReserveModalOpen(true);
  };

  const handleReserveOutfit = async () => {
    if (!reserveName.trim() || !reserveGrade.trim() || !reservePhone.trim()) {
      triggerToast('예약자 정보를 모두 입력해 주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const { reserveCloth } = await import('../lib/db');
      const reservation = {
        student_name: reserveName,
        grade: reserveGrade,
        parent_phone: reservePhone
      };

      if (selectedOutfit.top) {
        await reserveCloth(spaceCode, selectedOutfit.top.id, reservation);
      }
      if (selectedOutfit.bottom) {
        await reserveCloth(spaceCode, selectedOutfit.bottom.id, reservation);
      }
      if (selectedOutfit.outer) {
        await reserveCloth(spaceCode, selectedOutfit.outer.id, reservation);
      }

      triggerToast('나눔 코디 세트 예약이 완료되었습니다. 학교로 방문해주세요!');
      setIsOutfitReserveModalOpen(false);
      setSelectedOutfit(null);
      
      setReserveName('');
      setReserveGrade('');
      setReservePhone('');

      loadClothes(); // Refresh
    } catch (e) {
      console.error(e);
      triggerToast('세트 예약 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (cloth, e) => {
    e.stopPropagation();
    if (!confirm(`'${cloth.name}'을(를) 옷장에서 삭제하시겠습니까?`)) return;
    
    try {
      await deleteCloth(spaceCode, cloth.id);
      triggerToast('옷이 성공적으로 삭제되었습니다.');
      loadClothes();
    } catch (e) {
      console.error(e);
      triggerToast('삭제 중 오류가 발생했습니다.');
    }
  };

  // Welcome Screen (Enter space code)
  if (!isSpaceLoaded) {
    return (
      <div className={styles.welcomePage}>
        <div className={styles.container} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: 0 }}>
          <div className={styles.heroContainer}>
          <div className={styles.heroLeft}>
            <span className={styles.heroTag}>🌱 AI 기반 학교 의류 자원 순환 시스템</span>
            <h1 className={styles.heroTitle}>
              버려지는 아동복,<br />
              <span className="gradient-text" style={{ fontWeight: '900' }}>AI로 학교에서 순환하다</span>
            </h1>
            <p className={styles.heroDesc}>
              작아져서 더 이상 입지 못하는 교복과 체육복을 스마트하게 나눔하고 재활용합니다. 
              AI 정밀 실측과 신체 데이터 매칭 기능으로 우리 아이에게 완벽히 맞는 의류를 지금 찾아보세요.
            </p>

            <form onSubmit={handleJoinSpace} style={{ width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className={styles.spaceInputRow}>
                <input 
                  type="text" 
                  value={enteredSpaceCode} 
                  onChange={(e) => setEnteredSpaceCode(e.target.value)} 
                  placeholder="학교 코드 입력 (예: seosol-elementary)" 
                  className={styles.heroInput}
                />
                <button type="submit" className="glow-btn" style={{ padding: '16px 28px', borderRadius: 'var(--radius-md)', fontSize: '15px', whiteSpace: 'nowrap' }}>
                  스마트 옷장 입장하기 🎒
                </button>
              </div>

              <button 
                type="button" 
                className={styles.demoButton}
                onClick={handleJoinDemo}
              >
                ▶ 심사위원용 데모 옷장 바로가기 (로그인 생략)
              </button>
            </form>
          </div>

          <div className={styles.heroRight}>
            <div className={styles.illustrationContainer}>
              <div className={styles.illustrationBox}>
                {/* Technical scanning brackets overlay */}
                <div className={`${styles.illustrationBracket} ${styles.illustrationBracketTL}`} />
                <div className={`${styles.illustrationBracket} ${styles.illustrationBracketTR}`} />
                <div className={`${styles.illustrationBracket} ${styles.illustrationBracketBL}`} />
                <div className={`${styles.illustrationBracket} ${styles.illustrationBracketBR}`} />
                
                {/* Floating animated hanger with clothes */}
                <div className={styles.floatHanger}>
                  <svg width="160" height="160" viewBox="0 0 100 100" fill="none">
                    {/* Hanger hook */}
                    <path d="M50 35 C50 25, 60 25, 60 30 C60 32, 53 35, 50 38" stroke="hsl(var(--primary))" strokeWidth="3.5" strokeLinecap="round" />
                    {/* Hanger shoulders */}
                    <path d="M20 50 L50 38 L80 50" stroke="hsl(var(--primary))" strokeWidth="3.5" strokeLinecap="round" />
                    {/* Hanging T-shirt */}
                    <path d="M30 46 L35 44 L38 48 L44 48 L50 44 L56 48 L62 48 L65 44 L70 46 L75 62 L65 62 L65 82 L35 82 L35 62 L25 62 Z" fill="#f0faf4" stroke="hsl(var(--primary))" strokeWidth="2.5" />
                    {/* AI crosshair in center of shirt */}
                    <circle cx="50" cy="62" r="10" stroke="hsl(var(--secondary))" strokeWidth="1.5" strokeDasharray="3,3" />
                    <line x1="50" y1="48" x2="50" y2="76" stroke="hsl(var(--secondary))" strokeWidth="1.5" />
                    <line x1="36" y1="62" x2="64" y2="62" stroke="hsl(var(--secondary))" strokeWidth="1.5" />
                    <circle cx="50" cy="62" r="2" fill="hsl(var(--secondary))" />
                  </svg>
                </div>

                {/* Glowing scanning laser bar */}
                <div className="scannerOverlay">
                  <div className="scanLine" />
                </div>
              </div>

              {/* Float leaf decoration */}
              <div className={styles.floatLeaf}>
                <Sparkles size={20} style={{ color: '#059669' }} />
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* 3-Step Process Cards Section */}
        <div className={styles.stepSection}>
          <div className={styles.stepSectionInner}>
            <h2 className={styles.stepSectionTitle}>스마트 옷장 핵심 프로세스</h2>
            <div className={styles.stepCardGrid}>
              
              <div className={styles.stepCard}>
                <div className={styles.stepCardIcon}>
                  <Smartphone size={28} />
                </div>
                <h3 className={styles.stepCardTitle}>1. 의류 스캔 및 데이터화</h3>
                <p className={styles.stepCardDesc}>
                  기부할 옷을 촬영해 올리면 AI가 원근 왜곡을 자동 보정하고 어깨너비, 가슴단면, 기장 등 세부 실측 수치를 고정밀 분석합니다.
                </p>
              </div>

              <div className={styles.stepCard}>
                <div className={styles.stepCardIcon}>
                  <Ruler size={28} />
                </div>
                <h3 className={styles.stepCardTitle}>2. 신체 데이터 매칭</h3>
                <p className={styles.stepCardDesc}>
                  자녀의 키와 몸무게를 입력하면 표준 신체 지수를 산출하여, 작아서 맞지 않는 옷은 사전에 거르고 예쁘게 맞는 크기의 의류만 골라냅니다.
                </p>
              </div>

              <div className={styles.stepCard}>
                <div className={styles.stepCardIcon}>
                  <Sparkles size={28} />
                </div>
                <h3 className={styles.stepCardTitle}>3. AI 맞춤 코디 추천</h3>
                <p className={styles.stepCardDesc}>
                  기증된 품목 중 현재 신청 가능한 의류들의 색상 Harmony와 교복·체육복·일상복 스타일을 연산해 최적의 조합 세트를 추천합니다.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }

  const qrCodeUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/admin` 
    : '';

  return (
    <div className={styles.container}>
      {/* Toast Alert */}
      {toastMessage && (
        <div className={styles.toast}>
          <Check size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <div className={styles.header} style={{ borderBottom: '1px solid hsl(var(--border))', paddingBottom: '12px', marginBottom: '16px' }}>
        <div className={styles.brand}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={12} /> {spaceCode} 전용 옷장 🟢
          </span>
          <h1 className={styles.mainTitle} style={{ fontSize: '30px', marginTop: '6px' }}>
            🎒 FitShare <span className="gradient-text">우리 학교 스마트 옷장</span>
          </h1>
        </div>

        <div className={styles.actionRow}>
          <button className="glow-btn" onClick={() => router.push('/admin')} style={{ boxShadow: '0 8px 20px rgba(5,150,105,0.12)' }}>
            <ClipboardList size={16} /> 🧺 의류 스캔 시작하기 (기부)
          </button>
          <button className="glow-btn-secondary" onClick={() => setIsQRModalOpen(true)}>
            <Smartphone size={16} /> 모바일 기기 연동
          </button>
          <button className="glow-btn-secondary" style={{ width: '40px', padding: 0 }} onClick={loadClothes} title="새로고침">
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button className="glow-btn-secondary" onClick={handleLeaveSpace} style={{ border: '1px solid hsl(var(--danger)/0.15)', color: 'hsl(var(--danger))', marginLeft: '16px' }}>
            옷장 나가기
          </button>
        </div>
      </div>

      {/* Gamification Level, Profile & Carbon Bar */}
      <GamificationBar 
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenBadges={() => setIsBadgeModalOpen(true)}
      />

      {/* Mascot Guidance Widget */}
      <div className={styles.mascotWidget}>
        <div style={{ flexShrink: 0, position: 'relative' }}>
          {/* Cute leaf mascot Choroki */}
          <svg width="68" height="68" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="36" r="24" fill="#e8f5ed" stroke="#16a34a" strokeWidth="3" />
            {/* Leaf ears */}
            <path d="M22 16C18 10 26 6 30 12C28 16 24 18 22 16Z" fill="#16a34a" />
            <path d="M42 16C46 10 38 6 34 12C36 16 40 18 42 16Z" fill="#16a34a" />
            {/* Eyes */}
            <circle cx="23" cy="34" r="3" fill="#0c1a13" />
            <circle cx="41" cy="34" r="3" fill="#0c1a13" />
            {/* Blushing cheeks */}
            <circle cx="18" cy="38" r="3" fill="#f43f5e" fillOpacity="0.4" />
            <circle cx="46" cy="38" r="3" fill="#f43f5e" fillOpacity="0.4" />
            {/* Smile */}
            <path d="M28 41C28 41 30 44 32 44C34 44 36 41 36 41" stroke="#0c1a13" strokeWidth="2" strokeLinecap="round" />
            {/* Mini Graduation cap */}
            <path d="M26 19L32 16L38 19L32 22L26 19Z" fill="#ca8a04" />
            <rect x="30" y="20" width="4" height="2" fill="#ca8a04" />
          </svg>
          <span style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: '#22c55e', color: 'white', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>🌱</span>
        </div>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'hsl(var(--primary))', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            안녕! 나는 스마트 옷장의 도우미 '초록이'야!
          </h3>
          <p style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))', marginTop: '5px', lineHeight: '1.5' }}>
            우리 학교 선배, 후배들이 입던 소중한 옷들을 함께 나누어 지구 온도도 낮추고, 
            가족의 의류비도 아낄 수 있어! 아래 **'내 아이 맞춤 사이즈 필터'**를 눌러 키와 몸무게를 입력하면 
            예쁘게 잘 맞는 옷들을 AI가 쏙쏙 골라줄게! 🏫✨
          </p>
        </div>
      </div>

      {/* Child Size Matcher - Permanently open, styled for kids */}
      <div className={styles.matcherPanel}>
        <div className={styles.matcherTitle}>
          <Ruler size={20} style={{ color: 'hsl(var(--primary))' }} /> 
          <span>🤖 AI 맞춤 사이즈 매칭 필터</span>
        </div>

        <div className="fade-in" style={{ marginTop: '10px' }}>
          <div className={styles.matcherInputsRow}>
            <div className={styles.matcherInputGroup}>
              <label className={styles.matcherInputLabel}>자녀 키 (cm)</label>
              <input 
                type="number" 
                value={childSize.height} 
                onChange={(e) => handleSizeInput('height', e.target.value)} 
                className={styles.matcherLargeInput} 
                placeholder="예: 130"
              />
            </div>
            <div className={styles.matcherInputGroup}>
              <label className={styles.matcherInputLabel}>자녀 몸무게 (kg)</label>
              <input 
                type="number" 
                value={childSize.weight} 
                onChange={(e) => handleSizeInput('weight', e.target.value)} 
                className={styles.matcherLargeInput} 
                placeholder="예: 30"
              />
            </div>

            <button
              type="button"
              className={`${styles.magicWandBtn} ${isAiMatchingActive ? styles.magicWandBtnActive : ''}`}
              onClick={() => {
                if (!childSize.height) {
                  alert('아이의 키를 입력한 뒤 요술봉을 흔들어 주세요! 🧙‍♂️');
                  return;
                }
                setIsAiMatchingActive(!isAiMatchingActive);
              }}
            >
              {isAiMatchingActive ? '✨ AI 요술봉 작동 중!' : '✨ AI 요술봉으로 내 옷 찾기'}
            </button>
          </div>

          {/* Show estimated specs badges only when height is present */}
          {childSize.height && (
            <div className="fade-in">
              <div className={styles.estimatedSpecGrid}>
                <span className={styles.estimatedSpecBadge}>📏 어깨너비: {childSize.shoulder || '--'}cm</span>
                <span className={styles.estimatedSpecBadge}>📏 가슴단면: {childSize.chest || '--'}cm</span>
                <span className={styles.estimatedSpecBadge}>📏 허리단면: {childSize.waist || '--'}cm</span>
                <span className={styles.estimatedSpecBadge}>📏 하의기장: {childSize.length || '--'}cm</span>
              </div>
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
              <Info size={14} style={{ color: 'hsl(var(--primary))', flexShrink: 0 }} />
              <span>키와 몸무게를 입력하고 <b>AI 요술봉</b>을 켜면, 자녀 신체 지수보다 작거나 맞지 않는 의류를 자동으로 제외합니다.</span>
            </div>
            {childSize.height && (
              <button className="glow-btn-secondary" style={{ padding: '8px 16px', fontSize: '12px', borderRadius: 'var(--radius-sm)' }} onClick={handleClearSizes}>
                필터 지우기 🔄
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={styles.filterSection} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}>
        <div className={styles.searchBar} style={{ maxWidth: '100%' }}>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder="의류 이름 또는 색상 검색..." 
              className="input-field"
              style={{ paddingLeft: '38px', borderRadius: 'var(--radius-md)', width: '100%', height: '38px', fontSize: '14px' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '11px', color: 'hsl(var(--muted-foreground))' }} />
          </div>
        </div>

        <div className={styles.filterGroupRow}>
          {/* Group 1: 종류별 */}
          <div className={styles.filterSubGroup}>
            <span className={styles.filterGroupLabel}>의류 종류별</span>
            <div className={styles.tagFilters}>
              {[['전체', '전체 🌈'], ['상의', '상의 👕'], ['하의', '하의 👖'], ['아우터', '아우터 🧥']].map(([key, label]) => (
                <button 
                  key={key} 
                  className={`${styles.filterTag} ${selectedCategory === key ? styles.filterTagActive : ''}`}
                  onClick={() => setSelectedCategory(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Group 2: 스타일별 */}
          <div className={styles.filterSubGroup}>
            <span className={styles.filterGroupLabel}>의류 스타일별</span>
            <div className={styles.tagFilters}>
              {[['전체', '전체 💫'], ['교복', '교복 👔'], ['체육복', '체육복 🏃'], ['일상복', '일상복 🧸']].map(([key, label]) => (
                <button 
                  key={key} 
                  className={`${styles.filterTag} ${selectedStyle === key ? styles.filterTagActive : ''}`}
                  onClick={() => setSelectedStyle(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Group 3: 상태별 */}
          <div className={styles.filterSubGroup}>
            <span className={styles.filterGroupLabel}>예약 상태별</span>
            <div className={styles.tagFilters}>
              {[['전체', '전체 🏷️'], ['available', '신청가능 🌱'], ['reserved', '예약됨 🔒']].map(([key, label]) => (
                <button 
                  key={key} 
                  className={`${styles.filterTag} ${selectedStatus === key ? styles.filterTagActive : ''}`}
                  onClick={() => setSelectedStatus(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Clothing Card Grid */}
      {isLoading ? (
        <div className={styles.autoGrid}>
          {[1, 2, 3, 4].map(idx => (
            <div key={idx} className="glass-panel" style={{ height: '390px', display: 'flex', flexDirection: 'column' }}>
              <div className="skeleton" style={{ height: '240px', width: '100%' }} />
              <div style={{ padding: '16px', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="skeleton" style={{ height: '14px', width: '40%' }} />
                <div className="skeleton" style={{ height: '20px', width: '80%' }} />
                <div className="skeleton" style={{ height: '14px', width: '60%', marginTop: 'auto' }} />
              </div>
            </div>
          ))}
        </div>
      ) : filteredClothes.length === 0 ? (
        <div className={styles.emptyState}>
          <ShoppingBag size={48} style={{ color: 'hsl(var(--primary))', opacity: 0.6 }} />
          <h3 style={{ fontSize: '18px', fontWeight: '800' }}>여기에 알맞은 옷이 아직 없어요.</h3>
          <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '13px' }}>
            필터 조건을 변경하거나 모바일 화면을 통해 아이가 입던 깨끗한 옷을 먼저 기부해 주세요!
          </p>
        </div>
      ) : (
        <div className={`${styles.autoGrid} fade-in`}>
          {filteredClothes.map(cloth => {
            const comp = checkCompatibility(cloth);
            return (
              <div key={cloth.id} className={styles.card} onClick={() => setSelectedCloth(cloth)}>
                {/* Delete button */}
                <button 
                  className={styles.deleteCardButton}
                  onClick={(e) => handleDelete(cloth, e)}
                  title="의류 삭제"
                >
                  <Trash2 size={14} />
                </button>

                {/* Image wrapper */}
                <div className={styles.imageWrapper}>
                  <span className={`${styles.statusBadge} badge ${cloth.status === 'available' ? 'badge-available' : 'badge-reserved'}`}>
                    {cloth.status === 'available' ? '🌱 신청 가능' : '🔒 예약 완료'}
                  </span>
                  <img src={cloth.image_url} alt={cloth.name} className={styles.cardImage} loading="lazy" />
                </div>

                {/* Content details */}
                <div className={styles.cardContent}>
                  <div className={styles.tagWrapper}>
                    <span className={styles.categoryBadge}>{cloth.style}</span>
                    <span className={styles.categoryBadge}>{cloth.category}</span>
                    <span className={styles.aiTag}>🤖 AI 자동태그</span>
                  </div>
                  
                  <h3 className={styles.cardName}>{cloth.name}</h3>

                  <div className={styles.cardSpecs}>
                    <span className={styles.specTag}>🎨 {cloth.color}</span>
                  </div>

                  {/* AI Estimated Measurements Block */}
                  <div className={styles.aiMeasureCard}>
                    <span className={styles.aiMeasureHeader}>📏 AI 실측 치수</span>
                    <div className={styles.aiMeasureSpecs}>
                      {cloth.category === '하의' ? (
                        <>
                          <span>허리 {cloth.measurements.waist}cm</span>
                          <span>기장 {cloth.measurements.length}cm</span>
                        </>
                      ) : (
                        <>
                          <span>어깨 {cloth.measurements.shoulder}cm</span>
                          <span>가슴 {cloth.measurements.chest}cm</span>
                          <span>총장 {cloth.measurements.length}cm</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Compatibility Badge */}
                  {comp && (
                    <div className={styles.compatibilityBadge} style={{ color: comp.color }}>
                      <Ruler size={13} style={{ stroke: comp.color }} />
                      <span>{comp.label === '예쁘게 잘 맞음' ? '💚 ' + comp.label : comp.label === '여유로움 (성장 대비)' ? '💛 ' + comp.label : '❤️ ' + comp.label}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Outfit Recommendations Panel */}
      {!isLoading && (
        <>
          {isAiMatchingActive ? (
            // --- AI Magic Codi Book (Magic Wand Mode Active) ---
            <div className={`${styles.recommendSection} ${styles.magicCodiSection} fade-in`} style={{ marginTop: '30px' }}>
              <div className={styles.magicCodiHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '24px' }}>✨</span>
                  <h2 className={styles.recommendTitle} style={{ margin: 0 }}>
                    AI 초록이의 <span className="gradient-text">매직 코디북 (신체 맞춤)</span>
                  </h2>
                </div>
                <span className="badge badge-available" style={{ padding: '6px 12px', fontSize: '12px' }}>
                  자녀 치수 ({childSize.height}cm, {childSize.weight}kg) 맞춤 추천 🤖
                </span>
              </div>
              
              {isRecommendLoading ? (
                <div className={styles.recommendLoading} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid hsl(var(--border)/0.5)' }}>
                  <Loader2 className="animate-spin" size={24} style={{ color: 'hsl(var(--primary))' }} />
                  <span style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>AI 패션 스타일리스트가 옷을 코디하는 중...</span>
                </div>
              ) : aiRecommendations.length === 0 ? (
                <div className={styles.emptyRecommendations} style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', border: '1px dashed hsl(var(--border))' }}>
                  <span style={{ fontSize: '13.5px', color: 'var(--muted-foreground)' }}>💡 이 사이즈에 꼭 맞는 나눔 코디 세트가 아직 없어요. 아래 목록에서 마음에 드는 단품들을 직접 찾아보세요!</span>
                </div>
              ) : (
                <div className={styles.recommendGrid}>
                  {aiRecommendations.map((combo, idx) => (
                    <div key={idx} className={`${styles.comboCard} ${styles.magicComboCard}`} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div className={styles.comboScore} style={{ fontSize: '11px', color: 'hsl(var(--secondary))', fontWeight: '800', marginBottom: '6px' }}>
                          ★ 코디 조화 지수: <strong>{combo.score}점</strong>
                        </div>
                        
                        <div className={styles.comboTitle} style={{ fontWeight: '800', fontSize: '16px', marginBottom: '12px' }}>{combo.title}</div>
                        
                        <div className={styles.comboItems} style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '15px' }}>
                          <div className={styles.comboItemThumb} style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', border: '1px solid hsl(var(--border))' }} onClick={() => setSelectedCloth(combo.top)}>
                            <img src={combo.top.image_url} alt="Top" className={styles.comboItemImg} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <span style={{ position: 'absolute', bottom: '6px', left: '6px', fontSize: '10px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>상의</span>
                          </div>
                          <div className={styles.comboItemThumb} style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', border: '1px solid hsl(var(--border))' }} onClick={() => setSelectedCloth(combo.bottom)}>
                            <img src={combo.bottom.image_url} alt="Bottom" className={styles.comboItemImg} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <span style={{ position: 'absolute', bottom: '6px', left: '6px', fontSize: '10px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>하의</span>
                          </div>
                        </div>
                        
                        <div className={styles.comboCommentary} style={{ background: 'rgba(255,255,255,0.4)', padding: '12px', borderRadius: '8px', fontSize: '12.5px', lineHeight: '1.5', color: 'var(--foreground)', marginBottom: '15px', border: '1px solid hsl(var(--border)/0.3)' }}>
                          <p style={{ margin: '0 0 8px 0' }}>{combo.commentary}</p>
                          <div className={styles.comboTags} style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {combo.tags.map((tag, tIdx) => (
                              <span key={tIdx} className={styles.comboTag} style={{ fontSize: '10px', background: 'hsl(var(--primary)/0.08)', color: 'hsl(var(--primary))', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>{tag}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid hsl(var(--border)/0.5)', paddingTop: '12px' }}>
                        <div style={{ fontSize: '11.5px', color: 'var(--muted-foreground)' }}>
                          어깨: <strong>{combo.top.measurements.shoulder || combo.top.measurements.waist}cm</strong> / 기장: <strong>{combo.bottom.measurements.length}cm</strong>
                        </div>
                        <button 
                          className="glow-btn" 
                          style={{ padding: '8px 16px', fontSize: '12px', borderRadius: 'var(--radius-sm)' }}
                          onClick={() => openOutfitReserveModal(combo)}
                        >
                          이 세트 한 번에 예약하기 🎒
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // --- Normal General Recommendations ---
            recommendations.length > 0 && (
              <div className={`${styles.recommendSection} fade-in`} style={{ marginTop: '30px' }}>
                <h2 className={styles.recommendTitle}>
                  💡 <span className="gradient-text">초록이가 추천하는 조화로운 나눔 코디 세트</span>
                </h2>
                <div className={styles.recommendGrid}>
                  {recommendations.map((combo, idx) => (
                    <div key={idx} className={styles.comboCard}>
                      <div className={styles.comboTitle}>{combo.title}</div>
                      <div className={styles.comboItems}>
                        <div className={styles.comboItemThumb} onClick={() => setSelectedCloth(combo.top)}>
                          <img src={combo.top.image_url} alt="Top" className={styles.comboItemImg} />
                          <span style={{ position: 'absolute', bottom: '6px', left: '6px', fontSize: '10px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>상의</span>
                        </div>
                        <div className={styles.comboItemThumb} onClick={() => setSelectedCloth(combo.bottom)}>
                          <img src={combo.bottom.image_url} alt="Bottom" className={styles.comboItemImg} />
                          <span style={{ position: 'absolute', bottom: '6px', left: '6px', fontSize: '10px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>하의</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
                          추천 자녀 키: <strong>{combo.estHeight}cm 내외</strong>
                        </div>
                        <button 
                          className="glow-btn" 
                          style={{ padding: '8px 16px', fontSize: '12px', borderRadius: 'var(--radius-sm)' }}
                          onClick={() => {
                            setSelectedCloth(combo.top);
                            triggerToast('상의 상세 정보를 먼저 열어드릴게요! 확인 후 둘 다 분양받으세요.');
                          }}
                        >
                          세트 확인하기 👉
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </>
      )}

      {/* DETAIL MODAL: Visual Inspect Panel */}
      {selectedCloth && !isReserveModalOpen && (
        <div className={styles.modalOverlay} onClick={closeDetailModal}>
          <div className={`${styles.modalContent} ${isTryOnActive ? styles.modalContentFull : ''}`} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={closeDetailModal}>
              <X size={16} />
            </button>

            {/* Left side: Canvas overlay with glowing lines OR Camera Virtual Try-on */}
            {isTryOnActive ? (
              <div className={styles.tryOnContainer}>
                {/* Flash layer */}
                <div className={`${styles.tryOnFlash} ${isFlashing ? styles.tryOnFlashActive : ''}`} />

                {/* AI tracking status badge */}
                {isPoseTrackingActive && (
                  <div className={styles.tryOnAiBadge}>
                    <Sparkles size={12} /> AI 실시간 골반/어깨 매칭 중
                  </div>
                )}

                <video 
                  ref={videoRef} 
                  autoPlay={true}
                  playsInline={true}
                  muted={true}
                  width={640}
                  height={640}
                  className={`${styles.tryOnVideo} ${facingMode === 'user' ? styles.tryOnVideoMirror : ''}`}
                  style={{
                    transform: `${facingMode === 'user' ? 'scaleX(-1)' : ''} scale(${cameraZoom})`,
                    transformOrigin: 'center center'
                  }}
                />

                <div 
                  className={styles.tryOnClothingOverlay}
                  style={{
                    top: `${50 + tryOnOffset.y}%`,
                    left: `${50 + tryOnOffset.x}%`,
                    transform: `translate(-50%, -50%) scale(${tryOnScale})`,
                    width: '70%',
                    height: '70%'
                  }}
                >
                  <img 
                    src={transparentImageUrl || selectedCloth.image_url} 
                    alt="tryon-overlay" 
                    className={styles.tryOnClothingImg} 
                  />
                </div>

                {/* Standing reference guides */}
                {!isPoseTrackingActive && (
                  <div className={styles.tryOnSilhouette}>
                    <svg width="60%" height="80%" viewBox="0 0 100 100" fill="none" stroke="hsl(var(--primary)/0.4)" strokeWidth="1.5">
                      {selectedCloth.category === '하의' ? (
                        <path d="M30 40 L70 40 L75 85 L60 85 L50 65 L40 85 L25 85 Z" strokeDasharray="3 3" />
                      ) : (
                        <path d="M50 15 C45 15, 45 25, 50 25 C55 25, 55 15, 50 15 M 25 35 L75 35 L70 80 L30 80 Z" strokeDasharray="3 3" />
                      )}
                    </svg>
                  </div>
                )}

                <div className={styles.tryOnToolbar}>
                  {/* Camera view zoom out / in */}
                  <button className={styles.tryOnBtn} onClick={() => setCameraZoom(z => Math.max(0.4, z - 0.15))} title="카메라 시야 축소 (전신 담기)">🔍-</button>
                  <button className={styles.tryOnBtn} onClick={() => setCameraZoom(z => Math.min(2.0, z + 0.15))} title="카메라 시야 확대">🔍+</button>

                  {/* Directional clothes alignment */}
                  <button className={styles.tryOnBtn} onClick={() => setTryOnOffset(prev => ({ ...prev, y: prev.y - 3 }))} title="옷 위로">⬆️</button>
                  <button className={styles.tryOnBtn} onClick={() => setTryOnOffset(prev => ({ ...prev, y: prev.y + 3 }))} title="옷 아래로">⬇️</button>
                  <button className={styles.tryOnBtn} onClick={() => setTryOnOffset(prev => ({ ...prev, x: prev.x - 3 }))} title="옷 왼쪽으로">⬅️</button>
                  <button className={styles.tryOnBtn} onClick={() => setTryOnOffset(prev => ({ ...prev, x: prev.x + 3 }))} title="옷 오른쪽으로">➡️</button>

                  {/* Clothes scale */}
                  <button className={styles.tryOnBtn} onClick={() => setTryOnScale(s => Math.min(2.5, s + 0.1))} title="옷 크게">➕</button>
                  <button className={styles.tryOnBtn} onClick={() => setTryOnScale(s => Math.max(0.4, s - 0.1))} title="옷 작게">➖</button>

                  {/* Pose tracking AI */}
                  <button 
                    className={`${styles.tryOnBtn} ${isPoseTrackingActive ? styles.tryOnBtnActive : ''}`} 
                    onClick={startPoseTracking} 
                    title={isPoseModelLoading ? "AI 모델 로딩 중..." : "AI 실시간 자동 피팅"}
                    disabled={isPoseModelLoading}
                  >
                    {isPoseModelLoading ? '⏳' : '🤖'}
                  </button>

                  {/* Camera Flip */}
                  <button className={styles.tryOnBtn} onClick={toggleFacingMode} title="카메라 전면/후면 전환">🔃</button>
                  
                  {/* Reset */}
                  <button className={styles.tryOnBtn} onClick={() => { setTryOnScale(1.0); setTryOnOffset({ x: 0, y: 0 }); setCameraZoom(1.0); }} title="초기화">🔄</button>
                  
                  {/* Snapshot & Exit */}
                  <button className={`${styles.tryOnBtn} ${styles.tryOnBtnPrimary}`} onClick={captureTryOn} title="피팅 캡쳐 촬영">📸</button>
                  <button className={`${styles.tryOnBtn} ${styles.tryOnBtnDanger}`} onClick={stopCamera} title="종료">❌</button>
                </div>
              </div>
            ) : (
              <div className={`${styles.modalImageArea} scanning-container`} style={{ overflow: 'hidden', position: 'relative', borderRight: '1px solid hsl(var(--border))' }}>
                <div className="scanning-bracket scanning-bracket-tl" />
                <div className="scanning-bracket scanning-bracket-tr" />
                <div className="scanning-bracket scanning-bracket-bl" />
                <div className="scanning-bracket scanning-bracket-br" />
                
                <div style={{ position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(5,150,105,0.85)', color: '#fff', fontSize: '11px', fontWeight: '800', padding: '4px 12px', borderRadius: '4px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '4px', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <Sparkles size={12} /> AI 실측 치수 오버레이 활성
                </div>

                <img src={selectedCloth.image_url} alt={selectedCloth.name} className={styles.modalImage} />
                
                <svg 
                  width="100%" height="100%" viewBox="0 0 100 100" 
                  style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
                >
                  {selectedCloth.category === '하의' ? (
                    <>
                      <line 
                        x1={50 - selectedCloth.measurements.waist / 2} y1={selectedCloth.guidelines.waist_y} 
                        x2={50 + selectedCloth.measurements.waist / 2} y2={selectedCloth.guidelines.waist_y}
                        stroke="hsl(var(--neon-chest))" 
                        strokeWidth={hoveredSpec === 'waist' ? '3.5' : '2'}
                        style={{ filter: hoveredSpec === 'waist' ? 'drop-shadow(0 0 6px hsl(var(--neon-chest)))' : 'none', transition: 'all 0.2s ease' }}
                      />
                      <line 
                        x1={50} y1={selectedCloth.guidelines.length_start_y} 
                        x2={50} y2={selectedCloth.guidelines.length_end_y}
                        stroke="hsl(var(--neon-length))" 
                        strokeWidth={hoveredSpec === 'length' ? '3.5' : '2'}
                        style={{ filter: hoveredSpec === 'length' ? 'drop-shadow(0 0 6px hsl(var(--neon-length)))' : 'none', transition: 'all 0.2s ease' }}
                      />
                    </>
                  ) : (
                    <>
                      <line 
                        x1={50 - selectedCloth.measurements.shoulder / 2} y1={selectedCloth.guidelines.shoulder_y} 
                        x2={50 + selectedCloth.measurements.shoulder / 2} y2={selectedCloth.guidelines.shoulder_y}
                        stroke="hsl(var(--neon-shoulder))" 
                        strokeWidth={hoveredSpec === 'shoulder' ? '3.5' : '2'}
                        style={{ filter: hoveredSpec === 'shoulder' ? 'drop-shadow(0 0 6px hsl(var(--neon-shoulder)))' : 'none', transition: 'all 0.2s ease' }}
                      />
                      <line 
                        x1={50 - selectedCloth.measurements.chest / 2} y1={selectedCloth.guidelines.chest_y} 
                        x2={50 + selectedCloth.measurements.chest / 2} y2={selectedCloth.guidelines.chest_y}
                        stroke="hsl(var(--neon-chest))" 
                        strokeWidth={hoveredSpec === 'chest' ? '3.5' : '2'}
                        style={{ filter: hoveredSpec === 'chest' ? 'drop-shadow(0 0 6px hsl(var(--neon-chest)))' : 'none', transition: 'all 0.2s ease' }}
                      />
                      <line 
                        x1={50 - selectedCloth.measurements.shoulder / 2} y1={selectedCloth.guidelines.shoulder_y} 
                        x2={selectedCloth.guidelines.sleeve_end_x} y2={48}
                        stroke="hsl(var(--neon-sleeve))" 
                        strokeWidth={hoveredSpec === 'sleeve' ? '3.5' : '2'}
                        style={{ filter: hoveredSpec === 'sleeve' ? 'drop-shadow(0 0 6px hsl(var(--neon-sleeve)))' : 'none', transition: 'all 0.2s ease' }}
                      />
                      <line 
                        x1={50} y1={selectedCloth.guidelines.length_start_y} 
                        x2={50} y2={selectedCloth.guidelines.length_end_y}
                        stroke="hsl(var(--neon-length))" 
                        strokeWidth={hoveredSpec === 'length' ? '3.5' : '2'}
                        style={{ filter: hoveredSpec === 'length' ? 'drop-shadow(0 0 6px hsl(var(--neon-length)))' : 'none', transition: 'all 0.2s ease' }}
                      />
                    </>
                  )}
                </svg>
              </div>
            )}

            {/* Right side: clothing properties + compare sizes */}
            {!isTryOnActive && (
              <div className={styles.modalInfoArea}>
              <span className={styles.modalCategory}>{selectedCloth.style} • {selectedCloth.category}</span>
              <h2 className={styles.modalTitle}>{selectedCloth.name}</h2>

              <div className={styles.specSection}>
                <div className={styles.specRow}>
                  <span className={styles.specLabel}>기증 식별 코드</span>
                  <span className={styles.specValue}>{selectedCloth.id.slice(0, 8)}</span>
                </div>
                <div className={styles.specRow}>
                  <span className={styles.specLabel}>색상</span>
                  <span className={styles.specValue}>{selectedCloth.color}</span>
                </div>
                <div className={styles.specRow}>
                  <span className={styles.specLabel}>현재 분양 상태</span>
                  <span className={styles.specValue} style={{ color: selectedCloth.status === 'available' ? 'hsl(var(--primary))' : '#ca8a04' }}>
                    {selectedCloth.status === 'available' ? '🌱 신청 가능' : '🔒 예약 완료'}
                  </span>
                </div>
              </div>

              {/* Interactive Specification List */}
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '800', marginBottom: '10px', color: 'hsl(var(--muted-foreground))' }}>
                  의류 실측 치수 (치수선에 마우스를 올리면 옷에 표시선이 비쳐요!)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedCloth.category === '하의' ? (
                    <>
                      <div 
                        className="glass-panel" 
                        style={{ padding: '10px 14px', borderLeft: '4px solid hsl(var(--neon-chest))', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                        onMouseEnter={() => setHoveredSpec('waist')}
                        onMouseLeave={() => setHoveredSpec(null)}
                      >
                        <span>허리 단면</span>
                        <strong>{selectedCloth.measurements.waist} cm</strong>
                      </div>
                      <div 
                        className="glass-panel" 
                        style={{ padding: '10px 14px', borderLeft: '4px solid hsl(var(--neon-length))', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                        onMouseEnter={() => setHoveredSpec('length')}
                        onMouseLeave={() => setHoveredSpec(null)}
                      >
                        <span>바지 총 기장</span>
                        <strong>{selectedCloth.measurements.length} cm</strong>
                      </div>
                    </>
                  ) : (
                    <>
                      <div 
                        className="glass-panel" 
                        style={{ padding: '10px 14px', borderLeft: '4px solid hsl(var(--neon-shoulder))', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                        onMouseEnter={() => setHoveredSpec('shoulder')}
                        onMouseLeave={() => setHoveredSpec(null)}
                      >
                        <span>어깨 너비</span>
                        <strong>{selectedCloth.measurements.shoulder} cm</strong>
                      </div>
                      <div 
                        className="glass-panel" 
                        style={{ padding: '10px 14px', borderLeft: '4px solid hsl(var(--neon-chest))', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                        onMouseEnter={() => setHoveredSpec('chest')}
                        onMouseLeave={() => setHoveredSpec(null)}
                      >
                        <span>가슴 단면</span>
                        <strong>{selectedCloth.measurements.chest} cm</strong>
                      </div>
                      <div 
                        className="glass-panel" 
                        style={{ padding: '10px 14px', borderLeft: '4px solid hsl(var(--neon-sleeve))', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                        onMouseEnter={() => setHoveredSpec('sleeve')}
                        onMouseLeave={() => setHoveredSpec(null)}
                      >
                        <span>소매 기장</span>
                        <strong>{selectedCloth.measurements.sleeve} cm</strong>
                      </div>
                      <div 
                        className="glass-panel" 
                        style={{ padding: '10px 14px', borderLeft: '4px solid hsl(var(--neon-length))', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                        onMouseEnter={() => setHoveredSpec('length')}
                        onMouseLeave={() => setHoveredSpec(null)}
                      >
                        <span>의류 총장</span>
                        <strong>{selectedCloth.measurements.length} cm</strong>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Compare measurements graph */}
              {childSize.height && (
                <div style={{ marginBottom: '25px', background: 'rgba(16,185,129,0.04)', padding: '15px', borderRadius: 'var(--radius-md)', border: '1px solid hsl(var(--card-border))' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '800', marginBottom: '10px', color: 'hsl(var(--primary))' }}>내 자녀 치수와 비교 그래프</h4>
                  
                  {selectedCloth.category === '하의' ? (
                    <>
                      <div className={styles.compareRow}>
                        <span className={styles.compareName}>허리 단면</span>
                        <div className={styles.compareBars}>
                          <div className={styles.barWrapper}><div className={styles.barChild} style={{ width: `${(Number(childSize.waist) / 50) * 100}%` }} /></div>
                          <div className={styles.barWrapper}><div className={styles.barCloth} style={{ width: `${(selectedCloth.measurements.waist / 50) * 100}%` }} /></div>
                        </div>
                        <span className={styles.compareValues}>아이 {childSize.waist} / 옷 {selectedCloth.measurements.waist}</span>
                      </div>
                      <div className={styles.compareRow}>
                        <span className={styles.compareName}>바지 총장</span>
                        <div className={styles.compareBars}>
                          <div className={styles.barWrapper}><div className={styles.barChild} style={{ width: `${(Number(childSize.length) / 110) * 100}%` }} /></div>
                          <div className={styles.barWrapper}><div className={styles.barCloth} style={{ width: `${(selectedCloth.measurements.length / 110) * 100}%` }} /></div>
                        </div>
                        <span className={styles.compareValues}>아이 {childSize.length} / 옷 {selectedCloth.measurements.length}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={styles.compareRow}>
                        <span className={styles.compareName}>어깨 너비</span>
                        <div className={styles.compareBars}>
                          <div className={styles.barWrapper}><div className={styles.barChild} style={{ width: `${(Number(childSize.shoulder) / 60) * 100}%` }} /></div>
                          <div className={styles.barWrapper}><div className={styles.barCloth} style={{ width: `${(selectedCloth.measurements.shoulder / 60) * 100}%` }} /></div>
                        </div>
                        <span className={styles.compareValues}>아이 {childSize.shoulder} / 옷 {selectedCloth.measurements.shoulder}</span>
                      </div>
                      <div className={styles.compareRow}>
                        <span className={styles.compareName}>가슴 단면</span>
                        <div className={styles.compareBars}>
                          <div className={styles.barWrapper}><div className={styles.barChild} style={{ width: `${(Number(childSize.chest) / 65) * 100}%` }} /></div>
                          <div className={styles.barWrapper}><div className={styles.barCloth} style={{ width: `${(selectedCloth.measurements.chest / 65) * 100}%` }} /></div>
                        </div>
                        <span className={styles.compareValues}>아이 {childSize.chest} / 옷 {selectedCloth.measurements.chest}</span>
                      </div>
                      <div className={styles.compareRow}>
                        <span className={styles.compareName}>총 기장</span>
                        <div className={styles.compareBars}>
                          <div className={styles.barWrapper}><div className={styles.barChild} style={{ width: `${(Number(childSize.length) / 90) * 100}%` }} /></div>
                          <div className={styles.barWrapper}><div className={styles.barCloth} style={{ width: `${(selectedCloth.measurements.length / 90) * 100}%` }} /></div>
                        </div>
                        <span className={styles.compareValues}>아이 {childSize.length} / 옷 {selectedCloth.measurements.length}</span>
                      </div>
                    </>
                  )}
                  
                  {checkCompatibility(selectedCloth) && (
                    <div style={{ fontSize: '12px', fontWeight: '700', color: checkCompatibility(selectedCloth).color, marginTop: '12px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                      <Check size={14} /> 자녀 피팅 결과: {checkCompatibility(selectedCloth).label}
                    </div>
                  )}
                </div>
              )}

              {/* Claim Action Button */}
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {!isTryOnActive && (
                  <button 
                    className="glow-btn-secondary" 
                    style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid hsl(var(--primary)/0.3)', fontWeight: '700' }}
                    onClick={startCamera}
                  >
                    ✨ 가상으로 입어보기 (카메라 연동)
                  </button>
                )}
                {selectedCloth.status === 'available' ? (
                  <button 
                    className="glow-btn" 
                    style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-md)' }}
                    onClick={() => openReserveModal(selectedCloth)}
                  >
                    🎁 이 나눔 옷 무료로 신청하기
                  </button>
                ) : (
                  <div style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-md)', padding: '14px', textAlign: 'center' }}>
                    <p style={{ fontWeight: '800', color: '#ca8a04', fontSize: '14px' }}>🔒 이미 나눔 예약이 완료된 의류입니다</p>
                    <p style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', marginTop: '4px' }}>
                      예약자: {selectedCloth.reservation?.student_name} ({selectedCloth.reservation?.grade})
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
        </div>
      )}

      {/* RESERVATION INPUT FORM MODAL */}
      {isReserveModalOpen && selectedCloth && (
        <div className={styles.modalOverlay} onClick={() => { setIsReserveModalOpen(false); setSelectedCloth(null); }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '30px', position: 'relative', border: '1px solid hsl(var(--primary)/0.2)' }} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={() => { setIsReserveModalOpen(false); setSelectedCloth(null); }}>
              <X size={16} />
            </button>

            <h3 style={{ fontSize: '20px', fontFamily: 'var(--font-title)', fontWeight: '800', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--primary))' }}>
              📝 나눔 신청서 작성
            </h3>
            <p style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))', marginBottom: '20px', lineHeight: '1.4' }}>
              나눔 옷은 학교 수거함에서 본인 확인 후 직접 수령하실 수 있습니다. 간단한 신청자 정보를 입력해주세요.
            </p>

            <div className={styles.formGrid}>
              <div>
                <label className={styles.formLabel}>학생 이름</label>
                <input 
                  type="text" 
                  value={reserveName} 
                  onChange={(e) => setReserveName(e.target.value)} 
                  className="input-field" 
                  placeholder="예: 홍길동"
                  style={{ borderRadius: 'var(--radius-sm)' }}
                />
              </div>
              <div>
                <label className={styles.formLabel}>학년 및 반</label>
                <input 
                  type="text" 
                  value={reserveGrade} 
                  onChange={(e) => setReserveGrade(e.target.value)} 
                  className="input-field" 
                  placeholder="예: 3학년 2반"
                  style={{ borderRadius: 'var(--radius-sm)' }}
                />
              </div>
              <div>
                <label className={styles.formLabel}>학부모 연락처</label>
                <input 
                  type="text" 
                  value={reservePhone} 
                  onChange={(e) => setReservePhone(e.target.value)} 
                  className="input-field" 
                  placeholder="예: 010-1234-5678"
                  style={{ borderRadius: 'var(--radius-sm)' }}
                />
              </div>

              <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                <button 
                  className="glow-btn-secondary" 
                  style={{ flex: 1, borderRadius: 'var(--radius-md)' }}
                  onClick={() => setIsReserveModalOpen(false)}
                >
                  돌아가기
                </button>
                <button 
                  className="glow-btn" 
                  style={{ flex: 2, borderRadius: 'var(--radius-md)' }}
                  onClick={handleReserve}
                >
                  신청 완료하기 🌱
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OUTFIT RESERVATION INPUT FORM MODAL */}
      {isOutfitReserveModalOpen && selectedOutfit && (
        <div className={styles.modalOverlay} onClick={() => { setIsOutfitReserveModalOpen(false); setSelectedOutfit(null); }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '30px', position: 'relative', border: '1px solid hsl(var(--primary)/0.2)' }} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={() => { setIsOutfitReserveModalOpen(false); setSelectedOutfit(null); }}>
              <X size={16} />
            </button>

            <h3 style={{ fontSize: '20px', fontFamily: 'var(--font-title)', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--primary))' }}>
              🎒 AI 코디 세트 일괄 신청
            </h3>
            <p style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))', marginBottom: '20px', lineHeight: '1.4' }}>
              선택하신 AI 코디 세트(상의 및 하의 등)를 한 번에 예약합니다. 예약 완료 후 학교 수거함에서 함께 찾아가실 수 있습니다.
            </p>

            {/* Selected Outfit Preview */}
            <div style={{ background: 'rgba(5, 150, 105, 0.04)', border: '1px solid rgba(5, 150, 105, 0.15)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '24px' }}>
              <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '10px', color: 'hsl(var(--primary))' }}>
                선택된 코디 세트: <span style={{ color: 'hsl(var(--foreground))' }}>{selectedOutfit.title}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                {selectedOutfit.top && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: '#fff', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-sm)', padding: '8px', flex: 1 }}>
                    <img src={selectedOutfit.top.image_url} alt="Top" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'hsl(var(--muted-foreground))' }}>상의</span>
                    <span style={{ fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px', textAlign: 'center' }} title={selectedOutfit.top.name}>
                      {selectedOutfit.top.name}
                    </span>
                  </div>
                )}
                {selectedOutfit.bottom && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: '#fff', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-sm)', padding: '8px', flex: 1 }}>
                    <img src={selectedOutfit.bottom.image_url} alt="Bottom" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'hsl(var(--muted-foreground))' }}>하의</span>
                    <span style={{ fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px', textAlign: 'center' }} title={selectedOutfit.bottom.name}>
                      {selectedOutfit.bottom.name}
                    </span>
                  </div>
                )}
                {selectedOutfit.outer && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: '#fff', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-sm)', padding: '8px', flex: 1 }}>
                    <img src={selectedOutfit.outer.image_url} alt="Outer" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'hsl(var(--muted-foreground))' }}>아우터</span>
                    <span style={{ fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px', textAlign: 'center' }} title={selectedOutfit.outer.name}>
                      {selectedOutfit.outer.name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.formGrid}>
              <div>
                <label className={styles.formLabel}>학생 이름</label>
                <input 
                  type="text" 
                  value={reserveName} 
                  onChange={(e) => setReserveName(e.target.value)} 
                  className="input-field" 
                  placeholder="예: 홍길동"
                  style={{ borderRadius: 'var(--radius-sm)' }}
                />
              </div>
              <div>
                <label className={styles.formLabel}>학년 및 반</label>
                <input 
                  type="text" 
                  value={reserveGrade} 
                  onChange={(e) => setReserveGrade(e.target.value)} 
                  className="input-field" 
                  placeholder="예: 3학년 2반"
                  style={{ borderRadius: 'var(--radius-sm)' }}
                />
              </div>
              <div>
                <label className={styles.formLabel}>학부모 연락처</label>
                <input 
                  type="text" 
                  value={reservePhone} 
                  onChange={(e) => setReservePhone(e.target.value)} 
                  className="input-field" 
                  placeholder="예: 010-1234-5678"
                  style={{ borderRadius: 'var(--radius-sm)' }}
                />
              </div>

              <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                <button 
                  className="glow-btn-secondary" 
                  style={{ flex: 1, borderRadius: 'var(--radius-md)' }}
                  onClick={() => { setIsOutfitReserveModalOpen(false); setSelectedOutfit(null); }}
                >
                  돌아가기
                </button>
                <button 
                  className="glow-btn" 
                  style={{ flex: 2, borderRadius: 'var(--radius-md)' }}
                  onClick={handleReserveOutfit}
                >
                  세트 일괄 신청하기 🎒
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR CONNECT MODAL */}
      {isQRModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsQRModalOpen(false)}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '380px', padding: '30px', position: 'relative', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={() => setIsQRModalOpen(false)}>
              <X size={16} />
            </button>

            <div className={styles.qrWrapper}>
              <QrCode size={48} style={{ color: 'hsl(var(--primary))' }} />
              <h3 style={{ fontSize: '18px', fontFamily: 'var(--font-title)', fontWeight: '800', marginTop: '15px' }}>
                모바일에서 편리하게 촬영하기
              </h3>
              <p style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', marginTop: '8px', lineHeight: '1.4' }}>
                스마트폰 카메라로 아래 QR 코드를 스캔하면, 모바일 전용 의류 촬영 및 AI 실측 등록 화면으로 연동됩니다.
              </p>
              
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`} 
                alt="Mobile Connection QR"
                className={styles.qrImage}
              />

              <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--muted))', padding: '12px', borderRadius: 'var(--radius-md)', width: '100%', border: '1px solid hsl(var(--border))', marginTop: '10px' }}>
                주소 복사 링크: <br />
                <a href={qrCodeUrl} target="_blank" rel="noreferrer" style={{ color: 'hsl(var(--secondary))', textDecoration: 'underline', wordBreak: 'break-all', fontWeight: '600' }}>
                  {qrCodeUrl}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gamification & Auth Modals */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChange={setCurrentUser}
        triggerToast={triggerToast}
      />

      <BadgeModal 
        isOpen={isBadgeModalOpen}
        onClose={() => setIsBadgeModalOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
}

