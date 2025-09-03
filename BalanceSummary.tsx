import React from 'react';
import { Group, Expense, User } from '../types';
import Avatar from './common/Avatar';
import { getCurrencySymbol } from '../constants/currencies';

interface BalanceSummaryProps {
  group: Group;
  expenses: Expense[];
  users: User[];
}

const BalanceSummary: React.FC<BalanceSummaryProps> = ({
  group,
  expenses,
  users,
}) => {
  const userMap = new Map(users.map((u) => [u.id, u]));

  // Initialize balances for all group members to zero.
  const balances = new Map<string, number>(
    group.members.map((memberId) => [memberId, 0])
  );
  const currencySymbol = getCurrencySymbol(group.masterCurrency);

  expenses.forEach((expense) => {
    const paidByBalance = balances.get(expense.paidBy) || 0;
    balances.set(expense.paidBy, paidByBalance + expense.amount);

    expense.participants.forEach((participant) => {
      const participantBalance = balances.get(participant.userId) || 0;
      balances.set(participant.userId, participantBalance - participant.amount);
    });
  });

  const sortedBalances = Array.from(balances.entries())
    .map(([userId, amount]) => ({ user: userMap.get(userId), amount }))
    .filter(
      (entry): entry is { user: User; amount: number } =>
        entry.user !== undefined
    )
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-3 p-4">
      <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
        Final Balances
      </h3>
      {sortedBalances.length === 0 && (
        <p className="text-sm text-gray-500">
          No expenses yet to calculate balances.
        </p>
      )}
      {sortedBalances.map(({ user, amount }) => (
        <div
          key={user.id}
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-100 p-3 dark:border-gray-700 dark:bg-gray-800/50"
        >
          <div className="flex items-center gap-3">
            <Avatar src={user.avatarUrl} alt={user.name} size="md" />
            <span className="font-medium">{user.name}</span>
          </div>
          <span
            className={`text-lg font-bold ${amount >= 0 ? 'text-green-500' : 'text-red-500'}`}
          >
            {amount >= 0 ? '+' : ''}
            {currencySymbol}
            {Math.abs(amount).toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default BalanceSummary;
