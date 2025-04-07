import React, { useState, useEffect } from 'react';
import { FrownIcon, MehIcon, SmileIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (rating: number, comment: string) => void;
  onCancel: () => void;
}

const FEEDBACK_STORAGE_KEY = 'ask_feedback_submitted';

const RatingDialog: React.FC<RatingDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  onCancel
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState<boolean>(false);

  // Check if user has already submitted feedback
  useEffect(() => {
    try {
      const feedbackSubmitted = localStorage.getItem(FEEDBACK_STORAGE_KEY) === 'true';
      setHasSubmittedFeedback(feedbackSubmitted);
    } catch (e) {
      // In case localStorage is not available (private browsing etc.)
      console.log('Could not access localStorage');
    }
  }, []);

  // Reset the form when the dialog opens
  useEffect(() => {
    if (open) {
      setRating(0);
      setComment('');
      setHoveredRating(0);
    }
  }, [open]);

  const handleSubmit = () => {
    onSubmit(rating, comment);
    
    // Mark as submitted in localStorage
    try {
      localStorage.setItem(FEEDBACK_STORAGE_KEY, 'true');
      setHasSubmittedFeedback(true);
    } catch (e) {
      console.log('Could not save to localStorage');
    }
  };

  // Custom event handler for dialog close events
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // If dialog is closing without explicit submission, call onCancel
      onCancel();
    }
    onOpenChange(open);
  };

  // Rating icons with their respective emotions
  const ratingOptions = [
    { value: 1, icon: FrownIcon, label: 'Sad', color: 'text-red-500' },
    { value: 2, icon: MehIcon, label: 'Neutral', color: 'text-amber-500' },
    { value: 3, icon: SmileIcon, label: 'Happy', color: 'text-green-500' }
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="sm:max-w-sm rounded-2xl bg-white border border-gray-200 shadow-md p-4 font-sans" 
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <DialogHeader className="mb-1">
          <p className="text-center text-lg font-medium text-gray-700 font-sans" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            Rate your experience with Ask
            </p>
        </DialogHeader>
        
        {hasSubmittedFeedback ? (
          <div className="py-4 text-center text-gray-600 font-sans" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            <p>Thank you for your feedback!</p>
            <p className="text-sm mt-1">You have already submitted feedback.</p>
          </div>
        ) : (
          <div className="py-2 font-sans" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            <div className="flex items-center justify-center space-x-6 my-2">
              {ratingOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRating(option.value)}
                    onMouseEnter={() => setHoveredRating(option.value)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className={`focus:outline-none transition-transform hover:scale-110 p-2 rounded-full
                      ${rating === option.value ? 'bg-gray-50' : ''}`}
                    aria-label={`Rate as ${option.label}`}
                  >
                    <Icon 
                      size={27} 
                      className={`transition-all stroke-2 ${
                        (hoveredRating === option.value || rating === option.value) 
                          ? option.color
                          : 'text-gray-300'
                      }`} 
                      strokeWidth={2}
                    />
                  </button>
                );
              })}
            </div>
            
            <Textarea
              placeholder="Leave optional feedback or suggestions..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-1 resize-none border border-gray-200 text-xs rounded-xl text-gray-700"
              rows={1}
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            />
          </div>
        )}
        
        <DialogFooter className="flex justify-between items-center w-full mt-2">
          <a 
            href="https://askask.no" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors underline-offset-2 hover:underline"
            style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
          >
            Learn more about Ask
          </a>
        
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="rounded-xl text-xs text-gray-500 border-gray-100 hover:bg-gray-50"
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              {hasSubmittedFeedback ? 'Close' : 'Skip'}
            </Button>
            
            {!hasSubmittedFeedback && (
              <Button 
                onClick={handleSubmit} 
                disabled={rating === 0}
                className="rounded-xl text-s text-white"
                style={{ backgroundColor: "#28483F", fontFamily: "'Inter', system-ui, sans-serif" }}
              >
                Submit
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RatingDialog; 