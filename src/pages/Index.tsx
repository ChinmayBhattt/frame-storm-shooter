import { useState, useRef, useEffect } from "react";
import { Camera, Upload, Image as ImageIcon, Download, Share2, Info, Instagram, Twitter, Linkedin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import frameImage from "@/assets/frame-hackstorm.png";
import logoHackersUnity from "@/assets/logo-hackers-unity.png";
import logoHackstorm from "@/assets/logo-hackstorm.png";
import heroBg from "@/assets/hero-bg.jpg";

const Index = () => {
  const [userImage, setUserImage] = useState<HTMLImageElement | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1, rotation: 0, flipH: false, flipV: false });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showEditor, setShowEditor] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  // Load and draw the composition
  const drawComposition = (canvas: HTMLCanvasElement) => {
    if (!userImage) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to frame size
    const frame = new Image();
    frame.src = frameImage;
    frame.onload = () => {
      canvas.width = frame.width;
      canvas.height = frame.height;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Calculate the area for user photo (center of frame with some padding)
      const photoArea = {
        x: canvas.width * 0.24,
        y: canvas.height * 0.12,
        width: canvas.width * 0.52,
        height: canvas.height * 0.64,
      };
      
      ctx.save();
      
      // Create clipping path for photo area
      ctx.beginPath();
      ctx.rect(photoArea.x, photoArea.y, photoArea.width, photoArea.height);
      ctx.clip();
      
      // Apply transformations
      const centerX = photoArea.x + photoArea.width / 2;
      const centerY = photoArea.y + photoArea.height / 2;
      
      ctx.translate(centerX + transform.x, centerY + transform.y);
      ctx.rotate((transform.rotation * Math.PI) / 180);
      ctx.scale(
        transform.scale * (transform.flipH ? -1 : 1),
        transform.scale * (transform.flipV ? -1 : 1)
      );
      
      // Calculate image dimensions to fit
      const imgAspect = userImage.width / userImage.height;
      const areaAspect = photoArea.width / photoArea.height;
      
      let drawWidth, drawHeight;
      if (imgAspect > areaAspect) {
        drawHeight = photoArea.height;
        drawWidth = drawHeight * imgAspect;
      } else {
        drawWidth = photoArea.width;
        drawHeight = drawWidth / imgAspect;
      }
      
      ctx.drawImage(
        userImage,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight
      );
      
      ctx.restore();
      
      // Draw frame overlay
      ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
    };
  };

  useEffect(() => {
    if (canvasRef.current && userImage) {
      drawComposition(canvasRef.current);
    }
    if (previewCanvasRef.current && userImage) {
      drawComposition(previewCanvasRef.current);
    }
  }, [userImage, transform]);

  const handleImageLoad = (src: string) => {
    const img = new Image();
    img.onload = () => {
      setUserImage(img);
      setShowEditor(true);
      setTransform({ x: 0, y: 0, scale: 1, rotation: 0, flipH: false, flipV: false });
      toast.success("Image loaded! Adjust it to fit perfectly.");
    };
    img.src = src;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleImageLoad(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setStream(mediaStream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      toast.error("Camera access denied. Please use the Browse option.");
      console.error("Camera error:", error);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        handleImageLoad(dataUrl);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const handleDownload = () => {
    if (!canvasRef.current || !userImage) {
      toast.error("Please add an image first!");
      return;
    }
    
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    link.download = `hackstorm_${timestamp}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Image downloaded successfully!");
  };

  const handleWhatsAppShare = () => {
    if (!userImage) {
      toast.error("Please add an image first!");
      return;
    }
    
    const text = "Check out my HackStorm 2024 frame! 🎮⚡ Join us at JEC Kukas for 24hrs of innovation!";
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}%0A%0A*Note:* Please download and attach the image you just created!`;
    window.open(whatsappUrl, "_blank");
  };

  // Mouse/Touch handlers for dragging
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.1, Math.min(3, prev.scale + delta)),
    }));
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Hero Background */}
      <div 
        className="fixed inset-0 z-0 opacity-30"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      />
      
      {/* Animated particles overlay */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-pulse-glow" />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-secondary rounded-full animate-pulse-glow" style={{ animationDelay: "0.5s" }} />
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-primary rounded-full animate-pulse-glow" style={{ animationDelay: "1s" }} />
        <div className="absolute top-2/3 right-1/4 w-1 h-1 bg-secondary rounded-full animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-8 sticky top-0 bg-background/80 backdrop-blur-md py-4 rounded-lg mb-6 border border-primary/20">
          <h1 className="text-5xl md:text-7xl font-black text-primary glow-text mb-2 tracking-tighter">
            HACKSTORM
          </h1>
          <p className="text-lg md:text-xl text-secondary font-bold tracking-wide">
            24 HRS HACKATHON — JEC (31st Oct - 1st Nov)
          </p>
        </header>

        {/* CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="btn-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-8 py-6"
            size="lg"
          >
            <Upload className="mr-2" /> Upload Your Image
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="border-2 border-primary text-primary hover:bg-primary/10 font-bold text-lg px-8 py-6"
                size="lg"
              >
                <Info className="mr-2" /> How it Works
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-primary/30">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-primary">How to Create Your Frame</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-foreground">
                <div className="flex gap-3">
                  <div className="text-primary font-bold text-xl">1.</div>
                  <div>
                    <p className="font-semibold">Choose Your Image Source</p>
                    <p className="text-sm text-muted-foreground">Click Camera to take a live photo, Browse to upload from your device, or Gallery to select from your photos.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="text-primary font-bold text-xl">2.</div>
                  <div>
                    <p className="font-semibold">Adjust Your Photo</p>
                    <p className="text-sm text-muted-foreground">Drag to move, scroll/pinch to zoom, use the rotation slider, or flip your image to get the perfect fit.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="text-primary font-bold text-xl">3.</div>
                  <div>
                    <p className="font-semibold">Download & Share</p>
                    <p className="text-sm text-muted-foreground">Click Download to save your framed image, then share it on WhatsApp and social media!</p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Upload Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
          <Button
            onClick={startCamera}
            variant="outline"
            className="border-2 border-secondary text-secondary hover:bg-secondary/10 h-24 text-lg font-semibold"
          >
            <Camera className="mr-2 w-6 h-6" />
            Camera
          </Button>
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="border-2 border-primary text-primary hover:bg-primary/10 h-24 text-lg font-semibold"
          >
            <Upload className="mr-2 w-6 h-6" />
            Browse
          </Button>
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="border-2 border-accent text-accent hover:bg-accent/10 h-24 text-lg font-semibold"
          >
            <ImageIcon className="mr-2 w-6 h-6" />
            Gallery
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Camera Modal */}
        {showCamera && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
            <div className="bg-card rounded-lg p-6 max-w-2xl w-full border-2 border-primary">
              <h3 className="text-2xl font-bold mb-4 text-primary">Take Your Photo</h3>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg mb-4"
              />
              <div className="flex gap-4 justify-center">
                <Button onClick={capturePhoto} className="btn-glow bg-primary text-primary-foreground">
                  <Camera className="mr-2" /> Capture
                </Button>
                <Button onClick={stopCamera} variant="outline" className="border-destructive text-destructive">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Editor Section */}
        {showEditor && userImage && (
          <div className="bg-card/50 backdrop-blur-sm rounded-lg p-6 mb-8 border-2 border-primary/30 glow-border">
            <h2 className="text-2xl font-bold mb-4 text-primary">Adjust Your Photo</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Canvas Preview */}
              <div className="space-y-4">
                <div 
                  className="relative bg-muted rounded-lg overflow-hidden cursor-move touch-none"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onWheel={handleWheel}
                >
                  <canvas
                    ref={canvasRef}
                    className="w-full h-auto"
                  />
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Drag to move • Scroll to zoom
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    Rotation: {transform.rotation}°
                  </label>
                  <Slider
                    value={[transform.rotation]}
                    onValueChange={([value]) => setTransform(prev => ({ ...prev, rotation: value }))}
                    min={-180}
                    max={180}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    Zoom: {transform.scale.toFixed(2)}x
                  </label>
                  <Slider
                    value={[transform.scale]}
                    onValueChange={([value]) => setTransform(prev => ({ ...prev, scale: value }))}
                    min={0.1}
                    max={3}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setTransform(prev => ({ ...prev, flipH: !prev.flipH }))}
                    variant="outline"
                    className="flex-1"
                  >
                    Flip Horizontal
                  </Button>
                  <Button
                    onClick={() => setTransform(prev => ({ ...prev, flipV: !prev.flipV }))}
                    variant="outline"
                    className="flex-1"
                  >
                    Flip Vertical
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setTransform({ x: 0, y: 0, scale: 1, rotation: 0, flipH: false, flipV: false })}
                    variant="outline"
                    className="flex-1"
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={() => setTransform(prev => ({ ...prev, scale: 1, x: 0, y: 0 }))}
                    variant="outline"
                    className="flex-1"
                  >
                    Fit
                  </Button>
                </div>

                {/* Preview */}
                <div className="border-2 border-primary/20 rounded-lg p-4">
                  <p className="text-sm font-semibold mb-2">Preview:</p>
                  <canvas
                    ref={previewCanvasRef}
                    className="w-full h-auto rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Download & Share */}
        {userImage && (
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Button
              onClick={handleDownload}
              className="btn-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-8 py-6"
              size="lg"
            >
              <Download className="mr-2" /> Download Frame
            </Button>
            
            <Button
              onClick={handleWhatsAppShare}
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold text-lg px-8 py-6"
              size="lg"
            >
              <Share2 className="mr-2" /> Share to WhatsApp
            </Button>
          </div>
        )}

        {/* WhatsApp Community CTA */}
        <div className="text-center mb-8">
          <Button
            onClick={() => window.open("https://chat.whatsapp.com/BQJ9fBkwOMpBuLIQ5Z9Jni", "_blank")}
            className="btn-glow bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg px-10 py-6 animate-pulse-glow"
            size="lg"
          >
            <MessageCircle className="mr-2" /> Join Our WhatsApp Community
          </Button>
        </div>

        {/* Footer */}
        <footer className="bg-card/50 backdrop-blur-sm rounded-lg p-6 border-2 border-primary/20">
          {/* Logos */}
          <div className="flex justify-center items-center gap-8 mb-6 flex-wrap">
            <img src={logoHackersUnity} alt="Hacker's Unity" className="h-16 object-contain" />
            <img src={logoHackstorm} alt="HackStorm" className="h-16 object-contain" />
          </div>

          {/* Location */}
          <div className="text-center mb-6">
            <a
              href="https://jeckukas.org.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 font-semibold text-lg underline"
            >
              JEC Kukas - Jaipur Engineering College
            </a>
          </div>

          {/* Social Links */}
          <div className="flex justify-center gap-6 mb-6">
            <a href="#" className="text-foreground hover:text-primary transition-colors">
              <Instagram className="w-6 h-6" />
            </a>
            <a href="#" className="text-foreground hover:text-primary transition-colors">
              <Twitter className="w-6 h-6" />
            </a>
            <a href="#" className="text-foreground hover:text-primary transition-colors">
              <Linkedin className="w-6 h-6" />
            </a>
            <a href="#" className="text-foreground hover:text-primary transition-colors">
              <MessageCircle className="w-6 h-6" />
            </a>
          </div>

          {/* Organizer Contacts */}
          <div className="border-t border-primary/20 pt-4">
            <h3 className="text-center font-bold text-primary mb-3">Organizers</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center text-sm">
              <div>
                <p className="font-semibold">Chinmay Bhatt</p>
                <a href="tel:+918852924002" className="text-muted-foreground hover:text-primary">
                  +91 8852924002
                </a>
              </div>
              <div>
                <p className="font-semibold">Jha Suraj Kumar</p>
                <a href="tel:+919324264950" className="text-muted-foreground hover:text-primary">
                  +91 9324264950
                </a>
              </div>
              <div>
                <p className="font-semibold">Amit Kumar</p>
                <a href="tel:+919256954320" className="text-muted-foreground hover:text-primary">
                  +91 9256954320
                </a>
              </div>
            </div>
          </div>

          <div className="text-center mt-6 text-xs text-muted-foreground">
            <p>HackStorm Framer © 2024 • Built with ⚡ by Hacker's Unity</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
