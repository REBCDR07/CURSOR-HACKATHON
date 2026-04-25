import NetInfo, { type NetInfoSubscription } from '@react-native-community/netinfo';

export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return !!state.isConnected;
}

export function onNetworkChange(listener: (online: boolean) => void): NetInfoSubscription {
  return NetInfo.addEventListener((state) => {
    listener(!!state.isConnected);
  });
}
