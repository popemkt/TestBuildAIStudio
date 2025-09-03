import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../store/appStore';
import { useToastContext } from '../context/ToastContext';
import { dataService } from '../services/data/DataServiceFacade';
import { ICONS } from '../constants';
import { CURRENCIES, getCurrencySymbol } from '../constants/currencies';
import { Group, User } from '../types';
import { groupCreationSchema } from '../services/validationService';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Avatar from '../components/common/Avatar';
import Spinner from '../components/common/Spinner';

const GroupImageLoader: React.FC<{
  src: string;
  alt: string;
  className: string;
}> = ({ src, alt, className }) => {
  const [isLoading, setIsLoading] = useState(true);
  return (
    <div className="relative h-full w-full bg-gray-200 dark:bg-gray-700">
      {isLoading && (
        <div className="absolute inset-0 flex animate-pulse items-center justify-center">
          <Spinner />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
      />
    </div>
  );
};

const GroupsScreen: React.FC = () => {
  const { currentUser } = useAppStore();
  const toast = useToastContext();
  const queryClient = useQueryClient();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCurrency, setNewGroupCurrency] = useState('USD');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['dashboard', currentUser?.id],
    queryFn: () => dataService.getDashboardData(currentUser!.id),
    enabled: !!currentUser,
  });

  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => dataService.getAllUsers(),
    staleTime: 1000 * 60 * 5, // Cache users for 5 minutes
    enabled: !!currentUser,
  });

  const createGroupMutation = useMutation({
    mutationFn: (newGroupData: Omit<Group, 'id'>) =>
      dataService.addGroup(newGroupData),
    onSuccess: () => {
      toast.success('Group created!');
      queryClient.invalidateQueries({
        queryKey: ['dashboard', currentUser?.id],
      });
      setIsAddModalOpen(false);
      setNewGroupName('');
      setNewGroupCurrency('USD');
      if (currentUser) setSelectedMemberIds([currentUser.id]);
    },
    onError: (error) => {
      toast.error(`Failed to create group: ${error.message}`);
    },
  });

  useEffect(() => {
    if (currentUser) {
      setSelectedMemberIds([currentUser.id]);
    }
  }, [currentUser]);

  const getGroupBalance = (group: Group) => {
    const groupExpenses =
      dashboardData?.expenses.filter((e) => e.groupId === group.id) || [];
    let balance = 0;

    groupExpenses.forEach((expense) => {
      if (expense.paidBy === currentUser!.id) {
        balance += expense.amount;
      }
      const userShare = expense.participants.find(
        (p) => p.userId === currentUser!.id
      );
      if (userShare) {
        balance -= userShare.amount;
      }
    });

    const currencySymbol = getCurrencySymbol(group.masterCurrency);
    if (Math.abs(balance) < 0.01)
      return { text: 'Settled up', className: 'text-gray-300' };
    if (balance > 0)
      return {
        text: `You are owed ${currencySymbol}${balance.toFixed(2)}`,
        className: 'text-green-400',
      };
    return {
      text: `You owe ${currencySymbol}${Math.abs(balance).toFixed(2)}`,
      className: 'text-red-400',
    };
  };

  const handleMemberToggle = (userId: string) => {
    if (userId === currentUser?.id) return;
    setSelectedMemberIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateGroup = () => {
    const validationResult = groupCreationSchema.safeParse({
      name: newGroupName,
      currency: newGroupCurrency,
      memberIds: selectedMemberIds,
    });

    if (!validationResult.success) {
      toast.error(validationResult.error.issues[0].message);
      return;
    }

    const newGroupData: Omit<Group, 'id'> = {
      name: newGroupName.trim(),
      members: selectedMemberIds,
      imageUrl: `https://picsum.photos/seed/${newGroupName.trim().replace(/\s/g, '')}/400/200`,
      masterCurrency: newGroupCurrency,
    };
    createGroupMutation.mutate(newGroupData);
  };

  if (isLoadingDashboard) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <Spinner size="w-12 h-12" />
        <p className="mt-4 text-gray-500 dark:text-gray-400">
          Loading your groups...
        </p>
      </div>
    );
  }

  const allOtherUsers = allUsers?.filter((u) => u.id !== currentUser!.id) || [];

  return (
    <div>
      <header className="flex items-center justify-between p-4 md:pt-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          My Groups
        </h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-indigo-500 dark:text-gray-400 dark:hover:bg-gray-800"
          aria-label="Create new group"
        >
          <ICONS.ADD className="h-6 w-6" />
        </button>
      </header>
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
        {dashboardData?.groups.map((group) => {
          const balance = getGroupBalance(group);
          return (
            <Link
              to={`/group/${group.id}`}
              key={group.id}
              className="group relative block h-40 overflow-hidden rounded-xl shadow-md"
            >
              <div className="absolute inset-0">
                <GroupImageLoader
                  src={group.imageUrl}
                  alt={group.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/50 p-4 backdrop-blur-md dark:bg-black/60">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white drop-shadow-md">
                      {group.name}
                    </h3>
                    <p
                      className={`text-sm font-medium ${balance.className} drop-shadow-md`}
                    >
                      {balance.text}
                    </p>
                  </div>
                  <div className="flex items-center text-gray-200">
                    <ICONS.CHEVRON_RIGHT className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Group"
      >
        <div className="space-y-4">
          <Input
            label="Group Name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="e.g. Vacation, Apartment"
          />
          <div>
            <label
              htmlFor="group-currency"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Master Currency
            </label>
            <select
              id="group-currency"
              value={newGroupCurrency}
              onChange={(e) => setNewGroupCurrency(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Members
            </label>
            <div className="relative">
              <div className="no-scrollbar max-h-60 space-y-2 overflow-y-auto p-1">
                {[currentUser, ...allOtherUsers]
                  .filter((u): u is User => !!u)
                  .map((user) => {
                    const isSelected = selectedMemberIds.includes(user.id);
                    const isCurrentUser = user.id === currentUser?.id;
                    return (
                      <button
                        key={user.id}
                        onClick={() => handleMemberToggle(user.id)}
                        disabled={isCurrentUser}
                        className={`flex w-full items-center gap-3 rounded-lg border-2 p-2 text-left transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50' : 'border-transparent bg-gray-100 dark:bg-slate-800'} ${isCurrentUser ? 'cursor-not-allowed opacity-75' : 'hover:border-gray-300 dark:hover:border-gray-500'}`}
                      >
                        <Avatar
                          src={user.avatarUrl}
                          alt={user.name}
                          size="sm"
                        />
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {user.name}
                        </span>
                      </button>
                    );
                  })}
              </div>
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent dark:from-gray-800"></div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleCreateGroup}
              isLoading={createGroupMutation.isPending}
            >
              Create Group
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GroupsScreen;
