import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../store/appStore';
import { dataService } from '../services/data/DataServiceFacade';
import { useToastContext } from '../context/ToastContext';
import Spinner from '../components/common/Spinner';
import Button from '../components/common/Button';
import { Group } from '../types';
import { ICONS } from '../constants';

const JoinGroupScreen: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const { currentUser } = useAppStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToastContext();

  const {
    data: inviteData,
    isLoading: isInviteLoading,
    error: inviteError,
  } = useQuery({
    queryKey: ['invite', inviteCode],
    queryFn: () => {
      if (!inviteCode) throw new Error('No invite code provided.');
      return dataService.getInvite(inviteCode);
    },
    enabled: !!inviteCode,
    retry: false,
  });

  const groupId = inviteData?.groupId;

  const {
    data: groupData,
    isLoading: isGroupLoading,
    error: groupError,
  } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => {
      if (!groupId) throw new Error('Invalid invite.');
      // A simplified fetch, we just need the group, not all its details
      return dataService.getGroupDetails(groupId);
    },
    enabled: !!groupId,
    retry: false,
  });

  const joinGroupMutation = useMutation({
    mutationFn: () => {
      if (!groupId || !currentUser) throw new Error('Missing data to join.');
      return dataService.addUserToGroup(groupId, currentUser.id);
    },
    onSuccess: () => {
      toast.success(`Successfully joined "${groupData?.group.name}"!`);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      navigate(`/group/${groupId}`);
    },
    onError: (error) => {
      toast.error(`Failed to join group: ${error.message}`);
    },
  });

  const isLoading = isInviteLoading || isGroupLoading;
  const error = inviteError || groupError;
  const group = groupData?.group;
  const isAlreadyMember = group?.members.includes(currentUser?.id || '');

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center">
          <Spinner size="w-12 h-12" />
          <p className="mt-4 text-gray-500">Validating invite...</p>
        </div>
      );
    }

    if (error || !group) {
      return (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">
            Invalid Invite
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            This invitation link is either invalid or has expired.
          </p>
          <Button onClick={() => navigate('/groups')} className="mt-6">
            Go to My Groups
          </Button>
        </div>
      );
    }

    return (
      <div className="w-full max-w-sm text-center">
        <p className="mb-2 text-gray-600 dark:text-gray-300">
          You've been invited to join
        </p>
        <div
          className="relative h-40 w-full overflow-hidden rounded-xl bg-gray-200 shadow-lg dark:bg-gray-700"
          key={group.id}
        >
          <img
            src={group.imageUrl}
            alt={group.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
          <h2 className="absolute bottom-4 left-4 text-2xl font-bold text-white">
            {group.name}
          </h2>
        </div>
        <div className="mt-6">
          {isAlreadyMember ? (
            <>
              <p className="text-green-600 dark:text-green-400">
                You are already a member of this group.
              </p>
              <Button
                onClick={() => navigate(`/group/${group.id}`)}
                className="mt-4 w-full"
                size="lg"
              >
                View Group
              </Button>
            </>
          ) : (
            <Button
              onClick={() => joinGroupMutation.mutate()}
              isLoading={joinGroupMutation.isPending}
              className="w-full"
              size="lg"
            >
              <ICONS.INVITE className="h-5 w-5" />
              Join Group
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col items-center justify-center bg-gray-50 p-4 dark:bg-gray-800">
      {renderContent()}
    </div>
  );
};

export default JoinGroupScreen;
