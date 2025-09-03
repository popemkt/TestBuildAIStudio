import React, { useRef } from 'react';
import { ICONS } from '../../constants';
import { useToastContext } from '../../context/ToastContext';
import { validateFile } from '../../services/validationService';
import Spinner from '../common/Spinner';

interface AttachmentManagerProps {
  attachments: string[];
  onAttachmentsChange: (attachments: string[]) => void;
  disabled?: boolean;
}

const AttachmentThumbnail: React.FC<{ src: string; alt: string }> = ({
  src,
  alt,
}) => {
  const [isLoading, setIsLoading] = React.useState(true);
  return (
    <div className="relative h-24 w-full rounded-md border border-gray-200 bg-gray-200 dark:border-gray-700 dark:bg-gray-700">
      {isLoading && (
        <div className="absolute inset-0 flex animate-pulse items-center justify-center">
          <Spinner size="w-6 h-6" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`h-full w-full rounded-md object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
      />
    </div>
  );
};

const AttachmentManager: React.FC<AttachmentManagerProps> = ({
  attachments,
  onAttachmentsChange,
  disabled = false,
}) => {
  const toast = useToastContext();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationResult = validateFile(file);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      toast.error(firstError.message);
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      onAttachmentsChange([...attachments, dataUrl]);
    };
    reader.onerror = () => {
      toast.error('Failed to read file. Please try again.');
      event.target.value = '';
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const removeAttachment = (index: number) => {
    onAttachmentsChange(attachments.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
        Attachments
      </label>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {attachments.map((url, index) => (
          <div key={index} className="group relative">
            <AttachmentThumbnail src={url} alt={`Attachment ${index + 1}`} />
            <button
              type="button"
              onClick={() => removeAttachment(index)}
              disabled={disabled}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Remove image"
            >
              <ICONS.DELETE className="h-4 w-4" />
            </button>
          </div>
        ))}

        <input
          type="file"
          accept="image/*"
          ref={imageInputRef}
          onChange={handleFileSelection}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          disabled={disabled}
          className="flex h-24 w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-gray-300 text-sm text-gray-500 transition-colors hover:border-indigo-500 hover:text-indigo-500 dark:border-gray-600"
        >
          <ICONS.CAMERA className="h-5 w-5" />
          <span>Add Image</span>
        </button>
      </div>
    </div>
  );
};

export default AttachmentManager;
