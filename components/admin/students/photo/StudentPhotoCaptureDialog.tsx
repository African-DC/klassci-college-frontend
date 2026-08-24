"use client"

import { useEffect } from "react"
import { Camera, Loader2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useLiveCamera } from "@/lib/hooks/useLiveCamera"

interface StudentPhotoCaptureDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCaptured: (file: File) => void
}

export function StudentPhotoCaptureDialog({
  open,
  onOpenChange,
  onCaptured,
}: StudentPhotoCaptureDialogProps) {
  const { videoRef, status, error, start, stop, capture } = useLiveCamera()
  const busy = status === "requesting"

  useEffect(() => {
    if (!open) {
      stop()
      return
    }
    void start()
    return () => stop()
  }, [open, start, stop])

  function handleOpenChange(next: boolean) {
    if (!next) stop()
    onOpenChange(next)
  }

  async function handleCapture() {
    const file = await capture()
    if (!file) return
    onCaptured(file)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Prendre une photo</DialogTitle>
          <DialogDescription>
            Placez le visage de l&apos;élève dans le cadre, puis validez. Vous pourrez reprendre avant d&apos;enregistrer.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-hidden rounded-lg bg-zinc-950">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="aspect-square h-auto w-full object-cover"
          />
        </div>

        {status === "requesting" && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Ouverture de la caméra...
          </p>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2">
            <p className="text-sm text-destructive">{error.message}</p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="outline" className="h-11" onClick={() => handleOpenChange(false)}>
            Annuler
          </Button>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 sm:flex-none"
              onClick={() => void start()}
              disabled={busy}
            >
              <RotateCcw className="h-4 w-4" />
              Relancer
            </Button>
            <Button
              type="button"
              className="h-11 flex-1 sm:flex-none"
              onClick={() => void handleCapture()}
              disabled={status !== "live"}
            >
              <Camera className="h-4 w-4" />
              Capturer
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
