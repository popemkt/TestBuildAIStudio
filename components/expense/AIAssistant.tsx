import React, { useState, useRef } from 'react';
import { User } from '../../types';
import { parseExpenseWithAI } from '../../services/geminiService';
import { validateFile } from '../../services/validationService';
import { useToastContext } from '../../context/ToastContext';
import { ICONS } from '../../constants';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Spinner from '../common/Spinner';

interface AIAssistantProps {
  groupMembers: User[];
  existingExpense?: any;
  onResult: (result: any, image?: { dataUrl: string }) => void;
  disabled: boolean;
}

const AIAssistant: React.FC<AIAssistantProps> = ({
  groupMembers,
  existingExpense,
  onResult,
  disabled,
}) => {
  const toast = useToastContext();

  // AI-related state
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiComboModalOpen, setIsAiComboModalOpen] = useState(false);
  const [isAiTextModalOpen, setIsAiTextModalOpen] = useState(false);
  const [aiPromptText, setAiPromptText] = useState('');
  const [aiImage, setAiImage] = useState<{
    dataUrl: string;
    base64Data: string;
    mimeType: string;
  } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Refs for file inputs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const scanReceiptInputRef = useRef<HTMLInputElement>(null);

  // Common AI parsing function
  const runAiParse = async (options: {
    text?: string;
    image?: typeof aiImage;
  }) => {
    if (!options.text && !options.image) {
      toast.error('Please provide text or an image for AI parsing.');
      return;
    }

    setIsAiLoading(true);
    try {
      const result = await parseExpenseWithAI({
        text: options.text,
        image: options.image || undefined,
        groupMembers,
        existingExpense,
      });

      if (result) {
        onResult(
          result,
          options.image ? { dataUrl: options.image.dataUrl } : undefined
        );
        toast.success('AI successfully parsed the expense details!');
        // Reset AI state
        setAiPromptText('');
        setAiImage(null);
        setIsAiComboModalOpen(false);
        setIsAiTextModalOpen(false);
      } else {
        toast.error('Could not extract details. Please enter them manually.');
      }
    } catch (error) {
      toast.error(
        'AI parsing failed. Please try again or enter details manually.'
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiComboSubmit = async () => {
    await runAiParse({ text: aiPromptText, image: aiImage });
  };

  const handleAiTextSubmit = async () => {
    await runAiParse({ text: aiPromptText });
  };

  // File handling with validation
  const handleFileSelection = (
    event: React.ChangeEvent<HTMLInputElement>,
    callback: (fileData: {
      dataUrl: string;
      base64Data: string;
      mimeType: string;
    }) => void
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file before processing using Zod schema
    const validationResult = validateFile(file);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      toast.error(firstError.message);
      event.target.value = ''; // Reset file input
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64String = dataUrl.split(',')[1];
      callback({ dataUrl, base64Data: base64String, mimeType: file.type });
    };
    reader.onerror = () => {
      toast.error('Failed to read file. Please try again.');
      event.target.value = ''; // Reset file input
    };
    reader.readAsDataURL(file);
    event.target.value = ''; // Reset file input
  };

  const handleAiImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelection(event, setAiImage);
  };

  const handleScanReceipt = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelection(event, (imageData) => {
      runAiParse({ image: imageData });
    });
  };

  return (
    <>
      <div
        className={`flex flex-col rounded-lg border border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 p-3 dark:border-indigo-700 dark:from-indigo-900/30 dark:to-blue-900/30 ${disabled ? 'opacity-50' : ''} ${isAiLoading ? 'ai-processing-shine' : ''}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ICONS.SPARKLES className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
            <h3 className="text-md font-semibold text-gray-900 dark:text-white">
              AI Assistant
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {!isExpanded && (
              <>
                <button
                  type="button"
                  onClick={() => scanReceiptInputRef.current?.click()}
                  disabled={disabled || isAiLoading}
                  className="rounded-full bg-white p-2 text-indigo-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:text-indigo-400 dark:hover:bg-slate-700"
                  title="Scan Receipt"
                  aria-label="Scan Receipt with Camera"
                >
                  <ICONS.CAMERA className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsAiTextModalOpen(true)}
                  disabled={disabled || isAiLoading}
                  className="rounded-full bg-white p-2 text-green-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:text-green-400 dark:hover:bg-slate-700"
                  title="Use AI Prompt"
                  aria-label="Use AI text prompt"
                >
                  <ICONS.MESSAGE_CIRCLE className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsAiComboModalOpen(true)}
                  disabled={disabled || isAiLoading}
                  className="rounded-full bg-white p-2 text-purple-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:text-purple-400 dark:hover:bg-slate-700"
                  title="Advanced (Image + Text)"
                  aria-label="Advanced AI with image and text"
                >
                  <ICONS.SPARKLES className="h-5 w-5" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              disabled={disabled || isAiLoading}
              className="rounded-full bg-white p-2 text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:text-gray-400 dark:hover:bg-slate-700"
              title={isExpanded ? 'Collapse' : 'Expand'}
              aria-expanded={isExpanded}
              aria-controls="ai-assistant-expanded-panel"
            >
              <ICONS.CHEVRON_DOWN
                className={`h-5 w-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>

        <div
          id="ai-assistant-expanded-panel"
          className={`overflow-hidden transition-[max-height,padding] duration-500 ease-in-out ${isExpanded ? 'max-h-[300px] pt-4' : 'max-h-0 pt-0'}`}
        >
          <div className="space-y-3">
            {/* Scan Receipt */}
            <button
              type="button"
              onClick={() => scanReceiptInputRef.current?.click()}
              disabled={disabled || isAiLoading}
              className="flex w-full items-center rounded-lg bg-white p-3 text-left transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:hover:bg-slate-700/60"
            >
              <div className="rounded-lg bg-indigo-100 p-3 dark:bg-indigo-900/40">
                <ICONS.CAMERA className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="ml-4 flex-grow">
                <p className="font-semibold text-gray-800 dark:text-white">
                  Scan Receipt
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Instantly capture details from a photo.
                </p>
              </div>
              <ICONS.CHEVRON_RIGHT className="ml-auto h-5 w-5 flex-shrink-0 text-gray-400" />
            </button>
            {/* Use AI Prompt */}
            <button
              type="button"
              onClick={() => setIsAiTextModalOpen(true)}
              disabled={disabled || isAiLoading}
              className="flex w-full items-center rounded-lg bg-white p-3 text-left transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:hover:bg-slate-700/60"
            >
              <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/40">
                <ICONS.MESSAGE_CIRCLE className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4 flex-grow">
                <p className="font-semibold text-gray-800 dark:text-white">
                  Use AI Prompt
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Describe the expense in your own words.
                </p>
              </div>
              <ICONS.CHEVRON_RIGHT className="ml-auto h-5 w-5 flex-shrink-0 text-gray-400" />
            </button>
            {/* Advanced (Image + Text) */}
            <button
              type="button"
              onClick={() => setIsAiComboModalOpen(true)}
              disabled={disabled || isAiLoading}
              className="flex w-full items-center rounded-lg bg-white p-3 text-left transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:hover:bg-slate-700/60"
            >
              <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900/40">
                <ICONS.SPARKLES className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4 flex-grow">
                <p className="font-semibold text-gray-800 dark:text-white">
                  Advanced (Image + Text)
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Upload an image and add instructions.
                </p>
              </div>
              <ICONS.CHEVRON_RIGHT className="ml-auto h-5 w-5 flex-shrink-0 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleAiImageUpload}
        className="hidden"
      />
      <input
        ref={scanReceiptInputRef}
        type="file"
        accept="image/*"
        onChange={handleScanReceipt}
        className="hidden"
      />

      {/* AI Text Modal */}
      <Modal
        isOpen={isAiTextModalOpen}
        onClose={() => setIsAiTextModalOpen(false)}
        title="AI Prompt"
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="ai-text-prompt"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Enter details
            </label>
            <textarea
              id="ai-text-prompt"
              value={aiPromptText}
              onChange={(e) => setAiPromptText(e.target.value)}
              placeholder="e.g. 'Lunch for 3 for $50, split between me and Bob' or 'Gas for the trip, $65.50'"
              className="h-24 w-full rounded-md border p-2 focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleAiTextSubmit}
              disabled={!aiPromptText}
              isLoading={isAiLoading}
            >
              <ICONS.SPARKLES className="h-5 w-5" />
              Generate Details
            </Button>
          </div>
        </div>
      </Modal>

      {/* AI Combo Modal */}
      <Modal
        isOpen={isAiComboModalOpen}
        onClose={() => setIsAiComboModalOpen(false)}
        title="Advanced AI Assistant"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Receipt Image (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              ref={imageInputRef}
              onChange={handleAiImageUpload}
              className="hidden"
            />
            {aiImage ? (
              <div className="group relative">
                <img
                  src={aiImage.dataUrl}
                  alt="Receipt preview"
                  className="max-h-48 w-full rounded-lg border object-contain dark:border-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setAiImage(null)}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Remove image"
                >
                  <ICONS.DELETE className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="flex h-24 w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-gray-300 text-sm text-gray-500 transition-colors hover:border-indigo-500 hover:text-indigo-500 dark:border-gray-600"
              >
                <ICONS.CAMERA className="h-6 w-6" />
                <span>Upload Receipt</span>
              </button>
            )}
          </div>

          <div>
            <label
              htmlFor="ai-prompt-text"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Prompt (Optional)
            </label>
            <textarea
              id="ai-prompt-text"
              value={aiPromptText}
              onChange={(e) => setAiPromptText(e.target.value)}
              placeholder="e.g. 'Lunch for 3, split between me and Bob' or 'Gas for the trip'"
              className="h-24 w-full rounded-md border p-2 focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleAiComboSubmit}
              disabled={!aiPromptText && !aiImage}
              isLoading={isAiLoading}
            >
              <ICONS.SPARKLES className="h-5 w-5" />
              Generate Details
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AIAssistant;
