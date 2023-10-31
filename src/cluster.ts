import { BI, Cell, Indexer, RPC, Script } from '@ckb-lumos/lumos';
import {
  ClusterData,
  SporeConfig,
  getCellCapacityMargin,
  predefinedSporeConfigs,
} from '@spore-sdk/core';
import pick from 'lodash-es/pick';
import SporeService, { Spore } from './spore';

const hex2String = (hex: string) => {
  return Buffer.from(hex, 'hex').toString('utf-8');
};

export interface Cluster {
  id: string;
  name: string;
  description: string;
  cell: Pick<Cell, 'outPoint' | 'cellOutput'>;
  spores?: Spore[];
}

export interface QueryOptions {
  skip?: number;
  limit?: number;
  includeContent?: boolean;
}

export default class ClusterService {
  private config: SporeConfig;
  private indexer: Indexer;
  private rpc: RPC;

  constructor(config: SporeConfig) {
    this.config = config;
    this.indexer = new Indexer(this.config.ckbIndexerUrl);
    this.rpc = new RPC(this.config.ckbNodeUrl);
  }

  public static shared = new ClusterService(predefinedSporeConfigs['Aggron4']);

  private static getClusterFromCell(cell: Cell): Cluster {
    const unpacked = ClusterData.unpack(cell.data);
    const cluster = {
      id: cell.cellOutput.type!.args,
      name: hex2String(unpacked.name.slice(2)),
      description: hex2String(unpacked.description.slice(2)),
      cell: pick(cell, ['cellOutput', 'outPoint']),
    };
    return cluster;
  }

  private get script() {
    return this.config.scripts.Cluster.script;
  }

  public setConfig(config: SporeConfig) {
    this.config = config;
    this.indexer = new Indexer(this.config.ckbIndexerUrl);
    this.rpc = new RPC(this.config.ckbNodeUrl);
  }

  public async get(id: string): Promise<Cluster | undefined> {
    if (!id) {
      return undefined;
    }
    const collector = this.indexer.collector({
      type: { ...this.script, args: id },
    });

    for await (const cell of collector.collect()) {
      const cluster = ClusterService.getClusterFromCell(cell);
      return cluster;
    }

    return undefined;
  }

  public async getCapacityMargin(id: string) {
    const collector = this.indexer.collector({
      type: { ...this.script, args: id },
    });
    for await (const cell of collector.collect()) {
      return getCellCapacityMargin(cell);
    }
    return BI.from(0);
  }

  public async list(options?: QueryOptions) {
    const collector = this.indexer.collector({
      type: { ...this.script, args: '0x' },
      order: 'desc',
      skip: options?.skip,
    });

    const clusters: Cluster[] = [];
    let collected = 0;
    for await (const cell of collector.collect()) {
      collected += 1;
      const cluster = ClusterService.getClusterFromCell(cell);
      clusters.push(cluster);
      if (options?.limit && clusters.length === options.limit) {
        break;
      }
    }

    return {
      items: clusters,
      collected,
    };
  }

  public async listByLock(lock: Script, options?: QueryOptions) {
    const collector = this.indexer.collector({
      lock,
      type: { ...this.script, args: '0x' },
      order: 'desc',
      skip: options?.skip,
    });

    const clusters: Cluster[] = [];
    let collected = 0;
    for await (const cell of collector.collect()) {
      collected += 1;
      const cluster = ClusterService.getClusterFromCell(cell);
      clusters.push(cluster);

      if (options?.limit && clusters.length === options.limit) {
        break;
      }
    }

    return {
      items: clusters,
      collected,
    };
  }

  public async recent(limit: number) {
    const recentSpores = await SporeService.shared.recent(limit, true);
    const clusterIds = recentSpores.map((spore) => spore.clusterId) as string[];

    const getClusters = Promise.all(
      clusterIds.map(async (id) => {
        const cluster = this.get(id!);
        return cluster;
      }),
    );
    const getSpores = SporeService.shared.list(clusterIds);
    const [clusters, spores] = await Promise.all([getClusters, getSpores]);

    return clusters.map((cluster) => {
      const clusterSpores = spores.items.filter(
        (spore) => spore.clusterId === cluster!.id,
      );
      return {
        ...cluster,
        spores: clusterSpores,
      } as Cluster;
    });
  }
}
