import { Expense, User, Group } from '../types';
import { getCurrencySymbol } from '../constants/currencies';

export const exportGroupExpensesToCSV = (
  group: Group,
  expenses: Expense[],
  users: User[],
  showError?: (message: string) => void
) => {
  if (!expenses.length) {
    if (showError) {
      showError('No expenses to export.');
    }
    return;
  }

  const userMap = new Map(users.map((u) => [u.id, u.name]));
  const memberNames = group.members.map(
    (id) => userMap.get(id) || `Unknown User (${id.substring(0, 5)})`
  );

  let csvContent = 'data:text/csv;charset=utf-8,';
  const headers = [
    'Date',
    'Description',
    'Paid By',
    `Amount (${group.masterCurrency})`,
    'Original Amount',
    'Original Currency',
    'Conversion Rate',
    'Tags',
    ...memberNames.map((name) => `Owed by ${name} (${group.masterCurrency})`),
  ];
  csvContent += headers.join(',') + '\r\n';

  expenses.forEach((expense) => {
    const paidByName = userMap.get(expense.paidBy) || 'Unknown';
    const row = [
      new Date(expense.date).toLocaleDateString(),
      `"${expense.description.replace(/"/g, '""')}"`,
      paidByName,
      expense.amount.toFixed(2),
      expense.originalAmount.toFixed(2),
      expense.originalCurrency,
      expense.conversionRate ? expense.conversionRate.toFixed(6) : 'N/A',
      `"${expense.tags.join(', ')}"`,
    ];

    const owedAmounts = new Map(
      expense.participants.map((p) => [p.userId, p.amount])
    );
    group.members.forEach((memberId) => {
      row.push((owedAmounts.get(memberId) || 0).toFixed(2));
    });

    csvContent += row.join(',') + '\r\n';
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const safeGroupName = group.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  link.setAttribute('download', `${safeGroupName}_expenses.csv`);
  document.body.appendChild(link);

  link.click();
  document.body.removeChild(link);
};
