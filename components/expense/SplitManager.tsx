import React from 'react';
import { User, SplitType } from '../../types';
import { ICONS } from '../../constants';
import Input from '../common/Input';
import Button from '../common/Button';
import Avatar from '../common/Avatar';

export type { SplitType };

interface SplitManagerProps {
  splitType: SplitType;
  onSplitTypeChange: (type: SplitType) => void;
  participants: User[];
  participantSplits: Record<string, number>;
  onParticipantSplitsChange: (splits: Record<string, number>) => void;
  amount: number;
  currency: string;
  groupMembers: User[];
  onParticipantsChange: (participants: User[]) => void;
  disabled?: boolean;
  aiFilledFields?: Set<string>;
}

const SplitManager: React.FC<SplitManagerProps> = ({
  splitType,
  onSplitTypeChange,
  participants,
  participantSplits,
  onParticipantSplitsChange,
  amount,
  currency,
  groupMembers,
  onParticipantsChange,
  disabled = false,
  aiFilledFields = new Set(),
}) => {
  const handleToggleParticipant = (member: User) => {
    if (disabled) return;

    const isCurrentlySelected = participants.some((p) => p.id === member.id);
    let newParticipants: User[];

    if (isCurrentlySelected) {
      newParticipants = participants.filter((p) => p.id !== member.id);
    } else {
      newParticipants = [...participants, member];
    }

    onParticipantsChange(newParticipants);
  };

  const handleToggleAllParticipants = () => {
    if (disabled) return;
    if (participants.length === groupMembers.length) {
      onParticipantsChange([]);
    } else {
      onParticipantsChange(groupMembers);
    }
  };

  const handleSplitChange = (userId: string, value: string) => {
    if (disabled) return;

    const numValue = parseFloat(value) || 0;
    const newSplits = { ...participantSplits, [userId]: numValue };
    onParticipantSplitsChange(newSplits);
  };

  const handlePartValueChange = (userId: string, change: number) => {
    const currentValue = participantSplits[userId] || 0;
    const newValue = Math.max(0, currentValue + change);
    onParticipantSplitsChange({ ...participantSplits, [userId]: newValue });
  };

  const { totalAllocated, remaining } = React.useMemo(() => {
    if (splitType !== SplitType.EXACT)
      return { totalAllocated: 0, remaining: 0 };
    const total = Object.values(participantSplits).reduce(
      (sum, val) => Number(sum) + Number(val || 0),
      0
    );
    const amountNum = Number(amount) || 0;
    return { totalAllocated: total, remaining: amountNum - total };
  }, [participantSplits, amount, splitType]);

  const totalParts = React.useMemo(() => {
    if (splitType !== SplitType.PARTS) return 0;
    return Object.values(participantSplits).reduce(
      (sum, val) => Number(sum) + Number(val || 0),
      0
    );
  }, [participantSplits, splitType]);

  const calculatedPartAmount = (userId: string) => {
    if (splitType !== SplitType.PARTS || totalParts === 0 || amount === 0)
      return 0;
    const userParts = participantSplits[userId] || 0;
    return (userParts / totalParts) * amount;
  };

  const progressPercentage = Math.min(
    100,
    (totalAllocated / (amount || 1)) * 100
  );
  const progressBarClass =
    remaining < -0.01
      ? 'bg-red-500'
      : Math.abs(remaining) < 0.01
        ? 'bg-green-500'
        : 'bg-indigo-500';

  return (
    <div className="space-y-3 rounded-lg bg-gray-100 p-3 dark:bg-slate-800">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Split Method (in {currency})
      </label>
      <div
        className={`flex w-full rounded-lg bg-gray-200 p-1 dark:bg-slate-700 ${aiFilledFields.has('split') ? 'ai-highlight' : ''}`}
        role="tablist"
        aria-label="Split method selection"
      >
        {(Object.keys(SplitType) as Array<keyof typeof SplitType>).map(
          (type) => (
            <button
              key={type}
              type="button"
              onClick={() => onSplitTypeChange(SplitType[type])}
              className={`w-full rounded-md px-2 py-1.5 text-sm font-medium transition-all ${splitType === SplitType[type] ? 'bg-white text-indigo-600 shadow dark:bg-slate-900 dark:text-indigo-400' : 'text-gray-600 hover:bg-white/50 dark:text-gray-300 dark:hover:bg-slate-600/50'}`}
              role="tab"
              aria-selected={splitType === SplitType[type]}
              aria-controls={`split-panel-${SplitType[type].toLowerCase()}`}
              aria-label={`Split expense ${SplitType[type].toLowerCase()}`}
            >
              {SplitType[type].charAt(0) +
                SplitType[type].slice(1).toLowerCase()}
            </button>
          )
        )}
      </div>

      <div className="space-y-4 pt-2">
        {splitType === SplitType.EQUAL && (
          <div
            role="tabpanel"
            id="split-panel-equal"
            aria-labelledby="split-equal-tab"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Select participants:
              </p>
              <button
                type="button"
                onClick={handleToggleAllParticipants}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                aria-label={
                  participants.length === groupMembers.length
                    ? 'Deselect all participants'
                    : 'Select all participants'
                }
              >
                {participants.length === groupMembers.length
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {groupMembers.map((member) => {
                const isSelected = participants.some((p) => p.id === member.id);
                return (
                  <button
                    type="button"
                    key={member.id}
                    onClick={() => handleToggleParticipant(member)}
                    className={`flex items-center gap-2 rounded-lg border-2 p-2 text-left transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50' : 'border-transparent bg-gray-200 hover:bg-gray-300 dark:bg-slate-900 dark:hover:bg-slate-700/60'}`}
                    aria-pressed={isSelected}
                    aria-label={`${isSelected ? 'Remove' : 'Add'} ${member.name} as participant`}
                  >
                    <Avatar
                      src={member.avatarUrl}
                      alt={member.name}
                      size="sm"
                    />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {member.name}
                    </span>
                  </button>
                );
              })}
            </div>
            {amount > 0 && participants.length > 0 && (
              <div className="mt-3 rounded-lg bg-slate-200/50 p-2 text-center text-sm text-gray-600 dark:bg-slate-700/50 dark:text-gray-400">
                Splitting <strong>${(amount || 0).toFixed(2)}</strong> between{' '}
                <strong>{participants.length}</strong> people (
                <strong>
                  ${((amount || 0) / participants.length).toFixed(2)}
                </strong>
                /person)
              </div>
            )}
          </div>
        )}

        {splitType === SplitType.EXACT && (
          <div
            role="tabpanel"
            id="split-panel-exact"
            aria-labelledby="split-exact-tab"
            className="space-y-3"
          >
            <div className="sr-only" aria-live="polite" aria-atomic="true">
              {`Currently allocated ${totalAllocated.toFixed(2)} of ${(amount || 0).toFixed(2)} ${currency}. ${remaining.toFixed(2)} remaining.`}
            </div>
            {groupMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                <Avatar src={member.avatarUrl} alt={member.name} size="md" />
                <label
                  htmlFor={`split-${member.id}`}
                  className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {member.name}
                </label>
                <div className="relative w-32 rounded-md bg-gray-200 dark:bg-slate-900">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-500">
                    {currency}
                  </span>
                  <input
                    type="number"
                    id={`split-${member.id}`}
                    value={participantSplits[member.id] ?? ''}
                    onChange={(e) =>
                      handleSplitChange(member.id, e.target.value)
                    }
                    className="w-full border-none bg-transparent py-2 pl-7 pr-2 text-right font-semibold text-gray-800 focus:ring-0 dark:text-gray-100"
                    placeholder="0.00"
                    step="0.01"
                    aria-label={`Amount for ${member.name} in ${currency}`}
                    aria-describedby="split-allocation-status"
                  />
                </div>
              </div>
            ))}
            <div className="space-y-2 pt-2">
              <div className="h-2.5 w-full rounded-full bg-gray-200 dark:bg-slate-700">
                <div
                  className={`h-2.5 rounded-full transition-all duration-300 ${progressBarClass}`}
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <p>
                  Total:{' '}
                  <span className="font-semibold">
                    {totalAllocated.toFixed(2)}
                  </span>{' '}
                  / {(amount || 0).toFixed(2)}
                </p>
                <p
                  className={
                    Math.abs(remaining) > 0.01
                      ? 'text-red-500'
                      : 'text-green-500'
                  }
                >
                  {remaining >= -0.01 ? 'Remaining:' : 'Over by:'}{' '}
                  <span className="font-semibold">
                    {Math.abs(remaining).toFixed(2)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {splitType === SplitType.PARTS && (
          <div
            role="tabpanel"
            id="split-panel-parts"
            aria-labelledby="split-parts-tab"
            className="space-y-3"
          >
            <div className="sr-only" aria-live="polite" aria-atomic="true">
              {`Splitting by parts. Total parts: ${totalParts}. ${groupMembers.map((m) => `${m.name}: ${participantSplits[m.id] || 0} parts (${currency}${calculatedPartAmount(m.id).toFixed(2)})`).join(', ')}`}
            </div>
            {groupMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                <Avatar src={member.avatarUrl} alt={member.name} size="md" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {member.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currency}
                    {calculatedPartAmount(member.id).toFixed(2)}
                  </p>
                </div>
                <div
                  className="flex items-center gap-2 rounded-full bg-gray-200 p-1 dark:bg-slate-900"
                  role="group"
                  aria-label={`${member.name}'s share controls`}
                >
                  <button
                    type="button"
                    onClick={() => handlePartValueChange(member.id, -1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-lg font-bold text-gray-600 transition-colors hover:bg-gray-400 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700"
                    aria-label={`Decrease ${member.name}'s share`}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={participantSplits[member.id] ?? '0'}
                    onChange={(e) =>
                      handleSplitChange(member.id, e.target.value)
                    }
                    className="w-12 border-none bg-transparent text-center font-semibold text-gray-800 focus:ring-0 dark:text-gray-100"
                    aria-label={`${member.name}'s share in parts`}
                    min="0"
                    step="1"
                  />
                  <button
                    type="button"
                    onClick={() => handlePartValueChange(member.id, 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-lg font-bold text-gray-600 transition-colors hover:bg-gray-400 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700"
                    aria-label={`Increase ${member.name}'s share`}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
            <div className="pt-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
              <p>
                Total Parts: <span className="font-semibold">{totalParts}</span>{' '}
                &nbsp;&nbsp; Total Amount:{' '}
                <span className="font-semibold">
                  {currency}
                  {(amount || 0).toFixed(2)}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SplitManager;
