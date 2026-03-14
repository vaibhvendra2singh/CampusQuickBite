/* eslint-disable @typescript-eslint/no-explicit-any */
 
import { useState } from 'react';
import { FiX, FiStar, FiMessageSquare } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../hooks/context/ToastContext';

interface RatingModalProps {
    isOpen: boolean;
    onClose: () => void;
    menuItemId?: number;
    menuItemName?: string;
    outletId?: number;
    outletName?: string;
    onRatingSubmitted?: () => void;
}

const RatingModal = ({ isOpen, onClose, menuItemId, menuItemName, outletId, outletName, onRatingSubmitted }: RatingModalProps) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            showToast("Please select a rating.", 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/ratings', {
                menuItemId,
                outletId,
                ratingValue: rating,
                comment
            });
            showToast("Rating submitted!", 'success');
            if (onRatingSubmitted) onRatingSubmitted();
            onClose();
        } catch (error: any) {
            console.error("Failed to submit rating", error);
            const msg = error.response?.data?.details
                ? `${error.response.data.error}: ${error.response.data.details}`
                : (error.response?.data?.error || "Failed to submit rating.");
            showToast(msg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-none">
            <div className="relative w-full max-w-md bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
                    <h3 className="font-bold text-[var(--text-primary)] text-base">{outletId ? 'Rate this Outlet' : 'Rate your meal'}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-input)] text-[var(--text-muted)] transition-colors">
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <p className="text-xs text-[var(--text-muted)] mb-1">{outletId ? 'OUTLET' : 'MENU ITEM'}</p>
                        <h4 className="text-xl font-bold text-[var(--text-primary)]">{outletName || menuItemName}</h4>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">How was it?</label>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHover(star)}
                                    onMouseLeave={() => setHover(0)}
                                    className="transition-"
                                >
                                    <FiStar
                                        className={`w-10 h-10 stroke-[2] transition-all
 ${(hover || rating) >= star
                                                ? 'fill-amber-400 text-amber-400'
                                                : 'text-[var(--border-color)]'}`}
                                    />
                                </button>
                            ))}
                            <span className="ml-3 font-bold text-lg text-[var(--text-primary)]">{rating || hover || 0}/5</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2 flex items-center gap-1.5">
                            <FiMessageSquare className="w-3.5 h-3.5" /> Comment (optional)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl p-4 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all text-sm h-28 resize-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                            placeholder="What did you think?"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || rating === 0}
                        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all
 ${rating === 0 || isSubmitting
                                ? 'bg-[var(--bg-input)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border-color)]'
                                : 'btn-primary '}`}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit rating'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RatingModal;
