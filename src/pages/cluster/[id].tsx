import Layout from '@/components/Layout';
import SporeGrid from '@/components/SporeGrid';
import useAddSporeModal from '@/hooks/modal/useAddSporeModal';
import useTransferClusterModal from '@/hooks/modal/useTransferClusterModal';
import { trpc } from '@/server';
import { helpers } from '@ckb-lumos/lumos';
import {
  Text,
  Flex,
  createStyles,
  Container,
  Grid,
  Image,
  Group,
  Button,
  useMantineTheme,
} from '@mantine/core';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const useStyles = createStyles((theme) => ({
  header: {
    height: '280px',
    overflowY: 'hidden',
    borderBottomWidth: '2px',
    borderBottomColor: theme.colors.text[0],
    borderBottomStyle: 'solid',
    backgroundImage: 'url(/images/noise-on-yellow.png)',
  },
  button: {
    color: theme.colors.text[0],
    backgroundColor: theme.colors.brand[0],
    borderWidth: '2px',
    borderColor: theme.colors.text[0],
    borderStyle: 'solid',
    boxShadow: 'none !important',

    '&:hover': {
      backgroundColor: theme.colors.text[0],
      color: theme.white,
    },
  },
}));

export default function ClusterPage() {
  const { classes } = useStyles();
  const router = useRouter();
  const { id } = router.query;
  const theme = useMantineTheme();

  const { data: cluster } =
    trpc.cluster.get.useQuery({ id } as { id: string });
  const { data: spores = [], isLoading: isSporesLoading } =
    trpc.spore.list.useQuery({ clusterId: id } as { clusterId: string });

  const addSporeModal = useAddSporeModal();
  const transferClusterModal = useTransferClusterModal(cluster);

  const owner = useMemo(() => {
    if (!cluster) return '';
    const address = helpers.encodeToAddress(cluster.cell.cellOutput.lock);
    return address;
  }, [cluster]);

  const isLoading = !cluster;

  return (
    <Layout>
      <Flex align="center" className={classes.header}>
        <Container w="100%" size="xl" mt="80px">
          <Grid>
            <Grid.Col span={8}>
              <Flex direction="column">
                <Flex align="center">
                  <Image
                    src="/svg/cluster-icon.svg"
                    alt="Cluster Icon"
                    width="24px"
                    height="24px"
                    mr="8px"
                  />
                  <Text size="xl" weight="bold" color="text.1">
                    Cluster
                  </Text>
                </Flex>
                <Flex mb="24px">
                  {isLoading ? (
                    <Skeleton
                      baseColor={theme.colors.background[0]}
                      height="32px"
                      width="300px"
                      borderRadius="16px"
                    />
                  ) : (
                    <Text size="32px" weight="bold">
                      {cluster?.name}
                    </Text>
                  )}
                </Flex>
                {isLoading ? (
                  <Skeleton
                    baseColor={theme.colors.background[0]}
                    height="20px"
                    width="500px"
                    borderRadius="16px"
                  />
                ) : (
                  <Text size="20px" color="text.1">
                    {cluster?.description}
                  </Text>
                )}
              </Flex>
            </Grid.Col>
            <Grid.Col span={4}>
              <Flex direction="column">
                <Text mb="8px" size="lg" weight="bold">
                  Owned by
                </Text>
                <Flex mb="24px">
                  {isLoading ? (
                    <Skeleton
                      baseColor={theme.colors.background[0]}
                      height="20px"
                      width="200px"
                      borderRadius="16px"
                    />
                  ) : (
                    <Link href={`/${owner}`} style={{ textDecoration: 'none' }}>
                      <Text size="lg" color="brand.1">
                        {owner.slice(0, 10)}...{owner.slice(-10)}
                      </Text>
                    </Link>
                  )}
                </Flex>
                <Group>
                  <Button
                    className={classes.button}
                    onClick={addSporeModal.open}
                  >
                    Mint Spore
                  </Button>
                  <Button
                    className={classes.button}
                    onClick={transferClusterModal.open}
                  >
                    Transfer Cluster
                  </Button>
                </Group>
              </Flex>
            </Grid.Col>
          </Grid>
        </Container>
      </Flex>
      <Container py="48px" size="xl">
        <SporeGrid
          title={`${spores.length} Spores`}
          spores={spores}
          cluster={cluster}
          isLoading={isSporesLoading}
        />
      </Container>
    </Layout>
  );
}
