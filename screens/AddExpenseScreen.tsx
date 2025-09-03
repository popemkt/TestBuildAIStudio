import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../store/appStore';
import { useToastContext } from '../context/ToastContext';
import { dataService } from '../services/data/DataServiceFacade';
import {
  Expense,
  SplitType,
  TransactionType,
  SplitDetail,
  User,
  Group,
} from '../types';
import Button from '../components/common/Button';
import { getExchangeRate } from '../services/currencyService';
import { expenseFormSchema } from '../services/validationService';
import Spinner from '../components/common/Spinner';
import Modal from '../components/common/Modal';
import AIAssistant from '../components/expense/AIAssistant';
import SplitManager, {
  SplitType as SplitManagerSplitType,
} from '../components/expense/SplitManager';
import ExpenseForm from '../components/expense/ExpenseForm';
import AttachmentManager from '../components/expense/AttachmentManager';
import { ICONS } from '../constants';
import { CURRENCIES } from '../constants/currencies';

const AddExpenseScreen: React.FC = () => {
  const { currentUser } = useAppStore();
  const toast = useToastContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { groupId: defaultGroupId, expenseId } = useParams<{
    groupId?: string;
    expenseId?: string;
  }>();

  const isEditMode = !!expenseId;

  const { data: dashboardData, isLoading: isLoadingGroups } = useQuery({
    queryKey: ['dashboard', currentUser?.id],
    queryFn: () => dataService.getDashboardData(currentUser!.id),
    enabled: !!currentUser,
  });
  const groups = dashboardData?.groups || [];

  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => dataService.getAllUsers(),
    staleTime: 1000 * 60 * 5,
    enabled: !!currentUser,
  });

  const { data: existingExpense, isLoading: isExpenseLoading } = useQuery({
    queryKey: ['expense', expenseId],
    queryFn: () => dataService.getExpenseById(expenseId!),
    enabled: isEditMode && !!expenseId,
  });

  const [description, setDescription] = useState('');
  const [originalAmount, setOriginalAmount] = useState(0);
  const [originalCurrency, setOriginalCurrency] = useState('USD');
  const [amount, setAmount] = useState(0);
  const [conversionRate, setConversionRate] = useState<number | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [groupId, setGroupId] = useState(defaultGroupId || '');
  const [paidBy, setPaidBy] = useState(currentUser?.id || '');
  const [tags, setTags] = useState('');

  const [attachments, setAttachments] = useState<string[]>([]);
  const [newAttachments, setNewAttachments] = useState<string[]>([]);
  const [removedAttachments, setRemovedAttachments] = useState<string[]>([]);

  const [splitType, setSplitType] = useState<SplitManagerSplitType>(
    SplitType.EQUAL
  );
  const [participants, setParticipants] = useState<User[]>([]);
  const [participantSplits, setParticipantSplits] = useState<
    Record<string, number>
  >({});

  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] =
    useState(false);
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());

  const isFormDisabled = !groupId && !isEditMode;
  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === groupId),
    [groups, groupId]
  );

  const groupMembers = useMemo(() => {
    if (!selectedGroup || !allUsers) return [];
    const userMap = new Map(allUsers.map((u) => [u.id, u]));
    return selectedGroup.members
      .map((id) => userMap.get(id))
      .filter((u): u is User => !!u);
  }, [selectedGroup, allUsers]);

  const saveExpenseMutation = useMutation({
    mutationFn: ({
      expenseData,
      newAttachmentsData,
      removedAttachmentsData,
    }: {
      expenseData: any;
      newAttachmentsData: string[];
      removedAttachmentsData: string[];
    }) => {
      return isEditMode
        ? dataService.editExpense(
            expenseData,
            newAttachmentsData,
            removedAttachmentsData
          )
        : dataService.addExpense(expenseData, newAttachmentsData);
    },
    onSuccess: (data) => {
      toast.success(`Expense ${isEditMode ? 'updated' : 'added'}!`);
      queryClient.invalidateQueries({ queryKey: ['group', data.groupId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate(`/group/${data.groupId}`, { replace: true });
    },
    onError: (error) => toast.error(`Failed to save expense: ${error.message}`),
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => dataService.deleteExpense(id),
    onSuccess: () => {
      toast.success('Expense deleted.');
      queryClient.invalidateQueries({
        queryKey: ['group', existingExpense?.groupId],
      });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate(`/group/${existingExpense!.groupId}`, { replace: true });
    },
    onError: (error) =>
      toast.error(`Failed to delete expense: ${error.message}`),
  });

  useEffect(() => {
    if (selectedGroup && !isEditMode) {
      setOriginalCurrency(selectedGroup.masterCurrency);
    }
  }, [selectedGroup, isEditMode]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchRate = async () => {
      if (!selectedGroup || !originalAmount || originalAmount <= 0) {
        setAmount(originalAmount);
        setConversionRate(null);
        return;
      }
      if (originalCurrency === selectedGroup.masterCurrency) {
        setAmount(originalAmount);
        setConversionRate(null);
        return;
      }
      setIsConverting(true);
      try {
        const rate = await getExchangeRate(
          originalCurrency,
          selectedGroup.masterCurrency
        );
        if (!controller.signal.aborted) {
          if (rate !== null) {
            setConversionRate(rate);
            setAmount(originalAmount * rate);
          } else {
            toast.error(`Could not fetch rate for ${originalCurrency}.`);
            setAmount(originalAmount);
            setConversionRate(null);
          }
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          toast.error(`Could not fetch rate for ${originalCurrency}.`);
          setAmount(originalAmount);
          setConversionRate(null);
        }
      } finally {
        if (!controller.signal.aborted) setIsConverting(false);
      }
    };
    fetchRate();
    return () => controller.abort();
  }, [originalAmount, originalCurrency, selectedGroup, toast]);

  // This effect populates the main form fields as soon as the expense data is loaded.
  // It sets the `groupId`, which then allows `groupMembers` to be calculated.
  useEffect(() => {
    if (isEditMode && existingExpense) {
      setDescription(existingExpense.description);
      setOriginalAmount(existingExpense.originalAmount);
      setOriginalCurrency(existingExpense.originalCurrency);
      setAmount(existingExpense.amount);
      setConversionRate(existingExpense.conversionRate);
      setGroupId(existingExpense.groupId);
      setPaidBy(existingExpense.paidBy);
      setTags(existingExpense.tags.join(', '));
      setSplitType(existingExpense.splitType as SplitManagerSplitType);
      setAttachments(existingExpense.attachments || []);
      setDate(new Date(existingExpense.date).toISOString().split('T')[0]);
    }
  }, [isEditMode, existingExpense]);

  // This second effect populates the participant-specific fields.
  // It depends on `groupMembers`, which will be available after the first effect runs
  // and the necessary data (groups, users) has been fetched by React Query.
  useEffect(() => {
    if (isEditMode && existingExpense && groupMembers.length > 0) {
      const memberMap = new Map(groupMembers.map((m) => [m.id, m]));
      const expenseParticipants = existingExpense.participants
        .map((p) => memberMap.get(p.userId))
        .filter((user): user is User => !!user);
      setParticipants(expenseParticipants);

      if (existingExpense.splitType !== SplitType.EQUAL) {
        const splits = existingExpense.participants.reduce(
          (acc, p) => {
            acc[p.userId] =
              existingExpense.splitType === SplitType.PARTS
                ? (p.parts ?? 1)
                : p.amount;
            return acc;
          },
          {} as Record<string, number>
        );
        setParticipantSplits(splits);
      }
    } else if (
      !isEditMode &&
      groupMembers.length > 0 &&
      splitType === 'EQUAL'
    ) {
      // This part handles auto-selecting all members when creating a new expense in a group.
      setParticipants(groupMembers);
    }
  }, [isEditMode, existingExpense, groupMembers, splitType]);

  const handleAttachmentsChange = (newAttachmentList: string[]) => {
    const removed = attachments.filter(
      (att) => !newAttachmentList.includes(att)
    );
    const added = newAttachmentList.filter((att) => !attachments.includes(att));
    setAttachments(newAttachmentList);
    setNewAttachments((prev) => [...prev, ...added]);
    setRemovedAttachments((prev) => [...prev, ...removed]);
  };

  const handleAiResult = (result: any, image?: { dataUrl: string }) => {
    if (!result) {
      toast.error('Could not extract details.');
      return;
    }
    if (image?.dataUrl && !attachments.includes(image.dataUrl)) {
      handleAttachmentsChange([...attachments, image.dataUrl]);
    }

    const updatedFields = new Set<string>();

    if (result.description) {
      setDescription(result.description);
      updatedFields.add('description');
    }
    if (result.amount) {
      setOriginalAmount(result.amount);
      updatedFields.add('amount');
    }
    if (result.currency) {
      const isValidCurrency = CURRENCIES.some((c) => c.code === result.currency);
      if (isValidCurrency) {
        setOriginalCurrency(result.currency);
      } else {
        toast.warning(`AI suggested an unsupported currency: ${result.currency}`);
      }
    }
    if (result.date && /^\d{4}-\d{2}-\d{2}$/.test(result.date)) {
      setDate(result.date);
      updatedFields.add('date');
    }
    if (result.category) {
      setTags(result.category);
      updatedFields.add('tags');
    }

    const findUserByName = (name: string): User | undefined => {
      const lowerCaseName = name.toLowerCase();
      if (
        lowerCaseName === 'you' ||
        lowerCaseName === currentUser?.name.toLowerCase()
      ) {
        return currentUser as User;
      }
      return groupMembers.find((m) => m.name.toLowerCase() === lowerCaseName);
    };

    if (result.paidBy) {
      const payer = findUserByName(result.paidBy);
      if (payer) {
        setPaidBy(payer.id);
        updatedFields.add('paidBy');
      }
    }

    if (result.split && Array.isArray(result.split.participants)) {
      const splitTypeMap: Record<string, SplitManagerSplitType> = {
        EQUAL: SplitType.EQUAL,
        EXACT: SplitType.EXACT,
        PARTS: SplitType.PARTS,
      };
      const newSplitType = splitTypeMap[result.split.type];

      if (newSplitType) {
        setSplitType(newSplitType);
        updatedFields.add('split');

        const validParticipants: User[] = [];
        const newSplits: Record<string, number> = {};

        for (const p of result.split.participants) {
          const user = findUserByName(p.name);
          if (user) {
            validParticipants.push(user);
            if (newSplitType === SplitType.EXACT && typeof p.amount === 'number') {
              newSplits[user.id] = p.amount;
            } else if (newSplitType === SplitType.PARTS && typeof p.parts === 'number') {
              newSplits[user.id] = p.parts;
            }
          }
        }

        if (newSplitType === SplitType.EQUAL && validParticipants.length > 0) {
          setParticipants(validParticipants);
          setParticipantSplits({});
        } else {
          setParticipants(validParticipants);
          setParticipantSplits(newSplits);
        }
      }
    }

    setAiFilledFields(updatedFields);
    setTimeout(() => setAiFilledFields(new Set()), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) {
      toast.error('Please select a group.');
      return;
    }
    const validationResult = expenseFormSchema.safeParse({
      description,
      originalAmount,
      originalCurrency,
      date,
      groupId,
      participants: participants.map((p) => p.id),
      tags,
    });
    if (!validationResult.success) {
      toast.error(validationResult.error.issues[0].message);
      return;
    }

    let finalParticipants: SplitDetail[] = [];
    let isValid = true;
    switch (splitType) {
      case 'EQUAL':
        if (participants.length === 0) {
          isValid = false;
          toast.error('Please select at least one participant.');
          break;
        }
        finalParticipants = participants.map((user) => ({
          userId: user.id,
          amount: amount / participants.length,
        }));
        break;
      case 'EXACT':
        const total = Object.values(participantSplits).reduce(
          (sum, val) => sum + val,
          0
        );
        if (Math.abs(amount - total) > 0.01) {
          isValid = false;
          toast.error(
            `Split amounts (${total.toFixed(2)}) do not add up to total (${amount.toFixed(2)}).`
          );
          break;
        }
        finalParticipants = Object.entries(participantSplits)
          .filter(([, v]) => v > 0)
          .map(([uid, v]) => ({ userId: uid, amount: v }));
        break;
      case 'PARTS':
        const totalParts = Object.values(participantSplits).reduce(
          (sum, val) => sum + val,
          0
        );
        if (totalParts === 0) {
          isValid = false;
          toast.error('Please assign parts to at least one participant.');
          break;
        }
        finalParticipants = Object.entries(participantSplits)
          .filter(([, v]) => v > 0)
          .map(([uid, p]) => ({
            userId: uid,
            amount: (p / totalParts) * amount,
            parts: p,
          }));
        break;
    }
    if (!isValid) return;

    const expenseData = {
      description,
      amount,
      originalAmount,
      originalCurrency,
      conversionRate,
      paidBy,
      participants: finalParticipants,
      splitType: splitType as SplitType,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      transactionType: TransactionType.EXPENSE,
      groupId,
      date: new Date(date).toISOString(),
    };

    const newBase64Attachments = newAttachments.filter((a) =>
      a.startsWith('data:')
    );
    const finalRemovedAttachments = removedAttachments.filter((a) =>
      a.startsWith('https://')
    );

    const mutationData =
      isEditMode && existingExpense
        ? { ...existingExpense, ...expenseData, attachments }
        : expenseData;

    saveExpenseMutation.mutate({
      expenseData: mutationData,
      newAttachmentsData: newBase64Attachments,
      removedAttachmentsData: finalRemovedAttachments,
    });
  };

  const handleDelete = () => {
    if (isEditMode && existingExpense)
      deleteExpenseMutation.mutate(existingExpense.id);
  };

  if (isExpenseLoading) {
    return (
      <div className="p-4 text-center">
        <Spinner />
      </div>
    );
  }
  if (isEditMode && !existingExpense) {
    return <div className="p-4 text-center">Expense not found.</div>;
  }
  const isSubmitting =
    saveExpenseMutation.isPending || deleteExpenseMutation.isPending;

  return (
    <div className="relative">
      <button
        onClick={() => navigate(-1)}
        className="absolute left-4 top-4 z-10 rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-indigo-500 dark:hover:bg-gray-800 md:hidden"
        aria-label="Go back"
      >
        <ICONS.BACK className="h-6 w-6" />
      </button>
      <div className="space-y-6 p-4 md:pt-6">
        <h1 className="text-center text-xl font-semibold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Expense' : 'Add Expense'}
        </h1>
        <AIAssistant
          groupMembers={groupMembers}
          onResult={handleAiResult}
          disabled={isFormDisabled}
        />
        {isFormDisabled && (
          <p className="mt-2 px-4 text-center text-sm text-gray-500">
            Please select a group to enable.
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Group
              </label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                required
                disabled={isEditMode}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 disabled:opacity-75 sm:text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100 dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
              >
                <option value="" disabled>
                  Select a group
                </option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Paid By
              </label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                disabled={isFormDisabled}
                className={`w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100 ${aiFilledFields.has('paidBy') ? 'ai-highlight' : ''}`}
              >
                {groupMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div
            className={`grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 ${isFormDisabled ? 'opacity-50' : ''}`}
          >
            {/* Left Column */}
            <div className="space-y-4">
              <ExpenseForm
                description={description}
                onDescriptionChange={setDescription}
                amount={originalAmount}
                onAmountChange={setOriginalAmount}
                currency={originalCurrency}
                onCurrencyChange={setOriginalCurrency}
                date={date}
                onDateChange={setDate}
                disabled={isConverting || isFormDisabled || isSubmitting}
                isConverting={isConverting}
                conversionRate={conversionRate}
                convertedAmount={amount}
                masterCurrency={selectedGroup?.masterCurrency}
                aiFilledFields={aiFilledFields}
              />
              <AttachmentManager
                attachments={attachments}
                onAttachmentsChange={handleAttachmentsChange}
                disabled={isFormDisabled || isSubmitting}
              />
            </div>
            {/* Right Column */}
            <div className="space-y-4">
              {selectedGroup && (
                <div
                  className={`${aiFilledFields.has('split') ? 'ai-highlight' : ''}`}
                >
                  <SplitManager
                    splitType={splitType}
                    onSplitTypeChange={(newType) => {
                      setSplitType(newType);
                      setParticipantSplits({});
                      if (newType === 'EQUAL') setParticipants(groupMembers);
                      else setParticipants([]);
                    }}
                    participants={participants}
                    participantSplits={participantSplits}
                    onParticipantSplitsChange={setParticipantSplits}
                    amount={amount}
                    currency={selectedGroup.masterCurrency}
                    groupMembers={groupMembers}
                    onParticipantsChange={setParticipants}
                    disabled={isConverting || isFormDisabled || isSubmitting}
                  />
                </div>
              )}
              <div
                className={`${aiFilledFields.has('tags') ? 'ai-highlight' : ''}`}
              >
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. food, travel"
                  disabled={isFormDisabled || isSubmitting}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100"
                />
              </div>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isSubmitting || isConverting}
            disabled={isFormDisabled || isSubmitting}
          >
            {isEditMode ? 'Save Changes' : 'Add Expense'}
          </Button>
          {isEditMode && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmModalOpen(true)}
                className="text-sm font-medium text-red-600 hover:underline dark:text-red-400"
              >
                Delete Expense
              </button>
            </div>
          )}
        </form>
        <Modal
          isOpen={isDeleteConfirmModalOpen}
          onClose={() => setIsDeleteConfirmModalOpen(false)}
          title="Confirm Deletion"
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setIsDeleteConfirmModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                isLoading={isSubmitting}
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default AddExpenseScreen;