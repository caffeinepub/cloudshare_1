import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Message } from "../backend.d";
import { useActor } from "./useActor";

export function useHasAssistantName() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["hasAssistantName"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.hasAssistantName();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAssistantName() {
  const { actor, isFetching } = useActor();
  return useQuery<string | null>({
    queryKey: ["assistantName"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAssistantName();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetAssistantName() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.setAssistantName(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hasAssistantName"] });
      queryClient.invalidateQueries({ queryKey: ["assistantName"] });
    },
  });
}

export function useGetMessages() {
  const { actor, isFetching } = useActor();
  return useQuery<Message[]>({
    queryKey: ["messages"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMessages();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.sendMessage(content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

export function useClearHistory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.clearHistory();
    },
    onSuccess: () => {
      queryClient.setQueryData(["messages"], []);
    },
  });
}
