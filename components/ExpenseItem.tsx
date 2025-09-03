import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Expense, Group, User } from '../types';
import { useAppStore } from '../store/appStore';
import Tag from './common/Tag';
import { ICONS } from '../constants';
import { getCurrencySymbol } from '../constants/currencies';
import Modal from './common/Modal';
import Spinner from './common/Spinner';

interface ExpenseItemProps {
  expense: Expense;
  group: Group;
  userMap: Map<string, User>;
}

const ExpenseItem: React.FC<ExpenseItemProps> = ({
  expense,
  group,
  userMap,
}) => {
  const { currentUser } = useAppStore();
  const navigate = useNavigate();

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(true);

  const masterCurrencySymbol = getCurrencySymbol(group.masterCurrency);
  const originalCurrencySymbol = getCurrencySymbol(expense.originalCurrency);

  const payer = userMap.get(expense.paidBy);
  const userParticipation = expense.participants.find(
    (p) => p.userId === currentUser?.id
  );

  useEffect(() => {
    setIsImageLoading(true);
  }, [currentImageIndex, isImageModalOpen]);

  const getParticipationText = () => {
    if (!userParticipation) {
      return { text: 'Not involved', color: 'text-gray-500' };
    }
    if (expense.paidBy === currentUser?.id) {
      const amountOwedToUser = expense.amount - userParticipation.amount;
      if (amountOwedToUser > 0.01) {
        return {
          text: `You are owed ${masterCurrencySymbol}${amountOwedToUser.toFixed(2)}`,
          color: 'text-green-500',
        };
      } else {
        return { text: `You paid your share`, color: 'text-gray-500' };
      }
    } else {
      return {
        text: `You owe ${masterCurrencySymbol}${userParticipation.amount.toFixed(2)}`,
        color: 'text-red-500',
      };
    }
  };

  const participation = getParticipationText();
  const isDifferentCurrency = expense.originalCurrency !== group.masterCurrency;

  return (
    <>
      <div
        className="flex w-full cursor-pointer items-center border-b border-gray-200 p-4 text-left transition-colors duration-150 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
        onClick={() => navigate(`/edit-expense/${expense.id}`)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigate(`/edit-expense/${expense.id}`);
          }
        }}
        aria-label={`View details for ${expense.description}`}
      >
        <div className="mr-4">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <div className="font-bold">
              {new Date(expense.date).toLocaleString('default', {
                month: 'short',
              })}
            </div>
            <div className="text-lg">{new Date(expense.date).getDate()}</div>
          </div>
        </div>
        <div className="flex-grow">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-800 dark:text-white">
              {expense.description}
            </p>
            {expense.attachments && expense.attachments.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(0);
                  setIsImageModalOpen(true);
                }}
                className="rounded-full p-1 text-gray-400 hover:text-indigo-500"
                aria-label="View attachments"
              >
                <ICONS.PAPERCLIP className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {payer?.name} paid {masterCurrencySymbol}
            {expense.amount.toFixed(2)}
            {isDifferentCurrency && (
              <span className="ml-2 text-gray-400 dark:text-gray-500">
                ({originalCurrencySymbol}
                {expense.originalAmount.toLocaleString()})
              </span>
            )}
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {expense.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        </div>
        <div className="text-right">
          <p className={`text-sm font-bold ${participation.color}`}>
            {participation.text}
          </p>
        </div>
      </div>
      {expense.attachments && expense.attachments.length > 0 && (
        <Modal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          title={`Attachment ${currentImageIndex + 1} of ${expense.attachments.length}`}
        >
          <div className="relative">
            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700">
                <Spinner />
              </div>
            )}
            <img
              src={expense.attachments[currentImageIndex]}
              alt={`Expense attachment ${currentImageIndex + 1}`}
              className={`max-h-[75vh] w-full rounded-lg object-contain transition-opacity duration-300 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setIsImageLoading(false)}
            />
            {expense.attachments.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentImageIndex((prev) => Math.max(0, prev - 1))
                  }
                  disabled={currentImageIndex === 0}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/75 disabled:opacity-50"
                  aria-label="Previous image"
                >
                  <ICONS.BACK className="h-6 w-6" />
                </button>
                <button
                  onClick={() =>
                    setCurrentImageIndex((prev) =>
                      Math.min(expense.attachments!.length - 1, prev + 1)
                    )
                  }
                  disabled={
                    currentImageIndex === expense.attachments.length - 1
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/75 disabled:opacity-50"
                  aria-label="Next image"
                >
                  <ICONS.CHEVRON_RIGHT className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
        </Modal>
      )}
    </>
  );
};

export default ExpenseItem;
