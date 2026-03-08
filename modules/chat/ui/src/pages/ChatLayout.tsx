import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useChannels } from '../hooks/use-chat-queries';
import { useChatSocket } from '../hooks/use-chat-socket';
import { useChatStore } from '../hooks/use-chat-store';
import ChannelList from '../components/ChannelList';
import MessageArea from '../components/MessageArea';
import ThreadPanel from '../components/ThreadPanel';
import CreateChannelModal from '../components/CreateChannelModal';
import NewDmModal from '../components/NewDmModal';

// TODO: Get workspaceId from context/route — hardcoded for now
function useWorkspaceId() {
  // Try to get from auth store user context or URL
  return 'default';
}

export default function ChatLayout() {
  const workspaceId = useWorkspaceId();
  const [searchParams] = useSearchParams();
  const { data: channels, isLoading } = useChannels(workspaceId);
  const activeChannelId = useChatStore((s) => s.activeChannelId);
  const activeThreadId = useChatStore((s) => s.activeThreadId);
  const setActiveChannel = useChatStore((s) => s.setActiveChannel);
  const setActiveThread = useChatStore((s) => s.setActiveThread);
  const setChannels = useChatStore((s) => s.setChannels);

  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showNewDm, setShowNewDm] = useState(false);

  // Connect socket
  useChatSocket(workspaceId);

  // Sync channels to store
  useEffect(() => {
    if (channels) {
      setChannels(channels);
    }
  }, [channels, setChannels]);

  // Handle URL channel param
  useEffect(() => {
    const channelParam = searchParams.get('channel');
    if (channelParam && channels?.some((ch) => ch.id === channelParam)) {
      setActiveChannel(channelParam);
    }
  }, [searchParams, channels, setActiveChannel]);

  // Auto-select first channel if none active
  useEffect(() => {
    if (!activeChannelId && channels && channels.length > 0) {
      setActiveChannel(channels[0]!.id);
    }
  }, [activeChannelId, channels, setActiveChannel]);

  const activeChannel = useMemo(
    () => channels?.find((ch) => ch.id === activeChannelId),
    [channels, activeChannelId],
  );

  const handleChannelCreated = useCallback(
    (channelId: string) => {
      setActiveChannel(channelId);
    },
    [setActiveChannel],
  );

  const handleThreadClick = useCallback(
    (threadId: string) => {
      setActiveThread(threadId);
    },
    [setActiveThread],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <ChannelList
        channels={channels ?? []}
        onCreateChannel={() => setShowCreateChannel(true)}
        onCreateDm={() => setShowNewDm(true)}
        onSearch={() => {}}
      />

      {activeChannel ? (
        <MessageArea
          channel={activeChannel}
          onToggleThread={() => setActiveThread(activeThreadId ? null : null)}
          onThreadClick={handleThreadClick}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-text-secondary">
          <p className="text-sm">Select a channel to start chatting</p>
        </div>
      )}

      {activeThreadId && activeChannel && (
        <ThreadPanel
          threadId={activeThreadId}
          channelName={activeChannel.name}
          onClose={() => setActiveThread(null)}
        />
      )}

      {/* Modals */}
      {showCreateChannel && (
        <CreateChannelModal
          workspaceId={workspaceId}
          onClose={() => setShowCreateChannel(false)}
          onCreated={handleChannelCreated}
        />
      )}
      {showNewDm && (
        <NewDmModal
          workspaceId={workspaceId}
          onClose={() => setShowNewDm(false)}
          onCreated={handleChannelCreated}
        />
      )}
    </div>
  );
}
