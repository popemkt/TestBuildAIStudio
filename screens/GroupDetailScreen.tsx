import React, {
  useState,
  useMemo,
  useRef,
  useLayoutEffect,
  useEffect,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../store/appStore';
import { useToastContext } from '../context/ToastContext';
import { dataService } from '../services/data/DataServiceFacade';
import ExpenseItem from '../components/ExpenseItem';
import BalanceSummary from '../components/BalanceSummary';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { ICONS } from '../constants';
import { getCurrencySymbol } from '../constants/currencies';
import { exportGroupExpensesToCSV } from '../services/csvExporter';
import { Group, Expense, User } from '../types';
import Input from '../components/common/Input';
import Avatar from './../components/common/Avatar';
import Spinner from '../components/common/Spinner';

type Tab = 'expenses' | 'balances';
type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
type GroupByOption = 'none' | 'date' | 'category' | 'paidBy';

interface Filters {
  dateRange: { start: string; end: string };
  categories: string[];
  amountRange: { min: string; max: string };
}
const initialFilters: Filters = {
  dateRange: { start: '', end: '' },
  categories: [],
  amountRange: { min: '', max: '' },
};

const formatDateForGrouping = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  if (date.getTime() === today.getTime()) return 'Today';
  if (date.getTime() === yesterday.getTime()) return 'Yesterday';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const RadioOption: React.FC<{
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: (value: any) => void;
}> = ({ name, value, label, checked, onChange }) => {
  const baseClasses =
    'flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer';
  const checkedClasses = 'bg-indigo-50 dark:bg-indigo-900/50 border-indigo-500';
  const uncheckedClasses =
    'bg-gray-100 dark:bg-gray-700/50 border-transparent hover:border-gray-300 dark:hover:border-gray-500';
  return (
    <label
      className={`${baseClasses} ${checked ? checkedClasses : uncheckedClasses}`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="hidden"
      />
      <div
        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${checked ? 'border-indigo-600 bg-indigo-600' : 'border-gray-400 bg-transparent'}`}
      >
        {checked && <div className="h-2 w-2 rounded-full bg-white" />}
      </div>
      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
        {label}
      </span>
    </label>
  );
};

const GroupDetailScreen: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { currentUser } = useAppStore();
  const toast = useToastContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>('expenses');
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] =
    useState(false);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [groupBy, setGroupBy] = useState<GroupByOption>('none');
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [tempFilters, setTempFilters] = useState<Filters>(initialFilters);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [isMemberListScrollable, setIsMemberListScrollable] = useState(false);
  const memberListRef = useRef<HTMLDivElement>(null);
  const [inviteLink, setInviteLink] = useState('');

  const [editedGroupName, setEditedGroupName] = useState('');
  const [editedMemberIds, setEditedMemberIds] = useState<string[]>([]);

  const { data, isLoading: isGroupLoading } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => dataService.getGroupDetails(groupId!),
    enabled: !!groupId,
  });

  // FIX: `onSuccess` is deprecated in TanStack Query v5. Replaced with a `useEffect` hook to handle side effects after data is successfully fetched.
  useEffect(() => {
    if (data?.group) {
      setEditedGroupName(data.group.name);
      setEditedMemberIds(data.group.members);
    }
  }, [data]);

  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => dataService.getAllUsers(),
    staleTime: 1000 * 60 * 5,
    enabled: !!currentUser,
  });

  // FIX: Safely access properties from `data` which can be undefined during the query lifecycle. This avoids potential runtime errors and satisfies TypeScript.
  const group = data?.group;
  const groupExpenses = data?.expenses ?? [];
  const groupRelatedUsers = data?.users ?? [];

  const groupMembers = useMemo(
    () => groupRelatedUsers.filter((u) => group?.members.includes(u.id)),
    [groupRelatedUsers, group]
  );
  // FIX: Explicitly type the userMap to prevent type inference issues.
  const userMap = useMemo(
    () => new Map<string, User>(groupRelatedUsers.map((u) => [u.id, u])),
    [groupRelatedUsers]
  );

  const createInviteMutation = useMutation({
    mutationFn: (groupId: string) => dataService.createGroupInvite(groupId),
    onSuccess: (inviteCode) => {
      const link = `${window.location.origin}${window.location.pathname}#/join/${inviteCode}`;
      setInviteLink(link);
      setIsInviteModalOpen(true);
    },
    onError: (error) => toast.error(`Failed to create invite: ${error.message}`),
  });

  const editGroupMutation = useMutation({
    mutationFn: (updatedGroup: Group) => dataService.editGroup(updatedGroup),
    onSuccess: () => {
      toast.success('Group updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsManageModalOpen(false);
    },
    onError: (error) => toast.error(`Failed to save changes: ${error.message}`),
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (groupIdToDelete: string) =>
      dataService.deleteGroup(groupIdToDelete),
    onSuccess: () => {
      toast.success('Group deleted.');
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/groups', { replace: true });
    },
    onError: (error) => {
      toast.error(`Failed to delete group: ${error.message}`);
      setIsDeleteConfirmModalOpen(false);
    },
  });

  const uniqueCategories = useMemo(() => {
    const allTags = groupExpenses.flatMap((e) => e.tags);
    return [...new Set(allTags)];
  }, [groupExpenses]);

  const displayedItems = useMemo(() => {
    let processedExpenses = [...groupExpenses];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      processedExpenses = processedExpenses.filter(
        (expense) =>
          expense.description.toLowerCase().includes(query) ||
          expense.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          expense.amount.toFixed(2).includes(query) ||
          (userMap.get(expense.paidBy)?.name || '')
            .toLowerCase()
            .includes(query)
      );
    }
    if (filters.categories.length > 0) {
      processedExpenses = processedExpenses.filter((expense) =>
        filters.categories.every((cat) => expense.tags.includes(cat))
      );
    }
    if (filters.dateRange.start) {
      processedExpenses = processedExpenses.filter(
        (e) => new Date(e.date) >= new Date(filters.dateRange.start)
      );
    }
    if (filters.dateRange.end) {
      processedExpenses = processedExpenses.filter(
        (e) => new Date(e.date) <= new Date(filters.dateRange.end)
      );
    }
    const minAmount = parseFloat(filters.amountRange.min);
    const maxAmount = parseFloat(filters.amountRange.max);
    if (!isNaN(minAmount))
      processedExpenses = processedExpenses.filter(
        (e) => e.amount >= minAmount
      );
    if (!isNaN(maxAmount))
      processedExpenses = processedExpenses.filter(
        (e) => e.amount <= maxAmount
      );

    const sortExpenses = (expenses: Expense[]) =>
      [...expenses].sort((a, b) => {
        switch (sortBy) {
          case 'date-asc':
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          case 'amount-desc':
            return b.amount - a.amount;
          case 'amount-asc':
            return a.amount - b.amount;
          default:
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
      });

    if (groupBy === 'none') {
      return sortExpenses(processedExpenses);
    }

    const grouped = processedExpenses.reduce(
      (acc, expense) => {
        let key = 'Unknown';
        if (groupBy === 'date') key = formatDateForGrouping(expense.date);
        else if (groupBy === 'category')
          key = expense.tags[0] || 'Uncategorized';
        else if (groupBy === 'paidBy')
          key = userMap.get(expense.paidBy)?.name || 'Unknown';
        if (!acc[key]) acc[key] = [];
        acc[key].push(expense);
        return acc;
      },
      {} as Record<string, Expense[]>
    );

    Object.keys(grouped).forEach((key) => {
      grouped[key] = sortExpenses(grouped[key]);
    });

    const sortedGroupKeys = Object.keys(grouped).sort((a, b) => {
      if (groupBy === 'date') {
        const groupAExpenses = grouped[a] as Expense[];
        const groupBExpenses = grouped[b] as Expense[];
        if (!groupAExpenses[0] || !groupBExpenses[0]) return 0;
        return (
          new Date(groupBExpenses[0].date).getTime() -
          new Date(groupAExpenses[0].date).getTime()
        );
      }
      return a.localeCompare(b);
    });
    return sortedGroupKeys.reduce(
      (acc, key) => {
        acc[key] = grouped[key];
        return acc;
      },
      {} as Record<string, Expense[]>
    );
  }, [groupExpenses, searchQuery, filters, sortBy, groupBy, userMap]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.categories.length > 0) count++;
    if (filters.amountRange.min || filters.amountRange.max) count++;
    return count;
  }, [filters]);

  useLayoutEffect(() => {
    if (memberListRef.current) {
      setIsMemberListScrollable(
        memberListRef.current.scrollHeight > memberListRef.current.clientHeight
      );
    }
  }, [isManageModalOpen]);

  const totalSpent = groupExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const openManageModal = () => {
    if (group) setIsManageModalOpen(true);
  };
  
  const handleCreateInvite = () => {
    if (groupId) {
      createInviteMutation.mutate(groupId);
    }
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      toast.success('Invite link copied!');
    });
  };

  const handleMemberToggle = (userId: string) => {
    const isCurrentlyMember = editedMemberIds.includes(userId);
    if (isCurrentlyMember) {
      const hasFinancialInvolvement = groupExpenses.some(
        (exp) =>
          exp.paidBy === userId ||
          exp.participants.some((p) => p.userId === userId)
      );
      if (hasFinancialInvolvement) {
        toast.warning('Cannot remove a member who is part of an expense.');
        return;
      }
      setEditedMemberIds((prev) => prev.filter((id) => id !== userId));
    } else {
      setEditedMemberIds((prev) => [...prev, userId]);
    }
  };

  const handleSaveChanges = () => {
    if (!group || !editedGroupName.trim() || editedMemberIds.length === 0) {
      toast.error(
        'Group name cannot be empty and must have at least one member.'
      );
      return;
    }
    const updatedGroup: Group = {
      ...group,
      name: editedGroupName.trim(),
      members: editedMemberIds,
    };
    editGroupMutation.mutate(updatedGroup);
  };

  const handleDeleteGroup = () => {
    if (group) deleteGroupMutation.mutate(group.id);
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setIsFilterModalOpen(false);
  };

  const handleClearFilters = () => {
    setTempFilters(initialFilters);
  };

  const handleOpenFilterModal = () => {
    setTempFilters(filters);
    setIsFilterModalOpen(true);
  };

  if (isGroupLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <Spinner size="w-12 h-12" />
        <p className="mt-4 text-gray-500 dark:text-gray-400">
          Loading group details...
        </p>
      </div>
    );
  }
  if (!group) return <div className="p-4 text-center">Group not found.</div>;

  const currencySymbol = getCurrencySymbol(group.masterCurrency);
  return (
    <div className="flex h-full flex-col">
      <div
        className="relative overflow-hidden text-white shadow-md"
        style={{
          backgroundImage: `url(${group.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent" />
        <div className="relative z-10 p-4 pb-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white drop-shadow-md">
                {group.name}
              </h2>
              <p className="text-sm text-slate-200 drop-shadow">
                Total Spent:{' '}
                <span className="font-semibold text-white">
                  {currencySymbol}
                  {totalSpent.toFixed(2)}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/add-expense/${group.id}`)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                aria-label="Add Expense"
              >
                <ICONS.ADD className="h-5 w-5" />
              </button>
              <button
                onClick={() =>
                  exportGroupExpensesToCSV(
                    group,
                    groupExpenses,
                    groupRelatedUsers,
                    toast.error
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                aria-label="Export Expenses"
              >
                <ICONS.DOWNLOAD className="h-5 w-5" />
              </button>
              <button
                onClick={openManageModal}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                aria-label="Manage group settings"
              >
                <ICONS.SETTINGS className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div className="flex -space-x-2">
              {groupMembers.slice(0, 7).map((m) => (
                <Avatar
                  key={m.id}
                  src={m.avatarUrl}
                  alt={m.name}
                  size="sm"
                  className="ring-2 ring-white/50"
                />
              ))}
              {groupMembers.length > 7 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-600 text-xs font-bold text-white ring-2 ring-white/50">
                  +{groupMembers.length - 7}
                </div>
              )}
            </div>
            <nav className="flex">
              <button
                onClick={() => setActiveTab('expenses')}
                className={`border-b-2 px-3 pb-2 text-center text-sm font-medium transition-colors ${activeTab === 'expenses' ? 'border-indigo-400 text-white' : 'border-transparent text-slate-300 hover:text-white'}`}
              >
                Expenses
              </button>
              <button
                onClick={() => setActiveTab('balances')}
                className={`border-b-2 px-3 pb-2 text-center text-sm font-medium transition-colors ${activeTab === 'balances' ? 'border-indigo-400 text-white' : 'border-transparent text-slate-300 hover:text-white'}`}
              >
                Balances
              </button>
            </nav>
          </div>
        </div>
      </div>

      <div className="flex flex-grow flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
        {activeTab === 'expenses' && (
          <>
            <div className="border-b border-dashed border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
              <button
                type="button"
                onClick={() => setIsControlsOpen((prev) => !prev)}
                className="flex w-full items-center justify-between p-4"
                aria-expanded={isControlsOpen}
                aria-controls="controls-panel"
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">
                    Search & Filter
                  </h3>
                  {!isControlsOpen && (
                    <>
                      {' '}
                      {searchQuery && (
                        <ICONS.SEARCH className="h-4 w-4 text-indigo-400" />
                      )}{' '}
                      {sortBy !== 'date-desc' && (
                        <ICONS.SORT className="h-4 w-4 text-indigo-400" />
                      )}{' '}
                      {groupBy !== 'none' && (
                        <ICONS.GROUPING className="h-4 w-4 text-indigo-400" />
                      )}{' '}
                      {activeFilterCount > 0 && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">
                          {activeFilterCount}
                        </span>
                      )}
                    </>
                  )}
                </div>
                <ICONS.CHEVRON_DOWN
                  className={`h-5 w-5 text-gray-500 transition-transform duration-200 dark:text-gray-400 ${isControlsOpen ? 'rotate-180' : ''}`}
                />
              </button>
              <div
                className={`overflow-hidden transition-[max-height] duration-500 ease-in-out ${isControlsOpen ? 'max-h-[300px]' : 'max-h-0'}`}
              >
                <div id="controls-panel">
                  <div className="p-4 pt-0">
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <ICONS.SEARCH className="h-5 w-5 text-gray-400" />
                      </span>
                      <Input
                        type="search"
                        placeholder="Search expenses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full !pl-10 !pr-10"
                        aria-label="Search expenses"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute inset-y-0 right-0 flex items-center pr-3"
                          aria-label="Clear search"
                        >
                          <ICONS.CLOSE className="h-5 w-5 text-gray-400 hover:text-gray-800 dark:hover:text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 px-4 pb-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsSortModalOpen(true)}
                        className={`!px-3 transition-colors ${sortBy !== 'date-desc' ? 'border-indigo-500 ring-2 ring-indigo-500/50' : ''}`}
                      >
                        <ICONS.SORT className="h-4 w-4" />
                        Sort
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsGroupModalOpen(true)}
                        className={`!px-3 transition-colors ${groupBy !== 'none' ? 'border-indigo-500 ring-2 ring-indigo-500/50' : ''}`}
                      >
                        <ICONS.GROUPING className="h-4 w-4" />
                        Group
                      </Button>
                    </div>
                    <div className="relative">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleOpenFilterModal}
                        className={`!px-3 transition-colors ${activeFilterCount > 0 ? 'border-indigo-500 ring-2 ring-indigo-500/50' : ''}`}
                      >
                        <ICONS.FILTER className="h-4 w-4" />
                        Filter
                      </Button>
                      {activeFilterCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">
                          {activeFilterCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative flex-grow">
              <div className="no-scrollbar absolute inset-0 overflow-y-auto">
                {Array.isArray(displayedItems) ? (
                  displayedItems.length > 0 ? (
                    displayedItems.map((expense) => (
                      <ExpenseItem
                        key={expense.id}
                        expense={expense}
                        group={group}
                        userMap={userMap}
                      />
                    ))
                  ) : (
                    <p className="p-4 text-center text-gray-500">
                      No expenses found.
                    </p>
                  )
                ) : Object.keys(displayedItems).length > 0 ? (
                  Object.entries(displayedItems).map(
                    ([groupTitle, expensesInGroup]) => (
                      <div key={groupTitle}>
                        <h3 className="sticky top-0 z-[1] border-b border-t border-gray-200 bg-gray-50 px-4 py-1.5 text-sm font-semibold text-gray-600 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-300">
                          {groupTitle}
                        </h3>
                        {(expensesInGroup as Expense[]).map((expense) => (
                          <ExpenseItem
                            key={expense.id}
                            expense={expense}
                            group={group}
                            userMap={userMap}
                          />
                        ))}
                      </div>
                    )
                  )
                ) : (
                  <p className="p-4 text-center text-gray-500">
                    No expenses found.
                  </p>
                )}
              </div>
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent dark:from-gray-900"></div>
            </div>
          </>
        )}
        {activeTab === 'balances' && (
          <div className="relative flex-grow">
            <div className="no-scrollbar absolute inset-0 overflow-y-auto">
              <BalanceSummary
                group={group}
                expenses={groupExpenses}
                users={groupRelatedUsers}
              />
            </div>
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent dark:from-gray-900"></div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isSortModalOpen}
        onClose={() => setIsSortModalOpen(false)}
        title="Sort Expenses"
      >
        <div className="space-y-2">
          <RadioOption
            name="sort"
            value="date-desc"
            label="Date: Newest First"
            checked={sortBy === 'date-desc'}
            onChange={setSortBy}
          />
          <RadioOption
            name="sort"
            value="date-asc"
            label="Date: Oldest First"
            checked={sortBy === 'date-asc'}
            onChange={setSortBy}
          />
          <RadioOption
            name="sort"
            value="amount-desc"
            label="Amount: High to Low"
            checked={sortBy === 'amount-desc'}
            onChange={setSortBy}
          />
          <RadioOption
            name="sort"
            value="amount-asc"
            label="Amount: Low to High"
            checked={sortBy === 'amount-asc'}
            onChange={setSortBy}
          />
        </div>
      </Modal>
      <Modal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        title="Group Expenses By"
      >
        <div className="space-y-2">
          <RadioOption
            name="group"
            value="none"
            label="None"
            checked={groupBy === 'none'}
            onChange={setGroupBy}
          />
          <RadioOption
            name="group"
            value="date"
            label="Date"
            checked={groupBy === 'date'}
            onChange={setGroupBy}
          />
          <RadioOption
            name="group"
            value="category"
            label="Category"
            checked={groupBy === 'category'}
            onChange={setGroupBy}
          />
          <RadioOption
            name="group"
            value="paidBy"
            label="Who Paid"
            checked={groupBy === 'paidBy'}
            onChange={setGroupBy}
          />
        </div>
      </Modal>
      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title=""
      >
        <div className="flex h-[80vh] max-h-[600px] w-full flex-col">
          <h3 className="p-4 text-lg font-semibold">Filter Expenses</h3>
          <div className="relative flex-grow">
            <div className="no-scrollbar absolute inset-0 overflow-y-auto">
              <div className="space-y-6 p-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={tempFilters.dateRange.start}
                      onChange={(e) =>
                        setTempFilters((f) => ({
                          ...f,
                          dateRange: { ...f.dateRange, start: e.target.value },
                        }))
                      }
                      containerClassName="flex-1"
                      aria-label="Start date"
                    />
                    <Input
                      type="date"
                      value={tempFilters.dateRange.end}
                      onChange={(e) =>
                        setTempFilters((f) => ({
                          ...f,
                          dateRange: { ...f.dateRange, end: e.target.value },
                        }))
                      }
                      containerClassName="flex-1"
                      aria-label="End date"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Amount Range ({currencySymbol})
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={tempFilters.amountRange.min}
                      onChange={(e) =>
                        setTempFilters((f) => ({
                          ...f,
                          amountRange: {
                            ...f.amountRange,
                            min: e.target.value,
                          },
                        }))
                      }
                      containerClassName="flex-1"
                      aria-label="Minimum amount"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={tempFilters.amountRange.max}
                      onChange={(e) =>
                        setTempFilters((f) => ({
                          ...f,
                          amountRange: {
                            ...f.amountRange,
                            max: e.target.value,
                          },
                        }))
                      }
                      containerClassName="flex-1"
                      aria-label="Maximum amount"
                    />
                  </div>
                </div>
                {uniqueCategories.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Categories</label>
                    <div className="flex flex-wrap gap-2">
                      {uniqueCategories
                        .filter((c): c is string => typeof c === 'string')
                        .map((cat) => (
                          <button
                            key={cat}
                            onClick={() =>
                              setTempFilters((f) => ({
                                ...f,
                                categories: f.categories.includes(cat)
                                  ? f.categories.filter((c) => c !== cat)
                                  : [...f.categories, cat],
                              }))
                            }
                            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${tempFilters.categories.includes(cat) ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-200 bg-gray-100 text-gray-700 hover:border-indigo-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200'}`}
                          >
                            {cat}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent dark:from-gray-800"></div>
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 p-4 dark:border-gray-700">
            <Button variant="secondary" onClick={handleClearFilters}>
              Clear All
            </Button>
            <Button onClick={handleApplyFilters}>Apply Filters</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        title="Manage Group"
      >
        <div className="space-y-4">
          <Input
            label="Group Name"
            value={editedGroupName}
            onChange={(e) => setEditedGroupName(e.target.value)}
          />
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Members
              </label>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleCreateInvite}
                isLoading={createInviteMutation.isPending}
              >
                <ICONS.INVITE className="h-4 w-4" />
                Invite
              </Button>
            </div>
            <div className="relative">
              <div
                ref={memberListRef}
                className="no-scrollbar max-h-60 space-y-2 overflow-y-auto p-1"
              >
                {(allUsers || []).map((user) => {
                  const isSelected = editedMemberIds.includes(user.id);
                  const hasFinancialInvolvement =
                    isSelected &&
                    groupExpenses.some(
                      (exp) =>
                        exp.paidBy === user.id ||
                        exp.participants.some((p) => p.userId === user.id)
                    );
                  return (
                    <button
                      key={user.id}
                      onClick={() => handleMemberToggle(user.id)}
                      className={`flex w-full items-center justify-between gap-3 rounded-lg border-2 p-2 text-left transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50' : 'border-transparent bg-gray-100 hover:border-gray-300 dark:bg-slate-700 dark:hover:border-gray-500'}`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={user.avatarUrl}
                          alt={user.name}
                          size="sm"
                        />
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {user.name}
                        </span>
                      </div>
                      {hasFinancialInvolvement && (
                        <div title="Cannot remove member involved in expenses">
                          <ICONS.LOCK className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {isMemberListScrollable && (
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent dark:from-gray-800"></div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="danger"
              onClick={() => setIsDeleteConfirmModalOpen(true)}
              isLoading={deleteGroupMutation.isPending}
            >
              Delete Group
            </Button>
            <Button
              onClick={handleSaveChanges}
              isLoading={editGroupMutation.isPending}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Link"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Share this link with anyone you want to invite to the group.
          </p>
          <Input
            value={inviteLink}
            readOnly
            className="bg-gray-100 dark:bg-gray-700"
          />
          <Button onClick={handleCopyInviteLink} className="w-full">
            Copy Link
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteConfirmModalOpen}
        onClose={() => setIsDeleteConfirmModalOpen(false)}
        title="Delete Group?"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete this group? All associated expenses
            will also be permanently removed. This action cannot be undone.
          </p>
          <div className="flex justify-end">
            <Button
              variant="danger"
              onClick={handleDeleteGroup}
              isLoading={deleteGroupMutation.isPending}
            >
              Delete Group
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GroupDetailScreen;
