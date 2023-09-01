import { Cluster } from '@/cluster';
import { Spore } from '@/spore';
import { BI } from '@ckb-lumos/lumos';
import {
  Text,
  AspectRatio,
  Card,
  Image,
  Flex,
  createStyles,
  Box,
  useMantineTheme,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconDotsVertical } from '@tabler/icons-react';
import Link from 'next/link';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import DropMenu from './DropMenu';
import useTransferSporeModal from '@/hooks/modal/useTransferSporeModal';
import useDestroySporeModal from '@/hooks/modal/useDestroySporeModal';
import { useConnect } from '@/hooks/useConnect';
import { useMemo } from 'react';
import { isSameScript } from '@/utils/script';
import ImageRender from './renders/image';

export interface SporeCardProps {
  cluster: Cluster | undefined;
  spore: Spore;
}

const useStyles = createStyles((theme) => ({
  card: {
    borderRadius: '8px',
    borderWidth: '1px',
    borderColor: theme.colors.text[0],
    borderStyle: 'solid',
    boxShadow: `4px 4px 0px 0px ${theme.colors.text[0]}`,
    backgroundImage: 'url(/images/noise-on-purple.png)',
    transition: 'border-radius 150ms ease',

    '&:hover': {
      borderRadius: '16px',
    },
  },
  skeleton: {
    height: '100%',
    width: '100%',
  },
  menu: {
    zIndex: 99,
    display: 'inline',
    position: 'absolute',
    bottom: '25px',
    right: '15px',
  },
}));

export function SporeSkeletonCard() {
  const { classes } = useStyles();
  const theme = useMantineTheme();

  return (
    <Card p={0} className={classes.card}>
      <Card.Section px="md" pt="md">
        <AspectRatio ratio={1} bg="#F4F5F9">
          <Skeleton
            className={classes.skeleton}
            baseColor={theme.colors.background[1]}
          />
        </AspectRatio>
      </Card.Section>
      <Box p="24px">
        <Flex direction="column">
          <Text color="rgba(255, 255, 255, 0.8)" size="sm" mb="8px">
            <Skeleton
              baseColor={theme.colors.background[1]}
              height="25px"
              borderRadius="16px"
            />
          </Text>
          <Text size="lg" color="white" weight="bold" mb="8px">
            <Skeleton
              baseColor={theme.colors.background[1]}
              height="25px"
              borderRadius="16px"
            />
          </Text>
          <Text size="md" color="white">
            <Skeleton
              baseColor={theme.colors.background[1]}
              height="25px"
              width="85px"
              borderRadius="16px"
            />
          </Text>
        </Flex>
      </Box>
    </Card>
  );
}

export default function SporeCard({ cluster, spore }: SporeCardProps) {
  const { classes } = useStyles();
  const [hovered, { close, open }] = useDisclosure(false);
  const { lock } = useConnect();

  const isOwner = useMemo(
    () => isSameScript(lock, spore.cell.cellOutput.lock),
    [spore, lock],
  );

  const transferSporeModal = useTransferSporeModal(spore);
  const destroySporeModal = useDestroySporeModal(spore);

  return (
    <Box
      sx={{ overflow: 'visible', position: 'relative' }}
      onMouseEnter={() => open()}
      onMouseLeave={() => close()}
    >
      <Link
        href={`/spore/${spore.id}`}
        style={{ textDecoration: 'none' }}
        passHref
      >
        <Card p={0} className={classes.card}>
          <Card.Section px="md" pt="md">
            <ImageRender spore={spore} />
          </Card.Section>
          <Box p="24px">
            <Flex direction="column">
              <Text color="rgba(255, 255, 255, 0.8)" size="sm" mb="8px">
                {cluster?.name ?? '<No Cluster>'}
              </Text>
              <Title color="white" order={5} mb="8px">
                {`${spore.id.slice(0, 10)}...${spore.id.slice(-10)}`}
              </Title>
              <Flex>
                <Text size="md" color="white">
                  {BI.from(spore.cell.cellOutput.capacity).toNumber() / 10 ** 8}{' '}
                  CKB
                </Text>
              </Flex>
            </Flex>
          </Box>
        </Card>
      </Link>
      {hovered && isOwner && (
        <Box className={classes.menu}>
          <Flex align="center" justify="flex-end">
            <DropMenu
              menu={[
                {
                  key: 'transfer-spore',
                  title: (
                    <Flex align="center">
                      <Image
                        src="/svg/icon-repeat.svg"
                        width="18"
                        height="18"
                        alt="transfer"
                        mr="8px"
                      />
                      <Text>Transfer</Text>
                    </Flex>
                  ),
                  onClick: (e) => {
                    e.preventDefault();
                    transferSporeModal.open();
                  },
                },
                {
                  key: 'destroy-spore',
                  title: (
                    <Flex align="center">
                      <Image
                        src="/svg/icon-trash.svg"
                        width="18"
                        height="18"
                        alt="transfer"
                        mr="8px"
                      />
                      <Text>Destory</Text>
                    </Flex>
                  ),
                  onClick: (e) => {
                    e.preventDefault();
                    destroySporeModal.open();
                  },
                },
              ]}
            >
              <Flex align="center" sx={{ cursor: 'pointer' }}>
                <IconDotsVertical size="20px" color="white" />
              </Flex>
            </DropMenu>
          </Flex>
        </Box>
      )}
    </Box>
  );
}
