import { useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Star, Trash2, Eye, EyeOff, Users, Loader2, ImagePlus, AlertCircle, ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ImageCropDialog } from '@/components/common/ImageCropDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';
import { CONFIG } from '@/lib/constants/config';
import { ROUTES } from '@/lib/constants/routes';
import { PHOTO_VISIBILITY_OPTIONS } from '@/lib/constants/enums';
import {
  useMyPhotos,
  useUploadPhoto,
  useSetPrimaryPhoto,
  useUpdatePhotoVisibility,
  useDeletePhoto,
} from '../hooks/usePhotos';
import type { PhotoData } from '../api/photo-api';

export default function PhotosPage() {
  const { data: response, isLoading } = useMyPhotos();
  const uploadPhoto = useUploadPhoto();
  const setPrimary = useSetPrimaryPhoto();
  const updateVisibility = useUpdatePhotoVisibility();
  const deletePhoto = useDeletePhoto();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PhotoData | null>(null);
  const [error, setError] = useState('');
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropFileName, setCropFileName] = useState('');

  const photos = response?.success ? response.data : [];
  const canUpload = photos.length < CONFIG.MAX_PHOTOS;

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setError('');

      const file = files[0];

      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Only JPG, PNG, and WebP files are allowed');
        return;
      }

      if (file.size > CONFIG.MAX_PHOTO_SIZE_MB * 1024 * 1024) {
        setError(`File must be under ${CONFIG.MAX_PHOTO_SIZE_MB}MB`);
        return;
      }

      if (!canUpload) {
        setError(`Maximum ${CONFIG.MAX_PHOTOS} photos allowed`);
        return;
      }

      // Open crop dialog instead of uploading directly
      const reader = new FileReader();
      reader.onload = () => {
        setCropImageSrc(reader.result as string);
        setCropFileName(file.name);
      };
      reader.readAsDataURL(file);
    },
    [canUpload],
  );

  const handleCropComplete = useCallback(
    async (croppedBlob: Blob) => {
      const file = new File([croppedBlob], cropFileName || 'photo.jpg', { type: 'image/jpeg' });
      setCropImageSrc(null);

      try {
        await uploadPhoto.mutateAsync(file);
      } catch {
        setError('Upload failed. Please try again.');
      }
    },
    [cropFileName, uploadPhoto],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Button variant="ghost" size="sm" asChild className="mb-2">
        <Link to={ROUTES.MY_PROFILE}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Profile
        </Link>
      </Button>

      <PageHeader
        title="My Photos"
        description={`${photos.length} of ${CONFIG.MAX_PHOTOS} photos uploaded`}
      />

      {/* Upload area */}
      {canUpload && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload photo. Click or drag and drop an image file."
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
          className={cn(
            'relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all focus-ring',
            dragActive
              ? 'border-primary-700 bg-primary-50'
              : 'border-border hover:border-primary-300 hover:bg-warm-50',
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />

          {uploadPhoto.isPending ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary-700" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50">
                <ImagePlus className="h-7 w-7 text-primary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Drop a photo here or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG, or WebP. Max {CONFIG.MAX_PHOTO_SIZE_MB}MB.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Photo grid */}
      {photos.length === 0 ? (
        <EmptyState
          icon={<Upload className="h-8 w-8" />}
          title="No photos yet"
          description="Upload your first photo to get noticed by potential matches"
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <AnimatePresence>
            {photos.map((photo) => (
              <motion.div
                key={photo.photoId}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card className="overflow-hidden border-0 shadow-soft group relative">
                  <div className="aspect-square relative">
                    <img
                      src={photo.url}
                      alt="Profile photo"
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />

                    {/* Primary badge */}
                    {photo.isPrimary && (
                      <Badge className="absolute top-2 left-2" variant="gold">
                        <Star className="mr-1 h-3 w-3 fill-current" />
                        Primary
                      </Badge>
                    )}

                    {/* Visibility badge */}
                    <Badge
                      className="absolute top-2 right-2"
                      variant={photo.visibility === 'all' ? 'success' : 'warning'}
                    >
                      {photo.visibility === 'all' ? (
                        <Eye className="h-3 w-3" />
                      ) : photo.visibility === 'contacts' ? (
                        <Users className="h-3 w-3" />
                      ) : (
                        <EyeOff className="h-3 w-3" />
                      )}
                    </Badge>

                    {/* Action overlay — visible on hover (desktop) or always (mobile) */}
                    <div className="absolute inset-0 bg-black/0 sm:group-hover:bg-black/40 transition-colors flex items-end justify-center sm:opacity-0 sm:group-hover:opacity-100 p-3 gap-2">
                      {!photo.isPrimary && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setPrimary.mutate(photo.photoId)}
                          disabled={setPrimary.isPending}
                          className="text-xs"
                        >
                          <Star className="mr-1 h-3 w-3" />
                          Set Primary
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteTarget(photo)}
                        className="text-xs"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Visibility control */}
                  <CardContent className="p-3">
                    <select
                      value={photo.visibility}
                      onChange={(e) =>
                        updateVisibility.mutate({
                          photoId: photo.photoId,
                          visibility: e.target.value,
                        })
                      }
                      className="w-full text-xs rounded-md border border-input bg-white px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {PHOTO_VISIBILITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Delete confirmation */}
      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Photo"
        description="Are you sure you want to delete this photo? This cannot be undone."
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) {
            deletePhoto.mutate(deleteTarget.photoId);
            setDeleteTarget(null);
          }
        }}
        loading={deletePhoto.isPending}
      />

      {/* Crop dialog */}
      {cropImageSrc && (
        <ImageCropDialog
          open={!!cropImageSrc}
          onOpenChange={(open) => { if (!open) setCropImageSrc(null); }}
          imageSrc={cropImageSrc}
          onCropComplete={handleCropComplete}
          loading={uploadPhoto.isPending}
        />
      )}
    </div>
  );
}
