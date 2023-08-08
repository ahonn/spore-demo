import {
  predefinedSporeConfigs,
  transferCluster as _transferCluster,
} from '@spore-sdk/core';
import { helpers } from '@ckb-lumos/lumos';
import { useCallback, useEffect } from 'react';
import { useMutation } from 'wagmi';
import { useQueryClient } from 'react-query';
import { useDisclosure, useId } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { Button, Group, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { isNotEmpty, useForm } from '@mantine/form';
import useWalletConnect from '../useWalletConnect';
import { sendTransaction } from '@/utils/transaction';
import { Cluster } from '@/utils/cluster';

export default function useTransferClusterModal(cluster: Cluster | undefined) {
  const modalId = useId();
  const [opened, { open, close }] = useDisclosure(false);
  const { address, signTransaction } = useWalletConnect();
  const queryClient = useQueryClient();

  const transferCluster = useCallback(
    async (...args: Parameters<typeof _transferCluster>) => {
      const { txSkeleton } = await _transferCluster(...args);
      const signedTx = await signTransaction(txSkeleton);
      const hash = await sendTransaction(signedTx);
      return hash;
    },
    [signTransaction],
  );

  const transferClusterMutation = useMutation(transferCluster, {
    onSuccess: () => {
      queryClient.invalidateQueries('clusters');
      queryClient.invalidateQueries(['cluster', cluster?.id]);
    },
  });
  const loading = transferClusterMutation.isLoading;

  const form = useForm({
    initialValues: {
      to: '',
    },
    validate: {
      to: isNotEmpty('address cannot be empty'),
    },
  });

  const handleSubmit = useCallback(
    async (values: { to: string }) => {
      if (!address || !values.to || !cluster) {
        return;
      }
      try {
        await transferClusterMutation.mutateAsync({
          outPoint: cluster.cell.outPoint!,
          fromInfos: [address],
          toLock: helpers.parseAddress(values.to),
          config: predefinedSporeConfigs.Aggron4,
        });
        notifications.show({
          color: 'green',
          title: 'Transaction successful!',
          message: `Your cluster has been transfer to ${values.to.slice(
            0,
            6,
          )}...${values.to.slice(-6)}.`,
        });
        close();
      } catch (e) {
        notifications.show({
          color: 'red',
          title: 'Error!',
          message: (e as Error).message,
        });
      }
    },
    [address, cluster, transferClusterMutation, close],
  );

  useEffect(() => {
    if (opened) {
      modals.open({
        modalId,
        title: 'Transfer cluster',
        onClose: close,
        closeOnEscape: !transferClusterMutation.isLoading,
        withCloseButton: !transferClusterMutation.isLoading,
        closeOnClickOutside: !transferClusterMutation.isLoading,
        children: (
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <TextInput
              withAsterisk
              label="Transfer to"
              {...form.getInputProps('to')}
            />

            <Group position="right" mt="md">
              <Button type="submit" loading={transferClusterMutation.isLoading}>
                Submit
              </Button>
            </Group>
          </form>
        ),
      });
    } else {
      modals.close(modalId);
    }
  }, [
    transferClusterMutation.isLoading,
    handleSubmit,
    opened,
    form,
    close,
    modalId,
  ]);

  return {
    open,
    close,
    loading,
  };
}
