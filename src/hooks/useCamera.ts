import { useCallback, useEffect, useRef, useState } from 'react';

interface UseCameraReturn {
  isCameraOpen: boolean;
  cameraStream: MediaStream | null;
  videoReady: boolean;
  cameraError: string | null;
  currentFacingMode: 'user' | 'environment';
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  startCamera: (facingMode?: 'user' | 'environment') => Promise<void>;
  stopCamera: () => void;
  switchCamera: () => Promise<void>;
  capturePhoto: () => string | null;
  capturePhotoBlob: () => Promise<Blob | null>;
}

export const useCamera = (): UseCameraReturn => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('environment');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async (facingMode: 'user' | 'environment' = currentFacingMode) => {
    try {
      setCameraError(null);
      setVideoReady(false);

      // Detener stream anterior si existe
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }

      // Verificar disponibilidad de mediaDevices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia no está disponible en este navegador');
      }

      let stream: MediaStream | null = null;

      // Intentar con la cámara especificada
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        setCurrentFacingMode(facingMode);
      } catch (specifiedError) {
        // Si falla, intentar con la cámara opuesta
        const oppositeFacingMode = facingMode === 'environment' ? 'user' : 'environment';
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: oppositeFacingMode },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
          setCurrentFacingMode(oppositeFacingMode);
        } catch (oppositeError) {
          // Como último recurso, usar configuración básica
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      if (stream) {
        setCameraStream(stream);
        setIsCameraOpen(true);
      } else {
        setCameraError('No se pudo obtener acceso a la cámara');
      }
    } catch (error) {
      let errorMessage = 'No se pudo acceder a la cámara. ';
      
      // Type guard para verificar si es un Error con propiedades name
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage += 'Permisos de cámara denegados. Por favor, permite el acceso a la cámara.';
        } else if (error.name === 'NotFoundError') {
          errorMessage += 'No se encontró ninguna cámara en el dispositivo.';
        } else if (error.name === 'NotReadableError') {
          errorMessage += 'La cámara está siendo usada por otra aplicación.';
        } else if (error.name === 'OverconstrainedError') {
          errorMessage += 'La configuración de la cámara no es compatible.';
        } else {
          errorMessage += 'Asegúrate de dar permisos de cámara a la aplicación y que no esté siendo usada por otra aplicación.';
        }
      } else {
        errorMessage += 'Asegúrate de dar permisos de cámara a la aplicación y que no esté siendo usada por otra aplicación.';
      }
      
      setCameraError(errorMessage);
    }
  }, [currentFacingMode, cameraStream, isCameraOpen, videoReady, cameraError]);

  const stopCamera = useCallback(() => {
    // Obtener el stream actual directamente del estado
    setCameraStream(currentStream => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
      return null;
    });
    
    // Limpiar el srcObject del video
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsCameraOpen(false);
    setCameraError(null);
    setVideoReady(false);
  }, []); // Sin dependencias para evitar bucles

  const switchCamera = useCallback(async () => {
    // Detener el stream actual usando la función de callback
    setCameraStream(currentStream => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
      return null;
    });
    
    setVideoReady(false);
    
    // Limpiar el srcObject del video
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Cambiar a la cámara opuesta
    const newFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    await startCamera(newFacingMode);
  }, [currentFacingMode, startCamera]);

  const capturePhoto = useCallback((): string | null => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        // Establecer el tamaño del canvas igual al video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Dibujar el frame actual del video en el canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convertir el canvas a base64
        const base64Image = canvas.toDataURL('image/jpeg', 0.8);
        return base64Image;
      }
    }
    return null;
  }, []);

  // Variante Blob: necesaria para subir directamente a Supabase Storage
  // sin pasar por Base64 (≈30% más pesado al codificar y desperdicia memoria).
  const capturePhotoBlob = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (context && video.videoWidth > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => resolve(blob),
            'image/jpeg',
            0.85,
          );
          return;
        }
      }
      resolve(null);
    });
  }, []);

  // Asignar stream al video cuando esté disponible
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      
      // Agregar event listeners
      videoRef.current.onloadedmetadata = () => {
        setVideoReady(true);
      };
      
      videoRef.current.oncanplay = () => {
        setVideoReady(true);
      };
      
      videoRef.current.onerror = (e) => {
        setCameraError('Error al reproducir el video de la cámara');
      };
    }
  }, [cameraStream]);

  // Limpiar la cámara al desmontar el componente o cuando cambie la página
  useEffect(() => {
    const handleBeforeUnload = () => {
      stopCamera();
    };

    const handleVisibilityChange = () => {
      if (document.hidden && isCameraOpen) {
        stopCamera();
      }
    };

    // Agregar listeners para limpiar la cámara
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopCamera();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // Solo ejecutar al montar/desmontar

  return {
    isCameraOpen,
    cameraStream,
    videoReady,
    cameraError,
    currentFacingMode,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    switchCamera,
    capturePhoto,
    capturePhotoBlob,
  };
};
